import {
  VIMSHOTTARI_ORDER,
  VIMSHOTTARI_YEARS,
  VIMSHOTTARI_YEAR_DAYS,
  type PlanetId,
} from "./constants";
import { nakshatraOf } from "./nakshatra";

/**
 * Vimshottari Dasha — 120-letni cykl okresów planetarnych,
 * liczony od pozycji Księżyca w nakszatrze w chwili urodzenia.
 */

export interface DashaPeriod {
  lord: PlanetId;
  start: Date;
  end: Date;
  /** Poziom: 1 = mahadasza, 2 = antardasza, 3 = pratjantardasza. */
  level: 1 | 2 | 3;
  sub?: DashaPeriod[];
}

const YEAR_MS = VIMSHOTTARI_YEAR_DAYS * 86400000;
const TOTAL_YEARS = 120;

function nextLord(lord: PlanetId): PlanetId {
  return VIMSHOTTARI_ORDER[(VIMSHOTTARI_ORDER.indexOf(lord) + 1) % 9];
}

/** Podokresy: dzielą okres rodzica proporcjonalnie do lat planet, zaczynając od władcy rodzica. */
function subdivide(parent: DashaPeriod, level: 2 | 3, withSub: boolean): DashaPeriod[] {
  const spanMs = parent.end.getTime() - parent.start.getTime();
  const out: DashaPeriod[] = [];
  let lord = parent.lord;
  let cursor = parent.start.getTime();
  for (let i = 0; i < 9; i++) {
    const ms = (spanMs * VIMSHOTTARI_YEARS[lord]) / TOTAL_YEARS;
    const period: DashaPeriod = {
      lord,
      start: new Date(cursor),
      end: new Date(cursor + ms),
      level,
    };
    if (withSub && level === 2) period.sub = subdivide(period, 3, false);
    out.push(period);
    cursor += ms;
    lord = nextLord(lord);
  }
  return out;
}

/**
 * Pełna oś Vimshottari od urodzenia.
 * @param moonLongitude syderyczna długość Księżyca w chwili urodzenia
 * @param birth chwila urodzenia (UTC)
 * @param depth 1 = tylko mahadasze, 2 = +antardasze, 3 = +pratjantardasze
 */
export function vimshottari(moonLongitude: number, birth: Date, depth: 1 | 2 | 3 = 3): DashaPeriod[] {
  const { nakshatra, fraction } = nakshatraOf(moonLongitude);
  const firstLord = nakshatra.lord;
  const firstYears = VIMSHOTTARI_YEARS[firstLord];

  // Balans pierwszej mahadaszy: tyle, ile Księżycowi zostało do końca nakszatry.
  const remainingMs = firstYears * (1 - fraction) * YEAR_MS;
  const elapsedMs = firstYears * fraction * YEAR_MS;

  const out: DashaPeriod[] = [];
  // Pierwsza mahadasza formalnie zaczyna się przed urodzeniem — jej start cofamy,
  // żeby podokresy dzieliły się poprawnie; obcinamy przy prezentacji.
  let lord = firstLord;
  let cursor = birth.getTime() - elapsedMs;
  for (let i = 0; i < 9; i++) {
    const ms = VIMSHOTTARI_YEARS[lord] * YEAR_MS;
    const period: DashaPeriod = {
      lord,
      start: new Date(cursor),
      end: new Date(cursor + ms),
      level: 1,
    };
    if (depth >= 2) period.sub = subdivide(period, 2, depth === 3);
    out.push(period);
    cursor += ms;
    lord = nextLord(lord);
  }
  void remainingMs;
  return out;
}

/** Aktywny łańcuch okresów (maha → antar → pratjantar) dla danej chwili. */
export function activeChain(periods: DashaPeriod[], at: Date): DashaPeriod[] {
  const chain: DashaPeriod[] = [];
  let level: DashaPeriod[] | undefined = periods;
  while (level) {
    const hit: DashaPeriod | undefined = level.find((p) => at >= p.start && at < p.end);
    if (!hit) break;
    chain.push(hit);
    level = hit.sub;
  }
  return chain;
}
