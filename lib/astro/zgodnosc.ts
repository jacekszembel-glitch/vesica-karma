import type { PlanetId } from "./constants";
import { PLANET_ORDER, RASIS } from "./constants";
import type { VedicChart } from "./chart";
import { ocenaWladcy, aspektuje } from "./sila";
import { atmakaraka, jogakaraka } from "./karaki";
import { reduce, type NumerologyResult } from "./numerology";
import { wykryteJogiPosortowane } from "./yogas";
import type { TypDloni } from "../hiromancja";

/**
 * ZGODNOŚĆ TRZECH SYSTEMÓW — wspólny język to dziewięć planet.
 *
 *  - astrologia: WYRAZISTOŚĆ planety — jak mocno kształtuje TEN horoskop (władca
 *    ascendentu i znaku Księżyca, atmakaraka, planety w ascendencie i na osiach,
 *    aspekt na ascendent, własny znak/egzaltacja, bieżąca mahadasza). To to samo
 *    pytanie, które zadają numerologia (które planety wracają w dacie i imieniu)
 *    i dłoń (które obszary są rozwinięte) — a NIE jakość/godność planety, bo ta
 *    odpowiada na inne pytanie i z nimi się nie porównuje. Dziewięć planet
 *    od najwyrazistszej: trzy pierwsze „mocne”, trzy ostatnie „słabe”;
 *  - numerologia wedyjska: cyfra 1–9 = planeta; mocna, gdy jej cyfra to Mulank,
 *    Bhagyank, liczba imienia albo powtarza się w dacie (Lo Shu), słaba, gdy
 *    w ogóle jej nie ma;
 *  - chiromancja: wzgórek, palec i linia planety z odczytu dłoni (porównane między
 *    sobą). Rahu i Ketu — wzgórki z chiromancji indyjskiej (Hasta Samudrika):
 *    Rahu w środku dłoni (równina Marsa), Ketu nad nadgarstkiem między Wenus a Księżycem.
 *
 * Do tego MOSTY dłoń ↔ horoskop: konkretny znak w dłoni (X, gwiazda, kwadrat…)
 * sprawdzony z konkretnym układem planety w horoskopie — patrz mostyDlonHoroskop.
 *
 * Wszystko liczone tutaj, za każdym razem tak samo — żadnej oceny „na oko”.
 * Spójność porównujemy z tym, ile zgodności dałby sam przypadek (ten sam
 * rozkład ocen w każdym systemie, tylko przetasowany między planetami).
 */

export type Ocena = 1 | 0 | -1;
export type SystemZgodnosci = "astrologia" | "numerologia" | "chiromancja";
export const SYSTEMY_ZGODNOSCI: SystemZgodnosci[] = ["astrologia", "numerologia", "chiromancja"];

/** Oceny planet w jednym systemie; `null` = system nie mówi nic o tej planecie. */
export type OcenyPlanet = Record<PlanetId, Ocena | null>;

/** Miejsce znaku w dłoni: wzgórek planety albo czworobok (między linią serca a głowy). */
export type MiejsceZnaku = PlanetId | "czworobok";
export type RodzajZnaku = "x" | "gwiazda" | "kwadrat" | "trojkat" | "kratka" | "wyspa" | "krzyz_mistyczny";
export type Reka = "wiodaca" | "bierna";

export interface ZnakDloni {
  miejsce: MiejsceZnaku;
  znak: RodzajZnaku;
  reka: Reka;
  pewnosc: "wyrazny" | "delikatny";
  /** „ai” = zauważone przez AI na zdjęciach; „osoba” = zgłoszone przez osobę (widzi na żywo). */
  zrodlo: "ai" | "osoba";
  /** Przy znaku zgłoszonym przez osobę: czy AI widzi go na zdjęciach. */
  aiWidzi?: "tak" | "mozliwe" | "nie";
}

/** Znak, który osoba sama widzi na swojej dłoni i zgłasza przed odczytem. */
export interface ZnakWlasny { reka: Reka; miejsce: MiejsceZnaku; znak: RodzajZnaku }

export const MIEJSCA_ZNAKOW: { id: MiejsceZnaku; nazwa: string }[] = [
  { id: "jupiter", nazwa: "wzgórek Jowisza (pod wskazującym)" },
  { id: "saturn", nazwa: "wzgórek Saturna (pod środkowym)" },
  { id: "sun", nazwa: "wzgórek Słońca (pod serdecznym)" },
  { id: "mercury", nazwa: "wzgórek Merkurego (pod małym)" },
  { id: "venus", nazwa: "wzgórek Wenus (nasada kciuka)" },
  { id: "moon", nazwa: "wzgórek Księżyca (krawędź dłoni)" },
  { id: "mars", nazwa: "wzgórek Marsa" },
  { id: "rahu", nazwa: "środek dłoni (Rahu)" },
  { id: "ketu", nazwa: "nad nadgarstkiem (Ketu)" },
  { id: "czworobok", nazwa: "między linią serca a głowy" },
];
export const RODZAJE_ZNAKOW_NAZWY: { id: RodzajZnaku; nazwa: string }[] = [
  { id: "x", nazwa: "X (krzyż)" },
  { id: "krzyz_mistyczny", nazwa: "krzyż mistyczny" },
  { id: "gwiazda", nazwa: "gwiazda" },
  { id: "trojkat", nazwa: "trójkąt" },
  { id: "kwadrat", nazwa: "kwadrat" },
  { id: "kratka", nazwa: "kratka" },
  { id: "wyspa", nazwa: "wyspa" },
];

