import { GRAHAS, RASIS, type PlanetId } from "./constants";
import type { VedicChart } from "./chart";
import { aspektuje } from "./sila";
import { domZnaku } from "./yogas";

/**
 * DOSZE KLASYCZNE — programowe wykrywanie klasycznych afflictions, odwrotność
 * `yogas.ts` (tam świadomie pominięte: "nie dosza/afflicted — to osobny,
 * mniej pozytywny temat"). Te same wyliczenia i te same źródła (BPHS,
 * Phaladeepika), ten sam wzorzec: jawne uzasadnienie po polsku dla każdego
 * wpisu, gotowe do pokazania.
 *
 * Różnica względem jog: większość dosz (Kemadruma, Guru Czandal, Śrapit,
 * podstawowa Kalasarpa) liczy się BEZ znanej lagny — tylko warianty Mangal
 * "od lagny" jej wymagają (warianty "od Księżyca" i "od Wenus" nie). Więc
 * `wykryteDosze` nie blokuje się na `!chart.angles` tak jak `wykryteJogi`.
 *
 * Świadomie pominięte (brak ugruntowanej, spójnej reguły w dostępnych
 * źródłach — nie zgadujemy): wiek 28+ i "oboje Manglik" dla Mangal Doszy
 * (to kwestie synastrii/kontekstu czytania, nie natalnej mapy), zniesienie
 * Kalasarpy, Guru Czandal, Śrapit, Angaraka, Grahan i Wisz jogi (źródła
 * klasyczne się tu rozjeżdżają). Pitra Dosza jest w źródłach szczególnie
 * niejednoznaczna (różne szkoły podają różne wyzwalacze) — liczymy tu
 * dwa najczęściej cytowane: koniunkcję Słońce-Rahu i obciążone Słońce
 * w 9. domu; pełna klasyczna ocena bierze pod uwagę więcej (kondycję
 * władcy 9. domu, Saturna w 9. itd.) — nazywamy to wprost uproszczeniem.
 */

export type KategoriaDoszy =
  | "mangal" | "kalasarpa" | "kemadruma" | "guru-chandal" | "shrapit"
  | "pitra" | "angarak" | "grahan" | "vish";

export interface Dosza {
  id: string;
  kategoria: KategoriaDoszy;
  nazwa: string;
  /** Co może utrudniać — po polsku, jednym zdaniem. */
  ryzyko: string;
  /** Dlaczego jest obecna w TEJ mapie — konkretne uzasadnienie. */
  uzasadnienie: string;
  planety: PlanetId[];
  /** Domy do podświetlenia na kole — 1–12 (puste, gdy nie liczone od lagny). */
  domy: number[];
  zniesiona: boolean;
  powodZniesienia: string | null;
}

/** Etykiety kategorii — współdzielone przez wszystkie miejsca, które listują dosze. */
export const ETYKIETA_KATEGORII_DOSZY: Record<KategoriaDoszy, string> = {
  mangal: "Mangal (Kuja) Dosza — tarcie w relacjach",
  kalasarpa: "Kalasarpa Dosza — opóźnienia mimo wysiłku",
  kemadruma: "Kemadruma Dosza — samotność Księżyca",
  "guru-chandal": "Guru Czandal jogi — mądrość skłócona z chaosem",
  shrapit: "Śrapit Dosza — ciężar karmiczny",
  pitra: "Pitra Dosza — obciążenie karmiczne od przodków",
  angarak: "Angarak Dosza — wybuchowość i tarcie",
  grahan: "Grahan Dosza — przyćmione światło",
  vish: "Wisz jogi — gorycz i niepokój",
};

/**
 * Stała kolejność kategorii — dobrana też pod kątem separacji kolorów (CVD):
 * ta konkretna kolejność sąsiedztw (patrz KATEGORIA_KOLOR_DOSZY w KoloDosz.tsx)
 * przechodzi walidator `dataviz` (validate_palette.js) na ciemnej karcie —
 * inna kolejność tych samych dziewięciu barw mogłaby nie przejść testu ΔE.
 */
