import { describe, it, expect } from "vitest";
import { buildChart } from "./chart";
import { bhinnasztakawarga, sarwasztakawarga, GRAHY_ASZTAKAWARGI } from "./ashtakavarga";

const chart = buildChart({
  date: new Date("1981-04-11T10:45:00Z"),
  latitude: 50.09, longitude: 18.22, timeKnown: true,
});

describe("Bhinnasztakawarga", () => {
  it("wymaga znanej lagny", () => {
    const bez = buildChart({ date: new Date("1981-04-11T10:45:00Z"), latitude: 50, longitude: 18, timeKnown: false });
    expect(bhinnasztakawarga(bez)).toBeNull();
  });

  const bav = bhinnasztakawarga(chart)!;

  it("suma bindu każdej grahy jest stała, niezależna od mapy (BPHS)", () => {
    const OCZEKIWANE: Record<string, number> = {
      sun: 48, moon: 49, mars: 39, mercury: 54, jupiter: 56, venus: 52, saturn: 39,
    };
    for (const g of GRAHY_ASZTAKAWARGI) {
      const suma = bav[g].reduce((a, b) => a + b, 0);
      expect(suma, g).toBe(OCZEKIWANE[g]);
    }
  });

  it("każdy znak ma 0-8 bindu", () => {
    for (const g of GRAHY_ASZTAKAWARGI) {
      for (const v of bav[g]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(8);
      }
    }
  });

  it("bindu Słońca w Rybach (znak 11) — ręcznie policzone z tabeli BPHS dla tej mapy", () => {
    // Lagna Rak(3); Słońce/Mars/Merkury/Wenus w Rybach(11); Jowisz/Saturn w Pannie(5); Księżyc w Bliźniętach(2).
    // Dla każdego źródła: dom = ((11 - znakŹródła + 12) % 12) + 1, sprawdzony w tabeli TABELA.sun[źródło]:
    //  sun→dom1 (w tabeli: tak), moon→dom10 (tak), mars→dom1 (tak), mercury→dom1 (nie),
    //  jupiter→dom7 (nie), venus→dom1 (nie), saturn→dom7 (tak), lagna→dom9 (nie) → suma 4.
    expect(bav.sun[11]).toBe(4);
  });
});

describe("Sarwasztakawarga", () => {
  const bav = bhinnasztakawarga(chart)!;
  const sav = sarwasztakawarga(bav);

  it("suma wszystkich 12 znaków = 337 (stała BPHS)", () => {
    expect(sav.reduce((a, b) => a + b, 0)).toBe(337);
  });

  it("każdy znak = suma odpowiadających znaków wszystkich 7 BAV", () => {
    for (let znak = 0; znak < 12; znak++) {
      const suma = GRAHY_ASZTAKAWARGI.reduce((s, g) => s + bav[g][znak], 0);
      expect(sav[znak]).toBe(suma);
    }
  });
});
