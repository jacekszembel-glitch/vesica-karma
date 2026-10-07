"use client";

import type { LiniaDloni, MiejsceZnaku } from "@/lib/astro/zgodnosc";

/**
 * ILUSTRACJA DŁONI — wnętrze dłoni z wzgórkami i liniami; w przewodniku świeci to miejsce
 * albo ta linia, o którą akurat pytamy. Rysunek to PRAWA dłoń od wnętrza (mały palec po lewej,
 * kciuk po prawej) — lewą odbijamy w poziomie, podpisy zostają nieodwrócone.
 * Kontur: palce, dłoń i kciuk jako osobne kształty — najpierw grubym obrysem, potem samym
 * wypełnieniem na wierzchu, więc wewnętrzne styki znikają i zostaje jeden czysty zarys.
 * Mars ma dwa wzgórki (górny przy krawędzi, dolny przy kciuku) — oba świecą jako „Mars”.
 * Rahu i Ketu według chiromancji indyjskiej: Rahu w środku dłoni, Ketu nad nadgarstkiem.
 */

const W = 300;

/** Kształty dłoni (prawa, viewBox 300×400). */
const PALCE = [
  { x: 74, y: 78, w: 30, h: 92, obrot: -9 }, // mały
  { x: 108, y: 40, w: 33, h: 120, obrot: -3 }, // serdeczny
  { x: 145, y: 26, w: 35, h: 132, obrot: 0 }, // środkowy
  { x: 184, y: 48, w: 33, h: 116, obrot: 5 }, // wskazujący
];
const DLON = "M 76 150 Q 74 140 88 138 L 212 136 Q 228 138 226 156 L 226 240 C 224 300 210 344 198 384 L 92 386 C 78 344 66 300 66 250 C 66 210 70 176 76 150 Z";
const KCIUK = { cx: 250, cy: 252, w: 40, h: 140, obrot: 34 };

/** Linie (prawa dłoń). */
const LINIE: Record<LiniaDloni, string> = {
  serca: "M 70 194 C 108 186 150 184 182 160",
  glowy: "M 222 198 C 182 208 132 224 84 258",
  zycia: "M 222 200 C 180 234 166 300 186 382",
  losu: "M 146 382 C 147 304 152 232 160 170",
  slonca: "M 134 300 C 129 252 126 212 124 176",
  merkurego: "M 154 352 C 128 292 106 232 92 184",
  intuicji: "M 100 344 C 72 304 76 234 96 200",
  podrozy: "M 68 300 L 90 296 M 68 318 L 90 315",
  relacji: "M 70 178 L 88 176 M 71 172 L 85 171",
  pas_wenus: "M 104 162 C 126 178 160 176 178 154",
  pierscien_salomona: "M 182 158 C 192 174 210 174 218 160",
  marsa: "M 210 218 C 186 248 180 292 194 352",
};
const LINIE_STALE: LiniaDloni[] = ["serca", "glowy", "zycia", "losu"];

/** Wzgórki (prawa dłoń). */
const PUNKTY: { id: MiejsceZnaku; x: number; y: number; podpis: string; podpisDy?: number }[] = [
  { id: "jupiter", x: 198, y: 170, podpis: "Jowisz", podpisDy: -15 },
  { id: "saturn", x: 161, y: 166, podpis: "Saturn", podpisDy: -15 },
  { id: "sun", x: 124, y: 168, podpis: "Słońce", podpisDy: -15 },
  { id: "mercury", x: 90, y: 176, podpis: "Merkury", podpisDy: -15 },
  { id: "mars", x: 84, y: 232, podpis: "Mars" },
  { id: "mars", x: 206, y: 222, podpis: "Mars" },
  { id: "czworobok", x: 146, y: 208, podpis: "czworobok" },
  { id: "rahu", x: 140, y: 268, podpis: "Rahu" },
  { id: "moon", x: 94, y: 316, podpis: "Księżyc" },
  { id: "venus", x: 200, y: 312, podpis: "Wenus" },
  { id: "ketu", x: 142, y: 354, podpis: "Ketu" },
];

