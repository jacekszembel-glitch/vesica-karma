import { describe, expect, it } from "vitest";
import { astrocartography, eclipticToEquatorial, nearbyLines } from "./astrocarto";
import { PLANET_ORDER } from "./constants";

describe("astrokartografia", () => {
  const date = new Date("1990-06-15T12:30:00Z");
  const lines = astrocartography(date);

  it("liczy linie dla wszystkich 9 grah", () => {
    expect(lines).toHaveLength(9);
    expect(lines.map((l) => l.id)).toEqual(PLANET_ORDER);
  });

  it("IC jest dokładnie naprzeciw MC", () => {
    for (const l of lines) {
      const d = Math.abs(((l.mc - l.ic) % 360 + 360) % 360);
      expect(Math.abs(d - 180)).toBeLessThan(1e-9);
    }
  });

  it("linia MC Słońca: w południe słoneczne Słońce góruje blisko południka miejsca", () => {
    // 15.06.1990, 12:00 UTC — południe słoneczne wypada ok. długości 0° (± równanie czasu ~1°)
    const noon = astrocartography(new Date("1990-06-15T12:00:00Z"));
    const sun = noon.find((l) => l.id === "sun")!;
    expect(Math.abs(sun.mc)).toBeLessThan(2);
  });

  it("konwersja ekliptyczna→równikowa: punkt Barana i punkt Raka", () => {
    const d = new Date("2000-01-01T00:00:00Z");
    // 0° długości ekliptycznej = 0h RA, dec 0
    const aries = eclipticToEquatorial(0, 0, d);
    expect(Math.abs(aries.ra)).toBeLessThan(1e-6);
    expect(Math.abs(aries.dec)).toBeLessThan(1e-6);
    // 90° długości = RA 90°, dec = +ε (~23,44°)
    const cancer = eclipticToEquatorial(90, 0, d);
    expect(Math.abs(cancer.ra - 90)).toBeLessThan(1e-6);
    expect(cancer.dec).toBeGreaterThan(23.4);
    expect(cancer.dec).toBeLessThan(23.5);
  });

  it("krzywa ASC dla ciała o deklinacji ~0 jest niemal pionowa", () => {
    // Słońce w pobliżu równonocy ma dec ~0 → cos H0 ~ 0 → H0 ~ 90° dla każdej szerokości
    const equinox = astrocartography(new Date("2020-03-20T12:00:00Z"));
    const sun = equinox.find((l) => l.id === "sun")!;
    const lons = sun.asc.map(([, lon]) => lon);
    const spread = Math.max(...lons) - Math.min(...lons);
    expect(spread).toBeLessThan(5);
  });

  it("krzywe ASC/DSC pokrywają pełny zakres szerokości dla ciał o małej deklinacji", () => {
    const sun = lines.find((l) => l.id === "sun")!;
    expect(sun.asc.length).toBeGreaterThan(100);
    expect(sun.dsc.length).toBeGreaterThan(100);
  });

  it("nearbyLines zwraca posortowane odległości w limicie", () => {
    const near = nearbyLines(lines, 50.09, 18.22, 15);
    for (let i = 1; i < near.length; i++) {
      expect(near[i].distance).toBeGreaterThanOrEqual(near[i - 1].distance);
    }
    for (const n of near) expect(n.distance).toBeLessThanOrEqual(15);
  });
});
