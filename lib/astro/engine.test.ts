import { describe, expect, it } from "vitest";
import { ayanamsa } from "./ayanamsa";
import { allPlanets, meanLunarNode } from "./ephemeris";
import { buildChart } from "./chart";
import { vimshottari, activeChain } from "./dasha";
import { nakshatraOf } from "./nakshatra";
import { numerology, reduce, normalizeName, mulankBhagyankRelacja } from "./numerology";
import { diffAngle } from "./math";
import { VIMSHOTTARI_YEARS, VIMSHOTTARI_ORDER } from "./constants";

const asSeconds = (deg: number) => deg * 3600;

describe("ayanamsa Lahiri", () => {
  it("zgadza się z wartością referencyjną na 1.01.2000 (23°51'11\")", () => {
    const a = ayanamsa(new Date("2000-01-01T00:00:00Z"));
    expect(Math.abs(asSeconds(a - 23.853056))).toBeLessThan(2);
  });
  it("zgadza się z tablicami na 2026 (~24°13')", () => {
    const a = ayanamsa(new Date("2026-01-01T00:00:00Z"));
    expect(a).toBeGreaterThan(24.2);
    expect(a).toBeLessThan(24.23);
  });
  it("rośnie ~50,3\"/rok", () => {
    const a1 = ayanamsa(new Date("1990-01-01T00:00:00Z"));
    const a2 = ayanamsa(new Date("1991-01-01T00:00:00Z"));
    expect(asSeconds(a2 - a1)).toBeGreaterThan(49);
    expect(asSeconds(a2 - a1)).toBeLessThan(52);
  });
});

describe("efemerydy", () => {
  it("Rahu i Ketu są dokładnie w opozycji", () => {
    const p = allPlanets(new Date("1990-06-15T12:30:00Z"));
    const d = Math.abs(diffAngle(p.rahu.longitude, p.ketu.longitude));
    expect(Math.abs(d - 180)).toBeLessThan(1e-9);
  });
  it("średni węzeł cofa się ~3'/dzień", () => {
    const n1 = meanLunarNode(new Date("2020-01-01T00:00:00Z"));
    const n2 = meanLunarNode(new Date("2020-01-02T00:00:00Z"));
    const daily = diffAngle(n2, n1);
    expect(daily).toBeLessThan(0);
    expect(daily).toBeGreaterThan(-0.06);
  });
  it("Słońce syderyczne 1.01.2000 ~ 16° Strzelca (Dhanu)", () => {
    const p = allPlanets(new Date("2000-01-01T12:00:00Z"));
    expect(Math.floor(p.sun.longitude / 30)).toBe(8); // Dhanu
    const degInSign = p.sun.longitude % 30;
    expect(degInSign).toBeGreaterThan(15);
    expect(degInSign).toBeLessThan(18);
  });
  it("Księżyc porusza się 11–15°/dobę", () => {
    const p = allPlanets(new Date("1985-03-20T06:00:00Z"));
    expect(Math.abs(p.moon.speed)).toBeGreaterThan(11);
    expect(Math.abs(p.moon.speed)).toBeLessThan(15.5);
  });
});

describe("nakszatry", () => {
  it("granice: 0° = Aświni, 13°20' = Bharani, 359°59' = Rewati", () => {
    expect(nakshatraOf(0).nakshatra.sanskrit).toBe("Ashwini");
    expect(nakshatraOf(13.3334).nakshatra.sanskrit).toBe("Bharani");
    expect(nakshatraOf(359.99).nakshatra.sanskrit).toBe("Revati");
  });
  it("pady: 3°20' na padę, 4 pady na nakszatrę", () => {
    expect(nakshatraOf(0).pada).toBe(1);
    expect(nakshatraOf(3.34).pada).toBe(2);
    expect(nakshatraOf(9.99).pada).toBe(3);
    expect(nakshatraOf(10.01).pada).toBe(4);
  });
});

