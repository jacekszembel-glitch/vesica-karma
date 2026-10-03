import { describe, expect, it } from "vitest";
import { SREDNIE_BILANSU, procentNizej } from "./srednieBilansu";
import { buildChart } from "./chart";
import { ocenaWladcy } from "./sila";
import { wykryteJogiPosortowane } from "./yogas";

describe("średni bilans planety", () => {
  it("procentNizej: poniżej minimum 0, powyżej maksimum 100, rośnie z bilansem", () => {
    const j = SREDNIE_BILANSU.predyspozycje.jupiter!;
    expect(procentNizej(j.tabela[0] - 1, j)).toBe(0);
    expect(procentNizej(j.tabela[50] + 1, j)).toBe(100);
    let poprzedni = -1;
    for (let b = -2; b <= 8; b += 0.25) {
      const p = procentNizej(b, j);
      expect(p).toBeGreaterThanOrEqual(poprzedni);
      poprzedni = p;
    }
  });

  it("naturalne poziomy planet: Jowisz i Wenus wyraźnie na plusie, Rahu i Ketu na minusie", () => {
    const p = SREDNIE_BILANSU.predyspozycje;
    expect(p.jupiter!.srednia).toBeGreaterThan(2);
    expect(p.venus!.srednia).toBeGreaterThan(2);
    expect(p.rahu!.srednia).toBeLessThan(0);
    expect(p.ketu!.srednia).toBeLessThan(0);
  });

  it("średnie w kodzie zgadzają się z niezależną próbą 1000 map (±0,25)", () => {
    let ziarno = 777;
    const los = () => (ziarno = (ziarno * 16807) % 2147483647) / 2147483647;
    const suma: Record<string, number> = {};
    const N = 1000;
    for (let i = 0; i < N; i++) {
      const c = buildChart({
        date: new Date(Date.UTC(1930, 0, 1) + los() * (Date.UTC(2024, 11, 31) - Date.UTC(1930, 0, 1))),
        latitude: -55 + los() * 120, longitude: -180 + los() * 360, timeKnown: true,
      });
      const jogi = wykryteJogiPosortowane(c, "pl");
      for (const id of ["jupiter", "venus", "saturn", "rahu"] as const) suma[id] = (suma[id] ?? 0) + ocenaWladcy(c, id, jogi).punkty;
    }
    for (const id of ["jupiter", "venus", "saturn", "rahu"] as const) {
      expect(Math.abs(suma[id] / N - SREDNIE_BILANSU.predyspozycje[id]!.srednia)).toBeLessThan(0.25);
    }
  }, 60000);
});