function Ksztalty() {
  return (
    <>
      {PALCE.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.w / 2}
          transform={`rotate(${p.obrot} ${p.x + p.w / 2} ${p.y + p.h})`} />
      ))}
      <rect x={KCIUK.cx - KCIUK.w / 2} y={KCIUK.cy - KCIUK.h / 2} width={KCIUK.w} height={KCIUK.h} rx={KCIUK.w / 2}
        transform={`rotate(${KCIUK.obrot} ${KCIUK.cx} ${KCIUK.cy})`} />
      <path d={DLON} />
    </>
  );
}

export default function IlustracjaDloni({ lewa = false, zaznaczone = [], aktywne = null, linia = null, onWybierz, szerokosc = 300 }: {
  /** Lewa dłoń — rysunek w lustrzanym odbiciu. */
  lewa?: boolean;
  /** Miejsca ze znakami — złote kropki. */
  zaznaczone?: MiejsceZnaku[];
  /** Miejsce, o które pytamy — świeci. */
  aktywne?: MiejsceZnaku | null;
  /** Linia, o którą pytamy — świeci. */
  linia?: LiniaDloni | null;
  /** Kliknięcie w miejsce na rysunku. */
  onWybierz?: (m: MiejsceZnaku) => void;
  szerokosc?: number;
}) {
  const x = (v: number) => (lewa ? W - v : v);
  const lustro = lewa ? `translate(${W} 0) scale(-1 1)` : undefined;
  return (
    <svg viewBox="20 14 280 380" width={szerokosc} className="ilu-dlon" role="img"
      aria-label={`${lewa ? "Lewa" : "Prawa"} dłoń od wewnątrz — wzgórki i linie`}>
      <defs>
        <filter id="ilu-blask" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>
      <g transform={lustro}>
        {/* zarys: gruby obrys pod spodem, wypełnienie na wierzchu chowa wewnętrzne styki */}
        <g className="ilu-obrys"><Ksztalty /></g>
        <g className="ilu-wypelnienie"><Ksztalty /></g>
        {/* zgięcia stawów palców */}
        {PALCE.map((p, i) => (
          <g key={i} transform={`rotate(${p.obrot} ${p.x + p.w / 2} ${p.y + p.h})`} className="ilu-staw">
            {[0.36, 0.62].map((f) => <line key={f} x1={p.x + 7} y1={p.y + p.h * f} x2={p.x + p.w - 7} y2={p.y + p.h * f} />)}
          </g>
        ))}
        {LINIE_STALE.filter((l) => l !== linia).map((l) => <path key={l} d={LINIE[l]} className="ilu-linia" />)}
        {linia && (
          <>
            <path d={LINIE[linia]} className="ilu-linia-blask" filter="url(#ilu-blask)" />
            <path d={LINIE[linia]} className="ilu-linia-akt" />
          </>
        )}
      </g>
      {PUNKTY.map((p, i) => {
        const jest = zaznaczone.includes(p.id);
        const akt = aktywne === p.id;
        return (
          <g key={i} className={`ilu-punkt${jest ? " ilu-jest" : ""}${akt ? " ilu-aktywny" : ""}`}
            style={{ cursor: onWybierz ? "pointer" : "default" }}
            onClick={onWybierz ? () => onWybierz(p.id) : undefined}>
            {akt && <circle cx={x(p.x)} cy={p.y} r={20} className="ilu-poswiata" filter="url(#ilu-blask)" />}
            <circle cx={x(p.x)} cy={p.y} r={akt ? 14 : 9} className="ilu-kolo" />
            {jest && <circle cx={x(p.x)} cy={p.y} r={4} className="ilu-kropka" />}
            <text x={x(p.x)} y={p.y + (p.podpisDy !== undefined ? p.podpisDy - (akt ? 6 : 0) : akt ? 28 : 21)} textAnchor="middle" className="ilu-podpis">{p.podpis}</text>
          </g>
        );
      })}
    </svg>
  );
}
