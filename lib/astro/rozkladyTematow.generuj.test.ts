import { describe, it } from "vitest";
import { writeFileSync } from "fs";
import { buildChart } from "./chart";
import { numerology } from "./numerology";
import { navamsaChart } from "./varga";
import { tematyWspolne } from "./tematy";

/**
 * GENERATOR rozkladyTematow.ts — siła każdego tematu w kosmogramie (D1 i D9) na 20 000 losowych map,
 * ta sama próba co talenty (ziarno 20241, lata 1930–2024, cała Ziemia). Przeliczyć po każdej zmianie
 * warunków tematów w tematy.ts. Uruchom: GENERUJ=1 npx vitest run lib/astro/rozkladyTematow.generuj.test.ts
 */
describe.skipIf(!process.env.GENERUJ)("generator rozkładów tematów", () => {
  it("liczy rozkłady", () => {
    let ziarno = 20241;
    const los = () => (ziarno = (ziarno * 16807) % 2147483647) / 2147483647;
    const N = Number(process.env.N ?? 20000);
    const num = numerology("1990-01-01", "", "wedyjski", 2026);
    const zbior: { d1: Record<string, number[]>; d9: Record<string, number[]> } = { d1: {}, d9: {} };
    for (let i = 0; i < N; i++) {
      const c = buildChart({
        date: new Date(Date.UTC(1930, 0, 1) + los() * (Date.UTC(2024, 11, 31) - Date.UTC(1930, 0, 1))),
        latitude: -55 + los() * 120, longitude: -180 + los() * 360, timeKnown: true,
      });
      const d9 = navamsaChart(c);
      for (const [klucz, mapa, varga] of [["d1", c, false], ["d9", d9, true]] as const) {
        if (!mapa) continue;
        for (const t of tematyWspolne(mapa, num, null, { varga, surowe: true })) {
          const w = t.wskazania.kosmogram;
          (zbior[klucz][t.id] ??= []).push(w.stan === "tak" || w.stan === "czesciowo" ? w.moc ?? 0 : 0);
        }
      }
    }
    const rozklad = (v: number[]) => {
      const s = [...v].sort((a, b) => a - b);
      const tabela = Array.from({ length: 51 }, (_, i) => +s[Math.min(s.length - 1, Math.round((i / 50) * (s.length - 1)))].toFixed(2));
      return { srednia: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2), tabela };
    };
    const blok = (k: "d1" | "d9") => Object.entries(zbior[k]).map(([id, v]) => `    ${id}: ${JSON.stringify(rozklad(v)).replace(/"(srednia|tabela)"/g, "$1")},`).join("\n");
    writeFileSync("lib/astro/rozkladyTematow.ts", `import type { RozkladBilansu } from "./srednieBilansu";

/**
 * ROZKŁAD SIŁY TEMATU W KOSMOGRAMIE — tło dla progów tak / częściowo / nie we Wspólnych tematach.
 * ${N} losowych map, ziarno 20241, te same wyliczenia co w tematy.ts (opcja surowe). „tabela” — wartość
 * co 2 punkty procentowe (0, 2 … 100), czytana przez procentNizej(). Wygenerowane przez
 * rozkladyTematow.generuj.test.ts — przeliczyć po każdej zmianie warunków tematów.
 */
export const ROZKLADY_TEMATOW: { d1: Record<string, RozkladBilansu>; d9: Record<string, RozkladBilansu> } = {
  d1: {
${blok("d1")}
  },
  d9: {
${blok("d9")}
  },
};
`);
  }, 3_600_000);
});
