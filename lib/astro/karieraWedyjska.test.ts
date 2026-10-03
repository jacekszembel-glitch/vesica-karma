import { describe, expect, it } from "vitest";
import { buildChart } from "./chart";
import { ocenaKariery } from "./karieraWedyjska";
import { ROZKLADY_KARIERY } from "./srednieKariery";
import { procentNizej } from "./srednieBilansu";
import { RASIS } from "./constants";

const chart = buildChart({ date: new Date("1981-04-11T10:45:00Z"), latitude: 50.09, longitude: 18.22, timeKnown: true });

let ziarno = 31337;
const los = () => (ziarno = (ziarno * 16807) % 2147483647) / 2147483647;
const mapy = Array.from({ length: 1500 }, () => buildChart({
  date: new Date(Date.UTC(1930, 0, 1) + los() * (Date.UTC(2024, 11, 31) - Date.UTC(1930, 0, 1))),
  latitude: -55 + los() * 120, longitude: -180 + los() * 360, timeKnown: true,
}));

describe("Zawód i kariera", () => {
  it("bez godziny urodzenia zwraca null", () => {
    expect(ocenaKariery({ ...chart, angles: null })).toBeNull();
  });

  it("władca 10. domu od lagny jest zawsze w zestawieniu, wagi sumują się na bilans", () => {
    for (const c of mapy.slice(0, 300)) {
      const w = ocenaKariery(c)!;
      const wladca10 = RASIS[(c.angles!.lagnaSign + 9) % 12].lord;
      expect(w.some((x) => x.id === wladca10)).toBe(true);
      for (const x of w) {
        expect(x.zwiazek).toBeGreaterThanOrEqual(1);
        expect(x.ocena.wagi).toHaveLength(x.ocena.czynniki.length);
        expect(x.ocena.wagi.reduce((a, b) => a + b, 0)).toBeCloseTo(x.ocena.punkty, 1);
      }
    }
  });

  it("żadna planeta nie dominuje z założenia (błąd pierwszej wersji: zawsze Saturn/Słońce)", () => {
    const top: Record<string, number> = {};
    for (const c of mapy) { const id = ocenaKariery(c)![0].id; top[id] = (top[id] ?? 0) + 1; }
    for (const n of Object.values(top)) expect(n / mapy.length).toBeLessThan(0.3);
  });

  it("rozkłady zgadzają się z niezależną próbą (średni percentyl blisko 50%)", () => {
    const suma: Record<string, [number, number]> = {};
    for (const c of mapy) for (const w of ocenaKariery(c)!) {
      const s = (suma[w.id] ??= [0, 0]);
      s[0] += procentNizej(w.ocena.punkty, ROZKLADY_KARIERY[w.id]); s[1]++;
    }
    for (const [, [s, n]] of Object.entries(suma)) if (n > 200) expect(Math.abs(s / n - 50)).toBeLessThan(6);
  }, 120000);
});
