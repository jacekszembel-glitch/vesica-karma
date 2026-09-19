import { astrocartography, nearbyLines, type PlanetLines, type NearbyLine } from "./astrocarto";
import { BODIES, type BodyId } from "./bodies";
import { PLACES, type Place } from "@/lib/geo";


/**
 * Wspólne wyliczenia ocen geograficznych — podstawa czterech map:
 *  · heatmapa miejsc (siatka po całym globie),
 *  · mapa okresu (waga planety rządzącej bieżącą daszą),
 *  · mapa pary (przecięcie ocen dwojga ludzi),
 *  · mapa chwili (linie dla wybranego momentu, nie dla urodzenia).
 *
 * Wszystkie liczą to samo: ile dobroczynnych i ile trudnych linii przechodzi
 * blisko punktu, ważone odległością i rodzajem kąta.
 */

/** Waga kąta: MC i ASC działają najmocniej. */
const ANGLE_WEIGHT: Record<NearbyLine["angle"], number> = {
  mc: 1.0, asc: 1.0, ic: 0.8, dsc: 0.8,
};

export interface ScoreOptions {
  /**
   * Planeta, której linie liczą się podwójnie — używane w mapie okresu,
   * żeby wyróżnić władcę bieżącej daszy.
   */
  emphasise?: BodyId;
  /** Mnożnik dla wyróżnionej planety. */
  emphasisFactor?: number;
}

/** Surowa ocena punktu na Ziemi. Dodatnia = sprzyjający. */
export function scorePoint(
  lines: PlanetLines[], lat: number, lon: number, opts: ScoreOptions = {},
): number {
  const { emphasise, emphasisFactor = 2.2 } = opts;
  let score = 0;
  for (const l of nearbyLines(lines, lat, lon)) {
    const w = ANGLE_WEIGHT[l.angle] * l.strength;
    const mult = emphasise && l.planet === emphasise ? emphasisFactor : 1;
    score += BODIES[l.planet].nature * w * mult;
  }
  return score;
}

export interface HeatCell {
  lat: number;
  lon: number;
  score: number;
}

/**
 * Siatka ocen po całym globie — podkład pod heatmapę.
 *
 * Krok 4° daje 90×38 ≈ 3400 punktów. Przy 12 ciałach i czterech kątach to
 * zauważalna praca, dlatego liczymy raz i zapamiętujemy w komponencie.
 * Pomijamy okolice biegunów, gdzie linie ASC/DSC i tak się rozbiegają.
 */
export function heatGrid(
  lines: PlanetLines[], step = 4, opts: ScoreOptions = {},
): HeatCell[] {
  const out: HeatCell[] = [];
  for (let lat = -72; lat <= 72; lat += step) {
    for (let lon = -180; lon < 180; lon += step) {
      out.push({ lat, lon, score: scorePoint(lines, lat, lon, opts) });
    }
  }
  return out;
}

/** Zakres ocen w siatce — do skalowania kolorów. */
export function heatRange(cells: HeatCell[]): { min: number; max: number } {
  let min = Infinity, max = -Infinity;
  for (const c of cells) {
    if (c.score < min) min = c.score;
    if (c.score > max) max = c.score;
  }
  return { min, max };
}

/**
 * Kolor komórki heatmapy w palecie marki: turkus = sprzyjająco,
 * przezroczysty granat = neutralnie, ciepła czerwień = wymagająco.
 */
export function heatColor(score: number, min: number, max: number): string {
  const zakres = Math.max(Math.abs(min), Math.abs(max)) || 1;
  const t = Math.max(-1, Math.min(1, score / zakres));
  if (t >= 0) {
    // 0 → przezroczysty, 1 → turkus
    return `rgba(17, 167, 182, ${(t * 0.55).toFixed(3)})`;
  }
  return `rgba(224, 138, 99, ${(-t * 0.5).toFixed(3)})`;
}

export interface PlaceRank {
  place: Place;
  score: number;
  lines: NearbyLine[];
}

/** Ranking gotowych miejscowości wg podanych linii. */
export function rankPlaces(
  lines: PlanetLines[], opts: ScoreOptions = {},
): PlaceRank[] {
  return PLACES
    .map((place) => ({
      place,
      score: scorePoint(lines, place.lat, place.lon, opts),
      lines: nearbyLines(lines, place.lat, place.lon).slice(0, 4),
    }))
    .filter((r) => r.lines.length > 0)
    .sort((a, b) => b.score - a.score);
}

export interface CouplePlace {
  place: Place;
  scoreA: number;
  scoreB: number;
  /** Ocena wspólna — średnia ściągnięta w dół przez gorszy wynik. */
  scoreShared: number;
}

/**
 * MAPA PARY — miejsca dobre dla OBOJGA.
 *
 * Nie liczymy zwykłej średniej: miejsce świetne dla jednej osoby i fatalne dla
 * drugiej nie jest dobrym miejscem dla pary. Dlatego wynik wspólny ciągniemy
 * w stronę gorszego z dwóch (średnia ważona 1:2 na niekorzyść lepszego).
 */
export function coupleplaces(
  linesA: PlanetLines[], linesB: PlanetLines[], limit = 8,
): { best: CouplePlace[]; hard: CouplePlace[] } {
  const all: CouplePlace[] = PLACES.map((place) => {
    const a = scorePoint(linesA, place.lat, place.lon);
    const b = scorePoint(linesB, place.lat, place.lon);
    const gorszy = Math.min(a, b);
    const lepszy = Math.max(a, b);
    return { place, scoreA: a, scoreB: b, scoreShared: (2 * gorszy + lepszy) / 3 };
  });
  const sorted = [...all].sort((x, y) => y.scoreShared - x.scoreShared);
  return {
    best: sorted.filter((s) => s.scoreShared > 0.1).slice(0, limit),
    hard: sorted.filter((s) => s.scoreShared < -0.1).slice(-Math.min(limit, 4)).reverse(),
  };
}

/**
 * MAPA CHWILI — gdzie na Ziemi dany moment jest najlepszy.
 *
 * Odwrócenie pytania muhurty: zamiast „kiedy zrobić to tutaj” pytamy
 * „gdzie ta konkretna chwila działa najlepiej”. Linie liczymy dla podanego
 * momentu, nie dla urodzenia — reszta rachunku jest identyczna.
 */
export function momentPlaces(moment: Date, limit = 8): PlaceRank[] {
  return rankPlaces(astrocartography(moment)).slice(0, limit);
}
