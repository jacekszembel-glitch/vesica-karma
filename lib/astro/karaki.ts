import { GRAHAS, RASIS, type PlanetId } from "./constants";
import type { VedicChart } from "./chart";
import type { AstroLocale } from "./i18nAstro";

/**
 * KARAKI — dwa niezależne pojęcia, które łatwo pomylić:
 *
 * 1. JOGAKARAKA (system Parashary) — planeta, która dla danej lagny włada
 *    jednocześnie kendrą (1/4/7/10) i trikoną (1/5/9). Jej okresy są klasycznie
 *    znakomite NIEZALEŻNIE od naturalnej natury planety. Lista jest stała
 *    i bezsporna: Saturn dla lagny Byka i Wagi, Mars dla Raka i Lwa,
 *    Wenus dla Koziorożca i Wodnika.
 *
 * 2. KARAKI CZAROWE (system Dżajminiego) — osiem ról przyznawanych planetom
 *    według stopnia przebytego w znaku: od atmakaraki (dusza, najwyższy stopień)
 *    po darakarakę (partner, najniższy).
 *    KONWENCJA: schemat ośmiu karak z Rahu (BPHS); stopień Rahu liczy się
 *    odwrotnie (30° − pozycja), bo węzeł porusza się wstecz. Część szkół używa
 *    siedmiu karak bez Rahu — piszemy to jawnie, jak wszystkie konwencje.
 */

/** Jogakaraka dla znaku lagny (indeks 0 = Mesza/Baran). */
const JOGAKARAKA: Partial<Record<number, PlanetId>> = {
  1: "saturn",   // Byk
  6: "saturn",   // Waga
  3: "mars",     // Rak
  4: "mars",     // Lew
  9: "venus",    // Koziorożec
  10: "venus",   // Wodnik
};

export function jogakaraka(lagnaSign: number): PlanetId | null {
  return JOGAKARAKA[lagnaSign] ?? null;
}

export interface KarakaCzarowa {
  /** Skrót sanskrycki (AK, AmK…). */
  skrot: string;
  /** Nazwa w polskiej transliteracji — zostaje w payloadzie AI (musi byc po polsku). */
  pl: string;
  /** Nazwa w jezyku strony (EN: standardowa transliteracja, np. Amatyakaraka). */
  nazwa: string;
  /** Co ta rola oznacza. */
  znaczenie: string;
  planeta: PlanetId;
  /** Stopień w znaku decydujący o kolejności. */
  stopien: number;
}

const ROLE: { skrot: string; pl: string; en: string; znaczenie: string; znaczenieEn: string }[] = [
  { skrot: "AK", pl: "Atmakaraka", en: "Atmakaraka", znaczenie: "dusza — główny temat i cel tego życia", znaczenieEn: "the soul — the main theme and purpose of this life" },
  { skrot: "AmK", pl: "Amatjakaraka", en: "Amatyakaraka", znaczenie: "doradca — kariera, powołanie, praca", znaczenieEn: "the advisor — career, calling, work" },
  { skrot: "BK", pl: "Bhratrikaraka", en: "Bhratrikaraka", znaczenie: "rodzeństwo, mentorzy, własna odwaga", znaczenieEn: "siblings, mentors, one's own courage" },
  { skrot: "MK", pl: "Matrikaraka", en: "Matrikaraka", znaczenie: "matka, dom, poczucie oparcia", znaczenieEn: "mother, home, a sense of support" },
  { skrot: "PiK", pl: "Pitrikaraka", en: "Pitrikaraka", znaczenie: "ojciec, tradycja, autorytety", znaczenieEn: "father, tradition, authority figures" },
  { skrot: "PK", pl: "Putrakaraka", en: "Putrakaraka", znaczenie: "dzieci, uczniowie, twórczość", znaczenieEn: "children, students, creativity" },
  { skrot: "GK", pl: "Dżnatikaraka", en: "Gnatikaraka", znaczenie: "krewni, rywale, przeszkody do przejścia", znaczenieEn: "relatives, rivals, obstacles to get through" },
  { skrot: "DK", pl: "Darakaraka", en: "Darakaraka", znaczenie: "partner życiowy, małżeństwo", znaczenieEn: "life partner, marriage" },
];

/** Osiem karak czarowych wg stopnia w znaku (schemat z Rahu, BPHS). `nazwa` i
 *  `znaczenie` sa w jezyku strony; `pl` zostaje polska transliteracja dla AI
 *  (po angielsku "Dżnatikaraka" to "Gnatikaraka", "Amatjakaraka" to "Amatyakaraka"). */
export function karakiCzarowe(chart: VedicChart, locale: AstroLocale = "pl"): KarakaCzarowa[] {
  const kandydaci: { planeta: PlanetId; stopien: number }[] = [
    "sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn",
  ].map((id) => ({
    planeta: id as PlanetId,
    stopien: chart.planets[id as PlanetId].degreeInSign,
  }));
  // Rahu: stopień liczony wstecz, bo węzeł porusza się przeciwnie do planet
  kandydaci.push({ planeta: "rahu", stopien: 30 - chart.planets.rahu.degreeInSign });

  return kandydaci
    .sort((a, b) => b.stopien - a.stopien)
    .map((k, i) => ({
      skrot: ROLE[i].skrot, pl: ROLE[i].pl, nazwa: locale === "en" ? ROLE[i].en : ROLE[i].pl,
      znaczenie: locale === "en" ? ROLE[i].znaczenieEn : ROLE[i].znaczenie,
      planeta: k.planeta, stopien: k.stopien,
    }));
}

/** Atmakaraka — skrót po najczęstsze pytanie. */
export function atmakaraka(chart: VedicChart, locale: AstroLocale = "pl"): KarakaCzarowa {
  return karakiCzarowe(chart, locale)[0];
}

export { RASIS, GRAHAS };
