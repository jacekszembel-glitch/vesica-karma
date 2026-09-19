import { SiderealTime } from "astronomy-engine";
import { atan2d, cos, norm360, sin, tan, obliquity } from "./math";
import { toSidereal } from "./ayanamsa";

/**
 * Ascendent (lagna) i domy.
 * System domów: Whole Sign (domyślny w Jyotish) — dom 1 to cały znak,
 * w którym wypada lagna.
 */

/** Lokalny czas gwiazdowy w stopniach (0–360). */
export function localSiderealDegrees(date: Date, longitudeEast: number): number {
  // SiderealTime zwraca GAST w godzinach.
  const gastHours = SiderealTime(date);
  return norm360(gastHours * 15 + longitudeEast);
}

/**
 * Tropikalna długość ascendentu, klasyczna formuła sferyczna:
 * Asc = atan2( cos(RAMC), -( sin(RAMC)·cos(ε) + tan(φ)·sin(ε) ) )
 */
export function tropicalAscendant(date: Date, latitude: number, longitudeEast: number): number {
  const ramc = localSiderealDegrees(date, longitudeEast);
  const eps = obliquity(date);
  const asc = atan2d(
    cos(ramc),
    -(sin(ramc) * cos(eps) + tan(latitude) * sin(eps)),
  );
  return norm360(asc);
}

/** Tropikalna długość Medium Coeli (MC). */
export function tropicalMC(date: Date, longitudeEast: number): number {
  const ramc = localSiderealDegrees(date, longitudeEast);
  const eps = obliquity(date);
  return norm360(atan2d(sin(ramc), cos(ramc) * cos(eps)));
}

export interface Angles {
  /** Syderyczna długość ascendentu. */
  ascendant: number;
  /** Syderyczna długość MC. */
  mc: number;
  /** Indeks znaku lagny (0 = Mesza). */
  lagnaSign: number;
}

export function angles(date: Date, latitude: number, longitudeEast: number): Angles {
  const asc = toSidereal(tropicalAscendant(date, latitude, longitudeEast), date);
  const mc = toSidereal(tropicalMC(date, longitudeEast), date);
  return { ascendant: asc, mc, lagnaSign: Math.floor(asc / 30) };
}

/** Numer domu (1–12) dla długości syderycznej w systemie Whole Sign. */
export function wholeSignHouse(longitude: number, lagnaSign: number): number {
  const sign = Math.floor(norm360(longitude) / 30);
  return ((sign - lagnaSign + 12) % 12) + 1;
}
