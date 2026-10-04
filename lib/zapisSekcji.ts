import type { KragKarmy } from "./koloKarmyGeometria";

/**
 * Zapis ukończonych sekcji Koła Karmy (localStorage) — w chwili zapalenia kręgu
 * zapamiętujemy dane, z których sekcja była liczona, i tekst interpretacji.
 * Dzięki temu po powrocie sekcja od razu pokazuje wynik, a Mój panel ma listę
 * odczytów do podglądu w każdej chwili. Zdjęć dłoni nigdy nie zapisujemy — tylko tekst.
 */

export interface ZapisSekcji {
  /** Pełny tekst interpretacji (markdown). */
  tekst: string;
  /** Podpis do listy w panelu, np. „Numerologia — Jacek”. */
  podpis: string;
  /** Dane wejściowe sekcji (do ponownego przeliczenia po powrocie). */
  dane?: unknown;
  zapisano: number;
}

const PREFIX = "vk_sekcja_";

export function zapiszSekcje(id: KragKarmy, zapis: Omit<ZapisSekcji, "zapisano">): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFIX + id, JSON.stringify({ ...zapis, zapisano: Date.now() }));
  } catch { /* tryb prywatny albo brak miejsca — sekcja po prostu się nie zapamięta */ }
}

export function wczytajSekcje(id: KragKarmy): ZapisSekcji | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFIX + id);
    const z = raw ? (JSON.parse(raw) as ZapisSekcji) : null;
    return z && typeof z.tekst === "string" ? z : null;
  } catch {
    return null;
  }
}
