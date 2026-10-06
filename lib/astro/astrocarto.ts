import { SiderealTime } from "astronomy-engine";
import { allPlanets, outerTropicalPosition } from "./ephemeris";
import { ayanamsa } from "./ayanamsa";
import { norm360, obliquity, sin, cos, tan, atan2d, RAD, DEG } from "./math";
import { PLANET_ORDER } from "./constants";
import { BODIES, OUTER_ORDER, type BodyId } from "./bodies";
import type { AstroLocale } from "./i18nAstro";
import { opisLinii } from "./opisyLinii";

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

/** Maksymalna szerokość geograficzna rysowania linii (przy biegunach się rozbiegają).
 *  80°, nie 66° — przy 66° krzywe urywały się w połowie Grenlandii i Skandynawii,
 *  choć mapa sięga dalej na północ. */
const LAT_LIMIT = 80;
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
  // Szerokość graniczna 90° − |δ|: dalej ciało jest okołobiegunowe (nie wschodzi/nie zachodzi).
  // Tuż przy niej krzywa skręca gwałtownie i spotyka się z krzywą przeciwną (ASC z DSC) —
  // dokładamy gęste próbki i sam punkt graniczny, żeby linie łączyły się łukiem, a nie urywały.
  const lats: number[] = [];
  for (let lat = -LAT_LIMIT; lat <= LAT_LIMIT; lat += LAT_STEP) lats.push(lat);
  const granica = 90 - Math.abs(eq.dec);
  if (granica < LAT_LIMIT) {
    for (const znak of [-1, 1]) {
      for (const d of [0, 0.02, 0.08, 0.2, 0.4, 0.7]) lats.push(znak * (granica - d));
    }
    lats.sort((a, b) => a - b);
  }
  for (const lat of lats) {
    let cosH0 = -tan(lat) * tan(eq.dec);
    if (Math.abs(cosH0) > 1 + 1e-9) continue; // ciało okołobiegunowe — nie wschodzi/zachodzi
    cosH0 = Math.max(-1, Math.min(1, cosH0));
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
 * Linie planet zewnętrznych (Uran, Neptun, Pluton) — tylko dla mapy świata.
 *
 * Liczone tak samo jak grahy: z rektascensji i deklinacji, czyli bez udziału
 * zodiaku. Trzymane osobno, żeby nie weszły do kosmogramu ani do oceny miejsc.
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
  mc: { code: "MC", pl: "Górowanie", en: "Culmination", obszar: "kariera, widoczność, powołanie, ekspresja publiczna", obszarEn: "career, visibility, calling, public expression" },
  ic: { code: "IC", pl: "Dołowanie", en: "Anti-culmination", obszar: "dom, korzenie, rodzina, życie wewnętrzne", obszarEn: "home, roots, family, inner life" },
  asc: { code: "ASC", pl: "Wschód", en: "Rising", obszar: "tożsamość, ciało, witalność, nowe początki", obszarEn: "identity, body, vitality, new beginnings" },
  dsc: { code: "DSC", pl: "Zachód", en: "Setting", obszar: "relacje, partnerstwo, współpraca, druga strona", obszarEn: "relationships, partnership, collaboration, the other side" },
} as const;

/** Jednosłowna etykieta kąta — do kompaktowej legendy MC/IC/ASC/DSC przy opisie linii. */
export const SKROT_OBSZARU: Record<keyof typeof ANGLE_MEANINGS, string> = {
  mc: "kariera", ic: "dom", asc: "tożsamość", dsc: "relacje",
};

export const SKROT_OBSZARU_EN: Record<keyof typeof ANGLE_MEANINGS, string> = {
  mc: "career", ic: "home", asc: "identity", dsc: "relationships",
};

/**
 * Ton linii wg natury planety (BODIES[x].nature) — te same słowa i kolory co
 * gdzie indziej w appce (RankingGrah/RankingDomeny: wspierający/mieszany/
 * wymagający), żeby użytkownik nie uczył się nowego słownika dla mapy świata.
 */
