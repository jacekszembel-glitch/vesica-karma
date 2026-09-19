import { describe, it, expect } from "vitest";
import { gunaMilan } from "./gunamilan";

/** Środek znaku o podanym indeksie (0 = Mesza/Baran). */
const znak = (i: number) => i * 30 + 15;

describe("Guna Milan", () => {
  /**
   * REGRESJA: porównanie w kucie Varna było odwrócone (<= zamiast >=),
   * więc punkt dostawały pary, które wg tradycji nie powinny go dostać.
   * Zasada: punkt, gdy varna mężczyzny (b) >= varna kobiety (a).
   * Varny znaków: woda=3 (bramin), ogień=2, ziemia=1, powietrze=0 (śudra).
   */
  it("Varna: punkt gdy varna mezczyzny jest rowna lub wyzsza", () => {
    // ona Bliźnięta (powietrze, 0), on Rak (woda, 3) → 3 >= 0 → punkt
    const wyzsza = gunaMilan(znak(2), znak(3));
    expect(wyzsza.kutas[0].points).toBe(1);

    // ona Rak (woda, 3), on Bliźnięta (powietrze, 0) → 0 >= 3 nieprawda → brak
    const nizsza = gunaMilan(znak(3), znak(2));
    expect(nizsza.kutas[0].points).toBe(0);

    // ta sama varna → punkt
    const rowna = gunaMilan(znak(3), znak(7)); // Rak i Skorpion, oba woda
    expect(rowna.kutas[0].points).toBe(1);
  });

  it("suma nie przekracza 36 i kuty maja poprawne maksima", () => {
    for (let a = 0; a < 12; a++) {
      for (let b = 0; b < 12; b++) {
        const r = gunaMilan(znak(a), znak(b));
        expect(r.total).toBeGreaterThanOrEqual(0);
        expect(r.total).toBeLessThanOrEqual(36);
        for (const k of r.kutas) expect(k.points).toBeLessThanOrEqual(k.max);
      }
    }
    const maks = [1, 2, 3, 4, 5, 6, 7, 8];
    const r = gunaMilan(znak(0), znak(0));
    expect(r.kutas.map((k) => k.max)).toEqual(maks);
  });

  it("identyczne Ksiezyce: ta sama nadi = 0 pkt i dosza", () => {
    const r = gunaMilan(znak(0), znak(0));
    const nadi = r.kutas.find((k) => k.name === "Nadi")!;
    expect(nadi.points).toBe(0);
    expect(r.doshas.some((d) => d.startsWith("Nadi"))).toBe(true);
  });

  it("Bhakoot: osie 2/12, 5/9 i 6/8 sa niepomyslne", () => {
    for (const odleglosc of [2, 5, 6, 8, 9, 12]) {
      const r = gunaMilan(znak(0), znak((odleglosc - 1) % 12));
      expect(r.kutas.find((k) => k.name === "Bhakoot")!.points).toBe(0);
    }
    for (const odleglosc of [1, 3, 4, 7, 10, 11]) {
      const r = gunaMilan(znak(0), znak((odleglosc - 1) % 12));
      expect(r.kutas.find((k) => k.name === "Bhakoot")!.points).toBe(7);
    }
  });
});
