import { SiderealTime } from "astronomy-engine";
import { allPlanets, outerTropicalPosition } from "./ephemeris";
import { ayanamsa } from "./ayanamsa";
import { eclipticToEquatorial } from "./astrocarto";
import { tropicalAscendant, tropicalMC } from "./houses";
import { norm360, sin, cos, atan2d, DEG, RAD } from "./math";
import { PLANET_ORDER } from "./constants";
import { OUTER_ORDER, type BodyId } from "./bodies";

/**
 * MAPA LOKALNA (Local Space) — technika Michaela Erlewine'a.
 *
 * Zupełnie inna rzecz niż astrokartografia, choć obie rysują linie na mapie:
 *
 *  - astrokartografia pyta „GDZIE NA ŚWIECIE planeta stała w wyróżnionym punkcie
 *    nieba” i daje linie rozrzucone po globie;
 *  - mapa lokalna pyta „W KTÓRĄ STRONĘ patrzeć z mojego miejsca, żeby zobaczyć
 *    tę planetę” i daje promienie wychodzące z jednego punktu.
 *
 * Praktycznie: astrokartografia mówi, dokąd się przeprowadzić, a mapa lokalna —
 * w którym kierunku od domu jechać, a nawet jak ustawić biurko w mieszkaniu.
 *
 * Liczymy azymut (kierunek na horyzoncie) każdej planety w chwili i miejscu
 * urodzenia, a potem prowadzimy z tego punktu wielkie koło w tym kierunku.
 * Wielkie koło, nie linia prosta — na kuli najkrótsza droga zakrzywia się na mapie.
 */

export interface LocalSpaceLine {
  id: BodyId;
  /** Azymut w stopniach: 0 = północ, 90 = wschód, 180 = południe, 270 = zachód. */
  azimuth: number;
  /** Wysokość nad horyzontem w stopniach; ujemna = planeta była pod horyzontem. */
  altitude: number;
  /** Czy planeta była widoczna nad horyzontem w chwili urodzenia. */
  aboveHorizon: boolean;
  /** Nazwa kierunku po polsku (np. „północny wschód”). */
  kierunek: string;
  /** Punkty wielkiego koła [szerokość, długość] — od miejsca urodzenia w dal. */
  path: [number, number][];
}

const KIERUNKI = [
  "północ", "północny wschód", "wschód", "południowy wschód",
  "południe", "południowy zachód", "zachód", "północny zachód",
];

/** Nazwa kierunku dla azymutu (8 sektorów po 45°). */
export function kierunekOf(azimuth: number): string {
  return KIERUNKI[Math.round(norm360(azimuth) / 45) % 8];
}

/**
 * Azymut i wysokość ciała o danych współrzędnych równikowych,
 * widzianego z punktu (φ, λ) w chwili o podanym czasie gwiazdowym.
 *
 * Rozkładamy wektor kierunku na składowe lokalne:
 *   północ = −cos δ · cos H · sin φ + sin δ · cos φ
 *   wschód = −cos δ · sin H
 * gdzie H to lokalny kąt godzinny (rośnie ku zachodowi).
 */
function horizontal(
  ra: number, dec: number, gastDeg: number, lat: number, lon: number,
): { azimuth: number; altitude: number } {
  const H = norm360(gastDeg + lon - ra);
  const north = -cos(dec) * cos(H) * sin(lat) + sin(dec) * cos(lat);
  const east = -cos(dec) * sin(H);
  const up = sin(dec) * sin(lat) + cos(dec) * cos(H) * cos(lat);
  return {
    azimuth: norm360(atan2d(east, north)),
    altitude: Math.asin(Math.max(-1, Math.min(1, up))) * RAD,
  };
}

/**
 * Wielkie koło z punktu (φ₁, λ₁) w kierunku θ.
 * φ₂ = asin(sin φ₁ · cos δ + cos φ₁ · sin δ · cos θ)
 * λ₂ = λ₁ + atan2(sin θ · sin δ · cos φ₁, cos δ − sin φ₁ · sin φ₂)
 */
function greatCircle(
  lat: number, lon: number, bearing: number, maxDeg = 175, step = 2.5,
): [number, number][] {
  const φ1 = lat * DEG;
  const λ1 = lon * DEG;
  const θ = bearing * DEG;
  const out: [number, number][] = [];
  for (let d = 0; d <= maxDeg; d += step) {
    const δ = d * DEG;
    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
    const λ2 = λ1 + Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2),
    );
    let lonDeg = (λ2 * RAD) % 360;
    if (lonDeg > 180) lonDeg -= 360;
    if (lonDeg < -180) lonDeg += 360;
    out.push([φ2 * RAD, lonDeg]);
  }
  return out;
}

/**
 * Mapa lokalna dla chwili i miejsca urodzenia.
 * @param withOuter czy dołączyć Urana, Neptuna i Plutona (technika zachodnia — mają tu prawo być)
 * @param withAngles czy dołączyć AS/DS/MC/IC (tak jak astro.com w Local Space) — domyślnie tak,
 *   wyłączane tam, gdzie z założenia chodzi tylko o planety (np. Kompas Dnia)
 */
export function localSpace(
  date: Date, lat: number, lon: number, withOuter = true, withAngles = true,
): LocalSpaceLine[] {
  const gastDeg = SiderealTime(date) * 15;
  const planets = allPlanets(date);
  const ay = ayanamsa(date);

  const build = (id: BodyId, lonTropical: number, latEcl: number): LocalSpaceLine => {
    const eq = eclipticToEquatorial(lonTropical, latEcl, date);
    const { azimuth, altitude } = horizontal(eq.ra, eq.dec, gastDeg, lat, lon);
    return {
      id, azimuth, altitude,
      aboveHorizon: altitude > 0,
      kierunek: kierunekOf(azimuth),
      path: greatCircle(lat, lon, azimuth),
    };
  };

  const out = PLANET_ORDER.map((id) => {
    const p = planets[id];
    // wyliczenia zwracają długości syderyczne — do RA/dec wracamy do tropikalnych
    return build(id, norm360(p.longitude + ay), p.latitude);
  });

  if (withOuter) {
    for (const id of OUTER_ORDER) {
      const p = outerTropicalPosition(id, date);
      out.push(build(id, p.lon, p.lat));
    }
  }

  if (withAngles) {
    // AS/MC liczone tu samym wzorem co wladca lagny w kosmogramie, tylko z lat/lon
    // OBSERWACJI (nie zawsze miejsca urodzenia) — tak samo jak dla planet, azymut
    // przelicza sie wzgledem miejsca, z ktorego aktualnie "patrzymy" (patrz naglowek
    // pliku). DS/IC to po prostu przeciwlegly punkt na ekliptyce (+180).
    const asc = tropicalAscendant(date, lat, lon);
    const mc = tropicalMC(date, lon);
    out.push(build("asc", asc, 0));
    out.push(build("desc", norm360(asc + 180), 0));
    out.push(build("mc", mc, 0));
    out.push(build("ic", norm360(mc + 180), 0));
  }
  return out;
}
