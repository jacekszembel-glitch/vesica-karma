import { describe, it, expect } from "vitest";
import { percentylSily, TABELA_PREDYSPOZYCJE } from "./percentyleDomen";

describe("percentylSily", () => {
  it("zwraca 0 dla wartosci ponizej lub rownej najnizszemu breakpointowi", () => {
    expect(percentylSily(0, TABELA_PREDYSPOZYCJE)).toBe(0);
  });

  it("zwraca 100 dla wartosci powyzej lub rownej najwyzszemu breakpointowi", () => {
    expect(percentylSily(9.45, TABELA_PREDYSPOZYCJE)).toBe(100);
  });

  it("nigdy nie przekracza 100 nawet dla ekstremalnej wartosci spoza proby", () => {
    expect(percentylSily(999, TABELA_PREDYSPOZYCJE)).toBe(100);
  });

  it("bierze wartosc bezwzgledna — ten sam wynik dla +x i -x", () => {
    expect(percentylSily(2.5, TABELA_PREDYSPOZYCJE)).toBe(percentylSily(-2.5, TABELA_PREDYSPOZYCJE));
  });

  it("interpoluje liniowo miedzy sasiednimi breakpointami", () => {
    // breakpointy w tabeli: indeks 45 -> 3.25 (percentyl 90), indeks 46 -> 3.5 (percentyl 92)
    const wPolowie = percentylSily(3.375, TABELA_PREDYSPOZYCJE);
    expect(wPolowie).toBeCloseTo(91, 0);
  });

  it("jest monotoniczna — wiekszy wynik nigdy nie daje nizszego percentyla", () => {
    const probki = [0, 0.5, 1, 1.5, 2, 3, 4, 5, 9];
    const percentyle = probki.map((p) => percentylSily(p, TABELA_PREDYSPOZYCJE));
    for (let i = 1; i < percentyle.length; i++) {
      expect(percentyle[i]).toBeGreaterThanOrEqual(percentyle[i - 1]);
    }
  });
});
