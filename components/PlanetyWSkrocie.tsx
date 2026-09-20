"use client";

import { useMemo, useState } from "react";
import type { VedicChart } from "@/lib/astro/chart";
import { GRAHAS, PLANET_ORDER, type PlanetId } from "@/lib/astro/constants";
import { kondycjaWskaznik, poziomWzmocnienia, TEMAT_PLANETY } from "@/lib/astro/domInterpretacja";
import { karakiCzarowe, jogakaraka } from "@/lib/astro/karaki";
import { isVargottama } from "@/lib/astro/varga";

/**
 * PLANETY W SKRÓCIE — jedna karta na planetę, zamiast rozsypanych po stronie
 * osobnych źródeł (tabela pozycji, godność, Karaki Czarowe, wargottama).
 * Łączy WSZYSTKIE kluczowe czynniki po ludzku: znak, dom, pasek kondycji
 * (godność), rolę w Karakach Czarowych (nie tylko Atmakarakę — wszystkie 8),
 * jogakarakę, wargottamę, retrogradację i spalenie — jedno zdanie syntezy
 * zamiast żargonu w dymkach.
 */

function zdanieSyntezy(id: PlanetId, dignity: string, etykieta: string): string {
  const temat = TEMAT_PLANETY[id];
  const dobra = etykieta === "super" || etykieta === "dobrze";
  const zla = etykieta === "słabo" || etykieta === "źle";
  if (dobra) return `Reprezentuje ${temat} — ten temat działa tu wyraźnie na Twoją korzyść.`;
  if (zla) return `Reprezentuje ${temat} — ten temat wymaga tu więcej świadomej pracy niż przeciętnie, zanim się w pełni rozwinie.`;
  return `Reprezentuje ${temat} — ten temat rozwija się tu bez większych przeszkód, ale i bez szczególnego wzmocnienia.`;
}

