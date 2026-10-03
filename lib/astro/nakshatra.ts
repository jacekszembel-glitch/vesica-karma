import { NAKSHATRAS, GRAHAS, type Nakshatra } from "./constants";
import { norm360 } from "./math";
import { grahaNazwa, nakszatraNazwa, nakszatraBostwo, nakszatraSymbol, nakszatraMotyw, ganaNazwa, type AstroLocale } from "./i18nAstro";

/** Szerokość jednej nakszatry: 13°20' = 13,333…° */
export const NAKSHATRA_SPAN = 360 / 27;
/** Szerokość jednej pady: 3°20'. */
export const PADA_SPAN = NAKSHATRA_SPAN / 4;

export interface NakshatraPosition {
  nakshatra: Nakshatra;
  /** Pada 1–4. */
  pada: number;
  /** Ułamek przebytej nakszatry: 0 (początek) – 1 (koniec). */
  fraction: number;
}

/** Nakszatra, pada i stopień przejścia dla długości syderycznej. */
export function nakshatraOf(siderealLongitude: number): NakshatraPosition {
  const lon = norm360(siderealLongitude);
  const index = Math.floor(lon / NAKSHATRA_SPAN);
  const within = lon - index * NAKSHATRA_SPAN;
  return {
    nakshatra: NAKSHATRAS[index],
    pada: Math.floor(within / PADA_SPAN) + 1,
    fraction: within / NAKSHATRA_SPAN,
  };
}

/** Dymek dla konkretnej nakszatry — budowany z danych, które appka już policzyła. */
export function nakshatraTerm(pos: NakshatraPosition, locale: AstroLocale = "pl"): { title: string; sanskrit: string; text: string } {
  const n = pos.nakshatra;
  if (locale === "en") {
    return {
      title: nakszatraNazwa(n, "en"),
      sanskrit: n.sanskrit,
      text: `Ruled by ${grahaNazwa(GRAHAS[n.lord], "en")}, deity ${nakszatraBostwo(n, "en")}, symbol: ${nakszatraSymbol(n, "en")}. `
        + `Core theme: ${nakszatraMotyw(n, "en")}. Nature (gana): ${ganaNazwa(n.gana, "en")}. `
        + `You're in pada (quarter) ${pos.pada} of 4 — each pada shades the same theme a bit differently.`,
    };
  }
  return {
    title: n.pl,
    sanskrit: n.sanskrit,
    text: `Włada nią ${GRAHAS[n.lord].pl}, bóstwo ${n.deity}, symbol: ${n.symbol}. `
      + `Motyw przewodni: ${n.motyw}. Charakter (gana): ${ganaNazwa(n.gana, "pl")}. `
      + `Jesteś w padzie (ćwiartce) ${pos.pada} z 4 — kolejne pady odcieniają ten sam temat inaczej.`,
  };
}

/**
 * Kolor nakszatry wg gany — ta sama trójdzielna konwencja co gdzie indziej
 * w serwisie (zielony/złoty/czerwony). Gana to charakter, nie wyrok: deva
 * (boski) sprzyja łagodnym, spokojnym działaniom, rakszasa (demoniczny) —
 * intensywnym i wymagającym; żadna nie jest „zła" sama w sobie.
 */
export function ganaColor(gana: Nakshatra["gana"]): string {
  if (gana === "deva") return "var(--success)";
  if (gana === "rakszasa") return "var(--warn)";
  return "var(--sand)";
}
