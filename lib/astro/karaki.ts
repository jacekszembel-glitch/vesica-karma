import { GRAHAS, RASIS, type PlanetId } from "./constants";
import type { VedicChart } from "./chart";

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
  pl: string;
  /** Co ta rola oznacza. */
  znaczenie: string;
  planeta: PlanetId;
  /** Stopień w znaku decydujący o kolejności. */
  stopien: number;
}

const ROLE: { skrot: string; pl: string; znaczenie: string }[] = [
  { skrot: "AK", pl: "Atmakaraka", znaczenie: "dusza — główny temat i cel tego życia" },
  { skrot: "AmK", pl: "Amatjakaraka", znaczenie: "doradca — kariera, powołanie, praca" },
  { skrot: "BK", pl: "Bhratrikaraka", znaczenie: "rodzeństwo, mentorzy, własna odwaga" },
  { skrot: "MK", pl: "Matrikaraka", znaczenie: "matka, dom, poczucie oparcia" },
  { skrot: "PiK", pl: "Pitrikaraka", znaczenie: "ojciec, tradycja, autorytety" },
  { skrot: "PK", pl: "Putrakaraka", znaczenie: "dzieci, uczniowie, twórczość" },
  { skrot: "GK", pl: "Dżnatikaraka", znaczenie: "krewni, rywale, przeszkody do przejścia" },
  { skrot: "DK", pl: "Darakaraka", znaczenie: "partner życiowy, małżeństwo" },
];

/** Osiem karak czarowych wg stopnia w znaku (schemat z Rahu, BPHS). */
export function karakiCzarowe(chart: VedicChart): KarakaCzarowa[] {
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
    .map((k, i) => ({ ...ROLE[i], planeta: k.planeta, stopien: k.stopien }));
}

/** Atmakaraka — skrót po najczęstsze pytanie. */
export function atmakaraka(chart: VedicChart): KarakaCzarowa {
  return karakiCzarowe(chart)[0];
}

export { RASIS, GRAHAS };
