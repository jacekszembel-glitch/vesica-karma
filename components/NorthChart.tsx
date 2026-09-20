"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GRAHAS, RASIS, BHAVAS, PLANET_ORDER } from "@/lib/astro/constants";
import { formatDMS } from "@/lib/astro/math";
import type { VedicChart, ChartPlanet } from "@/lib/astro/chart";
import OpisDomuPanel from "@/components/OpisDomuPanel";

/**
 * Kosmogram północnoindyjski — poprawna geometria:
 * kwadrat + dwie przekątne + romb łączący środki boków.
 * Dom 1 to górny romb; domy idą przeciwnie do wskazówek zegara.
 * Najechanie / tapnięcie na pole → podpowiedź z opisem domu, znaku i planet.
 */

const S = 480;      // bok diagramu
const M = 14;       // margines ramki
const Q = S / 4;    // ćwiartka
const E = S - M;    // prawa/dolna krawędź

type Cell = {
  cx: number; cy: number;      // środek pola planet
  sx: number; sy: number;      // pozycja numeru znaku (przy wewnętrznym wierzchołku)
  tight: boolean;              // trójkąt = mniej miejsca
  poly: string;                // obszar aktywny (hover)
};

const CELLS: Cell[] = [
  { cx: 2 * Q, cy: 1.05 * Q, sx: 2 * Q, sy: 2 * Q - 20, tight: false,
    poly: `${2 * Q},${M} ${3 * Q},${Q} ${2 * Q},${2 * Q} ${Q},${Q}` },                 // 1 — romb górny
  { cx: 1 * Q, cy: 0.45 * Q, sx: 1 * Q, sy: 1 * Q - 18, tight: true,
    poly: `${M},${M} ${2 * Q},${M} ${Q},${Q}` },                                       // 2 — trójkąt górny-lewy
  { cx: 0.45 * Q, cy: 1 * Q, sx: 1 * Q - 20, sy: 1 * Q, tight: true,
    poly: `${M},${M} ${Q},${Q} ${M},${2 * Q}` },                                       // 3 — trójkąt lewy-górny
  { cx: 0.95 * Q, cy: 2 * Q, sx: 2 * Q - 22, sy: 2 * Q, tight: false,
    poly: `${M},${2 * Q} ${Q},${Q} ${2 * Q},${2 * Q} ${Q},${3 * Q}` },                 // 4 — romb lewy
  { cx: 0.45 * Q, cy: 3 * Q, sx: 1 * Q - 20, sy: 3 * Q, tight: true,
    poly: `${M},${2 * Q} ${Q},${3 * Q} ${M},${E}` },                                   // 5 — trójkąt lewy-dolny
  { cx: 1 * Q, cy: 3.55 * Q, sx: 1 * Q, sy: 3 * Q + 20, tight: true,
    poly: `${M},${E} ${Q},${3 * Q} ${2 * Q},${E}` },                                   // 6 — trójkąt dolny-lewy
  { cx: 2 * Q, cy: 2.95 * Q, sx: 2 * Q, sy: 2 * Q + 22, tight: false,
    poly: `${2 * Q},${E} ${Q},${3 * Q} ${2 * Q},${2 * Q} ${3 * Q},${3 * Q}` },         // 7 — romb dolny
  { cx: 3 * Q, cy: 3.55 * Q, sx: 3 * Q, sy: 3 * Q + 20, tight: true,
    poly: `${2 * Q},${E} ${3 * Q},${3 * Q} ${E},${E}` },                               // 8 — trójkąt dolny-prawy
  { cx: 3.55 * Q, cy: 3 * Q, sx: 3 * Q + 20, sy: 3 * Q, tight: true,
    poly: `${E},${E} ${3 * Q},${3 * Q} ${E},${2 * Q}` },                               // 9 — trójkąt prawy-dolny
  { cx: 3.05 * Q, cy: 2 * Q, sx: 2 * Q + 22, sy: 2 * Q, tight: false,
    poly: `${E},${2 * Q} ${3 * Q},${3 * Q} ${2 * Q},${2 * Q} ${3 * Q},${Q}` },         // 10 — romb prawy
  { cx: 3.55 * Q, cy: 1 * Q, sx: 3 * Q + 20, sy: 1 * Q, tight: true,
    poly: `${E},${2 * Q} ${3 * Q},${Q} ${E},${M}` },                                   // 11 — trójkąt prawy-górny
  { cx: 3 * Q, cy: 0.45 * Q, sx: 3 * Q, sy: 1 * Q - 18, tight: true,
    poly: `${E},${M} ${2 * Q},${M} ${3 * Q},${Q}` },                                   // 12 — trójkąt górny-prawy
];

