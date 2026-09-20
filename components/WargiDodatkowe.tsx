"use client";

import { useMemo } from "react";
import type { VedicChart } from "@/lib/astro/chart";
import { GRAHAS, PLANET_ORDER } from "@/lib/astro/constants";
import { drekkanaChart, chaturthamsaChart, saptamsaChart, dwadasamsaChart, shodasamsaChart, vimsamsaChart, chaturvimsamsaChart, shashtiamsaChart, horaLord } from "@/lib/astro/varga";
import { nakshatraTerm } from "@/lib/astro/nakshatra";
import NorthChart from "@/components/NorthChart";
import SouthChart from "@/components/SouthChart";
import Term from "@/components/Term";

/**
 * POZOSTAŁE WARGA — osiem kolejnych klasycznych wykresów podziałowych (D3,
 * D4, D7, D10, D12, D16, D20, D24), ten sam wzorzec co D9 na kosmogramie,
 * tylko zebrane osobno i domyślnie zwinięte, żeby nie przeciążać głównego
 * widoku. D10
 * (kariera) była wcześniej pokazywana obok D1/D9 w głównym rzędzie
 * diagramów, ale trzy diagramy naraz robiły się ciasne, zwłaszcza na
 * telefonie — D1+D9 to klasyczna, zawsze razem czytana para, D10 dołącza
 * tu do reszty wykresów uzupełniających. D2 (hora) jest strukturalnie
 * inna — każda planeta trafia tylko do jednej z dwóch hor (Słońca albo
 * Księżyca), więc pokazujemy ją jako listę, nie wykres kołowy.
 */

const HORA_OPIS: Record<"sun" | "moon", string> = {
  sun: "hora Słońca — skłonność do aktywnego zdobywania i wydawania",
  moon: "hora Księżyca — skłonność do gromadzenia i oszczędzania",
};

