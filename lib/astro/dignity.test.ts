import { describe, it, expect } from "vitest";
import { GRAHAS, PLANET_ORDER } from "./constants";

describe("Godności planet", () => {
  /**
   * REGRESJA: typ Dignity deklarował „mulatrikona”, ale dignityOf() nie miał
   * dla niej żadnej gałęzi — nigdy nie była zwracana. Klasyczne zakresy:
   * Słońce Lew 0–20, Księżyc Byk 4–30, Mars Baran 0–12, Merkury Panna 16–20,
   * Jowisz Strzelec 0–10, Wenus Waga 0–15, Saturn Wodnik 0–20.
   */
  it("siedem planet ma zdefiniowaną mulatrikonę w poprawnym znaku", () => {
    const oczekiwane: Record<string, [number, number, number]> = {
      sun: [4, 0, 20], moon: [1, 4, 30], mars: [0, 0, 12], mercury: [5, 16, 20],
      jupiter: [8, 0, 10], venus: [6, 0, 15], saturn: [10, 0, 20],
    };
    for (const [id, [sign, from, to]] of Object.entries(oczekiwane)) {
      const mt = GRAHAS[id as keyof typeof GRAHAS].mulatrikona;
      expect(mt, id).toBeDefined();
      expect(mt!.sign, id).toBe(sign);
      expect(mt!.from, id).toBe(from);
      expect(mt!.to, id).toBe(to);
    }
    // Rahu i Ketu nie władają znakami — mulatrikony nie przypisujemy
    expect(GRAHAS.rahu.mulatrikona).toBeUndefined();
    expect(GRAHAS.ketu.mulatrikona).toBeUndefined();
  });

  it("mulatrikona leży w znaku władanym (poza Słońcem i Księżycem — te mają po jednym)", () => {
    for (const id of PLANET_ORDER) {
      const g = GRAHAS[id];
      if (!g.mulatrikona) continue;
      if (id === "moon") continue; // Byk to znak egzaltacji Księżyca, nie władania
      expect(g.ownSigns, id).toContain(g.mulatrikona.sign);
    }
  });

  it("Rahu i Ketu nie mają orbu spalenia — nie mogą być spalone", () => {
    expect(GRAHAS.rahu.combustionOrb).toBeUndefined();
    expect(GRAHAS.ketu.combustionOrb).toBeUndefined();
  });

  it("egzaltacja i upadek są zawsze w znakach przeciwległych", () => {
    for (const id of PLANET_ORDER) {
      const g = GRAHAS[id];
      if (!g.exaltation || !g.debilitation) continue;
      expect(Math.abs(g.exaltation.sign - g.debilitation.sign), id).toBe(6);
      expect(g.exaltation.degree, id).toBe(g.debilitation.degree);
    }
  });
});
