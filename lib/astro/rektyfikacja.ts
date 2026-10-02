import { buildChart, type VedicChart } from "./chart";
import { RASIS, type PlanetId } from "./constants";
import { activeChain } from "./dasha";
import { allPlanets } from "./ephemeris";
import { navamsaSign } from "./varga";

/**
 * REKTYFIKACJA GODZINY URODZENIA — pomoc, nie wyrocznia.
 *
 * Gdy godzina urodzenia jest niepewna (±kilkadziesiąt minut), najbardziej
 * zmienia się lagna, a z nią przypisanie domów do planet. Klasyczna metoda
 * zdarzeniowa: dla każdej kandydującej chwili sprawdzamy, czy w dniach
 * ZNANYCH wydarzeń życia:
 * 1. władcy aktywnych okresów Wimszottari (maha → antar → pratjantar) władają
 *    domami opisującymi to wydarzenie albo w nich stoją (lub są jego karaką),
 * 2. Jowisz i Saturn w tranzycie dotykają (koniunkcją lub aspektem) głównego
 *    domu wydarzenia — "podwójny tranzyt".
 * Chwile, przy których wydarzenia "pasują" najlepiej, wskazują najbardziej
 * prawdopodobną lagnę (i nawamszę). Kandydaci z tą samą lagną i tą samą
 * lagną D9 tworzą jeden przedział — wynik podajemy przedziałami, bo w ich
 * obrębie metoda i tak nie rozróżnia minut.
 */

export type TypWydarzenia =
  | "slub" | "rozwod" | "dziecko" | "praca" | "awans" | "utrataPracy"
  | "przeprowadzka" | "smiercOjca" | "smiercMatki" | "wypadek" | "choroba" | "studia";

export const TYPY_WYDARZEN: TypWydarzenia[] = [
  "slub", "rozwod", "dziecko", "praca", "awans", "utrataPracy",
  "przeprowadzka", "smiercOjca", "smiercMatki", "wypadek", "choroba", "studia",
];

/** Domy (pierwszy = główny) i karaki wydarzenia — klasyczne sygnifikacje. */
export const SYGNIFIKACJE: Record<TypWydarzenia, { domy: number[]; karaki: PlanetId[] }> = {
  slub: { domy: [7, 2, 11], karaki: ["venus", "jupiter"] },
  rozwod: { domy: [7, 6, 8, 12], karaki: ["venus", "mars", "saturn"] },
  dziecko: { domy: [5, 9, 2], karaki: ["jupiter"] },
  praca: { domy: [10, 6, 11], karaki: ["sun", "saturn", "mercury"] },
  awans: { domy: [10, 11, 2], karaki: ["sun", "jupiter"] },
  // 9. dom to 12. od 10. — utrata pozycji
  utrataPracy: { domy: [10, 9, 12, 8], karaki: ["saturn"] },
  przeprowadzka: { domy: [4, 12, 3], karaki: ["moon"] },
  // ojciec = 9. dom; jego domy "zabójcze" to 2. i 7. od 9. (10., 3.), koniec życia 8. od 9. (4.)
  smiercOjca: { domy: [9, 10, 3, 4], karaki: ["sun"] },
  // matka = 4. dom; 2. i 7. od 4. to 5. i 10., 8. od 4. to 11.
  smiercMatki: { domy: [4, 5, 10, 11], karaki: ["moon"] },
  wypadek: { domy: [8, 6, 12], karaki: ["mars", "rahu"] },
  choroba: { domy: [6, 8, 12, 1], karaki: ["saturn", "mars"] },
  studia: { domy: [4, 5, 9], karaki: ["mercury", "jupiter"] },
};

export interface Wydarzenie { data: Date; typ: TypWydarzenia }

export interface PrzedzialRektyfikacji {
  od: Date;
  do: Date;
  lagna: number;
  lagnaD9: number;
  /** Średnie dopasowanie 0–1. */
  wynik: number;
  liczbaKandydatow: number;
}

