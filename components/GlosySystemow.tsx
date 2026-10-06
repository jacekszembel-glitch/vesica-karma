"use client";

import type { GlosSystemu, SystemTematu } from "@/lib/astro/tematy";

/**
 * Najważniejszy temat życia według KAŻDEGO systemu osobno — trzy różne głosy (lib/astro/tematy.ts,
 * najwazniejszeTematy). Uzupełnia tabelę zgodności: tam to, w czym systemy się spotykają, tu to,
 * co każdy mówi najmocniej sam od siebie.
 */

const NAZWA: Record<SystemTematu, { naglowek: string; krotko: string }> = {
  kosmogram: { naglowek: "Według astrologii", krotko: "astrologia" },
  dlon: { naglowek: "Według chiromancji", krotko: "chiromancja" },
  numerologia: { naglowek: "Według numerologii", krotko: "numerologia" },
};

export default function GlosySystemow({ glosy }: { glosy: GlosSystemu[] }) {
  if (!glosy.length) return null;
  return (
    <div className="gs">
      <p className="eyebrow" style={{ textAlign: "center", marginBottom: 6 }}>Najważniejsze tematy Twojego życia</p>
      <p className="muted" style={{ fontSize: "0.86rem", lineHeight: 1.6, textAlign: "center", maxWidth: 600, margin: "0 auto 18px" }}>
        Każdy system mówi o Tobie najmocniej coś innego. Poniżej najsilniejszy temat każdego z nich —
        trzy różne głosy jednej karmy.
      </p>
      <div className="gs-karty">
        {glosy.map((g) => {
          const w = g.temat.wskazania[g.system];
          const dowody = (w.dowody ?? [w.opis]).filter(Boolean).slice(0, 3);
          return (
            <article key={g.system} className="gs-karta">
              <p className="gs-system">{NAZWA[g.system].naglowek}</p>
              <h3 className="gs-temat">{g.temat.nazwa}</h3>
              <p className="gs-wniosek">{g.temat.wniosek}</p>
              <ul className="gs-dowody">
                {dowody.map((d) => <li key={d}>{d}</li>)}
              </ul>
              {g.takze.length > 0 && (
                <p className="gs-takze">✦ to samo wskazuje też: {g.takze.map((s) => NAZWA[s].krotko).join(" i ")}</p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
