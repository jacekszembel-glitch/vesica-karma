import {
  Body,
  EclipticGeoMoon,
  GeoVector,
  RotateVector,
  Rotation_EQJ_ECT,
  Observer,
  SearchRiseSet,
  SearchSunLongitude,
} from "astronomy-engine";
import { atan2d, diffAngle, julianCenturies, norm360 } from "./math";
import { toSidereal } from "./ayanamsa";
import { PLANET_ORDER, type PlanetId } from "./constants";
import type { OuterId } from "./bodies";

/**
 * Warstwa efemeryd — jedyne miejsce w kodzie, które dotyka biblioteki
 * astronomicznej. Dzięki temu podmiana biblioteki (np. na Swiss Ephemeris)
 * sprowadza się do przepisania tego pliku.
 *
 * Biblioteka: astronomy-engine (MIT) — bez zobowiązań licencyjnych.
 * Wszystkie wyniki: pozorne (z aberacją), ekliptyka prawdziwa daty,
 * następnie przeliczone na zodiak syderyczny (Lahiri).
 */

const BODY_MAP: Partial<Record<PlanetId, Body>> = {
  sun: Body.Sun,
  mars: Body.Mars,
  mercury: Body.Mercury,
  jupiter: Body.Jupiter,
  venus: Body.Venus,
  saturn: Body.Saturn,
};

/**
 * Planety zewnętrzne — wyłącznie na potrzeby astrokartografii (patrz bodies.ts).
 * Nie wchodzą do kosmogramu ani do dasz.
 */
const OUTER_BODY: Record<OuterId, Body> = {
  uranus: Body.Uranus,
  neptune: Body.Neptune,
  pluto: Body.Pluto,
};

/** Pozorna pozycja tropikalna planety zewnętrznej (ekliptyka prawdziwa daty). */
export function outerTropicalPosition(id: OuterId, date: Date): { lon: number; lat: number } {
  const eqj = GeoVector(OUTER_BODY[id], date, true);
  const ect = RotateVector(Rotation_EQJ_ECT(date), eqj);
  const lon = norm360(atan2d(ect.y, ect.x));
  const lat = atan2d(ect.z, Math.hypot(ect.x, ect.y));
  return { lon, lat };
}

/** Pozorna długość i szerokość ekliptyczna tropikalna (ekliptyka prawdziwa daty). */
function tropicalPosition(id: PlanetId, date: Date): { lon: number; lat: number } {
  if (id === "moon") {
    const m = EclipticGeoMoon(date);
    return { lon: norm360(m.lon), lat: m.lat };
  }
  if (id === "rahu" || id === "ketu") {
    const node = meanLunarNode(date);
    const lon = id === "rahu" ? node : node + 180;
    return { lon: norm360(lon), lat: 0 };
  }
  const body = BODY_MAP[id];
  if (!body) throw new Error(`Nieznane ciało: ${id}`);
  const eqj = GeoVector(body, date, true);
  const ect = RotateVector(Rotation_EQJ_ECT(date), eqj);
  const lon = norm360(atan2d(ect.y, ect.x));
  const lat = Math.atan2(ect.z, Math.hypot(ect.x, ect.y)) * (180 / Math.PI);
  return { lon, lat };
}

/**
 * Średni węzeł wstępujący Księżyca (Rahu), w stopniach, ekliptyka średnia daty.
 * Meeus, „Astronomical Algorithms", rozdz. 47.
 *
 * Astrologia wedyjska w tradycji Lahiri używa domyślnie węzła średniego,
 * nie prawdziwego — dlatego liczymy właśnie tę wartość.
 */
export function meanLunarNode(date: Date): number {
  const T = julianCenturies(date);
  const omega =
    125.0445479 -
    1934.1362891 * T +
    0.0020754 * T * T +
    (T * T * T) / 467441 -
    (T * T * T * T) / 60616000;
  return norm360(omega);
}

export interface PlanetPosition {
  id: PlanetId;
  /** Długość syderyczna 0–360°, 0 = początek Meszy. */
  longitude: number;
  /** Szerokość ekliptyczna. */
  latitude: number;
  /** Prędkość dzienna w stopniach (ujemna = ruch wsteczny). */
  speed: number;
  retrograde: boolean;
}

