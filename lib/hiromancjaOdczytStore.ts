/**
 * Zapis TYLKO tekstu ostatniego odczytu AI dłoni (nigdy zdjęcia) — potrzebny,
 * żeby /karma mogła pokazać hiromancję jako trzeci głos syntezy bez każenia
 * użytkownikowi przesyłać zdjęć drugi raz. HiromancjaOdczyt.tsx świadomie
 * generuje NA ŻYWO przy każdej wizycie na /hiromancja (zdjęcie nie jest
 * deterministyczne, więc nie ma sensu cache'ować po hashu jak Interpretation.tsx)
 * — to jest tylko druga, osobna kopia OSTATNIEGO wyniku dla Karmy.
 */

import type { DlonWLiczbach, Ocena, ZnakWlasny } from "./astro/zgodnosc";
import type { PlanetId } from "./astro/constants";

const KLUCZ_KOREKT = "vk_dlon_korekty";

/** Oceny wzgórków poprawione przez osobę (zna swoją dłoń lepiej niż zdjęcie) — mają pierwszeństwo przed AI. */
export function wczytajKorektyDloni(): Partial<Record<PlanetId, Ocena>> {
  if (typeof window === "undefined") return {};
  try {
    const v = JSON.parse(localStorage.getItem(KLUCZ_KOREKT) ?? "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

export function zapiszKorektyDloni(k: Partial<Record<PlanetId, Ocena>>): void {
  try { localStorage.setItem(KLUCZ_KOREKT, JSON.stringify(k)); } catch { /* tryb prywatny */ }
}

const KLUCZ_ZNAKOW = "vk_znaki_wlasne";

/** Znaki, które osoba sama widzi na dłoni — zgłaszane przed odczytem, używane też w mostach na Twojej Karmie. */
export function wczytajZnakiWlasne(): ZnakWlasny[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(KLUCZ_ZNAKOW) ?? "[]");
    return Array.isArray(v) ? (v as ZnakWlasny[]) : [];
  } catch {
    return [];
  }
}

export function zapiszZnakiWlasne(znaki: ZnakWlasny[]): void {
  try { localStorage.setItem(KLUCZ_ZNAKOW, JSON.stringify(znaki)); } catch { /* tryb prywatny */ }
}

const KLUCZ = "vk_hiromancja_odczyt";

export interface OdczytDloniZapisany {
  text: string;
  savedAt: number;
  /** Wzgórki planet i żywioł w liczbach (z bloku danych odczytu) — do porównania trzech systemów. */
  dane?: DlonWLiczbach | null;
}

export function zapiszOdczytDloni(text: string, dane: DlonWLiczbach | null = null): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KLUCZ, JSON.stringify({ text, savedAt: Date.now(), dane }));
  } catch {
    /* tryb prywatny — synteza po prostu obejdzie się bez trzeciego głosu */
  }
}

export function wczytajOdczytDloni(): OdczytDloniZapisany | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KLUCZ);
    return raw ? (JSON.parse(raw) as OdczytDloniZapisany) : null;
  } catch {
    return null;
  }
}
