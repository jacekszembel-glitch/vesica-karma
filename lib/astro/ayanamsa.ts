import { julianCenturies } from "./math";

/**
 * Ayanamsa — przesunięcie między zodiakiem tropikalnym a syderycznym.
 *
 * Używamy ayanamsy Lahiri (Chitrapaksha) — oficjalnej w Indiach i stosowanej
 * przez ok. 90% astrologów wedyjskich.
 *
 * Metoda: zakotwiczenie w opublikowanej wartości Lahiri na 1.01.2000 00:00 UT
 * (23°51'11" = 23,853056°) i narastanie zgodnie z ogólną precesją w długości
 * wg modelu IAU 2006. Rozbieżność względem Swiss Ephemeris pozostaje w zakresie
 * kilku sekund kątowych w przedziale ±150 lat — przy szerokości pady 3°20'
 * (12 000") jest to nieistotne interpretacyjnie.
 */

/** Wartość Lahiri w epoce odniesienia (1.01.2000 00:00 UT), w stopniach. */
const AYANAMSA_2000 = 23.853056;

/** Wiek juliański epoki odniesienia względem J2000.0 (różnica pół doby). */
const T_REF = -0.5 / 36525;

/**
 * Ogólna precesja w długości, narastająco od J2000.0, w sekundach kątowych.
 * Model IAU 2006 (Capitaine i in.).
 */
function generalPrecession(T: number): number {
  return (
    5028.796195 * T +
    1.1054348 * T * T +
    0.00007964 * T * T * T -
    0.000023857 * T * T * T * T -
    0.0000000383 * T * T * T * T * T
  );
}

const P_REF = generalPrecession(T_REF);

/** Ayanamsa Lahiri dla podanej chwili, w stopniach. */
export function ayanamsa(date: Date): number {
  const T = julianCenturies(date);
  return AYANAMSA_2000 + (generalPrecession(T) - P_REF) / 3600;
}

/** Zamienia długość tropikalną na syderyczną (Lahiri). */
export function toSidereal(tropicalLongitude: number, date: Date): number {
  const x = (tropicalLongitude - ayanamsa(date)) % 360;
  return x < 0 ? x + 360 : x;
}
