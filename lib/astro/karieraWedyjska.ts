import { GRAHAS, RASIS, PLANET_ORDER, type PlanetId } from "./constants";
import type { VedicChart } from "./chart";
import { ocenaWladcy, aspektuje, type OcenaWladcyZWagami } from "./sila";
import { navamsaSign, dashamsaChart } from "./varga";
import { karakiCzarowe, jogakaraka } from "./karaki";
import { diffAngle } from "./math";
import { wykryteJogi } from "./yogas";
import { grahaNazwa, rasiNazwa, type AstroLocale } from "./i18nAstro";

/**
 * ZAWÓD I KARIERA — druga wersja. Pierwsza (zawodWedyjski.ts, usunięta
 * 10.09.2026) zawsze wstawiała Saturna i Słońce jako "karaki kariery"
 * i oceniała je samą godnością znaku, więc u każdego dominowały te same dwie
 * planety niezależnie od mapy. Tu planeta trafia do zestawienia TYLKO wtedy,
 * gdy w tej konkretnej mapie jest realnie związana z 10. domem (Karma bhava):
 *
 * ZWIĄZEK Z KARIERĄ (zawsze dodatni):
 * - stoi w 10. domu / włada 10. domem — liczone od lagny (najmocniej),
 *   od Księżyca i od Słońca (klasyczne trzy punkty odniesienia),
 * - reguła Warahamihiry (Brihat Dżataka 10): źródło utrzymania wskazuje
 *   władca znaku NAWAMSZY, w której stoi władca 10. domu,
 * - Amatjakaraka (Dżajmini) — klasyczny karaka kariery w TEJ mapie,
 * - D10 (daśamsza): stoi w 10. domu D10, włada lagną albo 10. domem D10,
 * - aspekt na 10. dom od lagny, udział w Radźa jodze.
 * SIŁA PLANETY — wszystkie czynniki ocenaWladcy (te same co Oś życia
 * i dasze, bez premii za jogi) z wagą 0,6: decyduje, czy ten kierunek
 * przyjdzie łatwo, czy będzie wymagał pracy (tarcie).
 *
 * Bilans porównujemy z TĄ SAMĄ planetą u innych ludzi (srednieKariery.ts,
 * 20 000 map, tylko mapy, w których planeta jest związana z karierą).
 * Wymaga znanej lagny.
 */

const WAGA_SILY = 0.6;
/** Minimalny związek z 10. domem, żeby planeta weszła do zestawienia — sam aspekt
 *  albo sam udział w Radźa jodze (ma ją większość ludzi) to za mało. */
const PROG_ZWIAZKU = 1;

export interface WierszKariery {
  id: PlanetId;
  ocena: OcenaWladcyZWagami;
  /** Dlaczego ta planeta mówi o karierze w TEJ mapie. */
  role: string[];
  /** Siła związku z 10. domem (suma punktów powiązań) — o kolejności decyduje ona, nie sama siła planety. */
  zwiazek: number;
}

const r2 = (x: number) => Math.round(x * 100) / 100;

