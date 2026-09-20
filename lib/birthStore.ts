import type { Place } from "./geo";
import { PLACES } from "./geo";
import type { Plec } from "@/components/BirthForm";

/**
 * Wspólna pamięć danych urodzenia (localStorage).
 * Dzięki temu KAŻDY moduł liczy z tych samych danych — nakszatra w Kompasie dnia
 * jest identyczna jak w kosmogramie. Wcześniej Kompas przyjmował 12:00 UTC,
 * co przy ruchu Księżyca ~13°/dobę potrafiło dać inną nakszatrę.
 */

const KEY = "9dom_birth_v2";

export interface StoredBirth {
  date: string;      // YYYY-MM-DD
  time: string;      // HH:mm
  timeKnown: boolean;
  place: Place;
  name?: string;
  /** Forma gramatyczna, do której ma zwracać się AI w interpretacjach. */
  plec?: Plec;
  /** Adres do wysyłki raportów (PDF) — domyślnie e-mail konta. */
  emailRaportow?: string;
  /** Kiedy dane zapisano pierwszy raz (ms) — od tego liczy się okno korekty. */
  savedAt?: number;
  /** Zalogowany ma JEDNĄ korektę w 24 h od zapisu — potem dane są stałe. */
  korektaUzyta?: boolean;
}

/** Czy zalogowanemu wolno jeszcze poprawić dane (24 h od zapisu, raz). */
export function korektaDostepna(b: StoredBirth | null): boolean {
  if (!b) return false;
  if (b.korektaUzyta) return false;
  if (!b.savedAt) return false;
  return Date.now() - b.savedAt < 24 * 60 * 60 * 1000;
}

export function loadBirth(): StoredBirth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const b = JSON.parse(raw) as StoredBirth;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date)) return null;
    if (!b.place || typeof b.place.lat !== "number" || typeof b.place.lon !== "number") return null;
    return b;
  } catch {
    return null;
  }
}

export function saveBirth(b: StoredBirth) {
  if (typeof window === "undefined") return;
  try {
    // znacznik pierwszego zapisu i zużytą korektę przenosimy, o ile
    // wywołujący nie ustawił ich świadomie
    const stare = loadBirth();
    const zapis: StoredBirth = {
      ...b,
      savedAt: b.savedAt ?? stare?.savedAt ?? Date.now(),
      korektaUzyta: b.korektaUzyta ?? stare?.korektaUzyta ?? false,
    };
    localStorage.setItem(KEY, JSON.stringify(zapis));
  } catch { /* prywatny tryb przeglądarki */ }
}

/** Domyślne miejsce, gdy użytkownik jeszcze nic nie wybrał. */
export const DEFAULT_PLACE: Place = PLACES[0];
