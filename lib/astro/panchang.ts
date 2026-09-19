import { allPlanets } from "./ephemeris";
import { nakshatraOf, type NakshatraPosition } from "./nakshatra";
import { RASI_LOC, NAKSHATRAS, GRAHAS, type PlanetId, PLANET_ORDER } from "./constants";
import { norm360 } from "./math";

/**
 * Panczanga — pięć „kończyn" wedyjskiego dnia + personalizacja
 * (tarabala i czandrabala względem mapy urodzeniowej).
 */

const TITHI_NAMES = [
  "Pratipada", "Dwitija", "Tritija", "Czaturthi", "Panczami",
  "Szaszthi", "Saptami", "Asztami", "Nawami", "Daśami",
  "Ekadaśi", "Dwadaśi", "Trajodaśi", "Czaturdaśi",
];

const YOGA_NAMES = [
  "Wiszkambha", "Priti", "Ajuszman", "Saubhagja", "Śobhana", "Atiganda",
  "Sukarma", "Dhriti", "Śula", "Ganda", "Wriddhi", "Dhruwa", "Wjaghata",
  "Harszana", "Wadżra", "Siddhi", "Wjatipata", "Warijan", "Parigha", "Śiwa",
  "Siddha", "Sadhja", "Śubha", "Śukla", "Brahma", "Indra", "Waidhriti",
];

/**
 * Dziewięć jog uznawanych klasycznie za niepomyślne (indeksy 0-based):
 * Wiszkambha(0), Atiganda(5), Śula(8), Ganda(9), Wjaghata(12),
 * Wadżra(14), Wjatipata(16), Parigha(18), Waidhriti(26).
 * Wcześniej brakowało Wiszkambhy.
 */
const INAUSPICIOUS_YOGAS = new Set([0, 5, 8, 9, 12, 14, 16, 18, 26]);

const KARANA_NAMES = [
  "Bawa", "Balawa", "Kaulawa", "Taitila", "Gara", "Wanidźa", "Wiszti (Bhadra)",
];

const VARA = [
  { pl: "niedziela", lord: "sun" as PlanetId },
  { pl: "poniedziałek", lord: "moon" as PlanetId },
  { pl: "wtorek", lord: "mars" as PlanetId },
  { pl: "środa", lord: "mercury" as PlanetId },
  { pl: "czwartek", lord: "jupiter" as PlanetId },
  { pl: "piątek", lord: "venus" as PlanetId },
  { pl: "sobota", lord: "saturn" as PlanetId },
];

export interface Panchang {
  date: Date;
  /** Tithi 1-30, nazwa, paksza (jasna/ciemna połowa). */
  tithi: { num: number; name: string; paksha: "śukla (przybywający)" | "kryszna (ubywający)"; percent: number };
  vara: { pl: string; lord: PlanetId };
  moonNakshatra: NakshatraPosition;
  moonSign: number;
  yoga: { name: string; auspicious: boolean };
  karana: { name: string; isBhadra: boolean };
  /** Pozycje tranzytowe wszystkich grah (znak + retro). */
  transits: { id: PlanetId; sign: number; retro: boolean }[];
}

export function panchang(date: Date): Panchang {
  const p = allPlanets(date);
  const sun = p.sun.longitude;
  const moon = p.moon.longitude;
  const elong = norm360(moon - sun);

  const tithiIdx = Math.floor(elong / 12);          // 0-29
  const tithiNum = tithiIdx + 1;
  const inPaksha = tithiIdx % 15;                   // 0-14
  const tithiName =
    inPaksha === 14
      ? (tithiIdx < 15 ? "Purnima (pełnia)" : "Amawasja (nów)")
      : TITHI_NAMES[inPaksha];

  const yogaIdx = Math.floor(norm360(sun + moon) / (360 / 27));
  const karanaIdx = Math.floor(elong / 6);          // 0-59
  // 4 karany stałe: Kimstughna (pierwsza połowa tithi 1) i 3 ostatnie
  let karanaName: string;
  if (karanaIdx === 0) karanaName = "Kimstughna";
  else if (karanaIdx >= 57) karanaName = ["Śakuni", "Czatuszpada", "Naga"][karanaIdx - 57];
  else karanaName = KARANA_NAMES[(karanaIdx - 1) % 7];

  return {
    date,
    tithi: {
      num: tithiNum,
      name: tithiName,
      paksha: tithiIdx < 15 ? "śukla (przybywający)" : "kryszna (ubywający)",
      percent: Math.round(((elong % 12) / 12) * 100),
    },
    // dzień tygodnia wg czasu LOKALNEGO użytkownika (nie UTC — inaczej po 22:00
    // w Polsce pokazywałby dzień poprzedni). W tradycji wedyjskiej doba zaczyna
    // się o wschodzie Słońca; przyjmujemy dobę kalendarzową jako przybliżenie.
    vara: VARA[date.getDay()],
    moonNakshatra: nakshatraOf(moon),
    moonSign: Math.floor(moon / 30),
    yoga: { name: YOGA_NAMES[yogaIdx], auspicious: !INAUSPICIOUS_YOGAS.has(yogaIdx) },
    karana: { name: karanaName, isBhadra: karanaName.startsWith("Wiszti") },
    transits: PLANET_ORDER.map((id) => ({
      id,
      sign: Math.floor(p[id].longitude / 30),
      retro: p[id].retrograde,
    })),
  };
}

