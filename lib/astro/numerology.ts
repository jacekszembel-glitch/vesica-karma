/**
 * Numerologia w trzech systemach: pitagorejskim, chaldejskim i wedyjskim.
 * Data w formacie ISO (YYYY-MM-DD), imię i nazwisko — łacińskie, polskie
 * znaki diakrytyczne są mapowane na litery bazowe (ś→s, ł→l itd.).
 */

export type NumSystem = "pitagorejski" | "chaldejski" | "wedyjski";

/** Liczby mistrzowskie nie są redukowane w systemie pitagorejskim. */
const MASTER = new Set([11, 22, 33]);

export function reduce(n: number, keepMaster = true): number {
  while (n > 9 && !(keepMaster && MASTER.has(n))) {
    n = String(n).split("").reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

const PL_MAP: Record<string, string> = {
  ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
};

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .split("")
    .map((ch) => PL_MAP[ch] ?? ch)
    .join("")
    .replace(/[^a-z ]/g, "");
}

/** Wartości liter — system pitagorejski (A=1 … I=9, J=1 …). */
function pythagoreanValue(ch: string): number {
  return ((ch.charCodeAt(0) - 97) % 9) + 1;
}

/** Wartości liter — system chaldejski (wibracyjny, 1–8, bez 9). */
const CHALDEAN: Record<string, number> = {
  a: 1, i: 1, j: 1, q: 1, y: 1,
  b: 2, k: 2, r: 2,
  c: 3, g: 3, l: 3, s: 3,
  d: 4, m: 4, t: 4,
  e: 5, h: 5, n: 5, x: 5,
  u: 6, v: 6, w: 6,
  o: 7, z: 7,
  f: 8, p: 8,
};

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);

export interface NumerologyResult {
  /** Liczba drogi życia (z pełnej daty urodzenia). */
  lifePath: number;
  /**
   * Liczba urodzenia / psychiki (z dnia miesiąca) — w wedyjskim: mulank.
   * W pitagorejskim i chaldejskim zachowuje liczby mistrzowskie (11, 22),
   * w wedyjskim jest zawsze zredukowana do 1–9, bo każda cyfra ma swoją planetę.
   */
  birthday: number;
  /** Zawsze 1–9 — podstawa dla planety władającej i siatki Lo Shu. */
  birthdayRoot: number;
  /** Czy dzień urodzenia jest liczbą mistrzowską (11 lub 22). */
  birthdayMaster: boolean;
  /** Liczba przeznaczenia (wedyjski bhagyank = suma całej daty, redukowana zawsze). */
  destiny: number;
  /** Liczba ekspresji (z pełnego imienia i nazwiska). */
  expression: number | null;
  /** Liczba duszy (samogłoski). */
  soulUrge: number | null;
  /** Liczba osobowości (spółgłoski). */
  personality: number | null;
  /** Rok osobisty dla bieżącego roku. */
  personalYear: number;
  /** Siatka Lo Shu (wedyjska): ile razy każda cyfra 1–9 występuje w dacie. */
  loShuGrid: Record<number, number>;
  /** Planeta przypisana mulankowi (numerologia wedyjska). */
  rulingPlanet: string;
}

export const VEDIC_PLANETS: Record<number, string> = {
  1: "Słońce", 2: "Księżyc", 3: "Jowisz", 4: "Rahu", 5: "Merkury",
  6: "Wenus", 7: "Ketu", 8: "Saturn", 9: "Mars",
};

/**
 * Naturalna przyjaźń planet (Parashara), przeindeksowana z planet na cyfry
 * 1–9 wg VEDIC_PLANETS — ta sama treść co FRIENDS/ENEMIES w chart.ts, ale
 * skopiowana tutaj samodzielnie (nie importowana), żeby strona numerologii
 * nie ciągnęła za sobą całego, dużo cięższego grafu modułów kosmogramu
 * (ephemeris, dasha, houses…) tylko po tę jedną małą tabelę. Jeśli FRIENDS/
 * ENEMIES w chart.ts się zmieni, zmień też tutaj.
 */
