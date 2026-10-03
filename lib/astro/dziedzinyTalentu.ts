import { GRAHAS, RASIS, PLANET_ORDER, type PlanetId } from "./constants";
import type { VedicChart } from "./chart";
import { ocenaWladcy } from "./sila";
import { wykryteJogi } from "./yogas";
import { grahaNazwa, type AstroLocale } from "./i18nAstro";

/**
 * DZIEDZINY TALENTU — odpowiedź na pytanie, którego Predyspozycje nie
 * zadają. Predyspozycje to 9 wierszy, po jednym na planetę; talent taki jak
 * muzyka nie należy do jednej planety, tylko wynika z połączenia kilku
 * (Wenus — sztuka, Księżyc — głos, Merkury — rytm) i domów (2. — głos,
 * 3. — muzyka i występy, 5. — twórczość). Tu każda dziedzina zbiera trzy
 * rodzaje klasycznych wskaźników:
 *
 * 1. KARAKI — planety-oznaczniki dziedziny, każda z wagą, liczone tą samą
 *    oceną co Oś życia i dasze (ocenaWladcy BEZ premii za jogi — jogi
 *    liczymy osobno w punkcie 3, żeby nie dublować).
 * 2. DOMY — dla każdego domu dziedziny: połowa oceny jego władcy plus
 *    planety w nim stojące (dobroczyńca pomaga; złoczyńca szkodzi, chyba że
 *    dom jest upaczają 3/6/10/11 — tam złoczyńcy klasycznie się sprawdzają).
 * 3. JOGI — nazwane układy, które tradycja wiąże z daną dziedziną
 *    (Saraswati z nauką i sztuką, Ruczaka ze sportem, Radźa z przywództwem…).
 *
 * Surowa suma nie mówi nic sama w sobie (dziedziny mają różną liczbę
 * wskaźników), więc pokazujemy ją jako percentyl na tle 20 000 losowych map
 * (srednieTalentu.ts) — "wyżej niż u X% osób" w TEJ SAMEJ dziedzinie.
 * Wymaga znanej lagny (domy).
 */

export type DziedzinaTalentu =
  | "muzyka" | "sztuka" | "slowo" | "nauczanie" | "biznes"
  | "technika" | "uzdrawianie" | "sport" | "przywodztwo" | "duchowosc";

interface Definicja {
  karaki: [PlanetId, number][];
  /** Numer domu + jego znaczenie w TEJ dziedzinie (PL, EN). */
  domy: [number, string, string][];
  /** Id jog (dokładne albo prefiks przed "-", np. "radza" łapie "radza-mars-sun"). */
  jogi: string[];
}

export const DEFINICJE_TALENTU: Record<DziedzinaTalentu, Definicja> = {
  muzyka: { karaki: [["venus", 1], ["moon", 0.6], ["mercury", 0.6]], domy: [[2, "głos, śpiew", "voice, singing"], [3, "muzyka, występy", "music, performance"], [5, "twórczość", "creativity"]], jogi: ["saraswati", "mahapurusza-venus"] },
  sztuka: { karaki: [["venus", 1], ["moon", 0.5], ["mercury", 0.3]], domy: [[5, "twórczość", "creativity"], [3, "sprawne ręce, występy", "skilled hands, performance"]], jogi: ["saraswati", "mahapurusza-venus"] },
  slowo: { karaki: [["mercury", 1], ["jupiter", 0.6], ["moon", 0.3]], domy: [[3, "pisanie, komunikacja", "writing, communication"], [2, "mowa", "speech"]], jogi: ["saraswati", "budha-aditja", "mahapurusza-mercury"] },
  nauczanie: { karaki: [["jupiter", 1], ["mercury", 0.5], ["sun", 0.3]], domy: [[5, "nauka, inteligencja", "learning, intelligence"], [9, "wiedza wyższa, nauczyciele", "higher knowledge, teachers"], [2, "mowa", "speech"]], jogi: ["saraswati", "gajakesari", "mahapurusza-jupiter"] },
  biznes: { karaki: [["mercury", 1], ["venus", 0.4], ["jupiter", 0.4]], domy: [[7, "partnerzy, kontrakty", "partners, contracts"], [10, "działanie w świecie", "action in the world"], [11, "zyski", "gains"]], jogi: ["dhana", "lakszmi", "budha-aditja", "mahapurusza-mercury"] },
  technika: { karaki: [["mercury", 0.8], ["saturn", 0.7], ["rahu", 0.7], ["mars", 0.6]], domy: [[3, "sprawne ręce, odwaga", "skilled hands, courage"], [6, "praca codzienna, rozwiązywanie problemów", "daily work, problem-solving"], [10, "działanie w świecie", "action in the world"]], jogi: ["mahapurusza-mercury", "mahapurusza-saturn"] },
  uzdrawianie: { karaki: [["moon", 0.8], ["jupiter", 0.8], ["ketu", 0.5], ["sun", 0.5]], domy: [[6, "choroby, służba", "illness, service"], [12, "szpitale, odosobnienie", "hospitals, seclusion"]], jogi: ["mahapurusza-jupiter", "gajakesari"] },
  sport: { karaki: [["mars", 1], ["sun", 0.5], ["saturn", 0.3]], domy: [[1, "ciało, witalność", "body, vitality"], [3, "odwaga, wysiłek", "courage, effort"], [6, "rywalizacja", "competition"]], jogi: ["mahapurusza-mars"] },
  przywodztwo: { karaki: [["sun", 1], ["mars", 0.4], ["saturn", 0.4], ["jupiter", 0.3]], domy: [[10, "władza, status", "authority, status"], [1, "osobowość, obecność", "personality, presence"]], jogi: ["radza", "amala", "adhi", "ubhajaczari", "mahapurusza-mars", "mahapurusza-saturn"] },
  duchowosc: { karaki: [["ketu", 1], ["jupiter", 0.8], ["saturn", 0.4], ["moon", 0.3]], domy: [[9, "dharma, nauczyciele", "dharma, teachers"], [8, "ukryte, wiedza tajemna", "the hidden, occult knowledge"], [12, "wyzwolenie, medytacja", "liberation, meditation"]], jogi: ["mahapurusza-jupiter", "wiprita"] },
};

