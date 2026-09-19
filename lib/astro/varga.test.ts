import { describe, expect, it } from "vitest";
import { navamsaSign, dashamsaSign, isVargottama, shashtiamsaSign, shodasamsaSign, vimsamsaSign, chaturvimsamsaSign } from "./varga";
import { gunaMilan } from "./gunamilan";

describe("vargi", () => {
  it("D9: pierwsza nawamsza Barana = Baran, ostatnia Barana = Strzelec", () => {
    expect(navamsaSign(0.5)).toBe(0);          // 0°30' Barana → Baran
    expect(navamsaSign(29)).toBe(8);           // 29° Barana → 9. nawamsza od Barana = Strzelec
  });
  it("D9: pierwsza nawamsza Raka = Rak (znak kardynalny wodny startuje od siebie)", () => {
    expect(navamsaSign(90.5)).toBe(3);         // 0°30' Raka → Rak
  });
  it("D9: 108 nawamsz pokrywa cały zodiak bez dziur", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 108; i++) seen.add(navamsaSign(i * (10 / 3) + 0.1));
    expect(seen.size).toBe(12);
  });
  it("D10: znak nieparzysty liczy od siebie, parzysty od 9.", () => {
    expect(dashamsaSign(1)).toBe(0);           // 1° Barana → Baran
    expect(dashamsaSign(31)).toBe(9);          // 1° Byka → 9. od Byka = Koziorożec
  });
  it("vargottama: 1° Barana tak, 15° Barana nie", () => {
    expect(isVargottama(1)).toBe(true);
    expect(isVargottama(15)).toBe(false);
  });

  // Wartości referencyjne zweryfikowane wprost z przykładów Jagannatha Hora
  // (patrz komentarz przy shashtiamsaSign w varga.ts).
  it("D60: znak nieparzysty (Baran) liczy od siebie — 0°15' Barana = 1. część = Baran", () => {
    expect(shashtiamsaSign(0.25)).toBe(0);
  });
  it("D60: 0°45' Barana = 2. część = Byk", () => {
    expect(shashtiamsaSign(0.75)).toBe(1);
  });
  it("D60: znak parzysty (Byk) liczy od 7. znaku od siebie — 1. część Byka = Skorpion", () => {
    expect(shashtiamsaSign(30.25)).toBe(7); // 0°15' Byka
  });
  it("D60: 60 części pokrywa cały zodiak bez dziur (5 pełnych okrążeń)", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 60; i++) seen.add(shashtiamsaSign(i * 0.5 + 0.1));
    expect(seen.size).toBe(12);
  });

  it("D16: znak chara (Baran) liczy od siebie, sthira (Byk) od Lwa, dwiswabhawa (Bliźnięta) od Strzelca", () => {
    expect(shodasamsaSign(0.5)).toBe(0);   // 0°30' Barana → Baran
    expect(shodasamsaSign(31)).toBe(4);    // 1° Byka → Lew
    expect(shodasamsaSign(61)).toBe(8);    // 1° Bliźniąt → Strzelec
  });
  it("D16: 16 części pokrywa cały zodiak bez dziur", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 16; i++) seen.add(shodasamsaSign(i * (30 / 16) + 0.1));
    expect(seen.size).toBe(12);
  });

  it("D20: znak chara (Baran) liczy od siebie, sthira (Byk) od Strzelca, dwiswabhawa (Bliźnięta) od Lwa", () => {
    expect(vimsamsaSign(0.5)).toBe(0);     // 0°30' Barana → Baran
    expect(vimsamsaSign(31)).toBe(8);      // 1° Byka → Strzelec
    expect(vimsamsaSign(61)).toBe(4);      // 1° Bliźniąt → Lew
  });
  it("D20: 20 części pokrywa cały zodiak bez dziur", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 20; i++) seen.add(vimsamsaSign(i * 1.5 + 0.1));
    expect(seen.size).toBe(12);
  });

  it("D24: znak nieparzysty (Baran) liczy od Lwa, parzysty (Byk) od Raka", () => {
    expect(chaturvimsamsaSign(1)).toBe(4);   // 1° Barana → Lew
    expect(chaturvimsamsaSign(31)).toBe(3);  // 1° Byka → Rak
  });
  it("D24: 24 części pokrywa cały zodiak bez dziur (2 pełne okrążenia)", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 24; i++) seen.add(chaturvimsamsaSign(i * 1.25 + 0.1));
    expect(seen.size).toBe(12);
  });
});

describe("Guna Milan", () => {
  it("identyczne Księżyce = wysoki wynik bez Nadi", () => {
    // ta sama nakszatra → nadi 0, ale reszta wysoka
    const r = gunaMilan(10, 10);
    expect(r.total).toBeGreaterThanOrEqual(20);
    expect(r.kutas.find((k) => k.name === "Nadi")!.points).toBe(0);
    expect(r.doshas.some((d) => d.includes("Nadi"))).toBe(true);
  });
  it("suma punktów = suma kut i nie przekracza 36", () => {
    for (const [a, b] of [[10, 200], [45, 300], [123, 17], [359, 1]]) {
      const r = gunaMilan(a, b);
      const sum = r.kutas.reduce((s, k) => s + k.points, 0);
      expect(Math.abs(r.total - sum)).toBeLessThan(0.01);
      expect(r.total).toBeLessThanOrEqual(36);
      expect(r.total).toBeGreaterThanOrEqual(0);
      expect(r.kutas).toHaveLength(8);
    }
  });
  it("różne nadi dają 8 punktów Nadi", () => {
    // Aświni (nadi 0) i Bharani (nadi 1)
    const r = gunaMilan(5, 18);
    expect(r.kutas.find((k) => k.name === "Nadi")!.points).toBe(8);
  });
  it("werdykt odpowiada progom", () => {
    const r = gunaMilan(5, 18);
    expect(["znakomite", "bardzo dobre", "dobre", "przeciętne", "wymagające"]).toContain(r.verdict);
  });
});
