"use client";

import { useState } from "react";
import type { VedicChart } from "@/lib/astro/chart";
import { karakiCzarowe } from "@/lib/astro/karaki";
import { OPISY_KARAK } from "@/lib/astro/karaki-tresc";
import { GRAHAS } from "@/lib/astro/constants";
import Term from "@/components/Term";

/**
 * KARAKI CZAROWE — osiem ról wg stopnia przebytego w znaku (system Dżajminiego),
 * na czele atmakaraka. Klikalne pastylki jak w Jedno spojrzenie: każda rola ×
 * planeta ma własną, osobną interpretację (OPISY_KARAK), nie tylko ogólny opis
 * roli z listy. Pod Profilem duszy, w tym samym złotym, skondensowanym stylu.
 */

function stylPastylki(zaznaczony: boolean): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 999,
    borderColor: "var(--sand)", cursor: "pointer",
    background: zaznaczony ? "rgba(230, 196, 138, 0.14)" : "transparent",
    boxShadow: zaznaczony ? "0 0 14px 1px rgba(230, 196, 138, 0.4)" : "none",
    transition: "background 0.25s, box-shadow 0.25s",
  };
}

export default function KarakiCzarowe({ chart }: { chart: VedicChart }) {
  const [rozwiniety, setRozwiniety] = useState<string | null>(null);
  const karaki = karakiCzarowe(chart);

  return (
    <div style={{ maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
      <p style={{ fontFamily: "var(--font-serif)", fontSize: "2.6rem", color: "var(--sand)", fontWeight: 700, marginBottom: 16, textAlign: "center" }}>
        <Term k="karaki" plain>Karaki czarowe</Term>
      </p>
      <p style={{ fontSize: "0.86rem", lineHeight: 1.6, color: "var(--sand)", textAlign: "center", marginBottom: 20 }}>
        System Dżajminiego: osiem ról wg stopnia przebytego w znaku, na czele{" "}
        <Term k="atmakaraka" plain>atmakaraka</Term> — planeta duszy. Kliknij rolę, żeby zobaczyć,
        co konkretnie znaczy TA planeta w TEJ roli.
      </p>

      <div style={{ display: "grid", gap: 10, textAlign: "left" }}>
        {karaki.map((ka) => {
          const rozw = rozwiniety === ka.skrot;
          const opis = OPISY_KARAK[ka.skrot]?.[ka.planeta];
          return (
            <div key={ka.skrot}>
              <div
                className="badge" role="button" tabIndex={0} aria-expanded={rozw} aria-pressed={rozw}
                onClick={() => setRozwiniety(rozw ? null : ka.skrot)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setRozwiniety(rozw ? null : ka.skrot); } }}
                style={stylPastylki(rozw)}>
                <span style={{ color: GRAHAS[ka.planeta].color, fontSize: "1.1rem" }}>{GRAHAS[ka.planeta].symbol}</span>
                <strong>{ka.skrot} · {ka.pl}</strong>
                <span>- {GRAHAS[ka.planeta].pl.toUpperCase()} -</span>
              </div>
              {rozw && (
                <p className="muted" style={{ fontSize: "0.84rem", lineHeight: 1.55, margin: "8px 4px 0" }}>
                  {ka.znaczenie}. Tutaj: <strong style={{ color: "var(--sand)" }}>{GRAHAS[ka.planeta].pl}</strong>
                  {opis && <> — {opis}</>}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="skrot-hero-linia" />
    </div>
  );
}