/** Zgłoszone znaki → ZnakDloni ze źródłem „osoba” i odpowiedzią AI (jeśli była). */
export function znakiWlasneDoDloni(wlasne: ZnakWlasny[], odpowiedzi?: ("tak" | "mozliwe" | "nie")[]): ZnakDloni[] {
  return wlasne.map((w, i) => ({
    miejsce: w.znak === "krzyz_mistyczny" ? "czworobok" : w.miejsce,
    znak: w.znak, reka: w.reka, pewnosc: "wyrazny", zrodlo: "osoba", aiWidzi: odpowiedzi?.[i],
  }));
}

export type StanLinii = "wyrazna" | "odcinkowa" | "slaba" | "brak";
export type LiniaMostu = "losu" | "slonca" | "podrozy" | "relacji";
/** Wszystkie linie zapisywane w bloku danych (mosty używają czterech, wspólne tematy — wszystkich). */
export type LiniaDloni = LiniaMostu | "serca" | "glowy" | "zycia" | "intuicji" | "merkurego" | "pas_wenus" | "pierscien_salomona" | "marsa";
export const LINIE_DLONI: LiniaDloni[] = [
  "losu", "slonca", "podrozy", "relacji", "serca", "glowy", "zycia", "intuicji", "merkurego", "pas_wenus", "pierscien_salomona", "marsa",
];

/** Zapis dłoni w liczbach — z bloku danych odczytu AI (albo wyłuskany z tekstu). */
export interface DlonWLiczbach {
  planety: Partial<Record<PlanetId, Ocena | null>>;
  zywiol: TypDloni | null;
  /** „odczyt” = AI podało dane wprost; „tekst” = wyłuskane ze starszego odczytu. */
  zrodlo: "odczyt" | "tekst";
  znaki?: ZnakDloni[];
  linie?: Partial<Record<LiniaDloni, StanLinii | null>>;
  /** Znaki zgłoszone przez osobę przed odczytem, z odpowiedzią AI, czy widzi je na zdjęciach. */
  wlasne?: ZnakDloni[];
  /** Surowe odpowiedzi AI na zgłoszone znaki (kolejność jak przy wysyłce) — scalane w HiromancjaOdczyt. */
  odpowiedziNaZgloszone?: ("tak" | "mozliwe" | "nie")[];
  /** Ręka bierna osobno (planety i linie powyżej = ręka wiodąca) — od odczytów z 2026-10-07; starsze jej nie mają. */
  bierna?: { planety: Partial<Record<PlanetId, Ocena | null>>; linie: Partial<Record<LiniaDloni, StanLinii | null>> };
}

const CYFRA_PLANETA: Record<number, PlanetId> = {
  1: "sun", 2: "moon", 3: "jupiter", 4: "rahu", 5: "mercury",
  6: "venus", 7: "ketu", 8: "saturn", 9: "mars",
};
export const PLANETA_CYFRA: Record<PlanetId, number> = Object.fromEntries(
  Object.entries(CYFRA_PLANETA).map(([c, p]) => [p, Number(c)]),
) as Record<PlanetId, number>;

/** Gdzie planeta „mieszka” w dłoni — do podpisów w tabeli. */
export const MIEJSCE_W_DLONI: Record<PlanetId, string | null> = {
  sun: "wzgórek i palec serdeczny",
  moon: "wzgórek Księżyca",
  mars: "wzgórki Marsa",
  mercury: "wzgórek i mały palec",
  jupiter: "wzgórek i palec wskazujący",
  venus: "wzgórek u nasady kciuka",
  saturn: "wzgórek i palec środkowy",
  rahu: "środek dłoni (chiromancja indyjska)",
  ketu: "nad nadgarstkiem, między Wenus a Księżycem (chiromancja indyjska)",
};

const GODNOSC_WLASNA = new Set(["egzaltacja", "władanie", "mulatrikona"]);

