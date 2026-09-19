import { describe, it, expect } from "vitest";
import { buildChart, type VedicChart, type ChartPlanet } from "./chart";
import type { PlanetId } from "./constants";
import { wykryteDosze, silaDoszy } from "./doshas";

const chart = buildChart({ date: new Date("1981-04-11T10:45:00Z"), latitude: 50.09, longitude: 18.22, timeKnown: true });

/** Mapa z podmienioną lagną — do testów opartych na domach (jak w yogas.test.ts). */
const zLagna = (s: number): VedicChart => ({ ...chart, angles: { ...chart.angles!, lagnaSign: s } });

/** Mapa z podmienionymi polami wybranych planet — do konstrukcji celowych przypadków testowych. */
function zPlanetami(c: VedicChart, override: Partial<Record<PlanetId, Partial<ChartPlanet>>>): VedicChart {
  const planets = { ...c.planets };
  for (const [id, patch] of Object.entries(override) as [PlanetId, Partial<ChartPlanet>][]) {
    planets[id] = { ...planets[id], ...patch };
  }
  return { ...c, planets };
}

describe("Dosze klasyczne", () => {
  it("każda wykryta dosza ma niepuste uzasadnienie, ryzyko i przynajmniej jedną planetę", () => {
    for (const s of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
      for (const d of wykryteDosze(zLagna(s))) {
        expect(d.uzasadnienie.length).toBeGreaterThan(0);
        expect(d.ryzyko.length).toBeGreaterThan(0);
        expect(d.planety.length).toBeGreaterThan(0);
        expect(silaDoszy(zLagna(s), d)).toBeGreaterThan(0);
        expect(silaDoszy(zLagna(s), d)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("większość dosz liczy się bez znanej lagny (w przeciwieństwie do jog)", () => {
    const bezGodziny: VedicChart = { ...chart, angles: null };
    const dosze = wykryteDosze(bezGodziny);
    // nie powinno wywalić się bez lagny, i domy powinny być puste tam, gdzie ich nie liczymy
    for (const d of dosze) {
      expect(Array.isArray(d.domy)).toBe(true);
    }
  });

  describe("Mangal (Kuja) Dosza", () => {
    it("wykrywana, gdy Mars w 1/4/7/8/12 od lagny, Księżyca lub Wenus", () => {
      let znaleziono = false;
      for (const s of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
        const c = zLagna(s);
        const dom = ((c.planets.mars.sign - c.angles!.lagnaSign + 12) % 12) + 1;
        const mangal = wykryteDosze(c).find((d) => d.kategoria === "mangal");
        if ([1, 4, 7, 8, 12].includes(dom)) {
          expect(mangal).toBeDefined();
          znaleziono = true;
        }
      }
      expect(znaleziono).toBe(true);
    });

    it("zniesiona, gdy Mars we własnym znaku lub w egzaltacji", () => {
      const c = zPlanetami(chart, { mars: { dignity: "władanie" } });
      const mangal = wykryteDosze(c).find((d) => d.kategoria === "mangal");
      if (mangal) {
        expect(mangal.zniesiona).toBe(true);
        expect(mangal.powodZniesienia).toBeTruthy();
        expect(silaDoszy(c, mangal)).toBeLessThan(0.5);
      }
    });
  });

  describe("Kalasarpa Dosza", () => {
    it("wykrywana, gdy wszystkie 7 klasycznych grah jest po jednej stronie Rahu-Ketu", () => {
      const rahuLon = chart.planets.rahu.longitude;
      // ustawiamy wszystkie 7 planet ciasno w łuku 100° zaraz "przed" Rahu (w kierunku do przodu)
      const klasyczne: PlanetId[] = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];
      const override: Partial<Record<PlanetId, Partial<ChartPlanet>>> = {};
      klasyczne.forEach((id, i) => {
        const lon = (rahuLon + 10 + i * 12) % 360;
        override[id] = { longitude: lon, sign: Math.floor(lon / 30) };
      });
      const c = zPlanetami(chart, override);
      const kalasarpa = wykryteDosze(c).find((d) => d.kategoria === "kalasarpa");
      expect(kalasarpa).toBeDefined();
    });

    it("nie jest wykrywana, gdy jedna planeta wypada po drugiej stronie osi", () => {
      const rahuLon = chart.planets.rahu.longitude;
      const klasyczne: PlanetId[] = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];
      const override: Partial<Record<PlanetId, Partial<ChartPlanet>>> = {};
      klasyczne.forEach((id, i) => {
        const lon = (rahuLon + 10 + i * 12) % 360;
        override[id] = { longitude: lon, sign: Math.floor(lon / 30) };
      });
      // jedna planeta (Saturn) po drugiej stronie osi Rahu-Ketu
      override.saturn = { longitude: (rahuLon + 190) % 360, sign: Math.floor(((rahuLon + 190) % 360) / 30) };
      const c = zPlanetami(chart, override);
      const kalasarpa = wykryteDosze(c).find((d) => d.kategoria === "kalasarpa");
      expect(kalasarpa).toBeUndefined();
    });
  });

  describe("Kemadruma Dosza", () => {
    it("zniesiona, gdy Księżyc w kendrze od lagny", () => {
      for (const s of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
        const c = zLagna(s);
        const kemadruma = wykryteDosze(c).find((d) => d.kategoria === "kemadruma");
        if (!kemadruma) continue;
        const domOdLagny = ((c.planets.moon.sign - s + 12) % 12) + 1;
        if ([1, 4, 7, 10].includes(domOdLagny)) {
          expect(kemadruma.zniesiona).toBe(true);
        }
      }
    });
  });

  describe("Guru Czandal jogi", () => {
    it("wykrywana, gdy Jowisz w koniunkcji z Rahu", () => {
      const c = zPlanetami(chart, { jupiter: { sign: chart.planets.rahu.sign } });
      const gc = wykryteDosze(c).find((d) => d.kategoria === "guru-chandal");
      expect(gc).toBeDefined();
      expect(gc!.planety).toContain("rahu");
    });

    it("wykrywana, gdy Jowisz w koniunkcji z Ketu", () => {
      const c = zPlanetami(chart, { jupiter: { sign: chart.planets.ketu.sign } });
      const gc = wykryteDosze(c).find((d) => d.kategoria === "guru-chandal");
      expect(gc).toBeDefined();
      expect(gc!.planety).toContain("ketu");
    });

    it("nie wykrywana, gdy Jowisz nie jest z żadnym węzłem", () => {
      const innySign = (chart.planets.rahu.sign + 1) % 12 === chart.planets.ketu.sign
        ? (chart.planets.rahu.sign + 2) % 12
        : (chart.planets.rahu.sign + 1) % 12;
      const c = zPlanetami(chart, { jupiter: { sign: innySign } });
      const gc = wykryteDosze(c).find((d) => d.kategoria === "guru-chandal");
      expect(gc).toBeUndefined();
    });
  });

  describe("Śrapit Dosza", () => {
    it("wykrywana, gdy Saturn w koniunkcji z Rahu", () => {
      const c = zPlanetami(chart, { saturn: { sign: chart.planets.rahu.sign } });
      const shrapit = wykryteDosze(c).find((d) => d.kategoria === "shrapit");
      expect(shrapit).toBeDefined();
    });

    it("nie wykrywana, gdy Saturn nie jest z Rahu", () => {
      const innySign = (chart.planets.rahu.sign + 1) % 12;
      const c = zPlanetami(chart, { saturn: { sign: innySign } });
      const shrapit = wykryteDosze(c).find((d) => d.kategoria === "shrapit");
      expect(shrapit).toBeUndefined();
    });
  });

  describe("Pitra Dosza", () => {
    it("wykrywana przy koniunkcji Słońce-Rahu, nawet bez znanej lagny", () => {
      const c = zPlanetami({ ...chart, angles: null }, { sun: { sign: chart.planets.rahu.sign } });
      const pitra = wykryteDosze(c).find((d) => d.kategoria === "pitra");
      expect(pitra).toBeDefined();
      expect(silaDoszy(c, pitra!)).toBeLessThan(1);
    });

    it("nie wykrywana, gdy Słońce nie jest z Rahu i nie stoi w 9. domu", () => {
      const rahuInaczej = (chart.planets.sun.sign + 6) % 12; // na pewno nie w koniunkcji ze Słońcem
      // lagna dobrana tak, żeby Słońce wypadło poza 9. dom
      const s = (chart.planets.sun.sign + 3) % 12;
      const c = zPlanetami(zLagna(s), { rahu: { sign: rahuInaczej } });
      const dom9 = ((chart.planets.sun.sign - s + 12) % 12) + 1;
      expect(dom9).not.toBe(9);
      const pitra = wykryteDosze(c).find((d) => d.kategoria === "pitra");
      expect(pitra).toBeUndefined();
    });
  });

  describe("Angarak Dosza", () => {
    it("wykrywana, gdy Mars w koniunkcji z Rahu lub Ketu", () => {
      const c = zPlanetami(chart, { mars: { sign: chart.planets.rahu.sign } });
      const angarak = wykryteDosze(c).find((d) => d.kategoria === "angarak");
      expect(angarak).toBeDefined();
      expect(angarak!.planety).toContain("rahu");
    });
  });

  describe("Grahan Dosza", () => {
    it("wykrywana niezależnie dla Słońca i Księżyca, gdy oba z węzłami naraz", () => {
      const c = zPlanetami(chart, { sun: { sign: chart.planets.rahu.sign }, moon: { sign: chart.planets.ketu.sign } });
      const grahany = wykryteDosze(c).filter((d) => d.kategoria === "grahan");
      expect(grahany.length).toBe(2);
      expect(grahany.some((d) => d.planety.includes("sun"))).toBe(true);
      expect(grahany.some((d) => d.planety.includes("moon"))).toBe(true);
    });
  });

  describe("Wisz jogi", () => {
    it("wykrywana, gdy Księżyc w koniunkcji z Saturnem", () => {
      const c = zPlanetami(chart, { saturn: { sign: chart.planets.moon.sign } });
      const vish = wykryteDosze(c).find((d) => d.kategoria === "vish");
      expect(vish).toBeDefined();
    });

    it("nie wykrywana, gdy Księżyc i Saturn w różnych znakach", () => {
      const innySign = (chart.planets.moon.sign + 1) % 12;
      const c = zPlanetami(chart, { saturn: { sign: innySign } });
      const vish = wykryteDosze(c).find((d) => d.kategoria === "vish");
      expect(vish).toBeUndefined();
    });
  });
});