export const KOLEJNOSC_KATEGORII_DOSZY: KategoriaDoszy[] = [
  "kalasarpa", "kemadruma", "guru-chandal", "mangal", "shrapit", "vish", "pitra", "grahan", "angarak",
];

/**
 * Domy Mangal Doszy — świadomie BEZ 2. domu. Najszerzej cytowana klasyczna
 * lista to 1, 2, 4, 7, 8, 12, ale szkoły się tu różnią: astrolodzy
 * północnoindyjscy pomijają 2. dom, południowoindyjscy — 1. dom. Przyjęta
 * tu konwencja to wariant północnoindyjski (do ewentualnej zmiany, gdyby
 * Jacek chciał pełną listę albo wariant południowy).
 */
const DOMY_MANGAL = [1, 4, 7, 8, 12];
const KLASYCZNE_7: PlanetId[] = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];

/** 12 nazw Kalasarpy wg domu, w którym stoi Rahu licząc od lagny (BPHS). */
const KALASARPA_TYPY: Record<number, string> = {
  1: "Ananta", 2: "Kulika", 3: "Wasuki", 4: "Śankhapala", 5: "Padma", 6: "Mahapadma",
  7: "Takszaka", 8: "Karkotaka", 9: "Śankhaczuda", 10: "Ghataka", 11: "Wiszdhara", 12: "Śeszanaga",
};

/** ── Mangal (Kuja) Dosza ─────────────────────────────────────────────── */
function wykryjMangal(chart: VedicChart): Dosza | null {
  const marsSign = chart.planets.mars.sign;
  const trafienia: string[] = [];

  if (chart.angles) {
    const domOdLagny = domZnaku(chart.angles.lagnaSign, marsSign);
    if (DOMY_MANGAL.includes(domOdLagny)) trafienia.push(`${domOdLagny}. dom od lagny`);
  }
  const domOdKsiezyca = domZnaku(chart.planets.moon.sign, marsSign);
  if (DOMY_MANGAL.includes(domOdKsiezyca)) trafienia.push(`${domOdKsiezyca}. dom od Księżyca`);
  const domOdWenus = domZnaku(chart.planets.venus.sign, marsSign);
  if (DOMY_MANGAL.includes(domOdWenus)) trafienia.push(`${domOdWenus}. dom od Wenus`);

  if (trafienia.length === 0) return null;

  const dignity = chart.planets.mars.dignity;
  const wZnakuLubEgzaltacji = dignity === "władanie" || dignity === "egzaltacja";
  const zJowiszem = chart.planets.jupiter.sign === marsSign || aspektuje(chart, "jupiter", marsSign);
  const zKsiezycem = chart.planets.moon.sign === marsSign || aspektuje(chart, "moon", marsSign);

  let zniesiona = false;
  let powodZniesienia: string | null = null;
  if (wZnakuLubEgzaltacji) {
    zniesiona = true;
    powodZniesienia = `Mars ${dignity === "egzaltacja" ? "w egzaltacji" : "we własnym znaku"} — dosza złagodzona.`;
  } else if (zJowiszem) {
    zniesiona = true;
    powodZniesienia = "Mars w koniunkcji lub aspekcie Jowisza — dobroczyńca łagodzi tarcie.";
  } else if (zKsiezycem) {
    zniesiona = true;
    powodZniesienia = "Mars w koniunkcji lub aspekcie Księżyca — dosza złagodzona.";
  }

  return {
    id: "mangal",
    kategoria: "mangal",
    nazwa: "Mangal (Kuja) Dosza",
    ryzyko: "tarcie i opóźnienia w partnerstwie, skłonność do konfliktu w bliskich relacjach",
    uzasadnienie: `Mars w ${trafienia.join(", ")} — klasyczny układ Mangal Doszy.`,
    planety: ["mars"],
    domy: chart.angles ? [domZnaku(chart.angles.lagnaSign, marsSign)] : [],
    zniesiona,
    powodZniesienia,
  };
}

