/**
 * Miejscowości do formularza urodzenia.
 * Strefy czasowe: IANA — Luxon rozwiązuje z nich historyczny czas letni/zimowy
 * (Polska zmieniała reguły DST wielokrotnie; baza tz to obsługuje).
 *
 * PLACES = lista podręczna (natychmiastowa). Pełna baza 3500+ polskich
 * miejscowości ładuje się na żądanie przez searchPlaces() — patrz lib/places-pl.ts.
 */

export interface Place {
  name: string;
  lat: number;
  lon: number;
  tz: string;
}

/** Usuwa polskie znaki i porządkuje do porównań. */
export function normalizePlace(s: string): string {
  return s
    .toLowerCase()
    .replace(/ł/g, "l")           // ł nie rozkłada się w NFD — trzeba osobno
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // znaki diakrytyczne łączące
    .trim();
}

let plCache: Place[] | null = null;

/** Ładuje pełną bazę polskich miejscowości (raz, na żądanie). */
async function loadPolishPlaces(): Promise<Place[]> {
  if (plCache) return plCache;
  const { PLACES_PL } = await import("./places-pl");
  plCache = PLACES_PL.map((row) => {
    const [name, lat, lon] = row.split("|");
    return { name, lat: Number(lat), lon: Number(lon), tz: "Europe/Warsaw" };
  });
  return plCache;
}

/**
 * Miasta świata pobieramy z serwera (/api/miejsca), a nie do przeglądarki.
 *
 * Baza cities15000 to 34 tys. miast i 586 KB po kompresji — za dużo, żeby
 * ktoś na telefonie ściągał to tylko po to, by wpisać miejsce urodzenia.
 * Polskie miejscowości zostają lokalnie, więc typowe zapytanie w ogóle nie
 * dotyka sieci, a gdy serwer nie odpowie, formularz nadal działa.
 */
