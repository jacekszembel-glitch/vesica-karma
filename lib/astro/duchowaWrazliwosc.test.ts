import { describe, it, expect } from "vitest";
import { buildChart, type VedicChart, type ChartPlanet } from "./chart";
import type { PlanetId } from "./constants";
import { wrazliwoscDuchowa } from "./duchowaWrazliwosc";

const chart = buildChart({ date: new Date("1981-04-11T10:45:00Z"), latitude: 50.09, longitude: 18.22, timeKnown: true });

const zLagna = (s: number): VedicChart => ({ ...chart, angles: { ...chart.angles!, lagnaSign: s } });

function zPlanetami(c: VedicChart, override: Partial<Record<PlanetId, Partial<ChartPlanet>>>): VedicChart {
  const planets = { ...c.planets };
  for (const [id, patch] of Object.entries(override) as [PlanetId, Partial<ChartPlanet>][]) {
    planets[id] = { ...planets[id], ...patch };
  }
  return { ...c, planets };
}

describe("Wrażliwość duchowa", () => {
  it("zawsze zwraca poprawny poziom, nawet bez żadnego czynnika", () => {
    const w = wrazliwoscDuchowa(chart);
    expect(["wyraźna", "umiarkowana", "subtelna"]).toContain(w.poziom);
    expect(w.punkty).toBeGreaterThanOrEqual(0);
  });

  it("Ketu w egzaltacji (Skorpion) podnosi punkty i dodaje uzasadnienie", () => {
    const testowy = zPlanetami(chart, { ketu: { sign: 7, longitude: 7 * 30 + 20, degreeInSign: 20, dignity: "egzaltacja" } });
    const w = wrazliwoscDuchowa(testowy);
    expect(w.czynniki.some((c) => c.includes("Ketu"))).toBe(true);
    expect(w.punkty).toBeGreaterThanOrEqual(2);
  });

  it("planeta w 8. domu od lagny dodaje punkty i wymienia ją w uzasadnieniu", () => {
    // lagna Baran (0), Mars w Skorpionie (7) = 8. dom od lagny
    const testowy = zPlanetami(zLagna(0), { mars: { sign: 7 } });
    const w = wrazliwoscDuchowa(testowy);
    expect(w.czynniki.some((c) => c.includes("8. domu") && c.includes("Mars"))).toBe(true);
  });

  it("planeta w 9. domu od lagny dodaje punkty i wymienia ją w uzasadnieniu", () => {
    // lagna Baran (0), Jowisz w Strzelcu (8) = 9. dom od lagny
    const testowy = zPlanetami(zLagna(0), { jupiter: { sign: 8 } });
    const w = wrazliwoscDuchowa(testowy);
    expect(w.czynniki.some((c) => c.includes("9. domu") && c.includes("Jowisz"))).toBe(true);
  });

  it("planeta w 12. domu od lagny dodaje punkty i wymienia ją w uzasadnieniu", () => {
    // lagna Baran (0), Wenus w Rybach (11) = 12. dom od lagny
    const testowy = zPlanetami(zLagna(0), { venus: { sign: 11 } });
    const w = wrazliwoscDuchowa(testowy);
    expect(w.czynniki.some((c) => c.includes("12. domu") && c.includes("Wenus"))).toBe(true);
  });

  it("ścisła koniunkcja Księżyc-Ketu (w stopniach, nie tylko 'ten sam znak') dodaje +2,5", () => {
    // ketu w znaku neutralnym (3, nie 7/1 - unikamy bonusu za godnosc), ksiezyc w Wadze (6) = 7. dom od lagny (0) - poza 8./12.
    const podstawa = zPlanetami(zLagna(0), {
      ketu: { sign: 3, longitude: 3 * 30 + 15, dignity: "neutralny" },
      moon: { sign: 6, longitude: 6 * 30 + 15 },
    });
    const bez = wrazliwoscDuchowa(podstawa);
    // Ksiezyc 3° od Ketu, ten sam znak (4. dom od lagny, wciaz poza 8./12.) - jedyna zmiana to koniunkcja
    const zKoniunkcja = zPlanetami(podstawa, { moon: { sign: 3, longitude: 3 * 30 + 18 } });
    const w = wrazliwoscDuchowa(zKoniunkcja);
    expect(w.czynniki.some((c) => c.includes("Księżyc") && c.includes("Ketu") && c.includes("ścisłej"))).toBe(true);
    expect(w.punkty).toBeCloseTo(bez.punkty + 2.5, 5);
  });

  it("koniunkcja Księżyc-Ketu przez granicę znaków (różne znaki, ale blisko stopniowo) wciąż się liczy", () => {
    // to jest wlasnie poprawka: stary test "ten sam znak" by to przeoczyl
    const podstawa = zPlanetami(zLagna(0), {
      ketu: { sign: 3, longitude: 4 * 30 - 0.1, dignity: "neutralny" }, // 29,9° Raka
      moon: { sign: 6, longitude: 6 * 30 + 15 },
    });
    const bez = wrazliwoscDuchowa(podstawa);
    const zKoniunkcja = zPlanetami(podstawa, { moon: { sign: 4, longitude: 4 * 30 + 0.1 } }); // 0,1° Lwa - inny znak, 0,2° od Ketu
    const w = wrazliwoscDuchowa(zKoniunkcja);
    expect(w.czynniki.some((c) => c.includes("Księżyc") && c.includes("Ketu") && c.includes("ścisłej"))).toBe(true);
    expect(w.punkty).toBeCloseTo(bez.punkty + 2.5, 5);
  });

  it("szeroka koniunkcja w tym samym znaku (>10°, ≤30°) dodaje mniej — +1,2, nie +2,5", () => {
    const podstawa = zPlanetami(zLagna(0), {
      ketu: { sign: 3, longitude: 3 * 30 + 2, dignity: "neutralny" },
      moon: { sign: 6, longitude: 6 * 30 + 15 },
    });
    const bez = wrazliwoscDuchowa(podstawa);
    const zKoniunkcja = zPlanetami(podstawa, { moon: { sign: 3, longitude: 3 * 30 + 27 } }); // 25° od Ketu
    const w = wrazliwoscDuchowa(zKoniunkcja);
    expect(w.czynniki.some((c) => c.includes("Księżyc") && c.includes("Ketu") && c.includes("szerszy"))).toBe(true);
    expect(w.punkty).toBeCloseTo(bez.punkty + 1.2, 5);
  });

  it("wysoka suma czynników daje poziom 'wyraźna'", () => {
    const testowy = zPlanetami(zLagna(0), {
      ketu: { sign: 7, longitude: 7 * 30 + 15, dignity: "egzaltacja" },
      moon: { sign: 7, longitude: 7 * 30 + 16 }, // ścisła koniunkcja z Ketu
      mars: { sign: 7 }, // 8. dom od lagny (Baran), razem z Ketu i Ksiezycem w tym samym znaku
    });
    const w = wrazliwoscDuchowa(testowy);
    expect(w.poziom).toBe("wyraźna");
  });
});
