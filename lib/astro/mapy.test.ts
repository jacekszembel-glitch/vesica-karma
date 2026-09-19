import { describe, it, expect } from "vitest";
import { buildChart } from "./chart";
import { relocate } from "./relocation";
import { solarReturn, returnOffsetHours } from "./solarreturn";
import { astrocartography } from "./astrocarto";
import { scorePoint, heatGrid, heatRange, coupleplaces, momentPlaces } from "./geoscore";
import { planetPosition } from "./ephemeris";
import { diffAngle } from "./math";

const URODZINY = new Date("1981-04-11T10:45:00Z");
const RACIBORZ = { lat: 50.09, lon: 18.22 };
const chart = buildChart({ date: URODZINY, latitude: RACIBORZ.lat, longitude: RACIBORZ.lon, timeKnown: true });

describe("Mapa relokacyjna", () => {
  it("znaki planet się NIE zmieniają — tylko domy", () => {
    const r = relocate(chart, -33.87, 151.21)!; // Sydney
    expect(r).not.toBeNull();
    for (const p of r.planets) {
      expect(p.sign).toBe(chart.planets[p.id].sign);
    }
  });

  it("to samo miejsce = brak jakiejkolwiek zmiany", () => {
    const r = relocate(chart, RACIBORZ.lat, RACIBORZ.lon)!;
    expect(r.lagnaChanged).toBe(false);
    expect(r.houseShift).toBe(0);
    for (const p of r.planets) expect(p.houseRelocated).toBe(p.houseNatal);
    expect(r.highlights).toHaveLength(0);
  });

  it("przy zmianie lagny WSZYSTKIE planety przesuwają się o tyle samo domów", () => {
    // szukamy długości geograficznej, która realnie zmienia lagnę
    let znaleziona: number | null = null;
    for (let lon = -180; lon < 180; lon += 15) {
      const r = relocate(chart, 50, lon)!;
      if (r.lagnaChanged) { znaleziona = lon; break; }
    }
    expect(znaleziona).not.toBeNull();
    const r = relocate(chart, 50, znaleziona!)!;
    const przesuniecia = new Set(r.planets.map((p) => p.shift));
    expect(przesuniecia.size).toBe(1); // domy Whole Sign przesuwają się blokiem
    expect([...przesuniecia][0]).not.toBe(0);
  });

  it("bez znanej godziny urodzenia relokacja jest niemożliwa", () => {
    const bezGodziny = buildChart({ date: URODZINY, latitude: 50, longitude: 18, timeKnown: false });
    expect(relocate(bezGodziny, 40, 2)).toBeNull();
  });
});

describe("Powrót Słońca", () => {
  it("Słońce wraca dokładnie do pozycji urodzeniowej", () => {
    const target = planetPosition("sun", URODZINY).longitude;
    for (const rok of [2000, 2026, 2040]) {
      const sr = solarReturn(URODZINY, rok);
      const lon = planetPosition("sun", sr).longitude;
      expect(Math.abs(diffAngle(target, lon)), String(rok)).toBeLessThan(1 / 3600);
      expect(sr.getUTCFullYear()).toBe(rok);
    }
  });

  it("moment powrotu przesuwa się względem rocznicy kalendarzowej", () => {
    // rok zwrotnikowy to 365,2422 doby, wiec odchylenie siega kilkunastu godzin
    const off = returnOffsetHours(URODZINY, 2026);
    expect(Math.abs(off)).toBeLessThan(30);
  });
});

describe("Oceny geograficzne", () => {
  const lines = astrocartography(URODZINY);

  it("punkt na linii dobroczynnej ma wyższą ocenę niż daleko od niej", () => {
    const jowisz = lines.find((l) => l.id === "jupiter")!;
    const naLinii = scorePoint(lines, 50, jowisz.mc);
    const daleko = scorePoint(lines, 50, jowisz.mc + 90);
    expect(naLinii).toBeGreaterThan(daleko);
  });

  it("wyróżnienie planety podbija jej wpływ", () => {
    const jowisz = lines.find((l) => l.id === "jupiter")!;
    const zwykle = scorePoint(lines, 50, jowisz.mc);
    const wyrozniony = scorePoint(lines, 50, jowisz.mc, { emphasise: "jupiter" });
    expect(wyrozniony).toBeGreaterThan(zwykle);
  });

  it("siatka heatmapy pokrywa glob i ma zróżnicowane wartości", () => {
    const cells = heatGrid(lines, 12);
    // szerokości -72..72 co 12° = 13 wierszy, długości -180..168 co 12° = 30 kolumn
    expect(cells.length).toBe(13 * 30);
    const { min, max } = heatRange(cells);
    expect(max).toBeGreaterThan(min);
    for (const c of cells) {
      expect(Math.abs(c.lat)).toBeLessThanOrEqual(72);
      expect(c.lon).toBeGreaterThanOrEqual(-180);
      expect(c.lon).toBeLessThan(180);
    }
  });

  it("mapa pary ciągnie wynik w stronę gorszego z dwojga", () => {
    const linesB = astrocartography(new Date("1985-09-03T06:20:00Z"));
    const { best } = coupleplaces(lines, linesB);
    for (const m of best) {
      const gorszy = Math.min(m.scoreA, m.scoreB);
      const srednia = (m.scoreA + m.scoreB) / 2;
      // wspólny wynik nie może być korzystniejszy niż zwykła średnia
      expect(m.scoreShared).toBeLessThanOrEqual(srednia + 1e-9);
      expect(m.scoreShared).toBeGreaterThanOrEqual(gorszy - 1e-9);
    }
  });

  it("mapa chwili zwraca posortowany ranking", () => {
    const r = momentPlaces(new Date("2026-09-01T09:00:00Z"), 6);
    expect(r.length).toBeLessThanOrEqual(6);
    for (let i = 1; i < r.length; i++) {
      expect(r[i].score).toBeLessThanOrEqual(r[i - 1].score);
    }
  });
});
