"use client";

import { useEffect, useState } from "react";
import { renderMd } from "./Interpretation";
import { wczytajSekcje, type ZapisSekcji } from "@/lib/zapisSekcji";
import type { KragKarmy } from "@/lib/koloKarmyGeometria";

/** Zapisany odczyt ukończonej sekcji (lib/zapisSekcji.ts) — do podglądu bez liczenia
 *  od nowa. Nic nie renderuje, dopóki sekcja nie ma zapisu. */
export function useZapisSekcji(id: KragKarmy): ZapisSekcji | null {
  const [zapis, setZapis] = useState<ZapisSekcji | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- odczyt z localStorage po zamontowaniu
  useEffect(() => { setZapis(wczytajSekcje(id)); }, [id]);
  return zapis;
}

export function dataZapisu(ms: number): string {
  return new Date(ms).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}

export default function ZapisanyOdczyt({ zapis, bezPodpisu }: {
  zapis: ZapisSekcji;
  /** Podpis jest już wyżej (np. nagłówek rozwijanej pozycji w panelu) — sama data. */
  bezPodpisu?: boolean;
}) {
  return (
    <div>
      <p className="muted" style={{ textAlign: "center", fontSize: "0.82rem", marginBottom: 12 }}>
        {bezPodpisu ? "Zapisano" : `${zapis.podpis} · zapisano`} {dataZapisu(zapis.zapisano)}
      </p>
      <div className="interpretation interp-odslona" style={{ textAlign: "left" }}>
        {renderMd(zapis.tekst)}
      </div>
    </div>
  );
}
