/**
 * Geometria Koła Karmy współdzielona między KoloKarmy.tsx (client, hover/linki)
 * i KoloKarmyMini.tsx (statyczny breadcrumb, może renderować się w Server
 * Component) — osobny plik BEZ "use client", żeby import stałych działał
 * identycznie w obu kontekstach.
 */
export type SystemKarmy = "astrologia" | "hiromancja" | "numerologia";

/** Bounding boxy trzech systemowych płatków w przestrzeni kolo-karmy.png
 *  (1260×761) — też używane przez scripts/recolor-kolo-karmy.mjs (GAPY). */
export const SEGMENT_GAPY: Record<SystemKarmy, readonly [number, number, number, number]> = {
  astrologia: [428, 85, 765, 254],
  hiromancja: [325, 300, 559, 605],
  numerologia: [633, 301, 867, 606],
};

const KLUCZ_POSTEPU = "vk_systemy_karmy";

/** Faza 2 reskinu: prawdziwe śledzenie postępu (localStorage, jak
 *  lib/collection.ts) zamiast danych demo z Fazy 1. Bezpieczne w SSR
 *  (zwraca pusty zbiór) — ten plik świadomie nie ma "use client", żeby
 *  import działał identycznie w KoloKarmy.tsx i KoloKarmyMini.tsx. */
export function ukonczoneSystemyKarmy(): Set<SystemKarmy> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(KLUCZ_POSTEPU);
    return new Set(raw ? (JSON.parse(raw) as SystemKarmy[]) : []);
  } catch {
    return new Set();
  }
}

/** Zdarzenie w oknie po zaliczeniu systemu — Koło Karmy zapala krąg na żywo. */
export const ZDARZENIE_POSTEPU = "vk-postep";
/** Kolejka animacji do pokazania („astrologia" | … | "final"), gdy koło będzie widoczne
 *  na ekranie — interpretacja jest na dole strony, koło na górze, więc animacja czeka. */
const KLUCZ_DO_POKAZANIA = "vk_karma_do_pokazania";
export type AnimacjaKarmy = SystemKarmy | "final";

export function animacjeDoPokazania(): AnimacjaKarmy[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KLUCZ_DO_POKAZANIA) ?? "[]") as AnimacjaKarmy[]; } catch { return []; }
}
export function wyczyscAnimacje(): void {
  try { localStorage.removeItem(KLUCZ_DO_POKAZANIA); } catch { /* tryb prywatny */ }
}

/** Wołane po WYGENEROWANIU INTERPRETACJI danego systemu (nie po samym policzeniu) —
 *  dopisuje go na stałe: astrologia = interpretacja kosmogramu, numerologia =
 *  interpretacja liczb, chiromancja = odczyt AI dłoni. Trzeci zaliczony system
 *  dokłada do kolejki animację końcową (całe koło + światło obiegające krąg). */
export function odblokujSystemKarmy(id: SystemKarmy): void {
  if (typeof window === "undefined") return;
  const set = ukonczoneSystemyKarmy();
  if (set.has(id)) return;
  set.add(id);
  try {
    localStorage.setItem(KLUCZ_POSTEPU, JSON.stringify([...set]));
    const kolejka = animacjeDoPokazania();
    kolejka.push(id);
    if (set.size >= 3) kolejka.push("final");
    localStorage.setItem(KLUCZ_DO_POKAZANIA, JSON.stringify(kolejka));
  } catch {
    /* tryb prywatny — postęp po prostu się nie zapamięta */
  }
  window.dispatchEvent(new CustomEvent(ZDARZENIE_POSTEPU, { detail: id }));
}
