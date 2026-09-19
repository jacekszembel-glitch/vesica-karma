import { RASIS, type PlanetId } from "./constants";
import type { VedicChart, Dignity } from "./chart";
import type { OcenaWladcy } from "./sila";

/**
 * FINANSE — wspólny typ wyniku (CzynnikDomeny), pomocnik `wladcaDomu`
 * i statyczne opisy tekstowe per planeta, współdzielone przez dedykowane
 * silniki finanseWedyjskie.ts i zdrowieWedyjski.ts
 * (nazwa pliku zostaje historyczna — sekcje Uczucia i Zawód i kariera
 * zostały usunięte, ale CzynnikDomeny/wladcaDomu są nadal wspólnym
 * fundamentem dla reszty).
 * Same wyliczenia oceny (kto ile punktów dostaje i dlaczego) NIE są już tu —
 * każda domena ma WŁASNĄ logikę zamiast recyklingu jednej generycznej
 * ocenaWladcy (patrz nagłówki tamtych plików: wcześniej ta sama planeta
 * dostawała identyczny wynik w Predyspozycjach/Finansach, bo pytanie było
 * zawsze to samo, niezależnie od tematu).
 */

export interface CzynnikDomeny {
  planeta: PlanetId;
  /** Jedna lub więcej ról tej planety w temacie (np. władca 2. domu + naturalny karaka bogactwa naraz). */
  role: string[];
  ocena: OcenaWladcy;
  /** Godność w D1 — do zastrzeżenia w UI, gdy jest zła mimo dodatniej sumy w `ocena` (patrz zastrzezenieGodnosci). */
  dignity: Dignity;
}

/** Władca domu wg lagny tej mapy — eksportowane, żeby inne domeny (np. technika.ts) mogły budować własne zestawy ról bez duplikowania tej funkcji. */
export function wladcaDomu(chart: VedicChart, house: number): PlanetId | null {
  if (!chart.angles) return null;
  const sign = (chart.angles.lagnaSign + house - 1) % 12;
  return RASIS[sign].lord;
}

/** Co kondycja danej planety znaczy konkretnie dla gromadzenia majątku — do dymka/rozwinięcia. */
export const FINANSE_OPIS: Record<PlanetId, string> = {
  sun: "Majątek buduje się u Ciebie poprzez widoczność, autorytet i własną inicjatywę — częściej dzięki pozycji czy stanowisku niż cichej pracy w tle.",
  moon: "Finanse są płynne i zmienne, mocno powiązane z nastrojem i poczuciem bezpieczeństwa — łatwiej gromadzisz, gdy czujesz się emocjonalnie stabilnie.",
  mars: "Pieniądze przychodzą przez odważne, szybkie działanie i własną energię — ale równie szybko mogą wyciekać przez impulsywne decyzje.",
  mercury: "Majątek buduje handel, negocjacje, wiele drobnych transakcji naraz — zręczność umysłu przekłada się bezpośrednio na portfel.",
  jupiter: "To naturalny karaka bogactwa — obfitość przychodzi niemal sama, często przez nauczanie, doradztwo albo dobre wyczucie okazji.",
  venus: "Dobrobyt wiąże się z estetyką, przyjemnością i relacjami — łatwo przyciągasz komfort materialny, ale równie łatwo go wydajesz na luksus.",
  saturn: "Majątek buduje się powoli, systematycznie, latami — bez skrótów, ale to, co zgromadzisz, zostaje na dłużej niż u innych.",
  rahu: "Finanse bywają nietypowe, gwałtowne, związane z nowymi technologiami albo zagranicą — możliwe duże zyski, ale i duża zmienność.",
  ketu: "Stosunek do pieniędzy jest wyciszony, mniej materialistyczny — łatwiej Ci się wyzbyć niż gromadzić, chyba że temat świadomie zaopiekujesz.",
};

/** Krótkie etykiety ostrzegawcze — koniec rankingu finansowego z tarciem (do NaCoUwazacDomeny). */
export const FINANSE_UWAGA: Record<PlanetId, string> = {
  sun: "wydawanie na status i wizerunek",
  moon: "impulsywne zakupy pod wpływem nastroju",
  mars: "pochopne, ryzykowne decyzje finansowe",
  mercury: "rozpraszanie się na zbyt wiele źródeł dochodu naraz",
  jupiter: "nadmierny optymizm, lekceważenie ryzyka",
  venus: "wydawanie na przyjemności i luksus ponad stan",
  saturn: "nadmierna oszczędność, lęk przed wydawaniem",
  rahu: "spekulacyjne, ryzykowne inwestycje",
  ketu: "brak zainteresowania gromadzeniem, oddawanie kontroli innym",
};

export const FINANSE_UWAGA_OPIS: Record<PlanetId, string> = {
  sun: "Łatwo wydawać na to, co buduje wizerunek i status, nawet kosztem realnych oszczędności. Warto pilnować, żeby prestiż nie przesłaniał trzeźwej kalkulacji.",
  moon: "Nastrój potrafi decydować o zakupach szybciej niż rozsądek — pod wpływem emocji łatwo wydać więcej, niż planowano. Warto budować finansowe rutyny niezależne od chwilowego samopoczucia.",
  mars: "Szybkie, impulsywne decyzje finansowe — inwestycja czy zakup pod wpływem chwili — mogą kosztować więcej, niż się wydaje. Warto dać sobie czas przed większym wydatkiem.",
  mercury: "Łatwo rozpraszać uwagę na zbyt wiele pomysłów na zarobek naraz, zamiast dopracować jeden. Warto pilnować, żeby ilość transakcji nie zastępowała ich jakości.",
  jupiter: "Optymizm bywa tak duży, że łatwo przeoczyć realne ryzyko — „jakoś to będzie” nie zawsze wystarcza. Warto sprawdzać liczby, nie tylko dobre przeczucie.",
  venus: "Łatwo wydawać na przyjemności, estetykę i wygodę ponad to, na co realnie stać. Warto świadomie odróżniać przyjemność chwili od długoterminowego komfortu.",
  saturn: "Lęk przed brakiem może prowadzić do nadmiernej oszczędności, która odbiera radość z posiadania. Warto pamiętać, że gromadzenie bez celu też jest formą niepokoju.",
  rahu: "Ciągnie w stronę spekulacyjnych, ryzykownych okazji obiecujących szybki zysk. Warto sprawdzać dwa razy, zanim zaufa się czemuś, co wygląda zbyt dobrze.",
  ketu: "Temat pieniędzy bywa dla Ciebie mało istotny, co łatwo prowadzi do oddania kontroli nad finansami komuś innemu. Warto świadomie utrzymać choć minimalny nadzór nad własnym majątkiem.",
};
