"use client";

import type { MiejsceZnaku } from "@/lib/astro/zgodnosc";

/**
 * ILUSTRACJA DŁONI — wnętrze dłoni z podpisanymi wzgórkami, czworobokiem i głównymi liniami,
 * żeby było wiadomo, gdzie jest np. wzgórek Saturna. Rysunek to PRAWA dłoń widziana od wnętrza
 * (kciuk po prawej, mały palec po lewej) — dla lewej dłoni odbijamy go w poziomie, a podpisy
 * przestawiamy, żeby się nie odwracały.
 * Mars ma dwa wzgórki (górny przy krawędzi, dolny przy kciuku) — oba zaznaczają „Mars”.
 * Rahu i Ketu według chiromancji indyjskiej: Rahu w środku dłoni, Ketu nad nadgarstkiem.
 */

const W = 220;

/** Punkty na prawej dłoni (viewBox 220×290). */
const PUNKTY: { id: MiejsceZnaku; x: number; y: number; podpis: string; podpisDx?: number; podpisDy?: number }[] = [
  { id: "jupiter", x: 141, y: 108, podpis: "Jowisz", podpisDy: -80 },
  { id: "saturn", x: 111, y: 102, podpis: "Saturn", podpisDy: -88 },
  { id: "sun", x: 80, y: 106, podpis: "Słońce", podpisDy: -72 },
  { id: "mercury", x: 52, y: 116, podpis: "Merkury", podpisDy: -52 },
  { id: "mars", x: 52, y: 162, podpis: "Mars", podpisDx: 0, podpisDy: 18 },
  { id: "mars", x: 150, y: 150, podpis: "Mars", podpisDy: -12 },
  { id: "czworobok", x: 104, y: 141, podpis: "czworobok", podpisDy: 4 },
  { id: "rahu", x: 102, y: 180, podpis: "Rahu", podpisDy: 16 },
  { id: "moon", x: 58, y: 214, podpis: "Księżyc", podpisDy: 18 },
  { id: "venus", x: 150, y: 210, podpis: "Wenus", podpisDy: 18 },
  { id: "ketu", x: 104, y: 238, podpis: "Ketu", podpisDy: 16 },
];

export default function IlustracjaDloni({ lewa = false, zaznaczone = [], aktywne = null, onWybierz, szerokosc = 220 }: {
  /** Lewa dłoń — rysunek w lustrzanym odbiciu. */
  lewa?: boolean;
  /** Miejsca ze znakami (np. z listy AI) — złote kropki. */
  zaznaczone?: MiejsceZnaku[];
  /** Miejsce podświetlone (wybrane w formularzu albo najechane na liście). */
  aktywne?: MiejsceZnaku | null;
  /** Kliknięcie w miejsce na rysunku — wybór miejsca. */
  onWybierz?: (m: MiejsceZnaku) => void;
  szerokosc?: number;
}) {
  const x = (v: number) => (lewa ? W - v : v);
  const lustro = lewa ? `translate(${W} 0) scale(-1 1)` : undefined;
  return (
    <svg viewBox="0 -6 220 296" width={szerokosc} className="ilu-dlon" role="img"
      aria-label={`${lewa ? "Lewa" : "Prawa"} dłoń od wewnątrz — wzgórki i główne linie`}>
      <g transform={lustro}>
        {/* zarys dłoni: palce od małego (lewo) do wskazującego, kciuk po prawej */}
        <path className="ilu-zarys" d="
          M 40 132 C 36 110 38 92 42 80 C 45 70 58 68 61 80 L 66 112
          L 70 54 C 72 40 88 40 90 54 L 94 104
          L 99 36 C 101 22 120 22 122 36 L 126 102
          L 130 48 C 132 34 150 34 152 48 L 154 118
          C 162 132 172 118 184 100 C 192 88 210 94 206 110 C 200 136 184 168 174 206
          C 168 236 160 256 150 270 L 66 270 C 52 252 42 232 38 206 C 34 182 38 158 40 132 Z" />
        {/* linie: serca, głowy, życia, losu */}
        <path className="ilu-linia" d="M 42 128 C 70 120 104 118 132 120 C 140 121 146 116 150 110" />
        <path className="ilu-linia" d="M 154 132 C 130 140 96 146 66 164 C 58 170 50 178 46 186" />
        <path className="ilu-linia" d="M 156 130 C 132 146 122 180 128 214 C 132 240 140 258 146 268" />
        <path className="ilu-linia ilu-linia-los" d="M 106 268 C 104 230 104 190 108 150 C 110 132 112 118 113 108" />
      </g>
      {PUNKTY.map((p, i) => {
        const jest = zaznaczone.includes(p.id);
        const akt = aktywne === p.id;
        return (
          <g key={i} className={`ilu-punkt${jest ? " ilu-jest" : ""}${akt ? " ilu-aktywny" : ""}`}
            style={{ cursor: onWybierz ? "pointer" : "default" }}
            onClick={onWybierz ? () => onWybierz(p.id) : undefined}>
            <circle cx={x(p.x)} cy={p.y} r={akt ? 11 : 8} className="ilu-kolo" />
            {jest && <circle cx={x(p.x)} cy={p.y} r={3.5} className="ilu-kropka" />}
            <text x={x(p.x + (p.podpisDx ?? 0))} y={p.y + (p.podpisDy ?? -14)} textAnchor="middle" className="ilu-podpis">{p.podpis}</text>
          </g>
        );
      })}
    </svg>
  );
}
