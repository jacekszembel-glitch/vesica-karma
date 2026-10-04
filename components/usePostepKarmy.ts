"use client";

import { useEffect, useState } from "react";
import { ukonczoneSystemyKarmy, zwiazkiUkonczone, ZDARZENIE_POSTEPU, type SystemKarmy } from "@/lib/koloKarmyGeometria";

/** Nasłuch postępu — odświeża się na żywo po zapaleniu kręgu na tej stronie
 *  i po zmianie w innej karcie. */
function useNasluchPostepu<T>(czytaj: () => T, poczatek: T): T {
  const [stan, setStan] = useState<T>(poczatek);
  useEffect(() => {
    const odswiez = () => setStan(czytaj());
    odswiez();
    window.addEventListener(ZDARZENIE_POSTEPU, odswiez);
    window.addEventListener("storage", odswiez);
    return () => {
      window.removeEventListener(ZDARZENIE_POSTEPU, odswiez);
      window.removeEventListener("storage", odswiez);
    };
  }, [czytaj]);
  return stan;
}

const PUSTY = new Set<SystemKarmy>();

/** Zaliczone systemy Karmy (po interpretacji). */
export function usePostepKarmy(): Set<SystemKarmy> {
  return useNasluchPostepu(ukonczoneSystemyKarmy, PUSTY);
}

/** Czy krąg Związków jest zapalony (interpretacja pary na /dopasowanie). */
export function useZwiazkiUkonczone(): boolean {
  return useNasluchPostepu(zwiazkiUkonczone, false);
}
