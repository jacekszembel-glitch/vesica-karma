"use client";

import { useMemo, useState } from "react";
import { GRAHAS, type PlanetId } from "@/lib/astro/constants";
import type { CzynnikDomeny } from "@/lib/astro/finanseUczucia";
import { znakCzynnika } from "@/lib/astro/sila";
import { zastrzezenieGodnosci } from "@/lib/astro/domInterpretacja";
import { percentylSily } from "@/lib/astro/percentyleDomen";

/**
 * RANKING DOMENY — układ wizualny współdzielony przez Finanse/Zawód/Zdrowie
 * (na wzór RankingGrah, ale zamiast wszystkich 9 grah pokazuje tylko
 * planety pełniące rolę w danym temacie — patrz finanseUczucia.ts). Ten
 * sam TON_KOLOR i układ co w Predyspozycjach, żeby całość wyglądała jak
 * jedna rodzina komponentów, nie osobne stylistyki.
 */

const TON_KOLOR: Record<string, string> = {
  "wspierający": "#6fbf9f",
  "mieszany": "#b9c7d1",
  "wymagający": "#5b9bd5",
};

/** Jeden czynnik pokolorowany wg znaku (zielony = ciągnie w górę, czerwony = w dół) — bez tego np. „w znaku wroga" ginie wśród samych plusów. */
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

export default function RankingDomeny({ eyebrow, wstep, dane, opisy, tabelaPercentyli }: {
  eyebrow: string;
  wstep: React.ReactNode;
  dane: CzynnikDomeny[];
  opisy: Record<PlanetId, string>;
  /** Tabela percentyli TEJ domeny (patrz percentyleDomen.ts) — ta sama u wszystkich, więc wyniki są realnie porównywalne między osobami. */
  tabelaPercentyli: number[];
}) {
  const [rozwinieta, setRozwinieta] = useState<PlanetId | null>(null);
  const [najechana, setNajechana] = useState<PlanetId | null>(null);

  const zPercentylem = useMemo(
    () => dane.map((d) => ({ ...d, percentyl: percentylSily(d.ocena.punkty, tabelaPercentyli) })),
    [dane, tabelaPercentyli],
  );
  const top3 = zPercentylem.slice(0, 3);

  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</p>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 8, lineHeight: 1.55 }}>{wstep}</p>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 18, lineHeight: 1.55 }}>
        Liczba obok paska to percentyl siły tego wpływu — ile procent z 20 000 sprawdzonych map ma
        go słabiej zaznaczonego niż Ty (ta sama skala u każdego, więc wyniki są realnie porównywalne
        między osobami) — 50% to przeciętna siła, bliżej 100% to wpływ wyraźny i trudny do przeoczenia.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginBottom: 24 }}>
        {top3.map((d, i) => {
          const g = GRAHAS[d.planeta];
          const zastrzezenie = zastrzezenieGodnosci(d.dignity, g.pl);
          return (
            <div key={d.planeta} style={{
              border: `1px solid ${TON_KOLOR[d.ocena.ton]}66`, borderRadius: 12,
              padding: "14px 16px", background: "rgba(255,255,255,0.02)",
            }}>
              <p className="eyebrow" style={{ marginBottom: 6, color: TON_KOLOR[d.ocena.ton] }}>#{i + 1} czynnik</p>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", lineHeight: 1.4 }}>
                <span style={{ color: g.color, fontSize: "1.2rem" }}>{g.symbol}</span> {g.pl}
              </p>
              <p className="muted" style={{ fontSize: "0.8rem", marginTop: 6, lineHeight: 1.45 }}>
                {d.role.join(" · ")}
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

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center", margin: "0 0 14px 8px" }}>
        {([
          ["wspierający", "działa gładko"],
          ["mieszany", "zależnie od sytuacji"],
          ["wymagający", "działa z tarciem"],
        ] as const).map(([ton, opis]) => (
          <span key={ton} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.78rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, background: TON_KOLOR[ton], display: "inline-block" }} />
            <span className="muted">{ton} — {opis}</span>
          </span>
        ))}
      </div>

      <div style={{ display: "grid", gap: 4 }}>
        {zPercentylem.map((d) => {
          const g = GRAHAS[d.planeta];
          const szerokosc = Math.max(6, d.percentyl);
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
                  <div style={{ width: `${szerokosc}%`, height: "100%", borderRadius: 4, background: TON_KOLOR[d.ocena.ton], transition: "width 0.5s var(--ease-out)" }} />
                </div>
                <span className="muted" style={{
                  fontSize: "0.76rem", width: 44, textAlign: "right", flexShrink: 0,
                  fontVariantNumeric: "tabular-nums", color: TON_KOLOR[d.ocena.ton],
                }}>
                  {Math.round(d.percentyl)}%
                </span>
                <span className="muted" style={{ fontSize: "0.76rem", width: 190, textAlign: "right", flexShrink: 0 }}>
                  {d.role[0].split("—")[0].trim()}
                </span>
              </div>

              {najechanaTeraz && !rozw && <Dymek opis={opisy[d.planeta]} />}

              {rozw && (() => {
                const zastrzezenie = zastrzezenieGodnosci(d.dignity, g.pl);
                return (
                <div style={{ margin: "4px 0 10px 38px" }}>
                  <p style={{ fontSize: "0.85rem", lineHeight: 1.55, marginBottom: 6 }}>{opisy[d.planeta]}</p>
                  {zastrzezenie && (
                    <p style={{ fontSize: "0.8rem", lineHeight: 1.5, marginBottom: 6, color: "#e6a05a" }}>
                      {zastrzezenie}
                    </p>
                  )}
                  <p className="muted" style={{ fontSize: "0.78rem", lineHeight: 1.5, marginBottom: 6 }}>
                    <span style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.68rem" }}>Rola w Twojej mapie:</span>{" "}
                    {d.role.join(" · ")}
                  </p>
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
    </div>
  );
}
