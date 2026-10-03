import { afterEach, describe, expect, it } from "vitest";
import { ayanamsa } from "./ayanamsa";
import { trueLunarNode, planetPosition } from "./ephemeris";
import { ustawDoTestow } from "./ustawienia";
import { diffAngle } from "./math";

// Wzorce ze Swiss Ephemeris (SE_SIDM_LAHIRI / RAMAN / KRISHNAMURTI, SE_TRUE_NODE).
const WZORCE = [
  { utc: "1930-01-16T22:00:00Z", wezel: 38.6398, lahiri: 22.88003, raman: 21.43373, kp: 22.78318 },
  { utc: "1978-09-13T22:00:00Z", wezel: 176.7563, lahiri: 23.55958, raman: 22.11328, kp: 23.46273 },
  { utc: "2029-09-13T19:00:00Z", wezel: 271.0543, lahiri: 24.27201, raman: 22.82571, kp: 24.17516 },
];
const sek = (st: number) => Math.abs(st) * 3600;

afterEach(() => ustawDoTestow(null));

describe("ayanamsy do wyboru", () => {
  it("Raman i KP zgadzają się ze Swiss Ephemeris (do 20″ — tyle co Lahiri)", () => {
    for (const w of WZORCE) {
      const d = new Date(w.utc);
      expect(sek(ayanamsa(d, "raman") - w.raman)).toBeLessThan(20);
      expect(sek(ayanamsa(d, "kp") - w.kp)).toBeLessThan(20);
      expect(sek(ayanamsa(d, "lahiri") - w.lahiri)).toBeLessThan(20);
    }
  });
  it("ustawienie przesuwa pozycje planet o różnicę ayanams", () => {
    const d = new Date(WZORCE[1].utc);
    const lahiri = planetPosition("sun", d).longitude;
    ustawDoTestow({ ayanamsa: "raman", wezel: "sredni" });
    const raman = planetPosition("sun", d).longitude;
    expect(diffAngle(raman, lahiri)).toBeCloseTo(1.446301, 4);
  });
});

describe("węzeł prawdziwy", () => {
  it("zgadza się z oskulacyjnym węzłem Swiss Ephemeris do 30″", () => {
    for (const w of WZORCE) expect(sek(diffAngle(trueLunarNode(new Date(w.utc)), w.wezel))).toBeLessThan(30);
  });
  it("ustawienie przełącza Rahu na węzeł prawdziwy, Ketu zostaje naprzeciw", () => {
    const d = new Date(WZORCE[1].utc);
    const sredni = planetPosition("rahu", d).longitude;
    ustawDoTestow({ ayanamsa: "lahiri", wezel: "prawdziwy" });
    const prawdziwy = planetPosition("rahu", d).longitude;
    expect(Math.abs(diffAngle(prawdziwy, sredni))).toBeGreaterThan(0.01);
    expect(Math.abs(diffAngle(prawdziwy, sredni))).toBeLessThan(2);
    expect(diffAngle(planetPosition("ketu", d).longitude, prawdziwy + 180)).toBeCloseTo(0, 9);
  });
});
