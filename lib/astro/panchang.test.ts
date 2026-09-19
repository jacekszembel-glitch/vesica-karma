import { describe, expect, it } from "vitest";
import { panchang, personalDay } from "./panchang";

describe("panczanga", () => {
  it("pełnia: 13.07.2022 (superksiężyc, maks. 18:37 UTC) → tithi Purnima tuż przed", () => {
    const p = panchang(new Date("2022-07-13T15:00:00Z"));
    expect(p.tithi.name).toContain("Purnima");
  });
  it("nów: 20.04.2023 (zaćmienie hybrydowe) → Amawasja", () => {
    const p = panchang(new Date("2023-04-20T04:00:00Z"));
    expect(p.tithi.name).toContain("Amawasja");
  });
  it("vara zgodna z lokalnym dniem tygodnia", () => {
    const d = new Date("2026-08-03T12:00:00Z"); // poniedziałek (także lokalnie w PL)
    const p = panchang(d);
    const expected = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"][d.getDay()];
    expect(p.vara.pl).toBe(expected);
  });
  it("tithi w zakresie 1-30, karana i joga zdefiniowane", () => {
    for (const iso of ["2026-01-05", "2026-04-18", "2026-08-07", "2026-11-30"]) {
      const p = panchang(new Date(`${iso}T10:00:00Z`));
      expect(p.tithi.num).toBeGreaterThanOrEqual(1);
      expect(p.tithi.num).toBeLessThanOrEqual(30);
      expect(p.yoga.name.length).toBeGreaterThan(2);
      expect(p.karana.name.length).toBeGreaterThan(2);
    }
  });
});

describe("dzień osobisty", () => {
  const day = panchang(new Date("2026-08-07T10:00:00Z"));
  it("tarabala: ta sama nakszatra = Dźanma", () => {
    const birthMoon = day.moonNakshatra.nakshatra.index * (360 / 27) + 5;
    const pd = personalDay(birthMoon, day);
    expect(pd.tara.name).toBe("Dźanma");
  });
  it("tarabala: następna nakszatra = Sampat (pomyślna)", () => {
    const birthMoon = ((day.moonNakshatra.nakshatra.index - 1 + 27) % 27) * (360 / 27) + 5;
    const pd = personalDay(birthMoon, day);
    expect(pd.tara.name).toBe("Sampat");
    expect(pd.tara.good).toBe(true);
  });
  it("score w zakresie 5-95", () => {
    for (let lon = 0; lon < 360; lon += 30) {
      const pd = personalDay(lon, day);
      expect(pd.score).toBeGreaterThanOrEqual(5);
      expect(pd.score).toBeLessThanOrEqual(95);
      expect(pd.chandra.house).toBeGreaterThanOrEqual(1);
      expect(pd.chandra.house).toBeLessThanOrEqual(12);
    }
  });
});