/** Wyrazistość planety w horoskopie — klasyczne wyznaczniki „kto rządzi tą mapą”. */
export function wyrazistoscPlanety(chart: VedicChart, p: PlanetId, jogi = wykryteJogiPosortowane(chart)): { punkty: number; powody: string[] } {
  const pl = chart.planets[p];
  const powody: string[] = [];
  let punkty = 0;
  const dodaj = (w: number, powod: string) => { punkty += w; powody.push(powod); };
  const lagna = chart.angles?.lagnaSign ?? null;
  if (lagna !== null) {
    if (RASIS[lagna].lord === p) dodaj(3, "władca ascendentu");
    // jogakaraka — władca kendry i trikony naraz, funkcjonalnie najlepsza planeta tej lagny
    if (jogakaraka(lagna) === p) dodaj(3, "jogakaraka (władca kendry i trikony)");
    else {
      // władca trikony (5., 9.) albo 10. domu — planeta z ważną rolą w tym horoskopie
      const wladane = RASIS.filter((r) => r.lord === p).map((r) => ((r.index - lagna + 12) % 12) + 1);
      const rola = wladane.filter((d) => [5, 9, 10].includes(d));
      if (rola.length) dodaj(1, `władca ${rola.join(". i ")}. domu`);
    }
    if (pl.house === 1) dodaj(3, "w ascendencie");
    else if ([4, 7, 10].includes(pl.house)) dodaj(1.5, `na osi (${pl.house}. dom)`);
    else if ([5, 9].includes(pl.house)) dodaj(1, `w trikonie (${pl.house}. dom)`);
    if (p !== "moon" && aspektuje(chart, p, lagna)) dodaj(1, "aspektuje ascendent");
  }
  if (RASIS[chart.moonSign].lord === p) dodaj(2, "władca znaku Księżyca");
  if (p !== "moon" && pl.sign === chart.moonSign) dodaj(1, "razem z Księżycem");
  if (p === "sun" || p === "moon") dodaj(1, "światło (Słońce i Księżyc to dodatkowe ascendenty)");
  if (atmakaraka(chart).planeta === p) dodaj(2, "atmakaraka");
  if (GODNOSC_WLASNA.has(pl.dignity)) dodaj(1.5, pl.dignity);
  if (chart.currentDasha[0]?.lord === p) dodaj(1, "bieżąca mahadasza");
  // siła planety (godność, układy, aspekty — ta sama ocena co w Predyspozycjach); dodatnia
  // wzmacnia wyrazistość, ujemna ją osłabia
  const sila = ocenaWladcy(chart, p, jogi).punkty;
  punkty += sila * 0.5;
  powody.push(`siła planety ${sila >= 0 ? "+" : ""}${sila.toFixed(1)}`);
  return { punkty, powody };
}

export function ocenyAstrologii(chart: VedicChart): { oceny: OcenyPlanet; punkty: Record<PlanetId, number> } {
  const jogi = wykryteJogiPosortowane(chart);
  const punkty = Object.fromEntries(
    PLANET_ORDER.map((p) => [p, wyrazistoscPlanety(chart, p, jogi).punkty]),
  ) as Record<PlanetId, number>;
  const kolejnosc = [...PLANET_ORDER].sort((a, b) => punkty[b] - punkty[a]);
  const oceny = Object.fromEntries(
    kolejnosc.map((p, i) => [p, i < 3 ? 1 : i >= 6 ? -1 : 0]),
  ) as OcenyPlanet;
  return { oceny, punkty };
}

export interface PowodNumerologii { mulank: boolean; bhagyank: boolean; imie: boolean; wDacie: number }

export function ocenyNumerologii(num: NumerologyResult): { oceny: OcenyPlanet; powody: Record<PlanetId, PowodNumerologii> } {
  const imie = num.expression != null ? reduce(num.expression, false) : null;
  const oceny = {} as OcenyPlanet;
  const powody = {} as Record<PlanetId, PowodNumerologii>;
  for (const p of PLANET_ORDER) {
    const c = PLANETA_CYFRA[p];
    const powod = {
      mulank: num.birthdayRoot === c,
      bhagyank: num.destiny === c,
      imie: imie === c,
      wDacie: num.loShuGrid[c] ?? 0,
    };
    powody[p] = powod;
    const rdzen = powod.mulank || powod.bhagyank || powod.imie;
    oceny[p] = rdzen || powod.wDacie >= 3 ? 1 : powod.wDacie === 0 ? -1 : 0;
  }
  return { oceny, powody };
}

export function ocenyChiromancji(dlon: DlonWLiczbach | null): OcenyPlanet {
  const oceny = {} as OcenyPlanet;
  for (const p of PLANET_ORDER) {
    const o = MIEJSCE_W_DLONI[p] ? dlon?.planety[p] : null;
    oceny[p] = o === 1 || o === 0 || o === -1 ? o : null;
  }
  return oceny;
}

/* ---------- blok danych w odczycie dłoni ---------- */