const FRIENDS_DIGIT: Record<number, number[]> = {
  1: [2, 9, 3], 2: [1, 5], 9: [1, 2, 3], 5: [1, 6], 3: [1, 2, 9],
  6: [5, 8], 8: [5, 6], 4: [6, 8], 7: [9, 3],
};
const ENEMIES_DIGIT: Record<number, number[]> = {
  1: [6, 8], 2: [], 9: [5], 5: [2], 3: [5, 6],
  6: [1, 2], 8: [1, 2, 9], 4: [1, 2], 7: [1, 2],
};

export type PoziomRelacjiPlanet = "wielki przyjaciel" | "przyjaciel" | "neutralny" | "wróg" | "wielki wróg";

function relacjaJednostronna(a: number, b: number): "przyjaciel" | "neutralny" | "wróg" {
  if (a === b) return "przyjaciel";
  if (FRIENDS_DIGIT[a].includes(b)) return "przyjaciel";
  if (ENEMIES_DIGIT[a].includes(b)) return "wróg";
  return "neutralny";
}

/**
 * Relacja Mulank↔Bhagyank przez przyjaźń ich planet — TAK klasyczna
 * numerologia wedyjska łączy te dwie liczby, nie przez sumowanie (nie ma
 * takiej tradycji, sprawdzone). Przyjaźń w Parashara bywa niesymetryczna
 * (np. Rahu przyjaźni się z Wenus, ale Wenus nie odwzajemnia wprost), więc
 * sprawdzamy obie strony i łączymy je w pięć poziomów — dokładnie ta sama
 * zasada (Panczadha Maitri) co przy Szadbali w shadbala.ts, tylko tu obie
 * strony to natural×natural (od Mulanka i od Bhagyanka), nie natural×czasowa.
 */
export function mulankBhagyankRelacja(mulank: number, bhagyank: number): PoziomRelacjiPlanet {
  const ab = relacjaJednostronna(mulank, bhagyank);
  const ba = relacjaJednostronna(bhagyank, mulank);
  if (ab === "przyjaciel" && ba === "przyjaciel") return "wielki przyjaciel";
  if (ab === "wróg" && ba === "wróg") return "wielki wróg";
  if (ab === "neutralny" && ba === "neutralny") return "neutralny";
  if (ab === "wróg" || ba === "wróg") return ab === "przyjaciel" || ba === "przyjaciel" ? "neutralny" : "wróg";
  return "przyjaciel";
}

function digitsOf(s: string): number[] {
  return s.replace(/\D/g, "").split("").map(Number);
}

function nameNumber(
  name: string,
  system: NumSystem,
  filter: (ch: string) => boolean = () => true,
): number | null {
  const clean = normalizeName(name).replace(/ /g, "");
  if (!clean) return null;
  const letters = clean.split("").filter(filter);
  if (!letters.length) return null;
  const sum = letters.reduce(
    (s, ch) => s + (system === "chaldejski" ? CHALDEAN[ch] ?? 0 : pythagoreanValue(ch)),
    0,
  );
  // Chaldejski tradycyjnie nie redukuje liczb złożonych do końca w analizie,
  // ale dla porównywalności zwracamy formę zredukowaną (mistrzowskie zachowane).
  return reduce(sum);
}

/**
 * @param isoDate data urodzenia YYYY-MM-DD
 * @param fullName imię i nazwisko (opcjonalne — bez niego tylko liczby z daty)
 * @param system system wartości liter dla liczb imiennych
 * @param currentYear rok, dla którego liczymy rok osobisty
 */