export const TON_LINII: Record<-1 | 0 | 1, { label: string; labelEn: string; color: string }> = {
  1: { label: "wspierająca", labelEn: "supportive", color: "#6fbf9f" },
  0: { label: "mieszana", labelEn: "mixed", color: "#b9c7d1" },
  [-1]: { label: "wymagająca", labelEn: "demanding", color: "#5b9bd5" },
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

const RAMA_KATA_EN: Record<keyof typeof ANGLE_MEANINGS, (planeta: string, motyw: string) => string> = {
  mc: (p, m) => `${p} on the MC (Culmination) pushes the theme of ${m} into visibility and career — this is the area of public expression: what you're known for out there, what your calling and status are about.`,
  ic: (p, m) => `${p} on the IC (Anti-culmination) grounds the theme of ${m} in home and inner foundation — this happens privately, not on display: your base, your roots, what you return to rather than what you show the world.`,
  asc: (p, m) => `${p} on the ASC (Rising) filters the theme of ${m} through your very identity — it's how you enter new situations and how you're seen before you've even said or done anything.`,
  dsc: (p, m) => `${p} on the DSC (Setting) concerns the theme of ${m}, but DIFFERENTLY than the other three angles — it isn't something you do yourself, but something that comes THROUGH OTHERS: partnerships, relationships, the people you attract or meet here. The theme plays out more in collaboration with someone than within you alone.`,
};

export function opisSzerszyLinii(planet: BodyId, angle: keyof typeof ANGLE_MEANINGS, locale: AstroLocale = "pl"): string {
  // konkretne znaczenie połączenia planeta × kąt (opisyLinii.ts) — szablon niżej tylko jako zapas
  const konkretny = opisLinii(planet, angle, locale);
  if (konkretny) return konkretny;
  const g = BODIES[planet];
  if (locale === "en") {
    const rdzen = RAMA_KATA_EN[angle](g.en, g.motywEn);
    if (g.nature === 1) {
      return `${rdzen} This line acts gently and builds — natural success in this theme comes more easily here, without much resistance.`;
    }
    if (g.nature === -1) {
      return `${rdzen} This line asks for more conscious work — it's not a sentence, just a signal that this theme needs more effort here before it starts working in your favor.`;
    }
    return `${rdzen} This line acts variably — sometimes supportive, sometimes testing, depending on how consciously you use it.`;
  }
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
 * Progi (ustalone z użytkownikiem 2026-10-07, wg współczesnej praktyki astrokartografii):
 *   0–150 km   (0–100 mil)   — EKSTREMALNA (maksymalna): pełna, bezpośrednia aktywacja planety,
 *                               jej wydarzenia i archetypy dominują w codziennym życiu;
 *   150–500 km (100–300 mil) — SILNA DO UMIARKOWANEJ: efekty wyraźne i łatwo zauważalne,
 *                               ale energia bardziej zrównoważona niż na samej linii;
 *   500–700 km (300–400 mil) — SŁABA (subtelna): wpływ tła, odczuwalny dla wrażliwych
 *                               albo w określonych tranzytach;
 *   powyżej 700 km            — NEUTRALNA: brak bezpośredniego wpływu tej linii.
 * Wewnętrzne nazwy poziomów zostają ("silna"/"średnia"/"słaba" — porównania w kodzie),
 * a nazwy dla czytelnika daje silaZasieguNazwa() w i18nAstro.ts.
 */
export const ORB_KM = 700;
export const ORB_STRONG_KM = 150;

/** Krycie pasa zasięgu na mapie wg siły planety 0–1 (brak danych = środek skali). */
export function krycieWgSily(sila: number | undefined): number {
  return 0.08 + 0.34 * (sila ?? 0.5);
}
export const ORB_MEDIUM_KM = 500;

export type SilaZasiegu = "silna" | "średnia" | "słaba";

/** Trzystopniowa siła oddziaływania linii wg odległości w km. */
export function silaZasiegu(km: number): SilaZasiegu {
  if (km <= ORB_STRONG_KM) return "silna";
  if (km <= ORB_MEDIUM_KM) return "średnia";
  return "słaba";
}

/** Długość jednego stopnia po południku (i po równiku). */
export const KM_PER_DEG = 111.32;

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
  /** Czy miejsce leży w pasie najsilniejszego działania (≤150 km, ORB_STRONG_KM). */
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
      if (!curve.length) continue;
      // Punkty krzywej są posortowane wg szerokości (horizonCurve), a odległość
      // nie może być mniejsza niż sama różnica szerokości — więc zaczynamy od
      // punktu najbliższego szerokością i idziemy w obie strony tylko dopóki
      // |Δφ| < najlepszej dotąd odległości. Wynik identyczny jak przy przeglądaniu
      // całej krzywej, a ranking ~600 miast liczy się kilka razy szybciej.
      let lo = 0, hi = curve.length;
      while (lo < hi) { const m = (lo + hi) >> 1; if (curve[m][0] < lat) lo = m + 1; else hi = m; }
      let best2 = Infinity; // kwadrat odległości, w stopniach
      const sprawdz = (i: number) => {
        const dLat = curve[i][0] - lat;
        if (dLat * dLat >= best2) return false;
        const dLon = lonDist(curve[i][1], lon) * cosLat;
        const d2 = dLat * dLat + dLon * dLon;
        if (d2 < best2) best2 = d2;
        return true;
      };
      for (let i = lo; i < curve.length && sprawdz(i); i++);
      for (let i = lo - 1; i >= 0 && sprawdz(i); i--);
      const best = Math.sqrt(best2);
      add(pl.id, angle, best, best * KM_PER_DEG);
    }
  }
  return out
    .filter((x) => x.km <= maxKm)
    .sort((a, b) => a.km - b.km);
}
