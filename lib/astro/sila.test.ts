import { describe, it, expect } from "vitest";
import { buildChart, type VedicChart } from "./chart";
import { ocenaWladcy } from "./sila";
import { wykryteJogiPosortowane } from "./yogas";
import { PLANET_ORDER } from "./constants";

const chart = buildChart({ date: new Date("1981-04-11T10:45:00Z"), latitude: 50.09, longitude: 18.22, timeKnown: true });

/** Mapa z podmienioną lagną — do testów władztwa funkcyjnego. */
const zLagna = (s: number): VedicChart => ({ ...chart, angles: { ...chart.angles!, lagnaSign: s } });

describe("Ocena władcy okresu (siła pełna)", () => {
  it("każda planeta ma ton i niepustą listę czynników", () => {
    for (const id of PLANET_ORDER) {
      const o = ocenaWladcy(chart, id);
      expect(["wspierający", "wymagający", "mieszany"]).toContain(o.ton);
      expect(o.czynniki.length).toBeGreaterThan(0);
    }
  });

  it("jogakaraka przebija naturę: Saturn dla lagny Byka nie jest wymagający", () => {
    const o = ocenaWladcy(zLagna(1), "saturn");
    expect(o.czynniki.some((c) => c.includes("jogakaraka"))).toBe(true);
    expect(o.ton).not.toBe("wymagający");
  });

  it("władca trikony dostaje premię z uzasadnieniem", () => {
    // lagna Barana (0): Jowisz włada Strzelcem (9. dom) i Rybami (12.)
    const o = ocenaWladcy(zLagna(0), "jupiter");
    expect(o.czynniki.some((c) => c.includes("trikony"))).toBe(true);
  });

  it("władztwo 3/6/11 obciąża", () => {
    // lagna Barana: Saturn włada Koziorożcem (10.) i Wodnikiem (11.)
    const o = ocenaWladcy(zLagna(0), "saturn");
    expect(o.czynniki.some((c) => c.includes("11."))).toBe(true);
  });

  it("kendradhipati: Merkury dla lagny Strzelca (włada 7. i 10.)", () => {
    // Strzelec (8): Bliźnięta = 7. dom, Panna = 10. dom — same kendry
    const o = ocenaWladcy(zLagna(8), "mercury");
    expect(o.czynniki.some((c) => c.includes("kendradhipati"))).toBe(true);
  });

  it("bez mapy działa na samej naturze (skrót dla stron bez godziny)", () => {
    const o = ocenaWladcy(null, "jupiter");
    expect(o.ton).toBe("wspierający");
    expect(o.czynniki).toContain("naturalny dobroczyńca");
  });

  it("spalenie i nawamsza są w uzasadnieniu, gdy występują", () => {
    // Mars w mapie Jacka jest spalony
    const o = ocenaWladcy(chart, "mars");
    expect(o.czynniki.some((c) => c.includes("spalona"))).toBe(true);
  });
});

describe("Niuanse pełnej oceny", () => {
  it("Ksiezyc: faza przy urodzeniu zmienia nature", () => {
    const o = ocenaWladcy(chart, "moon");
    expect(o.czynniki.some((c) => c.startsWith("Księżyc"))).toBe(true);
  });

  it("neecha bhanga: Merkury w upadku moze byc zniesiony albo nie — ale czynnik zawsze nazywa stan", () => {
    const o = ocenaWladcy(chart, "mercury");
    expect(o.czynniki.some((c) => c.includes("upad") || c.includes("neecha"))).toBe(true);
  });

  it("wezly: dyspozytor i upaczaja w uzasadnieniu", () => {
    const o = ocenaWladcy(chart, "rahu");
    expect(o.czynniki.some((c) => c.includes("władc") || c.includes("upaczaja"))).toBe(true);
  });

  it("luminarze zwolnieni ze skazy 8. domu", () => {
    // lagna Koziorozca (9): Lew = 8. dom, wladca Slonce
    const c = { ...chart, angles: { ...chart.angles!, lagnaSign: 9 } };
    const o = ocenaWladcy(c, "sun");
    expect(o.czynniki.some((x) => x.includes("8. domu"))).toBe(false);
  });

  it("aspekty: pelny aspekt Saturna widoczny w uzasadnieniu celu", () => {
    // Saturn w Pannie (5); aspekt 3/7/10 -> Skorpion(7), Ryby(11), Blizneta(2)
    // Mars i Wenus sa w Rybach -> aspekt Saturna
    const o = ocenaWladcy(chart, "venus");
    expect(o.czynniki.some((c) => c.includes("aspekt Saturna"))).toBe(true);
  });
});

describe("Udzial w jogach (parametr `jogi`)", () => {
  it("bez podanego argumentu `jogi` zachowanie jest identyczne jak wczesniej (domyslnie [])", () => {
    const o = ocenaWladcy(chart, "jupiter");
    expect(o.czynniki.some((c) => c.includes("uczestniczy w"))).toBe(false);
  });

  it("kazda joga, w ktorej bierze udzial planeta, dodaje +0,75 i wlasne uzasadnienie", () => {
    const jogi = wykryteJogiPosortowane(chart);
    const udzialJowisza = jogi.filter((j) => j.planety.includes("jupiter"));
    expect(udzialJowisza.length).toBeGreaterThan(0); // ta mapa ma wiele jog na Jowiszu — jesli to sie zmieni, dostosuj test

    const bez = ocenaWladcy(chart, "jupiter");
    const z = ocenaWladcy(chart, "jupiter", jogi);
    expect(z.punkty).toBeCloseTo(bez.punkty + udzialJowisza.length * 0.75, 5);
    expect(z.czynniki.filter((c) => c.includes("uczestniczy w")).length).toBe(udzialJowisza.length);
  });

  it("joga, w ktorej dana planeta NIE bierze udzialu, nie wplywa na jej wynik", () => {
    const jogi = wykryteJogiPosortowane(chart);
    const bezUdzialu = jogi.filter((j) => !j.planety.includes("ketu"));
    expect(bezUdzialu.length).toBeGreaterThan(0);
    const bez = ocenaWladcy(chart, "ketu");
    const z = ocenaWladcy(chart, "ketu", bezUdzialu);
    expect(z.punkty).toBe(bez.punkty);
  });
});