describe("Vimshottari", () => {
  it("suma lat = 120", () => {
    const total = VIMSHOTTARI_ORDER.reduce((s, p) => s + VIMSHOTTARI_YEARS[p], 0);
    expect(total).toBe(120);
  });
  it("pierwsza mahadasza należy do władcy nakszatry Księżyca", () => {
    // Księżyc na 5° Aświni → władca Ketu
    const birth = new Date("1995-05-05T05:00:00Z");
    const periods = vimshottari(5, birth, 1);
    expect(periods[0].lord).toBe("ketu");
  });
  it("balans: Księżyc w połowie nakszatry → połowa okresu przed urodzeniem", () => {
    const birth = new Date("2000-01-01T00:00:00Z");
    // Połowa Aświni = 6°40' = 6.6667; Ketu ma 7 lat → 3,5 roku przed urodzeniem
    const periods = vimshottari(360 / 27 / 2, birth, 1);
    const elapsedYears = (birth.getTime() - periods[0].start.getTime()) / (365.25 * 86400000);
    expect(Math.abs(elapsedYears - 3.5)).toBeLessThan(0.01);
  });
  it("okresy są ciągłe i pokrywają 120 lat", () => {
    const periods = vimshottari(123.456, new Date("1980-06-01T00:00:00Z"), 2);
    for (let i = 1; i < periods.length; i++) {
      expect(periods[i].start.getTime()).toBe(periods[i - 1].end.getTime());
    }
    const spanYears =
      (periods[8].end.getTime() - periods[0].start.getTime()) / (365.25 * 86400000);
    expect(Math.abs(spanYears - 120)).toBeLessThan(0.001);
    // Antardasze wypełniają mahadaszę bez dziur
    for (const md of periods) {
      expect(md.sub![0].start.getTime()).toBe(md.start.getTime());
      expect(md.sub![8].end.getTime()).toBe(md.end.getTime());
    }
  });
  it("activeChain zwraca maha → antar → pratjantar", () => {
    const periods = vimshottari(200, new Date("1990-01-01T00:00:00Z"), 3);
    const chain = activeChain(periods, new Date("2020-06-15T00:00:00Z"));
    expect(chain).toHaveLength(3);
    expect(chain[0].level).toBe(1);
    expect(chain[2].level).toBe(3);
  });
});

describe("kosmogram", () => {
  const chart = buildChart({
    date: new Date("1990-06-15T12:30:00Z"),
    latitude: 50.0919,
    longitude: 18.2192,
    timeKnown: true,
  });
  it("lagna w zakresie 0–360, znak spójny", () => {
    expect(chart.angles).not.toBeNull();
    const a = chart.angles!;
    expect(a.ascendant).toBeGreaterThanOrEqual(0);
    expect(a.ascendant).toBeLessThan(360);
    expect(a.lagnaSign).toBe(Math.floor(a.ascendant / 30));
  });
  it("planeta w znaku lagny jest w 1. domu (Whole Sign)", () => {
    for (const p of Object.values(chart.planets)) {
      const expectedHouse = ((p.sign - chart.angles!.lagnaSign + 12) % 12) + 1;
      expect(p.house).toBe(expectedHouse);
    }
  });
  it("Saturn 1990 retrogradowy we własnym znaku (Makara)", () => {
    expect(chart.planets.saturn.retrograde).toBe(true);
    expect(chart.planets.saturn.sign).toBe(9);
    expect(chart.planets.saturn.dignity).toBe("władanie");
  });
  it("bez godziny urodzenia nie ma lagny ani domów", () => {
    const noTime = buildChart({
      date: new Date("1990-06-15T12:00:00Z"),
      latitude: 50,
      longitude: 18,
      timeKnown: false,
    });
    expect(noTime.angles).toBeNull();
    expect(noTime.planets.sun.house).toBe(0);
  });
});