/** Tarabala — jakość dnia wg relacji nakszatry dnia do nakszatry urodzeniowej. */
const TARA = [
  { name: "Dźanma", good: false, opis: "dzień blisko ciała — oszczędzaj siły, nie forsuj startów" },
  { name: "Sampat", good: true, opis: "dzień pomyślności — dobry na finanse i nowe kroki" },
  { name: "Wipat", good: false, opis: "dzień przeszkód — zostaw ważne decyzje na później" },
  { name: "Kszema", good: true, opis: "dzień dobrostanu — sprzyja opiece nad sobą i bliskimi" },
  { name: "Pratjari", good: false, opis: "dzień tarcia — nie idź na siłę, negocjuj jutro" },
  { name: "Sadhaka", good: true, opis: "dzień realizacji — domykaj cele, działaj" },
  { name: "Wadha", good: false, opis: "dzień napięcia — dbaj o spokój, unikaj ryzyka" },
  { name: "Mitra", good: true, opis: "dzień przyjazny — spotkania, relacje, współpraca" },
  { name: "Parama Mitra", good: true, opis: "dzień wielkiej przyjaźni — bardzo wspierający" },
];

export interface PersonalDay {
  tara: { name: string; good: boolean; opis: string };
  /** Czandrabala: pozycja Księżyca dnia od księżycowego znaku urodzenia (1-12). */
  chandra: { house: number; good: boolean };
  /** Ogólny ton dnia 0-100. */
  score: number;
}

const GOOD_CHANDRA = new Set([1, 3, 6, 7, 10, 11]);

export function personalDay(birthMoonLongitude: number, day: Panchang): PersonalDay {
  const birthNak = nakshatraOf(birthMoonLongitude).nakshatra.index;
  const dayNak = day.moonNakshatra.nakshatra.index;
  const count = ((dayNak - birthNak + 27) % 27) % 9;
  const tara = TARA[count];

  const birthSign = Math.floor(norm360(birthMoonLongitude) / 30);
  const house = ((day.moonSign - birthSign + 12) % 12) + 1;
  const chandraGood = GOOD_CHANDRA.has(house);

  let score = 50;
  score += tara.good ? 20 : -15;
  score += chandraGood ? 15 : -10;
  score += day.yoga.auspicious ? 10 : -10;
  score += day.karana.isBhadra ? -10 : 5;

  return {
    tara,
    chandra: { house, good: chandraGood },
    score: Math.max(5, Math.min(95, score)),
  };
}

/** Pakiet dnia dla AI. */
export function panchangForAI(day: Panchang, personal?: PersonalDay & { birthNakshatra: string }) {
  return {
    data: day.date.toISOString().slice(0, 10),
    dzienTygodnia: `${day.vara.pl} (władca: ${GRAHAS[day.vara.lord].pl})`,
    tithi: `${day.tithi.name} — paksza ${day.tithi.paksha}`,
    nakszatraDnia: {
      nazwa: day.moonNakshatra.nakshatra.pl,
      motyw: day.moonNakshatra.nakshatra.motyw,
      wladca: GRAHAS[day.moonNakshatra.nakshatra.lord].pl,
    },
    joga: `${day.yoga.name}${day.yoga.auspicious ? "" : " (wymagająca)"}`,
    karana: day.karana.name + (day.karana.isBhadra ? " (Bhadra — unikać ważnych startów)" : ""),
    ksiezycW: RASI_LOC[day.moonSign],
    tranzyty: day.transits
      .filter((t) => ["jupiter", "saturn", "rahu", "ketu", "mars"].includes(t.id))
      .map((t) => `${GRAHAS[t.id].pl} w ${RASI_LOC[t.sign]}${t.retro && t.id !== "rahu" && t.id !== "ketu" ? " (retro)" : ""}`),
    ...(personal ? {
      personalizacja: {
        nakszatraUrodzeniowa: personal.birthNakshatra,
        tarabala: `${personal.tara.name} — ${personal.tara.opis}`,
        czandrabala: `Księżyc w ${personal.chandra.house}. domu od Twojego Księżyca (${personal.chandra.good ? "wspierające" : "wymagające"})`,
        tonDnia: `${personal.score}/100`,
      },
    } : {}),
  };
}

export { NAKSHATRAS };
