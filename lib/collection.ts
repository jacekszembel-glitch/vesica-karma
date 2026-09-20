/**
 * Kolekcja odczytów — panel zbiera miniatury map, gdy użytkownik policzy
 * dany odczyt. Trzymane lokalnie w przeglądarce (tak jak dane urodzenia),
 * więc nie wymaga konta ani backendu.
 */

export interface KolekcjaItem {
  id: string;
  href: string;
  label: string;
  opis: string;
}

/** Kolejność = kolejność kart w panelu. */
export const KOLEKCJA_ITEMS: KolekcjaItem[] = [
  { id: "kosmogram", href: "/kosmogram", label: "Kosmogram wedyjski", opis: "Twoja mapa nieba z chwili urodzenia" },
  { id: "sciezka", href: "/sciezka", label: "Ścieżka", opis: "Sześć działów życia wokół atmakaraki" },
  { id: "mapa-zycia", href: "/mapa-zycia", label: "Mapa życia", opis: "Cały cykl okresów planetarnych na jednej osi" },
  { id: "nakszatra", href: "/nakszatra", label: "Nakszatra Księżyca", opis: "Medalion Twojej gwiazdy urodzeniowej" },
  { id: "astrokartografia", href: "/astrokartografia", label: "Astrokartografia", opis: "Linie planet na mapie świata" },
  { id: "mapa-lokalna", href: "/mapa-lokalna", label: "Mapa lokalna", opis: "Kierunki planet z Twojego miejsca urodzenia" },
  { id: "relokacja", href: "/relokacja", label: "Relokacja", opis: "Jak zmienia się mapa w innym miejscu" },
];

const KLUCZ = "9dom_kolekcja";

/** Zbiór id odblokowanych odczytów. Bezpieczne w SSR (zwraca pusty zbiór). */
export function odblokowane(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(KLUCZ);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/** Wołane przy udanym policzeniu odczytu — dopisuje id do kolekcji na stałe. */
export function odblokuj(id: string): void {
  if (typeof window === "undefined") return;
  const set = odblokowane();
  if (set.has(id)) return;
  set.add(id);
  try {
    localStorage.setItem(KLUCZ, JSON.stringify([...set]));
  } catch {
    /* tryb prywatny — kolekcja po prostu się nie zapamięta */
  }
}
