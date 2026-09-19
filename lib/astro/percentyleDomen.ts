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

/** n=180 000, min=0.00, max=9.45 */
export const TABELA_PREDYSPOZYCJE: number[] = [
  0, 0, 0.05, 0.1, 0.15, 0.25, 0.25, 0.25, 0.3, 0.4, 0.45, 0.5, 0.5, 0.5, 0.5, 0.6, 0.7, 0.75, 0.75, 0.75, 0.8, 0.9, 1, 1, 1, 1.05, 1.15, 1.25, 1.25, 1.3, 1.4, 1.5, 1.5, 1.55, 1.7, 1.75, 1.85, 2, 2, 2.2, 2.3, 2.5, 2.65, 2.75, 3, 3.25, 3.5, 3.8, 4.25, 4.85, 9.45,
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
