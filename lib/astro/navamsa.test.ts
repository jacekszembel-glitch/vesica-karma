import { describe, it, expect } from "vitest";
import { buildChart, type VedicChart } from "./chart";
import {
  navamsaChart, navamsaSign, dashamsaChart, dashamsaSign, isVargottama,
  drekkanaChart, drekkanaSign, chaturthamsaChart, chaturthamsaSign,
  saptamsaChart, saptamsaSign, dwadasamsaChart, dwadasamsaSign, horaLord,
} from "./varga";
import { PLANET_ORDER } from "./constants";

const chart = buildChart({
  date: new Date("1981-04-11T10:45:00Z"),
  latitude: 50.09, longitude: 18.22, timeKnown: true,
});

describe("Kosmogram nawamszy (D9)", () => {
  const d9 = navamsaChart(chart)!;

  it("powstaje tylko przy znanej godzinie urodzenia", () => {
    const bez = buildChart({ date: new Date("1981-04-11T10:45:00Z"), latitude: 50, longitude: 18, timeKnown: false });
    expect(navamsaChart(bez)).toBeNull();
    expect(d9).not.toBeNull();
  });

  it("każda planeta trafia do swojego znaku nawamszy", () => {
    for (const id of PLANET_ORDER) {
      expect(d9.planets[id].sign, id).toBe(navamsaSign(chart.planets[id].longitude));
    }
  });

  it("lagna D9 liczy się z nawamszy ascendentu", () => {
    expect(d9.angles!.lagnaSign).toBe(navamsaSign(chart.angles!.ascendant));
  });

  it("domy odmierzane od lagny D9, tak jak w mapie głównej", () => {
    const l = d9.angles!.lagnaSign;
    for (const id of PLANET_ORDER) {
      const p = d9.planets[id];
      expect(p.house, id).toBe(((p.sign - l + 12) % 12) + 1);
      expect(p.house).toBeGreaterThanOrEqual(1);
      expect(p.house).toBeLessThanOrEqual(12);
    }
  });

  it("długości ekliptyczne i nakszatry zostają z mapy głównej", () => {
    for (const id of PLANET_ORDER) {
      expect(d9.planets[id].longitude).toBe(chart.planets[id].longitude);
      expect(d9.planets[id].nakshatra.nakshatra.index).toBe(chart.planets[id].nakshatra.nakshatra.index);
    }
  });

  it("vargottama = ten sam znak w D1 i D9", () => {
    for (const id of PLANET_ORDER) {
      const taSama = chart.planets[id].sign === d9.planets[id].sign;
      expect(taSama, id).toBe(isVargottama(chart.planets[id].longitude));
    }
  });

  it("stopień w nawamszy mieści się w zakresie znaku", () => {
    for (const id of PLANET_ORDER) {
      expect(d9.planets[id].degreeInSign).toBeGreaterThanOrEqual(0);
      expect(d9.planets[id].degreeInSign).toBeLessThan(30);
    }
  });
});

describe("Kosmogram daśamszy (D10)", () => {
  const d10 = dashamsaChart(chart)!;

  it("powstaje tylko przy znanej godzinie urodzenia", () => {
    const bez = buildChart({ date: new Date("1981-04-11T10:45:00Z"), latitude: 50, longitude: 18, timeKnown: false });
    expect(dashamsaChart(bez)).toBeNull();
    expect(d10).not.toBeNull();
  });

  it("każda planeta trafia do swojego znaku daśamszy", () => {
    for (const id of PLANET_ORDER) {
      expect(d10.planets[id].sign, id).toBe(dashamsaSign(chart.planets[id].longitude));
    }
  });

  it("lagna D10 liczy się z daśamszy ascendentu", () => {
    expect(d10.angles!.lagnaSign).toBe(dashamsaSign(chart.angles!.ascendant));
  });

  it("domy odmierzane od lagny D10, tak jak w mapie głównej", () => {
    const l = d10.angles!.lagnaSign;
    for (const id of PLANET_ORDER) {
      const p = d10.planets[id];
      expect(p.house, id).toBe(((p.sign - l + 12) % 12) + 1);
      expect(p.house).toBeGreaterThanOrEqual(1);
      expect(p.house).toBeLessThanOrEqual(12);
    }
  });

  it("długości ekliptyczne i nakszatry zostają z mapy głównej", () => {
    for (const id of PLANET_ORDER) {
      expect(d10.planets[id].longitude).toBe(chart.planets[id].longitude);
      expect(d10.planets[id].nakshatra.nakshatra.index).toBe(chart.planets[id].nakshatra.nakshatra.index);
    }
  });

  it("stopień w daśamszy mieści się w zakresie znaku", () => {
    for (const id of PLANET_ORDER) {
      expect(d10.planets[id].degreeInSign).toBeGreaterThanOrEqual(0);
      expect(d10.planets[id].degreeInSign).toBeLessThan(30);
    }
  });

});

