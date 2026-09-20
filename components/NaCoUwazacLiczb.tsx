"use client";

import { useMemo, useState } from "react";
import { wagiCyfr } from "@/lib/astro/numerologia-tresc";
import { VEDIC_PLANETS, type NumerologyResult } from "@/lib/astro/numerology";

/**
 * NA CO UWAŻAĆ (numerologia) — lustrzane odbicie Predyspozycji Liczb:
 * cyfry o zerowej łącznej wadze — nie występują ani w dacie urodzenia
 * (siatka Lo Shu), ani w żadnej z siedmiu liczb osobistych (w tym,
 * z imienia i nazwiska, Ekspresji, Duszy i Osobowości). To całościowe,
 * surowsze niż klasyczne „liczby brakujące" liczone tylko z daty — cyfra
 * musi być nieobecna wszędzie, żeby tu trafić. Ich temat nie jest wpisany
 * w naturalny wzorzec, więc nie przychodzi odruchowo — wymaga świadomego
 * rozwijania, nie jest wadą.
 */

const KOLOR_UWAGA = "#e0654f";

const OPIS_BRAKU: Record<number, string> = {
  1: "inicjatywa i samodzielność nie przychodzą odruchowo — warto świadomie uczyć się zaczynać, zamiast czekać na impuls z zewnątrz",
  2: "współpraca i cierpliwość wymagają treningu — łatwiej Ci działać solo niż dostroić się do tempa drugiej osoby",
  3: "swobodna ekspresja i radość nie są naturalnym odruchem — łatwiej Ci coś zrobić, niż lekko o tym opowiedzieć",
  4: "systematyczność i trwałe fundamenty trzeba budować świadomie — struktura nie przychodzi sama",
  5: "zmiana i elastyczność bywają trudniejsze niż dla innych — łatwiej trzymać się znanego niż eksperymentować",
  6: "odpowiedzialność za innych i poczucie domu nie są oczywiste — warto uczyć się troski, zamiast czekać, aż przyjdzie sama",
  7: "refleksja i samotność z wyboru nie są naturalnym trybem — łatwiej działać, niż się zatrzymać i zapytać dlaczego",
  8: "poczucie własnej siły materialnej i autorytetu trzeba budować krok po kroku — nie jest dane z automatu",
  9: "puszczanie i domykanie spraw nie przychodzi łatwo — łatwiej trzymać się czegoś, niż pozwolić temu odejść",
};

export default function NaCoUwazacLiczb({ numerology }: { numerology: NumerologyResult }) {
  const [rozwinieta, setRozwinieta] = useState<number | null>(null);
  const maImie = numerology.expression !== null;

  const brakujace = useMemo(
    () => wagiCyfr(numerology).filter((d) => d.razem === 0).sort((a, b) => a.cyfra - b.cyfra),
    [numerology],
  );
  const top3 = brakujace.slice(0, 3);

  return (
    <div>
      <hr className="gold-rule" style={{ margin: "24px 0" }} />
      <p className="eyebrow" style={{ marginBottom: 6 }}>Na co uważać</p>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 18, lineHeight: 1.55 }}>
        Odwrotność Predyspozycji: cyfry, których nie ma ani w dacie urodzenia, ani w żadnej
        z Twoich liczb osobistych — Drodze życia, Mulanku, Bhagyanku, Roku osobistym
        {maImie ? ", Ekspresji, Duszy ani Osobowości" : ""}. Ich temat nie jest wpisany w naturalny
        wzorzec, więc łatwiej go pominąć niż tematów, które się powtarzają. To nie wada, tylko
        obszar do świadomego rozwijania.{!maImie && " Podaj imię i nazwisko wyżej, żeby uwzględnić też Ekspresję, Duszę i Osobowość."}
      </p>

      {brakujace.length === 0 ? (
        <p className="muted" style={{ fontSize: "0.88rem" }}>
          Każda cyfra 1–9 pojawia się przynajmniej raz — czy to w dacie urodzenia, czy w którejś
          z Twoich liczb osobistych. Siatka Lo Shu nie wskazuje tu wyraźnych luk — to dobra
          wiadomość, ale nie jedyny wskaźnik.
        </p>
      ) : (
        <>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 12, marginBottom: 24,
          }}>
            {top3.map((d, i) => (
              <div key={d.cyfra} style={{
                border: `1px solid ${KOLOR_UWAGA}66`, borderRadius: 12,
                padding: "14px 16px", background: "rgba(255,255,255,0.02)",
              }}>
                <p className="eyebrow" style={{ marginBottom: 6, color: KOLOR_UWAGA }}>
                  #{i + 1} na co uważać
                </p>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", lineHeight: 1.4 }}>
                  <strong>{d.cyfra}</strong> — brakująca cyfra
                </p>
                <p className="muted" style={{ fontSize: "0.8rem", marginTop: 6, lineHeight: 1.45 }}>
                  planeta {VEDIC_PLANETS[d.cyfra]} · nieobecna w dacie i liczbach osobistych
                </p>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            {brakujace.map((d) => {
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
                      width: 20, textAlign: "center", color: KOLOR_UWAGA,
                      fontFamily: "var(--font-serif)", fontSize: "1.05rem",
                    }}>{d.cyfra}</span>
                    <span style={{ flex: 1, fontSize: "0.84rem" }}>brakująca cyfra</span>
                    <span className="muted" style={{ fontSize: "0.76rem", width: 150, textAlign: "right", flexShrink: 0 }}>
                      {OPIS_BRAKU[d.cyfra].split(",")[0]}
                    </span>
                  </div>
                  {rozw && (
                    <p className="muted" style={{ fontSize: "0.85rem", margin: "4px 0 10px 38px", lineHeight: 1.55 }}>
                      {OPIS_BRAKU[d.cyfra]}. Planeta władająca: {VEDIC_PLANETS[d.cyfra]}. Nieobecna
                      zarówno w dacie urodzenia, jak i we wszystkich liczonych liczbach osobistych.
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
