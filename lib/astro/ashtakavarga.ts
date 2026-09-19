import { type PlanetId } from "./constants";
import type { VedicChart } from "./chart";

/**
 * ASZTAKAWARGA (BPHS) — system ośmiu źródeł punktów (bindu), osobny od
 * reszty modułów astro w tym pliku: nie ocenia planety wprost, tylko liczy
 * TRAFIENIA w konkretne domy od ośmiu punktów odniesienia (siedem grah
 * klasycznych + lagna). Klasycznie liczona TYLKO dla siedmiu grah — Rahu
 * i Ketu świadomie pominięte, bo BPHS nie przypisuje im własnej tabeli
 * bindu (część nowoczesnego oprogramowania dolicza je heurystycznie, ale
 * bez ugruntowanego klasycznego źródła — nie zgadujemy).
 *
 * Bhinnasztakawarga (BAV) — osobna tablica 12 znaków dla każdej z 7 grah:
 * ile z ośmiu źródeł „głosuje" na dany znak jako sprzyjający tej planecie.
 * Sarwasztakawarga (SAV) — suma wszystkich siedmiu BAV, jeden wskaźnik
 * ogólnej sprzyjającej mocy każdego znaku (klasycznie 0–56 na znak,
 * suma 337 na całą mapę — stała, niezależna od konkretnego horoskopu,
 * patrz test).
 *
 * Tabela: dla każdej z 7 grah docelowych, dla każdego z 8 źródeł, lista
 * domów (1–12, licząc OD ZNAKU ŹRÓDŁA) dających bindu. Źródło: BPHS,
 * tabela klasyczna, identyczna we wszystkich sprawdzonych opracowaniach
 * (Phaladeepika, powszechnie używana w oprogramowaniu jyotisz) — suma
 * domów w każdym wierszu zweryfikowana względem znanych stałych
 * (Słońce 48, Księżyc 49, Mars 39, Merkury 54, Jowisz 56, Wenus 52,
 * Saturn 39, razem 337).
 */

/** Siedem grah klasycznych — jedyne dopuszczalne cele I źródła Asztakawargi (bez Rahu/Ketu). */
export type GrahaAsztakawargi = Exclude<PlanetId, "rahu" | "ketu">;
export type ZrodloAsztakawargi = GrahaAsztakawargi | "lagna";
const ZRODLA: ZrodloAsztakawargi[] = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "lagna"];

/** Siedem grah klasycznych, dla których liczy się Asztakawarga (bez Rahu/Ketu). */
export const GRAHY_ASZTAKAWARGI: GrahaAsztakawargi[] = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];

const TABELA: Record<GrahaAsztakawargi, Record<ZrodloAsztakawargi, number[]>> = {
  sun: {
    sun: [1, 2, 4, 7, 8, 9, 10, 11], moon: [3, 6, 10, 11], mars: [1, 2, 4, 7, 8, 9, 10, 11],
    mercury: [3, 5, 6, 9, 10, 11, 12], jupiter: [5, 6, 9, 11], venus: [6, 7, 12],
    saturn: [1, 2, 4, 7, 8, 9, 10, 11], lagna: [3, 4, 6, 10, 11, 12],
  },
  moon: {
    sun: [3, 6, 7, 8, 10, 11], moon: [1, 3, 6, 7, 10, 11], mars: [2, 3, 5, 6, 9, 10, 11],
    mercury: [1, 3, 4, 5, 7, 8, 10, 11], jupiter: [1, 4, 7, 8, 10, 11, 12], venus: [3, 4, 5, 7, 9, 10, 11],
    saturn: [3, 5, 6, 11], lagna: [3, 6, 10, 11],
  },
  mars: {
    sun: [3, 5, 6, 10, 11], moon: [3, 6, 11], mars: [1, 2, 4, 7, 8, 10, 11],
    mercury: [3, 5, 6, 11], jupiter: [6, 10, 11, 12], venus: [6, 8, 11, 12],
    saturn: [1, 4, 7, 8, 9, 10, 11], lagna: [1, 3, 6, 10, 11],
  },
  mercury: {
    sun: [5, 6, 9, 11, 12], moon: [2, 4, 6, 8, 10, 11], mars: [1, 2, 4, 7, 8, 9, 10, 11],
    mercury: [1, 3, 5, 6, 9, 10, 11, 12], jupiter: [6, 8, 11, 12], venus: [1, 2, 3, 4, 5, 8, 9, 11],
    saturn: [1, 2, 4, 7, 8, 9, 10, 11], lagna: [1, 2, 4, 6, 8, 10, 11],
  },
  jupiter: {
    sun: [1, 2, 3, 4, 7, 8, 9, 10, 11], moon: [2, 5, 7, 9, 11], mars: [1, 2, 4, 7, 8, 10, 11],
    mercury: [1, 2, 4, 5, 6, 9, 10, 11], jupiter: [1, 2, 3, 4, 7, 8, 10, 11], venus: [2, 5, 6, 9, 10, 11],
    saturn: [3, 5, 6, 12], lagna: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  venus: {
    sun: [8, 11, 12], moon: [1, 2, 3, 4, 5, 8, 9, 11, 12], mars: [3, 5, 6, 9, 11, 12],
    mercury: [3, 5, 6, 9, 11], jupiter: [5, 8, 9, 10, 11], venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    saturn: [3, 4, 5, 8, 9, 10, 11], lagna: [1, 2, 3, 4, 5, 8, 9, 11],
  },
  saturn: {
    sun: [1, 2, 4, 7, 8, 10, 11], moon: [3, 6, 11], mars: [3, 5, 6, 10, 11, 12],
    mercury: [6, 8, 9, 10, 11, 12], jupiter: [5, 6, 11, 12], venus: [6, 11, 12],
    saturn: [3, 5, 6, 11], lagna: [1, 3, 4, 6, 10, 11],
  },
};

function znakZrodla(chart: VedicChart, zrodlo: ZrodloAsztakawargi): number {
  if (zrodlo === "lagna") return chart.angles!.lagnaSign;
  return chart.planets[zrodlo].sign;
}

/**
 * Bhinnasztakawarga — dla każdej z 7 grah klasycznych, 12-elementowa tablica
 * (indeks = znak 0–11) z liczbą bindu (0–8) w tym znaku. Wymaga znanej lagny.
 */
export function bhinnasztakawarga(chart: VedicChart): Record<GrahaAsztakawargi, number[]> | null {
  if (!chart.angles) return null;
  const wynik = {} as Record<GrahaAsztakawargi, number[]>;
  for (const graha of GRAHY_ASZTAKAWARGI) {
    const bindy = new Array(12).fill(0) as number[];
    for (const zrodlo of ZRODLA) {
      const znakZrodlaIdx = znakZrodla(chart, zrodlo);
      for (const dom of TABELA[graha][zrodlo]) {
        const znakDocelowy = (znakZrodlaIdx + dom - 1) % 12;
        bindy[znakDocelowy] += 1;
      }
    }
    wynik[graha] = bindy;
  }
  return wynik;
}

/** Sarwasztakawarga — suma wszystkich siedmiu BAV, jeden wskaźnik na znak (suma zawsze = 337). */
export function sarwasztakawarga(bav: Record<GrahaAsztakawargi, number[]>): number[] {
  const suma = new Array(12).fill(0) as number[];
  for (const graha of GRAHY_ASZTAKAWARGI) {
    for (let znak = 0; znak < 12; znak++) suma[znak] += bav[graha][znak];
  }
  return suma;
}
