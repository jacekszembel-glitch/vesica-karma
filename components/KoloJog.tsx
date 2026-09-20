"use client";

import type { VedicChart } from "@/lib/astro/chart";
import { GRAHAS, type PlanetId } from "@/lib/astro/constants";
import { domZnaku, type Yoga, type KategoriaJogi } from "@/lib/astro/yogas";

/**
 * KONSTELACJA JOG — ten sam język, co Mandala Syntezy (/sciezka): węzły,
 * nici, poświata, para diagram↔legenda podświetlająca się w obie strony.
 * Zamiast pustych, ponumerowanych klinów koła — siedem klasycznych grah
 * na okręgu domów. Nić między dwiema planetami = joga dwuplanetowa
 * (Radźa, Dhana) w koniunkcji lub aspekcie; poświata wokół jednej planety
 * = joga jednoplanetowa (Mahapurusza, Neeczabhanga, Wiprita Radźa).
 * Planeta bez żadnej jogi zostaje przygaszona — widać ją, ale nie świeci.
 */

/**
 * Paleta kategorii jog — zwalidowana `dataviz` (validate_palette.js) na
 * ciemnej powierzchni karty (#14283a): pasmo jasności, próg chromy,
 * separacja CVD (deutan/protan/tritan) i próg dla widzenia bez zaburzeń —
 * wszystkie testy PASS. Zmiana tu = zmiana wszędzie (koło, legendy, mapa czasu).
 */
export const KATEGORIA_KOLOR: Record<KategoriaJogi, string> = {
  mahapurusza: "#b8811f",
  gajakesari: "#2196b5",
  "budha-aditja": "#5a9e3a",
  radza: "#4f7fe0",
  dhana: "#d45f9a",
  neeczabhanga: "#8b7fe0",
  "wiprita-radza": "#cf6432",
};

const KLASYCZNE: PlanetId[] = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];

const S = 380, CX = S / 2, CY = S / 2;
const R_NODE = 128, R_TICK = 168;
/** Maksymalna rozpiętość wachlarza w obrębie jednego domu — wyraźnie mniej niż
 *  30°, żeby węzeł nigdy nie wypłynął wizualnie do sąsiedniego klina. */
const MAKS_ROZPIETOSC_DOMU = 27;
const MAKS_ROZSTAW = 13;
/** Promień węzła planety — mały, żeby nawet cztery planety w jednym znaku zmieściły się bez zachodzenia na siebie. */
const R_WEZEL = 10;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
/** Kąt środka domu n (1 = góra, zgodnie z zegarem). */
function katDomu(n: number): number {
  return -90 + (n - 1) * 30 + 15;
}

/**
 * Pozycje siedmiu klasycznych grah — grupowane ŚCIŚLE wg domu (nigdy nie
 * wychodzą poza jego klin), z wachlarzem w obrębie domu, którego rozstaw
 * kurczy się wraz z liczbą planet, żeby zawsze zmieścić się w 30°.
 * Kolejność w wachlarzu idzie za rzeczywistym stopniem, nie za kolejnością
 * na liście grah.
 */
function pozycjeGrah(chart: VedicChart, lagnaSign: number): Map<PlanetId, { x: number; y: number }> {
  const grupy = new Map<number, PlanetId[]>();
  for (const id of KLASYCZNE) {
    const dom = domZnaku(lagnaSign, chart.planets[id].sign);
    grupy.set(dom, [...(grupy.get(dom) ?? []), id]);
  }
  const pozycje = new Map<PlanetId, { x: number; y: number }>();
  for (const [dom, ids] of grupy) {
    ids.sort((a, b) => chart.planets[a].longitude - chart.planets[b].longitude);
    const bazowyKat = katDomu(dom);
    const rozstaw = ids.length > 1 ? Math.min(MAKS_ROZSTAW, MAKS_ROZPIETOSC_DOMU / (ids.length - 1)) : 0;
    ids.forEach((id, i) => {
      const kat = bazowyKat + (i - (ids.length - 1) / 2) * rozstaw;
      pozycje.set(id, { x: CX + R_NODE * Math.cos(toRad(kat)), y: CY + R_NODE * Math.sin(toRad(kat)) });
    });
  }
  return pozycje;
}

function jogaAktywna(j: Yoga, aktywny: string | null): boolean {
  if (!aktywny) return false;
  if (aktywny === `yoga-${j.id}`) return true;
  if (aktywny.startsWith("planeta-")) return j.planety.includes(aktywny.slice(8) as PlanetId);
  return false;
}
function planetaAktywna(id: PlanetId, jogi: Yoga[], aktywny: string | null): boolean {
  if (!aktywny) return false;
  if (aktywny === `planeta-${id}`) return true;
  if (aktywny.startsWith("yoga-")) {
    const yid = aktywny.slice(5);
    return jogi.some((j) => j.id === yid && j.planety.includes(id));
  }
  return false;
}

