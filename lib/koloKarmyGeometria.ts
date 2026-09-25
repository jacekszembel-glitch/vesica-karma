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

/** Wołane przy udanym policzeniu/odczytaniu danego systemu — dopisuje go
 *  na stałe. Astrologia = policzony kosmogram, numerologia = policzony
 *  profil liczb, hiromancja = wygenerowany odczyt AI dłoni (nie samo
 *  wejście na stronę). */
export function odblokujSystemKarmy(id: SystemKarmy): void {
  if (typeof window === "undefined") return;
  const set = ukonczoneSystemyKarmy();
  if (set.has(id)) return;
  set.add(id);
  try {
    localStorage.setItem(KLUCZ_POSTEPU, JSON.stringify([...set]));
  } catch {
    /* tryb prywatny — postęp po prostu się nie zapamięta */
  }
}
