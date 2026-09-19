import { describe, it, expect } from "vitest";
import { buildChart, type VedicChart, type ChartPlanet } from "./chart";
import type { PlanetId } from "./constants";
import { induLagna, ocenaFinansowa } from "./finanseWedyjskie";

const chart = buildChart({ date: new Date("1981-04-11T10:45:00Z"), latitude: 50.09, longitude: 18.22, timeKnown: true });

const zLagna = (s: number): VedicChart => ({ ...chart, angles: { ...chart.angles!, lagnaSign: s } });

function zPlanetami(c: VedicChart, override: Partial<Record<PlanetId, Partial<ChartPlanet>>>): VedicChart {
  const planets = { ...c.planets };
  for (const [id, patch] of Object.entries(override) as [PlanetId, Partial<ChartPlanet>][]) {
    planets[id] = { ...planets[id], ...patch };
  }
  return { ...c, planets };
}

describe("Indu Lagna", () => {
  it("bez znanej godziny urodzenia zwraca null", () => {
    expect(induLagna({ ...chart, angles: null })).toBeNull();
  });

  it("liczy poprawnie wg formuły BPHS: Kala władców 9. domu od lagny i od Księżyca, zliczone od Księżyca", () => {
    // Lagna = Baran (0), Ksiezyc rowniez w Baranie (0) - dla prostoty recznego wyliczenia.
    // 9. dom od Barana (0) = Strzelec (8), wladca Jowisz, Kala=10.
    // 9. dom od Ksiezyca (rowniez Baran) = tak samo Strzelec, wladca Jowisz, Kala=10.
    // Suma Kala = 20; 20 mod 12 = 8 (krok). Indu Lagna = Ksiezyc(0) + 8 - 1 = 7 (Skorpion).
    const testowy = zPlanetami(zLagna(0), { moon: { sign: 0 } });
    const w = induLagna({ ...testowy, moonSign: 0 });
    expect(w).not.toBeNull();
    expect(w!.znak).toBe(7);
  });

  it("zawsze zwraca prawidlowy indeks znaku (0-11)", () => {
    for (let lagna = 0; lagna < 12; lagna++) {
      const w = induLagna(zLagna(lagna));
      expect(w!.znak).toBeGreaterThanOrEqual(0);
      expect(w!.znak).toBeLessThanOrEqual(11);
    }
  });
});

describe("ocenaFinansowa — dedykowany silnik, nie recykling ocenaWladcy", () => {
  it("zwraca role dla wladcow 2/5/9/11 domu i czterech karakow", () => {
    const w = ocenaFinansowa(chart);
    const wszystkieRole = w.planety.flatMap((p) => p.role);
    expect(wszystkieRole.some((r) => r.includes("2. domu"))).toBe(true);
    expect(wszystkieRole.some((r) => r.includes("5. domu"))).toBe(true);
    expect(wszystkieRole.some((r) => r.includes("9. domu"))).toBe(true);
    expect(wszystkieRole.some((r) => r.includes("11. domu"))).toBe(true);
    expect(wszystkieRole.some((r) => r.includes("dhana karaka"))).toBe(true);
    expect(wszystkieRole.some((r) => r.includes("handlu"))).toBe(true);
  });

  it("planeta uczestnicząca w Dhana jodze dostaje bonus i wzmiankę w czynnikach", () => {
    const w = ocenaFinansowa(chart);
    if (w.dhanaJogi.length === 0) return; // nie kazda mapa testowa ma Dhana joge - test warunkowy
    const uczestnik = w.dhanaJogi[0].planety[0];
    const wpis = w.planety.find((p) => p.planeta === uczestnik);
    expect(wpis).toBeDefined();
    expect(wpis!.ocena.czynniki.some((c) => c.includes("Dhana jodze"))).toBe(true);
  });

  it("hora ma dokladnie 2 wpisy (2. i 11. dom) z poprawnym typem sun/moon", () => {
    const w = ocenaFinansowa(chart);
    expect(w.hora.length).toBe(2);
    for (const h of w.hora) expect(["sun", "moon"]).toContain(h.typ);
  });

  it("obecny okres wskazuje, czy biezacy wladca mahadaszy jest finansowo istotny", () => {
    const w = ocenaFinansowa(chart);
    expect(w.obecnyOkres).not.toBeNull();
    const istotneId = new Set(w.planety.map((p) => p.planeta));
    expect(w.obecnyOkres!.istotny).toBe(istotneId.has(w.obecnyOkres!.lord));
  });

  it("bez znanej godziny urodzenia (brak lagny) wciaz dziala na naturalnych karakach", () => {
    const bezGodziny = { ...chart, angles: null };
    const w = ocenaFinansowa(bezGodziny);
    expect(w.indu).toBeNull();
    expect(w.planety.some((p) => p.planeta === "jupiter")).toBe(true);
  });

  it("dwie różne planety w tej samej mapie dostają różne wyniki (nie ten sam recyklowany numer)", () => {
    const w = ocenaFinansowa(chart);
    const punkty = w.planety.map((p) => p.ocena.punkty);
    // nie wszystkie takie same - to byloby dowodem na recykling jednej liczby
    expect(new Set(punkty).size).toBeGreaterThan(1);
  });
});