export default function WargiDodatkowe({ chart, styl, d10 }: {
  chart: VedicChart; styl: "polnocny" | "poludniowy";
  /** D10 (Daśamsza) — liczona w page.tsx (współdzielona z Panczadha Maitri w Szadbali), przekazana gotowa. */
  d10: VedicChart | null;
}) {
  const d3 = useMemo(() => drekkanaChart(chart), [chart]);
  const d4 = useMemo(() => chaturthamsaChart(chart), [chart]);
  const d7 = useMemo(() => saptamsaChart(chart), [chart]);
  const d12 = useMemo(() => dwadasamsaChart(chart), [chart]);
  const d16 = useMemo(() => shodasamsaChart(chart), [chart]);
  const d20 = useMemo(() => vimsamsaChart(chart), [chart]);
  const d24 = useMemo(() => chaturvimsamsaChart(chart), [chart]);
  const d60 = useMemo(() => shashtiamsaChart(chart), [chart]);
  const hory = useMemo(
    () => PLANET_ORDER.map((id) => ({ id, lord: horaLord(chart.planets[id].longitude) })),
    [chart],
  );

  if (!chart.angles) return null;

  const Chart = styl === "polnocny" ? NorthChart : SouthChart;
  const wykresy: { term: string; label: string; sub: string; d: VedicChart | null }[] = [
    { term: "drekkana", label: "D3 · Drekkana", sub: "rodzeństwo, odwaga", d: d3 },
    { term: "czaturthamsza", label: "D4 · Czaturthamsza", sub: "dom, majątek, szczęście", d: d4 },
    { term: "saptamsza", label: "D7 · Saptamsza", sub: "dzieci, potomność", d: d7 },
    { term: "dasamsza", label: "D10 · Daśamsza", sub: "kariera i działanie", d: d10 },
    { term: "dwadasamsza", label: "D12 · Dwadaśamsza", sub: "rodzice", d: d12 },
    { term: "szodasamsza", label: "D16 · Szodaśamsza", sub: "pojazdy, komfort, szczęście", d: d16 },
    { term: "wimszamsza", label: "D20 · Wimszamsza", sub: "duchowa praktyka, wrażliwość duchowa", d: d20 },
    { term: "czaturwimszamsza", label: "D24 · Czaturwimszamsza", sub: "nauka, wiedza, siddhi", d: d24 },
    { term: "szasztiamsza", label: "D60 · Szasztiamsza", sub: "poprzednie wcielenia, karma", d: d60 },
  ];

  return (
    <details className="card" style={{ marginBottom: 24 }}>
      <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)", marginBottom: 6 }}>
        Pozostałe warga — D2, D3, D4, D7, D10, D12, D16, D20, D24, D60
      </summary>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 20, lineHeight: 1.55 }}>
        Dziewięć kolejnych klasycznych wykresów podziałowych, wg tego samego podziału znaku co D9 —
        każdy skupiony na innym obszarze życia. Nie zastępują D1, uzupełniają go.
      </p>

      <p className="eyebrow" style={{ marginBottom: 8 }}>
        <Term k="hora">D2 · Hora</Term> — gromadzenie majątku
      </p>
      <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 12, lineHeight: 1.5 }}>
        W przeciwieństwie do pozostałych warg hora nie dzieli koła na 12 znaków — każda planeta
        trafia do jednej z dwóch „hor": Słońca albo Księżyca.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 26 }}>
        {hory.map(({ id, lord }) => {
          const g = GRAHAS[id];
          return (
            <span key={id} className="badge" title={HORA_OPIS[lord]} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: g.color }}>{g.symbol}</span> {g.pl}
              <span className="muted">— hora {lord === "sun" ? "Słońca" : "Księżyca"}</span>
            </span>
          );
        })}
      </div>

      <div className="wykresy-para">
        {wykresy.map((w) => w.d && (
          <div key={w.label}>
            <p className="wykres-podpis">
              <Term k={w.term}>{w.label}</Term> <span>{w.sub}</span>
            </p>
            <Chart chart={w.d} />
          </div>
        ))}
      </div>

      {d10 && d10.angles && (
        <div style={{ marginTop: 26, overflowX: "auto" }}>
          <p className="eyebrow" style={{ marginBottom: 4 }}>
            Pozycje planet — <Term k="dasamsza">D10 · Daśamsza</Term>
          </p>
          <p className="muted" style={{ fontSize: "0.82rem", marginBottom: 14 }}>
            Stopień liczony wewnątrz daśamszy (0–30°) — to nie ta sama skala co w D1.
            Dom liczony od lagny D10, nakszatra zostaje z rzeczywistej długości ekliptycznej.
          </p>
          <table>
            <thead>
              <tr>
                <th>Graha</th><th>Znak</th><th>Stopień</th><th>Dom</th>
                <th><Term k="nakszatra">Nakszatra</Term></th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {PLANET_ORDER.map((id) => {
                const p = d10.planets[id];
                const g = GRAHAS[id];
                return (
                  <tr key={id}>
                    <td><span style={{ color: g.color }}>{g.symbol}</span> {g.pl}</td>
                    <td>{p.signPl}</td>
                    <td>{p.degreeFormatted}</td>
                    <td>{p.house}</td>
                    <td>
                      <Term term={nakshatraTerm(p.nakshatra)} plain>{p.nakshatra.nakshatra.pl}</Term>{" "}
                      <span className="muted">p.{p.nakshatra.pada}</span>
                    </td>
                    <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {p.retrograde && id !== "rahu" && id !== "ketu" && (
                        <Term k="retrogradacja" plain><span className="badge">retro</span></Term>
                      )}
                      {p.combust && (
                        <Term k="spalenie" plain><span className="badge badge-warn">spalona</span></Term>
                      )}
                      {p.dignity === "egzaltacja" && (
                        <Term k="egzaltacja" plain><span className="badge badge-good">egzaltacja</span></Term>
                      )}
                      {p.dignity === "mulatrikona" && (
                        <Term k="mulatrikona" plain><span className="badge badge-good">mulatrikona</span></Term>
                      )}
                      {p.dignity === "upadek" && (
                        <Term k="upadek" plain><span className="badge badge-warn">upadek</span></Term>
                      )}
                      <Term k={p.signRelacja === "władanie" ? "wladanie" : `znak_${p.signRelacja}`} plain>
                        <span className="badge" style={{
                          color: p.signRelacja === "władanie" || p.signRelacja === "przyjazny" ? "var(--success)"
                            : p.signRelacja === "wrogi" ? "var(--warn)" : "var(--muted)",
                          opacity: p.signRelacja === "neutralny" ? 0.75 : 1,
                        }}>
                          {p.signRelacja === "władanie" ? "u siebie"
                            : p.signRelacja === "przyjazny" ? "znak przyjaciela"
                            : p.signRelacja === "wrogi" ? "znak wroga" : "znak neutralny"}
                        </span>
                      </Term>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {d60 && d60.angles && (
        <div style={{ marginTop: 26, overflowX: "auto" }}>
          <p className="eyebrow" style={{ marginBottom: 4 }}>
            Pozycje planet — <Term k="szasztiamsza">D60 · Szasztiamsza</Term>
          </p>
          <p className="muted" style={{ fontSize: "0.82rem", marginBottom: 14 }}>
            Najdrobniejszy klasyczny podział (0,5° na część) — czytany jako ślad poprzednich
            wcieleń i najgłębsza warstwa karmy. Stopień liczony wewnątrz szasztiamszy, dom od
            lagny D60, nakszatra zostaje z rzeczywistej długości ekliptycznej.
          </p>
          <table>
            <thead>
              <tr>
                <th>Graha</th><th>Znak</th><th>Stopień</th><th>Dom</th>
                <th><Term k="nakszatra">Nakszatra</Term></th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {PLANET_ORDER.map((id) => {
                const p = d60.planets[id];
                const g = GRAHAS[id];
                return (
                  <tr key={id}>
                    <td><span style={{ color: g.color }}>{g.symbol}</span> {g.pl}</td>
                    <td>{p.signPl}</td>
                    <td>{p.degreeFormatted}</td>
                    <td>{p.house}</td>
                    <td>
                      <Term term={nakshatraTerm(p.nakshatra)} plain>{p.nakshatra.nakshatra.pl}</Term>{" "}
                      <span className="muted">p.{p.nakshatra.pada}</span>
                    </td>
                    <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {p.retrograde && id !== "rahu" && id !== "ketu" && (
                        <Term k="retrogradacja" plain><span className="badge">retro</span></Term>
                      )}
                      {p.combust && (
                        <Term k="spalenie" plain><span className="badge badge-warn">spalona</span></Term>
                      )}
                      {p.dignity === "egzaltacja" && (
                        <Term k="egzaltacja" plain><span className="badge badge-good">egzaltacja</span></Term>
                      )}
                      {p.dignity === "mulatrikona" && (
                        <Term k="mulatrikona" plain><span className="badge badge-good">mulatrikona</span></Term>
                      )}
                      {p.dignity === "upadek" && (
                        <Term k="upadek" plain><span className="badge badge-warn">upadek</span></Term>
                      )}
                      <Term k={p.signRelacja === "władanie" ? "wladanie" : `znak_${p.signRelacja}`} plain>
                        <span className="badge" style={{
                          color: p.signRelacja === "władanie" || p.signRelacja === "przyjazny" ? "var(--success)"
                            : p.signRelacja === "wrogi" ? "var(--warn)" : "var(--muted)",
                          opacity: p.signRelacja === "neutralny" ? 0.75 : 1,
                        }}>
                          {p.signRelacja === "władanie" ? "u siebie"
                            : p.signRelacja === "przyjazny" ? "znak przyjaciela"
                            : p.signRelacja === "wrogi" ? "znak wroga" : "znak neutralny"}
                        </span>
                      </Term>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </details>
  );
}