export default function KoloJog({ chart, jogi, aktywny, setAktywny }: {
  chart: VedicChart; jogi: Yoga[];
  aktywny: string | null; setAktywny: (v: string | null) => void;
}) {
  if (!chart.angles) return null;
  const lagnaSign = chart.angles.lagnaSign;
  const pozycje = pozycjeGrah(chart, lagnaSign);

  const planetyZJoga = new Set(jogi.flatMap((j) => j.planety));
  const dwuplanetowe = jogi.filter((j) => j.planety.length === 2 && pozycje.has(j.planety[0]) && pozycje.has(j.planety[1]));
  const jednoplanetowe = jogi.filter((j) => j.planety.length === 1 && pozycje.has(j.planety[0]));
  // poświaty jednej planety układają się warstwowo, gdy dotyczy jej kilka jog naraz
  const halosNaPlanete = new Map<PlanetId, Yoga[]>();
  for (const j of jednoplanetowe) {
    const id = j.planety[0];
    halosNaPlanete.set(id, [...(halosNaPlanete.get(id) ?? []), j]);
  }

  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="synteza-mandala" role="img"
      aria-label="Konstelacja jog — planety połączone nićmi tam, gdzie tworzą klasyczną jogę">
      <defs>
        <filter id="kj-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* pierścień domów — cichy kontekst, nieinteraktywny */}
      <circle cx={CX} cy={CY} r={R_NODE + 20} fill="none" stroke="rgba(127,208,216,0.14)" strokeWidth="1" />
      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
        const kat = katDomu(n);
        const [tx, ty] = [CX + R_TICK * Math.cos(toRad(kat)), CY + R_TICK * Math.sin(toRad(kat))];
        return (
          <text key={n} x={tx} y={ty + 5} textAnchor="middle" fontFamily="var(--font-serif)"
            fontSize="15" fill="rgba(178,193,203,0.75)">{n}</text>
        );
      })}

      {/* nici — jogi dwuplanetowe, łuk gnący się ku środkowi */}
      {dwuplanetowe.map((j) => {
        const [a, b] = j.planety.map((id) => pozycje.get(id)!);
        const podswietlona = jogaAktywna(j, aktywny);
        return (
          <path key={j.id} d={`M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${CX} ${CY} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`}
            fill="none" stroke={KATEGORIA_KOLOR[j.kategoria]}
            strokeWidth={podswietlona ? 2.4 : 1.3}
            strokeOpacity={podswietlona ? 0.95 : 0.4}
            filter={podswietlona ? "url(#kj-glow)" : undefined}
            style={{ transition: "stroke-width 0.25s, stroke-opacity 0.25s", cursor: "pointer" }}
            onMouseEnter={() => setAktywny(`yoga-${j.id}`)}
            onMouseLeave={() => setAktywny(null)} />
        );
      })}

      {/* poświaty — jogi jednoplanetowe */}
      {[...halosNaPlanete.entries()].map(([id, lista]) =>
        lista.map((j, i) => {
          const p = pozycje.get(id)!;
          const podswietlona = jogaAktywna(j, aktywny);
          return (
            <circle key={j.id} cx={p.x} cy={p.y} r={R_WEZEL + 5 + i * 5} fill="none"
              stroke={KATEGORIA_KOLOR[j.kategoria]}
              strokeWidth={podswietlona ? 2 : 1.1}
              strokeOpacity={podswietlona ? 0.9 : 0.4}
              filter={podswietlona ? "url(#kj-glow)" : undefined}
              style={{ transition: "stroke-width 0.25s, stroke-opacity 0.25s", cursor: "pointer" }}
              onMouseEnter={() => setAktywny(`yoga-${j.id}`)}
              onMouseLeave={() => setAktywny(null)} />
          );
        }),
      )}

      {/* siedem grah — przygaszone, jeśli żadna joga ich nie dotyczy */}
      {KLASYCZNE.map((id) => {
        const p = pozycje.get(id)!;
        const aktywna = planetyZJoga.has(id);
        const podswietlona = planetaAktywna(id, jogi, aktywny);
        const g = GRAHAS[id];
        return (
          <g key={id}
            onMouseEnter={() => aktywna && setAktywny(`planeta-${id}`)}
            onMouseLeave={() => setAktywny(null)}
            style={{
              cursor: aktywna ? "pointer" : "default",
              transformBox: "fill-box", transformOrigin: "center",
              transform: podswietlona ? "scale(1.18)" : "scale(1)",
              transition: "transform 0.25s var(--ease-out)",
            }}>
            <circle cx={p.x} cy={p.y} r={R_WEZEL} fill="rgba(13,27,42,0.92)"
              stroke={aktywna ? g.color : "rgba(147,166,179,0.35)"}
              strokeWidth={podswietlona ? 2 : 1.3}
              filter={podswietlona ? "url(#kj-glow)" : undefined} />
            <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="15"
              fill={aktywna ? g.color : "rgba(147,166,179,0.45)"}>{g.symbol}</text>
          </g>
        );
      })}
    </svg>
  );
}
