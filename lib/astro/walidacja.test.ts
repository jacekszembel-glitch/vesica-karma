import { describe, expect, it } from "vitest";
import { buildChart } from "./chart";
import { TYPY_WYDARZEN } from "./rektyfikacja";
import { walidujWydarzenie, przygotujProbke, szansaCoNajmniej, podsumuj, mapaDoWalidacji } from "./walidacja";

const DZIS = new Date(Date.UTC(2026, 9, 1));

describe("Walidacja na zdarzeniach życia", () => {
  it("rozkład Poissona-dwumianowy: proste przypadki", () => {
    expect(szansaCoNajmniej(0, [0.3, 0.3])).toBeCloseTo(1, 10);
    expect(szansaCoNajmniej(2, [0.5, 0.5])).toBeCloseTo(0.25, 10);
    expect(szansaCoNajmniej(1, [0.3])).toBeCloseTo(0.3, 10);
    const s = podsumuj([true, false, true], [0.3, 0.3, 0.3]);
    expect(s.trafienia).toBe(2);
    expect(s.oczekiwanePrzypadkiem).toBeCloseTo(0.9, 10);
  });

  it("bez godziny urodzenia lagną jest znak Księżyca", () => {
    const c = buildChart({ date: new Date("1981-04-11T10:45:00Z"), latitude: 50.09, longitude: 18.22, timeKnown: false });
    expect(mapaDoWalidacji(c).angles!.lagnaSign).toBe(c.moonSign);
  });

  it("uczciwość: dla dat losowych (bez związku z mapą) trafienia zdarzają się tak często, jak przewiduje przypadek", () => {
    let ziarno = 4711;
    const los = () => (ziarno = (ziarno * 16807) % 2147483647) / 2147483647;
    let trafienia = 0, oczekiwane = 0, n = 0;
    for (let i = 0; i < 120; i++) {
      const c = buildChart({
        date: new Date(Date.UTC(1940, 0, 1) + los() * (Date.UTC(2000, 0, 1) - Date.UTC(1940, 0, 1))),
        latitude: -50 + los() * 110, longitude: -180 + los() * 360, timeKnown: true,
      });
      const probka = przygotujProbke(c, DZIS);
      for (let j = 0; j < 3; j++) {
        const od = c.birth.date.getTime() + 5 * 365.25 * 86400000;
        const data = new Date(od + los() * (DZIS.getTime() - od));
        const typ = TYPY_WYDARZEN[Math.floor(los() * TYPY_WYDARZEN.length)];
        const w = walidujWydarzenie(c, { data, typ }, probka);
        expect(w.procentDni).toBeGreaterThanOrEqual(0);
        expect(w.procentDni).toBeLessThanOrEqual(100);
        if (w.trafienie) trafienia++;
        oczekiwane += w.pPrzypadku;
        n++;
      }
    }
    // 360 losowych zdarzeń: odsetek trafień w granicach ±7 p.p. od przewidywanego przypadku
    expect(Math.abs(trafienia / n - oczekiwane / n)).toBeLessThan(0.07);
    expect(oczekiwane / n).toBeGreaterThan(0.15);
    expect(oczekiwane / n).toBeLessThan(0.45);
  }, 300000);
});
