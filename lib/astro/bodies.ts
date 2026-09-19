import { GRAHAS, PLANET_ORDER, type PlanetId } from "./constants";

/**
 * Planety zewnętrzne — Uran, Neptun, Pluton.
 *
 * DLACZEGO OSOBNY PLIK, a nie dopisanie ich do GRAHAS:
 * astrologia wedyjska zna dziewięć grah i nie używa planet odkrytych po 1781 r.
 * Nie mają władania znakami, egzaltacji ani udziału w cyklu Vimshottari, więc
 * wpuszczenie ich do GRAHAS zepsułoby dasze, godności i kosmogram.
 *
 * Astrokartografia to jednak technika ZACHODNIA (Jim Lewis, lata 70.), w której
 * planety zewnętrzne są standardem. Co ważne, jej linie liczy się z rektascensji
 * i deklinacji — zodiak w ogóle nie bierze w tym udziału, więc nie ma sprzeczności
 * z metodą wedyjską. Dlatego pokazujemy je tylko na mapie, domyślnie wyłączone.
 */

export type OuterId = "uranus" | "neptune" | "pluto";
/** Cztery kąty kosmogramu — jak planety, mają azymut zależny od miejsca i chwili. */
export type AngleId = "asc" | "desc" | "mc" | "ic";
export type BodyId = PlanetId | OuterId | AngleId;

export interface BodyInfo {
  id: BodyId;
  pl: string;
  symbol: string;
  color: string;
  /** Naturalna dobroczynność — używana przy ocenie miejsc. */
  nature: 1 | 0 | -1;
  /** Czy należy do dziewięciu grah wedyjskich. */
  vedic: boolean;
  /** Motyw linii na mapie. */
  motyw: string;
}

export const OUTER_ORDER: OuterId[] = ["uranus", "neptune", "pluto"];

export const OUTERS: Record<OuterId, BodyInfo> = {
  uranus: {
    id: "uranus", pl: "Uran", symbol: "♅", color: "#79C7E8", nature: 0, vedic: false,
    motyw: "zmiana, wolność, zerwanie ze schematem",
  },
  neptune: {
    id: "neptune", pl: "Neptun", symbol: "♆", color: "#8AA8E0", nature: 0, vedic: false,
    motyw: "wyobraźnia, duchowość, rozmycie granic",
  },
  pluto: {
    id: "pluto", pl: "Pluton", symbol: "♇", color: "#B06A8A", nature: -1, vedic: false,
    motyw: "przemiana, intensywność, władza nad sobą",
  },
};

export const ANGLE_ORDER: AngleId[] = ["asc", "desc", "mc", "ic"];

/**
 * Kąty kosmogramu (Ascendent/Descendent/Medium Coeli/Immum Coeli) — tak samo
 * jak astro.com pokazuje je w Local Space obok planet: każdy leży na ekliptyce
 * (szerokość 0°), więc liczy się dokładnie tym samym potokiem co planeta.
 * Kolory świadomie z istniejącej palety marki (gold/teal), sparowane w osie:
 * ASC/DESC (oś horyzontu) — jasny/ciemny złoty, MC/IC (oś południka) — jasny/ciemny turkus.
 */
export const ANGLES: Record<AngleId, BodyInfo> = {
  asc: { id: "asc", pl: "Ascendent", symbol: "AS", color: "#e6c48a", nature: 0, vedic: false, motyw: "jak wchodzisz w nowe sytuacje, pierwsze wrażenie" },
  desc: { id: "desc", pl: "Descendent", symbol: "DS", color: "#c39a3b", nature: 0, vedic: false, motyw: "relacje, partnerstwo, czego szukasz u innych" },
  mc: { id: "mc", pl: "Medium Coeli", symbol: "MC", color: "#7fd0d8", nature: 0, vedic: false, motyw: "kariera, status, publiczny wizerunek" },
  ic: { id: "ic", pl: "Immum Coeli", symbol: "IC", color: "#11a7b6", nature: 0, vedic: false, motyw: "dom, korzenie, prywatne zaplecze" },
};

const MOTYW_GRAHA: Record<PlanetId, string> = {
  sun: "autorytet, widoczność, siła woli",
  moon: "emocje, dom, poczucie bezpieczeństwa",
  mars: "działanie, odwaga, konflikt",
  mercury: "myślenie, handel, komunikacja",
  jupiter: "rozwój, sens, obfitość",
  venus: "relacje, przyjemność, estetyka",
  saturn: "dyscyplina, struktura, próba czasu",
  rahu: "ambicja, głód nowego, ryzyko",
  ketu: "odpuszczanie, wnętrze, dystans",
};

/** Wspólny słownik ciał — grahy + planety zewnętrzne. Do mapy i legend. */
export const BODIES: Record<BodyId, BodyInfo> = {
  ...Object.fromEntries(
    PLANET_ORDER.map((id) => [id, {
      id,
      pl: GRAHAS[id].pl,
      symbol: GRAHAS[id].symbol,
      color: GRAHAS[id].color,
      nature: GRAHAS[id].nature,
      vedic: true,
      motyw: MOTYW_GRAHA[id],
    } satisfies BodyInfo]),
  ) as Record<PlanetId, BodyInfo>,
  ...OUTERS,
  ...ANGLES,
};

/**
 * Kolejność na mapie: dziewięć grah, potem planety zewnętrzne. ŚWIADOMIE bez kątów
 * (ANGLE_ORDER) — BODY_ORDER współdzielą też AstroMap/AstroMapGL/DiagramOdczytu
 * (astrokartografia), które mają WŁASNY, osobny koncept linii kątów (MC/IC/ASC/DSC
 * jako południki/krzywe na globie, nie azymuty z jednego punktu) — dopisanie tu
 * ANGLE_ORDER dawałoby im martwe, niedziałające przyciski. Kto potrzebuje kątów
 * Local Space, dokłada ANGLE_ORDER lokalnie (patrz MapaLokalna.tsx).
 */
export const BODY_ORDER: BodyId[] = [...PLANET_ORDER, ...OUTER_ORDER];

export function isOuter(id: BodyId): id is OuterId {
  return id === "uranus" || id === "neptune" || id === "pluto";
}

export function isAngle(id: BodyId): id is AngleId {
  return id === "asc" || id === "desc" || id === "mc" || id === "ic";
}
