import { describe, expect, it } from "vitest";
import { dist, klasyfikujTyp, policzGeometrie, walidujPunkty, type PunktyKalibracji } from "./hiromancja";

describe("hiromancja — geometria", () => {
  it("dist: trójkąt 3-4-5", () => {
    expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
  it("dist: ten sam punkt = 0", () => {
    expect(dist({ x: 10, y: 10 }, { x: 10, y: 10 })).toBe(0);
  });

  it("klasyfikacja: kwadratowa + krótkie palce = ziemia", () => {
    expect(klasyfikujTyp(1.0, 0.8)).toBe("ziemia");
  });
  it("klasyfikacja: kwadratowa + długie palce = powietrze", () => {
    expect(klasyfikujTyp(1.0, 1.2)).toBe("powietrze");
  });
  it("klasyfikacja: wydłużona + krótkie palce = ogień", () => {
    expect(klasyfikujTyp(1.4, 0.8)).toBe("ogien");
  });
  it("klasyfikacja: wydłużona + długie palce = woda", () => {
    expect(klasyfikujTyp(1.4, 1.2)).toBe("woda");
  });
  it("progi graniczne: dokładnie na progu kształtu liczy się jako WYDŁUŻONA (< ścisłe), na progu palca jako DŁUGIE (>= luźne)", () => {
    // stosunekDloni dokładnie 1.15 -> NIE < 1.15 -> wydłużona; stosunekPalca dokładnie 1.0 -> >= 1.0 -> długie => woda
    expect(klasyfikujTyp(1.15, 1.0)).toBe("woda");
    // tuż poniżej progu kształtu -> kwadratowa; tuż poniżej progu palca -> krótkie => ziemia
    expect(klasyfikujTyp(1.1499, 0.9999)).toBe("ziemia");
  });

  it("policzGeometrie: kwadrat 100x100 z krótkim palcem (40) = ziemia", () => {
    const pkt: PunktyKalibracji = {
      nadgarstek: { x: 50, y: 100 },
      podstawaPalca: { x: 50, y: 0 }, // dlugoscDloni = 100
      szczytPalca: { x: 50, y: -40 }, // dlugoscPalca = 40 -> stosunekPalca 0.4 (krótkie)
      krawedzLewa: { x: 0, y: 0 },
      krawedzPrawa: { x: 100, y: 0 }, // szerokoscDloni = 100 -> stosunekDloni 1.0 (kwadratowa)
    };
    const w = policzGeometrie(pkt);
    expect(w.dlugoscDloni).toBe(100);
    expect(w.szerokoscDloni).toBe(100);
    expect(w.dlugoscPalca).toBe(40);
    expect(w.stosunekDloni).toBe(1);
    expect(w.stosunekPalca).toBeCloseTo(0.4);
    expect(w.typ).toBe("ziemia");
  });

  it("policzGeometrie: wydłużona dłoń (150x100) z długim palcem (160) = woda", () => {
    const pkt: PunktyKalibracji = {
      nadgarstek: { x: 50, y: 150 },
      podstawaPalca: { x: 50, y: 0 }, // dlugoscDloni = 150
      szczytPalca: { x: 50, y: -160 }, // dlugoscPalca = 160 -> stosunekPalca > 1
      krawedzLewa: { x: 0, y: 0 },
      krawedzPrawa: { x: 100, y: 0 }, // szerokoscDloni = 100 -> stosunekDloni 1.5 (wydłużona)
    };
    const w = policzGeometrie(pkt);
    expect(w.stosunekDloni).toBe(1.5);
    expect(w.stosunekPalca).toBeCloseTo(160 / 150);
    expect(w.typ).toBe("woda");
  });

  it("walidujPunkty: poprawny układ (palec nad nadgarstkiem, czubek nad podstawą) przechodzi", () => {
    const pkt: PunktyKalibracji = {
      nadgarstek: { x: 50, y: 100 },
      podstawaPalca: { x: 50, y: 0 },
      szczytPalca: { x: 50, y: -40 },
      krawedzLewa: { x: 0, y: 0 },
      krawedzPrawa: { x: 100, y: 0 },
    };
    expect(walidujPunkty(pkt)).toBe(true);
  });

  it("walidujPunkty: odwrócone punkty (podstawa palca NIŻEJ niż nadgarstek) odrzucone", () => {
    const pkt: PunktyKalibracji = {
      nadgarstek: { x: 50, y: 0 },
      podstawaPalca: { x: 50, y: 100 }, // niżej niż nadgarstek — błąd
      szczytPalca: { x: 50, y: 140 },
      krawedzLewa: { x: 0, y: 100 },
      krawedzPrawa: { x: 100, y: 100 },
    };
    expect(walidujPunkty(pkt)).toBe(false);
  });

  it("walidujPunkty: lewa i prawa krawędź w tym samym miejscu odrzucone", () => {
    const pkt: PunktyKalibracji = {
      nadgarstek: { x: 50, y: 100 },
      podstawaPalca: { x: 50, y: 0 },
      szczytPalca: { x: 50, y: -40 },
      krawedzLewa: { x: 50, y: 0 },
      krawedzPrawa: { x: 50, y: 0 },
    };
    expect(walidujPunkty(pkt)).toBe(false);
  });
});
