import { describe, expect, it } from "vitest";
import { buildChart } from "./chart";
import { dziedzinyTalentu, KOLEJNOSC_TALENTU } from "./dziedzinyTalentu";
import { ROZKLADY_TALENTU } from "./srednieTalentu";
import { procentNizej } from "./srednieBilansu";

const chart = buildChart({ date: new Date("1981-04-11T10:45:00Z"), latitude: 50.09, longitude: 18.22, timeKnown: true });

describe("Dziedziny talentu", () => {
  it("bez godziny urodzenia (bez lagny) zwraca null", () => {
    expect(dziedzinyTalentu({ ...chart, angles: null })).toBeNull();
  });

  it("10 dziedzin w stałej kolejności, czynniki sumują się na wynik", () => {
    const w = dziedzinyTalentu(chart)!;
    expect(w.map((x) => x.id)).toEqual(KOLEJNOSC_TALENTU);
    for (const d of w) {
      expect(d.czynniki.length).toBeGreaterThan(0);
      expect(d.czynniki.reduce((s, c) => s + c.punkty, 0)).toBeCloseTo(d.punkty, 1);
    }
  });

  it("muzyka uwzględnia Wenus, Księżyc, Merkurego i domy 2, 3, 5", () => {
    const m = dziedzinyTalentu(chart)!.find((x) => x.id === "muzyka")!;
    const teksty = m.czynniki.map((c) => c.tekst).join(" | ");
    for (const s of ["Wenus", "Księżyc", "Merkury", "2. dom", "3. dom", "5. dom"]) expect(teksty).toContain(s);
  });

  it("rozkłady zgadzają się z niezależną próbą 1000 map (mediana blisko 50%)", () => {
    let ziarno = 4242;
    const los = () => (ziarno = (ziarno * 16807) % 2147483647) / 2147483647;
    const suma: Record<string, number> = {};
    const N = 1000;
    for (let i = 0; i < N; i++) {
      const c = buildChart({
        date: new Date(Date.UTC(1930, 0, 1) + los() * (Date.UTC(2024, 11, 31) - Date.UTC(1930, 0, 1))),
        latitude: -55 + los() * 120, longitude: -180 + los() * 360, timeKnown: true,
      });
      for (const d of dziedzinyTalentu(c)!) suma[d.id] = (suma[d.id] ?? 0) + procentNizej(d.punkty, ROZKLADY_TALENTU[d.id]);
    }
    for (const id of KOLEJNOSC_TALENTU) expect(Math.abs(suma[id] / N - 50)).toBeLessThan(4);
  }, 120000);
});
