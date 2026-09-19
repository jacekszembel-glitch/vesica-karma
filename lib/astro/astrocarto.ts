import { SiderealTime } from "astronomy-engine";
import { allPlanets, outerTropicalPosition } from "./ephemeris";
import { ayanamsa } from "./ayanamsa";
import { norm360, obliquity, sin, cos, tan, atan2d, RAD, DEG } from "./math";
import { PLANET_ORDER } from "./constants";
import { BODIES, OUTER_ORDER, type BodyId } from "./bodies";

/**
 * Astrokartografia — linie planetarne na mapie świata.
 *
 * Dla chwili urodzenia liczymy, GDZIE na Ziemi dana planeta była dokładnie:
 *  - na MC (górowanie — ekspresja publiczna, kariera),
 *  - na IC (dołowanie — dom, korzenie),
 *  - na ASC (wschód — tożsamość, ciało, nowe początki),
 *  - na DSC (zachód — relacje, partnerstwo).
 *
 * Linie MC/IC to południki (pionowe). Linie ASC/DSC to krzywe zależne od
 * szerokości geograficznej. Wszystko liczone z pozycji równikowych
 * (RA/deklinacja) — niezależne od zodiaku, więc identyczne w astrologii
 * wedyjskiej i zachodniej.
 */

export interface EquatorialPos {
  /** Rektascensja w stopniach (0–360). */
  ra: number;
  /** Deklinacja w stopniach. */
  dec: number;
}

/** Konwersja długości/szerokości ekliptycznej (tropikalnej) na RA/dec. */
export function eclipticToEquatorial(lonTropical: number, lat: number, date: Date): EquatorialPos {
  const eps = obliquity(date);
  const ra = norm360(
    atan2d(
      sin(lonTropical) * cos(eps) - tan(lat) * sin(eps),
      cos(lonTropical),
    ),
  );
  const dec =
    Math.asin(
      sin(lat) * cos(eps) + cos(lat) * sin(eps) * sin(lonTropical),
    ) * RAD;
  return { ra, dec };
}

/** Normalizacja długości geograficznej do (-180, 180]. */
function normLon(deg: number): number {
  let x = norm360(deg);
  if (x > 180) x -= 360;
  return x;
}

export interface PlanetLines {
  /** Graha albo planeta zewnętrzna — mapa pokazuje jedne i drugie. */
  id: BodyId;
  /** Długość geograficzna południka MC. */
  mc: number;
  /** Długość geograficzna południka IC. */
  ic: number;
  /** Punkty linii ascendentu: [szerokość, długość]. */
  asc: [number, number][];
  /** Punkty linii descendentu. */
  dsc: [number, number][];
}

/** Maksymalna szerokość geograficzna rysowania linii (przy biegunach się rozbiegają). */
const LAT_LIMIT = 66;
const LAT_STEP = 1;

/**
 * Krzywa wschodu/zachodu: dla każdej szerokości φ szukamy długości λ,
 * na której ciało o (RA, dec) ma wysokość 0.
 * Warunek horyzontu: cos H₀ = −tan φ · tan δ; wschód przy LHA = −H₀,
 * zachód przy LHA = +H₀, gdzie LHA = GAST + λ − RA.
 */
function horizonCurve(
  eq: EquatorialPos,
  gastDeg: number,
  side: "rise" | "set",
): [number, number][] {
  const out: [number, number][] = [];
  for (let lat = -LAT_LIMIT; lat <= LAT_LIMIT; lat += LAT_STEP) {
    const cosH0 = -tan(lat) * tan(eq.dec);
    if (Math.abs(cosH0) > 1) continue; // ciało okołobiegunowe — nie wschodzi/zachodzi
    const h0 = Math.acos(cosH0) * RAD;
    const lha = side === "rise" ? -h0 : h0;
    out.push([lat, normLon(eq.ra - gastDeg + lha)]);
  }
  return out;
}

/** Wszystkie linie planetarne dla chwili urodzenia. */
export function astrocartography(date: Date): PlanetLines[] {
  const gastDeg = SiderealTime(date) * 15;
  const planets = allPlanets(date);
  const ay = ayanamsa(date);

  return PLANET_ORDER.map((id) => {
    const p = planets[id];
    // Wyliczenia zwracają długości syderyczne — do RA/dec wracamy do tropikalnych.
    const eq = eclipticToEquatorial(norm360(p.longitude + ay), p.latitude, date);
    const mc = normLon(eq.ra - gastDeg);
    return {
      id,
      mc,
      ic: normLon(mc + 180),
      asc: horizonCurve(eq, gastDeg, "rise"),
      dsc: horizonCurve(eq, gastDeg, "set"),
    };
  });
}

