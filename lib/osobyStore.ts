import type { StoredBirth } from "./birthStore";

/**
 * Lista osób do analizy w kosmogramie — zamiennik dawnego przełącznika
 * "Rodzaj odczytu" (Portret/Dziecko/Finanse/Prognoza). Każdy kafelek na
 * stronie to jedna zapisana osoba, nie tryb odczytu — dane trzymamy
 * w przeglądarce (bez logowania), ten sam kształt co pojedynczy profil
 * w lib/birthStore.ts, tylko jako lista z identyfikatorem.
 */

const KEY = "vk_kosmogram_osoby";

export interface Osoba extends StoredBirth {
  id: string;
}

export function loadOsoby(): Osoba[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as Osoba[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Zapisuje osobę — nadpisuje po id, jeśli już istnieje. */
export function saveOsoba(o: Osoba) {
  if (typeof window === "undefined") return;
  try {
    const list = loadOsoby().filter((x) => x.id !== o.id);
    list.push(o);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* tryb prywatny */
  }
}

export function usunOsobe(id: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(loadOsoby().filter((x) => x.id !== id)));
  } catch {
    /* tryb prywatny */
  }
}
