import type { VedicChart } from "./chart";
import { RASIS, type PlanetId } from "./constants";
import { activeChain } from "./dasha";
import { planetPosition } from "./ephemeris";
import {
  dopasowanieWydarzenia, SYGNIFIKACJE, ASPEKTY_JOWISZA, ASPEKTY_SATURNA,
  type TypWydarzenia, type Wydarzenie,
} from "./rektyfikacja";

/**
 * WALIDACJA — "czy to się zgadza z moim życiem?". Użytkownik podaje daty
 * ważnych zdarzeń; dla każdego sprawdzamy, jak dobrze mapa je "widziała"
 * (ta sama klasyczna metoda co rektyfikacja: władcy dasz maha → antar →
 * pratjantar w domach/karakach zdarzenia + podwójny tranzyt Jowisza i Saturna).
 *
 * Uczciwość: samo "pasuje / nie pasuje" prawie zawsze wychodzi "pasuje", bo
 * każdy okres da się do czegoś dopasować. Dlatego wynik zdarzenia to
 * PERCENTYL — o ile lepiej jego data pasuje niż inne dni życia tej samej
 * osoby (próbka równo rozłożonych dni od 5. roku życia do dziś). Trafienie =
 * lepiej niż PROG_TRAFIENIA% dni, więc przypadek trafia z określonym,
 * policzonym prawdopodobieństwem p (≈30%), a podsumowanie porównuje liczbę
 * trafień z tym, co dałby przypadek (rozkład Poissona-dwumianowy).
 *
 * Bez godziny urodzenia lagną jest znak Księżyca (czandra lagna) — mniej
 * dokładnie, ale klasycznie uprawnione.
 */

export const PROG_TRAFIENIA = 70;
const PROBEK = 360;
const ROK_MS = 365.25 * 86400000;

export interface PowodOkresu {
  /** 0 = mahadasza, 1 = antardasza, 2 = pratjantardasza. */
  poziom: number;
  wladca: PlanetId;
  /** Domy zdarzenia, którymi ten władca włada. */
  wlada: number[];
  /** Dom zdarzenia, w którym ten władca stoi (albo null). */
  stoiW: number | null;
  karaka: boolean;
}

export interface WynikZdarzenia {
  wydarzenie: Wydarzenie;
  /** Ile procent innych dni życia pasuje GORZEJ niż ta data (0–100). */
  procentDni: number;
  trafienie: boolean;
  /** Prawdopodobieństwo trafienia przez przypadek dla tego typu zdarzenia w tej mapie. */
  pPrzypadku: number;
  okresy: PowodOkresu[];
  tranzyt: { jowisz: boolean; saturn: boolean };
}

export interface PodsumowanieSystemu {
  trafienia: number;
  wszystkie: number;
  /** Średnia liczba trafień, jaką dałby przypadek. */
  oczekiwanePrzypadkiem: number;
  /** Szansa, że przypadek da co najmniej tyle trafień (0–1). */
  szansaPrzypadkiem: number;
}

const norm12 = (s: number) => ((s % 12) + 12) % 12;
const znakTranzytu = (id: "jupiter" | "saturn", d: Date) => Math.floor(planetPosition(id, d).longitude / 30);

/** Mapa do walidacji: bez godziny urodzenia lagną jest znak Księżyca (czandra lagna). */
export function mapaDoWalidacji(c: VedicChart): VedicChart {
  if (c.angles) return c;
  return { ...c, angles: { ascendant: c.planets.moon.longitude, mc: c.planets.moon.longitude, lagnaSign: c.moonSign } };
}

/** Równo rozłożone dni od 5. roku życia do dziś (deterministycznie — ten sam wynik przy każdym liczeniu). */
export function dniProbki(c: VedicChart, dzis = new Date()): Date[] {
  const od = c.birth.date.getTime() + 5 * ROK_MS;
  const doo = dzis.getTime();
  if (doo <= od) return [];
  const krok = (doo - od) / PROBEK;
  return Array.from({ length: PROBEK }, (_, i) => new Date(od + (i + 0.5) * krok));
}

