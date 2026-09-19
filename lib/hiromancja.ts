/**
 * HIROMANCJA — geometria dłoni, część DETERMINISTYCZNA (bez AI).
 *
 * Nie ma gotowego, wiarygodnego rozpoznawania LINII dłoni ze zdjęcia (gotowe
 * biblioteki, np. MediaPipe Hands, wykrywają szkielet — stawy palców — nie
 * bruzdy na skórze). To, co da się policzyć uczciwie i deterministycznie, to
 * PROPORCJE dłoni z punktów, które użytkownik sam wskaże na swoim zdjęciu —
 * stąd tylko typ dłoni (klasyczna zachodnia typologia czterech żywiołów),
 * nie odczyt linii. Odczyt linii to osobna, jakościowa część systemu
 * (Claude Vision, app/api/hiromancja/route.ts) — świadomie NIE tutaj.
 *
 * Jednostka współrzędnych jest nieistotna (mogą to być piksele wyrenderowanego,
 * przeskalowanego CSS-em obrazka) — liczymy wyłącznie STOSUNKI odległości,
 * więc brak skali nie jest problemem.
 */

export interface Punkt { x: number; y: number }

/** Pięć punktów kalibracji dotykanych przez użytkownika na zdjęciu, w tej kolejności. */
export interface PunktyKalibracji {
  /** A — środek bruzdy nadgarstka. */
  nadgarstek: Punkt;
  /** B — podstawa palca środkowego (gdzie łączy się z dłonią). */
  podstawaPalca: Punkt;
  /** C — czubek palca środkowego. */
  szczytPalca: Punkt;
  /** D — lewa krawędź dłoni na wysokości podstawy palców. */
  krawedzLewa: Punkt;
  /** E — prawa krawędź dłoni na wysokości podstawy palców. */
  krawedzPrawa: Punkt;
}

export type TypDloni = "ziemia" | "powietrze" | "ogien" | "woda";

export interface WynikGeometrii {
  dlugoscDloni: number;
  szerokoscDloni: number;
  dlugoscPalca: number;
  /** dlugoscDloni / szerokoscDloni — < progu = kwadratowa, >= progu = wydłużona. */
  stosunekDloni: number;
  /** dlugoscPalca / dlugoscDloni — >= progu = długie palce, < progu = krótkie. */
  stosunekPalca: number;
  typ: TypDloni;
}

export function dist(a: Punkt, b: Punkt): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Progi klasycznej zachodniej typologii czterech żywiołów dłoni — 1.15 dla
 * kształtu dłoni (kwadratowa/wydłużona) i 1.0 dla proporcji palca (krótkie/
 * długie) to najczęściej cytowane wartości w źródłach popularnych o
 * chiromancji. NIE ma tu jednego, naukowo zmierzonego standardu — różne
 * szkoły podają nieco inne progi (kształt: 1.1–1.2; palec: 0.95–1.05). To
 * świadomie przyjęta konwencja, jawnie przyznana użytkownikowi w sekcji
 * metodologii na stronie (ten sam duch co PEWNE/UPROSZCZONE w shadbala.ts).
 */
export const PROG_KSZTALTU_DLONI = 1.15;
export const PROG_PROPORCJI_PALCA = 1.0;

/**
 * Klasyczny podział (Ziemia/Powietrze = kwadratowa dłoń, Ogień/Woda =
 * wydłużona; Ziemia/Ogień = krótkie palce, Powietrze/Woda = długie):
 *   kwadratowa + krótkie palce  → ziemia
 *   kwadratowa + długie palce   → powietrze
 *   wydłużona  + krótkie palce  → ogień
 *   wydłużona  + długie palce   → woda
 */
export function klasyfikujTyp(stosunekDloni: number, stosunekPalca: number): TypDloni {
  const kwadratowa = stosunekDloni < PROG_KSZTALTU_DLONI;
  const dlugiePalce = stosunekPalca >= PROG_PROPORCJI_PALCA;
  if (kwadratowa) return dlugiePalce ? "powietrze" : "ziemia";
  return dlugiePalce ? "woda" : "ogien";
}

export function policzGeometrie(pkt: PunktyKalibracji): WynikGeometrii {
  const dlugoscDloni = dist(pkt.nadgarstek, pkt.podstawaPalca);
  const szerokoscDloni = dist(pkt.krawedzLewa, pkt.krawedzPrawa);
  const dlugoscPalca = dist(pkt.podstawaPalca, pkt.szczytPalca);
  const stosunekDloni = dlugoscDloni / szerokoscDloni;
  const stosunekPalca = dlugoscPalca / dlugoscDloni;
  return {
    dlugoscDloni, szerokoscDloni, dlugoscPalca, stosunekDloni, stosunekPalca,
    typ: klasyfikujTyp(stosunekDloni, stosunekPalca),
  };
}

/**
 * Miękki sanity-check punktów kalibracji — do OSTRZEŻENIA w UI, nie do
 * blokady (użytkownicy mają różny kształt dłoni; punkty "nietypowe" wciąż
 * mogą być poprawne). Sprawdza tylko rażące pomyłki: podstawa palca musi
 * być WYŻEJ niż nadgarstek, czubek palca wyżej niż jego podstawa, a lewa/
 * prawa krawędź nie mogą być tym samym punktem.
 */
export function walidujPunkty(pkt: PunktyKalibracji): boolean {
  const paleWyzejNizNadgarstek = pkt.podstawaPalca.y < pkt.nadgarstek.y;
  const szczytWyzejNizPodstawa = pkt.szczytPalca.y < pkt.podstawaPalca.y;
  const krawedzieRozne = dist(pkt.krawedzLewa, pkt.krawedzPrawa) > 5;
  return paleWyzejNizNadgarstek && szczytWyzejNizPodstawa && krawedzieRozne;
}
