import { GRAHAS, NAKSHATRAS, type PlanetId } from "./constants";
import { panchang, personalDay, type Panchang, type PersonalDay } from "./panchang";
import { allPlanets } from "./ephemeris";
import { nakshatraOf, type NakshatraPosition } from "./nakshatra";

/**
 * Doradca muhurty — „czy dziś warto…?”
 * Klasyczne czynniki elekcji: vara (władca dnia), tithi, nakszatra (klasa
 * działania), joga, karana (Bhadra), paksza + personalizacja (tarabala,
 * czandrabala). Zero wróżenia — jawnie pokazujemy, co przemawia za, co przeciw.
 */

/** Klasy działania nakszatr (klasyczny podział muhurty). */
export type NakClass = "stała" | "ruchoma" | "ostra" | "gwałtowna" | "łagodna" | "szybka" | "mieszana";

const NAK_CLASS: NakClass[] = [
  "szybka",     // 0 Aświni
  "gwałtowna",  // 1 Bharani
  "mieszana",   // 2 Krittika
  "stała",      // 3 Rohini
  "łagodna",    // 4 Mrigaśira
  "ostra",      // 5 Ardra
  "ruchoma",    // 6 Punarwasu
  "szybka",     // 7 Puszja
  "ostra",      // 8 Aślesza
  "gwałtowna",  // 9 Magha
  "gwałtowna",  // 10 Purwa Phalguni
  "stała",      // 11 Uttara Phalguni
  "szybka",     // 12 Hasta
  "łagodna",    // 13 Czitra
  "ruchoma",    // 14 Swati
  "mieszana",   // 15 Wiśakha
  "łagodna",    // 16 Anuradha
  "ostra",      // 17 Dżjesztha
  "ostra",      // 18 Mula
  "gwałtowna",  // 19 Purwa Aszadha
  "stała",      // 20 Uttara Aszadha
  "ruchoma",    // 21 Śrawana
  "ruchoma",    // 22 Dhaniszta
  "ruchoma",    // 23 Śatabhisza
  "gwałtowna",  // 24 Purwa Bhadrapada
  "stała",      // 25 Uttara Bhadrapada
  "łagodna",    // 26 Rewati
];

/** Tithi „rikta" (4, 9, 14 w każdej pakszy) — klasycznie złe na nowe początki. */
function isRikta(tithiNum: number): boolean {
  const inPaksha = ((tithiNum - 1) % 15) + 1;
  return [4, 9, 14].includes(inPaksha);
}
/** Tithi „purna" (5, 10, 15) — pełnia sił, dobre na domknięcia i finanse. */
function isPurna(tithiNum: number): boolean {
  const inPaksha = ((tithiNum - 1) % 15) + 1;
  return [5, 10, 15].includes(inPaksha);
}

export interface Activity {
  id: string;
  label: string;
  /** Klucz ikony liniowej (components/icons.tsx). */
  icon: string;
  /** Pytanie pokazywane użytkownikowi. */
  question: string;
  /** Władcy dni sprzyjający / niesprzyjający. */
  goodVara: PlanetId[];
  badVara: PlanetId[];
  goodNak: NakClass[];
  badNak: NakClass[];
  /** Czy działanie to „nowy początek" (wtedy rikta tithi i Bhadra ważą mocniej). */
  isStart: boolean;
  /** Krótka wskazówka, gdy dzień jest słaby. */
  alternative: string;
}

