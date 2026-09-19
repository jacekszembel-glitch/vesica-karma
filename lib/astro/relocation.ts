import { angles, wholeSignHouse } from "./houses";
import { GRAHAS, BHAVAS, PLANET_ORDER, RASIS, type PlanetId } from "./constants";
import type { VedicChart } from "./chart";

/**
 * MAPA RELOKACYJNA — kosmogram przeliczony dla innego miejsca zamieszkania.
 *
 * Chwila urodzenia zostaje ta sama, więc pozycje planet w znakach się NIE zmieniają
 * (są liczone geocentrycznie). Zmienia się natomiast to, co zależy od miejsca:
 * ascendent (lagna) i wynikające z niego domy.
 *
 * W astrologii wedyjskiej to nie kosmetyka. Przy domach Whole Sign jeden dom to
 * cały znak, więc przesunięcie lagny o jeden znak przesuwa WSZYSTKIE dziewięć
 * planet do sąsiednich domów jednocześnie. Ktoś, kto w Raciborzu ma Saturna
 * w domu kariery, w Lizbonie może mieć go w domu relacji — a to zupełnie inny
 * obraz życia.
 *
 * Zastrzeżenie, które trzeba użytkownikowi powiedzieć wprost: relokacja nie
 * unieważnia mapy urodzeniowej. Pokazuje, przez jaki filtr dane miejsce
 * przepuszcza ten sam materiał.
 */

export interface RelocatedPlanet {
  id: PlanetId;
  /** Znak — identyczny jak w mapie urodzeniowej. */
  sign: number;
  signPl: string;
  /** Dom w miejscu urodzenia. */
  houseNatal: number;
  /** Dom po przeprowadzce. */
  houseRelocated: number;
  /** O ile domów planeta się przesunęła (0 = bez zmian). */
  shift: number;
}

export interface Relocation {
  /** Znak lagny w miejscu urodzenia. */
  lagnaNatal: number;
  /** Znak lagny po przeprowadzce. */
  lagnaRelocated: number;
  /** Czy lagna w ogóle się zmieniła. */
  lagnaChanged: boolean;
  /** Przesunięcie wszystkich domów (0-11). */
  houseShift: number;
  planets: RelocatedPlanet[];
  /** Planety, które trafiły do domu o wyraźnie innym charakterze. */
  highlights: {
    id: PlanetId;
    from: number;
    to: number;
    text: string;
  }[];
}

/** Domy uznawane za mocne/eksponowane (kendry i trikony). */
const KENDRA = [1, 4, 7, 10];
const TRIKONA = [1, 5, 9];
/** Domy trudne (duhsthana). */
const DUHSTHANA = [6, 8, 12];

function opisPrzejscia(id: PlanetId, from: number, to: number): string | null {
  const g = GRAHAS[id].pl;
  const doTxt = BHAVAS[to - 1].pl.toLowerCase();
  const zTxt = BHAVAS[from - 1].pl.toLowerCase();

  const wchodziMocno = KENDRA.includes(to) || TRIKONA.includes(to);
  const bylaMocno = KENDRA.includes(from) || TRIKONA.includes(from);
  const wchodziTrudno = DUHSTHANA.includes(to);
  const bylaTrudno = DUHSTHANA.includes(from);

  if (wchodziTrudno && !bylaTrudno) {
    return `${g} przechodzi z obszaru „${zTxt}” do „${doTxt}” — w tym miejscu ta planeta działa bardziej wewnętrznie i wymaga świadomej pracy.`;
  }
  if (bylaTrudno && !wchodziTrudno) {
    return `${g} wychodzi z trudnego obszaru „${zTxt}” do „${doTxt}” — tutaj ma szansę działać swobodniej.`;
  }
  if (wchodziMocno && !bylaMocno) {
    return `${g} wchodzi na eksponowaną pozycję w obszarze „${doTxt}” — ten temat wysuwa się w tym miejscu na pierwszy plan.`;
  }
  if (bylaMocno && !wchodziMocno) {
    return `${g} schodzi z eksponowanej pozycji („${zTxt}”) w tło — tutaj mniej definiuje Twoje życie.`;
  }
  return null;
}

/**
 * @param chart kosmogram urodzeniowy (musi mieć znaną godzinę — bez niej nie ma lagny)
 * @param latitude szerokość nowego miejsca
 * @param longitude długość nowego miejsca
 */
export function relocate(chart: VedicChart, latitude: number, longitude: number): Relocation | null {
  if (!chart.angles) return null;

  const nowe = angles(chart.birth.date, latitude, longitude);
  const lagnaNatal = chart.angles.lagnaSign;
  const lagnaRelocated = nowe.lagnaSign;
  const houseShift = (lagnaNatal - lagnaRelocated + 12) % 12;

  const planets: RelocatedPlanet[] = PLANET_ORDER.map((id) => {
    const p = chart.planets[id];
    const houseNatal = p.house;
    const houseRelocated = wholeSignHouse(p.longitude, lagnaRelocated);
    return {
      id,
      sign: p.sign,
      signPl: p.signPl,
      houseNatal,
      houseRelocated,
      shift: (houseRelocated - houseNatal + 12) % 12,
    };
  });

  const highlights = planets
    .filter((p) => p.houseNatal !== p.houseRelocated)
    .map((p) => {
      const text = opisPrzejscia(p.id, p.houseNatal, p.houseRelocated);
      return text ? { id: p.id, from: p.houseNatal, to: p.houseRelocated, text } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return {
    lagnaNatal,
    lagnaRelocated,
    lagnaChanged: lagnaNatal !== lagnaRelocated,
    houseShift,
    planets,
    highlights,
  };
}

/** Pakiet relokacji dla interpretacji. */
export function relocationForAI(r: Relocation, miejsce: string) {
  return {
    miejsce,
    lagnaUrodzeniowa: RASIS[r.lagnaNatal].pl,
    lagnaPoPrzeprowadzce: RASIS[r.lagnaRelocated].pl,
    lagnaZmieniona: r.lagnaChanged,
    przesuniecieDomow: r.houseShift,
    planetyZmieniajaceDom: r.planets
      .filter((p) => p.houseNatal !== p.houseRelocated)
      .map((p) => ({
        planeta: GRAHAS[p.id].pl,
        znak: p.signPl,
        domUrodzeniowy: `${p.houseNatal} (${BHAVAS[p.houseNatal - 1].pl})`,
        domPoPrzeprowadzce: `${p.houseRelocated} (${BHAVAS[p.houseRelocated - 1].pl})`,
      })),
    najwazniejszeZmiany: r.highlights.map((h) => h.text),
  };
}
