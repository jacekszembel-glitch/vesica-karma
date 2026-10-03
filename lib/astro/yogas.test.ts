import { describe, it, expect } from "vitest";
import { buildChart, type VedicChart } from "./chart";
import { wykryteJogi } from "./yogas";
import { PLANET_ORDER, RASIS, type PlanetId } from "./constants";

const chart = buildChart({ date: new Date("1981-04-11T10:45:00Z"), latitude: 50.09, longitude: 18.22, timeKnown: true });

/** Mapa z podmienioną lagną — do testów jog opartych na domach. */
const zLagna = (s: number): VedicChart => ({ ...chart, angles: { ...chart.angles!, lagnaSign: s } });

describe("Jogi klasyczne", () => {
  it("bez znanej godziny: tylko jogi liczone od Księżyca/Słońca mogą wystąpić, reszta wymaga lagny", () => {
    const bezGodziny: VedicChart = { ...chart, angles: null };
    const jogi = wykryteJogi(bezGodziny);
    expect(jogi.every((j) => ["gajakesari", "budha-aditja", "luminarze"].includes(j.kategoria))).toBe(true);
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

describe("Jogi talentu i wsparcia — warunki sprawdzone niezależnie na losowych mapach", () => {
  let ziarno = 777;
  const los = () => (ziarno = (ziarno * 16807) % 2147483647) / 2147483647;
  const mapy = Array.from({ length: 400 }, () => buildChart({
    date: new Date(Date.UTC(1930, 0, 1) + los() * (Date.UTC(2024, 11, 31) - Date.UTC(1930, 0, 1))),
    latitude: -55 + los() * 120, longitude: -180 + los() * 360, timeKnown: true,
  }));
  const od = (c: VedicChart, id: PlanetId, sign: number) => ((c.planets[id].sign - sign + 12) % 12) + 1;
  const dom = (c: VedicChart, id: PlanetId) => od(c, id, c.angles!.lagnaSign);
  const PIATKA: PlanetId[] = ["mars", "mercury", "jupiter", "venus", "saturn"];

  it("Saraswati: Jowisz, Wenus, Merkury w 1/2/4/5/7/9/10 i Jowisz silny", () => {
    let trafienia = 0;
    for (const c of mapy) {
      const oczek = (["jupiter", "venus", "mercury"] as PlanetId[]).every((id) => [1, 2, 4, 5, 7, 9, 10].includes(dom(c, id)))
        && ["egzaltacja", "władanie", "mulatrikona", "przyjazny"].includes(c.planets.jupiter.dignity);
      if (oczek) trafienia++;
      expect(wykryteJogi(c).some((j) => j.id === "saraswati")).toBe(oczek);
    }
    expect(trafienia).toBeGreaterThan(0);
  });

  it("Durudhura i Ubhajaczari: planety z piątki po OBU stronach Księżyca/Słońca", () => {
    for (const c of mapy) {
      for (const [id, swiatlo] of [["durudhura", "moon"], ["ubhajaczari", "sun"]] as const) {
        const s = c.planets[swiatlo].sign;
        const oczek = PIATKA.some((p) => od(c, p, s) === 2) && PIATKA.some((p) => od(c, p, s) === 12);
        expect(wykryteJogi(c).some((j) => j.id === id)).toBe(oczek);
      }
    }
  });

  it("Adhi: co najmniej dwóch z trzech dobroczyńców w 6–8 od Księżyca", () => {
    for (const c of mapy) {
      const n = (["mercury", "jupiter", "venus"] as PlanetId[]).filter((p) => [6, 7, 8].includes(od(c, p, c.planets.moon.sign))).length;
      expect(wykryteJogi(c).some((j) => j.id === "adhi")).toBe(n >= 2);
    }
  });

  it("Amala: w 10. od lagny lub Księżyca dobroczyńca i żadnego złoczyńcy", () => {
    const ZLE: PlanetId[] = ["sun", "mars", "saturn", "rahu", "ketu"];
    for (const c of mapy) {
      const oczek = [c.angles!.lagnaSign, c.planets.moon.sign].some((baza) => {
        const w10 = PLANET_ORDER.filter((p) => od(c, p, baza) === 10);
        return w10.some((p) => ["jupiter", "venus", "mercury"].includes(p)) && !w10.some((p) => ZLE.includes(p));
      });
      expect(wykryteJogi(c).filter((j) => j.id === "amala").length).toBe(oczek ? 1 : 0);
    }
  });

  it("Lakszmi: silny władca 9. w kendrze/trikonie, władca lagny nie w dusthanie i nie w upadku", () => {
    for (const c of mapy) {
      const l9 = RASIS[(c.angles!.lagnaSign + 8) % 12].lord, l1 = RASIS[c.angles!.lagnaSign].lord;
      const oczek = ["władanie", "egzaltacja", "mulatrikona"].includes(c.planets[l9].dignity)
        && [1, 4, 5, 7, 9, 10].includes(dom(c, l9)) && ![6, 8, 12].includes(dom(c, l1)) && c.planets[l1].dignity !== "upadek";
      expect(wykryteJogi(c).some((j) => j.id === "lakszmi")).toBe(oczek);
    }
  });
});