export default function PlanetyWSkrocie({ chart }: { chart: VedicChart }) {
  const [rozwinieta, setRozwinieta] = useState<PlanetId | null>(null);

  const karaki = useMemo(() => (chart.angles ? karakiCzarowe(chart) : []), [chart]);
  const rolaPlanety = useMemo(() => {
    const mapa = new Map<PlanetId, { skrot: string; pl: string; znaczenie: string }>();
    for (const k of karaki) mapa.set(k.planeta, k);
    return mapa;
  }, [karaki]);
  const jogakarakaId = chart.angles ? jogakaraka(chart.angles.lagnaSign) : null;

  return (
    <details className="card" style={{ marginBottom: 24 }} open>
      <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)", marginBottom: 6 }}>
        Planety w skrócie
      </summary>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 18, lineHeight: 1.55 }}>
        Wszystko o każdej planecie w jednym miejscu — znak, dom, kondycja (pasek: zielony długi = super,
        zielony krótki = dobrze, niebieski = zmiennie, czerwony krótki = słabo, czerwony długi = źle) i jej
        rola w Twojej mapie. Kliknij planetę po pełne wyjaśnienie.
      </p>
      <div style={{ display: "grid", gap: 4 }}>
        {PLANET_ORDER.map((id) => {
          const p = chart.planets[id];
          const g = GRAHAS[id];
          const k = kondycjaWskaznik(p.dignity);
          const rozw = rozwinieta === id;
          const rola = rolaPlanety.get(id);
          const jestJogakaraka = jogakarakaId === id;
          const wargottama = chart.angles && isVargottama(p.longitude);
          const poziomWargottamy = poziomWzmocnienia(p.dignity);
          const klasaWargottamy = poziomWargottamy === "dobre" ? "badge badge-good"
            : poziomWargottamy === "zle" ? "badge badge-warn" : "badge";

          return (
            <div key={id}>
              <div
                role="button" tabIndex={0} aria-expanded={rozw}
                onClick={() => setRozwinieta(rozw ? null : id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setRozwinieta(rozw ? null : id); } }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 8px", borderRadius: 8, cursor: "pointer",
                  background: rozw ? "rgba(255,255,255,0.04)" : "transparent", transition: "background 0.2s", flexWrap: "wrap",
                }}>
                <span style={{ width: 22, textAlign: "center", color: g.color, fontSize: "1.1rem" }}>{g.symbol}</span>
                <span style={{ width: 84, fontSize: "0.86rem", flexShrink: 0 }}>{g.pl}</span>
                <span className="muted" style={{ width: 110, fontSize: "0.8rem", flexShrink: 0 }}>
                  w {p.signPl}{chart.angles && ` · dom ${p.house}`}
                </span>
                <span style={{ flex: 1, minWidth: 60, maxWidth: 160, height: 7, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                  <span style={{ display: "block", width: `${k.procent}%`, height: "100%", borderRadius: 4, background: k.kolor, transition: "width 0.4s var(--ease-out)" }} />
                </span>
                <span style={{ color: k.kolor, fontSize: "0.78rem", fontWeight: 600, width: 60, flexShrink: 0 }}>{k.etykieta}</span>
                <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {rola && (
                    <span className="badge" title={`${rola.pl} — ${rola.znaczenie}`}
                      style={{ borderColor: "rgba(147,166,179,0.4)", color: "#c3d0d8" }}>
                      {rola.skrot}
                    </span>
                  )}
                  {jestJogakaraka && <span className="badge badge-good" title="Jogakaraka — władca kendry i trikony naraz, jej okresy klasycznie znakomite">jogakaraka</span>}
                  {wargottama && <span className={klasaWargottamy} title="Wargottama — ten sam znak w D1 i D9, efekt wyjątkowo spójny i trwały (kolor podąża za godnością planety)">wargottama</span>}
                  {p.retrograde && id !== "rahu" && id !== "ketu" && <span className="badge" title="Retrogradacja — temat wraca, każe przepracować głębiej">℞</span>}
                  {p.combust && <span className="badge badge-warn" title="Spalona bliskością Słońca — łatwo przyćmiona niepewnością">spalona</span>}
                  {p.dignity === "egzaltacja" && <span className="badge badge-good" title="Egzaltacja — najsilniejsza możliwa pozycja tej planety">egzaltacja</span>}
                  {p.dignity === "mulatrikona" && <span className="badge badge-good" title="Mulatrikona — niemal jak we własnym znaku">mulatrikona</span>}
                  {p.dignity === "upadek" && <span className="badge badge-warn" title="Upadek — najtrudniejsza możliwa pozycja tej planety">upadek</span>}
                  <span className="badge" title="Relacja ze znakiem, w którym stoi planeta" style={{
                    color: p.signRelacja === "władanie" || p.signRelacja === "przyjazny" ? "var(--success)"
                      : p.signRelacja === "wrogi" ? "var(--warn)" : "var(--muted)",
                    opacity: p.signRelacja === "neutralny" ? 0.75 : 1,
                  }}>
                    {p.signRelacja === "władanie" ? "u siebie"
                      : p.signRelacja === "przyjazny" ? "znak przyjaciela"
                      : p.signRelacja === "wrogi" ? "znak wroga" : "znak neutralny"}
                  </span>
                </span>
              </div>
              {rozw && (
                <div style={{ margin: "4px 0 10px 40px", fontSize: "0.85rem", lineHeight: 1.6 }}>
                  <p style={{ marginBottom: 6 }}>{zdanieSyntezy(id, p.dignity, k.etykieta)}</p>
                  {rola && (
                    <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 4 }}>
                      <strong style={{ color: "var(--sand)" }}>{rola.skrot} — {rola.pl}:</strong> {rola.znaczenie}.
                    </p>
                  )}
                  {jestJogakaraka && (
                    <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 4 }}>
                      <strong style={{ color: "var(--sand)" }}>Jogakaraka:</strong> dla Twojej lagny ta planeta włada jednocześnie
                      domem narożnym i domem szczęścia — jej okresy uchodzą klasycznie za znakomite, niezależnie od jej zwykłej natury.
                    </p>
                  )}
                  {wargottama && (
                    <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 4 }}>
                      <strong style={{ color: "var(--sand)" }}>Wargottama:</strong> ten sam znak w mapie głównej i w nawamszy —
                      to, co widać na zewnątrz, ma pokrycie w głębszej strukturze. Efekt wyjątkowo spójny.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
}
