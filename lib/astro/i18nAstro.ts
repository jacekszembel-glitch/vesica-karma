import type { Graha, Rasi, Nakshatra } from "./constants";
import { BHAVAS } from "./constants";
import type { BodyInfo } from "./bodies";
import type { Dignity } from "./chart";
import type { PoziomPrzyjazni } from "./shadbala";

/**
 * Fundament pod tlumaczenie kalkulatorow (patrz project_i18n_angielski_plan.md
 * w pamieci) — jedno miejsce, z ktorego kazda kolejna przetlumaczona strona
 * ma czytac nazwe planety/znaku/domu, zamiast siegac po `.pl` wprost.
 * Na razie NIC w aplikacji jeszcze stad nie korzysta (kalkulatory zostaja
 * po polsku do czasu osobnej decyzji) — to celowo tylko warstwa danych.
 */
export type AstroLocale = "pl" | "en";

export function grahaNazwa(g: Graha, locale: AstroLocale): string {
  return locale === "en" ? g.en : g.pl;
}

export function rasiNazwa(r: Rasi, locale: AstroLocale): string {
  return locale === "en" ? r.en : r.pl;
}

export function domNazwa(indexOdZera: number, locale: AstroLocale): string {
  const b = BHAVAS[indexOdZera];
  return locale === "en" ? b.en : b.pl;
}

/** Obszar zycia domu (BHAVAS[i].obszar) — lista tematow po przecinku. */
export function domObszar(indexOdZera: number, locale: AstroLocale): string {
  const b = BHAVAS[indexOdZera];
  return locale === "en" ? b.obszarEn : b.obszar;
}

/** Nazwa nakszatry — po angielsku to standardowa transliteracja sanskrytu
 *  (ta sama, ktora tekst juz ma w polu `.sanskrit`), nie osobne pole `.en`. */
export function nakszatraNazwa(n: Nakshatra, locale: AstroLocale): string {
  return locale === "en" ? n.sanskrit : n.pl;
}

export function nakszatraBostwo(n: Nakshatra, locale: AstroLocale): string {
  return locale === "en" ? n.deityEn : n.deity;
}

export function nakszatraSymbol(n: Nakshatra, locale: AstroLocale): string {
  return locale === "en" ? n.symbolEn : n.symbol;
}

export function nakszatraMotyw(n: Nakshatra, locale: AstroLocale): string {
  return locale === "en" ? n.motywEn : n.motyw;
}

const GANA_NAZWA: Record<Nakshatra["gana"], { pl: string; en: string }> = {
  deva: { pl: "boski (dewa)", en: "divine (deva)" },
  manuszja: { pl: "ludzki (manuszja)", en: "human (manushya)" },
  rakszasa: { pl: "demoniczny (rakszasa)", en: "demonic (rakshasa)" },
};

export function ganaNazwa(gana: Nakshatra["gana"], locale: AstroLocale): string {
  return GANA_NAZWA[gana][locale];
}

export function bodyNazwa(b: BodyInfo, locale: AstroLocale): string {
  return locale === "en" ? b.en : b.pl;
}

export function bodyMotyw(b: BodyInfo, locale: AstroLocale): string {
  return locale === "en" ? b.motywEn : b.motyw;
}

const SILA_ZASIEGU_NAZWA: Record<string, { pl: string; en: string }> = {
  silna: { pl: "silna", en: "strong" },
  średnia: { pl: "średnia", en: "medium" },
  słaba: { pl: "słaba", en: "weak" },
};

/** Etykieta trzystopniowej sily zasiegu linii (silaZasiegu() w astrocarto.ts) —
 *  ZWRACANA WARTOSC silaZasiegu() zostaje zawsze po polsku (uzywana tez do
 *  porownan logicznych typu `n.sila === "silna"`), ta funkcja tlumaczy TYLKO
 *  etykiete pokazywana uzytkownikowi. */
export function silaZasieguNazwa(sila: string, locale: AstroLocale): string {
  return SILA_ZASIEGU_NAZWA[sila]?.[locale] ?? sila;
}

