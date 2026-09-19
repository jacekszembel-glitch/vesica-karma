import { describe, it, expect } from "vitest";
import { buildChart } from "./chart";
import { pokrewienstwo, czyParaPartnerska } from "./rodzina";

const chartA = buildChart({ date: new Date("1981-04-11T10:45:00Z"), latitude: 50.09, longitude: 18.22, timeKnown: true });
const chartB = buildChart({ date: new Date("1992-03-20T06:15:00Z"), latitude: 50.06, longitude: 19.95, timeKnown: true });
const chartC = buildChart({ date: new Date("2015-09-02T14:00:00Z"), latitude: 52.23, longitude: 21.01, timeKnown: false });

describe("czyParaPartnerska", () => {
  it("para partner+partner jest partnerska", () => {
    expect(czyParaPartnerska("partner", "partner")).toBe(true);
  });
  it("para ja+partner jest partnerska (symetrycznie)", () => {
    expect(czyParaPartnerska("ja", "partner")).toBe(true);
    expect(czyParaPartnerska("partner", "ja")).toBe(true);
  });
  it("para rodzic+dziecko NIE jest partnerska", () => {
    expect(czyParaPartnerska("rodzic", "dziecko")).toBe(false);
  });
  it("para ja+dziecko NIE jest partnerska", () => {
    expect(czyParaPartnerska("ja", "dziecko")).toBe(false);
  });
});

describe("pokrewienstwo", () => {
  it("para partnerska woła Guna Milan (typ 'partnerska', 0-36 pkt)", () => {
    const w = pokrewienstwo(chartA, chartB, "ja", "partner");
    expect(w.typ).toBe("partnerska");
    expect(w.gunaMilan).toBeDefined();
    expect(w.gunaMilan!.total).toBeGreaterThanOrEqual(0);
    expect(w.gunaMilan!.total).toBeLessThanOrEqual(36);
    expect(w.punkty).toBeUndefined();
  });

  it("para nie-partnerska dostaje lekki wskaźnik (typ 'ogolna', 0-10 pkt)", () => {
    const w = pokrewienstwo(chartA, chartC, "ja", "dziecko");
    expect(w.typ).toBe("ogolna");
    expect(w.gunaMilan).toBeUndefined();
    expect(w.punkty).toBeGreaterThanOrEqual(0);
    expect(w.punkty).toBeLessThanOrEqual(10);
    expect(w.opis.length).toBeGreaterThan(0);
  });

  it("wskaźnik ogólny działa też bez znanej godziny (chartC ma angles: null)", () => {
    expect(chartC.angles).toBeNull();
    const w = pokrewienstwo(chartA, chartC, "rodzic", "dziecko");
    expect(w.typ).toBe("ogolna");
    expect(Number.isFinite(w.punkty)).toBe(true);
  });

  it("każdy wpis w opis jest niepustym zdaniem", () => {
    const w = pokrewienstwo(chartB, chartC, "rodzenstwo", "rodzenstwo");
    for (const linia of w.opis) expect(linia.length).toBeGreaterThan(0);
  });
});
