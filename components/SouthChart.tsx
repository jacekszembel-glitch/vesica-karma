"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GRAHAS, RASIS, BHAVAS, PLANET_ORDER } from "@/lib/astro/constants";
import { formatDMS } from "@/lib/astro/math";
import type { VedicChart, ChartPlanet } from "@/lib/astro/chart";
import OpisDomuPanel from "@/components/OpisDomuPanel";

/**
 * Kosmogram południowoindyjski — stała siatka 4×4 (środek 2×2 pusty).
 * W przeciwieństwie do wykresu północnoindyjskiego znaki NIE obracają się
 * wraz z lagną — Baran zawsze stoi w tym samym polu. Lagnę zaznacza się
 * osobnym znacznikiem "ASC" w polu jej znaku, a numer domu liczy się
 * od tego pola dalej w kolejności znaków.
 */

const S = 480;
const M = 14;
const C = (S - 2 * M) / 4; // bok pojedynczej komórki

/** Pozycja (wiersz, kolumna) każdego znaku w stałej siatce — Baran zaczyna u góry, tuż za lewym górnym rogiem, i idzie zgodnie z ruchem wskazówek zegara. */
const SIGN_CELL: { row: number; col: number }[] = [
  { row: 0, col: 1 }, // 0 Baran
  { row: 0, col: 2 }, // 1 Byk
  { row: 0, col: 3 }, // 2 Bliźnięta
  { row: 1, col: 3 }, // 3 Rak
  { row: 2, col: 3 }, // 4 Lew
  { row: 3, col: 3 }, // 5 Panna
  { row: 3, col: 2 }, // 6 Waga
  { row: 3, col: 1 }, // 7 Skorpion
  { row: 3, col: 0 }, // 8 Strzelec
  { row: 2, col: 0 }, // 9 Koziorożec
  { row: 1, col: 0 }, // 10 Wodnik
  { row: 0, col: 0 }, // 11 Ryby
];

const DIGNITY_BADGE: Record<string, string> = {
  egzaltacja: "↑ egzaltacja", władanie: "we władaniu", upadek: "↓ upadek",
};

/** Szerokość dymka i margines od krawędzi okna — do przycinania pozycji. */
const TIP_W = 250;
const TIP_MARGIN = 12;

