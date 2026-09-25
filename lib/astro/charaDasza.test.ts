import { describe, it, expect } from "vitest";
import { buildChart } from "./chart";
import { charaDasza, charaAntardaszy, dlugoscZnakuCharaDaszy, rashiDrishti, okupanciZnaku } from "./charaDasza";

const chart = buildChart({ date: new Date("1981-04-11T10:45:00Z"), latitude: 50.09, longitude: 18.22, timeKnown: true });

describe("Chara Dasza", () => {
  it("12 mahadaszy, po jednej na kazdy znak, bez powtorzen", () => {
    const cd = charaDasza(chart)!;
    expect(cd.mahadaszy).toHaveLength(12);
    expect(new Set(cd.mahadaszy.map((m) => m.sign)).size).toBe(12);
  });

  it("pierwsza mahadasza zaczyna sie w znaku Lagny", () => {
    const cd = charaDasza(chart)!;
    expect(cd.mahadaszy[0].sign).toBe(chart.angles!.lagnaSign);
  });

  it("kierunek sekwencji zgodny z parzystoscia Lagny (nieparzysty -> zgodnie z zodiakiem)", () => {
    const cd = charaDasza(chart)!;
    const lagna = chart.angles!.lagnaSign;
    const naprzod = lagna % 2 === 0;
    const oczekiwanyDrugi = naprzod ? (lagna + 1) % 12 : (lagna - 1 + 12) % 12;
    expect(cd.mahadaszy[1].sign).toBe(oczekiwanyDrugi);
  });

  it("dlugosc kazdej mahadaszy miesci sie w 1-12 lat", () => {
    const cd = charaDasza(chart)!;
    for (const m of cd.mahadaszy) {
      expect(m.lata).toBeGreaterThanOrEqual(1);
      expect(m.lata).toBeLessThanOrEqual(12);
    }
  });

  it("okresy nastepuja bezposrednio po sobie (koniec = poczatek kolejnego)", () => {
    const cd = charaDasza(chart)!;
    for (let i = 1; i < cd.mahadaszy.length; i++) {
      expect(cd.mahadaszy[i].start.getTime()).toBe(cd.mahadaszy[i - 1].end.getTime());
    }
  });

  it("wladca we wlasnym znaku daje 12 lat (Baran, wladca Mars, sztucznie ustawiony w Baranie)", () => {
    const c = { ...chart, planets: { ...chart.planets, mars: { ...chart.planets.mars, sign: 0 } } };
    expect(dlugoscZnakuCharaDaszy(c, 0)).toBe(12);
  });

  it("antardaszy: 12 rownych podokresow sumujacych sie dokladnie do mahadaszy", () => {
    const cd = charaDasza(chart)!;
    const maha = cd.mahadaszy[0];
    const ad = charaAntardaszy(maha);
    expect(ad).toHaveLength(12);
    expect(ad[0].sign).toBe(maha.sign);
    expect(ad[0].start.getTime()).toBe(maha.start.getTime());
    expect(ad[11].end.getTime()).toBe(maha.end.getTime());
    const sumaMs = ad.reduce((acc, a) => acc + (a.end.getTime() - a.start.getTime()), 0);
    expect(sumaMs).toBe(maha.end.getTime() - maha.start.getTime());
  });

  it("okupanci znaku: znajduje planety stojace w danym znaku D1", () => {
    const c = { ...chart, planets: { ...chart.planets, mars: { ...chart.planets.mars, sign: 0 }, venus: { ...chart.planets.venus, sign: 0 } } };
    expect(okupanciZnaku(c, 0)).toEqual(expect.arrayContaining(["mars", "venus"]));
    expect(okupanciZnaku(c, 0)).toHaveLength(2);
  });

  it("rashi drishti: Baran (ruchomy) aspektuje stale oprocz sasiedniego Byka", () => {
    const aspekty = rashiDrishti(0); // Baran
    expect(aspekty.sort((a, b) => a - b)).toEqual([4, 7, 10]); // Lew, Skorpion, Wodnik — bez Byka(1)
  });

  it("rashi drishti: Byk (staly) aspektuje ruchome oprocz sasiedniego Barana", () => {
    const aspekty = rashiDrishti(1); // Byk
    expect(aspekty.sort((a, b) => a - b)).toEqual([3, 6, 9]); // Rak, Waga, Koziorozec — bez Barana(0)
  });

  it("rashi drishti: znaki podwojne aspektuja pozostale trzy podwojne", () => {
    const aspekty = rashiDrishti(2); // Bliźnięta
    expect(aspekty.sort((a, b) => a - b)).toEqual([5, 8, 11]);
  });

  it("rashi drishti jest symetryczne (jesli A aspektuje B, to B aspektuje A)", () => {
    for (let a = 0; a < 12; a++) {
      for (const b of rashiDrishti(a)) {
        expect(rashiDrishti(b)).toContain(a);
      }
    }
  });
});
