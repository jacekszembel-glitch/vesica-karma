import { panchang, personalDay, type Panchang } from "./panchang";
import { allPlanets } from "./ephemeris";
import { numerology } from "./numerology";
import { NAKSHATRAS, GRAHAS, type PlanetId } from "./constants";

/**
 * WYBÓR DATY ŚLUBU (vivaha muhurta).
 *
 * Konkurencja po polsku sprowadza to do zsumowania cyfr daty i zredukowania ich
 * do jednej liczby. My liczymy pełną muhurtę — pięć elementów panczangi plus
 * tarabalę i czandrabalę OBOJGA narzeczonych, bo dzień dobry dla jednej osoby
 * potrafi być nijaki dla drugiej.
 *
 * KONWENCJE (świadome wybory, bo szkoły się różnią — piszemy je wprost):
 * · Nakszatry pomyślne dla ślubu: lista klasyczna z Muhurta Chintamani.
 * · Tithi: odrzucamy rikta (4, 9, 14), nów i pełnię; premiujemy 2, 3, 5, 7, 10, 11, 13.
 * · Vara: wtorek (Mars) i sobota (Saturn) uznawane za niesprzyjające zaślubinom.
 * · Karana Bhadra (Wiszti) wyklucza dzień dla ważnych początków.
 * · Numerologię daty liczymy dodatkowo — bo tego właśnie ludzie szukają — ale
 *   traktujemy ją jako dodatek do muhurty, nie jako podstawę oceny.
 */

/**
 * Nakszatry pomyślne dla zaślubin — dwie rangi wg Muhurta Chintamani.
 * Najwyższa: Rohini, Uttara Phalguni, Uttara Aszadha, Uttara Bhadrapada, Anuradha.
 * Bez tego podziału kilkanaście dni w roku remisowało na 97/100 i ranking
 * wyglądał na zepsuty.
 */
const NAK_SLUBNE_1 = new Set([3, 11, 16, 20, 25]);
const NAK_SLUBNE_2 = new Set([4, 9, 12, 14, 18, 26]);
const NAK_SLUBNE = new Set([...NAK_SLUBNE_1, ...NAK_SLUBNE_2]);
/** Nakszatry wyraźnie odradzane. */
const NAK_ODRADZANE = new Set([1, 2, 5, 8, 15, 17, 24]);

/** Tithi sprzyjające zaślubinom (numer w obrębie połowy miesiąca). */
const TITHI_DOBRE = new Set([2, 3, 5, 7, 10, 11, 13]);
/** Tithi rikta — puste, złe na początki. */
const TITHI_RIKTA = new Set([4, 9, 14]);

/** Dni tygodnia: 0 = niedziela. */
const VARA_DOBRE = new Set([1, 3, 4, 5]);   // pon, śr, czw, pt
const VARA_ZLE = new Set([2, 6]);            // wt (Mars), sob (Saturn)

/** Liczby daty uznawane w numerologii za sprzyjające małżeństwu. */
const LICZBY_DOBRE = new Set([2, 4, 6, 8]);

export interface Czynnik {
  znak: 1 | 0 | -1;
  tekst: string;
}

export interface DzienSlubu {
  data: Date;
  /** Ocena 0-100. */
  ocena: number;
  werdykt: "wyjątkowy" | "bardzo dobry" | "dobry" | "przeciętny" | "odradzany";
  czynniki: Czynnik[];
  panczanga: Panchang;
  /** Liczba daty wg numerologii (redukcja sumy cyfr). */
  liczbaDaty: number;
}

/** Księżyc urodzeniowy z chwili urodzenia — potrzebny do tarabali. */
export function ksiezycUrodzeniowy(utc: Date): number {
  return allPlanets(utc).moon.longitude;
}

/**
 * Ocena jednego dnia jako terminu ślubu.
 * @param dzien data (liczymy dla południa lokalnego — muhurta godzinowa to osobny krok)
 * @param moonA Księżyc urodzeniowy osoby 1 (opcjonalnie)
 * @param moonB Księżyc urodzeniowy osoby 2 (opcjonalnie)
 */