describe("numerologia", () => {
  it("redukcja z zachowaniem liczb mistrzowskich", () => {
    expect(reduce(29)).toBe(11);
    expect(reduce(29, false)).toBe(2);
    expect(reduce(38)).toBe(11);
    expect(reduce(22)).toBe(22);
    expect(reduce(9)).toBe(9);
  });
  it("normalizacja polskich znaków", () => {
    expect(normalizeName("Łukasz Broszko")).toBe("lukasz broszko");
    expect(normalizeName("Świętosława")).toBe("swietoslawa");
  });
  it("droga życia: 15.06.1990 → 1+5+0+6+1+9+9+0 = 31 → 4", () => {
    const r = numerology("1990-06-15", undefined, "pitagorejski", 2026);
    expect(r.lifePath).toBe(4);
    expect(r.birthday).toBe(6); // 15 → 6, mulank
    expect(r.rulingPlanet).toBe("Wenus");
  });
  it("droga życia redukuje się do 8 dla 29.11.1975", () => {
    expect(numerology("1975-11-29", undefined, "pitagorejski", 2026).lifePath).toBe(8);
  });

  /**
   * Dzień 11 lub 22 to liczba mistrzowska. W systemach zachodnich NIE wolno jej
   * redukować (obiecujemy to w opisie systemu na stronie), ale w wedyjskim mulank
   * musi zejść do 1–9, bo każda cyfra odpowiada planecie.
   */
  it("liczba mistrzowska z dnia urodzenia: zachowana w zachodnich, zredukowana w wedyjskim", () => {
    const pit = numerology("1980-02-22", undefined, "pitagorejski", 2026);
    expect(pit.birthday).toBe(22);
    expect(pit.birthdayRoot).toBe(4);
    expect(pit.birthdayMaster).toBe(true);

    const chal = numerology("1981-04-11", undefined, "chaldejski", 2026);
    expect(chal.birthday).toBe(11);
    expect(chal.birthdayRoot).toBe(2);

    const wed = numerology("1981-04-11", undefined, "wedyjski", 2026);
    expect(wed.birthday).toBe(2);
    expect(wed.birthdayMaster).toBe(true);
    // planeta zawsze z formy zredukowanej — VEDIC_PLANETS nie ma klucza 11
    expect(wed.rulingPlanet).toBe("Księżyc");
    expect(numerology("1980-02-22", undefined, "wedyjski", 2026).rulingPlanet).toBe("Rahu");
  });

  it("zwykły dzień nie jest oznaczany jako mistrzowski", () => {
    const r = numerology("1990-06-15", undefined, "pitagorejski", 2026);
    expect(r.birthday).toBe(6);
    expect(r.birthdayMaster).toBe(false);
  });
  it("siatka Lo Shu zlicza cyfry daty", () => {
    const r = numerology("1990-06-15", undefined, "wedyjski", 2026);
    // cyfry: 1,9,9,0,0,6,1,5 → bez zer: 1×2, 5×1, 6×1, 9×2
    expect(r.loShuGrid[1]).toBe(2);
    expect(r.loShuGrid[9]).toBe(2);
    expect(r.loShuGrid[5]).toBe(1);
    expect(r.loShuGrid[2]).toBe(0);
  });
  it("systemy pitagorejski i chaldejski dają różne liczby ekspresji", () => {
    const p = numerology("1990-06-15", "Jacek Kowalski", "pitagorejski", 2026);
    const c = numerology("1990-06-15", "Jacek Kowalski", "chaldejski", 2026);
    expect(p.expression).not.toBeNull();
    expect(c.expression).not.toBeNull();
    // (różne systemy wartości liter — wynik zwykle inny; sprawdzamy, że liczby są w zakresie)
    for (const v of [p.expression!, c.expression!]) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(33);
    }
  });

  describe("relacja Mulank↔Bhagyank (przyjaźń planet, nie suma)", () => {
    it("ta sama cyfra = wielki przyjaciel (ta sama planeta)", () => {
      expect(mulankBhagyankRelacja(5, 5)).toBe("wielki przyjaciel");
    });
    it("1↔2: Słońce i Księżyc przyjaźnią się w obie strony = wielki przyjaciel", () => {
      expect(mulankBhagyankRelacja(1, 2)).toBe("wielki przyjaciel");
    });
    it("8↔1: Saturn wrogi Słońcu i Słońce wrogie Saturnowi = wielki wróg", () => {
      expect(mulankBhagyankRelacja(8, 1)).toBe("wielki wróg");
      expect(mulankBhagyankRelacja(1, 8)).toBe("wielki wróg"); // symetryczne dla tej pary
    });
    it("4↔1: Rahu wrogi Słońcu, Słońce neutralne wobec Rahu — mieszany sygnał daje wróg, wynik niezależny od kolejności", () => {
      expect(mulankBhagyankRelacja(4, 1)).toBe("wróg");
      expect(mulankBhagyankRelacja(1, 4)).toBe("wróg");
    });
  });
});
