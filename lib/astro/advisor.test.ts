import { describe, expect, it } from "vitest";
import { ACTIVITIES, adviseActivity, upcomingDays, NAK_CLASS } from "./advisor";
import { panchang, personalDay } from "./panchang";
import { gochara, sadeSati } from "./transits";
import { allPlanets } from "./ephemeris";

describe("doradca muhurty", () => {
  const day = panchang(new Date("2026-08-07T10:00:00Z"));

  it("wszystkie 27 nakszatr ma przypisaną klasę działania", () => {
    expect(NAK_CLASS).toHaveLength(27);
    const allowed = ["stała", "ruchoma", "ostra", "gwałtowna", "łagodna", "szybka", "mieszana"];
    for (const c of NAK_CLASS) expect(allowed).toContain(c);
  });

  it("klasyczny podział: 4 stałe, 5 ruchomych, 4 ostre, 5 gwałtownych, 4 łagodne, 3 szybkie, 2 mieszane", () => {
    const count = (c: string) => NAK_CLASS.filter((x) => x === c).length;
    expect(count("stała")).toBe(4);
    expect(count("ruchoma")).toBe(5);
    expect(count("ostra")).toBe(4);
    expect(count("gwałtowna")).toBe(5);
    expect(count("łagodna")).toBe(4);
    expect(count("szybka")).toBe(3);
    expect(count("mieszana")).toBe(2);
  });

  it("ocena mieści się w 3–97 i ma czynniki", () => {
    for (const a of ACTIVITIES) {
      const r = adviseActivity(a, day);
      expect(r.score).toBeGreaterThanOrEqual(3);
      expect(r.score).toBeLessThanOrEqual(97);
      expect(r.factors.length).toBeGreaterThan(2);
      expect(["bardzo dobry", "dobry", "przeciętny", "słaby", "odradzany"]).toContain(r.verdict);
    }
  });

  it("Bhadra (Wiszti) obniża ocenę startów", () => {
    // znajdź dzień z karaną Bhadra w najbliższych 30 dniach
    let bhadraDay = null;
    for (let i = 0; i < 30; i++) {
      const p = panchang(new Date(Date.now() + i * 86400000));
      if (p.karana.isBhadra) { bhadraDay = p; break; }
    }
    expect(bhadraDay).not.toBeNull();
    const start = ACTIVITIES.find((a) => a.id === "projekt")!;
    const r = adviseActivity(start, bhadraDay!);
    expect(r.factors.some((f) => f.text.includes("Bhadra") && f.sign === -1)).toBe(true);
  });

  it("personalizacja zmienia wynik", () => {
    const biznes = ACTIVITIES.find((a) => a.id === "biznes")!;
    const base = adviseActivity(biznes, day).score;
    // Księżyc urodzeniowy w tej samej nakszatrze = tara Dźanma (niesprzyjająca)
    const sameNak = day.moonNakshatra.nakshatra.index * (360 / 27) + 5;
    const personalized = adviseActivity(biznes, day, personalDay(sameNak, day)).score;
    expect(personalized).not.toBe(base);
  });

  it("kalendarz 30 dni zwraca komplet ocen", () => {
    const cal = upcomingDays(30);
    expect(cal).toHaveLength(30);
    for (const d of cal) {
      expect(d.score).toBeGreaterThan(0);
      expect(d.score).toBeLessThanOrEqual(100);
      expect(d.best.length).toBeGreaterThan(3);
    }
    // kolejne dni
    for (let i = 1; i < cal.length; i++) {
      expect(cal[i].date.getTime()).toBeGreaterThan(cal[i - 1].date.getTime());
    }
  });
});

describe("tranzyty i Sade Sati", () => {
  const natalMoon = 320; // Wodnik

  it("gochara liczy domy 1–12 od Księżyca urodzeniowego", () => {
    const g = gochara(natalMoon, new Date("2026-08-07T12:00:00Z"));
    expect(g.length).toBeGreaterThanOrEqual(6);
    for (const t of g) {
      expect(t.house).toBeGreaterThanOrEqual(1);
      expect(t.house).toBeLessThanOrEqual(12);
    }
  });

  it("Sade Sati wykrywa fazę, gdy Saturn jest w 12/1/2 domu od Księżyca", () => {
    const now = new Date("2026-08-07T12:00:00Z");
    const satSign = Math.floor(allPlanets(now).saturn.longitude / 30);
    // Księżyc urodzeniowy w tym samym znaku co tranzytujący Saturn → szczyt
    const moonSameSign = satSign * 30 + 15;
    const s = sadeSati(moonSameSign, now);
    expect(s.active).toBe(true);
    expect(s.phase).toBe("szczyt (1. dom)");
    expect(s.phaseEnd).toBeInstanceOf(Date);
  });

  it("poza Sade Sati zwraca 'brak' i nie jest aktywne", () => {
    const now = new Date("2026-08-07T12:00:00Z");
    const satSign = Math.floor(allPlanets(now).saturn.longitude / 30);
    // Saturn w 6. domu od Księżyca → poza Sade Sati i dhaiya
    const moon = ((satSign - 5 + 12) % 12) * 30 + 15;
    const s = sadeSati(moon, now);
    expect(s.active).toBe(false);
    expect(s.house).toBe(6);
  });
});
