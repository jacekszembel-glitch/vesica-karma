"use client";

import { BODIES, BODY_ORDER } from "@/lib/astro/bodies";
import { silaZasiegu, ORB_KM, ORB_STRONG_KM, ORB_MEDIUM_KM } from "@/lib/astro/astrocarto";

/**
 * DIAGRAMY DO INTERPRETACJI — rysowane z tych samych policzonych danych,
 * które dostaje model (nigdy z parsowania jego tekstu, więc nie mogą się
 * z nim rozjechać). Suchy opis dostaje obraz: pasek bliskości linii albo
 * różę kierunków.
 */

interface LiniaWPoblizu {
  planeta: string;
  kat: string;
  obszar: string;
  odlegloscKm: number;
  silna: boolean;
}

interface Kierunek {
  planeta: string;
  kierunek: string;
  azymut: number;
  nadHoryzontem: boolean;
}

/** Mapa: polska nazwa → symbol/kolor z katalogu ciał. */
const PO_POLSKU = Object.fromEntries(
  BODY_ORDER.map((id) => [BODIES[id].pl, { symbol: BODIES[id].symbol, color: BODIES[id].color }]),
);

const KAT_KOLOR: Record<string, string> = {
  MC: "var(--sand)", IC: "#d0a05c", ASC: "var(--teal-soft)", DSC: "#8fb8d8",
};

/** 0 km = pełny pasek; ORB_KM (1125 km — granica odczuwalnego wpływu) = tło. */
function sila(km: number): number {
  return Math.max(0.06, 1 - km / ORB_KM);
}

/** Ta sama trzystopniowa skala co wszędzie indziej (silaZasiegu w astrocarto.ts) —
 *  wczesniej ten diagram mial WLASNE, inne progi (30/100/200 km), niezgodne
 *  z tymi opisanymi w kartach mapy (250/500/1125 km). */
function opisBliskosci(km: number): string {
  return silaZasiegu(km);
}

function PasekLinii({ linie }: { linie: LiniaWPoblizu[] }) {
  return (
    <div style={{ display: "grid", gap: 9 }}>
      {linie.map((l, i) => {
        const b = PO_POLSKU[l.planeta];
        const t = sila(l.odlegloscKm);
        return (
          <div key={`${l.planeta}${l.kat}${i}`} style={{ display: "grid", gap: 3 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: "0.84rem", flexWrap: "wrap" }}>
              <span style={{ minWidth: 0 }}>
                <span style={{ color: b?.color ?? "var(--text)" }}>{b?.symbol ?? "•"}</span>{" "}
                <strong>{l.planeta}</strong>{" "}
                <span style={{ color: KAT_KOLOR[l.kat] ?? "var(--muted)", fontSize: "0.72rem", letterSpacing: "0.08em" }}>
                  {l.kat}
                </span>{" "}
                <span className="muted" style={{ fontSize: "0.78rem" }}>· {l.obszar}</span>
              </span>
              <span className="muted" style={{ fontSize: "0.78rem", flexShrink: 0 }}>
                {l.odlegloscKm} km — {opisBliskosci(l.odlegloscKm)}
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 4, background: "rgba(127,208,216,0.1)", overflow: "hidden" }}>
              <div style={{
                width: `${Math.round(t * 100)}%`, height: "100%", borderRadius: 4,
                background: `linear-gradient(90deg, ${b?.color ?? "#e6c48a"}55, ${b?.color ?? "#e6c48a"})`,
                boxShadow: l.silna ? `0 0 8px ${b?.color ?? "#e6c48a"}77` : "none",
              }} />
            </div>
          </div>
        );
      })}
      <p className="muted" style={{ fontSize: "0.72rem", marginTop: 2 }}>
        Im pełniejszy pasek, tym bliżej przebiega linia — silna do {ORB_STRONG_KM} km,
        średnia do {ORB_MEDIUM_KM} km, słaba (ale odczuwalna) do {ORB_KM} km.
      </p>
    </div>
  );
}

/** Róża kierunków — strzałki w azymutach planet (mapa lokalna). */
function RozaKierunkow({ kierunki }: { kierunki: Kierunek[] }) {
  const R = 74, C = 90;
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
      <svg viewBox="0 0 180 180" width="170" height="170" role="img" aria-label="Róża kierunków planet">
        <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(127,208,216,0.22)" strokeWidth="1" />
        <circle cx={C} cy={C} r={R * 0.55} fill="none" stroke="rgba(230,196,138,0.16)" strokeWidth="0.8" strokeDasharray="2 5" />
        {["N", "E", "S", "W"].map((s, i) => {
          const a = (i * 90 - 90) * Math.PI / 180;
          return (
            <text key={s} x={C + (R + 11) * Math.cos(a)} y={C + (R + 11) * Math.sin(a)}
              textAnchor="middle" dominantBaseline="middle" fill="#93a6b3" fontSize="9">{s}</text>
          );
        })}
        {kierunki.map((k) => {
          const b = PO_POLSKU[k.planeta];
          const a = (k.azymut - 90) * Math.PI / 180;
          const r2 = k.nadHoryzontem ? R * 0.92 : R * 0.6;
          return (
            <g key={k.planeta} opacity={k.nadHoryzontem ? 1 : 0.5}>
              <line x1={C} y1={C} x2={C + r2 * Math.cos(a)} y2={C + r2 * Math.sin(a)}
                stroke={b?.color ?? "#e6c48a"} strokeWidth="1.4" strokeLinecap="round" />
              <text x={C + (r2 + 8) * Math.cos(a)} y={C + (r2 + 8) * Math.sin(a)}
                textAnchor="middle" dominantBaseline="middle" fill={b?.color ?? "#e6c48a"} fontSize="10">
                {b?.symbol ?? "•"}
              </text>
            </g>
          );
        })}
        <circle cx={C} cy={C} r="3" fill="#e6c48a" />
      </svg>
      <div style={{ display: "grid", gap: 4, fontSize: "0.8rem", minWidth: 0 }}>
        {kierunki.slice(0, 6).map((k) => {
          const b = PO_POLSKU[k.planeta];
          return (
            <span key={k.planeta}>
              <span style={{ color: b?.color }}>{b?.symbol}</span>{" "}
              <strong>{k.planeta}</strong>{" "}
              <span className="muted">— {k.kierunek}{k.nadHoryzontem ? "" : " (pod horyzontem)"}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function DiagramOdczytu({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null;

  const linie = data.linieWPoblizu as LiniaWPoblizu[] | undefined;
  const kierunki = data.kierunki as Kierunek[] | undefined;

  if (Array.isArray(linie) && linie.length && linie[0]?.odlegloscKm !== undefined) {
    return (
      <div style={{ margin: "16px 0 4px", padding: "14px 16px", border: "1px solid var(--line-soft)", borderRadius: 12 }}>
        <p className="eyebrow" style={{ marginBottom: 10, fontSize: "0.66rem" }}>Linie w pobliżu — na jednym pasku</p>
        <PasekLinii linie={linie} />
      </div>
    );
  }
  if (Array.isArray(kierunki) && kierunki.length && kierunki[0]?.azymut !== undefined) {
    return (
      <div style={{ margin: "16px 0 4px", padding: "14px 16px", border: "1px solid var(--line-soft)", borderRadius: 12 }}>
        <p className="eyebrow" style={{ marginBottom: 10, fontSize: "0.66rem" }}>Róża Twoich kierunków</p>
        <RozaKierunkow kierunki={kierunki} />
      </div>
    );
  }
  return null;
}