export function ocenaKariery(chart: VedicChart, locale: AstroLocale = "pl"): WierszKariery[] | null {
  if (!chart.angles) return null;
  const en = locale === "en";
  const nazwaG = (id: PlanetId) => grahaNazwa(GRAHAS[id], locale);
  const lagna = chart.angles.lagnaSign;
  const znak10 = (baza: number) => (baza + 9) % 12;

  // wkład "związku z karierą" na planetę: [punkty, tekst]
  const zwiazek = new Map<PlanetId, [number, string][]>();
  const dodaj = (id: PlanetId, pkt: number, pl: string, eng: string) => {
    const l = zwiazek.get(id) ?? [];
    l.push([pkt, en ? eng : pl]);
    zwiazek.set(id, l);
  };

  const PUNKTY_ODNIESIENIA: { baza: number; pl: string; en: string; waga: number }[] = [
    { baza: lagna, pl: "lagny", en: "the lagna", waga: 1 },
    { baza: chart.planets.moon.sign, pl: "Księżyca", en: "the Moon", waga: 0.5 },
    { baza: chart.planets.sun.sign, pl: "Słońca", en: "the Sun", waga: 0.35 },
  ];
  for (const { baza, pl, en: odEn, waga } of PUNKTY_ODNIESIENIA) {
    const z10 = znak10(baza);
    const wladca10 = RASIS[z10].lord;
    for (const id of PLANET_ORDER) {
      if (chart.planets[id].sign === z10) {
        dodaj(id, 2 * waga, `stoi w 10. domu licząc od ${pl}`, `stands in the 10th house from ${odEn}`);
      }
    }
    dodaj(wladca10, 1.5 * waga, `włada 10. domem licząc od ${pl}`, `rules the 10th house from ${odEn}`);
    const dyspozytor = RASIS[navamsaSign(chart.planets[wladca10].longitude)].lord;
    dodaj(dyspozytor, 1.5 * waga,
      `reguła Warahamihiry od ${pl}: władca 10. domu (${nazwaG(wladca10)}) stoi w nawamszy ${rasiNazwa(RASIS[navamsaSign(chart.planets[wladca10].longitude)], "pl")}, którą ona włada — klasyczny wskaźnik źródła utrzymania`,
      `Varahamihira's rule from ${odEn}: the 10th lord (${nazwaG(wladca10)}) stands in the ${rasiNazwa(RASIS[navamsaSign(chart.planets[wladca10].longitude)], "en")} navamsa, which this planet rules — the classical indicator of livelihood`);
  }

  // aspekt na 10. dom od lagny (tylko gdy w nim nie stoi — wtedy już liczona)
  for (const id of PLANET_ORDER) {
    if (chart.planets[id].sign !== znak10(lagna) && aspektuje(chart, id, znak10(lagna))) {
      dodaj(id, 0.5, "aspektuje 10. dom od lagny", "aspects the 10th house from the lagna");
    }
  }

  // Planety stojące RAZEM z władcą 10. domu od lagny — klasycznie współtworzą karierę
  // (ciasne połączenie do 5° mocniej). Gdy władca 10. jest spalony, jego własne znaczenia
  // słabną, a temat zawodowy przejmują planety obok — dodatkowa premia dla nich (spalenie
  // samego władcy liczy się już w jego sile, więc on nie traci tu punktów).
  {
    const l10 = RASIS[znak10(lagna)].lord;
    const p10 = chart.planets[l10];
    for (const id of PLANET_ORDER) {
      if (id === l10 || chart.planets[id].sign !== p10.sign) continue;
      const dyst = Math.abs(diffAngle(chart.planets[id].longitude, p10.longitude));
      const ciasno = dyst <= 5;
      dodaj(id, ciasno ? 1.5 : 1,
        `stoi razem z władcą 10. domu (${nazwaG(l10)})${ciasno ? ` — ciasno, ${dyst.toFixed(0)}°` : ""}`,
        `stands together with the 10th lord (${nazwaG(l10)})${ciasno ? ` — closely, ${dyst.toFixed(0)}°` : ""}`);
      if (p10.combust) {
        dodaj(id, 0.5,
          `władca 10. domu (${nazwaG(l10)}) jest spalony — jego temat zawodowy przejmują planety stojące obok`,
          `the 10th lord (${nazwaG(l10)}) is combust — its career theme passes to the planets standing next to it`);
      }
    }
  }

  // Jogakaraka — jedna planeta włada jednocześnie kendrą i trikoną od lagny:
  // najsilniejszy wskaźnik statusu i powodzenia w działaniu dla tej lagny
  const jk = jogakaraka(lagna);
  if (jk) {
    dodaj(jk, 1,
      `jogakaraka dla lagny ${rasiNazwa(RASIS[lagna], "pl")} — włada naraz kendrą i trikoną, najsilniejszy wskaźnik statusu i powodzenia`,
      `yogakaraka for ${rasiNazwa(RASIS[lagna], "en")} lagna — rules a kendra and a trikona at once, the strongest indicator of status and success`);
  }

  // Amatjakaraka — kariera w ujęciu Dżajminiego
  const amk = karakiCzarowe(chart, locale)[1]?.planeta;
  if (amk) dodaj(amk, 1.25, "Amatjakaraka (Dżajmini) — karaka kariery i powołania w tej mapie", "Amatyakaraka (Jaimini) — the karaka of career and calling in this chart");

  // D10 — daśamsza, główna varga kariery
  const d10 = dashamsaChart(chart);
  if (d10?.angles) {
    const l10 = d10.angles.lagnaSign;
    const z10d = znak10(l10);
    for (const id of PLANET_ORDER) {
      if (d10.planets[id].sign === z10d) dodaj(id, 0.75, "stoi w 10. domu daśamszy (D10)", "stands in the 10th house of the dashamsha (D10)");
    }
    for (const id of PLANET_ORDER) {
      if (d10.planets[id].sign === l10) dodaj(id, 0.75, "stoi w lagnie daśamszy (D10)", "stands in the lagna of the dashamsha (D10)");
    }
    dodaj(RASIS[l10].lord, 0.5, "włada lagną daśamszy (D10)", "rules the lagna of the dashamsha (D10)");
    dodaj(RASIS[z10d].lord, 0.5, "włada 10. domem daśamszy (D10)", "rules the 10th house of the dashamsha (D10)");
  }

  // Radźa joga — status i powodzenie w działaniu (raz na planetę)
  const radza = wykryteJogi(chart, locale).filter((j) => j.kategoria === "radza");
  for (const id of PLANET_ORDER) {
    if (radza.some((j) => j.planety.includes(id))) dodaj(id, 0.75, "uczestniczy w Radźa jodze — status i powodzenie w działaniu", "takes part in a Raja yoga — status and success in action");
  }

  const wiersze: WierszKariery[] = [];
  for (const [id, lista] of zwiazek) {
    const suma = r2(lista.reduce((a, [p]) => a + p, 0));
    if (suma < PROG_ZWIAZKU) continue;
    const sila = ocenaWladcy(chart, id, [], locale);
    const czynniki = [...lista.map(([, t]) => t), ...sila.czynniki.map((c) => (en ? `strength: ${c}` : `siła: ${c}`))];
    const wagi = [...lista.map(([p]) => r2(p)), ...sila.wagi.map((w) => r2(w * WAGA_SILY))];
    const punkty = r2(wagi.reduce((a, b) => a + b, 0));
    const plus = r2(wagi.filter((w) => w > 0).reduce((a, b) => a + b, 0));
    const minus = r2(-wagi.filter((w) => w < 0).reduce((a, b) => a + b, 0));
    wiersze.push({
      id,
      role: lista.map(([, t]) => t),
      zwiazek: suma,
      ocena: { punkty, ton: punkty >= 0.5 ? "wspierający" : punkty <= -0.75 ? "wymagający" : "mieszany", czynniki, wagi, plus, minus },
    });
  }
  return wiersze.sort((a, b) => b.zwiazek - a.zwiazek || b.ocena.punkty - a.ocena.punkty);
}
