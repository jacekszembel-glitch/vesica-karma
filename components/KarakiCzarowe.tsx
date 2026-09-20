"use client";

import { Fragment, useState } from "react";
import type { VedicChart } from "@/lib/astro/chart";
import { karakiCzarowe } from "@/lib/astro/karaki";
import { OPISY_KARAK } from "@/lib/astro/karaki-tresc";
import { GRAHAS } from "@/lib/astro/constants";
import Term from "@/components/Term";

/**
 * KARAKI CZAROWE — tabela z klikalnymi wierszami: każda rola × planeta ma
 * własną, osobną interpretację (OPISY_KARAK), nie tylko ogólny opis roli
 * z kolumny „Znaczenie". Kliknij wiersz, żeby zobaczyć pełny opis —
 * ten sam wzorzec co w Predyspozycjach i Na co uważać.
 */

export default function KarakiCzarowe({ chart }: { chart: VedicChart }) {
  const [rozwiniety, setRozwiniety] = useState<string | null>(null);
  const karaki = karakiCzarowe(chart);

  return (
    <details className="card" style={{ marginBottom: 24 }} open>
      <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)", marginBottom: 6 }}>
        <Term k="karaki">Karaki czarowe</Term>
      </summary>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 12, lineHeight: 1.55 }}>
        System Dżajminiego: role wg stopnia przebytego w znaku. Na czele{" "}
        <Term k="atmakaraka">atmakaraka</Term> — planeta duszy. Schemat ośmiu karak
        z Rahu (stopień węzła liczony odwrotnie). Kliknij wiersz, żeby zobaczyć, co konkretnie
        znaczy TA planeta w TEJ roli — nie tylko ogólny opis roli.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th></th><th>Rola</th><th>Planeta</th><th>Znaczenie</th></tr></thead>
          <tbody>
            {karaki.map((ka) => {
              const rozw = rozwiniety === ka.skrot;
              const opis = OPISY_KARAK[ka.skrot]?.[ka.planeta];
              return (
                <Fragment key={ka.skrot}>
                  <tr
                    role="button" tabIndex={0} aria-expanded={rozw}
                    onClick={() => setRozwiniety(rozw ? null : ka.skrot)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setRozwiniety(rozw ? null : ka.skrot); } }}
                    style={{
                      cursor: opis ? "pointer" : "default",
                      background: rozw ? "rgba(255,255,255,0.04)" : ka.skrot === "AK" ? "rgba(230,196,138,0.05)" : undefined,
                    }}>
                    <td style={{ color: ka.skrot === "AK" ? "var(--primary-soft)" : "var(--muted)", fontWeight: 600 }}>{ka.skrot}</td>
                    <td>{ka.pl}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span style={{ color: GRAHAS[ka.planeta].color }}>{GRAHAS[ka.planeta].symbol}</span> {GRAHAS[ka.planeta].pl}
                    </td>
                    <td className="muted" style={{ fontSize: "0.86rem" }}>{ka.znaczenie}</td>
                  </tr>
                  {rozw && opis && (
                    <tr>
                      <td colSpan={4} style={{ padding: "0 0 14px" }}>
                        <p className="muted" style={{ fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>
                          <strong style={{ color: "var(--primary-soft)" }}>
                            {ka.pl} — {GRAHAS[ka.planeta].pl}:
                          </strong>{" "}
                          {opis}
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}