async function searchWorld(query: string): Promise<Place[]> {
  try {
    const res = await fetch(`/api/miejsca?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return (await res.json()) as Place[];
  } catch {
    return []; // brak sieci — zostają wyniki polskie
  }
}

/**
 * Wstępne wczytanie bazy polskiej — wołane, gdy użytkownik dotknie pola.
 * Dzięki temu pierwsze wpisane litery działają natychmiast.
 */
export function preloadPlaces(): void {
  void loadPolishPlaces();
}

/**
 * Wyszukiwanie miejscowości: podręczne (największe miasta) → pełna baza PL →
 * miasta świata z serwera. Ignoruje polskie znaki („raciborz" znajdzie „Racibórz",
 * „sao paulo" znajdzie „São Paulo").
 *
 * Kolejność źródeł ma znaczenie, bo sortowanie jest stabilne: przy równej
 * jakości dopasowania pierwszeństwo mają miejscowości polskie, a w obrębie
 * świata — większe (serwer zwraca je posortowane wg liczby mieszkańców).
 */
export async function searchPlaces(query: string, limit = 30): Promise<Place[]> {
  const q = normalizePlace(query);
  if (q.length < 2) return PLACES.slice(0, limit);

  const score = (p: Place) => {
    const n = normalizePlace(p.name);
    if (n === q) return 0;
    if (n.startsWith(q)) return 1;
    // początek któregoś ze słów — „jork" znajdzie „Nowy Jork"
    if (n.includes(" " + q) || n.includes("(" + q)) return 2;
    if (n.includes(q)) return 3;
    return 99;
  };

  const [pl, world] = await Promise.all([loadPolishPlaces(), searchWorld(query)]);
  const all = [...PLACES, ...pl, ...world];
  const seen = new Set<string>();
  return all
    .map((p) => ({ p, s: score(p) }))
    .filter((x) => x.s < 99)
    .sort((a, b) => a.s - b.s)
    .filter((x) => {
      const k = normalizePlace(x.p.name);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, limit)
    .map((x) => x.p);
}

export const PLACES: Place[] = [
  { name: "Warszawa", lat: 52.2297, lon: 21.0122, tz: "Europe/Warsaw" },
  { name: "Kraków", lat: 50.0647, lon: 19.945, tz: "Europe/Warsaw" },
  { name: "Łódź", lat: 51.7592, lon: 19.456, tz: "Europe/Warsaw" },
  { name: "Wrocław", lat: 51.1079, lon: 17.0385, tz: "Europe/Warsaw" },
  { name: "Poznań", lat: 52.4064, lon: 16.9252, tz: "Europe/Warsaw" },
  { name: "Gdańsk", lat: 54.352, lon: 18.6466, tz: "Europe/Warsaw" },
  { name: "Szczecin", lat: 53.4285, lon: 14.5528, tz: "Europe/Warsaw" },
  { name: "Bydgoszcz", lat: 53.1235, lon: 18.0084, tz: "Europe/Warsaw" },
  { name: "Lublin", lat: 51.2465, lon: 22.5684, tz: "Europe/Warsaw" },
  { name: "Białystok", lat: 53.1325, lon: 23.1688, tz: "Europe/Warsaw" },
  { name: "Katowice", lat: 50.2649, lon: 19.0238, tz: "Europe/Warsaw" },
  { name: "Gdynia", lat: 54.5189, lon: 18.5305, tz: "Europe/Warsaw" },
  { name: "Częstochowa", lat: 50.8118, lon: 19.1203, tz: "Europe/Warsaw" },
  { name: "Radom", lat: 51.4027, lon: 21.1471, tz: "Europe/Warsaw" },
  { name: "Rzeszów", lat: 50.0412, lon: 21.9991, tz: "Europe/Warsaw" },
  { name: "Toruń", lat: 53.0138, lon: 18.5984, tz: "Europe/Warsaw" },
  { name: "Kielce", lat: 50.8661, lon: 20.6286, tz: "Europe/Warsaw" },
  { name: "Gliwice", lat: 50.2945, lon: 18.6714, tz: "Europe/Warsaw" },
  { name: "Zabrze", lat: 50.3249, lon: 18.7857, tz: "Europe/Warsaw" },
  { name: "Olsztyn", lat: 53.7784, lon: 20.4801, tz: "Europe/Warsaw" },
  { name: "Bielsko-Biała", lat: 49.8225, lon: 19.0444, tz: "Europe/Warsaw" },
  { name: "Bytom", lat: 50.3484, lon: 18.9157, tz: "Europe/Warsaw" },
  { name: "Zielona Góra", lat: 51.9356, lon: 15.5062, tz: "Europe/Warsaw" },
  { name: "Rybnik", lat: 50.1022, lon: 18.5463, tz: "Europe/Warsaw" },
  { name: "Opole", lat: 50.6751, lon: 17.9213, tz: "Europe/Warsaw" },
  { name: "Tychy", lat: 50.1372, lon: 18.9646, tz: "Europe/Warsaw" },
  { name: "Gorzów Wielkopolski", lat: 52.7368, lon: 15.2288, tz: "Europe/Warsaw" },
  { name: "Racibórz", lat: 50.0919, lon: 18.2192, tz: "Europe/Warsaw" },
  { name: "Głubczyce", lat: 50.2009, lon: 17.8282, tz: "Europe/Warsaw" },
  { name: "Kędzierzyn-Koźle", lat: 50.3498, lon: 18.2261, tz: "Europe/Warsaw" },
  { name: "Wodzisław Śląski", lat: 50.0035, lon: 18.4721, tz: "Europe/Warsaw" },
  { name: "Nysa", lat: 50.4739, lon: 17.3325, tz: "Europe/Warsaw" },
  { name: "Berlin (Niemcy)", lat: 52.52, lon: 13.405, tz: "Europe/Berlin" },
  { name: "Londyn (Wielka Brytania)", lat: 51.5074, lon: -0.1278, tz: "Europe/London" },
  { name: "Nowy Jork (USA)", lat: 40.7128, lon: -74.006, tz: "America/New_York" },
  { name: "Chicago (USA)", lat: 41.8781, lon: -87.6298, tz: "America/Chicago" },
  { name: "Dublin (Irlandia)", lat: 53.3498, lon: -6.2603, tz: "Europe/Dublin" },
  { name: "Amsterdam (Holandia)", lat: 52.3676, lon: 4.9041, tz: "Europe/Amsterdam" },
  { name: "Paryż (Francja)", lat: 48.8566, lon: 2.3522, tz: "Europe/Paris" },
  { name: "Oslo (Norwegia)", lat: 59.9139, lon: 10.7522, tz: "Europe/Oslo" },
  { name: "Wiedeń (Austria)", lat: 48.2082, lon: 16.3738, tz: "Europe/Vienna" },
  { name: "Kijów (Ukraina)", lat: 50.4501, lon: 30.5234, tz: "Europe/Kyiv" },
  { name: "Wilno (Litwa)", lat: 54.6872, lon: 25.2797, tz: "Europe/Vilnius" },
  { name: "Kolombo (Sri Lanka)", lat: 6.9271, lon: 79.8612, tz: "Asia/Colombo" },
  { name: "Delhi (Indie)", lat: 28.6139, lon: 77.209, tz: "Asia/Kolkata" },
];