/**
 * Linie planet zewnętrznych (Uran, Neptun, Pluton) — tylko dla mapy.
 *
 * Liczone tak samo jak grahy: z rektascensji i deklinacji, czyli zupełnie bez
 * udziału zodiaku. Dlatego nie kolidują z konwencją wedyjską — pokazują po prostu,
 * nad którymi punktami Ziemi dana planeta stała w chwili urodzenia.
 * Trzymane osobno, żeby nie mogły wejść do kosmogramu ani do oceny miejsc.
 */
export function outerAstrocartography(date: Date): PlanetLines[] {
  const gastDeg = SiderealTime(date) * 15;
  return OUTER_ORDER.map((id) => {
    const p = outerTropicalPosition(id, date);
    const eq = eclipticToEquatorial(p.lon, p.lat, date);
    const mc = normLon(eq.ra - gastDeg);
    return {
      id,
      mc,
      ic: normLon(mc + 180),
      asc: horizonCurve(eq, gastDeg, "rise"),
      dsc: horizonCurve(eq, gastDeg, "set"),
    };
  });
}

/** Znaczenia kątów — do legendy i danych dla AI. */
export const ANGLE_MEANINGS = {
  mc: { code: "MC", pl: "Górowanie", obszar: "kariera, widoczność, powołanie, ekspresja publiczna" },
  ic: { code: "IC", pl: "Dołowanie", obszar: "dom, korzenie, rodzina, życie wewnętrzne" },
  asc: { code: "ASC", pl: "Wschód", obszar: "tożsamość, ciało, witalność, nowe początki" },
  dsc: { code: "DSC", pl: "Zachód", obszar: "relacje, partnerstwo, współpraca, druga strona" },
} as const;

/** Jednosłowna etykieta kąta — do kompaktowej legendy MC/IC/ASC/DSC przy opisie linii. */
export const SKROT_OBSZARU: Record<keyof typeof ANGLE_MEANINGS, string> = {
  mc: "kariera", ic: "dom", asc: "tożsamość", dsc: "relacje",
};

/**
 * Ton linii wg natury planety (BODIES[x].nature) — te same słowa i kolory co
 * gdzie indziej w appce (RankingGrah/RankingDomeny: wspierający/mieszany/
 * wymagający), żeby użytkownik nie uczył się nowego słownika dla mapy świata.
 */
export const TON_LINII: Record<-1 | 0 | 1, { label: string; color: string }> = {
  1: { label: "wspierająca", color: "#6fbf9f" },
  0: { label: "mieszana", color: "#b9c7d1" },
  [-1]: { label: "wymagająca", color: "#5b9bd5" },
};

/** Krótkie zdanie: co ta linia (planeta × kąt) konkretnie wspiera albo utrudnia. */
/**
 * Jak konkretnie DOŚWIADCZA SIĘ przebywania blisko danego kąta — to nie jest
 * to samo dla wszystkich czterech. MC/IC/ASC dzieją się głównie "w Tobie"
 * (widoczność, zaplecze, tożsamość), a DSC klasycznie dzieje się głównie
 * "przez INNYCH" — relacje, ludzi, których przyciągasz albo spotykasz, nie
 * Twoje własne cechy. Bez tego rozróżnienia opis dla DSC brzmiał identycznie
 * jak dla MC/IC/ASC, mimo że mechanizm działania jest inny.
 */
const RAMA_KATA: Record<keyof typeof ANGLE_MEANINGS, (planeta: string, motyw: string) => string> = {
  mc: (p, m) => `${p} na MC (Górowanie) wybija temat ${m} na widoczność i karierę — to obszar publicznej ekspresji: tym, czym jesteś tu znany/a na zewnątrz, czego dotyczy Twoje powołanie i status.`,
  ic: (p, m) => `${p} na IC (Dołowanie) osadza temat ${m} w domu i wewnętrznym zapleczu — to dzieje się prywatnie, nie na pokaz: baza, korzenie, to, do czego wracasz, nie to, co pokazujesz światu.`,
  asc: (p, m) => `${p} na ASC (Wschód) przenika temat ${m} przez samą Twoją tożsamość — to jak wchodzisz w nowe sytuacje i jak Cię widzą, zanim jeszcze coś powiesz czy zrobisz.`,
  dsc: (p, m) => `${p} na DSC (Zachód) dotyczy tematu ${m}, ale INACZEJ niż pozostałe trzy kąty — to nie coś, co robisz sam/a, tylko coś, co przychodzi PRZEZ INNYCH: partnerstwa, relacje, ludzie, których tu przyciągasz albo spotykasz. Temat rozgrywa się bardziej we współpracy z kimś niż w Tobie samym/samej.`,
};

