import { numerology, reduce } from "./numerology";

/**
 * Numerologia partnerska — zgodność dróg życia dwojga ludzi.
 * Klasyczne grupy wibracyjne: mentalna 1-5-7, praktyczna 2-4-8, twórcza 3-6-9.
 */

const GROUP: Record<number, "mentalna" | "praktyczna" | "twórcza"> = {
  1: "mentalna", 5: "mentalna", 7: "mentalna",
  2: "praktyczna", 4: "praktyczna", 8: "praktyczna",
  3: "twórcza", 6: "twórcza", 9: "twórcza",
};

/** Pary szczególnie silne mimo różnych grup (klasyka numerologii partnerskiej). */
const SPECIAL_GOOD = new Set(["1-9", "2-6", "3-5", "4-6", "1-3", "2-9", "6-9"]);
/** Pary klasycznie trudne. */
const SPECIAL_HARD = new Set(["1-8", "4-5", "7-8", "5-6", "1-4"]);

const NUMBER_LOVE: Record<number, string> = {
  1: "lider — potrzebuje podziwu i przestrzeni do inicjatywy",
  2: "partner harmonii — kocha przez bliskość, czułość i współodczuwanie",
  3: "iskra — wnosi radość, słowa i towarzyskość",
  4: "budowniczy — kocha stabilnie, przez czyny i bezpieczeństwo",
  5: "wolny duch — potrzebuje zmiany, podróży i oddechu",
  6: "opiekun — dom, rodzina i troska to jego język miłości",
  7: "głębia — potrzebuje ciszy, rozmów o sensie i zaufania",
  8: "siła — ambicja i lojalność; kocha konkretnie i na serio",
  9: "serce uniwersalne — empatia, idealizm, wielkoduszność",
};

export interface NumPartnerResult {
  lifeA: number;
  lifeB: number;
  /** Po redukcji mistrzowskich do bazy (11→2 itd.) na potrzeby zgodności. */
  baseA: number;
  baseB: number;
  groupA: string;
  groupB: string;
  /** 0-100. */
  score: number;
  label: "dusze bliźniacze" | "bardzo zgodni" | "zgodni" | "uzupełniający się" | "wymagający";
  opisA: string;
  opisB: string;
  masterNote: string | null;
}

export function numerologiaPartnerska(dateA: string, dateB: string): NumPartnerResult {
  const year = new Date().getFullYear();
  const a = numerology(dateA, undefined, "pitagorejski", year);
  const b = numerology(dateB, undefined, "pitagorejski", year);
  const baseA = reduce(a.lifePath, false);
  const baseB = reduce(b.lifePath, false);
  const key = [baseA, baseB].sort((x, y) => x - y).join("-");

  let score: number;
  if (baseA === baseB) score = 88;
  else if (GROUP[baseA] === GROUP[baseB]) score = 82;
  else if (SPECIAL_GOOD.has(key)) score = 76;
  else if (SPECIAL_HARD.has(key)) score = 48;
  else score = 62;

  // liczby mistrzowskie podnoszą głębię związku
  const masters = [a.lifePath, b.lifePath].filter((n) => n > 9);
  if (masters.length) score = Math.min(96, score + 5);

  const label =
    score >= 85 ? "dusze bliźniacze" :
    score >= 75 ? "bardzo zgodni" :
    score >= 60 ? "zgodni" :
    score >= 50 ? "uzupełniający się" : "wymagający";

  return {
    lifeA: a.lifePath, lifeB: b.lifePath, baseA, baseB,
    groupA: GROUP[baseA], groupB: GROUP[baseB],
    score, label,
    opisA: NUMBER_LOVE[baseA],
    opisB: NUMBER_LOVE[baseB],
    masterNote: masters.length
      ? `W związku jest liczba mistrzowska (${masters.join(" i ")}) — większa głębia, ale i większa wrażliwość.`
      : null,
  };
}
