"use client";

import { useMemo, useState } from "react";
import type { VedicChart } from "@/lib/astro/chart";
import { GRAHAS, PLANET_ORDER, type PlanetId } from "@/lib/astro/constants";
import { ocenaWladcy, znakCzynnika } from "@/lib/astro/sila";
import { zastrzezenieGodnosciNaMinus } from "@/lib/astro/domInterpretacja";

/**
 * NA CO UWAŻAĆ — lustrzane odbicie Predyspozycji (RankingGrah), ta sama
 * forma (karty + paski + rozwijanie po kliknięciu), ale odwrotny koniec
 * tego samego rankingu: planety, które w tej mapie działają z największym
 * tarciem (punkty < 0). Świadomie tylko te, które faktycznie wypadają
 * słabo — jeśli mapa nie ma takich, mówimy to wprost zamiast zmyślać.
 * Ton konstruktywny: obszar do świadomej pracy, nie wyrok.
 */

/** Czerwień — tu ma sens: to sekcja ostrzegawcza, w przeciwieństwie do Predyspozycji. */
const KOLOR_UWAGA = "#e0654f";

const NA_CO_UWAZAC: Record<PlanetId, string> = {
  sun: "potrzeba racji i bycia w centrum",
  moon: "huśtawki nastroju, nadwrażliwość",
  mars: "impulsywność, konflikt zamiast rozmowy",
  mercury: "rozproszenie, gadatliwość bez treści",
  jupiter: "przesadny optymizm, pouczanie innych",
  venus: "unikanie trudnych rozmów dla świętego spokoju",
  saturn: "nadmierny krytycyzm wobec siebie",
  rahu: "nienasycenie, gonienie bez końca",
  ketu: "wycofanie, niedomykanie spraw",
};

const NA_CO_UWAZAC_OPIS: Record<PlanetId, string> = {
  sun: "Możesz łatwiej niż inni wchodzić w rolę tego, kto musi mieć rację i być zauważony. Warto pilnować, żeby potrzeba uznania nie zastępowała słuchania innych.",
  moon: "Nastrój i emocje mogą przejmować stery szybciej, niż zdążysz to zauważyć. Warto budować rutyny, które stabilizują, zanim fala emocji zdecyduje za Ciebie.",
  mars: "Łatwo zareagować szybciej, niż pomyśleć — zwłaszcza pod presją. Warto świadomie dać sobie chwilę, zanim odpowiesz działaniem na frustrację.",
  mercury: "Umysł potrafi skakać między wątkami szybciej, niż zdążysz je domknąć. Warto pilnować, żeby ilość słów nie zastępowała jakości przekazu.",
  jupiter: "Optymizm i chęć doradzania mogą przesłonić to, że druga strona wcale nie prosiła o radę. Warto czasem zapytać, zanim się poucza.",
  venus: "Łatwo wybrać wygodę i miły nastrój zamiast trudnej, ale potrzebnej rozmowy. Harmonia nie powinna oznaczać unikania konfliktu, który trzeba przejść.",
  saturn: "Krytycyzm wobec siebie bywa surowszy niż wobec kogokolwiek innego. Warto pamiętać, że dyscyplina bez odpoczynku prędzej czy później się mści.",
  rahu: "Pragnienie „więcej” rzadko kończy się uczuciem „wystarczy”. Warto świadomie nazywać moment, w którym już jest dobrze.",
  ketu: "Łatwo wycofać się z tematu, zanim zostanie naprawdę domknięty. Intuicyjne „to już nieważne” bywa ucieczką przed czymś ważnym.",
};

/** Jeden czynnik pokolorowany wg znaku (zielony = ciągnie w górę, czerwony = w dół) — bez tego np. „naturalny dobroczyńca" wygląda jak powód, dla którego planeta trafiła do sekcji ostrzegawczej. */
function Czynnik({ tekst }: { tekst: string }) {
  const plus = znakCzynnika(tekst) === 1;
  return <span style={{ color: plus ? "#6fbf9f" : "#e66767" }}>{plus ? "+" : "−"} {tekst}</span>;
}

function Dymek({ opis }: { opis: string }) {
  return (
    <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 8, pointerEvents: "none" }}>
      <div style={{
        background: "rgba(16, 34, 49, 0.98)", border: "1px solid var(--line)",
        borderRadius: 10, padding: "9px 13px",
        boxShadow: "0 10px 26px rgba(0,0,0,0.5)",
        animation: "fadeUp 0.15s var(--ease-out) both",
        fontSize: "0.82rem", color: "#e8eef2", lineHeight: 1.55,
      }}>
        {opis}
      </div>
    </div>
  );
}

