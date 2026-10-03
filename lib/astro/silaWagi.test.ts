import { describe, expect, it } from "vitest";
import { buildChart } from "./chart";
import { ocenaWladcy, znakCzynnika } from "./sila";
import { wykryteJogiPosortowane } from "./yogas";
import { PLANET_ORDER } from "./constants";
import { ocenaFinansowa } from "./finanseWedyjskie";
import { ocenaZdrowotna } from "./zdrowieWedyjski";

// 2000 losowych map (stałe ziarno) — wagi czynników muszą dokładnie składać się na wynik
let ziarno = 42;
const los = () => (ziarno = (ziarno * 16807) % 2147483647) / 2147483647;
const mapy = Array.from({ length: 2000 }, () => buildChart({
  date: new Date(Date.UTC(1930, 0, 1) + los() * (Date.UTC(2024, 0, 1) - Date.UTC(1930, 0, 1))),
  latitude: -55 + los() * 120, longitude: -180 + los() * 360, timeKnown: los() > 0.1,
}));

describe("ocenaWladcy — wagi czynników", () => {
  it("każdy czynnik ma wagę, suma wag = punkty, plus − minus = punkty", () => {
    for (const c of mapy) {
      const jogi = wykryteJogiPosortowane(c, "pl");
      for (const id of PLANET_ORDER) {
        const o = ocenaWladcy(c, id, jogi);
        expect(o.wagi).toHaveLength(o.czynniki.length);
        expect(o.wagi.reduce((a, b) => a + b, 0)).toBeCloseTo(o.punkty, 1);
        expect(o.plus - o.minus).toBeCloseTo(o.punkty, 1);
        expect(o.plus).toBeGreaterThanOrEqual(0);
        expect(o.minus).toBeGreaterThanOrEqual(0);
      }
    }
  }, 60000);

  it("żaden czynnik nie ma wagi zero (każdy faktycznie zmienia wynik)", () => {
    for (const c of mapy.slice(0, 300)) for (const id of PLANET_ORDER) {
      for (const w of ocenaWladcy(c, id, wykryteJogiPosortowane(c, "pl")).wagi) expect(w).not.toBe(0);
    }
  });

  it("finanse i zdrowie: wagi też składają się dokładnie na wynik", () => {
    for (const c of mapy) {
      for (const d of [...ocenaFinansowa(c).planety, ...ocenaZdrowotna(c).planety]) {
        expect(d.ocena.wagi).toHaveLength(d.ocena.czynniki.length);
        expect(d.ocena.wagi.reduce((a, b) => a + b, 0)).toBeCloseTo(d.ocena.punkty, 1);
        expect(d.ocena.plus - d.ocena.minus).toBeCloseTo(d.ocena.punkty, 1);
      }
    }
  });

  it("znak zgadywany z tekstu (znakCzynnika) zgadza się ze znakiem wagi", () => {
    const rozne: string[] = [];
    for (const c of mapy) {
      const jogi = wykryteJogiPosortowane(c, "pl");
      for (const id of PLANET_ORDER) {
        const o = ocenaWladcy(c, id, jogi);
        o.czynniki.forEach((t, i) => { if (znakCzynnika(t) !== Math.sign(o.wagi[i])) rozne.push(`${t} (${o.wagi[i]})`); });
      }
    }
    expect([...new Set(rozne)]).toEqual([]);
  });
});
