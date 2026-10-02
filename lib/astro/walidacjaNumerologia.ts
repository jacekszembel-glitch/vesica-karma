import { reduce } from "./numerology";
import type { TypWydarzenia, Wydarzenie } from "./rektyfikacja";

/**
 * WALIDACJA NUMEROLOGICZNA — drugi system obok astrologii w "Sprawdź na swoim
 * życiu" (components/WalidacjaZdarzen.tsx, prop drugiSystem). Rok osobisty
 * w dacie zdarzenia (ta sama formuła co personalYear w numerology.ts: dzień +
 * miesiąc urodzenia + rok kalendarzowy, zredukowane do 1–9) porównany
 * z klasycznym znaczeniem lat cyklu:
 * 1 nowy początek · 2 partnerstwo · 3 twórczość, dzieci · 4 praca, fundamenty,
 * dom · 5 zmiana, ruch · 6 rodzina, miłość, odpowiedzialność · 7 introspekcja,
 * zdrowie, nauka · 8 kariera, władza, pieniądze · 9 zakończenia.
 * Szansa przypadku liczona z tych samych dni próbki co astrologia — to zwykle
 * ok. 2/9 albo 3/9, bo cykl ma 9 lat.
 */
export const LATA_OSOBISTE: Record<TypWydarzenia, number[]> = {
  slub: [2, 6],
  rozwod: [9, 5],
  dziecko: [6, 3],
  praca: [1, 4, 8],
  awans: [8, 1],
  utrataPracy: [9, 5],
  przeprowadzka: [5, 4],
  smiercOjca: [9, 7],
  smiercMatki: [9, 7],
  wypadek: [5, 9],
  choroba: [7, 9],
  studia: [7, 3],
};

export function rokOsobisty(dzien: number, miesiac: number, rok: number): number {
  return reduce(reduce(dzien, false) + reduce(miesiac, false) + reduce(rok, false), false);
}

export function walidujNumerologie(dzien: number, miesiac: number, w: Wydarzenie, dniProbki: Date[]) {
  const pasujace = LATA_OSOBISTE[w.typ];
  const rok = rokOsobisty(dzien, miesiac, w.data.getUTCFullYear());
  const pPrzypadku = dniProbki.length
    ? dniProbki.filter((d) => pasujace.includes(rokOsobisty(dzien, miesiac, d.getUTCFullYear()))).length / dniProbki.length
    : pasujace.length / 9;
  return { rok, trafienie: pasujace.includes(rok), pPrzypadku };
}