export const KOLEJNOSC_TALENTU = Object.keys(DEFINICJE_TALENTU) as DziedzinaTalentu[];

const WAGA_DOMU = 0.7;
const PUNKTY_JOGI = 1.5;
const DOBROCZYNCY: PlanetId[] = ["jupiter", "venus", "mercury", "moon"];
const UPACZAJE = [3, 6, 10, 11];

export interface CzynnikTalentu {
  rodzaj: "planeta" | "dom" | "joga";
  /** Tekst do wyświetlenia w bieżącym locale. */
  tekst: string;
  punkty: number;
}

export interface WynikTalentu {
  id: DziedzinaTalentu;
  punkty: number;
  czynniki: CzynnikTalentu[];
}

const r2 = (x: number) => Math.round(x * 100) / 100;

/** Wszystkie dziedziny dla mapy, w stałej kolejności KOLEJNOSC_TALENTU.
 *  null, gdy brak lagny (bez godziny urodzenia nie ma domów). */
export function dziedzinyTalentu(chart: VedicChart, locale: AstroLocale = "pl"): WynikTalentu[] | null {
  if (!chart.angles) return null;
  const en = locale === "en";
  const lagna = chart.angles.lagnaSign;
  const sila = Object.fromEntries(PLANET_ORDER.map((id) => [id, ocenaWladcy(chart, id).punkty])) as Record<PlanetId, number>;
  const jogi = wykryteJogi(chart, locale);
  const nazwaG = (id: PlanetId) => grahaNazwa(GRAHAS[id], locale);

  return KOLEJNOSC_TALENTU.map((dz) => {
    const d = DEFINICJE_TALENTU[dz];
    const czynniki: CzynnikTalentu[] = [];

    for (const [id, waga] of d.karaki) {
      czynniki.push({
        rodzaj: "planeta",
        tekst: en ? `${nazwaG(id)} — the planet's strength in your chart` : `${nazwaG(id)} — siła planety w Twojej mapie`,
        punkty: r2(sila[id] * waga),
      });
    }

    for (const [nr, znaczeniePl, znaczenieEn] of d.domy) {
      const znak = (lagna + nr - 1) % 12;
      const wladca = RASIS[znak].lord;
      let pkt = sila[wladca] * 0.5;
      const w = PLANET_ORDER.filter((id) => chart.planets[id].sign === znak);
      for (const id of w) pkt += DOBROCZYNCY.includes(id) ? 0.5 : UPACZAJE.includes(nr) ? 0.3 : -0.4;
      const obszar = en ? znaczenieEn : znaczeniePl;
      const kto = w.length ? (en ? `, in it: ${w.map(nazwaG).join(", ")}` : `, w nim: ${w.map(nazwaG).join(", ")}`) : "";
      czynniki.push({
        rodzaj: "dom",
        tekst: en ? `House ${nr} (${obszar}) — ruler ${nazwaG(wladca)}${kto}` : `${nr}. dom (${obszar}) — władca ${nazwaG(wladca)}${kto}`,
        punkty: r2(pkt * WAGA_DOMU),
      });
    }

    const pasuje = (jogaId: string) => d.jogi.some((k) => jogaId === k || jogaId.startsWith(`${k}-`));
    const widziane = new Set<string>();
    for (const j of jogi) {
      if (!pasuje(j.id) || widziane.has(j.nazwa)) continue;
      widziane.add(j.nazwa);
      czynniki.push({ rodzaj: "joga", tekst: `${j.nazwa} — ${j.znaczenie}`, punkty: PUNKTY_JOGI });
    }

    return { id: dz, punkty: r2(czynniki.reduce((s, c) => s + c.punkty, 0)), czynniki };
  });
}
