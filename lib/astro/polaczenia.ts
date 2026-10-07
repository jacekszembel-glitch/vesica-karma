import type { PlanetId } from "./constants";
import { PLANET_ORDER, RASIS } from "./constants";
import type { VedicChart } from "./chart";
import type { NumerologyResult } from "./numerology";
import { activeChain, vimshottari } from "./dasha";
import {
  DOPELNIACZ, ocenyAstrologii, ocenyNumerologii, wyrazistoscPlanety, PLANETA_CYFRA,
  type DlonWLiczbach, type LiniaDloni, type Most, type RodzajZnaku, type StanLinii, type ZnakDloni,
} from "./zgodnosc";

/**
 * MAPA POŁĄCZEŃ — dłoń i kosmogram to dwa zapisy tego samego, a wspólnym językiem są planety:
 * w niebie planeta ma siłę i dom, w dłoni wzgórek, linię i znaki. Sprawdzamy planeta po planecie,
 * gdzie oba zapisy się spotykają (ręka wiodąca ↔ D1, bierna ↔ D9), i każde spotkanie czytamy jako
 * drogowskaz: CO (planeta), GDZIE (jej dom w D1) i JAK (co pokazuje dłoń). Numerologia na końcu
 * tylko dopełnia; okresy planet mówią, który drogowskaz jest aktywny teraz.
 * Bez statystyki przypadku — to mapa spotkań, nie ranking rzadkości.
 */

export type Glos = 1 | 0.5 | 0;
export type RodzajPolaczenia = "laczy" | "czesciowo" | "tylko_niebo" | "tylko_dlon" | "w_tle" | "brak_danych";

export interface StronaDloni {
  glos: Glos | null;
  dowody: string[];
}
export interface PlanetaMapy {
  planeta: PlanetId;
  niebo: { glos: Glos; dom: number | null; znak: string; powody: string[] };
  niebo9: { glos: Glos; dom: number | null; znak: string };
  wiodaca: StronaDloni;
  bierna: StronaDloni;
  /** Połączenie D1 ↔ ręka wiodąca i D9 ↔ ręka bierna. */
  polaczenie: RodzajPolaczenia;
  polaczenie9: RodzajPolaczenia;
  /** Numerologia: role liczby tej planety. */
  liczby: { cyfra: number; role: string[]; glos: Glos };
  /** Mosty znak ↔ horoskop dotyczące tej planety. */
  mosty: Most[];
  /** Siła drogowskazu: niebo + obie dłonie + liczby (do kolejności). */
  sila: number;
}

export interface MapaPolaczen {
  planety: PlanetaMapy[];
  /** Okres teraz i następne okno dla połączonych planet. */
  teraz: { md: PlanetId; mdDo: number; ad: PlanetId | null; adDo: number | null } | null;
  nastepne: { planeta: PlanetId; od: number; poziom: "okres" | "podokres" } | null;
}

export const MIANOWNIK: Record<PlanetId, string> = {
  sun: "Słońce", moon: "Księżyc", mars: "Mars", mercury: "Merkury", jupiter: "Jowisz",
  venus: "Wenus", saturn: "Saturn", rahu: "Rahu", ketu: "Ketu",
};
/** Co planeta znaczy — krótko. */
export const ZNACZENIE: Record<PlanetId, string> = {
  sun: "tożsamość, przywództwo, sens", moon: "emocje, ludzie, troska", mars: "działanie, odwaga, energia",
  mercury: "umysł, słowo, handel", jupiter: "mądrość, nauczanie, rozwój", venus: "miłość, piękno, sztuka",
  saturn: "praca, wytrwałość, struktura", rahu: "ambicja, nowość, zagranica", ketu: "duchowość, oderwanie, intuicja",
};
/** Klasyczne dziedziny domów. */
export const DOM: Record<number, string> = {
  1: "Ty — ciało, osobowość, własny start", 2: "pieniądze, rodzina, mowa", 3: "wysiłek, odwaga, komunikacja",
  4: "dom, korzenie, spokój serca", 5: "twórczość, dzieci, nauka", 6: "codzienna praca, służba, zdrowie",
  7: "związek, partnerzy, współpraca", 8: "przemiany, ukryta wiedza", 9: "sens, nauczyciele, wiara, dalekie podróże",
  10: "kariera, działanie w świecie", 11: "zyski, przyjaciele, marzenia", 12: "odosobnienie, zagranica, duchowość",
};