export const ACTIVITIES: Activity[] = [
  {
    id: "biznes", label: "Interesy i umowy", icon: "umowa",
    question: "Czy dziś robić interesy, podpisywać umowy?",
    goodVara: ["mercury", "jupiter"], badVara: ["saturn", "mars"],
    goodNak: ["szybka", "stała", "łagodna"], badNak: ["gwałtowna", "ostra"],
    isStart: true,
    alternative: "Na podpis wybierz najbliższą środę lub czwartek poza tithi rikta.",
  },
  {
    id: "pieniadze", label: "Pieniądze i inwestycje", icon: "pieniadze",
    question: "Czy dziś zajmować się pieniędzmi, inwestować?",
    goodVara: ["jupiter", "venus", "mercury"], badVara: ["saturn", "mars"],
    goodNak: ["stała", "szybka"], badNak: ["ostra", "gwałtowna"],
    isStart: true,
    alternative: "Większe decyzje finansowe najlepiej w czwartek, w rosnącym Księżycu.",
  },
  {
    id: "projekt", label: "Start nowego projektu", icon: "start",
    question: "Czy dziś zaczynać coś nowego?",
    goodVara: ["jupiter", "mercury", "moon"], badVara: ["saturn"],
    goodNak: ["szybka", "stała", "ruchoma"], badNak: ["ostra", "gwałtowna"],
    isStart: true,
    alternative: "Start najlepiej w jasnej pakszy (rosnący Księżyc), z dala od tithi rikta.",
  },
  {
    id: "relacje", label: "Miłość i relacje", icon: "relacje",
    question: "Czy dziś na randkę, ważną rozmowę o uczuciach?",
    goodVara: ["venus", "moon", "jupiter"], badVara: ["saturn", "mars"],
    goodNak: ["łagodna", "stała"], badNak: ["ostra", "gwałtowna"],
    isStart: false,
    alternative: "Piątek i poniedziałek przy łagodnej nakszatrze dają najcieplejszy klimat.",
  },
  {
    id: "rozmowa", label: "Trudna rozmowa", icon: "waga",
    question: "Czy dziś stawiać granice, negocjować, konfrontować?",
    goodVara: ["mars", "sun", "mercury"], badVara: ["moon"],
    goodNak: ["ostra", "gwałtowna", "mieszana"], badNak: ["łagodna"],
    isStart: false,
    alternative: "Ostre nakszatry i wtorek dają siłę przebicia; łagodny dzień rozmyje temat.",
  },
  {
    id: "podroz", label: "Podróż i przeprowadzka", icon: "podroz",
    question: "Czy dziś ruszać w drogę?",
    goodVara: ["moon", "mercury", "venus"], badVara: ["mars", "saturn"],
    goodNak: ["ruchoma", "szybka"], badNak: ["stała"],
    isStart: true,
    alternative: "Ruchome nakszatry (Swati, Śrawana, Dhaniszta) to klasyczny czas drogi.",
  },
  {
    id: "zdrowie", label: "Zdrowie i regeneracja", icon: "zdrowie",
    question: "Czy dziś zadbać o ciało, zacząć kurację?",
    goodVara: ["sun", "moon", "mercury"], badVara: ["saturn"],
    goodNak: ["szybka", "łagodna"], badNak: ["gwałtowna"],
    isStart: true,
    alternative: "Aświni i Puszja to nakszatry uzdrawiania — warto na nie poczekać.",
  },
  {
    id: "nauka", label: "Nauka i egzamin", icon: "nauka",
    question: "Czy dziś się uczyć, zdawać, występować?",
    goodVara: ["mercury", "jupiter", "sun"], badVara: ["saturn"],
    goodNak: ["szybka", "łagodna", "stała"], badNak: ["ostra"],
    isStart: false,
    alternative: "Środa i czwartek to dni Merkurego i Jowisza — umysł pracuje najlepiej.",
  },
  {
    id: "zakup", label: "Duży zakup, dom, auto", icon: "dom",
    question: "Czy dziś kupować coś na lata?",
    goodVara: ["venus", "jupiter", "mars"], badVara: ["saturn"],
    goodNak: ["stała"], badNak: ["ostra", "ruchoma"],
    isStart: true,
    alternative: "Stałe nakszatry (Rohini, Uttara…) sprzyjają rzeczom, które mają trwać.",
  },
  {
    id: "odpoczynek", label: "Odpoczynek i wycofanie", icon: "odpoczynek",
    question: "Czy dziś zwolnić, odpuścić, wycofać się?",
    goodVara: ["saturn", "moon"], badVara: [],
    goodNak: ["ostra", "gwałtowna", "ruchoma"], badNak: [],
    isStart: false,
    alternative: "Dni „wymagające” dla działania są zwykle dobre na regenerację.",
  },
];

export interface AdvisorFactor {
  /** + wspiera, − przeszkadza, 0 neutralne. */
  sign: 1 | -1 | 0;
  text: string;
}

export interface AdvisorResult {
  activity: Activity;
  /** 0–100. */
  score: number;
  verdict: "bardzo dobry" | "dobry" | "przeciętny" | "słaby" | "odradzany";
  factors: AdvisorFactor[];
  tip: string;
}

/**
 * Ocena dnia dla wybranego działania.
 * @param personal opcjonalna personalizacja (tarabala/czandrabala z mapy urodzeniowej)
 */