export function ocenDzienSlubu(dzien: Date, moonA?: number, moonB?: number): DzienSlubu {
  const d = new Date(dzien);
  d.setHours(12, 0, 0, 0);
  const p = panchang(d);
  const czynniki: Czynnik[] = [];
  /**
   * Zamiast bazy 50 i twardego sufitu sumujemy wklady i normalizujemy do
   * maksimum osiagalnego przy PODANYCH danych. Wczesniej kilka dobrych
   * czynnikow przebijalo sufit 97 i wszystkie czolowe terminy pokazywaly
   * te sama liczbe — ranking wygladal na zepsuty.
   */
  let suma = 0;
  const dodaj = (x: number) => { suma += x; };

  // ── 1. Nakszatra dnia ──
  const nakIdx = p.moonNakshatra.nakshatra.index;
  const nakNazwa = NAKSHATRAS[nakIdx].pl;
  if (NAK_SLUBNE_1.has(nakIdx)) {
    dodaj(20);
    czynniki.push({ znak: 1, tekst: `nakszatra ${nakNazwa} — jedna z pięciu najlepszych na zaślubiny` });
  } else if (NAK_SLUBNE_2.has(nakIdx)) {
    dodaj(15);
    czynniki.push({ znak: 1, tekst: `nakszatra ${nakNazwa} — klasycznie zalecana na zaślubiny` });
  } else if (NAK_ODRADZANE.has(nakIdx)) {
    dodaj(-20);
    czynniki.push({ znak: -1, tekst: `nakszatra ${nakNazwa} — tradycja odradza ją na ślub` });
  } else {
    czynniki.push({ znak: 0, tekst: `nakszatra ${nakNazwa} — neutralna dla zaślubin` });
  }

  // ── 2. Tithi ──
  const wPolowie = ((p.tithi.num - 1) % 15) + 1;
  if (TITHI_RIKTA.has(wPolowie)) {
    dodaj(-16);
    czynniki.push({ znak: -1, tekst: `tithi ${p.tithi.name} (rikta) — zła na wszelkie początki` });
  } else if (wPolowie === 15) {
    dodaj(-12);
    czynniki.push({ znak: -1, tekst: `${p.tithi.name} — skrajna faza Księżyca, odradzana na ślub` });
  } else if (TITHI_DOBRE.has(wPolowie)) {
    dodaj(12);
    czynniki.push({ znak: 1, tekst: `tithi ${p.tithi.name} — sprzyjająca zaślubinom` });
  }

  // ── 3. Paksza — rosnący Księżyc wspiera to, co ma trwać ──
  if (p.tithi.paksha.startsWith("śukla")) {
    dodaj(8);
    czynniki.push({ znak: 1, tekst: "Księżyc przybywa — energia narastania sprzyja wspólnym początkom" });
  } else {
    dodaj(-6);
    czynniki.push({ znak: -1, tekst: "Księżyc ubywa — lepszy czas na domykanie niż na zaczynanie" });
  }

  // ── 4. Dzień tygodnia ──
  const dow = d.getDay();
  if (VARA_DOBRE.has(dow)) {
    dodaj(10);
    czynniki.push({ znak: 1, tekst: `${p.vara.pl} — dzień ${GRAHAS[p.vara.lord].pl}a, sprzyja zaślubinom` });
  } else if (VARA_ZLE.has(dow)) {
    dodaj(-12);
    czynniki.push({ znak: -1, tekst: `${p.vara.pl} — dzień ${GRAHAS[p.vara.lord].pl}a, tradycyjnie odradzany na ślub` });
  } else {
    czynniki.push({ znak: 0, tekst: `${p.vara.pl} — dzień neutralny` });
  }

  // ── 5. Joga i karana ──
  if (!p.yoga.auspicious) {
    dodaj(-9);
    czynniki.push({ znak: -1, tekst: `joga ${p.yoga.name} — wymaga uważności` });
  } else {
    dodaj(5);
    czynniki.push({ znak: 1, tekst: `joga ${p.yoga.name} — sprzyjająca` });
  }
  if (p.karana.isBhadra) {
    dodaj(-18);
    czynniki.push({ znak: -1, tekst: "karana Bhadra (Wiszti) — tradycja wyklucza ważne początki" });
  }

  // ── 6. Tarabala i czandrabala OBOJGA ──
  for (const [moon, kto] of [[moonA, "narzeczonej"], [moonB, "narzeczonego"]] as const) {
    if (moon === undefined) continue;
    const os = personalDay(moon, p);
    if (os.tara.good) {
      dodaj(8);
      czynniki.push({ znak: 1, tekst: `tara ${os.tara.name} po stronie ${kto} — dzień sprzyja` });
    } else {
      dodaj(-9);
      czynniki.push({ znak: -1, tekst: `tara ${os.tara.name} po stronie ${kto} — ${os.tara.opis}` });
    }
    if (os.chandra.good) {
      dodaj(5);
    } else {
      dodaj(-5);
      czynniki.push({ znak: -1, tekst: `Księżyc w ${os.chandra.house}. domu od Księżyca ${kto} — wymagająco` });
    }
  }

  // ── 6b. Siła Księżyca — im bliżej pełni (rosnąc), tym mocniej; bez remisów ──
  if (p.tithi.paksha.startsWith("śukla")) {
    dodaj(Math.min(4, (wPolowie / 15) * 4));
  }

  // ── 7. Numerologia daty (dodatek, nie podstawa) ──
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const liczbaDaty = numerology(iso, undefined, "wedyjski", d.getFullYear()).destiny;
  if (LICZBY_DOBRE.has(liczbaDaty)) {
    dodaj(4);
    czynniki.push({ znak: 1, tekst: `liczba daty ${liczbaDaty} — w numerologii sprzyja małżeństwu` });
  }

  // maksimum dodatnich wkladow przy tych danych wejsciowych
  const maks = 20 + 12 + 8 + 4 + 10 + 5 + 4 + (moonA !== undefined ? 13 : 0) + (moonB !== undefined ? 13 : 0);
  const ocena = Math.max(3, Math.min(97, Math.round(50 + (suma / maks) * 47)));
  const werdykt =
    ocena >= 82 ? "wyjątkowy" :
    ocena >= 70 ? "bardzo dobry" :
    ocena >= 58 ? "dobry" :
    ocena >= 42 ? "przeciętny" : "odradzany";

  return { data: d, ocena, werdykt, czynniki, panczanga: p, liczbaDaty };
}

