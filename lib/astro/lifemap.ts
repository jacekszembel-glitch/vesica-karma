import { GRAHAS, RASIS, PLANET_ORDER, VIMSHOTTARI_YEARS, type PlanetId } from "./constants";
import { buildChart, type VedicChart, type BirthData } from "./chart";
import { astrocartography, nearbyLines, ANGLE_MEANINGS, type PlanetLines, type NearbyLine } from "./astrocarto";
import { numerology, type NumerologyResult } from "./numerology";
import { activeChain, type DashaPeriod } from "./dasha";
import { PLACES, type Place } from "@/lib/geo";
import { WORLD_CITIES_TOP } from "@/lib/world-cities-top";
import { jogakaraka, karakiCzarowe } from "./karaki";
import { ocenaWladcy } from "./sila";
import { BODIES } from "./bodies";

/**
 * Mapa Życia — synteza wszystkich modułów w jeden obraz:
 * KIM JESTEM (kosmogram) · JAK DZIAŁAM (numerologia) ·
 * KIEDY (nadchodzące okresy) · GDZIE (ranking miejsc).
 */

export interface UpcomingPeriod {
  lord: PlanetId;
  level: 1 | 2;
  start: Date;
  end: Date;
  /** Czy trwa teraz. */
  current: boolean;
  /** Ogólny charakter okresu wg natury planety. */
  tone: "wspierający" | "wymagający" | "mieszany";
  /**
   * Wielki okres (mahadasza), wewnątrz którego leży ten podokres.
   * Bez tego użytkownik czyta „Księżyc, sty–sie 2026" jako główny okres życia,
   * podczas gdy to tylko wycinek kilkunastoletniej mahadaszy.
   */
  parentLord: PlanetId;
  parentStart: Date;
  parentEnd: Date;
  /** Czy wielki okres trwa teraz. */
  parentCurrent: boolean;
}

export interface PlaceScore {
  place: Place;
  /** Suma ważona: dodatnia = sprzyjające. */
  score: number;
  lines: NearbyLine[];
  /** Najmocniejszy motyw miejsca. */
  theme: string;
}

export interface LifeMap {
  chart: VedicChart;
  numerology: NumerologyResult;
  lines: PlanetLines[];
  /** Aktywna mahadasza + antardasza. */
  now: DashaPeriod[];
  /** Oś czasu: bieżąca antardasza + 6 kolejnych podokresów. */
  upcoming: UpcomingPeriod[];
  /** Wiek w kolejnych mahadaszach (do osi życia). */
  lifePhases: { lord: PlanetId; fromAge: number; toAge: number; current: boolean }[];
  /** Miejsca posortowane od najbardziej sprzyjających — z całego świata, nie tylko z Polski. */
  bestPlaces: PlaceScore[];
  challengingPlaces: PlaceScore[];
  /** Te same miejsca sprzyjające, pogrupowane wg tematu najbliższej linii — do 3 na kategorię. */
  bestPlacesByCategory: Record<KategoriaMiejsca, PlaceScore[]>;
}

export type KategoriaMiejsca = "kariera" | "dom" | "relacje" | "poczatki";

/** Kategoria tematyczna wg kąta — jedna, spójna z ANGLE_THEME niżej. */
const KATEGORIA_KATA: Record<NearbyLine["angle"], KategoriaMiejsca> = {
  mc: "kariera", ic: "dom", dsc: "relacje", asc: "poczatki",
};

export const ETYKIETA_KATEGORII_MIEJSC: Record<KategoriaMiejsca, string> = {
  kariera: "Kariera i widoczność",
  dom: "Dom i zakorzenienie",
  relacje: "Relacje i współpraca",
  poczatki: "Energia i nowe początki",
};

/** Waga kąta: jak mocno linia działa. */
const ANGLE_WEIGHT: Record<NearbyLine["angle"], number> = {
  mc: 1.0, asc: 1.0, ic: 0.8, dsc: 0.8,
};

/** Motyw kąta do opisu miejsca. */
const ANGLE_THEME: Record<NearbyLine["angle"], string> = {
  mc: "kariera i widoczność",
  ic: "dom i zakorzenienie",
  asc: "energia i nowe początki",
  dsc: "relacje i współpraca",
};