export function adviseActivity(
  activity: Activity,
  day: Panchang,
  personal?: PersonalDay,
): AdvisorResult {
  const factors: AdvisorFactor[] = [];
  let score = 50;

  // 1. Vara — władca dnia
  const varaLord = day.vara.lord;
  if (activity.goodVara.includes(varaLord)) {
    score += 14;
    factors.push({ sign: 1, text: `${day.vara.pl} — dzień ${GRAHAS[varaLord].pl}a, sprzyja temu obszarowi` });
  } else if (activity.badVara.includes(varaLord)) {
    score -= 14;
    factors.push({ sign: -1, text: `${day.vara.pl} — dzień ${GRAHAS[varaLord].pl}a, nie jest to jego żywioł` });
  } else {
    factors.push({ sign: 0, text: `${day.vara.pl} — dzień neutralny dla tej sprawy` });
  }

  // 2. Nakszatra dnia i jej klasa
  const nakIdx = day.moonNakshatra.nakshatra.index;
  const cls = NAK_CLASS[nakIdx];
  if (activity.goodNak.includes(cls)) {
    score += 16;
    factors.push({ sign: 1, text: `nakszatra ${NAKSHATRAS[nakIdx].pl} (${cls}) — właściwa jakość na to działanie` });
  } else if (activity.badNak.includes(cls)) {
    score -= 16;
    factors.push({ sign: -1, text: `nakszatra ${NAKSHATRAS[nakIdx].pl} (${cls}) — pcha w innym kierunku` });
  } else {
    factors.push({ sign: 0, text: `nakszatra ${NAKSHATRAS[nakIdx].pl} (${cls}) — bez wyraźnego wpływu` });
  }

  // 3. Tithi
  if (activity.isStart && isRikta(day.tithi.num)) {
    score -= 14;
    factors.push({ sign: -1, text: `tithi ${day.tithi.name} (rikta) — klasycznie zła na nowe początki` });
  } else if (isPurna(day.tithi.num)) {
    score += 8;
    factors.push({ sign: 1, text: `tithi ${day.tithi.name} (purna) — pełnia sił, dobra na domknięcia` });
  }

  // 4. Paksza — rosnący Księżyc wspiera wzrost
  if (activity.isStart) {
    if (day.tithi.paksha.startsWith("śukla")) {
      score += 7;
      factors.push({ sign: 1, text: "Księżyc przybywa — energia narastania sprzyja startom" });
    } else {
      score -= 5;
      factors.push({ sign: -1, text: "Księżyc ubywa — lepszy czas na domykanie niż zaczynanie" });
    }
  }

  // 5. Joga
  if (!day.yoga.auspicious) {
    score -= 9;
    factors.push({ sign: -1, text: `joga ${day.yoga.name} — wymaga uważności` });
  } else {
    score += 5;
    factors.push({ sign: 1, text: `joga ${day.yoga.name} — sprzyjająca` });
  }

  // 6. Karana Bhadra (Wiszti) — klasyczne „nic ważnego nie zaczynaj"
  if (day.karana.isBhadra && activity.id !== "odpoczynek") {
    score -= activity.isStart ? 16 : 8;
    factors.push({ sign: -1, text: "karana Bhadra (Wiszti) — tradycja odradza ważne starty" });
  }

  // 7. Personalizacja
  if (personal) {
    if (personal.tara.good) {
      score += 10;
      factors.push({ sign: 1, text: `Twoja tara ${personal.tara.name} — dzień Ci sprzyja` });
    } else {
      score -= 10;
      factors.push({ sign: -1, text: `Twoja tara ${personal.tara.name} — ${personal.tara.opis}` });
    }
    if (personal.chandra.good) {
      score += 8;
      factors.push({ sign: 1, text: `Księżyc w ${personal.chandra.house}. domu od Twojego — wspierająco` });
    } else {
      score -= 8;
      factors.push({ sign: -1, text: `Księżyc w ${personal.chandra.house}. domu od Twojego — wymagająco` });
    }
  }

  score = Math.max(3, Math.min(97, Math.round(score)));
  const verdict =
    score >= 75 ? "bardzo dobry" :
    score >= 60 ? "dobry" :
    score >= 45 ? "przeciętny" :
    score >= 30 ? "słaby" : "odradzany";

  return {
    activity, score, verdict, factors,
    tip: score >= 60
      ? "Dzień gra na Twoją korzyść — działaj."
      : activity.alternative,
  };
}

export interface DayScore {
  date: Date;
  score: number;
  best: string;      // etykieta najlepszego działania
  bestIcon: string;  // klucz ikony najlepszego działania (patrz ACT_ICON)
  worst: string;
  tithiNum: number;   // 1-30 — do rysowania ikony fazy Księżyca
  tithiName: string;
  isBhadra: boolean;
  /** Nakszatra, w której stoi Księżyc tego dnia (z padą — do dymka). */
  moonNakshatra: NakshatraPosition;
}

/**
 * Kalendarz najbliższych dni: ocena ogólna + najlepsze działanie każdego dnia.
 * @param birthMoon syderyczna długość Księżyca urodzeniowego (opcjonalna personalizacja)
 */
export function upcomingDays(days = 30, birthMoon?: number, from = new Date()): DayScore[] {
  const out: DayScore[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * 86400000);
    d.setHours(12, 0, 0, 0);
    const p = panchang(d);
    const pers = birthMoon !== undefined ? personalDay(birthMoon, p) : undefined;
    const results = ACTIVITIES.filter((a) => a.id !== "odpoczynek")
      .map((a) => adviseActivity(a, p, pers))
      .sort((x, y) => y.score - x.score);
    const avg = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
    out.push({
      date: d,
      score: avg,
      best: results[0].activity.label,
      bestIcon: results[0].activity.icon,
      worst: results[results.length - 1].activity.label,
      tithiNum: p.tithi.num,
      tithiName: p.tithi.name,
      isBhadra: p.karana.isBhadra,
      moonNakshatra: p.moonNakshatra,
    });
  }
  return out;
}

/** Skrót: Księżyc urodzeniowy z chwili urodzenia. */
export function natalMoon(birthUtc: Date): number {
  return allPlanets(birthUtc).moon.longitude;
}

export { nakshatraOf, NAK_CLASS };
