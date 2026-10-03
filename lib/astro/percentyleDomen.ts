/**
 * PERCENTYLE SIŁY — zastępują wcześniejsze podejście "surowe punkty na
 * stałej skali min..max" (stałe ZAKRES i funkcja zakresZWynikow, usunięte
 * razem z components/SkalaOcen.tsx). Ten pomysł miał realny problem: skala musiała
 * być albo liczona z JEDNEJ mapy (dwie osoby dostawały dwa różne zakresy —
 * mylące), albo stałą, którą trzeba było poszerzać dla wyjątków (znowu inna
 * liczba u różnych osób, tylko rzadziej). Percentyl usuwa ten problem u
 * ŹRÓDŁA: to zawsze liczba 0–100, u KAŻDEGO, bez wyjątków — matematycznie
 * nie da się jej przekroczyć, więc nie ma czego poszerzać ani obcinać.
 *
 * Co dokładnie liczymy: "ile procent wyników w populacji jest SŁABSZYCH
 * (co do wartości bezwzględnej) niż ten". Bezwzględnych — bo w Predyspozycjach/
 * Finansach/Zdrowiu długość paska od zawsze oznacza
 * WYRAZISTOŚĆ czynnika niezależnie od znaku (silna, trudna cecha ma być tak
 * samo długim paskiem jak silna, łatwa — różni je tylko KOLOR/ton, nie
 * długość) — patrz komentarz w RankingGrah.tsx. Percentyl liczony z |punkty|
 * zachowuje dokładnie tę samą semantykę, tylko na uczciwszej skali.
 *
 * Tabele poniżej pochodzą z JEDNORAZOWEJ próby statystycznej: 20 000
 * losowych map (losowa data 1930–2024, losowa godzina, losowa szerokość/
 * długość geograficzna), dla każdej policzone te same wyliczenia co
 * w produkcji (ocenaWladcy/ocenaFinansowa/
 * ocenaZdrowotna), wszystkie |punkty| (każda planeta z każdej mapy) zebrane
 * w jedną pulę na domenę, z niej odczytane breakpointy co 2 punkty
 * procentowe (0, 2, 4 … 100). `percentylSily` interpoluje liniowo między
 * najbliższymi breakpointami, więc wynik jest płynny, nie "schodkowy".
 */

/** n=180 000, min=0.00, max=11.70 */
export const TABELA_PREDYSPOZYCJE: number[] = [
  0, 0, 0.05, 0.15, 0.2, 0.25, 0.25, 0.3, 0.35, 0.45, 0.5, 0.5, 0.5, 0.55, 0.65, 0.75, 0.75, 0.75, 0.8, 0.9, 1, 1, 1, 1.1, 1.2, 1.25, 1.25, 1.35, 1.45, 1.5, 1.5, 1.65, 1.75, 1.75, 1.95, 2, 2.2, 2.25, 2.45, 2.5, 2.7, 2.9, 3, 3.25, 3.45, 3.7, 3.95, 4.25, 4.75, 5.45, 11.7,
];

/**
 * Osobne skale dla dwóch stron osi Predyspozycji (OsPredyspozycji.tsx):
 * suma czynników DODATNICH (co planetę wspiera) i UJEMNYCH (co ją hamuje)
 * z ocenaWladcy z jogami. Ta sama metoda co wyżej (20 000 losowych map,
 * n=180000); kontrolnie ta sama próba odtwarza TABELA_PREDYSPOZYCJE dla
 * |bilansu| (mediana 1.05, maks. 9.45), więc skale są porównywalne.
 */
/** n=180000, maks. 12.5 */
export const TABELA_POTENCJAL: number[] = [
  0, 0, 0, 0.25, 0.5, 0.5, 0.5, 0.5, 0.75, 0.75, 0.75, 0.9, 1, 1, 1, 1.25, 1.25, 1.25, 1.5, 1.5, 1.5, 1.65, 1.75, 1.75, 1.9, 2, 2, 2.15, 2.25, 2.25, 2.5, 2.5, 2.65, 2.75, 2.75, 3, 3, 3.15, 3.25, 3.4, 3.5, 3.65, 3.75, 4, 4.25, 4.4, 4.65, 5, 5.4, 6, 12.5,
];
/** n=180000, maks. 3.8 */
export const TABELA_TARCIE: number[] = [
  0, 0, 0, 0, 0.3, 0.3, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.75, 0.8, 0.8, 0.8, 0.8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.1, 1.25, 1.25, 1.3, 1.3, 1.3, 1.3, 1.3, 1.5, 1.5, 1.5, 1.5, 1.5, 1.55, 1.6, 1.75, 1.8, 1.8, 2, 2, 2.05, 2.3, 3.8,
];
/**
 * Skale osi dla Finansów i Zdrowia (OsDomeny.tsx) — potencjał i tarcie osobno,
 * ta sama metoda i ta sama próba co dla Predyspozycji. Kontrolnie próba
 * odtwarza istniejące TABELA_FINANSE (n=105389, mediana 1.25, maks. 7.75)
 * i TABELA_ZDROWIE (n=83495, mediana 0.75, maks. 2.35).
 */