export default function SouthChart({ chart, compareChart }: { chart: VedicChart; compareChart?: VedicChart }) {
  const [hover, setHover] = useState<number | null>(null); // indeks znaku (0-11)
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

  const cellCx = (col: number) => M + col * C + C / 2;
  const cellCy = (row: number) => M + row * C + C / 2;

  // pozycja dymka liczona w pikselach okna (nie % karty) — dymek renderuje się
  // portalem do <body>, więc żadna kolejna sekcja na stronie nie może go już przykryć.
  useEffect(() => {
    if (hover === null || !wrapRef.current) { setTipPos(null); return; }
    const rect = wrapRef.current.getBoundingClientRect();
    const cell = SIGN_CELL[hover];
    let left = rect.left + (cellCx(cell.col) / S) * rect.width;
    left = Math.max(TIP_MARGIN + TIP_W / 2, Math.min(left, window.innerWidth - TIP_MARGIN - TIP_W / 2));
    setTipPos({
      left,
      top: rect.top + (cellCy(cell.row) / S) * rect.height,
      below: cellCy(cell.row) < S * 0.38,
    });
  }, [hover]);

  if (!chart.angles) return null;
  const lagnaSign = chart.angles.lagnaSign;

  const byHouse: Record<number, ChartPlanet[]> = {};
  for (const id of PLANET_ORDER) {
    const p = chart.planets[id];
    (byHouse[p.house] ??= []).push(p);
  }

  const houseOfSign = (sign: number) => ((sign - lagnaSign + 12) % 12) + 1;

  const hoveredSign = hover;
  const hoveredHouse = hoveredSign !== null ? houseOfSign(hoveredSign) : null;
  const hoveredPlanets = hoveredHouse !== null ? byHouse[hoveredHouse] ?? [] : [];

  return (
    <div style={{ position: "relative", maxWidth: 520, margin: "0 auto" }}>
      {/* wrapRef obejmuje TYLKO svg — patrz komentarz w NorthChart.tsx */}
      <div ref={wrapRef} style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", display: "block" }}
        role="img" aria-label="Kosmogram wedyjski — diagram południowoindyjski"
        onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="sc-gold" x1="0" y1="0" x2={S} y2={S} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#e6c48a" />
            <stop offset="0.5" stopColor="#e6c48a" />
            <stop offset="1" stopColor="#c39a3b" />
          </linearGradient>
          <radialGradient id="sc-bg" cx="0.5" cy="0.42" r="0.75">
            <stop offset="0" stopColor="#0d1b2a" />
            <stop offset="1" stopColor="#162e3d" />
          </radialGradient>
          <radialGradient id="sc-lagna" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="rgba(230,196,138,0.14)" />
            <stop offset="1" stopColor="rgba(230,196,138,0)" />
          </radialGradient>
          <filter id="sc-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* tło + podwójna ramka, jak w wykresie północnoindyjskim */}
        <rect x={M - 8} y={M - 8} width={S - 2 * M + 16} height={S - 2 * M + 16} rx="10"
          fill="url(#sc-bg)" stroke="url(#sc-gold)" strokeWidth="1.8" />
        <rect x={M} y={M} width={S - 2 * M} height={S - 2 * M} rx="4"
          fill="none" stroke="url(#sc-gold)" strokeWidth="0.9" opacity="0.8" />

        {/* wyróżnienie pola lagny */}
        <rect x={M + SIGN_CELL[lagnaSign].col * C} y={M + SIGN_CELL[lagnaSign].row * C}
          width={C} height={C} fill="url(#sc-lagna)" />

        {/* przypięte pole (klik) — zostaje złote, nawet gdy mysz zjedzie gdzie indziej */}
        {wybrany !== null && (
          <rect x={M + SIGN_CELL[wybrany].col * C} y={M + SIGN_CELL[wybrany].row * C}
            width={C} height={C} fill="rgba(230,196,138,0.14)"
            stroke="rgba(230,196,138,0.75)" strokeWidth="1.4" />
        )}
        {/* podświetlenie pola pod kursorem (tymczasowe, na najechanie) */}
        {hover !== null && (
          <rect x={M + SIGN_CELL[hover].col * C} y={M + SIGN_CELL[hover].row * C}
            width={C} height={C} fill="rgba(17,167,182,0.12)"
            stroke="rgba(127,208,216,0.6)" strokeWidth="1" />
        )}

        {/* linie siatki 4×4 (bez środkowych krawędzi wewnętrznego 2×2) */}
        <g stroke="url(#sc-gold)" strokeWidth="1.1" filter="url(#sc-glow)" pointerEvents="none" fill="none">
          {SIGN_CELL.map(({ row, col }, i) => (
            <rect key={i} x={M + col * C} y={M + row * C} width={C} height={C} />
          ))}
        </g>

        {/* lotos w centrum, jak w wykresie północnoindyjskim */}
        <g transform={`translate(${M + 2 * C}, ${M + 2 * C})`} pointerEvents="none">
          <circle r="3.2" fill="#0d1b2a" stroke="url(#sc-gold)" strokeWidth="1" />
          {Array.from({ length: 8 }, (_, i) => (
            <ellipse key={i} rx="1.6" ry="5.5" fill="none" stroke="url(#sc-gold)" strokeWidth="0.7"
              opacity="0.85" transform={`rotate(${i * 45})`} />
          ))}
        </g>

        {/* zawartość pól — numer znaku, planety, znacznik ASC przy lagnie */}
        {SIGN_CELL.map(({ row, col }, sign) => {
          const house = houseOfSign(sign);
          const planets = byHouse[house] ?? [];
          const cx = cellCx(col);
          const cy = cellCy(row);
          const fontSize = 15;
          const rowH = 17;
          const perRow = 2;
          const rows: ChartPlanet[][] = [];
          for (let r = 0; r < planets.length; r += perRow) rows.push(planets.slice(r, r + perRow));
          const startY = cy - ((rows.length - 1) * rowH) / 2 + 4;

          return (
            <g key={sign} pointerEvents="none">
              <text x={M + col * C + 9} y={M + row * C + 15} textAnchor="start" dominantBaseline="middle"
                fill={hover === sign ? "#7fd0d8" : "#b9c7d1"} fontSize="14"
                fontFamily="var(--font-serif)" fontStyle="italic"
                filter="url(#sc-glow)" opacity={hover === sign ? 1 : 0.92}>
                {sign + 1}
              </text>
              {sign === lagnaSign && (
                <text x={M + col * C + C - 9} y={M + row * C + 15} textAnchor="end" dominantBaseline="middle"
                  fill="var(--sand)" fontSize="9.5" letterSpacing="1" fontFamily="var(--font-sans)" fontWeight="700">
                  ASC
                </text>
              )}
              {rows.map((r, ri) =>
                r.map((p, pi) => {
                  const g = GRAHAS[p.id];
                  const px = cx + (pi - (r.length - 1) / 2) * (fontSize + 8);
                  const py = startY + ri * rowH;
                  const retro = p.retrograde && p.id !== "rahu" && p.id !== "ketu";
                  return (
                    <g key={p.id}>
                      <text x={px} y={py} textAnchor="middle" dominantBaseline="middle"
                        fill={g.color} fontSize={fontSize} filter="url(#sc-glow)">
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

        {/* obszary aktywne — na wierzchu, przezroczyste */}
        {SIGN_CELL.map(({ row, col }, sign) => (
          <rect key={`hit-${sign}`} x={M + col * C} y={M + row * C} width={C} height={C}
            fill="transparent" style={{ cursor: "pointer" }}
            onMouseEnter={() => setHover(sign)}
            onClick={() => setWybrany(wybrany === sign ? null : sign)}
          />
        ))}
      </svg>
      </div>

      {/* dymek z informacją — portal do <body>, żeby żadna kolejna sekcja go nie przykryła */}
      {hover !== null && hoveredHouse !== null && tipPos && typeof document !== "undefined" && createPortal(
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
            {BHAVAS[hoveredHouse - 1].pl}{" "}
            <span style={{ fontSize: "0.78rem", color: "#8ba0b0" }}>({BHAVAS[hoveredHouse - 1].sanskrit})</span>
          </p>
          <p style={{ fontSize: "0.84rem", lineHeight: 1.55, marginBottom: 10, color: "#b9c7d1" }}>
            {BHAVAS[hoveredHouse - 1].obszar}
          </p>
          <p style={{ fontSize: "0.88rem", marginBottom: hoveredPlanets.length ? 9 : 0, color: "#e8eef2" }}>
            <span style={{ color: "var(--teal-soft)" }}>{RASIS[hoveredSign!].symbol}</span>{" "}
            <strong style={{ color: "#f2f5f7" }}>{RASIS[hoveredSign!].pl}</strong>{" "}
            <span style={{ color: "#8ba0b0", fontSize: "0.8rem" }}>({RASIS[hoveredSign!].sanskrit})</span>
            <br />
            <span style={{ fontSize: "0.8rem", color: "#b9c7d1" }}>
              władca: {GRAHAS[RASIS[hoveredSign!].lord].symbol} {GRAHAS[RASIS[hoveredSign!].lord].pl}
              {" · "}{RASIS[hoveredSign!].element}
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
        Najedź, aby zobaczyć skrót. Kliknij pole, żeby przypiąć i zobaczyć pełny opis niżej. „ASC” oznacza pole lagny.
      </p>

      {wybrany !== null && (
        <OpisDomuPanel chart={chart} house={houseOfSign(wybrany)} onZamknij={() => setWybrany(null)} compareChart={compareChart} />
      )}
    </div>
  );
}
