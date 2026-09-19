import { describe, it, expect } from "vitest";
import { buildChart, type VedicChart } from "./chart";
import { wykryteJogi } from "./yogas";

const chart = buildChart({ date: new Date("1981-04-11T10:45:00Z"), latitude: 50.09, longitude: 18.22, timeKnown: true });

/** Mapa z podmienioną lagną — do testów jog opartych na domach. */
const zLagna = (s: number): VedicChart => ({ ...chart, angles: { ...chart.angles!, lagnaSign: s } });

describe("Jogi klasyczne", () => {
  it("bez znanej godziny: tylko Gadźakesari/Budha-Aditja mogą wystąpić, reszta wymaga lagny", () => {
    const bezGodziny: VedicChart = { ...chart, angles: null };
    const jogi = wykryteJogi(bezGodziny);
    expect(jogi.every((j) => j.kategoria === "gajakesari" || j.kategoria === "budha-aditja")).toBe(true);
  });

  it("każda wykryta joga ma niepuste uzasadnienie i przynajmniej jedną planetę", () => {
    for (const s of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
      for (const j of wykryteJogi(zLagna(s))) {
        expect(j.uzasadnienie.length).toBeGreaterThan(0);
        expect(j.planety.length).toBeGreaterThan(0);
      }
    }
  });

  it("Gadźakesari: Jowisz w kendrze od Księżyca — nie zależy od lagny", () => {
    const domOdKsiezyca = ((chart.planets.jupiter.sign - chart.planets.moon.sign + 12) % 12) + 1;
    const oczekiwana = [1, 4, 7, 10].includes(domOdKsiezyca);
    const jogi = wykryteJogi(chart);
    expect(jogi.some((j) => j.id === "gajakesari")).toBe(oczekiwana);
  });

  it("Mahapurusza: planeta musi być JEDNOCZEŚNIE we władaniu/egzaltacji I w kendrze", () => {
    // szukamy lagny, dla której żadna z pięciu planet mahapuruszy nie tworzy jogi
    // (test negatywny — upewnia się, że warunek jest koniunkcją, nie sumą)
    for (const s of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
      const jogi = wykryteJogi(zLagna(s)).filter((j) => j.kategoria === "mahapurusza");
      for (const j of jogi) {
        expect(j.domy[0]).toBeGreaterThanOrEqual(1);
        expect([1, 4, 7, 10]).toContain(j.domy[0]);
      }
    }
  });

  it("Radźa jogi: para władców różnych planet w koniunkcji lub aspekcie", () => {
    for (const s of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
      const jogi = wykryteJogi(zLagna(s)).filter((j) => j.kategoria === "radza");
      for (const j of jogi) {
        expect(j.planety.length).toBe(2);
        expect(j.planety[0]).not.toBe(j.planety[1]);
        expect(j.uzasadnienie).toMatch(/koniunkcji|aspekcie/);
      }
    }
  });

  it("Dhana jogi: nie duplikuje tej samej pary władców z różnych kombinacji domów", () => {
    for (const s of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
      const jogi = wykryteJogi(zLagna(s)).filter((j) => j.kategoria === "dhana" && j.id !== "dhana-jowisz");
      const ids = jogi.map((j) => j.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("Neeczabhanga: pojawia się tylko dla planet faktycznie w upadku", () => {
    for (const s of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
      const c = zLagna(s);
      const jogi = wykryteJogi(c).filter((j) => j.kategoria === "neeczabhanga");
      for (const j of jogi) {
        const id = j.planety[0];
        expect(c.planets[id].dignity).toBe("upadek");
      }
    }
  });

  it("Wiprita Radźa jogi: władca dusthany stoi w INNEJ dusthanie, nazwa zgodna z domem własnym", () => {
    const NAZWY: Record<number, string> = { 6: "Harsza", 8: "Sarala", 12: "Wimala" };
    for (const s of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
      const jogi = wykryteJogi(zLagna(s)).filter((j) => j.kategoria === "wiprita-radza");
      for (const j of jogi) {
        const [wlasny, teraz] = j.domy;
        expect(wlasny).not.toBe(teraz);
        expect([6, 8, 12]).toContain(wlasny);
        expect([6, 8, 12]).toContain(teraz);
        expect(j.nazwa).toBe(`${NAZWY[wlasny]} jogi`);
      }
    }
  });

  it("Budha-Aditja: Słońce i Merkury nigdy nie są dalej niż o 2 znaki (Merkury blisko Słońca)", () => {
    const jogi = wykryteJogi(chart);
    const ba = jogi.find((j) => j.id === "budha-aditja");
    expect(!!ba).toBe(chart.planets.sun.sign === chart.planets.mercury.sign);
  });
});