const ZNACZNIK = "<!--DANE";
const KLUCZE_PLANET: Record<string, PlanetId> = {
  slonce: "sun", ksiezyc: "moon", mars: "mars", merkury: "mercury",
  jowisz: "jupiter", wenus: "venus", saturn: "saturn", rahu: "rahu", ketu: "ketu",
};
const RODZAJE_ZNAKOW: RodzajZnaku[] = ["x", "gwiazda", "kwadrat", "trojkat", "kratka", "wyspa", "krzyz_mistyczny"];
const STANY_LINII: StanLinii[] = ["wyrazna", "odcinkowa", "slaba", "brak"];

/** Klucz z odpowiedzi AI („jowisz”, „czworobok”…) → miejsce znaku. */
export function miejsceZKlucza(k: string): MiejsceZnaku | null {
  return k === "czworobok" ? "czworobok" : KLUCZE_PLANET[k] ?? null;
}

export const NAZWY_LINII: Record<LiniaDloni, string> = {
  zycia: "linia życia", glowy: "linia głowy", serca: "linia serca", losu: "linia losu", slonca: "linia Słońca",
  merkurego: "linia Merkurego", intuicji: "linia intuicji", podrozy: "linie podróży", relacji: "linie relacji",
  pas_wenus: "pas Wenus", pierscien_salomona: "pierścień Salomona", marsa: "linia Marsa (siostrzana)",
};

/** Znak z bloku danych → ZnakDloni (albo null, gdy niepełny). */
function znakZDanych(z: Record<string, unknown>, zrodlo: "ai" | "osoba"): ZnakDloni | null {
  const miejsce = z.wzgorek === "czworobok" ? "czworobok" : KLUCZE_PLANET[String(z.wzgorek)];
  const znak = String(z.znak) as RodzajZnaku;
  if (!miejsce || !RODZAJE_ZNAKOW.includes(znak)) return null;
  return {
    miejsce, znak,
    reka: z.reka === "bierna" ? "bierna" : "wiodaca",
    pewnosc: z.pewnosc === "delikatny" ? "delikatny" : "wyrazny",
    zrodlo,
  };
}

/** Oddziela tekst odczytu od ukrytego bloku danych na końcu (AI dopisuje go po Markdownie). */
export function rozdzielOdczytDloni(surowy: string): { tekst: string; dane: DlonWLiczbach | null } {
  const i = surowy.indexOf(ZNACZNIK);
  if (i < 0) return { tekst: surowy, dane: null };
  const tekst = surowy.slice(0, i).trimEnd();
  const koniec = surowy.indexOf("-->", i);
  const json = surowy.slice(i + ZNACZNIK.length, koniec < 0 ? undefined : koniec).trim();
  try {
    const d = JSON.parse(json) as {
      planety?: Record<string, unknown>; zywiol?: unknown;
      znaki?: Record<string, unknown>[]; linie?: Record<string, unknown>;
      deklaracje?: { nr?: number; widze?: string }[];
      bierna?: { planety?: Record<string, unknown>; linie?: Record<string, unknown> };
    };
    const planetyZ = (src?: Record<string, unknown>) => {
      const out: Partial<Record<PlanetId, Ocena | null>> = {};
      for (const [k, v] of Object.entries(src ?? {})) {
        const p = KLUCZE_PLANET[k];
        if (p) out[p] = v === 1 || v === 0 || v === -1 ? v : null;
      }
      return out;
    };
    const linieZ = (src?: Record<string, unknown>) => {
      const out: Partial<Record<LiniaDloni, StanLinii | null>> = {};
      for (const l of LINIE_DLONI) {
        const v = String(src?.[l]);
        out[l] = STANY_LINII.includes(v as StanLinii) ? (v as StanLinii) : null;
      }
      return out;
    };
    const planety = planetyZ(d.planety);
    const zywiol = ["ziemia", "powietrze", "ogien", "woda"].includes(String(d.zywiol)) ? (d.zywiol as TypDloni) : null;
    const znaki = (Array.isArray(d.znaki) ? d.znaki : [])
      .map((z) => znakZDanych(z, "ai")).filter((z): z is ZnakDloni => !!z);
    const linie = linieZ(d.linie);
    const bierna = d.bierna && typeof d.bierna === "object" ? { planety: planetyZ(d.bierna.planety), linie: linieZ(d.bierna.linie) } : undefined;
    const odp = Array.isArray(d.deklaracje) ? d.deklaracje : [];
    const odpowiedziNaZgloszone: ("tak" | "mozliwe" | "nie")[] = [];
    for (const o of odp) {
      const w = o.widze === "tak" || o.widze === "mozliwe" ? o.widze : "nie";
      if (typeof o.nr === "number" && o.nr >= 1 && o.nr <= 20) odpowiedziNaZgloszone[o.nr - 1] = w;
    }
    return { tekst, dane: { planety, zywiol, zrodlo: "odczyt", znaki, linie, odpowiedziNaZgloszone, ...(bierna ? { bierna } : {}) } };
  } catch {
    return { tekst, dane: null };
  }
}