/**
 * Ton okresu planetarnego.
 *
 * Sama naturalna natura planety to za mało — Słońce jest klasycznie łagodnym
 * malefikiem, więc każda mahadasza Słońca wychodziła „wymagająca", nawet gdy
 * Słońce stoi w mapie znakomicie. Ton łączy więc naturę władcy z jego
 * KONDYCJĄ w mapie urodzeniowej: godnością (egzaltacja…upadek) i spaleniem.
 * Do tego WŁADZTWO FUNKCYJNE: jogakaraka (władca kendry i trikony naraz dla
 * tej lagny) ma okresy klasycznie znakomite niezależnie od natury — Saturn
 * dla lagny Byka/Wagi, Mars dla Raka/Lwa, Wenus dla Koziorożca/Wodnika.
 * To nadal skrót — pełną ocenę daje interpretacja — ale skrót uczciwszy.
 * TODO dla Jacka: pełne funkcyjne benefiki/malefiki wg władztwa domów
 * (trikony vs 3/6/11) — reguły różnią się między szkołami, decyzja należy
 * do prowadzącego merytorycznie.
 */
export function tonOkresu(chart: VedicChart | null | undefined, lord: PlanetId): UpcomingPeriod["tone"] {
  return ocenaWladcy(chart, lord).ton;
}


/** Ocena miejsca: benefiki dodają, malefiki odejmują, bliżej = mocniej. */
export function scorePlace(lines: PlanetLines[], place: Place): PlaceScore {
  const near = nearbyLines(lines, place.lat, place.lon);
  let score = 0;
  for (const l of near) {
    const weight = ANGLE_WEIGHT[l.angle] * l.strength;
    score += BODIES[l.planet].nature * weight;
  }
  const strongest = near[0];
  const theme = strongest
    ? `${BODIES[strongest.planet].pl} ${ANGLE_MEANINGS[strongest.angle].code} — ${ANGLE_THEME[strongest.angle]}`
    : "neutralne";
  return { place, score, lines: near.slice(0, 4), theme };
}

/**
 * Nadchodzące antardasze: bieżąca + kolejne z tej i następnej mahadaszy —
 * do osi DashaOrbit. Wydzielone z buildLifeMap, żeby dało się policzyć
 * samodzielnie (np. na kosmogramie), bez numerologii i astrokartografii,
 * których ta funkcja nie potrzebuje.
 */
export function upcomingAntardashas(chart: VedicChart, birth: BirthData): UpcomingPeriod[] {
  const upcoming: UpcomingPeriod[] = [];
  const nowMs = Date.now();
  outer:
  for (const md of chart.dashas) {
    if (!md.sub || md.end.getTime() < nowMs) continue;
    for (const ad of md.sub) {
      if (ad.end.getTime() < nowMs) continue;
      upcoming.push({
        lord: ad.lord,
        level: 2,
        start: ad.start,
        end: ad.end,
        current: nowMs >= ad.start.getTime() && nowMs < ad.end.getTime(),
        tone: tonOkresu(chart, ad.lord),
        parentLord: md.lord,
        // pierwsza mahadasza zaczyna się formalnie przed urodzeniem — obcinamy do daty urodzin
        parentStart: md.start < birth.date ? birth.date : md.start,
        parentEnd: md.end,
        parentCurrent: nowMs >= md.start.getTime() && nowMs < md.end.getTime(),
      });
      if (upcoming.length >= 7) break outer;
    }
  }
  return upcoming;
}

/** Wiek w kolejnych mahadaszach (mahadasze jako przedziały wieku) — wspólne dla Mapy Życia
 *  i Kosmogramu (Mapa Czasu Jog/Dosz w trybie "Pełne dane"), żeby obie strony nie liczyły tego osobno. */
export function fazyZycia(chart: VedicChart, birthDate: Date): { lord: PlanetId; fromAge: number; toAge: number; current: boolean }[] {
  const birthMs = birthDate.getTime();
  const yearMs = 365.25 * 86400000;
  const nowMs = Date.now();
  return chart.dashas
    .filter((d) => d.end.getTime() > birthMs)
    .map((d) => ({
      lord: d.lord,
      fromAge: Math.max(0, Math.round(((d.start.getTime() - birthMs) / yearMs) * 10) / 10),
      toAge: Math.round(((d.end.getTime() - birthMs) / yearMs) * 10) / 10,
      current: nowMs >= d.start.getTime() && nowMs < d.end.getTime(),
    }))
    .filter((p) => p.fromAge < 100);
}

