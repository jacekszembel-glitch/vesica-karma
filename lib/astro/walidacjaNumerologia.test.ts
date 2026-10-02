import { describe, expect, it } from "vitest";
import { numerology } from "./numerology";
import { rokOsobisty, walidujNumerologie } from "./walidacjaNumerologia";

describe("Walidacja numerologiczna", () => {
  it("rok osobisty liczony tak samo jak personalYear w numerology.ts", () => {
    for (const [data, rok] of [["1981-04-11", 2014], ["1990-12-29", 2009], ["2001-07-07", 2026]] as const) {
      const [, m, d] = data.split("-").map(Number);
      expect(rokOsobisty(d, m, rok)).toBe(numerology(data, undefined, "wedyjski", rok).personalYear);
    }
  });

  it("trafienie wg znaczenia roku, szansa przypadku z dni próbki", () => {
    // 11.04: rok osobisty w 2014 = 2 + 4 + 7 = 13 → 4 — przeprowadzka (4 lub 5) pasuje, ślub (2 lub 6) nie
    const dni = Array.from({ length: 90 }, (_, i) => new Date(Date.UTC(1990 + Math.floor(i / 3), (i % 3) * 4, 15)));
    const p = walidujNumerologie(11, 4, { data: new Date(Date.UTC(2014, 5, 1)), typ: "przeprowadzka" }, dni);
    expect(p.rok).toBe(4);
    expect(p.trafienie).toBe(true);
    expect(p.pPrzypadku).toBeCloseTo(2 / 9, 1);
    expect(walidujNumerologie(11, 4, { data: new Date(Date.UTC(2014, 5, 1)), typ: "slub" }, dni).trafienie).toBe(false);
  });
});
