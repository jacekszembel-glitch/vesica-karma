"use client";

import { zapalKragKarmy, type KragKarmy } from "@/lib/koloKarmyGeometria";
import { zapiszSekcje, type ZapisSekcji } from "@/lib/zapisSekcji";
import { usePostepKarmy, useZwiazkiUkonczone } from "./usePostepKarmy";

const NAZWA: Record<KragKarmy, string> = {
  astrologia: "Astrologii", numerologia: "Numerologii", hiromancja: "Chiromancji", zwiazki: "Związków",
};

/**
 * Przycisk pod przeczytaną interpretacją — zapala krąg danej sekcji w Kole Karmy
 * (na stałe, na złoto). Po kliknięciu strona przewija się do Koła (jeśli jest na
 * stronie), gdzie krąg rozbłyskuje i przebiega po nim blik światła (KoloKarmy.tsx).
 * Gdy krąg już świeci — zamiast przycisku krótka informacja.
 */
export default function ZapalKrag({ system, zapis }: {
  system: KragKarmy;
  /** Co zapamiętać przy zapaleniu (dane + tekst interpretacji) — do podglądu w Moim panelu. */
  zapis?: Omit<ZapisSekcji, "zapisano">;
}) {
  const postep = usePostepKarmy();
  const zwiazki = useZwiazkiUkonczone();
  const swieci = system === "zwiazki" ? zwiazki : postep.has(system);

  function zapal() {
    if (zapis) zapiszSekcje(system, zapis);
    zapalKragKarmy(system);
    document.querySelector("[data-kolo-karmy]")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (swieci) {
    return (
      <p className="zapal-krag-info">
        ✦ Krąg {NAZWA[system]} świeci w Kole Karmy — ten segment jest ukończony.
      </p>
    );
  }
  return (
    <div className="zapal-krag">
      <p>Interpretacja przeczytana — zapal krąg {NAZWA[system]} w Kole Karmy.</p>
      <button type="button" className="przycisk-kolo" onClick={zapal}>Zapal krąg</button>
    </div>
  );
}
