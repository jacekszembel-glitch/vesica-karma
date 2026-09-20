"use client";

import { useState } from "react";
import { GRAHAS } from "@/lib/astro/constants";
import type { UpcomingPeriod } from "@/lib/astro/lifemap";
import Term from "@/components/Term";

/**
 * Orbitalna oś podokresów (antardasz).
 *
 * WAŻNE dla czytelności: sama lista planet z datami wprowadza w błąd —
 * użytkownik czyta „Księżyc, sty–sie 2026” jako swój główny okres życia,
 * podczas gdy to wycinek wieloletniej mahadaszy. Dlatego:
 * 1) nad osią stoi karta bieżącego WIELKIEGO okresu,
 * 2) w osi każda zmiana mahadaszy dostaje własny nagłówek,
 * 3) oba pojęcia mają wyjaśnienie po najechaniu (Term).
 */

const W = 680;
const ROW = 96;
const HEAD = 52;
const TOP = 40;
const BOTTOM = 56;
const CX = W / 2;

const TONE: Record<UpcomingPeriod["tone"], { color: string; opis: string }> = {
  "wspierający": { color: "#6fbf9f", opis: "dobry czas na starty, ekspansję i ważne kroki" },
  "wymagający": { color: "#e08a63", opis: "czas dyscypliny — porządkuj i wzmacniaj, nie forsuj" },
  "mieszany": { color: "#93a6b3", opis: "czas umysłu i elastyczności — obserwuj i dostrajaj" },
};

const fmt = (d: Date) => d.toLocaleDateString("pl-PL", { year: "numeric", month: "short" });
const rok = (d: Date) => d.getFullYear();

/** „2 lata i 4 miesiące”, „7 miesięcy” — bez końcówek typu „1 lat”. */
function czasDo(end: Date): string {
  const ms = end.getTime() - Date.now();
  if (ms <= 0) return "kończy się";
  const mies = Math.round(ms / (30.44 * 86400000));
  const l = Math.floor(mies / 12);
  const m = mies % 12;
  const slowoL = l === 1 ? "rok" : l >= 2 && l <= 4 ? "lata" : "lat";
  const slowoM = m === 1 ? "miesiąc" : m >= 2 && m <= 4 ? "miesiące" : "miesięcy";
  if (l === 0) return `${m} ${slowoM}`;
  if (m === 0) return `${l} ${slowoL}`;
  return `${l} ${slowoL} i ${m} ${slowoM}`;
}

type Row =
  | { kind: "head"; lord: UpcomingPeriod["parentLord"]; start: Date; end: Date; current: boolean; y: number }
  | { kind: "period"; p: UpcomingPeriod; idx: number; y: number };