export interface RankingMiejsc {
  bestPlaces: PlaceScore[];
  bestPlacesByCategory: Record<KategoriaMiejsca, PlaceScore[]>;
  challengingPlaces: PlaceScore[];
}

/**
 * Ranking miejsc — szukamy po CAŁYM ŚWIECIE (lista polska + 400 największych
 * miast świata wg GeoNames), nie tylko po garstce polskich miast. Kwalifikacja
 * NIE jest oparta o sumaryczny wynik (score) — to on wczesniej potrafil
 * wykluczyc miejsce z realnie bliska (≤250 km, ORB_STRONG_KM) linia benefika
 * tylko dlatego, ze w poblizu bylo tez kilka linii maleficznych, ktore
 * sciagaly sume w dol ponizej progu. Miejsce trafia na liste "sprzyjajace",
 * gdy ma choc jedna SILNA linie DOBROCZYNNEJ planety (nature===1) — kropka,
 * niezaleznie od tego, co jeszcze przechodzi obok. Analogicznie "wymagajace"
 * potrzebuje silnej linii MALEFICZNEJ (nature===-1). Sumaryczny score zostaje
 * tylko jako kolejnosc sortowania (orientacyjna), nie jako filtr wykluczajacy.
 *
 * Wydzielone z buildLifeMap, żeby dało się policzyć samodzielnie z samych
 * linii astrokartograficznych (np. na /astrokartografia), bez numerologii
 * i reszty syntezy Mapy Życia, których ten ranking nie potrzebuje.
 */
export function rankMiejsca(lines: PlanetLines[]): RankingMiejsc {
  const linieWgNatury = (s: PlaceScore, nature: 1 | -1) =>
    s.lines.filter((l) => l.strong && BODIES[l.planet].nature === nature);
  // sortowanie NIE po sumarycznym score (ten myli, gdy obok jest tez silna
  // linia przeciwnej natury — patrz komentarz wyzej), tylko po tym, jak blisko
  // jest NAJBLIZSZA pasujaca linia — to ona odpowiada na pytanie "sprzyjajace/
  // wymagajace w JAKIM stopniu", nie reszta linii w tle.
  const najblizsza = (s: PlaceScore, nature: 1 | -1) => Math.min(...linieWgNatury(s, nature).map((l) => l.km));

  const kandydaci = [...PLACES, ...WORLD_CITIES_TOP];
  const wszystkie = kandydaci
    .map((p) => scorePlace(lines, p))
    .filter((s) => s.lines.length > 0);

  const widziane = new Set<string>();
  const bezDubli = (list: PlaceScore[]) => list.filter((s) => {
    if (widziane.has(s.place.name)) return false;
    widziane.add(s.place.name);
    return true;
  });

  const wspierajace = wszystkie
    .filter((s) => linieWgNatury(s, 1).length > 0)
    .sort((a, b) => najblizsza(a, 1) - najblizsza(b, 1));
  const wymagajace = wszystkie
    .filter((s) => linieWgNatury(s, -1).length > 0)
    .sort((a, b) => najblizsza(a, -1) - najblizsza(b, -1));

  const bestPlaces = bezDubli(wspierajace).slice(0, 5);

  // te same silne trafienia, tym razem pogrupowane wg tematu najbliższej linii —
  // np. kto szuka miejsca "dla biznesu" patrzy tylko na kolumnę kariery
  const bestPlacesByCategory = { kariera: [], dom: [], relacje: [], poczatki: [] } as Record<KategoriaMiejsca, PlaceScore[]>;
  for (const s of wspierajace) {
    const kat = KATEGORIA_KATA[s.lines[0].angle];
    if (bestPlacesByCategory[kat].length < 3) bestPlacesByCategory[kat].push(s);
  }

  return {
    bestPlaces,
    bestPlacesByCategory,
    challengingPlaces: bezDubli(wymagajace).slice(0, 5),
  };
}

export function buildLifeMap(
  birth: BirthData,
  isoDate: string,
  fullName: string | undefined,
): LifeMap {
  const chart = buildChart(birth);
  const num = numerology(isoDate, fullName, "pitagorejski", new Date().getFullYear());
  const lines = astrocartography(birth.date);
  const nowChain = activeChain(chart.dashas, new Date());
  const upcoming = upcomingAntardashas(chart, birth);
  const lifePhases = fazyZycia(chart, birth.date);
  const ranking = rankMiejsca(lines);

  return {
    chart,
    numerology: num,
    lines,
    now: nowChain,
    upcoming,
    lifePhases,
    ...ranking,
  };
}

