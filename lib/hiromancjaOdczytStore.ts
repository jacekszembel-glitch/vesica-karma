/**
 * Zapis TYLKO tekstu ostatniego odczytu AI dłoni (nigdy zdjęcia) — potrzebny,
 * żeby /karma mogła pokazać hiromancję jako trzeci głos syntezy bez każenia
 * użytkownikowi przesyłać zdjęć drugi raz. HiromancjaOdczyt.tsx świadomie
 * generuje NA ŻYWO przy każdej wizycie na /hiromancja (zdjęcie nie jest
 * deterministyczne, więc nie ma sensu cache'ować po hashu jak Interpretation.tsx)
 * — to jest tylko druga, osobna kopia OSTATNIEGO wyniku dla Karmy.
 */

import type { DlonWLiczbach } from "./astro/zgodnosc";

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
