"use client";

import { createContext, useContext, useState } from "react";

/**
 * Wspólny stan "Zacznij" dla strony głównej — łączy przycisk (nagłówek
 * w CzymJestVesicaKarma.tsx, POD kołem) z samym Kołem Karmy (nad nim),
 * dwoma osobnymi komponentami klienckimi. Bez tego kontekstu KoloKarmy
 * musiałoby renderować własny przycisk, co dokładało wysokość i psuło
 * wyrównanie z tłem (zgłoszone przez użytkownika).
 */
interface KoloKarmyStartCtx {
  wystartowano: boolean;
  zacznij: () => void;
}

const Ctx = createContext<KoloKarmyStartCtx | null>(null);

export function KoloKarmyStartProvider({ children }: { children: React.ReactNode }) {
  const [wystartowano, setWystartowano] = useState(false);
  return (
    <Ctx.Provider value={{ wystartowano, zacznij: () => setWystartowano(true) }}>
      {children}
    </Ctx.Provider>
  );
}

/** Poza providerem (inne strony/layouty) zwraca stan "zawsze pełne złoto",
 *  bez wyjątku — KoloKarmy i tak używa go tylko gdy interaktywnyStart=true. */
export function useKoloKarmyStart(): KoloKarmyStartCtx {
  const ctx = useContext(Ctx);
  return ctx ?? { wystartowano: false, zacznij: () => {} };
}
