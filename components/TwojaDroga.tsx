"use client";

import type { VedicChart } from "@/lib/astro/chart";
import type { TematWspolny } from "@/lib/astro/tematy";
import type { DlonWLiczbach } from "@/lib/astro/zgodnosc";
import { spojnoscRak } from "@/lib/astro/spojnosc";
import { twojaDroga } from "@/lib/astro/droga";

/**
 * TABELA 5 — „Twoja droga”: czym się charakteryzuje (lib/astro/droga.ts). Każda cecha z danych,
 * ze źródłem pod spodem. Wersja robocza, pod tabelą 4.
 */
export default function TwojaDroga({ chart, dlon, d1, d9 }: {
  chart: VedicChart;
  dlon: DlonWLiczbach | null;
  d1: TematWspolny[];
  d9: TematWspolny[];
}) {
  const cechy = twojaDroga(chart, dlon, spojnoscRak(d1, d9));
  return (
    <section className="sp-sekcja" style={{ textAlign: "left" }}>
      <h3 className="sp-krok"><span>5</span> Twoja droga — czym się charakteryzuje</h3>
      <p className="muted" style={{ fontSize: "0.88rem", lineHeight: 1.7 }}>
        Z tego, co systemy potwierdzają, i z kluczowych punktów horoskopu: dokąd zmierzasz, jak działasz,
        czego uczysz się i co trwa teraz. Pod każdą cechą jest jej źródło.
      </p>
      <div className="sp-tabela-wrap">
        <table className="sp-tabela sp-droga2">
          <tbody>
            {cechy.map((c) => (
              <tr key={c.id}>
                <th scope="row">{c.cecha}</th>
                <td>
                  <p className="dr-wynik">
                    {c.wynik}
                    {c.potwierdzone === true && <span className="dr-potw"> ✦ potwierdza dłoń</span>}
                    {c.potwierdzone === false && <span className="dr-rozne"> ◐ dłoń mówi co innego</span>}
                  </p>
                  {c.opis && <p className="dr-opis">{c.opis}</p>}
                  <p className="dr-zrodla">{c.zrodla}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