/** Słowa, po których w zdaniu o wzgórku poznać jego stan. */
const WYPUKLY = /wypuk|rozwini|pełn|wydatn|wyraźnie zaznaczon|mocn|uniesion|silnie/;
const PLASKI = /płask|słabo zaznacz|mało widoczn|zapadni|niewyraźn|słab/;
const NAZWY_WZGORKOW: [PlanetId, RegExp][] = [
  ["sun", /(słońca|apolla|apollina)/],
  ["moon", /księżyca/],
  ["mars", /marsa/],
  ["mercury", /merkurego/],
  ["jupiter", /jowisza/],
  ["venus", /wenus/],
  ["saturn", /saturna/],
];

/**
 * Starszy odczyt (bez bloku danych): wyłuskanie stanu wzgórków ze zdań tekstu.
 * Bierzemy tylko zdania, które wprost mówią o wzgórku danej planety — reszta
 * zostaje „brak danych”, zamiast zgadywać.
 */
export function dlonZTekstu(tekst: string): DlonWLiczbach | null {
  const zdania = tekst.toLowerCase().split(/(?<=[.!?\n])\s+/);
  const planety: Partial<Record<PlanetId, Ocena | null>> = {};
  for (const [p, nazwa] of NAZWY_WZGORKOW) {
    let plus = 0, minus = 0;
    for (const z of zdania) {
      if (!/wzg[óo]r/.test(z) || !nazwa.test(z)) continue;
      if (PLASKI.test(z)) minus++;
      else if (WYPUKLY.test(z)) plus++;
    }
    if (plus || minus) planety[p] = plus > minus ? 1 : minus > plus ? -1 : 0;
  }
  const t = tekst.toLowerCase();
  const zywiol: TypDloni | null =
    /dło[ńn]\w* ziemi/.test(t) ? "ziemia" : /dło[ńn]\w* powietrza/.test(t) ? "powietrze"
      : /dło[ńn]\w* ognia/.test(t) ? "ogien" : /dło[ńn]\w* wody/.test(t) ? "woda" : null;
  if (!Object.keys(planety).length && !zywiol) return null;
  return { planety, zywiol, zrodlo: "tekst" };
}

/* ---------- porównanie ---------- */

export type Rodzaj = "zgodnosc3" | "zgodnosc2" | "roznica" | "mieszane" | "jeden";

export interface PlanetaPorownania {
  planeta: PlanetId;
  oceny: Record<SystemZgodnosci, Ocena | null>;
  rodzaj: Rodzaj;
  /** Które systemy uznają planetę za mocną — do diagramu Vesica. */
  mocnaW: SystemZgodnosci[];
  /** Przy „zgodne ×2” z trzema ocenami: system, który ocenia inaczej niż dwa pozostałe. */
  odstaje?: SystemZgodnosci;
}

export interface WynikZgodnosci {
  planety: PlanetaPorownania[];
  /** Odsetek zgodnych par ocen (0–1) i ile dałby przypadek. */
  spojnosc: number;
  przypadek: number;
  par: number;
  /** Zgodność każdego systemu z dwoma pozostałymi (0–1, null gdy brak porównań). */
  systemy: Record<SystemZgodnosci, { zgodnosc: number | null; przypadek: number | null; par: number }>;
  zywioly: { dlon: TypDloni | null; lagna: string | null; ksiezyc: string };
}

function rozklad(oceny: (Ocena | null)[]): Map<Ocena, number> {
  const m = new Map<Ocena, number>();
  const znane = oceny.filter((o): o is Ocena => o !== null);
  for (const o of znane) m.set(o, (m.get(o) ?? 0) + 1 / znane.length);
  return m;
}

const ZYWIOL_RASI: Record<string, TypDloni> = { "ogień": "ogien", ziemia: "ziemia", powietrze: "powietrze", woda: "woda" };

