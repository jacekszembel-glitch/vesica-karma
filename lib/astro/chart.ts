import { GRAHAS, RASIS, BHAVAS, PLANET_ORDER, type PlanetId } from "./constants";
import { allPlanets, type PlanetPosition } from "./ephemeris";
import { angles, wholeSignHouse, type Angles } from "./houses";
import { nakshatraOf, type NakshatraPosition } from "./nakshatra";
import { vimshottari, activeChain, type DashaPeriod } from "./dasha";
import { ayanamsa } from "./ayanamsa";
import { diffAngle, formatDMS } from "./math";

/** Godność planety w znaku. */
export type Dignity =
  | "egzaltacja" | "władanie" | "mulatrikona" | "przyjazny"
  | "neutralny" | "wrogi" | "upadek";

export interface ChartPlanet extends PlanetPosition {
  sign: number;
  signPl: string;
  degreeInSign: number;
  degreeFormatted: string;
  house: number;
  nakshatra: NakshatraPosition;
  dignity: Dignity;
  /** Relacja z władcą znaku (władanie/przyjazny/wrogi/neutralny) — liczona
   *  zawsze, niezależnie od egzaltacji/upadku/mulatrikony w `dignity`. */
  signRelacja: Dignity;
  combust: boolean;
}

export interface BirthData {
  /** Chwila urodzenia w UTC. */
  date: Date;
  latitude: number;
  longitude: number;
  /** Czy godzina urodzenia jest znana — bez niej nie liczymy lagny i domów. */
  timeKnown: boolean;
}

export interface VedicChart {
  birth: BirthData;
  ayanamsa: number;
  angles: Angles | null;
  planets: Record<PlanetId, ChartPlanet>;
  /** Nakszatra Księżyca — najważniejsza pojedyncza dana w Jyotish. */
  moonNakshatra: NakshatraPosition;
  moonSign: number;
  sunSign: number;
  dashas: DashaPeriod[];
  currentDasha: DashaPeriod[];
  bhavas: typeof BHAVAS;
}

/** Uproszczona tablica przyjaźni naturalnych (Parashara). */
export const FRIENDS: Record<PlanetId, PlanetId[]> = {
  sun: ["moon", "mars", "jupiter"],
  moon: ["sun", "mercury"],
  mars: ["sun", "moon", "jupiter"],
  mercury: ["sun", "venus"],
  jupiter: ["sun", "moon", "mars"],
  venus: ["mercury", "saturn"],
  saturn: ["mercury", "venus"],
  rahu: ["venus", "saturn"],
  ketu: ["mars", "jupiter"],
};
export const ENEMIES: Record<PlanetId, PlanetId[]> = {
  sun: ["venus", "saturn"],
  moon: [],
  mars: ["mercury"],
  mercury: ["moon"],
  jupiter: ["mercury", "venus"],
  venus: ["sun", "moon"],
  saturn: ["sun", "moon", "mars"],
  rahu: ["sun", "moon"],
  ketu: ["sun", "moon"],
};

/** Relacja z władcą znaku — władanie/przyjaźń/wrogość/neutralność. Liczona
 *  zawsze, niezależnie od tego, czy planeta jest w egzaltacji lub upadku. */
export function signRelacja(id: PlanetId, sign: number): Dignity {
  const g = GRAHAS[id];
  if (g.ownSigns.includes(sign)) return "władanie";
  const lord = RASIS[sign].lord;
  if (FRIENDS[id].includes(lord)) return "przyjazny";
  if (ENEMIES[id].includes(lord)) return "wrogi";
  return "neutralny";
}

/**
 * Kolejność ma znaczenie: egzaltacja i upadek biorą cały znak, potem sprawdzamy
 * mulatrikonę (wycinek stopni), a dopiero na końcu zwykłe władanie i relację
 * z władcą znaku.
 */
export function dignityOf(id: PlanetId, sign: number, degreeInSign: number): Dignity {
  const g = GRAHAS[id];
  if (g.exaltation?.sign === sign) return "egzaltacja";
  if (g.debilitation?.sign === sign) return "upadek";
  const mt = g.mulatrikona;
  if (mt && mt.sign === sign && degreeInSign >= mt.from && degreeInSign < mt.to) return "mulatrikona";
  return signRelacja(id, sign);
}

/** Buduje pełny kosmogram wedyjski (D1 Rasi). */
export function buildChart(birth: BirthData): VedicChart {
  const positions = allPlanets(birth.date);
  const ang = birth.timeKnown ? angles(birth.date, birth.latitude, birth.longitude) : null;

  const sunLon = positions.sun.longitude;
  const planets = {} as Record<PlanetId, ChartPlanet>;

  for (const id of PLANET_ORDER) {
    const p = positions[id];
    const sign = Math.floor(p.longitude / 30);
    const degreeInSign = p.longitude - sign * 30;
    const g = GRAHAS[id];
    const combust =
      id !== "sun" && g.combustionOrb !== undefined
        ? Math.abs(diffAngle(p.longitude, sunLon)) < g.combustionOrb
        : false;
    planets[id] = {
      ...p,
      sign,
      signPl: RASIS[sign].pl,
      degreeInSign,
      degreeFormatted: formatDMS(degreeInSign),
      house: ang ? wholeSignHouse(p.longitude, ang.lagnaSign) : 0,
      nakshatra: nakshatraOf(p.longitude),
      dignity: dignityOf(id, sign, degreeInSign),
      signRelacja: signRelacja(id, sign),
      combust,
    };
  }

  const dashas = vimshottari(positions.moon.longitude, birth.date, 3);

  return {
    birth,
    ayanamsa: ayanamsa(birth.date),
    angles: ang,
    planets,
    moonNakshatra: planets.moon.nakshatra,
    moonSign: planets.moon.sign,
    sunSign: planets.sun.sign,
    dashas,
    currentDasha: activeChain(dashas, new Date()),
    bhavas: BHAVAS,
  };
}