/**
 * Najlepsze terminy w podanym przedziale.
 * @param od data początkowa
 * @param doDaty data końcowa (włącznie)
 * @param limit ile dni zwrócić
 */
export function najlepszeTerminy(
  od: Date, doDaty: Date, moonA?: number, moonB?: number, limit = 12,
): DzienSlubu[] {
  const out: DzienSlubu[] = [];
  const kursor = new Date(od);
  kursor.setHours(12, 0, 0, 0);
  const koniec = new Date(doDaty);
  koniec.setHours(12, 0, 0, 0);

  // bezpiecznik: nie liczymy więcej niż dwa lata dziennie
  let licznik = 0;
  while (kursor <= koniec && licznik < 800) {
    out.push(ocenDzienSlubu(new Date(kursor), moonA, moonB));
    kursor.setDate(kursor.getDate() + 1);
    licznik++;
  }

  return out.sort((a, b) => b.ocena - a.ocena || a.data.getTime() - b.data.getTime()).slice(0, limit);
}

/** Wszystkie dni przedziału w kolejności kalendarzowej — do widoku miesięcznego. */
export function kalendarzTerminow(
  od: Date, doDaty: Date, moonA?: number, moonB?: number,
): DzienSlubu[] {
  const out: DzienSlubu[] = [];
  const kursor = new Date(od);
  kursor.setHours(12, 0, 0, 0);
  const koniec = new Date(doDaty);
  koniec.setHours(12, 0, 0, 0);
  let licznik = 0;
  while (kursor <= koniec && licznik < 400) {
    out.push(ocenDzienSlubu(new Date(kursor), moonA, moonB));
    kursor.setDate(kursor.getDate() + 1);
    licznik++;
  }
  return out;
}

/** Pakiet dla interpretacji. */
export function slubDlaAI(dni: DzienSlubu[], imieA?: string, imieB?: string) {
  return {
    para: [imieA || "osoba 1", imieB || "osoba 2"],
    najlepszeTerminy: dni.slice(0, 6).map((d) => ({
      data: d.data.toISOString().slice(0, 10),
      dzienTygodnia: d.panczanga.vara.pl,
      ocena: d.ocena,
      werdykt: d.werdykt,
      nakszatra: d.panczanga.moonNakshatra.nakshatra.pl,
      tithi: d.panczanga.tithi.name,
      paksza: d.panczanga.tithi.paksha,
      liczbaDaty: d.liczbaDaty,
      za: d.czynniki.filter((c) => c.znak === 1).map((c) => c.tekst),
      przeciw: d.czynniki.filter((c) => c.znak === -1).map((c) => c.tekst),
    })),
  };
}

export { NAK_SLUBNE, NAK_ODRADZANE };
export type { PlanetId };
