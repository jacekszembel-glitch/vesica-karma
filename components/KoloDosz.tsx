import type { KategoriaDoszy } from "@/lib/astro/doshas";

/**
 * Paleta kategorii dosz — celowo ciepła/ostrzegawcza, w kontrze do chłodniejszej
 * palety "dobrych" jog (KoloJog.tsx). Zwalidowana `dataviz` (validate_palette.js)
 * na ciemnej powierzchni karty (#14283a): pasmo jasności, próg chromy, separacja
 * CVD (deutan/protan/tritan) i próg dla widzenia bez zaburzeń — wszystkie PASS
 * w TEJ kolejności (patrz KOLEJNOSC_KATEGORII_DOSZY w doshas.ts — kolejność ma
 * znaczenie, inna permutacja tych samych barw może nie przejść testu ΔE).
 * Dwie barwy (śrapit-wino, pitra-ceglasta) mają WARN na kontraście vs tło
 * (~2.45:1, próg 3:1) — dozwolone tylko z kanałem ratunkowym: widoczną
 * etykietą tekstową. Mamy ją zawsze (legenda pod wykresem, title/dymek przy
 * najechaniu), więc WARN jest pokryty, nie olany.
 */
export const KATEGORIA_KOLOR_DOSZY: Record<KategoriaDoszy, string> = {
  kalasarpa: "#c98500",
  kemadruma: "#d55181",
  "guru-chandal": "#9085e9",
  mangal: "#e66767",
  shrapit: "#a83a5a",
  vish: "#8a8a3a",
  pitra: "#9c4a2e",
  grahan: "#6a7fd9",
  angarak: "#c9524a",
};