/** Pozycja pojedynczej planety w zodiaku syderycznym. */
export function planetPosition(id: PlanetId, date: Date): PlanetPosition {
  const { lon, lat } = tropicalPosition(id, date);
  const sidereal = toSidereal(lon, date);

  // Prędkość: różnica centralna. Dla Księżyca krótszy krok — szybki ruch.
  const stepDays = id === "moon" ? 0.05 : 0.5;
  const stepMs = stepDays * 86400000;
  const before = toSidereal(tropicalPosition(id, new Date(date.getTime() - stepMs)).lon, date);
  const after = toSidereal(tropicalPosition(id, new Date(date.getTime() + stepMs)).lon, date);
  const speed = diffAngle(after, before) / (2 * stepDays);

  // Rahu i Ketu poruszają się wstecznie z definicji.
  const retrograde = id === "rahu" || id === "ketu" ? true : speed < 0;

  return { id, longitude: sidereal, latitude: lat, speed, retrograde };
}

/** Pozycje wszystkich dziewięciu grah. */
export function allPlanets(date: Date): Record<PlanetId, PlanetPosition> {
  const out = {} as Record<PlanetId, PlanetPosition>;
  for (const id of PLANET_ORDER) out[id] = planetPosition(id, date);
  return out;
}

export interface WschodyZachody {
  /** Najbliższy wschód Słońca PRZED chwilą urodzenia. */
  wschodPrzed: Date;
  /** Najbliższy zachód Słońca PRZED chwilą urodzenia. */
  zachodPrzed: Date;
  /** Najbliższy wschód Słońca PO chwili urodzenia. */
  wschodPo: Date;
  /** Najbliższy zachód Słońca PO chwili urodzenia. */
  zachodPo: Date;
  /** Czy urodzenie wypadło za dnia (między wschodem a najbliższym po nim zachodem). */
  urodzenieZaDnia: boolean;
}

/**
 * Wschody/zachody Słońca otaczające chwilę urodzenia — do Kala Bali
 * (Nathonnata, Tribhaga, władcy roku/miesiąca/dnia/godziny). Szuka do
 * 2 dni w każdą stronę (bezpieczny margines poza kołem podbiegunowym
 * w typowych szerokościach geograficznych użytkowników).
 */
export function wschodyZachody(date: Date, latitude: number, longitudeEast: number): WschodyZachody | null {
  const observer = new Observer(latitude, longitudeEast, 0);
  const wschodPrzed = SearchRiseSet(Body.Sun, observer, +1, date, -2);
  const zachodPrzed = SearchRiseSet(Body.Sun, observer, -1, date, -2);
  const wschodPo = SearchRiseSet(Body.Sun, observer, +1, date, 2);
  const zachodPo = SearchRiseSet(Body.Sun, observer, -1, date, 2);
  if (!wschodPrzed || !zachodPrzed || !wschodPo || !zachodPo) return null; // np. w kole podbiegunowym
  return {
    wschodPrzed: wschodPrzed.date, zachodPrzed: zachodPrzed.date,
    wschodPo: wschodPo.date, zachodPo: zachodPo.date,
    urodzenieZaDnia: wschodPrzed.date.getTime() > zachodPrzed.date.getTime(),
  };
}

/**
 * Najbliższy moment PRZED podaną chwilą, w którym Słońce (pozorna długość
 * tropikalna) miało zadaną długość — do wyszukiwania sankranti (wejścia
 * Słońca w znak) na potrzeby Warszy/Masy Bali. `oknoDni` musi z zapasem
 * przekraczać okres między dwoma kolejnymi przejściami Słońca przez ten sam
 * punkt (~35 dla miesiąca, ~370 dla roku) — w tym oknie trafienie jest
 * zawsze dokładnie jedno, więc wynik jest jednoznaczny.
 */
export function sankrantiPrzed(targetTropicalLon: number, przed: Date, oknoDni: number): Date | null {
  const start = new Date(przed.getTime() - oknoDni * 86400000);
  const wynik = SearchSunLongitude(targetTropicalLon, start, oknoDni);
  return wynik ? wynik.date : null;
}
