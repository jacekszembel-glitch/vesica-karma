import { NAKSHATRAS, RASIS, GRAHAS, type PlanetId } from "./constants";
import { nakshatraOf } from "./nakshatra";
import { norm360 } from "./math";

/**
 * Guna Milan (Ashtakoota) — klasyczne wedyjskie dopasowanie partnerów.
 * 8 kut, maks. 36 punktów. Liczone z pozycji Księżyców obojga.
 * Konwencja: „a" = ona / osoba 1, „b" = on / osoba 2 (tradycyjnie liczy się
 * od dziewczyny; dla par bez tego podziału wynik traktujemy symetrycznie).
 */

// ── tabele atrybutów nakszatr (indeks 0-26) ──

/** Nadi: 0=Adi (Vata), 1=Madhya (Pitta), 2=Antya (Kapha). Wzór powtarza się co 9. */
const NADI: number[] = [0,1,2,2,1,0,0,1,2,2,1,0,0,1,2,2,1,0,0,1,2,2,1,0,0,1,2];

/** Yoni — zwierzę nakszatry (14 typów). */
const YONI: number[] = [
  0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1,
];
const YONI_NAMES = [
  "koń", "słoń", "owca", "wąż", "pies", "kot", "szczur", "krowa",
  "bawół", "tygrys", "jeleń", "małpa", "mangusta", "lew",
];
/** Wrogość yoni (pary silnie skonfliktowane). */
const YONI_ENEMIES: [number, number][] = [
  [0, 8], [1, 13], [2, 11], [3, 12], [4, 10], [5, 6], [7, 9],
];

/** Gana: 0=deva, 1=manuszja, 2=rakszasa — bierzemy z NAKSHATRAS. */
const GANA: number[] = NAKSHATRAS.map((n) => (n.gana === "deva" ? 0 : n.gana === "manuszja" ? 1 : 2));

// ── tabele atrybutów znaków (indeks 0-11) ──

/** Varna znaku: 3=Bramin, 2=Kszatrija, 1=Wajśja, 0=Śudra. */
const VARNA: number[] = [2, 1, 0, 3, 2, 1, 0, 3, 2, 1, 0, 3];

/** Vashya — grupa kontroli: 0=czworonóg, 1=człowiek, 2=woda, 3=dziki(lew), 4=owad/skorpion. */
const VASHYA: number[] = [0, 0, 1, 2, 3, 1, 1, 4, 1, 0, 1, 2];
/** Punkty vashya wg pary grup (uproszczona tabela klasyczna, symetryczna dla par grup zgodnych). */
function vashyaPoints(a: number, b: number): number {
  if (a === b) return 2;
  const pair = new Set([a, b]);
  if (pair.has(0) && pair.has(1)) return 1;      // czworonóg-człowiek
  if (pair.has(2) && pair.has(1)) return 1;      // woda-człowiek
  if (pair.has(0) && pair.has(2)) return 1;      // czworonóg-woda
  if (pair.has(3)) return 0.5;                   // lew z czymkolwiek innym
  return 0;
}

/** Przyjaźń planet (uproszczona, symetryczna — z tablicy natural friendship). */
const FRIEND: Record<PlanetId, PlanetId[]> = {
  sun: ["moon", "mars", "jupiter"],
  moon: ["sun", "mercury"],
  mars: ["sun", "moon", "jupiter"],
  mercury: ["sun", "venus"],
  jupiter: ["sun", "moon", "mars"],
  venus: ["mercury", "saturn"],
  saturn: ["mercury", "venus"],
  rahu: [], ketu: [],
};
const ENEMY: Record<PlanetId, PlanetId[]> = {
  sun: ["venus", "saturn"],
  moon: [],
  mars: ["mercury"],
  mercury: ["moon"],
  jupiter: ["mercury", "venus"],
  venus: ["sun", "moon"],
  saturn: ["sun", "moon", "mars"],
  rahu: [], ketu: [],
};

function maitriPoints(lordA: PlanetId, lordB: PlanetId): number {
  if (lordA === lordB) return 5;
  const aF = FRIEND[lordA].includes(lordB);
  const bF = FRIEND[lordB].includes(lordA);
  const aE = ENEMY[lordA].includes(lordB);
  const bE = ENEMY[lordB].includes(lordA);
  if (aF && bF) return 5;
  if ((aF && !bE) || (bF && !aE)) return 4;      // przyjaciel + neutralny
  if (!aF && !aE && !bF && !bE) return 3;        // neutralni
  if ((aF && bE) || (bF && aE)) return 1;        // przyjaciel + wróg
  if (aE && bE) return 0;
  return 0.5;                                     // neutralny + wróg
}