export function numerology(
  isoDate: string,
  fullName: string | undefined,
  system: NumSystem,
  currentYear: number,
): NumerologyResult {
  const [y, m, d] = isoDate.split("-").map(Number);
  const allDigits = digitsOf(isoDate);
  const keepMaster = system !== "wedyjski";

  const lifePath = reduce(allDigits.reduce((s, x) => s + x, 0), keepMaster);
  // Dzień miesiąca 11 lub 22 to liczba mistrzowska — w systemach zachodnich
  // NIE wolno jej redukować (obiecujemy to wprost w opisie systemu).
  // W wedyjskim mulank musi zostać zredukowany, bo cyfry 1–9 mapują się na planety.
  const birthdayRoot = reduce(d, false);
  const birthday = reduce(d, keepMaster);
  const birthdayMaster = MASTER.has(reduce(d, true)) && reduce(d, true) !== birthdayRoot;
  const destiny = reduce(allDigits.reduce((s, x) => s + x, 0), false);
  const personalYear = reduce(
    reduce(d, false) + reduce(m, false) + reduce(currentYear, false),
    false,
  );

  const loShuGrid: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  for (const digit of allDigits) if (digit > 0) loShuGrid[digit]++;
  void y;

  return {
    lifePath,
    birthday,
    birthdayRoot,
    birthdayMaster,
    destiny,
    expression: fullName ? nameNumber(fullName, system) : null,
    soulUrge: fullName ? nameNumber(fullName, system, (ch) => VOWELS.has(ch)) : null,
    personality: fullName ? nameNumber(fullName, system, (ch) => !VOWELS.has(ch)) : null,
    personalYear,
    loShuGrid,
    // planeta zawsze z formy zredukowanej — VEDIC_PLANETS nie ma klucza 11
    rulingPlanet: VEDIC_PLANETS[birthdayRoot],
  };
}

/**
 * Liczby miesięcy osobistych na 12 miesięcy naprzód, liczone z roku
 * osobistego (ten sam, który zwraca `numerology()`). Miesiąc osobisty =
 * rok osobisty + numer miesiąca, zredukowane do 1–9 — tak samo jak rok
 * osobisty nigdy nie zachowuje liczb mistrzowskich.
 */
export function personalMonths(personalYear: number): number[] {
  return Array.from({ length: 12 }, (_, i) => reduce(personalYear + (i + 1), false));
}

/**
 * NUMEROLOGIA SAMEGO IMIENIA — dla bramki /numerologia-imienia.
 *
 * Liczy trzy liczby imienne we wskazanym systemie oraz rozbicie litera po
 * literze, żeby strona mogła pokazać, SKĄD wynik się wziął — to odróżnia
 * kalkulator od wyroczni.
 */
export interface LiteraWartosc {
  litera: string;
  wartosc: number;
  samogloska: boolean;
}

export interface NumerologiaImienia {
  /** Pełna ekspresja (wszystkie litery). */
  ekspresja: number;
  /** Dusza (samogłoski) — czego naprawdę chcesz. */
  dusza: number;
  /** Osobowość (spółgłoski) — jak widzą Cię inni. */
  osobowosc: number;
  /** Rozbicie po literach — w kolejności imienia i nazwiska. */
  litery: LiteraWartosc[];
  /** Suma przed redukcją — do pokazania rachunku. */
  sumaPelna: number;
}

export function numerologiaImienia(fullName: string, system: NumSystem): NumerologiaImienia | null {
  const clean = normalizeName(fullName).replace(/ /g, "");
  if (!clean) return null;

  const litery: LiteraWartosc[] = clean.split("").map((ch) => ({
    litera: ch,
    wartosc: system === "chaldejski" ? CHALDEAN[ch] ?? 0 : pythagoreanValue(ch),
    samogloska: VOWELS.has(ch),
  }));

  const sumaPelna = litery.reduce((s, l) => s + l.wartosc, 0);
  const sumaSam = litery.filter((l) => l.samogloska).reduce((s, l) => s + l.wartosc, 0);
  const sumaSpol = litery.filter((l) => !l.samogloska).reduce((s, l) => s + l.wartosc, 0);

  return {
    ekspresja: reduce(sumaPelna),
    dusza: sumaSam ? reduce(sumaSam) : 0,
    osobowosc: sumaSpol ? reduce(sumaSpol) : 0,
    litery,
    sumaPelna,
  };
}
