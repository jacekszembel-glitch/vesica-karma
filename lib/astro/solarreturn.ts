import { planetPosition } from "./ephemeris";
import { diffAngle } from "./math";

/**
 * POWRÓT SŁOŃCA (Solar Return) — dokładna chwila, w której Słońce wraca
 * do pozycji, jaką zajmowało w momencie urodzenia.
 *
 * To NIE to samo co data urodzin w kalendarzu: rok zwrotnikowy ma 365,2422 dnia,
 * więc moment powrotu przesuwa się względem zegara nawet o dobę i wypada
 * o różnych godzinach. Tradycja zachodnia czyta z niego ton całego roku życia;
 * my używamy go do pytania „gdzie spędzić urodziny”, bo miejsce zmienia
 * ascendent tej chwili, a więc i rozkład domów na najbliższy rok.
 *
 * Liczymy w zodiaku syderycznym — spójnie z resztą serwisu.
 */

const DAY_MS = 86400000;

/**
 * Znajduje chwilę powrotu Słońca do długości urodzeniowej.
 *
 * Metoda: startujemy od rocznicy kalendarzowej, liczymy różnicę kątową
 * i korygujemy datę proporcjonalnie do prędkości Słońca (ok. 0,9856°/dobę),
 * powtarzając aż różnica zejdzie poniżej sekundy łuku. Zbieżność jest szybka,
 * bo ruch Słońca jest niemal równomierny.
 *
 * @param birthUtc chwila urodzenia (UTC)
 * @param year rok, dla którego szukamy powrotu
 */
export function solarReturn(birthUtc: Date, year: number): Date {
  const target = planetPosition("sun", birthUtc).longitude;

  // start: ta sama data i godzina, ale w szukanym roku
  const guess = new Date(birthUtc.getTime());
  guess.setUTCFullYear(year);

  let t = guess.getTime();
  for (let i = 0; i < 30; i++) {
    const lon = planetPosition("sun", new Date(t)).longitude;
    const delta = diffAngle(target, lon);       // ile stopni brakuje
    if (Math.abs(delta) < 1 / 3600) break;      // dokładność 1 sekundy łuku
    t += (delta / 0.9856474) * DAY_MS;          // średni ruch dobowy Słońca
  }
  return new Date(t);
}

/** Wiek, który kończy się w danym powrocie Słońca. */
export function solarReturnAge(birthUtc: Date, year: number): number {
  return year - birthUtc.getUTCFullYear();
}

/**
 * O ile powrót Słońca odbiega od kalendarzowej rocznicy urodzin.
 * Przydatne, żeby wyjaśnić użytkownikowi, dlaczego data „nie zgadza się”
 * z jego urodzinami.
 */
export function returnOffsetHours(birthUtc: Date, year: number): number {
  const rocznica = new Date(birthUtc.getTime());
  rocznica.setUTCFullYear(year);
  return (solarReturn(birthUtc, year).getTime() - rocznica.getTime()) / 3600000;
}