/** Linie dłoni należące do planety (klasyczna chiromancja). */
const LINIE_PLANETY: Partial<Record<PlanetId, LiniaDloni[]>> = {
  sun: ["slonca"], moon: ["intuicji", "podrozy"], mars: ["marsa"], mercury: ["merkurego"],
  jupiter: ["pierscien_salomona"], venus: ["pas_wenus"], saturn: ["losu"],
};
const NAZWA_LINII: Record<LiniaDloni, string> = {
  losu: "linia losu", slonca: "linia Słońca", podrozy: "linie podróży", relacji: "linie relacji", serca: "linia serca",
  glowy: "linia głowy", zycia: "linia życia", intuicji: "linia intuicji", merkurego: "linia Merkurego",
  pas_wenus: "pas Wenus", pierscien_salomona: "pierścień Salomona", marsa: "linia Marsa",
};
const STAN: Record<StanLinii, string> = { wyrazna: "wyraźna", odcinkowa: "odcinkami", slaba: "słaba", brak: "brak" };
const ZNAK: Record<RodzajZnaku, string> = {
  x: "X", gwiazda: "gwiazda", kwadrat: "kwadrat", trojkat: "trójkąt", kratka: "kratka", wyspa: "wyspa", kreski: "pionowa linia", kreski_drobne: "drobne pionowe kreski", krzyz_mistyczny: "krzyż mistyczny",
};

/** Głos dłoni dla planety: wzgórek, linia planety i znaki na jej wzgórku (znak = podkreślenie miejsca). */
function strona(planety: DlonWLiczbach["planety"] | undefined, linie: DlonWLiczbach["linie"] | undefined, znaki: ZnakDloni[], p: PlanetId, maDane: boolean): StronaDloni {
  if (!maDane) return { glos: null, dowody: [] };
  const dowody: string[] = [];
  let pkt = 0;
  let sprawdzono = false;
  const w = planety?.[p];
  if (w !== undefined && w !== null) {
    sprawdzono = true;
    if (w === 1) { pkt += 2; dowody.push(`wydatny wzgórek ${DOPELNIACZ[p]}`); }
    if (w === -1) dowody.push(`słaby wzgórek ${DOPELNIACZ[p]}`);
  }
  for (const l of LINIE_PLANETY[p] ?? []) {
    const s = linie?.[l];
    if (!s) continue;
    sprawdzono = true;
    if (s === "wyrazna") { pkt += 1; dowody.push(`${NAZWA_LINII[l]} — ${STAN[s]}`); }
    else if (s === "odcinkowa" || s === "slaba") { pkt += 0.5; dowody.push(`${NAZWA_LINII[l]} — ${STAN[s]}`); }
  }
  const naWzgorku = znaki.filter((z) => z.miejsce === p);
  if (znaki.length || naWzgorku.length) sprawdzono = true;
  for (const z of naWzgorku) {
    pkt += z.pewnosc === "delikatny" ? 0.5 : 1;
    dowody.push(`${ZNAK[z.znak]} na wzgórku ${DOPELNIACZ[p]}${z.pewnosc === "delikatny" ? " (delikatny)" : ""}${z.zrodlo === "osoba" ? " — Twoja obserwacja" : ""}`);
  }
  if (!sprawdzono) return { glos: null, dowody };
  return { glos: pkt >= 2 ? 1 : pkt >= 1 ? 0.5 : 0, dowody };
}

function rodzaj(niebo: Glos, dlon: Glos | null): RodzajPolaczenia {
  if (dlon === null) return "brak_danych";
  if (niebo > 0 && dlon > 0) return niebo === 1 && dlon === 1 ? "laczy" : "czesciowo";
  if (niebo === 1) return "tylko_niebo";
  if (dlon === 1) return "tylko_dlon";
  return "w_tle";
}