/** ── Kalasarpa Dosza ─────────────────────────────────────────────────── */
function wykryjKalasarpa(chart: VedicChart): Dosza | null {
  const rahuLon = chart.planets.rahu.longitude;
  const odleglosci = KLASYCZNE_7.map((id) => ((chart.planets[id].longitude - rahuLon + 360) % 360));
  const wszystkiePrzed = odleglosci.every((d) => d > 0 && d < 180);
  const wszystkiePo = odleglosci.every((d) => d > 180 && d < 360);
  if (!wszystkiePrzed && !wszystkiePo) return null;

  let typ: string | null = null;
  if (chart.angles) {
    const domRahu = domZnaku(chart.angles.lagnaSign, chart.planets.rahu.sign);
    typ = KALASARPA_TYPY[domRahu] ?? null;
  }

  return {
    id: "kalasarpa",
    kategoria: "kalasarpa",
    nazwa: typ ? `Kalasarpa Dosza (${typ})` : "Kalasarpa Dosza",
    ryzyko: "opóźnienia mimo wysiłku, gwałtowne wzloty i upadki, poczucie osaczenia",
    uzasadnienie: `Wszystkie siedem klasycznych grah zamkniętych między Rahu a Ketu${typ ? ` — typ ${typ}` : ""}.`,
    planety: ["rahu", "ketu"],
    domy: chart.angles ? [domZnaku(chart.angles.lagnaSign, chart.planets.rahu.sign)] : [],
    zniesiona: false,
    powodZniesienia: null,
  };
}

/** ── Kemadruma Dosza ─────────────────────────────────────────────────── */
function wykryjKemadruma(chart: VedicChart): Dosza | null {
  const moonSign = chart.planets.moon.sign;
  const dom2 = (moonSign + 1) % 12;
  const dom12 = (moonSign + 11) % 12;
  // bez Słońca i węzłów — powszechna reguła (Sun/Rahu/Ketu nie "ratują" Księżyca z osamotnienia
  const inne: PlanetId[] = ["mars", "mercury", "jupiter", "venus", "saturn"];

  const wKoniunkcji = inne.some((id) => chart.planets[id].sign === moonSign);
  const wSasiedztwie = inne.some((id) => chart.planets[id].sign === dom2 || chart.planets[id].sign === dom12);
  if (wKoniunkcji || wSasiedztwie) return null;

  let zniesiona = false;
  let powodZniesienia: string | null = null;
  const dignity = chart.planets.moon.dignity;
  if (chart.angles) {
    const domOdLagny = domZnaku(chart.angles.lagnaSign, moonSign);
    if ([1, 4, 7, 10].includes(domOdLagny)) {
      zniesiona = true;
      powodZniesienia = `Księżyc w kendrze (${domOdLagny}. dom) od lagny — dosza złagodzona.`;
    }
  }
  if (!zniesiona && (aspektuje(chart, "jupiter", moonSign) || aspektuje(chart, "venus", moonSign))) {
    zniesiona = true;
    powodZniesienia = "Księżyc pod aspektem Jowisza lub Wenus — osamotnienie złagodzone.";
  }
  if (!zniesiona && (dignity === "władanie" || dignity === "egzaltacja")) {
    zniesiona = true;
    powodZniesienia = `Księżyc ${dignity === "egzaltacja" ? "w egzaltacji" : "we własnym znaku"} — sam sobie wystarcza.`;
  }

  return {
    id: "kemadruma",
    kategoria: "kemadruma",
    nazwa: "Kemadruma Dosza",
    ryzyko: "poczucie osamotnienia, brak wsparcia mimo starań, niestabilność emocjonalna",
    uzasadnienie: `Brak planet w 2. i 12. znaku od Księżyca (${RASIS[moonSign].pl}) i żadna planeta w koniunkcji z nim.`,
    planety: ["moon"],
    domy: chart.angles ? [domZnaku(chart.angles.lagnaSign, moonSign)] : [],
    zniesiona,
    powodZniesienia,
  };
}

