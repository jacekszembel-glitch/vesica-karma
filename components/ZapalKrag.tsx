"use client";

import { odblokujSystemKarmy, type SystemKarmy } from "@/lib/koloKarmyGeometria";
import { usePostepKarmy } from "./usePostepKarmy";

const NAZWA: Record<SystemKarmy, string> = {
  astrologia: "Astrologii", numerologia: "Numerologii", hiromancja: "Chiromancji",
};

/**
 * Przycisk pod przeczytaną interpretacją — zapala krąg danej sekcji w Kole Karmy
 * (na stałe, na złoto). Po kliknięciu strona przewija się do Koła, gdzie krąg
 * rozbłyskuje i przebiega po nim blik światła (KoloKarmy.tsx, kolejka animacji).
 * Gdy krąg już świeci — zamiast przycisku krótka informacja.
 */
export default function ZapalKrag({ system }: { system: SystemKarmy }) {
  const postep = usePostepKarmy();
  const swieci = postep.has(system);

  function zapal() {
    odblokujSystemKarmy(system);
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