export default function NaCoUwazac({ chart }: { chart: VedicChart }) {
  const [rozwinieta, setRozwinieta] = useState<PlanetId | null>(null);
  const [najechana, setNajechana] = useState<PlanetId | null>(null);

  const trudne = useMemo(() => {
    return PLANET_ORDER
      .map((id) => ({ id, ocena: ocenaWladcy(chart, id) }))
      .filter((d) => d.ocena.punkty < 0)
      .sort((a, b) => a.ocena.punkty - b.ocena.punkty)
      .slice(0, 4);
  }, [chart]);
  const maxAbs = Math.max(...trudne.map((d) => Math.abs(d.ocena.punkty)), 1);
  const top3 = trudne.slice(0, 3);

  return (
    <div>
      <hr className="gold-rule" style={{ margin: "24px 0" }} />
      <p className="eyebrow" style={{ marginBottom: 6 }}>Na co uważać</p>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 18, lineHeight: 1.55 }}>
        Odwrotność Predyspozycji: te same dziewięć grah, ale koniec rankingu, który działa
        z tarciem — punkty ujemne w tych samych wyliczeniach oceny. To nie wyrok ani wada charakteru,
        tylko miejsca, gdzie warto świadomie zwolnić, zanim zadziała naturalny odruch.
      </p>

      {trudne.length === 0 ? (
        <p className="muted" style={{ fontSize: "0.88rem" }}>
          W tych wyliczeniach oceny żadna planeta nie wypada wyraźnie obciążona — to dobra wiadomość,
          ale nie znaczy braku wyzwań w ogóle: ten ranking to jeden wskaźnik, nie cała mapa.
        </p>
      ) : (
        <>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 12, marginBottom: 24,
          }}>
            {top3.map((d, i) => {
              const g = GRAHAS[d.id];
              const zastrzezenie = zastrzezenieGodnosciNaMinus(chart.planets[d.id].dignity, g.pl);
              return (
                <div key={d.id} style={{
                  border: `1px solid ${KOLOR_UWAGA}66`, borderRadius: 12,
                  padding: "14px 16px", background: "rgba(255,255,255,0.02)",
                }}>
                  <p className="eyebrow" style={{ marginBottom: 6, color: KOLOR_UWAGA }}>
                    #{i + 1} na co uważać
                  </p>
                  <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", lineHeight: 1.4 }}>
                    <span style={{ color: g.color, fontSize: "1.2rem" }}>{g.symbol}</span> {NA_CO_UWAZAC[d.id]}
                  </p>
                  <p className="muted" style={{ fontSize: "0.8rem", marginTop: 6, lineHeight: 1.45 }}>
                    {g.pl} — <Czynnik tekst={d.ocena.czynniki[0]} />
                  </p>
                  {zastrzezenie && (
                    <p style={{ fontSize: "0.76rem", marginTop: 8, lineHeight: 1.4, color: "#e6a05a" }}>
                      {zastrzezenie}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            {trudne.map((d) => {
              const g = GRAHAS[d.id];
              const szerokosc = Math.max(6, (Math.abs(d.ocena.punkty) / maxAbs) * 100);
              const rozw = rozwinieta === d.id;
              const najechanaTeraz = najechana === d.id;
              return (
                <div key={d.id} style={{ position: "relative" }}>
                  <div
                    role="button" tabIndex={0} aria-expanded={rozw}
                    onClick={() => setRozwinieta(rozw ? null : d.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setRozwinieta(rozw ? null : d.id); } }}
                    onMouseEnter={() => setNajechana(d.id)}
                    onMouseLeave={() => setNajechana(null)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "7px 8px",
                      borderRadius: 8, cursor: "pointer",
                      background: rozw ? "rgba(255,255,255,0.04)" : "transparent",
                      transition: "background 0.2s",
                    }}>
                    <span style={{ width: 20, textAlign: "center", color: g.color, fontSize: "1.05rem" }}>{g.symbol}</span>
                    <span style={{ width: 74, fontSize: "0.84rem", flexShrink: 0 }}>{g.pl}</span>
                    <div style={{ flex: 1, minWidth: 40, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                      <div style={{
                        width: `${szerokosc}%`, height: "100%", borderRadius: 4,
                        background: KOLOR_UWAGA, transition: "width 0.5s var(--ease-out)",
                      }} />
                    </div>
                    <span className="muted" style={{ fontSize: "0.76rem", width: 150, textAlign: "right", flexShrink: 0 }}>
                      {NA_CO_UWAZAC[d.id].split(",")[0]}
                    </span>
                  </div>

                  {najechanaTeraz && !rozw && <Dymek opis={NA_CO_UWAZAC_OPIS[d.id]} />}

                  {rozw && (() => {
                    const zastrzezenie = zastrzezenieGodnosciNaMinus(chart.planets[d.id].dignity, g.pl);
                    return (
                    <div style={{ margin: "4px 0 10px 38px" }}>
                      <p style={{ fontSize: "0.85rem", lineHeight: 1.55, marginBottom: 6 }}>
                        {NA_CO_UWAZAC_OPIS[d.id]}
                      </p>
                      {zastrzezenie && (
                        <p style={{ fontSize: "0.8rem", lineHeight: 1.5, marginBottom: 6, color: "#e6a05a" }}>
                          {zastrzezenie}
                        </p>
                      )}
                      <p className="muted" style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>
                        <span style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.68rem" }}>
                          Skąd to wynika w Twojej mapie:
                        </span>{" "}
                        {d.ocena.czynniki.map((c, idx) => (
                          <span key={idx}>
                            <Czynnik tekst={c} />
                            {idx < d.ocena.czynniki.length - 1 && <span className="muted"> · </span>}
                          </span>
                        ))}
                      </p>
                    </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