describe.each([
  ["D3 (drekkana)", drekkanaChart, drekkanaSign] as const,
  ["D4 (czaturthamsza)", chaturthamsaChart, chaturthamsaSign] as const,
  ["D7 (saptamsza)", saptamsaChart, saptamsaSign] as const,
  ["D12 (dwadaśamsza)", dwadasamsaChart, dwadasamsaSign] as const,
])("Kosmogram %s", (_nazwa, buduj, signFn) => {
  const d = buduj(chart)!;

  it("powstaje tylko przy znanej godzinie urodzenia", () => {
    const bez = buildChart({ date: new Date("1981-04-11T10:45:00Z"), latitude: 50, longitude: 18, timeKnown: false });
    expect(buduj(bez)).toBeNull();
    expect(d).not.toBeNull();
  });

  it("każda planeta trafia do znaku zwracanego przez signFn", () => {
    for (const id of PLANET_ORDER) {
      expect(d.planets[id].sign, id).toBe(signFn(chart.planets[id].longitude));
    }
  });

  it("lagna liczy się z tego samego signFn na ascendencie", () => {
    expect(d.angles!.lagnaSign).toBe(signFn(chart.angles!.ascendant));
  });

  it("domy odmierzane od lagny, tak jak w mapie głównej", () => {
    const l = d.angles!.lagnaSign;
    for (const id of PLANET_ORDER) {
      const p = d.planets[id];
      expect(p.house, id).toBe(((p.sign - l + 12) % 12) + 1);
      expect(p.house).toBeGreaterThanOrEqual(1);
      expect(p.house).toBeLessThanOrEqual(12);
    }
  });

  it("długości ekliptyczne i nakszatry zostają z mapy głównej", () => {
    for (const id of PLANET_ORDER) {
      expect(d.planets[id].longitude).toBe(chart.planets[id].longitude);
      expect(d.planets[id].nakshatra.nakshatra.index).toBe(chart.planets[id].nakshatra.nakshatra.index);
    }
  });

  it("stopień w podziale mieści się w zakresie znaku", () => {
    for (const id of PLANET_ORDER) {
      expect(d.planets[id].degreeInSign).toBeGreaterThanOrEqual(0);
      expect(d.planets[id].degreeInSign).toBeLessThan(30);
    }
  });
});

describe("Znaki podziałowe — wartości referencyjne (BPHS)", () => {
  it("drekkana (D3): Baran → Baran, Lew, Strzelec (trikona ognia)", () => {
    expect(drekkanaSign(5)).toBe(0);   // 5° Barana
    expect(drekkanaSign(15)).toBe(4);  // 15° Barana
    expect(drekkanaSign(25)).toBe(8);  // 25° Barana
  });

  it("czaturthamsza (D4): Baran → Baran, Rak, Waga, Koziorożec (kendry)", () => {
    expect(chaturthamsaSign(2)).toBe(0);   // 2° Barana
    expect(chaturthamsaSign(10)).toBe(3);  // 10° Barana
    expect(chaturthamsaSign(18)).toBe(6);  // 18° Barana
    expect(chaturthamsaSign(26)).toBe(9);  // 26° Barana
  });

  it("saptamsza (D7): znak nieparzysty liczy od siebie, parzysty od 7. znaku", () => {
    expect(saptamsaSign(2)).toBe(0);   // 2° Barana (nieparzysty, 1. część) → Baran
    expect(saptamsaSign(32)).toBe(7);  // 2° Byka (parzysty, 1. część) → 7. znak od Byka = Skorpion
  });

  it("dwadaśamsza (D12): zawsze liczy od tego samego znaku, sekwencyjnie", () => {
    expect(dwadasamsaSign(1)).toBe(0);    // 1° Barana → Baran
    expect(dwadasamsaSign(29)).toBe(11);  // 29° Barana (ostatnia część) → Ryby
  });

  it("hora (D2): nieparzysty znak = Słońce w 1. połowie, parzysty = Księżyc w 1. połowie", () => {
    expect(horaLord(5)).toBe("sun");    // 5° Barana (nieparzysty, 1. połowa)
    expect(horaLord(20)).toBe("moon");  // 20° Barana (nieparzysty, 2. połowa)
    expect(horaLord(35)).toBe("moon");  // 5° Byka (parzysty, 1. połowa)
    expect(horaLord(50)).toBe("sun");   // 20° Byka (parzysty, 2. połowa)
  });
});