export function porownajSystemy(
  chart: VedicChart,
  num: NumerologyResult,
  dlon: DlonWLiczbach | null,
): WynikZgodnosci {
  const oc: Record<SystemZgodnosci, OcenyPlanet> = {
    astrologia: ocenyAstrologii(chart).oceny,
    numerologia: ocenyNumerologii(num).oceny,
    chiromancja: ocenyChiromancji(dlon),
  };

  const planety: PlanetaPorownania[] = PLANET_ORDER.map((p) => {
    const oceny = { astrologia: oc.astrologia[p], numerologia: oc.numerologia[p], chiromancja: oc.chiromancja[p] };
    const znane = Object.values(oceny).filter((o): o is Ocena => o !== null);
    const rozne = new Set(znane);
    let rodzaj: Rodzaj;
    let odstaje: SystemZgodnosci | undefined;
    if (znane.length < 2) rodzaj = "jeden";
    else if (rozne.size === 1) rodzaj = znane.length === 3 ? "zgodnosc3" : "zgodnosc2";
    // trzy oceny, dwie równe — większość się zgadza; trzeci system zapisujemy jako odstający
    // (np. Wenus: astrologia i dłoń „mocna”, numerologia „słaba” → zgodne ×2, numerologia inaczej)
    else if (znane.length === 3 && rozne.size === 2) {
      rodzaj = "zgodnosc2";
      odstaje = SYSTEMY_ZGODNOSCI.find((s) => znane.filter((o) => o === oceny[s]).length === 1);
    }
    // wszystkie trzy różne (mocna, przeciętna, słaba) albo dwa systemy przeciwne
    else if (rozne.has(1) && rozne.has(-1)) rodzaj = "roznica";
    else rodzaj = "mieszane";
    const mocnaW = SYSTEMY_ZGODNOSCI.filter((s) => oceny[s] === 1);
    return { planeta: p, oceny, rodzaj, mocnaW, odstaje };
  });

  // pary systemów: zgodność rzeczywista i oczekiwana z przypadku (iloczyn rozkładów).
  // Oceny są stopniowane, więc zgodność też: ta sama ocena = 1, sąsiednia = ½, przeciwna = 0.
  // Przypadek liczony tą samą miarą — porównanie pozostaje uczciwe.
  const zgodnoscOcen = (x: Ocena, y: Ocena) => 1 - Math.abs(x - y) / 2;
  const pary: [SystemZgodnosci, SystemZgodnosci][] = [
    ["astrologia", "numerologia"], ["astrologia", "chiromancja"], ["numerologia", "chiromancja"],
  ];
  const wynikPary = pary.map(([a, b]) => {
    const wspolne = PLANET_ORDER.filter((p) => oc[a][p] !== null && oc[b][p] !== null);
    const zgodne = wspolne.reduce((s, p) => s + zgodnoscOcen(oc[a][p]!, oc[b][p]!), 0);
    const ra = rozklad(wspolne.map((p) => oc[a][p]));
    const rb = rozklad(wspolne.map((p) => oc[b][p]));
    let szansa = 0;
    for (const [oa, pa] of ra) for (const [ob, pb] of rb) szansa += pa * pb * zgodnoscOcen(oa, ob);
    return { a, b, n: wspolne.length, zgodne, oczekiwane: szansa * wspolne.length };
  });

  const par = wynikPary.reduce((s, w) => s + w.n, 0);
  const spojnosc = par ? wynikPary.reduce((s, w) => s + w.zgodne, 0) / par : 0;
  const przypadek = par ? wynikPary.reduce((s, w) => s + w.oczekiwane, 0) / par : 0;

  const systemy = Object.fromEntries(SYSTEMY_ZGODNOSCI.map((s) => {
    const jego = wynikPary.filter((w) => w.a === s || w.b === s);
    const n = jego.reduce((x, w) => x + w.n, 0);
    return [s, {
      zgodnosc: n ? jego.reduce((x, w) => x + w.zgodne, 0) / n : null,
      przypadek: n ? jego.reduce((x, w) => x + w.oczekiwane, 0) / n : null,
      par: n,
    }];
  })) as WynikZgodnosci["systemy"];

  const lagna = chart.angles ? RASIS[chart.angles.lagnaSign].element : null;
  return {
    planety, spojnosc, przypadek, par, systemy,
    zywioly: {
      dlon: dlon?.zywiol ?? null,
      lagna: lagna ? ZYWIOL_RASI[lagna] : null,
      ksiezyc: ZYWIOL_RASI[RASIS[chart.moonSign].element],
    },
  };
}

/* ---------- MOSTY dłoń ↔ horoskop ---------- */

/**
 * Klasyczne znaczenia znaków w dłoni sprawdzone z układem TEJ planety w horoskopie:
 *  - X / wyspa na wzgórku = próba, przeszkoda w temacie planety
 *      ↔ planeta w 6., 8. lub 12. domu, w upadku, spalona albo w znaku ze złoczyńcą;
 *  - gwiazda = błysk, wyróżnienie ↔ egzaltacja / własny znak / kendra / trikona;
 *  - kwadrat = ochrona ↔ Jowisz w tym samym znaku albo aspektuje planetę;
 *  - trójkąt = talent ↔ planeta w 1., 5. albo 9. domu;
 *  - kratka = rozproszenie ↔ co najmniej dwa złoczyńce (Saturn, Mars, Rahu, Ketu) na planecie;
 *  - krzyż mistyczny = intuicja, duchowość ↔ Jowisz albo Ketu w 1., 5., 9. lub 12. domu
 *    albo zajęty 12. dom;
 * oraz linie: losu ↔ Saturn i 10. dom, Słońca ↔ Słońce i 10./5. dom, podróży ↔ 9./12. dom i Rahu,
 * relacji ↔ 7. dom i Wenus.
 * Przy znakach na wzgórkach podajemy też BAZĘ: ile z 9 planet w tym horoskopie spełnia ten sam
 * warunek — żeby było widać, czy trafienie coś znaczy, czy zdarzyłoby się i tak.
 */

