"use client";

import { useMemo, useState } from "react";
import { ZNACZENIE_CYFRY, wagiCyfr } from "@/lib/astro/numerologia-tresc";
import { VEDIC_PLANETS, type NumerologyResult } from "@/lib/astro/numerology";

/**
 * PREDYSPOZYCJE (numerologia) — odpowiednik RankingGrah z kosmogramu, ale
 * z numerologii: cyfra o największej łącznej wadze (siatka Lo Shu z daty
 * urodzenia + wszystkie liczby osobiste — Droga życia, Mulank, Bhagyank,
 * Rok osobisty, a gdy podano imię i nazwisko, także Ekspresja, Dusza
 * i Osobowość) to temat wpisany najmocniej w naturalny wzorzec. Całościowe
 * ujęcie — nie tylko surowe cyfry z daty. Ta sama forma (karty #1/#2/#3
 * + paski + rozwijanie po kliknięciu) co w kosmogramie.
 */

const KOLOR = "#e6c48a";

export default function PredyspozycjeLiczb({ numerology }: { numerology: NumerologyResult }) {
  const [rozwinieta, setRozwinieta] = useState<number | null>(null);
  const maImie = numerology.expression !== null;

  const ranking = useMemo(
    () => wagiCyfr(numerology)
      .filter((d) => d.razem > 0)
      .sort((a, b) => b.razem - a.razem || a.cyfra - b.cyfra),
    [numerology],
  );
  const maxRazem = Math.max(...ranking.map((d) => d.razem), 1);
  const top3 = ranking.slice(0, 3);

  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: 6 }}>Predyspozycje</p>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 18, lineHeight: 1.55 }}>
        Ranking cyfr wg łącznej wagi: ile razy cyfra powtarza się w dacie urodzenia (siatka Lo Shu)
        plus ile z Twoich liczb osobistych się do niej redukuje — Droga życia, Mulank, Bhagyank,
        Rok osobisty{maImie ? ", Ekspresja, Dusza i Osobowość" : ""}. To całościowe ujęcie, nie
        tylko surowe cyfry z daty.{!maImie && " Podaj imię i nazwisko w formularzu wyżej, żeby doliczyć Ekspresję, Duszę i Osobowość."}
        {" "}Kliknij cyfrę, żeby zobaczyć pełny rozkład.
      </p>

      {ranking.length === 0 ? (
        <p className="muted" style={{ fontSize: "0.88rem" }}>
          Żadna cyfra nie wyróżnia się wagą — wszystkie tematy występują co najwyżej raz,
          bez wyraźnej dominanty.
        </p>
      ) : (
        <>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 12, marginBottom: 24,
          }}>
            {top3.map((d, i) => (
              <div key={d.cyfra} style={{
                border: `1px solid ${KOLOR}66`, borderRadius: 12,
                padding: "14px 16px", background: "rgba(255,255,255,0.02)",
              }}>
                <p className="eyebrow" style={{ marginBottom: 6, color: KOLOR }}>
                  #{i + 1} predyspozycja
                </p>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", lineHeight: 1.4 }}>
                  <strong>{d.cyfra}</strong> — {ZNACZENIE_CYFRY[d.cyfra]}
                </p>
                <p className="muted" style={{ fontSize: "0.8rem", marginTop: 6, lineHeight: 1.45 }}>
                  planeta {VEDIC_PLANETS[d.cyfra]} · {d.razem}× łącznie
                  {d.zDaty > 0 && ` (${d.zDaty}× w dacie`}
                  {d.zDaty > 0 && d.zLiczbOsobistych.length > 0 && `, `}
                  {d.zLiczbOsobistych.length > 0 && d.zLiczbOsobistych.join(", ")}
                  {d.zDaty > 0 && ")"}
                </p>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            {ranking.map((d) => {
              const szerokosc = Math.max(6, (d.razem / maxRazem) * 100);
              const rozw = rozwinieta === d.cyfra;
              return (
                <div key={d.cyfra}>
                  <div
                    role="button" tabIndex={0} aria-expanded={rozw}
                    onClick={() => setRozwinieta(rozw ? null : d.cyfra)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setRozwinieta(rozw ? null : d.cyfra); } }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "7px 8px",
                      borderRadius: 8, cursor: "pointer",
                      background: rozw ? "rgba(255,255,255,0.04)" : "transparent",
                      transition: "background 0.2s",
                    }}>
                    <span style={{
                      width: 20, textAlign: "center", color: KOLOR,
                      fontFamily: "var(--font-serif)", fontSize: "1.05rem",
                    }}>{d.cyfra}</span>
                    <span style={{ width: 74, fontSize: "0.84rem", flexShrink: 0 }}>{d.razem}× łącznie</span>
                    <div style={{ flex: 1, minWidth: 40, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                      <div style={{
                        width: `${szerokosc}%`, height: "100%", borderRadius: 4,
                        background: KOLOR, transition: "width 0.5s var(--ease-out)",
                      }} />
                    </div>
                    <span className="muted" style={{ fontSize: "0.76rem", width: 150, textAlign: "right", flexShrink: 0 }}>
                      {ZNACZENIE_CYFRY[d.cyfra].split(" — ")[0]}
                    </span>
                  </div>
                  {rozw && (
                    <p className="muted" style={{ fontSize: "0.85rem", margin: "4px 0 10px 38px", lineHeight: 1.55 }}>
                      {ZNACZENIE_CYFRY[d.cyfra]}. Planeta władająca: {VEDIC_PLANETS[d.cyfra]}.{" "}
                      {d.zDaty > 0 && `Powtarza się ${d.zDaty}× w dacie urodzenia. `}
                      {d.zLiczbOsobistych.length > 0
                        ? `Pokrywa się z: ${d.zLiczbOsobistych.join(", ")}.`
                        : "Nie pokrywa się z żadną z Twoich liczb osobistych — waga wyłącznie z daty urodzenia."}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