export interface KutaResult {
  name: string;
  sanskrit: string;
  points: number;
  max: number;
  /** Krótki opis, co ta kuta mierzy. */
  opis: string;
  /** Komentarz do wyniku pary. */
  komentarz: string;
}

export interface GunaMilanResult {
  total: number;
  max: 36;
  kutas: KutaResult[];
  /** Werdykt wg klasycznych progów. */
  verdict: "znakomite" | "bardzo dobre" | "dobre" | "przeciętne" | "wymagające";
  /** Ostrzeżenia specjalne (Nadi dosha, Bhakoot dosha, Gana dosha). */
  doshas: string[];
  moonA: { sign: number; nakshatra: number };
  moonB: { sign: number; nakshatra: number };
}

/**
 * @param moonA syderyczna długość Księżyca osoby 1
 * @param moonB syderyczna długość Księżyca osoby 2
 */
export function gunaMilan(moonA: number, moonB: number): GunaMilanResult {
  const nakA = nakshatraOf(moonA).nakshatra.index;
  const nakB = nakshatraOf(moonB).nakshatra.index;
  const signA = Math.floor(norm360(moonA) / 30);
  const signB = Math.floor(norm360(moonB) / 30);
  const lordA = RASIS[signA].lord;
  const lordB = RASIS[signB].lord;
  const kutas: KutaResult[] = [];
  const doshas: string[] = [];

  // 1. VARNA (1 pkt) — zgodność temperamentu duchowego
  // Zasada klasyczna: punkt, gdy varna mężczyzny (b) jest RÓWNA LUB WYŻSZA
  // od varny kobiety (a). Wcześniej porównanie było odwrócone (<=), więc punkt
  // dostawały dokładnie te pary, które wg tradycji nie powinny go dostać.
  const varna = VARNA[signB] >= VARNA[signA] ? 1 : 0;
  kutas.push({
    name: "Varna", sanskrit: "Varna Kuta", points: varna, max: 1,
    opis: "zgodność natury duchowej i ego",
    komentarz: varna ? "naturalna harmonia postaw" : "różne podejście do życia — wymaga wzajemnego szacunku",
  });

  // 2. VASHYA (2 pkt) — wzajemny magnetyzm
  const vashya = vashyaPoints(VASHYA[signA], VASHYA[signB]);
  kutas.push({
    name: "Vashya", sanskrit: "Vashya Kuta", points: vashya, max: 2,
    opis: "wzajemne przyciąganie i wpływ",
    komentarz: vashya >= 1.5 ? "silny naturalny magnetyzm" : vashya >= 1 ? "umiarkowane przyciąganie" : "przyciąganie trzeba pielęgnować świadomie",
  });

  // 3. TARA (3 pkt) — pomyślność gwiazd
  const countAB = ((nakB - nakA + 27) % 27) + 1;
  const countBA = ((nakA - nakB + 27) % 27) + 1;
  const badA = [3, 5, 7].includes(((countAB - 1) % 9) + 1);
  const badB = [3, 5, 7].includes(((countBA - 1) % 9) + 1);
  const tara = !badA && !badB ? 3 : badA !== badB ? 1.5 : 0;
  kutas.push({
    name: "Tara", sanskrit: "Tara Kuta", points: tara, max: 3,
    opis: "wzajemna pomyślność i wsparcie losu",
    komentarz: tara === 3 ? "gwiazdy wzajemnie sobie sprzyjają" : tara > 0 ? "częściowe wsparcie — dbajcie o siebie w trudnych okresach" : "okresy prób wymagają świadomej troski",
  });

  // 4. YONI (4 pkt) — zgodność instynktów i bliskości
  const yA = YONI[nakA], yB = YONI[nakB];
  let yoni: number;
  if (yA === yB) yoni = 4;
  else if (YONI_ENEMIES.some(([x, y]) => (x === yA && y === yB) || (x === yB && y === yA))) yoni = 0;
  else yoni = 2;
  kutas.push({
    name: "Yoni", sanskrit: "Yoni Kuta", points: yoni, max: 4,
    opis: `zgodność instynktów i intymności (${YONI_NAMES[yA]} + ${YONI_NAMES[yB]})`,
    komentarz: yoni === 4 ? "głębokie instynktowne porozumienie" : yoni >= 2 ? "dobra zgodność przy odrobinie uważności" : "bardzo różne natury — bliskość wymaga rozmowy i cierpliwości",
  });

  // 5. GRAHA MAITRI (5 pkt) — przyjaźń władców Księżyców
  const maitri = maitriPoints(lordA, lordB);
  kutas.push({
    name: "Graha Maitri", sanskrit: "Graha Maitri Kuta", points: maitri, max: 5,
    opis: `przyjaźń umysłów (${GRAHAS[lordA].pl} i ${GRAHAS[lordB].pl})`,
    komentarz: maitri >= 4 ? "umysły naturalnie się rozumieją" : maitri >= 3 ? "neutralna, stabilna baza porozumienia" : "różne języki myślenia — uczcie się siebie nawzajem",
  });

  // 6. GANA (6 pkt) — temperament
  const gA = GANA[nakA], gB = GANA[nakB];
  let gana: number;
  if (gA === gB) gana = 6;
  else if ((gA === 0 && gB === 1) || (gA === 1 && gB === 0)) gana = 5;
  else if ((gA === 1 && gB === 2) || (gA === 2 && gB === 1)) gana = 1;
  else gana = 0; // deva-rakszasa
  if (gana <= 1) doshas.push("Gana dosha — wyraźnie różne temperamenty; kluczowa jest akceptacja odmienności partnera.");
  kutas.push({
    name: "Gana", sanskrit: "Gana Kuta", points: gana, max: 6,
    opis: "zgodność temperamentów",
    komentarz: gana >= 5 ? "temperamenty współgrają" : gana > 1 ? "różnice temperamentu do dotarcia" : "przeciwne temperamenty — związek ambitny, ale rozwijający",
  });

  // 7. BHAKOOT (7 pkt) — wzajemne położenie znaków Księżyca
  // Osie 2/12, 5/9 i 6/8 są niepomyślne. Zbiór jest symetryczny, więc
  // wystarczy policzyć odległość w jedną stronę.
  const dist = ((signB - signA + 12) % 12) + 1; // 1-12
  const badBhakoot = [2, 5, 6, 8, 9, 12].includes(dist);
  const bhakoot = badBhakoot ? 0 : 7;
  if (badBhakoot) doshas.push("Bhakoot dosha — układ znaków Księżyca bywa wyzwaniem dla wspólnych finansów/zdrowia; klasycznie neutralizowany, gdy władcy znaków są przyjaciółmi.");
  kutas.push({
    name: "Bhakoot", sanskrit: "Bhakoot Kuta", points: bhakoot, max: 7,
    opis: "harmonia losów i wspólnego życia",
    komentarz: bhakoot === 7 ? "położenie Księżyców wspiera wspólne życie" : "układ wymagający — świadomość wystarczy, by go zrównoważyć",
  });

  // 8. NADI (8 pkt) — najważniejsza: zdrowie i potomstwo
  const nadi = NADI[nakA] !== NADI[nakB] ? 8 : 0;
  if (nadi === 0) doshas.push("Nadi dosha — ta sama nadi; tradycja zaleca uważność o zdrowie i regenerację w związku. Klasycznie znoszona m.in. przy tej samej nakszatrze z różnymi padami.");
  kutas.push({
    name: "Nadi", sanskrit: "Nadi Kuta", points: nadi, max: 8,
    opis: "zgodność energii życiowej",
    komentarz: nadi === 8 ? "energie życiowe się dopełniają" : "ta sama nadi — dbajcie o własną przestrzeń i regenerację",
  });

  const total = Math.round(kutas.reduce((s, k) => s + k.points, 0) * 2) / 2;
  const verdict =
    total >= 32 ? "znakomite" :
    total >= 28 ? "bardzo dobre" :
    total >= 24 ? "dobre" :
    total >= 18 ? "przeciętne" : "wymagające";

  return {
    total, max: 36, kutas, verdict, doshas,
    moonA: { sign: signA, nakshatra: nakA },
    moonB: { sign: signB, nakshatra: nakB },
  };
}