/** ── Guru Czandal jogi ───────────────────────────────────────────────── */
function wykryjGuruChandal(chart: VedicChart): Dosza | null {
  const jupiterSign = chart.planets.jupiter.sign;
  const zWezlem: PlanetId | null =
    chart.planets.rahu.sign === jupiterSign ? "rahu" :
    chart.planets.ketu.sign === jupiterSign ? "ketu" : null;
  if (!zWezlem) return null;

  return {
    id: "guru-chandal",
    kategoria: "guru-chandal",
    nazwa: "Guru Czandal jogi",
    ryzyko: "mądrość skłócona z chaosem — etyczne rozterki, przeszacowane ambicje",
    uzasadnienie: `Jowisz w koniunkcji z ${GRAHAS[zWezlem].pl} w ${RASIS[jupiterSign].pl}.`,
    planety: ["jupiter", zWezlem],
    domy: chart.angles ? [domZnaku(chart.angles.lagnaSign, jupiterSign)] : [],
    zniesiona: false,
    powodZniesienia: null,
  };
}

/** ── Śrapit Dosza ────────────────────────────────────────────────────── */
function wykryjShrapit(chart: VedicChart): Dosza | null {
  const saturnSign = chart.planets.saturn.sign;
  if (chart.planets.rahu.sign !== saturnSign) return null;

  return {
    id: "shrapit",
    kategoria: "shrapit",
    nazwa: "Śrapit Dosza",
    ryzyko: "poczucie karmicznego ciężaru, powtarzalne przeszkody, napięcie z autorytetami",
    uzasadnienie: `Saturn w koniunkcji z Rahu w ${RASIS[saturnSign].pl}.`,
    planety: ["saturn", "rahu"],
    domy: chart.angles ? [domZnaku(chart.angles.lagnaSign, saturnSign)] : [],
    zniesiona: false,
    powodZniesienia: null,
  };
}

/** ── Pitra Dosza ─────────────────────────────────────────────────────── */
function wykryjPitra(chart: VedicChart): Dosza | null {
  const sunSign = chart.planets.sun.sign;
  const trafienia: string[] = [];

  if (chart.planets.rahu.sign === sunSign) trafienia.push("koniunkcja Słońce-Rahu");

  if (chart.angles) {
    const domSlonca = domZnaku(chart.angles.lagnaSign, sunSign);
    if (domSlonca === 9) {
      const obciazone = chart.planets.saturn.sign === sunSign || chart.planets.mars.sign === sunSign
        || aspektuje(chart, "saturn", sunSign) || aspektuje(chart, "mars", sunSign);
      if (obciazone) trafienia.push("Słońce w 9. domu, obciążone Saturnem lub Marsem");
    }
  }

  if (trafienia.length === 0) return null;

  return {
    id: "pitra",
    kategoria: "pitra",
    nazwa: "Pitra Dosza",
    ryzyko: "powtarzalne trudności rodowe, poczucie niespłaconego długu wobec przodków",
    uzasadnienie: `${trafienia.join(", ")} — klasyczny wskaźnik Pitra Doszy. Uproszczenie: pełna ocena`
      + " bierze pod uwagę też kondycję władcy 9. domu, tu nie liczoną.",
    planety: ["sun", "rahu"],
    domy: chart.angles ? [domZnaku(chart.angles.lagnaSign, sunSign)] : [],
    zniesiona: false,
    powodZniesienia: null,
  };
}

/** ── Angarak Dosza ───────────────────────────────────────────────────── */
function wykryjAngarak(chart: VedicChart): Dosza | null {
  const marsSign = chart.planets.mars.sign;
  const zWezlem: PlanetId | null =
    chart.planets.rahu.sign === marsSign ? "rahu" :
    chart.planets.ketu.sign === marsSign ? "ketu" : null;
  if (!zWezlem) return null;

  return {
    id: "angarak",
    kategoria: "angarak",
    nazwa: "Angarak Dosza",
    ryzyko: "wybuchowość, skłonność do wypadków i nagłych konfliktów",
    uzasadnienie: `Mars w koniunkcji z ${GRAHAS[zWezlem].pl} w ${RASIS[marsSign].pl}.`,
    planety: ["mars", zWezlem],
    domy: chart.angles ? [domZnaku(chart.angles.lagnaSign, marsSign)] : [],
    zniesiona: false,
    powodZniesienia: null,
  };
}