const DIGNITY_NAZWA: Record<Dignity, { pl: string; en: string }> = {
  egzaltacja: { pl: "egzaltacja", en: "exaltation" },
  władanie: { pl: "u siebie", en: "own sign" },
  mulatrikona: { pl: "mulatrikona", en: "mulatrikona" },
  przyjazny: { pl: "znak przyjaciela", en: "friend's sign" },
  neutralny: { pl: "znak neutralny", en: "neutral sign" },
  wrogi: { pl: "znak wroga", en: "enemy's sign" },
  upadek: { pl: "upadek", en: "debilitation" },
};

/** Etykieta godnosci (Dignity) — WARTOSC dignity/signRelacja w danych zostaje
 *  zawsze po polsku (uzywana do porownan logicznych typu `p.dignity === "upadek"`),
 *  ta funkcja tlumaczy TYLKO etykiete pokazywana uzytkownikowi (np. w badge'u). */
export function dignityNazwa(d: Dignity, locale: AstroLocale): string {
  return DIGNITY_NAZWA[d][locale];
}

const TON_NAZWA: Record<"wspierający" | "wymagający" | "mieszany", { pl: string; en: string }> = {
  "wspierający": { pl: "wspierający", en: "supportive" },
  "wymagający": { pl: "wymagający", en: "demanding" },
  "mieszany": { pl: "mieszany", en: "mixed" },
};

/** Etykieta tonu okresu/wladcy — WARTOSC (ton: "wspierajacy"|"wymagajacy"|"mieszany")
 *  uzywana w wielu miejscach do porownan logicznych zostaje po polsku, ta
 *  funkcja tlumaczy TYLKO etykiete pokazywana uzytkownikowi. */
export function tonNazwa(ton: "wspierający" | "wymagający" | "mieszany", locale: AstroLocale): string {
  return TON_NAZWA[ton][locale];
}

const KIERUNKI_EN = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
const KIERUNKI_PL = ["północ", "północny wschód", "wschód", "południowy wschód", "południe", "południowy zachód", "zachód", "północny zachód"];

/** Nazwa kierunku (Local Space) z indeksu 0-7 — patrz kierunekIndexOf() w localspace.ts. */
export function kierunekNazwa(index: number, locale: AstroLocale): string {
  return (locale === "en" ? KIERUNKI_EN : KIERUNKI_PL)[index];
}

const ZYWIOL_NAZWA: Record<Rasi["element"], { pl: string; en: string }> = {
  "ogień": { pl: "ogień", en: "fire" },
  "ziemia": { pl: "ziemia", en: "earth" },
  "powietrze": { pl: "powietrze", en: "air" },
  "woda": { pl: "woda", en: "water" },
};

/** Nazwa zywiolu znaku (RASIS[i].element) — WARTOSC zostaje po polsku (klucz do
 *  lookupow typu ZYWIOL_OPIS), ta funkcja tlumaczy TYLKO wyswietlany tekst. */
export function zywiolNazwa(element: Rasi["element"], locale: AstroLocale): string {
  return ZYWIOL_NAZWA[element][locale];
}

const POZIOM_PRZYJAZNI_NAZWA: Record<PoziomPrzyjazni, { pl: string; en: string }> = {
  "wielki przyjaciel": { pl: "wielki przyjaciel", en: "great friend" },
  "przyjaciel": { pl: "przyjaciel", en: "friend" },
  "neutralny": { pl: "neutralny", en: "neutral" },
  "wróg": { pl: "wróg", en: "enemy" },
  "wielki wróg": { pl: "wielki wróg", en: "great enemy" },
};

/** Etykieta pieciopoziomowej przyjazni (pieciorakaPrzyjazn() w shadbala.ts) — WARTOSC
 *  zostaje po polsku (klucz do PUNKTY_PRZYJAZNI), ta funkcja tlumaczy TYLKO wyswietlany tekst. */
export function poziomPrzyjazniNazwa(p: PoziomPrzyjazni, locale: AstroLocale): string {
  return POZIOM_PRZYJAZNI_NAZWA[p][locale];
}

/** Nazwa wary (dnia tygodnia) — panchang().vara ma pola pl/en, ta funkcja tylko wybiera. */
export function varaNazwa(v: { pl: string; en: string }, locale: AstroLocale): string {
  return locale === "en" ? v.en : v.pl;
}