/** Kompaktowy pakiet danych dla AI — pełna synteza. */
export function lifeMapForAI(lm: LifeMap, isoDate: string, placeName: string, fullName?: string) {
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const c = lm.chart;
  return {
    dataUrodzenia: isoDate,
    miejsceUrodzenia: placeName,
    imie: fullName || undefined,

    kimJestem: {
      lagna: c.angles ? RASIS[c.angles.lagnaSign].pl : null,
      slonce: RASIS[c.sunSign].pl,
      ksiezyc: {
        znak: RASIS[c.moonSign].pl,
        nakszatra: c.moonNakshatra.nakshatra.pl,
        pada: c.moonNakshatra.pada,
        motyw: c.moonNakshatra.nakshatra.motyw,
        wladca: GRAHAS[c.moonNakshatra.nakshatra.lord].pl,
      },
      jogakaraka: c.angles && jogakaraka(c.angles.lagnaSign)
        ? GRAHAS[jogakaraka(c.angles.lagnaSign)!].pl
        : null,
      karakiCzarowe: karakiCzarowe(c).map((ka) => ({
        rola: ka.skrot, planeta: GRAHAS[ka.planeta].pl, znaczenie: ka.znaczenie,
      })),
      wyroznienia: Object.values(c.planets)
        .filter((p) => p.dignity === "egzaltacja" || p.dignity === "upadek" || p.dignity === "władanie" || p.combust)
        .map((p) => ({
          planeta: GRAHAS[p.id].pl, znak: p.signPl, dom: p.house || undefined,
          godnosc: p.dignity, spalona: p.combust || undefined,
        })),
      /**
       * Skupienia (stellium) — 3+ grah w jednym domu. Bez tego planeta bez
       * szczególnej godności (np. Słońce w koniunkcji z trzema innymi, ale
       * samo w sobie „przeciętne") znikała z danych dla AI, mimo że wizualnie
       * jest częścią najmocniej obsadzonego miejsca w mapie.
       */
      skupienia: (() => {
        const domy = new Map<number, PlanetId[]>();
        for (const id of PLANET_ORDER) {
          const h = c.planets[id].house;
          if (!h) continue;
          (domy.get(h) ?? domy.set(h, []).get(h)!).push(id);
        }
        return [...domy.entries()]
          .filter(([, ids]) => ids.length >= 3)
          .map(([dom, ids]) => ({
            dom, znak: c.planets[ids[0]].signPl,
            planety: ids.map((id) => GRAHAS[id].pl),
          }));
      })(),
    },

    jakDzialam: {
      drogaZycia: lm.numerology.lifePath,
      liczbaUrodzenia: lm.numerology.birthday,
      planetaWladajaca: lm.numerology.rulingPlanet,
      rokOsobisty: lm.numerology.personalYear,
      ekspresja: lm.numerology.expression,
    },

    kiedy: {
      teraz: lm.now.map((d) => ({
        poziom: d.level === 1 ? "mahadasza" : d.level === 2 ? "antardasza" : "pratjantardasza",
        wladca: GRAHAS[d.lord].pl,
        do: fmt(d.end),
      })),
      nadchodzaceOkresy: lm.upcoming.map((u) => ({
        wladca: GRAHAS[u.lord].pl,
        od: fmt(u.start), do: fmt(u.end),
        charakter: u.tone,
        dlaczego: ocenaWladcy(c, u.lord).czynniki,
        trwaTeraz: u.current || undefined,
      })),
    },

    gdzie: {
      sprzyjajace: lm.bestPlaces.map((s) => ({
        miejsce: s.place.name,
        motyw: s.theme,
        linie: s.lines.map((l) => `${BODIES[l.planet].pl} ${ANGLE_MEANINGS[l.angle].code} (${Math.round(l.km)} km)`),
      })),
      wymagajace: lm.challengingPlaces.map((s) => ({
        miejsce: s.place.name,
        linie: s.lines.map((l) => `${BODIES[l.planet].pl} ${ANGLE_MEANINGS[l.angle].code} (${Math.round(l.km)} km)`),
      })),
    },
  };
}

export { VIMSHOTTARI_YEARS };
