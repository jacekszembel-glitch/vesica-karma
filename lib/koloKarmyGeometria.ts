/**
 * Geometria Koła Karmy współdzielona między KoloKarmy.tsx (client, hover/linki)
 * i KoloKarmyMini.tsx (statyczny breadcrumb, może renderować się w Server
 * Component) — osobny plik BEZ "use client", żeby import stałych działał
 * identycznie w obu kontekstach.
 */
export type SystemKarmy = "astrologia" | "hiromancja" | "numerologia";

/** Bounding boxy trzech systemowych płatków w przestrzeni kolo-karmy.png
 *  (1260×761) — też używane przez scripts/recolor-kolo-karmy.mjs (GAPY). */
export const SEGMENT_GAPY: Record<SystemKarmy, readonly [number, number, number, number]> = {
  astrologia: [428, 85, 765, 254],
  hiromancja: [325, 300, 559, 605],
  numerologia: [633, 301, 867, 606],
};