interface Probka { daty: Date[]; tranzyty: { jupiter: number; saturn: number }[] }

/** Tranzyty Jowisza i Saturna dla dni próbki — liczone raz, wspólne dla wszystkich zdarzeń. */
export function przygotujProbke(c: VedicChart, dzis = new Date()): Probka {
  const daty = dniProbki(c, dzis);
  return { daty, tranzyty: daty.map((d) => ({ jupiter: znakTranzytu("jupiter", d), saturn: znakTranzytu("saturn", d) })) };
}

/** Odsetek wartości w próbce mniejszych od x (remisy liczone w połowie), 0–100. */
function percentyl(x: number, wartosci: number[]): number {
  let mniej = 0, rowne = 0;
  for (const v of wartosci) { if (v < x) mniej++; else if (v === x) rowne++; }
  return ((mniej + rowne / 2) / wartosci.length) * 100;
}

export function walidujWydarzenie(chart: VedicChart, w: Wydarzenie, probka: Probka): WynikZdarzenia {
  const c = mapaDoWalidacji(chart);
  const lagna = c.angles!.lagnaSign;
  const tranzytZdarzenia = { jupiter: znakTranzytu("jupiter", w.data), saturn: znakTranzytu("saturn", w.data) };
  const wynik = dopasowanieWydarzenia(c, w, tranzytZdarzenia);

  // rozkład wyników tego samego TYPU zdarzenia w losowych dniach życia
  const tlo = probka.daty.map((d, i) => dopasowanieWydarzenia(c, { data: d, typ: w.typ }, probka.tranzyty[i]));
  const procentDni = Math.round(percentyl(wynik, tlo));
  const pPrzypadku = tlo.filter((v) => percentyl(v, tlo) >= PROG_TRAFIENIA).length / Math.max(1, tlo.length);

  const { domy, karaki } = SYGNIFIKACJE[w.typ];
  const okresy: PowodOkresu[] = activeChain(c.dashas, w.data).map((okres, poziom) => {
    const wladca = okres.lord;
    const wlada = RASIS.map((r, i) => (r.lord === wladca ? norm12(i - lagna) + 1 : 0)).filter((d) => d && domy.includes(d));
    const dom = norm12(c.planets[wladca].sign - lagna) + 1;
    return { poziom, wladca, wlada, stoiW: domy.includes(dom) ? dom : null, karaka: karaki.includes(wladca) };
  });
  const glowny = norm12(lagna + domy[0] - 1);
  const dotyka = (znak: number, aspekty: number[]) => aspekty.includes(norm12(glowny - znak) + 1);

  return {
    wydarzenie: w, procentDni, trafienie: procentDni >= PROG_TRAFIENIA, pPrzypadku, okresy,
    tranzyt: { jowisz: dotyka(tranzytZdarzenia.jupiter, ASPEKTY_JOWISZA), saturn: dotyka(tranzytZdarzenia.saturn, ASPEKTY_SATURNA) },
  };
}

/** Rozkład Poissona-dwumianowy: szansa, że przypadek da ≥ k trafień przy prawdopodobieństwach p[i]. */
export function szansaCoNajmniej(k: number, p: number[]): number {
  let rozklad = [1];
  for (const pi of p) {
    const nowy = new Array(rozklad.length + 1).fill(0);
    rozklad.forEach((v, j) => { nowy[j] += v * (1 - pi); nowy[j + 1] += v * pi; });
    rozklad = nowy;
  }
  return rozklad.slice(k).reduce((a, b) => a + b, 0);
}

export function podsumuj(trafienia: boolean[], p: number[]): PodsumowanieSystemu {
  const k = trafienia.filter(Boolean).length;
  return {
    trafienia: k, wszystkie: trafienia.length,
    oczekiwanePrzypadkiem: p.reduce((a, b) => a + b, 0),
    szansaPrzypadkiem: szansaCoNajmniej(k, p),
  };
}

export type { TypWydarzenia, Wydarzenie };