export interface Most {
  dlon: string;
  warunek: string;
  /** true = horoskop mówi to samo, false = co innego, null = częściowo (linia odcinkowa/słaba) — nie liczone. */
  potwierdza: boolean | null;
  /** Ułamek planet spełniających ten sam warunek (0–1) — szansa trafienia przypadkiem; null = nie dotyczy. */
  baza: number | null;
  zrodlo: "ai" | "osoba";
  aiWidzi?: "tak" | "mozliwe" | "nie";
}

const ZLOCZYNCY: PlanetId[] = ["saturn", "mars", "rahu", "ketu"];
const NAZWA_ZNAKU: Record<RodzajZnaku, string> = {
  x: "X (krzyż)", gwiazda: "gwiazda", kwadrat: "kwadrat", trojkat: "trójkąt", kratka: "kratka", wyspa: "wyspa",
  krzyz_mistyczny: "krzyż mistyczny",
};
export const DOPELNIACZ: Record<PlanetId, string> = {
  sun: "Słońca", moon: "Księżyca", mars: "Marsa", mercury: "Merkurego", jupiter: "Jowisza",
  venus: "Wenus", saturn: "Saturna", rahu: "Rahu", ketu: "Ketu",
};
const MIANOWNIK: Record<PlanetId, string> = {
  sun: "Słońce", moon: "Księżyc", mars: "Mars", mercury: "Merkury", jupiter: "Jowisz",
  venus: "Wenus", saturn: "Saturn", rahu: "Rahu", ketu: "Ketu",
};

type Warunek = (chart: VedicChart, p: PlanetId) => string | null;

const znaneDomy = (chart: VedicChart) => !!chart.angles;
const wZnaku = (chart: VedicChart, p: PlanetId, z: PlanetId) => p !== z && chart.planets[p].sign === chart.planets[z].sign;

/** Każdy warunek zwraca opis, gdy jest spełniony, albo null. */
const WARUNKI: Record<"proba" | "blask" | "ochrona" | "talent" | "rozproszenie", { opis: string; test: Warunek }> = {
  proba: {
    opis: "6., 8. lub 12. dom, upadek, spalenie albo złoczyńca w tym samym znaku",
    test: (c, p) => {
      const pl = c.planets[p];
      if (znaneDomy(c) && [6, 8, 12].includes(pl.house)) return `${MIANOWNIK[p]} w ${pl.house}. domu`;
      if (pl.dignity === "upadek") return `${MIANOWNIK[p]} w upadku`;
      if (pl.combust) return `${MIANOWNIK[p]} — spalenie przy Słońcu`;
      const z = ZLOCZYNCY.find((m) => wZnaku(c, p, m));
      return z ? `${MIANOWNIK[p]} w jednym znaku z: ${MIANOWNIK[z]}` : null;
    },
  },
  blask: {
    opis: "egzaltacja, własny znak albo dom 1., 4., 5., 7., 9., 10.",
    test: (c, p) => {
      const pl = c.planets[p];
      if (GODNOSC_WLASNA.has(pl.dignity)) return `${MIANOWNIK[p]} — ${pl.dignity}`;
      if (znaneDomy(c) && [1, 4, 5, 7, 9, 10].includes(pl.house)) return `${MIANOWNIK[p]} w ${pl.house}. domu`;
      return null;
    },
  },
  ochrona: {
    opis: "Jowisz w tym samym znaku albo aspekt Jowisza",
    test: (c, p) => {
      if (p === "jupiter") return null;
      if (wZnaku(c, p, "jupiter")) return `Jowisz razem z: ${MIANOWNIK[p]}`;
      return aspektuje(c, "jupiter", c.planets[p].sign) ? `Jowisz aspektuje: ${MIANOWNIK[p]}` : null;
    },
  },
  talent: {
    opis: "dom 1., 5. albo 9.",
    test: (c, p) => (znaneDomy(c) && [1, 5, 9].includes(c.planets[p].house) ? `${MIANOWNIK[p]} w ${c.planets[p].house}. domu` : null),
  },
  rozproszenie: {
    opis: "co najmniej dwa złoczyńce na planecie",
    test: (c, p) => {
      const na = ZLOCZYNCY.filter((m) => m !== p && (wZnaku(c, p, m) || ((m === "saturn" || m === "mars") && aspektuje(c, m, c.planets[p].sign))));
      return na.length >= 2 ? `na: ${MIANOWNIK[p]} wpływają ${na.map((m) => MIANOWNIK[m]).join(", ")}` : null;
    },
  },
};