const glosZOceny = (o: number | null | undefined): Glos => (o === 1 ? 1 : o === 0 ? 0.5 : 0);

export function mapaPolaczen(chart: VedicChart, d9: VedicChart | null, num: NumerologyResult, dlon: DlonWLiczbach | null, mosty: Most[], teraz = new Date()): MapaPolaczen {
  const a1 = ocenyAstrologii(chart).oceny;
  const a9 = d9 ? ocenyAstrologii(d9).oceny : null;
  const numer = ocenyNumerologii(num).powody;
  const znaki = [...(dlon?.znaki ?? []), ...(dlon?.wlasne ?? [])];
  const zW = znaki.filter((z) => z.reka === "wiodaca");
  const zB = znaki.filter((z) => z.reka === "bierna");
  const maW = !!dlon && (Object.keys(dlon.planety ?? {}).length > 0 || Object.keys(dlon.linie ?? {}).length > 0 || zW.length > 0);
  const maB = !!dlon && (!!dlon.bierna || zB.length > 0);

  const planety = PLANET_ORDER.map((p): PlanetaMapy => {
    const pl = chart.planets[p];
    const nieboGlos = glosZOceny(a1[p]);
    const powody = wyrazistoscPlanety(chart, p).powody.filter((x) => !x.startsWith("siła planety"));
    const n9 = glosZOceny(a9?.[p]);
    const wiodaca = strona(dlon?.planety, dlon?.linie, zW, p, maW);
    const bierna = strona(dlon?.bierna?.planety, dlon?.bierna?.linie, zB, p, maB);
    const r = numer[p];
    const role = [r.mulank && "Mulank", r.bhagyank && "Bhagyank", r.imie && "liczba imienia"].filter(Boolean) as string[];
    if (!role.length && r.wDacie >= 2) role.push(`×${r.wDacie} w dacie`);
    const liczbyGlos: Glos = r.mulank || r.bhagyank || r.imie ? 1 : r.wDacie >= 2 ? 0.5 : 0;
    const sila = nieboGlos * 2 + n9 + (wiodaca.glos ?? 0) * 2 + (bierna.glos ?? 0) + liczbyGlos;
    return {
      planeta: p,
      niebo: { glos: nieboGlos, dom: chart.angles ? pl.house : null, znak: RASIS[pl.sign].pl, powody },
      niebo9: { glos: n9, dom: d9?.angles ? d9.planets[p].house : null, znak: d9 ? RASIS[d9.planets[p].sign].pl : "" },
      wiodaca, bierna,
      polaczenie: rodzaj(nieboGlos, wiodaca.glos),
      polaczenie9: rodzaj(n9, bierna.glos),
      liczby: { cyfra: PLANETA_CYFRA[p], role, glos: liczbyGlos },
      mosty: mosty.filter((m) => m.dlon.includes(`wzgórku ${DOPELNIACZ[p]}`)),
      sila,
    };
  });

  // okresy planet: co trwa teraz i kiedy otwiera się okno połączonej planety
  const okresy = vimshottari(chart.planets.moon.longitude, chart.birth.date, 2);
  const lancuch = activeChain(okresy, teraz);
  const tr = lancuch[0] ? { md: lancuch[0].lord, mdDo: lancuch[0].end.getFullYear(), ad: lancuch[1]?.lord ?? null, adDo: lancuch[1]?.end.getFullYear() ?? null } : null;
  const polaczone = new Set(planety.filter((x) => x.polaczenie === "laczy" || x.polaczenie === "czesciowo").map((x) => x.planeta));
  let nastepne: MapaPolaczen["nastepne"] = null;
  const pod = lancuch[0]?.sub ?? [];
  const nAd = pod.find((x) => x.start > teraz && polaczone.has(x.lord));
  if (nAd) nastepne = { planeta: nAd.lord, od: nAd.start.getFullYear(), poziom: "podokres" };
  else {
    const nMd = okresy.find((x) => x.start > teraz && polaczone.has(x.lord));
    if (nMd) nastepne = { planeta: nMd.lord, od: nMd.start.getFullYear(), poziom: "okres" };
  }
  return { planety, teraz: tr, nastepne };
}
