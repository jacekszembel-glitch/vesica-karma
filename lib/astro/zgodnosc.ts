import type { PlanetId } from "./constants";
import { PLANET_ORDER, RASIS } from "./constants";
import type { VedicChart } from "./chart";
import { ocenaWladcy, aspektuje } from "./sila";
import { atmakaraka } from "./karaki";
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
 *  - chiromancja: wzgórek i palec planety z odczytu dłoni (wypukły/płaski).
 *    Rahu i Ketu nie mają w dłoni klasycznego miejsca — tam brak danych.
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

/** Zapis dłoni w liczbach — z bloku danych odczytu AI (albo wyłuskany z tekstu). */
export interface DlonWLiczbach {
  planety: Partial<Record<PlanetId, Ocena | null>>;
  zywiol: TypDloni | null;
  /** „odczyt” = AI podało dane wprost; „tekst” = wyłuskane ze starszego odczytu. */
  zrodlo: "odczyt" | "tekst";
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
  rahu: null,
  ketu: null,
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
    if (pl.house === 1) dodaj(3, "w ascendencie");
    else if ([4, 7, 10].includes(pl.house)) dodaj(1.5, `na osi (${pl.house}. dom)`);
    if (p !== "moon" && aspektuje(chart, p, lagna)) dodaj(1, "aspektuje ascendent");
  }
  if (RASIS[chart.moonSign].lord === p) dodaj(2, "władca znaku Księżyca");
  if (p !== "moon" && pl.sign === chart.moonSign) dodaj(1, "razem z Księżycem");
  if (p === "sun" || p === "moon") dodaj(1, "światło (Słońce i Księżyc to dodatkowe ascendenty)");
  if (atmakaraka(chart).planeta === p) dodaj(2, "atmakaraka");
  if (GODNOSC_WLASNA.has(pl.dignity)) dodaj(1.5, pl.dignity);
  if (chart.currentDasha[0]?.lord === p) dodaj(1, "bieżąca mahadasza");
  // rozstrzygnięcie remisów — siła planety, z małą wagą
  punkty += ocenaWladcy(chart, p, jogi).punkty * 0.05;
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
  jowisz: "jupiter", wenus: "venus", saturn: "saturn",
};

/** Oddziela tekst odczytu od ukrytego bloku danych na końcu (AI dopisuje go po Markdownie). */
export function rozdzielOdczytDloni(surowy: string): { tekst: string; dane: DlonWLiczbach | null } {
  const i = surowy.indexOf(ZNACZNIK);
  if (i < 0) return { tekst: surowy, dane: null };
  const tekst = surowy.slice(0, i).trimEnd();
  const koniec = surowy.indexOf("-->", i);
  const json = surowy.slice(i + ZNACZNIK.length, koniec < 0 ? undefined : koniec).trim();
  try {
    const d = JSON.parse(json) as { planety?: Record<string, unknown>; zywiol?: unknown };
    const planety: Partial<Record<PlanetId, Ocena | null>> = {};
    for (const [k, v] of Object.entries(d.planety ?? {})) {
      const p = KLUCZE_PLANET[k];
      if (p) planety[p] = v === 1 || v === 0 || v === -1 ? v : null;
    }
    const zywiol = ["ziemia", "powietrze", "ogien", "woda"].includes(String(d.zywiol)) ? (d.zywiol as TypDloni) : null;
    return { tekst, dane: { planety, zywiol, zrodlo: "odczyt" } };
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
    if (znane.length < 2) rodzaj = "jeden";
    else if (rozne.has(1) && rozne.has(-1)) rodzaj = "roznica";
    else if (rozne.size === 1) rodzaj = znane.length === 3 ? "zgodnosc3" : "zgodnosc2";
    // trzy oceny, dwie równe, trzecia o krok obok (np. mocna, mocna, przeciętna)
    else if (znane.length === 3) rodzaj = "zgodnosc2";
    else rodzaj = "mieszane";
    const mocnaW = SYSTEMY_ZGODNOSCI.filter((s) => oceny[s] === 1);
    return { planeta: p, oceny, rodzaj, mocnaW };
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
