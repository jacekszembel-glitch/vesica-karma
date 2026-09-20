"use client";

import type { VedicChart } from "@/lib/astro/chart";
import { wykryteJogiPosortowane } from "@/lib/astro/yogas";
import { GRAHAS } from "@/lib/astro/constants";
import Term from "@/components/Term";

/**
 * TALENTY (Z JOG) — dla początkujących, osobno od Predyspozycji. Ta sama
 * kategoria źródeł (BPHS) co Jogi i szczęście w trybie zaawansowanym
 * (wykryteJogi z yogas.ts), tylko podane prościej: karty zamiast rankingu
 * z paskami, bo jog jest zwykle 0-3 w mapie, nie 9 jak grah — ranking
 * paskowy nie miałby tu sensu. Odpowiada na INNE pytanie niż Predyspozycje:
 * Predyspozycje liczą siłę KAŻDEJ planety osobno (ocenaWladcy), jogi to
 * konkretne, nazwane układy KILKU planet naraz — rzadsze, bardziej
 * wyjątkowe. Brak jogi w mapie nie znaczy braku talentu w ogóle.
 */

export default function Talenty({ chart }: { chart: VedicChart }) {
  const jogi = wykryteJogiPosortowane(chart);

  return (
    <details className="card" style={{ marginBottom: 24 }} open>
      <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)" }}>
        Talenty (z jog)
      </summary>
      <p className="muted" style={{ fontSize: "0.84rem", margin: "12px 0 18px", lineHeight: 1.55 }}>
        <Term k="jogiklasyczne" plain>Jogi</Term> to klasyczne, nazwane kombinacje kilku planet naraz, uznawane
        za wskaźniki wrodzonego talentu i szczęścia — inny język niż Predyspozycje wyżej (te liczą
        siłę każdej planety z osobna). Jogi są rzadsze i bardziej wyjątkowe: większość map ma zero
        albo jedną-dwie, nie dziewięć jak w rankingu grah. Ich brak nie znaczy braku talentu — tylko
        brak akurat TEJ konkretnej, nazwanej kombinacji.
      </p>

      {jogi.length === 0 ? (
        <p className="muted" style={{ fontSize: "0.86rem", lineHeight: 1.55 }}>
          Żadna z klasycznych, nazwanych jog nie występuje w Twojej mapie w czystej formie — to
          normalne i dotyczy większości map. Twoje mocne strony wciąż dobrze widać w Predyspozycjach
          wyżej, które nie zależą od tego, czy trafi się akurat któraś z tych konkretnych kombinacji.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {jogi.map((j) => (
            <div key={j.id} style={{
              border: "1px solid rgba(111,191,159,0.4)", borderRadius: 12,
              padding: "14px 16px", background: "rgba(255,255,255,0.02)",
            }}>
              <p className="eyebrow" style={{ marginBottom: 6, color: "#6fbf9f" }}>Talent</p>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", lineHeight: 1.4, marginBottom: 6 }}>
                {j.planety.map((id) => (
                  <span key={id} style={{ color: GRAHAS[id].color, marginRight: 4 }}>{GRAHAS[id].symbol}</span>
                ))}
                {j.nazwa}
              </p>
              <p style={{ fontSize: "0.88rem", lineHeight: 1.5, marginBottom: 8 }}>{j.znaczenie}</p>
              <p className="muted" style={{ fontSize: "0.78rem", lineHeight: 1.45 }}>{j.uzasadnienie}</p>
            </div>
          ))}
        </div>
      )}
    </details>
  );
}
