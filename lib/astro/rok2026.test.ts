import { describe, it, expect } from "vitest";
import { WIBRACJA_ROKU, rokOsobisty2026, tranzyty2026, okresy2026, retrogradacje2026, ROK_OSOBISTY_2026 } from "./rok2026";
import { allPlanets } from "./ephemeris";

describe("Horoskop 2026", () => {
  it("wibracja roku 2026 to 1", () => {
    expect(WIBRACJA_ROKU).toBe(1);
  });

  it("rok osobisty liczy sie z dnia i miesiaca", () => {
    // 11.04: 11->2, 4->4, 2026->1; 2+4+1=7
    expect(rokOsobisty2026("1981-04-11")).toBe(7);
    // kazdy wynik ma opis
    for (let d = 1; d <= 28; d++) {
      const r = rokOsobisty2026(`1990-06-${String(d).padStart(2, "0")}`);
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(9);
      expect(ROK_OSOBISTY_2026[r]).toBeDefined();
    }
  });

  it("tranzyty pokrywaja caly rok bez dziur", () => {
    const moon = allPlanets(new Date("1981-04-11T10:45:00Z")).moon.longitude;
    for (const t of tranzyty2026(moon)) {
      expect(t.odcinki[0].odMies).toBe(1);
      expect(t.odcinki[t.odcinki.length - 1].doMies).toBe(12);
      for (let i = 1; i < t.odcinki.length; i++) {
        expect(t.odcinki[i].odMies).toBe(t.odcinki[i - 1].doMies + 1);
      }
      for (const o of t.odcinki) {
        expect(o.dom).toBeGreaterThanOrEqual(1);
        expect(o.dom).toBeLessThanOrEqual(12);
      }
    }
  });

  it("retrogradacje 2026: Merkury ma kilka krotkich okresow, Jowisz i Saturn po jednym dlugim", () => {
    const r = retrogradacje2026();
    const merkury = r.filter((x) => x.id === "mercury");
    const jowisz = r.filter((x) => x.id === "jupiter");
    const saturn = r.filter((x) => x.id === "saturn");
    // Merkury retroguje ~3-4x rocznie po ~3 tygodnie
    expect(merkury.length).toBeGreaterThanOrEqual(2);
    expect(merkury.length).toBeLessThanOrEqual(5);
    // Jowisz/Saturn retroguja raz w roku, przez kilka miesiecy
    expect(jowisz.length).toBeGreaterThanOrEqual(1);
    expect(saturn.length).toBeGreaterThanOrEqual(1);
    for (const okres of r) {
      expect(okres.od.getTime()).toBeLessThan(okres.do.getTime());
      expect(okres.od.getUTCFullYear()).toBeLessThanOrEqual(2026);
      expect(okres.do.getUTCFullYear()).toBeGreaterThanOrEqual(2026);
    }
  });

  it("okresy: stan na 1 stycznia + zmiany posortowane wewnatrz roku", () => {
    const utc = new Date("1981-04-11T10:45:00Z");
    const moon = allPlanets(utc).moon.longitude;
    const o = okresy2026(moon, utc);
    expect(o.start.length).toBeGreaterThanOrEqual(1);
    for (let i = 1; i < o.zmiany.length; i++) {
      expect(o.zmiany[i].data.getTime()).toBeGreaterThanOrEqual(o.zmiany[i - 1].data.getTime());
    }
    for (const z of o.zmiany) {
      expect(z.data.getUTCFullYear()).toBe(2026);
    }
  });
});
