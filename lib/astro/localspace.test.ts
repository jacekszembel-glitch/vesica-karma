import { describe, it, expect } from "vitest";
import { localSpace, kierunekOf } from "./localspace";
import { norm360 } from "./math";
import { DateTime } from "luxon";

/** Racibórz. */
const LAT = 50.09, LON = 18.22;

describe("Mapa lokalna (Local Space)", () => {
  /**
   * Najmocniejszy sprawdzian azymutu: w prawdziwe południe słoneczne
   * Słońce góruje dokładnie na POŁUDNIU (azymut ~180°) dla naszej szerokości.
   */
  it("Słońce w południe słoneczne stoi na południu", () => {
    // UWAGA: południe SŁONECZNE, nie zegarowe. Dla 18,22°E wypada ok. 10:47 UTC
    // (12:00 − 18,22°/15 + równanie czasu), czyli ok. 12:47 czasu letniego.
    const utc = new Date("2026-06-21T10:47:00Z");
    const s = localSpace(utc, LAT, LON, false).find((l) => l.id === "sun")!;
    expect(Math.abs(s.azimuth - 180)).toBeLessThan(6);
    expect(s.aboveHorizon).toBe(true);
    expect(s.kierunek).toBe("południe");
  });

  it("Słońce o północy słonecznej jest pod horyzontem, po stronie północnej", () => {
    // północ słoneczna = 12 h po południu słonecznym
    const utc = new Date("2026-06-21T22:47:00Z");
    const s = localSpace(utc, LAT, LON, false).find((l) => l.id === "sun")!;
    expect(s.aboveHorizon).toBe(false);
    expect(s.altitude).toBeLessThan(0);
    // azymut blisko 0/360
    expect(Math.min(s.azimuth, 360 - s.azimuth)).toBeLessThan(10);
  });

  it("Słońce o wschodzie jest na wschodzie, o zachodzie na zachodzie", () => {
    // równonoc — Słońce wschodzi ok. 6:00 i zachodzi ok. 18:00 czasu lokalnego
    const wschod = DateTime.fromISO("2026-03-20T06:05", { zone: "Europe/Warsaw" }).toUTC().toJSDate();
    const zachod = DateTime.fromISO("2026-03-20T18:05", { zone: "Europe/Warsaw" }).toUTC().toJSDate();
    const w = localSpace(wschod, LAT, LON, false).find((l) => l.id === "sun")!;
    const z = localSpace(zachod, LAT, LON, false).find((l) => l.id === "sun")!;
    expect(Math.abs(w.azimuth - 90)).toBeLessThan(12);
    expect(Math.abs(z.azimuth - 270)).toBeLessThan(12);
  });

  it("linia zaczyna się dokładnie w miejscu urodzenia", () => {
    const utc = new Date("1981-04-11T10:45:00Z");
    for (const l of localSpace(utc, LAT, LON)) {
      expect(l.path[0][0]).toBeCloseTo(LAT, 6);
      expect(l.path[0][1]).toBeCloseTo(LON, 6);
    }
  });

  it("wielkie koło idzie we właściwą stronę i nie ucieka poza mapę", () => {
    const utc = new Date("1981-04-11T10:45:00Z");
    for (const l of localSpace(utc, LAT, LON)) {
      // drugi punkt musi leżeć w kierunku azymutu: dla azymutu < 90 idziemy na północ
      if (l.azimuth < 80) expect(l.path[1][0]).toBeGreaterThan(LAT);
      if (l.azimuth > 100 && l.azimuth < 260) expect(l.path[1][0]).toBeLessThan(LAT);
      for (const [la, lo] of l.path) {
        expect(Math.abs(la)).toBeLessThanOrEqual(90.001);
        expect(Math.abs(lo)).toBeLessThanOrEqual(180.001);
      }
    }
  });

  it("wszystkie 9 grah + 3 planety zewnętrzne", () => {
    const utc = new Date("1981-04-11T10:45:00Z");
    expect(localSpace(utc, LAT, LON, true, false)).toHaveLength(12);
    expect(localSpace(utc, LAT, LON, false, false)).toHaveLength(9);
  });

  it("AS/DS/MC/IC dochodzą jako kolejne 4 linie (domyślnie włączone)", () => {
    const utc = new Date("1981-04-11T10:45:00Z");
    expect(localSpace(utc, LAT, LON, true)).toHaveLength(16);
    const kontury = localSpace(utc, LAT, LON, false);
    expect(kontury).toHaveLength(13);
    for (const id of ["asc", "desc", "mc", "ic"] as const) {
      expect(kontury.some((l) => l.id === id)).toBe(true);
    }
  });

  it("Ascendent i Descendent leżą na horyzoncie (wysokość ~0°), dokładnie naprzeciw siebie", () => {
    const utc = new Date("1981-04-11T10:45:00Z");
    const linie = localSpace(utc, LAT, LON);
    const asc = linie.find((l) => l.id === "asc")!;
    const desc = linie.find((l) => l.id === "desc")!;
    expect(Math.abs(asc.altitude)).toBeLessThan(0.5);
    expect(Math.abs(desc.altitude)).toBeLessThan(0.5);
    expect(Math.abs(norm360(desc.azimuth - asc.azimuth) - 180)).toBeLessThan(0.5);
  });

  it("Medium Coeli i Immum Coeli leżą dokładnie naprzeciw siebie", () => {
    const utc = new Date("1981-04-11T10:45:00Z");
    const linie = localSpace(utc, LAT, LON);
    const mc = linie.find((l) => l.id === "mc")!;
    const ic = linie.find((l) => l.id === "ic")!;
    expect(Math.abs(norm360(ic.azimuth - mc.azimuth) - 180)).toBeLessThan(0.5);
  });

  it("nazwy kierunków", () => {
    expect(kierunekOf(0)).toBe("północ");
    expect(kierunekOf(90)).toBe("wschód");
    expect(kierunekOf(180)).toBe("południe");
    expect(kierunekOf(270)).toBe("zachód");
    expect(kierunekOf(45)).toBe("północny wschód");
    expect(kierunekOf(359)).toBe("północ");
  });
});