export default function DashaOrbit({ periods }: { periods: UpcomingPeriod[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!periods.length) return null;

  // Układ: nagłówek przy każdej zmianie wielkiego okresu + wiersz na podokres.
  const rows: Row[] = [];
  let y = TOP;
  let prevParent: string | null = null;
  periods.forEach((p, idx) => {
    if (p.parentLord !== prevParent) {
      rows.push({ kind: "head", lord: p.parentLord, start: p.parentStart, end: p.parentEnd, current: p.parentCurrent, y: y + 6 });
      y += HEAD;
      prevParent = p.parentLord;
    }
    rows.push({ kind: "period", p, idx, y });
    y += ROW;
  });
  const H = y - ROW + BOTTOM + 40;

  const nodes = rows.filter((r): r is Extract<Row, { kind: "period" }> => r.kind === "period");
  const currentIdx = Math.max(0, nodes.findIndex((n) => n.p.current));
  const focusY = nodes[currentIdx]?.y ?? TOP;
  const axisPath = `M ${CX} ${TOP - 18} L ${CX} ${H - BOTTOM + 22}`;

  // Bieżący wielki okres — do karty nad osią.
  const cur = periods.find((p) => p.current) ?? periods[0];
  const gm = GRAHAS[cur.parentLord];

  return (
    <div>
      {/* ═══ Karta wielkiego okresu — kontekst dla całej osi ═══ */}
      <div className="maha-card">
        <div className="maha-sym" style={{ color: gm.color, borderColor: `${gm.color}55` }}>{gm.symbol}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="eyebrow" style={{ marginBottom: 3 }}>
            <Term k="mahadasza">Wielki okres życia</Term>
          </p>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", color: "var(--primary-soft)", lineHeight: 1.25 }}>
            {gm.pl}
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--muted)", marginLeft: 10 }}>
              {rok(cur.parentStart)} — {rok(cur.parentEnd)}
            </span>
          </p>
          <p className="muted" style={{ fontSize: "0.84rem", marginTop: 4, lineHeight: 1.55 }}>
            {cur.parentCurrent ? <>Trwa jeszcze <strong style={{ color: "var(--teal-soft)" }}>{czasDo(cur.parentEnd)}</strong> i nadaje ton całemu temu rozdziałowi życia. </> : null}
            Poniżej — <Term k="antardasza">podokresy</Term> wewnątrz niego, czyli krótsze etapy po kilka miesięcy.
          </p>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}
        fontFamily="var(--font-sans)" role="img" aria-label="Oś nadchodzących podokresów planetarnych">
        <defs>
          <linearGradient id="do-axis" x1="0" y1="0" x2="0" y2={H} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="rgba(230,196,138,0.15)" />
            <stop offset="0.12" stopColor="#e6c48a" />
            <stop offset="0.88" stopColor="#c39a3b" />
            <stop offset="1" stopColor="rgba(195,154,59,0.15)" />
          </linearGradient>
          <filter id="do-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="do-glow-soft" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <radialGradient id="do-spark" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fff3d6" />
            <stop offset="0.4" stopColor="#e6c48a" />
            <stop offset="1" stopColor="rgba(230,196,138,0)" />
          </radialGradient>
        </defs>

        {/* orbity wokół bieżącego podokresu */}
        <g style={{ pointerEvents: "none" }}>
          <ellipse cx={CX} cy={focusY} rx="200" ry="76"
            stroke="rgba(127,208,216,0.25)" strokeWidth="0.9" strokeDasharray="1 6" fill="none" />
          <ellipse cx={CX} cy={focusY} rx="132" ry="50"
            stroke="rgba(230,196,138,0.28)" strokeWidth="0.9" strokeDasharray="1 5" fill="none" />
        </g>

        {/* oś */}
        <path d={axisPath} stroke="#c9a23b" strokeWidth="1.6" opacity="0.75" strokeLinecap="round" />
        <path d={axisPath} stroke="url(#do-axis)" strokeWidth="2.4" filter="url(#do-glow)" strokeLinecap="round" />
        <circle r="8" fill="url(#do-spark)" opacity="0.9">
          <animateMotion dur="5.5s" repeatCount="indefinite" path={axisPath} />
        </circle>
        <circle r="3" fill="#fff3d6" filter="url(#do-glow-soft)">
          <animateMotion dur="5.5s" repeatCount="indefinite" path={axisPath} />
        </circle>

        {rows.map((r, ri) => {
          /* ── Nagłówek wielkiego okresu ── */
          if (r.kind === "head") {
            const g = GRAHAS[r.lord];
            const label = `Podokresy w wielkim okresie: ${g.pl} · ${rok(r.start)}—${rok(r.end)}`;
            return (
              <g key={`h${ri}`} style={{ pointerEvents: "none" }}>
                <line x1="40" y1={r.y} x2={W - 40} y2={r.y}
                  stroke="rgba(127,208,216,0.18)" strokeWidth="1" strokeDasharray="3 6" />
                <rect x={CX - 218} y={r.y - 12} width="436" height="24" rx="12" fill="#0d1b2a" />
                <text x={CX} y={r.y + 4} textAnchor="middle" fontSize="11.5"
                  fill={r.current ? "#e6c48a" : "#93a6b3"} letterSpacing="0.06em">
                  <tspan fill={g.color}>{g.symbol}</tspan>
                  <tspan dx="7">{label}</tspan>
                </text>
              </g>
            );
          }

          /* ── Podokres ── */
          const { p, idx, y: ny } = r;
          const g = GRAHAS[p.lord];
          const right = idx % 2 === 0;
          const t = TONE[p.tone];
          const isHover = hover === idx;
          const lineEnd = right ? CX + 64 : CX - 64;
          const tx = right ? CX + 76 : CX - 76;
          const anchor = right ? "start" : "end";

          return (
            <g key={`p${idx}`}
              onMouseEnter={() => setHover(idx)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "default", opacity: hover === null || isHover ? 1 : 0.45, transition: "opacity 0.3s" }}>

              <line x1={right ? CX + 14 : CX - 14} y1={ny} x2={lineEnd} y2={ny}
                stroke={isHover ? g.color : "rgba(127,208,216,0.4)"} strokeWidth="1.1"
                strokeDasharray={p.current ? "none" : "2 4"} style={{ transition: "stroke 0.3s" }} />

              {p.current ? (
                <g filter="url(#do-glow)">
                  <circle cx={CX} cy={ny} r="13" stroke="#e6c48a" strokeWidth="1.8" fill="rgba(230,196,138,0.1)" />
                  <circle cx={CX} cy={ny} r="6" stroke="#e6c48a" strokeWidth="1.4" fill="#0d1b2a" />
                  <circle cx={CX} cy={ny} r="13" stroke="#e6c48a" strokeWidth="1" fill="none">
                    <animate attributeName="r" values="13;24;13" dur="3.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.7;0;0.7" dur="3.4s" repeatCount="indefinite" />
                  </circle>
                </g>
              ) : (
                <circle cx={CX} cy={ny} r={isHover ? 9 : 7} stroke={isHover ? g.color : "#7fd0d8"}
                  strokeWidth="1.5" fill="#0d1b2a" filter={isHover ? "url(#do-glow)" : undefined}
                  style={{ transition: "r 0.25s" }} />
              )}

              <text x={right ? CX - 30 : CX + 30} y={ny + 5} textAnchor="middle"
                fill={g.color} fontSize="17" filter={p.current || isHover ? "url(#do-glow)" : undefined}>
                {g.symbol}
              </text>

              {/* etykieta: jawnie „podokres”, żeby nie mylił się z wielkim okresem */}
              <text x={tx} y={ny - 24} textAnchor={anchor} fill="#7fd0d8" fontSize="9.5" letterSpacing="0.16em">
                PODOKRES
              </text>
              <text x={tx} y={ny - 6} textAnchor={anchor} fill="#f2f5f7" fontSize="15" fontWeight="600">
                {g.pl}
              </text>
              <text x={tx} y={ny + 13} textAnchor={anchor} fill="#93a6b3" fontSize="12.5"
                style={{ fontVariantNumeric: "tabular-nums" }}>
                {fmt(p.start)} — {fmt(p.end)}
              </text>
              <g transform={`translate(${right ? tx : tx - 92}, ${ny + 21})`}>
                <rect width="92" height="19" rx="9.5" fill="none" stroke={t.color} strokeWidth="0.9" opacity="0.85" />
                <text x="46" y="13" textAnchor="middle" fill={t.color} fontSize="10.5" letterSpacing="0.4">
                  {p.tone}
                </text>
              </g>
              {p.current && (
                <text x={right ? tx + 100 : tx - 100} y={ny + 34} textAnchor={anchor}
                  fill="#e6c48a" fontSize="10" letterSpacing="2.5" fontWeight="600">
                  TERAZ ▲
                </text>
              )}

              {/* opis tonu po wolnej stronie osi */}
              {isHover && (() => {
                const boxW = right ? CX - 100 : W - CX - 100;
                const boxX = right ? 24 : CX + 76;
                return (
                  <foreignObject x={boxX} y={ny - 34} width={boxW} height={68}>
                    <div style={{
                      height: "100%", display: "flex", alignItems: "center",
                      justifyContent: right ? "flex-end" : "flex-start",
                    }}>
                      <div style={{
                        maxWidth: boxW - 8,
                        padding: "9px 13px",
                        borderRadius: 10,
                        background: "rgba(16, 34, 49, 0.96)",
                        border: `1px solid ${t.color}55`,
                        boxShadow: `0 8px 24px rgba(0,0,0,0.45), 0 0 18px -8px ${t.color}`,
                        color: t.color,
                        fontFamily: "var(--font-sans)",
                        fontSize: "12.5px",
                        lineHeight: 1.45,
                        fontStyle: "italic",
                        textAlign: right ? "right" : "left",
                      }}>
                        ✦ {t.opis}
                      </div>
                    </div>
                  </foreignObject>
                );
              })()}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
