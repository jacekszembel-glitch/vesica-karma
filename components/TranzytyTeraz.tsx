"use client";

import { useMemo } from "react";
import type { VedicChart } from "@/lib/astro/chart";
import { GRAHAS, RASIS } from "@/lib/astro/constants";
import { gochara, sadeSati } from "@/lib/astro/transits";
import Term from "@/components/Term";
import PasekTranzytu, { czasTrwania } from "@/components/PasekTranzytu";

/**
 * TRANZYTY TERAZ (Gochara) — co robią tranzytujące planety WZGLĘDEM Twojej
 * mapy urodzeniowej, dziś. Reuzywa istniejące, już przetestowane wyliczenia
 * z transits.ts (gochara/sadeSati — dotąd używane tylko na /panel,
 * /sade-sati i /horoskop-2026, nie na samym /kosmogram, gdzie brakowało
 * tego zestawienia obok reszty mapy). Świadomie: 6 grah klasycznie
 * branych pod uwagę w gocharze (Słońce, Mars, Jowisz, Saturn, Rahu, Ketu)
 * — Księżyc/Merkury/Wenus poruszają się zbyt szybko, żeby "tranzyt dnia"
 * miał ten sam rodzaj trwałości.
 *
 * Układ wiersza CELOWO w dwóch liniach (nie jeden zbity wiersz ze wszystkim
 * naraz) — poprzednia wersja z pięcioma elementami o stałej szerokości plus
 * zdaniem dat na końcu łamała się na małych ekranach w chaotyczny sposób.
 */

const fmtDlugo = (d: Date) => d.toLocaleDateString("pl-PL", { year: "numeric", month: "long", day: "numeric" });

export default function TranzytyTeraz({ chart }: { chart: VedicChart }) {
  const tranzyty = useMemo(() => gochara(chart.planets.moon.longitude), [chart]);
  const sat = useMemo(() => sadeSati(chart.planets.moon.longitude), [chart]);
  const now = Date.now();

  return (
    <details className="card" style={{ marginBottom: 24 }}>
      <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)", marginBottom: 6 }}>
        <Term k="gochara">Tranzyty teraz</Term>
      </summary>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 18, lineHeight: 1.55 }}>
        Gdzie planety są dziś na niebie, liczone od Twojego Księżyca urodzeniowego — klasyczna
        metoda wedyjska (nie od ascendentu). Mapa wyżej to Twój stały układ; to poniżej to
        pogoda, która nad nim właśnie przechodzi — zmienia się z dnia na dzień, w przeciwieństwie
        do reszty strony.
      </p>

      {/* ═══ SATURN NAD KSIĘŻYCEM — osobny, wyróżniony boks (Sade Sati/dhaiya to inny kaliber niż reszta gochary) ═══ */}
      <div style={{
        marginBottom: 20, padding: "14px 18px", borderRadius: 10,
        background: sat.active ? "rgba(224,138,99,0.08)" : "rgba(111,191,159,0.06)",
        border: `1px solid ${sat.active ? "var(--warn)" : "var(--line-gold)"}`,
      }}>
        <p className="eyebrow" style={{ marginBottom: 6, color: sat.active ? "var(--warn)" : "var(--primary-soft)" }}>
          <Term k="sadesati" plain>Saturn nad Księżycem</Term>{sat.active ? " — Sade Sati trwa" : ""}
        </p>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{sat.opis}</p>

        {sat.phaseStart && sat.phaseEnd && (
          <div style={{ marginTop: 12 }}>
            <PasekTranzytu wchodzi={sat.phaseStart} wychodzi={sat.phaseEnd} kolor={sat.active ? "var(--warn)" : "var(--line-gold)"} />
            <p className="muted" style={{ fontSize: "0.78rem", marginTop: 8 }}>
              Ten etap zaczął się {fmtDlugo(sat.phaseStart)} i trwa mniej więcej do {fmtDlugo(sat.phaseEnd)}
              {sat.phaseEnd.getTime() > now && <> — zostało jeszcze <strong>{czasTrwania(sat.phaseEnd.getTime() - now)}</strong></>}.
            </p>
          </div>
        )}

        {!sat.active && sat.poprzedniaSadeSatiKoniec && sat.nastepnaSadeSatiStart && (
          <p className="muted" style={{ fontSize: "0.78rem", marginTop: 6, lineHeight: 1.5 }}>
            Poza oknem Sade Sati: poprzednia skończyła się orientacyjnie{" "}
            {sat.poprzedniaSadeSatiKoniec.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}, kolejna zacznie się
            orientacyjnie {sat.nastepnaSadeSatiStart.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}{" "}
            (za ok. {czasTrwania(sat.nastepnaSadeSatiStart.getTime() - now)}) — po średnim ruchu Saturna, nie co do dnia.
          </p>
        )}
      </div>

      {/* ═══ RESZTA GOCHARY ═══ */}
      <div style={{ display: "grid", gap: 14 }}>
        {tranzyty.filter((t) => t.id !== "saturn").map((t) => {
          const g = GRAHAS[t.id];
          return (
            <div key={t.id} style={{
              padding: "10px 10px 12px", borderRadius: 8,
              background: "rgba(255,255,255,0.015)", border: "1px solid var(--line-soft)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                <span style={{ width: 22, textAlign: "center", color: g.color, fontSize: "1.1rem" }}>{g.symbol}</span>
                <strong style={{ fontSize: "0.9rem" }}>{g.pl}</strong>
                <span className="muted" style={{ fontSize: "0.8rem" }}>
                  w {RASIS[t.sign].pl} · {t.house}. dom
                </span>
                <span className={`badge${t.favorable ? " badge-good" : " badge-warn"}`}>
                  {t.favorable ? "sprzyjający" : "wymagający"}
                </span>
                {t.retro && (
                  <Term k="retrogradacja" plain>
                    <span className="badge" title="Retrogradacja">℞ retrogradna</span>
                  </Term>
                )}
              </div>

              <p className="muted" style={{ fontSize: "0.82rem", marginLeft: 32, marginBottom: t.wchodzi || t.wychodzi ? 8 : 0 }}>
                Temat domu: {t.opis}. {t.favorable
                  ? <>Klasycznie {t.house}. dom sprzyja tranzytowi {g.pl} — ten temat powinien teraz iść Ci
                      łatwiej niż zwykle, bez większego wysiłku.</>
                  : <>Klasycznie {t.house}. dom bywa dla tranzytu {g.pl} trudniejszy — nie zapowiedź nieszczęścia,
                      tylko sygnał, że ten temat wymaga teraz więcej cierpliwości i świadomego działania niż zwykle.</>}
                {t.retro && (
                  <> Do tego retrogradacja — z Ziemi wygląda, jakby {g.pl} cofał się po niebie (złudzenie
                  optyczne, nie realny ruch wsteczny); w interpretacji to temat, który WRACA — coś, do czego
                  warto podejść drugi raz, zwykle głębiej niż za pierwszym, zamiast oczekiwać szybkiego, prostego efektu.</>
                )}
              </p>

              {(t.wchodzi || t.wychodzi) && (
                <div style={{ marginLeft: 32 }}>
                  <PasekTranzytu wchodzi={t.wchodzi} wychodzi={t.wychodzi} kolor={t.favorable ? "var(--success)" : "var(--warn)"} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
}
