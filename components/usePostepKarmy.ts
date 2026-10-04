"use client";

import { useEffect, useState } from "react";
import { ukonczoneSystemyKarmy, ZDARZENIE_POSTEPU, type SystemKarmy } from "@/lib/koloKarmyGeometria";

/** Zaliczone systemy Karmy (po interpretacji) — odświeża się na żywo po
 *  odblokujSystemKarmy() na tej stronie i po zmianie w innej karcie. */
export function usePostepKarmy(): Set<SystemKarmy> {
  const [postep, setPostep] = useState<Set<SystemKarmy>>(() => new Set());
  useEffect(() => {
    const odswiez = () => setPostep(ukonczoneSystemyKarmy());
    odswiez();
    window.addEventListener(ZDARZENIE_POSTEPU, odswiez);
    window.addEventListener("storage", odswiez);
    return () => {
      window.removeEventListener(ZDARZENIE_POSTEPU, odswiez);
      window.removeEventListener("storage", odswiez);
    };
  }, []);
  return postep;
}