/** ── Grahan Dosza (dwa niezależne warianty — słoneczny i księżycowy) ──── */
function wykryjGrahan(chart: VedicChart): Dosza[] {
  const wynik: Dosza[] = [];
  const warianty: { id: PlanetId; etykieta: string }[] = [
    { id: "sun", etykieta: "Słoneczna" },
    { id: "moon", etykieta: "Księżycowa" },
  ];
  for (const w of warianty) {
    const sign = chart.planets[w.id].sign;
    const zWezlem: PlanetId | null =
      chart.planets.rahu.sign === sign ? "rahu" :
      chart.planets.ketu.sign === sign ? "ketu" : null;
    if (!zWezlem) continue;
    wynik.push({
      id: `grahan-${w.id}`,
      kategoria: "grahan",
      nazwa: `Grahan Dosza (${w.etykieta})`,
      ryzyko: w.id === "sun"
        ? "przyćmione poczucie tożsamości i sprawczości, trudność w byciu widzianym"
        : "przyćmiona stabilność emocjonalna, niepokój, zmienne samopoczucie",
      uzasadnienie: `${GRAHAS[w.id].pl} w koniunkcji z ${GRAHAS[zWezlem].pl} w ${RASIS[sign].pl}.`,
      planety: [w.id, zWezlem],
      domy: chart.angles ? [domZnaku(chart.angles.lagnaSign, sign)] : [],
      zniesiona: false,
      powodZniesienia: null,
    });
  }
  return wynik;
}

/** ── Wisz jogi ("trująca" koniunkcja Księżyc-Saturn) ────────────────── */
function wykryjVish(chart: VedicChart): Dosza | null {
  const moonSign = chart.planets.moon.sign;
  if (chart.planets.saturn.sign !== moonSign) return null;

  return {
    id: "vish",
    kategoria: "vish",
    nazwa: "Wisz jogi",
    ryzyko: "gorycz i niepokój emocjonalny, napięcie w relacji z matką lub kobietami w życiu",
    uzasadnienie: `Księżyc w koniunkcji z Saturnem w ${RASIS[moonSign].pl}.`,
    planety: ["moon", "saturn"],
    domy: chart.angles ? [domZnaku(chart.angles.lagnaSign, moonSign)] : [],
    zniesiona: false,
    powodZniesienia: null,
  };
}

/** Wszystkie wykryte dosze w tej konkretnej mapie. Częściowo działa bez chart.angles. */
export function wykryteDosze(chart: VedicChart): Dosza[] {
  return [
    wykryjMangal(chart),
    wykryjKalasarpa(chart),
    wykryjKemadruma(chart),
    wykryjGuruChandal(chart),
    wykryjShrapit(chart),
    wykryjPitra(chart),
    wykryjAngarak(chart),
    ...wykryjGrahan(chart),
    wykryjVish(chart),
  ].filter((d): d is Dosza => d !== null);
}

/**
 * Siła doszy → 0..1, do opacity na wykresie. Zniesiona: płaska, niska wartość
 * (nadal widoczna, ale wyraźnie wyciszona). Mangal i Pitra: gradacja wg
 * liczby trafionych punktów odniesienia — jedyne dosze z naturalną skalą
 * w źródłach. Reszta: obecność jest binarna w klasycznych tekstach, więc
 * pełna siła, gdy aktywna i nie zniesiona.
 */
export function silaDoszy(chart: VedicChart, d: Dosza): number {
  if (d.zniesiona) return 0.2;
  if (d.kategoria === "mangal") {
    const liczbaTrafien = (d.uzasadnienie.match(/dom od/g) ?? []).length;
    return Math.min(1, Math.max(0.33, liczbaTrafien / 3));
  }
  if (d.kategoria === "pitra") {
    const liczbaTrafien = [
      d.uzasadnienie.includes("koniunkcja Słońce-Rahu"),
      d.uzasadnienie.includes("Słońce w 9. domu"),
    ].filter(Boolean).length;
    return liczbaTrafien >= 2 ? 1 : 0.55;
  }
  return 1;
}