export function opisSzerszyLinii(planet: BodyId, angle: keyof typeof ANGLE_MEANINGS): string {
  const g = BODIES[planet];
  const rdzen = RAMA_KATA[angle](g.pl, g.motyw);
  if (g.nature === 1) {
    return `${rdzen} Ta linia działa łagodnie i buduje — łatwiej tu o naturalne powodzenie w tym temacie, bez większego oporu.`;
  }
  if (g.nature === -1) {
    return `${rdzen} Ta linia wymaga więcej świadomej pracy — to nie wyrok, tylko sygnał, że ten temat tu potrzebuje więcej wysiłku, zanim zacznie działać na Twoją korzyść.`;
  }
  return `${rdzen} Ta linia działa zmiennie — czasem sprzyja, czasem testuje, zależnie od tego, jak świadomie z niej korzystasz.`;
}

/**
 * ZASIĘG ODDZIAŁYWANIA LINII
 *
 * Jim Lewis, twórca astrokartografii, przyjmował ok. 700 mil (≈1125 km) po obu
 * stronach linii jako granicę odczuwalnego wpływu — to nasze ORB_KM. Współcześni
 * praktycy (np. opracowania cytowane w astroannalei.com, "How Far Do
 * Astrocartography Lines Work?") rozbijają to dalej na progi zbliżone do:
 *   ~0–200 mil (~320 km)  — silny, wyraźnie odczuwalny wpływ,
 *   ~200–500 mil (~800 km) — umiarkowany, obecny w tle,
 *   ~500–700 mil (~1125 km) — wpływ zanika, ale jeszcze odczuwalny.
 * Stąd nasze progi: silny do 250 km (nieco ostrożniej niż 320 km), średni do
 * 800 km, słaby do klasycznej granicy Lewisa (1125 km).
 */
export const ORB_KM = 1125;
export const ORB_STRONG_KM = 250;
export const ORB_MEDIUM_KM = 800;

export type SilaZasiegu = "silna" | "średnia" | "słaba";

/** Trzystopniowa siła oddziaływania linii wg odległości w km. */
export function silaZasiegu(km: number): SilaZasiegu {
  if (km <= ORB_STRONG_KM) return "silna";
  if (km <= ORB_MEDIUM_KM) return "średnia";
  return "słaba";
}

/** Długość jednego stopnia po południku (i po równiku). */
const KM_PER_DEG = 111.32;

/**
 * Najbliższe linie dla danego punktu na Ziemi (np. miejsca, które użytkownik
 * rozważa) — z odległością w kilometrach po powierzchni Ziemi.
 *
 * UWAGA na południki: 1° długości geograficznej to 111 km na równiku, ale już
 * tylko 71 km w Raciborzu i 56 km w Oslo. Bez mnożenia przez cos(φ) miejsca na
 * północy byłyby oceniane surowiej niż południowe.
 */
export interface NearbyLine {
  planet: BodyId;
  angle: keyof typeof ANGLE_MEANINGS;
  /** Przybliżona odległość kątowa w stopniach (jednostka wewnętrzna). */
  distance: number;
  /** Odległość od linii w kilometrach. */
  km: number;
  /** Siła oddziaływania: 1 na linii, 0 na granicy zasięgu. */
  strength: number;
  /** Czy miejsce leży w pasie najsilniejszego działania (≤250 km). */
  strong: boolean;
  /** Trzystopniowa siła (silna/średnia/słaba) — patrz silaZasiegu(). */
  sila: SilaZasiegu;
}

export function nearbyLines(
  lines: PlanetLines[],
  lat: number,
  lon: number,
  maxKm = ORB_KM,
): NearbyLine[] {
  const out: NearbyLine[] = [];
  const lonDist = (a: number, b: number) => {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  };
  const cosLat = Math.cos(lat * DEG);

  const add = (planet: BodyId, angle: NearbyLine["angle"], deg: number, km: number) => {
    out.push({
      planet, angle,
      distance: deg,
      km,
      strength: Math.max(0, 1 - km / maxKm),
      strong: km <= ORB_STRONG_KM,
      sila: silaZasiegu(km),
    });
  };

  for (const pl of lines) {
    // MC/IC to południki — odległość mierzymy wzdłuż równoleżnika, stąd cos(φ).
    const dMc = lonDist(lon, pl.mc);
    const dIc = lonDist(lon, pl.ic);
    add(pl.id, "mc", dMc, dMc * KM_PER_DEG * cosLat);
    add(pl.id, "ic", dIc, dIc * KM_PER_DEG * cosLat);

    for (const [angle, curve] of [["asc", pl.asc], ["dsc", pl.dsc]] as const) {
      let best = Infinity;
      for (const [clat, clon] of curve) {
        // odległość w przybliżeniu płaskim, długość już ważona cos szerokości
        const d = Math.hypot(clat - lat, lonDist(clon, lon) * cosLat);
        if (d < best) best = d;
      }
      if (best < Infinity) add(pl.id, angle, best, best * KM_PER_DEG);
    }
  }
  return out
    .filter((x) => x.km <= maxKm)
    .sort((a, b) => a.km - b.km);
}