/** n=105389, maks. 7.75 */
export const TABELA_FINANSE_POTENCJAL: number[] = [
  0, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 0.5, 0.75, 0.75, 1, 1, 1, 1, 1, 1.25, 1.25, 1.25, 1.25, 1.5, 1.5, 1.5, 1.5, 1.5, 1.75, 1.75, 1.75, 2, 2, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 2.5, 2.5, 2.5, 2.75, 2.75, 3, 3, 3.25, 3.5, 3.75, 3.75, 4, 4.75, 7.75,
];
/** n=105389, maks. 2.65 */
export const TABELA_FINANSE_TARCIE: number[] = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3, 0.4, 0.4, 0.4, 0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.75, 0.75, 0.75, 0.75, 0.75, 0.8, 0.9, 0.9, 0.9, 1, 1.05, 1.15, 1.15, 1.25, 1.25, 1.25, 1.4, 1.65, 1.65, 1.7, 2.65,
];
/** n=83495, maks. 1.9 */
export const TABELA_ZDROWIE_POTENCJAL: number[] = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.5, 0.5, 0.5, 0.9, 0.9, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.5, 1.5, 1.9, 1.9, 1.9,
];
/** n=83495, maks. 2.35 */
export const TABELA_ZDROWIE_TARCIE: number[] = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3, 0.3, 0.3, 0.3, 0.3, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.5, 0.5, 0.7, 0.7, 0.7, 0.75, 0.75, 0.75, 0.75, 0.8, 0.8, 0.9, 1.05, 1.05, 1.05, 1.15, 1.15, 1.2, 1.45, 1.45, 2.35,
];
/** n=105 313, min=0.00, max=7.75 */
export const TABELA_FINANSE: number[] = [
  0, 0, 0, 0.1, 0.15, 0.25, 0.3, 0.4, 0.45, 0.5, 0.5, 0.5, 0.5, 0.6, 0.7, 0.75, 0.75, 0.9, 0.95, 1, 1, 1.05, 1.15, 1.25, 1.25, 1.25, 1.35, 1.5, 1.5, 1.5, 1.65, 1.75, 1.75, 1.8, 2, 2, 2.1, 2.25, 2.25, 2.25, 2.25, 2.5, 2.5, 2.75, 2.85, 3.25, 3.35, 3.75, 3.75, 4.25, 7.75,
];

/** n=83 452, min=0.00, max=2.35 */
export const TABELA_ZDROWIE: number[] = [
  0, 0, 0, 0, 0.1, 0.15, 0.2, 0.25, 0.3, 0.3, 0.35, 0.35, 0.35, 0.4, 0.4, 0.4, 0.4, 0.5, 0.5, 0.55, 0.6, 0.6, 0.7, 0.7, 0.7, 0.75, 0.75, 0.75, 0.9, 0.9, 1, 1, 1, 1, 1, 1, 1.05, 1.05, 1.1, 1.15, 1.25, 1.4, 1.4, 1.4, 1.4, 1.4, 1.45, 1.5, 1.55, 1.9, 2.35,
];

const KROK_PROCENTOWY = 2; // breakpointy co 2 pkt proc. -> 51 wartosci na tabele (0..100)

/**
 * Percentyl siły (0–100) danej wartości bezwzględnej względem tabeli
 * breakpointów tej domeny — ile procent populacji ma tę cechę słabiej
 * zaznaczoną. Interpolacja liniowa między najbliższymi breakpointami;
 * odcinki płaskie (wiele identycznych wartości w próbie, częste blisko 0)
 * zwracają dolny koniec odcinka, żeby nie "przeskakiwać" percentyla bez
 * realnej różnicy w wyniku.
 */
export function percentylSily(wartoscBezwzgledna: number, tabela: number[]): number {
  const abs = Math.abs(wartoscBezwzgledna);
  if (abs <= tabela[0]) return 0;
  if (abs >= tabela[tabela.length - 1]) return 100;
  for (let i = 1; i < tabela.length; i++) {
    if (abs <= tabela[i]) {
      const dolna = tabela[i - 1];
      const gorna = tabela[i];
      const frakcja = gorna === dolna ? 0 : (abs - dolna) / (gorna - dolna);
      return (i - 1) * KROK_PROCENTOWY + frakcja * KROK_PROCENTOWY;
    }
  }
  return 100;
}
