import { describe, it, expect } from "vitest";
import { buildChart } from "./chart";
import { jogakaraka, karakiCzarowe, atmakaraka } from "./karaki";
import { tonOkresu } from "./lifemap";

const chart = buildChart({ date: new Date("1981-04-11T10:45:00Z"), latitude: 50.09, longitude: 18.22, timeKnown: true });

describe("Karaki", () => {
  it("jogakaraka: stala klasyczna lista", () => {
    expect(jogakaraka(1)).toBe("saturn");  // Byk
    expect(jogakaraka(6)).toBe("saturn");  // Waga
    expect(jogakaraka(3)).toBe("mars");    // Rak
    expect(jogakaraka(4)).toBe("mars");    // Lew
    expect(jogakaraka(9)).toBe("venus");   // Koziorozec
    expect(jogakaraka(10)).toBe("venus");  // Wodnik
    expect(jogakaraka(0)).toBeNull();      // Baran — brak
  });

  it("jogakaraka przebija nature w tonie okresu", () => {
    // lagna Byka -> Saturn jogakaraka; sztuczna mapa z lagna=1
    const c = { ...chart, angles: { ...chart.angles!, lagnaSign: 1 } };
    // Saturn naturalny malefik, ale jako jogakaraka: -1 +1.5 (+godnosc) -> nie "wymagajacy"
    expect(tonOkresu(c, "saturn")).not.toBe("wymagający");
  });

  it("karaki czarowe: 8 rol, malejaco wg stopnia, Rahu liczony wstecz", () => {
    const k = karakiCzarowe(chart);
    expect(k).toHaveLength(8);
    expect(k.map((x) => x.skrot)).toEqual(["AK", "AmK", "BK", "MK", "PiK", "PK", "GK", "DK"]);
    for (let i = 1; i < k.length; i++) {
      expect(k[i].stopien).toBeLessThanOrEqual(k[i - 1].stopien);
    }
    const rahu = k.find((x) => x.planeta === "rahu")!;
    expect(rahu.stopien).toBeCloseTo(30 - chart.planets.rahu.degreeInSign, 6);
    // kazda planeta wystepuje raz
    expect(new Set(k.map((x) => x.planeta)).size).toBe(8);
  });

  it("atmakaraka to rola o najwyzszym stopniu", () => {
    const ak = atmakaraka(chart);
    expect(ak.skrot).toBe("AK");
    const k = karakiCzarowe(chart);
    expect(ak.stopien).toBe(Math.max(...k.map((x) => x.stopien)));
  });
});