const norm12 = (s: number) => ((s % 12) + 12) % 12;
export const ASPEKTY_JOWISZA = [1, 5, 7, 9];
export const ASPEKTY_SATURNA = [1, 3, 7, 10];
const WAGI_POZIOMOW = [1, 1.5, 2];
const MAKS_ZA_WYDARZENIE = WAGI_POZIOMOW.reduce((a, b) => a + b, 0) * 2 + 2;

function domWzgledemLagny(lagna: number, sign: number) { return norm12(sign - lagna) + 1; }

/** Dopasowanie jednego wydarzenia do jednej kandydującej mapy (0–1). */
export function dopasowanieWydarzenia(
  c: VedicChart, w: Wydarzenie, tranzyt: { jupiter: number; saturn: number },
): number {
  if (!c.angles) return 0;
  const lagna = c.angles.lagnaSign;
  const { domy, karaki } = SYGNIFIKACJE[w.typ];
  let wynik = 0;

  activeChain(c.dashas, w.data).forEach((okres, poziom) => {
    const lord = okres.lord;
    let trafienia = 0;
    const wladane = RASIS.map((r, i) => (r.lord === lord ? domWzgledemLagny(lagna, i) : 0)).filter(Boolean);
    if (wladane.some((d) => domy.includes(d))) trafienia += 1;
    if (domy.includes(domWzgledemLagny(lagna, c.planets[lord].sign))) trafienia += 1;
    if (karaki.includes(lord)) trafienia += 0.5;
    wynik += WAGI_POZIOMOW[poziom] * Math.min(2, trafienia);
  });

  const glownyZnak = norm12(lagna + domy[0] - 1);
  const dotyka = (znakPlanety: number, aspekty: number[]) => aspekty.includes(norm12(glownyZnak - znakPlanety) + 1);
  if (dotyka(tranzyt.jupiter, ASPEKTY_JOWISZA)) wynik += 1;
  if (dotyka(tranzyt.saturn, ASPEKTY_SATURNA)) wynik += 1;

  return wynik / MAKS_ZA_WYDARZENIE;
}

/**
 * @param srodek zakładana chwila urodzenia (UTC)
 * @param oknoMinut ile minut w każdą stronę sprawdzić
 * @param krokMinut co ile minut kandydat
 */
export function rektyfikuj(
  srodek: Date, latitude: number, longitude: number, wydarzenia: Wydarzenie[],
  oknoMinut = 60, krokMinut = 1,
): PrzedzialRektyfikacji[] {
  const tranzyty = wydarzenia.map((w) => {
    const p = allPlanets(w.data);
    return { jupiter: Math.floor(p.jupiter.longitude / 30), saturn: Math.floor(p.saturn.longitude / 30) };
  });

  const przedzialy: PrzedzialRektyfikacji[] = [];
  let sumaBiezaca = 0;
  for (let m = -oknoMinut; m <= oknoMinut; m += krokMinut) {
    const chwila = new Date(srodek.getTime() + m * 60000);
    const c = buildChart({ date: chwila, latitude, longitude, timeKnown: true });
    if (!c.angles) continue;
    const wynik = wydarzenia.length
      ? wydarzenia.reduce((s, w, i) => s + dopasowanieWydarzenia(c, w, tranzyty[i]), 0) / wydarzenia.length
      : 0;
    const lagna = c.angles.lagnaSign;
    const lagnaD9 = navamsaSign(c.angles.ascendant);
    const ost = przedzialy[przedzialy.length - 1];
    if (ost && ost.lagna === lagna && ost.lagnaD9 === lagnaD9) {
      ost.do = chwila;
      ost.liczbaKandydatow += 1;
      sumaBiezaca += wynik;
      ost.wynik = sumaBiezaca / ost.liczbaKandydatow;
    } else {
      sumaBiezaca = wynik;
      przedzialy.push({ od: chwila, do: chwila, lagna, lagnaD9, wynik, liczbaKandydatow: 1 });
    }
  }
  return przedzialy;
}