const DIGNITY_BADGE: Record<string, string> = {
  egzaltacja: "↑ egzaltacja", władanie: "we władaniu", upadek: "↓ upadek",
};

/** Szerokość dymka i margines od krawędzi okna — do przycinania pozycji. */
const TIP_W = 250;
const TIP_MARGIN = 12;

export default function NorthChart({ chart, compareChart }: { chart: VedicChart; compareChart?: VedicChart }) {
  const [hover, setHover] = useState<number | null>(null);
  // Klik PRZYPINA pole na złoto i otwiera pełny opis POD wykresem (OpisDomuPanel,
  // zwykły element w przepływie strony — przewija się z nią normalnie).
  // Świadomie NIE steruje pływającym dymkiem (position:fixed, portal do <body>):
  // dymek liczy swoją pozycję raz, przy zmianie stanu, i NIE nadąża za scrollem
  // strony — gdyby został otwarty przez klik (czyli mógł żyć długo, przez
  // przewijanie), "odklejałby się" od wykresu. Dymek zostaje więc czysto
  // hover-owy, jak było; wybrany działa tylko na podświetlenie i panel niżej.
  const [wybrany, setWybrany] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tipPos, setTipPos] = useState<{ left: number; top: number; below: boolean } | null>(null);

  // pozycja dymka liczona w pikselach okna (nie % karty) — dymek renderuje się
  // portalem do <body>, więc żadna kolejna sekcja na stronie nie może go już przykryć.
  useEffect(() => {
    if (hover === null || !wrapRef.current) { setTipPos(null); return; }
    const rect = wrapRef.current.getBoundingClientRect();
    const cell = CELLS[hover];
    let left = rect.left + (cell.cx / S) * rect.width;
    left = Math.max(TIP_MARGIN + TIP_W / 2, Math.min(left, window.innerWidth - TIP_MARGIN - TIP_W / 2));
    setTipPos({
      left,
      top: rect.top + (cell.cy / S) * rect.height,
      below: cell.cy < S * 0.38,
    });
  }, [hover]);

  if (!chart.angles) return null;
  const lagnaSign = chart.angles.lagnaSign;

  const byHouse: Record<number, ChartPlanet[]> = {};
  for (const id of PLANET_ORDER) {
    const p = chart.planets[id];
    (byHouse[p.house] ??= []).push(p);
  }

  const hoveredCell = hover !== null ? CELLS[hover] : null;
  const hoveredSign = hover !== null ? (lagnaSign + hover) % 12 : 0;
  const hoveredPlanets = hover !== null ? byHouse[hover + 1] ?? [] : [];

  return (
    <div style={{ position: "relative", maxWidth: 520, margin: "0 auto" }}>
      {/* wrapRef obejmuje TYLKO svg — pozycja dymka liczy się proporcjonalnie
          do jego wysokości; gdyby objął też OpisDomuPanel niżej (setki px),
          przeliczenie cy/S skalowałoby się względem złej, dużo większej wysokości. */}
      <div ref={wrapRef} style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", display: "block" }}
        role="img" aria-label="Kosmogram wedyjski — diagram północnoindyjski"
        onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="nc-gold" x1="0" y1="0" x2={S} y2={S} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#e6c48a" />
            <stop offset="0.5" stopColor="#e6c48a" />
            <stop offset="1" stopColor="#c39a3b" />
          </linearGradient>
          <radialGradient id="nc-bg" cx="0.5" cy="0.42" r="0.75">
            <stop offset="0" stopColor="#0d1b2a" />
            <stop offset="1" stopColor="#162e3d" />
          </radialGradient>
          <radialGradient id="nc-lagna" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="rgba(230,196,138,0.14)" />
            <stop offset="1" stopColor="rgba(230,196,138,0)" />
          </radialGradient>
          <filter id="nc-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* tło + podwójna ramka */}
        <rect x={M - 8} y={M - 8} width={S - 2 * M + 16} height={S - 2 * M + 16} rx="10"
          fill="url(#nc-bg)" stroke="url(#nc-gold)" strokeWidth="1.8" />
        <rect x={M} y={M} width={S - 2 * M} height={S - 2 * M} rx="4"
          fill="none" stroke="url(#nc-gold)" strokeWidth="0.9" opacity="0.8" />

        {/* wyróżnienie lagny */}
        <polygon points={CELLS[0].poly} fill="url(#nc-lagna)" />

        {/* przypięte pole (klik) — zostaje złote, nawet gdy mysz zjedzie gdzie indziej */}
        {wybrany !== null && (
          <polygon points={CELLS[wybrany].poly} fill="rgba(230,196,138,0.14)"
            stroke="rgba(230,196,138,0.75)" strokeWidth="1.4" />
        )}
        {/* podświetlenie komórki pod kursorem (tymczasowe, na najechanie) */}
        {hover !== null && (
          <polygon points={CELLS[hover].poly} fill="rgba(17,167,182,0.12)"
            stroke="rgba(127,208,216,0.6)" strokeWidth="1" />
        )}

        {/* linie diagramu */}
        <g stroke="url(#nc-gold)" strokeWidth="1.1" filter="url(#nc-glow)" pointerEvents="none">
          <line x1={M} y1={M} x2={E} y2={E} />
          <line x1={E} y1={M} x2={M} y2={E} />
          <polygon points={`${2 * Q},${M} ${E},${2 * Q} ${2 * Q},${E} ${M},${2 * Q}`} fill="none" />
        </g>

        {/* punkty przecięć */}
        {[[Q, Q], [3 * Q, Q], [Q, 3 * Q], [3 * Q, 3 * Q]].map(([px, py], i) => (
          <circle key={i} cx={px} cy={py} r="2.4" fill="#0d1b2a" stroke="url(#nc-gold)" strokeWidth="1" pointerEvents="none" />
        ))}
        {/* lotos w centrum */}
        <g transform={`translate(${2 * Q}, ${2 * Q})`} pointerEvents="none">
          <circle r="3.2" fill="#0d1b2a" stroke="url(#nc-gold)" strokeWidth="1" />
          {Array.from({ length: 8 }, (_, i) => (
            <ellipse key={i} rx="1.6" ry="5.5" fill="none" stroke="url(#nc-gold)" strokeWidth="0.7"
              opacity="0.85" transform={`rotate(${i * 45})`} />
          ))}
        </g>

        {/* zawartość komórek */}
        {CELLS.map((cell, i) => {
          const sign = (lagnaSign + i) % 12;
          const planets = byHouse[i + 1] ?? [];
          const perRow = cell.tight ? 2 : 3;
          const fontSize = cell.tight ? 15 : 18;
          const rowH = cell.tight ? 17 : 21;
          const rows: ChartPlanet[][] = [];
          for (let r = 0; r < planets.length; r += perRow) rows.push(planets.slice(r, r + perRow));
          const startY = cell.cy - ((rows.length - 1) * rowH) / 2;

          return (
            <g key={i} pointerEvents="none">
              {/* numer znaku — powiększony, z delikatną kosmiczną poświatą */}
              <text x={cell.sx} y={cell.sy} textAnchor="middle" dominantBaseline="middle"
                fill={hover === i ? "#7fd0d8" : "#b9c7d1"} fontSize="16"
                fontFamily="var(--font-serif)" fontStyle="italic"
                filter="url(#nc-glow)" opacity={hover === i ? 1 : 0.92}>
                {sign + 1}
              </text>
              {rows.map((row, ri) =>
                row.map((p, pi) => {
                  const g = GRAHAS[p.id];
                  const px = cell.cx + (pi - (row.length - 1) / 2) * (fontSize + 8);
                  const py = startY + ri * rowH;
                  const retro = p.retrograde && p.id !== "rahu" && p.id !== "ketu";
                  return (
                    <g key={p.id}>
                      <text x={px} y={py} textAnchor="middle" dominantBaseline="middle"
                        fill={g.color} fontSize={fontSize} filter="url(#nc-glow)">
                        {g.symbol}
                      </text>
                      {retro && (
                        <text x={px + fontSize * 0.55} y={py - fontSize * 0.4}
                          textAnchor="middle" fill={g.color} fontSize="8" opacity="0.9">℞</text>
                      )}
                    </g>
                  );
                }),
              )}
            </g>
          );
        })}

        {/* etykieta lagny */}
        <text x={2 * Q} y={M + 26} textAnchor="middle" fill="var(--sand)" fontSize="10.5"
          letterSpacing="2.5" fontFamily="var(--font-sans)" fontWeight="600" pointerEvents="none">
          LAGNA · {RASIS[lagnaSign].pl.toUpperCase()}
        </text>

        {/* obszary aktywne — na wierzchu, przezroczyste */}
        {CELLS.map((cell, i) => (
          <polygon key={`hit-${i}`} points={cell.poly} fill="transparent"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHover(i)}
            onClick={() => setWybrany(wybrany === i ? null : i)}
          />
        ))}
      </svg>
      </div>

      {/* dymek z informacją — portal do <body>, żeby żadna kolejna sekcja go nie przykryła.
          Tylko na hover — patrz komentarz przy stanie `wybrany` wyżej. */}
      {hover !== null && hoveredCell && tipPos && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed",
          left: tipPos.left,
          top: tipPos.top,
          // pozycjonowanie na osobnym elemencie — animacja fadeUp niżej animuje `transform`
          // na WŁASNYM elemencie, więc gdyby był tu, nadpisywałaby to wyśrodkowanie/odwrócenie
          transform: `translate(-50%, ${tipPos.below ? "14px" : "calc(-100% - 14px)"})`,
          zIndex: 9999,
          width: TIP_W,
          pointerEvents: "none",
        }}>
        <div style={{
          background: "rgba(16, 34, 49, 0.98)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: "14px 16px",
          boxShadow: "0 16px 40px rgba(0,0,0,0.55), 0 0 22px -10px rgba(230,196,138,0.35)",
          animation: "fadeUp 0.2s var(--ease-out) both",
          color: "#e8eef2",
        }}>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", color: "var(--sand)", marginBottom: 3 }}>
            {BHAVAS[hover].pl}{" "}
            <span style={{ fontSize: "0.78rem", color: "#8ba0b0" }}>({BHAVAS[hover].sanskrit})</span>
          </p>
          <p style={{ fontSize: "0.84rem", lineHeight: 1.55, marginBottom: 10, color: "#b9c7d1" }}>
            {BHAVAS[hover].obszar}
          </p>
          <p style={{ fontSize: "0.88rem", marginBottom: hoveredPlanets.length ? 9 : 0, color: "#e8eef2" }}>
            <span style={{ color: "var(--teal-soft)" }}>{RASIS[hoveredSign].symbol}</span>{" "}
            <strong style={{ color: "#f2f5f7" }}>{RASIS[hoveredSign].pl}</strong>{" "}
            <span style={{ color: "#8ba0b0", fontSize: "0.8rem" }}>({RASIS[hoveredSign].sanskrit})</span>
            <br />
            <span style={{ fontSize: "0.8rem", color: "#b9c7d1" }}>
              władca: {GRAHAS[RASIS[hoveredSign].lord].symbol} {GRAHAS[RASIS[hoveredSign].lord].pl}
              {" · "}{RASIS[hoveredSign].element}
            </span>
          </p>
          {hoveredPlanets.length > 0 && (
            <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 8, display: "grid", gap: 3 }}>
              {hoveredPlanets.map((p) => (
                <p key={p.id} style={{ fontSize: "0.82rem" }}>
                  <span style={{ color: GRAHAS[p.id].color }}>{GRAHAS[p.id].symbol}</span>{" "}
                  {GRAHAS[p.id].pl} {formatDMS(p.degreeInSign)}
                  {p.retrograde && p.id !== "rahu" && p.id !== "ketu" && (
                    <span className="muted"> · retro</span>
                  )}
                  {DIGNITY_BADGE[p.dignity] && (
                    <span style={{ color: p.dignity === "upadek" ? "var(--warn)" : "var(--success)", fontSize: "0.75rem" }}>
                      {" "}· {DIGNITY_BADGE[p.dignity]}
                    </span>
                  )}
                </p>
              ))}
            </div>
          )}
        </div>
        </div>,
        document.body,
      )}

      <p className="muted" style={{ textAlign: "center", fontSize: "0.78rem", marginTop: 10 }}>
        Najedź, aby zobaczyć skrót. Kliknij pole, żeby przypiąć i zobaczyć pełny opis niżej.
      </p>

      {wybrany !== null && (
        <OpisDomuPanel chart={chart} house={wybrany + 1} onZamknij={() => setWybrany(null)} compareChart={compareChart} />
      )}
    </div>
  );
}
