import { describe, it, expect } from "vitest";
import { buildChart } from "./chart";
import { ocenaZdrowotna } from "./zdrowieWedyjski";

const chart = buildChart({ date: new Date("1981-04-11T10:45:00Z"), latitude: 50.09, longitude: 18.22, timeKnown: true });

describe("ocenaZdrowotna — dedykowany silnik", () => {
  it("zwraca role dla wladcy lagny, 6. i 8. domu, Slonca i Ksiezyca", () => {
    const w = ocenaZdrowotna(chart);
    const role = w.planety.flatMap((p) => p.role);
    expect(role.some((r) => r.includes("Tanu bhava"))).toBe(true);
    expect(role.some((r) => r.includes("6. domu"))).toBe(true);
    expect(role.some((r) => r.includes("8. domu"))).toBe(true);
    expect(role.some((r) => r.includes("witalności"))).toBe(true);
    expect(role.some((r) => r.includes("umysłu"))).toBe(true);
  });

  it("dwie różne planety dostają różne wyniki (nie recykling)", () => {
    const w = ocenaZdrowotna(chart);
    const punkty = w.planety.map((p) => p.ocena.punkty);
    expect(new Set(punkty).size).toBeGreaterThan(1);
  });

  it("dziala bez znanej godziny urodzenia (wladcy domow wymagaja lagny, karakowie nie)", () => {
    const bezGodziny = { ...chart, angles: null };
    const w = ocenaZdrowotna(bezGodziny);
    expect(w.planety.some((p) => p.planeta === "sun")).toBe(true);
    expect(w.planety.some((p) => p.planeta === "moon")).toBe(true);
  });

  it("aspekt Saturna lub Marsa jest widoczny w uzasadnieniu, gdy wystepuje", () => {
    const w = ocenaZdrowotna(chart);
    const mowiOAspekcie = w.planety.some((p) => p.ocena.czynniki.some((c) => c.includes("aspekt Saturna") || c.includes("aspekt Marsa") || c.includes("aspekt Jowisza")));
    expect(mowiOAspekcie).toBe(true);
  });
});
