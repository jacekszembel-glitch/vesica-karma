import { describe, it, expect } from "vitest";
import { GRAHAS, RASIS } from "./constants";
import { grahaNazwa, rasiNazwa, domNazwa } from "./i18nAstro";

describe("i18nAstro", () => {
  it("zwraca polska lub angielska nazwe planety", () => {
    expect(grahaNazwa(GRAHAS.sun, "pl")).toBe("Słońce");
    expect(grahaNazwa(GRAHAS.sun, "en")).toBe("Sun");
  });

  it("zwraca polska lub angielska nazwe znaku", () => {
    expect(rasiNazwa(RASIS[0], "pl")).toBe("Baran");
    expect(rasiNazwa(RASIS[0], "en")).toBe("Aries");
  });

  it("zwraca polska lub angielska nazwe domu", () => {
    expect(domNazwa(0, "pl")).toBe("1. dom");
    expect(domNazwa(0, "en")).toBe("1st house");
  });

  it("kazda z 9 grah i 12 rasi ma niepuste pole en", () => {
    for (const g of Object.values(GRAHAS)) expect(g.en).toBeTruthy();
    for (const r of RASIS) expect(r.en).toBeTruthy();
  });
});
