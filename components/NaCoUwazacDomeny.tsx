"use client";

import { useMemo, useState } from "react";
import { GRAHAS, type PlanetId } from "@/lib/astro/constants";
import type { CzynnikDomeny } from "@/lib/astro/finanseUczucia";
import { znakCzynnika } from "@/lib/astro/sila";
import { zastrzezenieGodnosciNaMinus } from "@/lib/astro/domInterpretacja";

/**
 * NA CO UWAŻAĆ (Finanse/Zawód/Zdrowie) — lustrzane odbicie RankingDomeny, tak jak
 * NaCoUwazac jest lustrem RankingGrah: te same znaczniki domeny, ale koniec
 * rankingu z tarciem (punkty < 0). Osobne, krótsze etykiety "na co uważać"
 * (uwaga/uwagaOpis), bo rola znaczącej planety ("władca 2. domu") to nie to
 * samo, co ostrzeżenie ("wydawanie na status") — inne pytanie, inna odpowiedź.
 */

const KOLOR_UWAGA = "#e0654f";

/** Jeden czynnik pokolorowany wg znaku (zielony = ciągnie w górę, czerwony = w dół). */
function Czynnik({ tekst }: { tekst: string }) {
  const plus = znakCzynnika(tekst) === 1;
  return <span style={{ color: plus ? "#6fbf9f" : "#e66767" }}>{plus ? "+" : "−"} {tekst}</span>;
}

function Dymek({ opis }: { opis: string }) {
  return (
    <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 8, pointerEvents: "none" }}>
      <div style={{
        background: "rgba(16, 34, 49, 0.98)", border: "1px solid var(--line)",
        borderRadius: 10, padding: "9px 13px", boxShadow: "0 10px 26px rgba(0,0,0,0.5)",
        animation: "fadeUp 0.15s var(--ease-out) both", fontSize: "0.82rem", color: "#e8eef2", lineHeight: 1.55,
      }}>
        {opis}
      </div>
    </div>
  );
}

export default function NaCoUwazacDomeny({ dane, uwaga, uwagaOpis }: {
  dane: CzynnikDomeny[];
  uwaga: Record<PlanetId, string>;
  uwagaOpis: Record<PlanetId, string>;
}) {
  const [rozwinieta, setRozwinieta] = useState<PlanetId | null>(null);
  const [najechana, setNajechana] = useState<PlanetId | null>(null);

  const trudne = useMemo(
    () => dane.filter((d) => d.ocena.punkty < 0).sort((a, b) => a.ocena.punkty - b.ocena.punkty).slice(0, 4),
    [dane],
  );
  const maxAbs = Math.max(...trudne.map((d) => Math.abs(d.ocena.punkty)), 1);
  const top3 = trudne.slice(0, 3);

  return (
    <div>
      <hr className="gold-rule" style={{ margin: "24px 0" }} />
      <p className="eyebrow" style={{ marginBottom: 6 }}>Na co uważać</p>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 18, lineHeight: 1.55 }}>
        Odwrotność powyższego rankingu: te same znaczniki, ale te, które w Twojej mapie działają
        z tarciem — punkty ujemne w tych samych wyliczeniach oceny. To nie wyrok, tylko miejsca, gdzie
        warto świadomie zwolnić, zanim zadziała naturalny odruch.
      </p>

      {trudne.length === 0 ? (
        <p className="muted" style={{ fontSize: "0.88rem" }}>
          W tych wyliczeniach oceny żaden ze znaczników nie wypada wyraźnie obciążony — to dobra
          wiadomość, ale nie znaczy braku wyzwań w ogóle: ten ranking to jeden wskaźnik, nie cała mapa.
        </p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginBottom: 24 }}>
            {top3.map((d, i) => {
              const g = GRAHAS[d.planeta];
              const zastrzezenie = zastrzezenieGodnosciNaMinus(d.dignity, g.pl);
              return (
                <div key={d.planeta} style={{
                  border: `1px solid ${KOLOR_UWAGA}66`, borderRadius: 12,
                  padding: "14px 16px", background: "rgba(255,255,255,0.02)",
                }}>
                  <p className="eyebrow" style={{ marginBottom: 6, color: KOLOR_UWAGA }}>#{i + 1} na co uważać</p>
                  <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", lineHeight: 1.4 }}>
                    <span style={{ color: g.color, fontSize: "1.2rem" }}>{g.symbol}</span> {uwaga[d.planeta]}
                  </p>
                  <p className="muted" style={{ fontSize: "0.8rem", marginTop: 6, lineHeight: 1.45 }}>
                    {g.pl} — {d.role[0]}
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
              const g = GRAHAS[d.planeta];
              const szerokosc = Math.max(6, (Math.abs(d.ocena.punkty) / maxAbs) * 100);
              const rozw = rozwinieta === d.planeta;
              const najechanaTeraz = najechana === d.planeta;
              return (
                <div key={d.planeta} style={{ position: "relative" }}>
                  <div
                    role="button" tabIndex={0} aria-expanded={rozw}
                    onClick={() => setRozwinieta(rozw ? null : d.planeta)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setRozwinieta(rozw ? null : d.planeta); } }}
                    onMouseEnter={() => setNajechana(d.planeta)}
                    onMouseLeave={() => setNajechana(null)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 8, cursor: "pointer",
                      background: rozw ? "rgba(255,255,255,0.04)" : "transparent", transition: "background 0.2s",
                    }}>
                    <span style={{ width: 20, textAlign: "center", color: g.color, fontSize: "1.05rem" }}>{g.symbol}</span>
                    <span style={{ width: 74, fontSize: "0.84rem", flexShrink: 0 }}>{g.pl}</span>
                    <div style={{ flex: 1, minWidth: 40, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                      <div style={{ width: `${szerokosc}%`, height: "100%", borderRadius: 4, background: KOLOR_UWAGA, transition: "width 0.5s var(--ease-out)" }} />
                    </div>
                    <span className="muted" style={{ fontSize: "0.76rem", width: 190, textAlign: "right", flexShrink: 0 }}>
                      {uwaga[d.planeta]}
                    </span>
                  </div>

                  {najechanaTeraz && !rozw && <Dymek opis={uwagaOpis[d.planeta]} />}

                  {rozw && (() => {
                    const zastrzezenie = zastrzezenieGodnosciNaMinus(d.dignity, g.pl);
                    return (
                    <div style={{ margin: "4px 0 10px 38px" }}>
                      <p style={{ fontSize: "0.85rem", lineHeight: 1.55, marginBottom: 6 }}>{uwagaOpis[d.planeta]}</p>
                      {zastrzezenie && (
                        <p style={{ fontSize: "0.8rem", lineHeight: 1.5, marginBottom: 6, color: "#e6a05a" }}>
                          {zastrzezenie}
                        </p>
                      )}
                      <p className="muted" style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>
                        <span style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.68rem" }}>Skąd to wynika w Twojej mapie:</span>{" "}
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