const ZNAK_WARUNEK: Partial<Record<RodzajZnaku, keyof typeof WARUNKI>> = {
  x: "proba", wyspa: "proba", gwiazda: "blask", kwadrat: "ochrona", trojkat: "talent", kratka: "rozproszenie",
};

function bazaWarunku(chart: VedicChart, w: Warunek): number {
  return PLANET_ORDER.filter((p) => w(chart, p) !== null).length / PLANET_ORDER.length;
}

function mostKrzyzaMistycznego(c: VedicChart): string | null {
  if (!znaneDomy(c)) return null;
  for (const p of ["jupiter", "ketu"] as PlanetId[]) {
    if ([1, 5, 9, 12].includes(c.planets[p].house)) return `${MIANOWNIK[p]} w ${c.planets[p].house}. domu`;
  }
  const w12 = PLANET_ORDER.filter((p) => c.planets[p].house === 12);
  return w12.length ? `12. dom zajęty: ${w12.map((p) => MIANOWNIK[p]).join(", ")}` : null;
}

const NAZWA_STANU: Record<StanLinii, string> = { wyrazna: "wyraźna", odcinkowa: "odcinkowa", slaba: "słaba", brak: "brak" };

export function mostyDlonHoroskop(chart: VedicChart, dlon: DlonWLiczbach | null): Most[] {
  const mosty: Most[] = [];
  const znaki = [...(dlon?.znaki ?? []), ...(dlon?.wlasne ?? [])];
  const reka = (z: ZnakDloni) => (z.reka === "wiodaca" ? "ręka wiodąca" : "ręka bierna");

  for (const z of znaki) {
    if (z.znak === "krzyz_mistyczny") {
      const w = mostKrzyzaMistycznego(chart);
      mosty.push({
        dlon: `krzyż mistyczny — ${reka(z)}${z.pewnosc === "delikatny" ? ", delikatny" : ""}`,
        warunek: w ?? "Jowisz albo Ketu w 1., 5., 9. lub 12. domu albo zajęty 12. dom — nie ma",
        potwierdza: !!w, baza: null, zrodlo: z.zrodlo, aiWidzi: z.aiWidzi,
      });
      continue;
    }
    if (z.miejsce === "czworobok") continue;
    const klucz = ZNAK_WARUNEK[z.znak];
    if (!klucz) continue;
    const W = WARUNKI[klucz];
    const wynik = W.test(chart, z.miejsce);
    mosty.push({
      dlon: `${NAZWA_ZNAKU[z.znak]} na wzgórku ${DOPELNIACZ[z.miejsce]} — ${reka(z)}${z.pewnosc === "delikatny" ? ", delikatny" : ""}`,
      warunek: wynik ?? `${MIANOWNIK[z.miejsce]}: ${W.opis} — nie ma`,
      potwierdza: !!wynik,
      baza: bazaWarunku(chart, W.test),
      zrodlo: z.zrodlo, aiWidzi: z.aiWidzi,
    });
  }

  const linie = dlon?.linie ?? {};
  const astro = ocenyAstrologii(chart).oceny;
  const zajety = (d: number) => znaneDomy(chart) && PLANET_ORDER.some((p) => chart.planets[p].house === d);
  const dodajLinie = (l: LiniaMostu, nazwa: string, horoskop: string | null) => {
    const stan = linie[l];
    if (!stan) return;
    mosty.push({
      dlon: `linia ${nazwa}: ${NAZWA_STANU[stan]}`,
      warunek: horoskop ? `w horoskopie: ${horoskop}` : "w horoskopie: temat słabo zaznaczony",
      // wyraźna ↔ temat mocny w horoskopie, brak ↔ temat słaby; odcinkowa/słaba to „droga z przerwami”,
      // a nie siła ani jej brak — pokazujemy, ale nie liczymy jako zgodności ani niezgodności
      potwierdza: stan === "wyrazna" ? !!horoskop : stan === "brak" ? !horoskop : null,
      baza: null, zrodlo: "ai",
    });
  };
  dodajLinie("losu", "losu", astro.saturn === 1 ? "Saturn wyrazisty" : zajety(10) ? "zajęty 10. dom" : null);
  dodajLinie("slonca", "Słońca", astro.sun === 1 ? "Słońce wyraziste"
    : znaneDomy(chart) && [1, 5, 10].includes(chart.planets.sun.house) ? `Słońce w ${chart.planets.sun.house}. domu` : null);
  dodajLinie("podrozy", "podróży", zajety(9) ? "zajęty 9. dom" : zajety(12) ? "zajęty 12. dom"
    : znaneDomy(chart) && [1, 9, 12].includes(chart.planets.rahu.house) ? `Rahu w ${chart.planets.rahu.house}. domu` : null);
  dodajLinie("relacji", "relacji", zajety(7) ? "zajęty 7. dom" : astro.venus === 1 ? "Wenus wyrazista" : null);
  return mosty;
}
