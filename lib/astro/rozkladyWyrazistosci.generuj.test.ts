import { describe, it } from "vitest";
import { writeFileSync } from "fs";
import { buildChart } from "./chart";
import { PLANET_ORDER } from "./constants";
import { ocenyAstrologii } from "./zgodnosc";

/**
 * GENERATOR rozkladyWyrazistosci.ts — wyrazistość każdej planety (z siłą w D9) na 20 000 losowych map
 * (ziarno 20241, lata 1930–2024, cała Ziemia). Przeliczyć po każdej zmianie wyrazistoscPlanety().
 * Uruchom: GENERUJ=1 npx vitest run lib/astro/rozkladyWyrazistosci.generuj.test.ts
 */
describe.skipIf(!process.env.GENERUJ)("generator rozkładu wyrazistości", () => {
  it("liczy rozkłady", () => {
    let ziarno = 20241;
    const los = () => (ziarno = (ziarno * 16807) % 2147483647) / 2147483647;
    const N = Number(process.env.N ?? 20000);
    const zbior: Record<string, number[]> = {};
    for (let i = 0; i < N; i++) {
      const c = buildChart({
        date: new Date(Date.UTC(1930, 0, 1) + los() * (Date.UTC(2024, 11, 31) - Date.UTC(1930, 0, 1))),
        latitude: -55 + los() * 120, longitude: -180 + los() * 360, timeKnown: true,
      });
      const { punkty } = ocenyAstrologii(c, { surowe: true });
      for (const p of PLANET_ORDER) (zbior[p] ??= []).push(punkty[p]);
    }
    const rozklad = (v: number[]) => {
      const s = [...v].sort((a, b) => a - b);
      const tabela = Array.from({ length: 51 }, (_, i) => +s[Math.min(s.length - 1, Math.round((i / 50) * (s.length - 1)))].toFixed(2));
      return { srednia: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2), tabela };
    };
    const blok = Object.entries(zbior).map(([p, v]) => `  ${p}: ${JSON.stringify(rozklad(v)).replace(/"(srednia|tabela)"/g, "$1")},`).join("\n");
    writeFileSync("lib/astro/rozkladyWyrazistosci.ts", `import type { PlanetId } from "./constants";
import type { RozkladBilansu } from "./srednieBilansu";

/**
 * ROZKŁAD WYRAZISTOŚCI KAŻDEJ PLANETY (z siłą w D9) — tło dla ocen „mocna / przeciętna / słaba” w porównaniu
 * systemów. ${N} losowych map, ziarno 20241. Wygenerowane przez rozkladyWyrazistosci.generuj.test.ts —
 * przeliczyć po każdej zmianie wyrazistoscPlanety().
 */
export const ROZKLADY_WYRAZISTOSCI: Partial<Record<PlanetId, RozkladBilansu>> = {
${blok}
};
`);
  }, 3_600_000);
});
