"use client";

import { useMemo } from "react";
import { GRAHAS } from "@/lib/astro/constants";
import type { VedicChart } from "@/lib/astro/chart";
import { upcomingAntardashas } from "@/lib/astro/lifemap";
import Term from "@/components/Term";
import DashaTimeline from "@/components/DashaTimeline";
import DashaOrbit from "@/components/DashaOrbit";

/**
 * DASZA — okresy planetarne (Vimshottari), jeden z trzech filarów obok D1 i
 * jog/dosz. Wcześniej liczone (chart.dashas/currentDasha), ale nigdzie
 * pokazywane na kosmogramie — trafiały tylko cicho do interpretacji AI.
 * Działa też bez znanej godziny urodzenia (Księżyc i tak jest policzony).
 */

const POZIOM_ETYKIETA = ["", "Mahadasha", "Antardasza", "Pratjantardasza"] as const;

export default function DaszaSekcja({ chart }: { chart: VedicChart }) {
  const aktualny = chart.currentDasha;
  const nadchodzace = useMemo(() => upcomingAntardashas(chart, chart.birth), [chart]);
  const pratjantardasza = aktualny.find((p) => p.level === 3);

  return (
    <details className="card" style={{ marginBottom: 24 }} open>
      <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)", marginBottom: 6 }}>
        <Term k="dasza">Dasza — okresy planetarne</Term>
      </summary>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 18, lineHeight: 1.55 }}>
        Cykl Vimshottari — 120 lat podzielone między dziewięć planet, liczone od pozycji Księżyca
        w nakszatrze w chwili urodzenia. Mahadasha to wieloletni „wielki rozdział" życia, antardasza
        i pratjantardasza to coraz krótsze podokresy wewnątrz niego — to one najsilniej barwią
        bieżący czas.
      </p>

      {nadchodzace.length > 0 && <DashaOrbit periods={nadchodzace} />}

      {pratjantardasza && (() => {
        const g = GRAHAS[pratjantardasza.lord];
        return (
          <p className="muted" style={{ fontSize: "0.82rem", margin: "16px 0 0", lineHeight: 1.6 }}>
            {POZIOM_ETYKIETA[3]} teraz: <span style={{ color: g.color }}>{g.symbol}</span>{" "}
            <strong style={{ color: "var(--text)" }}>{g.pl}</strong> — najkrótszy, najdrobniejszy
            podokres wewnątrz powyższej antardaszy.
          </p>
        );
      })()}

      <p className="eyebrow" style={{ margin: "26px 0 10px" }}>Cała oś — kliknij mahadashę, żeby zobaczyć podokresy</p>
      <DashaTimeline periods={chart.dashas} birth={chart.birth.date} />
    </details>
  );
}
