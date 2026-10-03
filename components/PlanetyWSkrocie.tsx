"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { VedicChart } from "@/lib/astro/chart";
import { GRAHAS, RASIS, PLANET_ORDER, type PlanetId } from "@/lib/astro/constants";
import { kondycjaWskaznik, kondycjaZLiczby, poziomWzmocnienia, tematPlanetyNazwa, etykietaKondycjiNazwa, SILA_GODNOSCI } from "@/lib/astro/domInterpretacja";
import { karakiCzarowe, jogakaraka } from "@/lib/astro/karaki";
import { isVargottama, navamsaChart } from "@/lib/astro/varga";
import { grahaNazwa, rasiNazwa, dignityNazwa, type AstroLocale } from "@/lib/astro/i18nAstro";
import SekcjaZlota from "./SekcjaZlota";

/**
 * PLANETY W SKRÓCIE — jedna karta na planetę, zamiast rozsypanych po stronie
 * osobnych źródeł (tabela pozycji, godność, Karaki Czarowe, wargottama).
 * Łączy WSZYSTKIE kluczowe czynniki po ludzku: znak, dom, pasek kondycji
 * (godność), rolę w Karakach Czarowych (nie tylko Atmakarakę — wszystkie 8),
 * jogakarakę, wargottamę, retrogradację i spalenie — jedno zdanie syntezy
 * zamiast żargonu w dymkach.
 */

export default function PlanetyWSkrocie({ chart }: { chart: VedicChart }) {
  const t = useTranslations("PlanetyWSkrocie");
  const locale = useLocale() as AstroLocale;
  const [rozwinieta, setRozwinieta] = useState<PlanetId | null>(null);

  function zdanieSyntezy(id: PlanetId, etykieta: string): string {
    const temat = tematPlanetyNazwa(id, locale);
    const dobra = etykieta === "super" || etykieta === "dobrze";
    const zla = etykieta === "słabo" || etykieta === "źle";
    if (dobra) return t("synteza.dobra", { temat });
    if (zla) return t("synteza.zla", { temat });
    return t("synteza.neutralna", { temat });
  }

  const karaki = useMemo(() => (chart.angles ? karakiCzarowe(chart, locale) : []), [chart, locale]);
  const d9 = useMemo(() => navamsaChart(chart), [chart]);
  const rolaPlanety = useMemo(() => {
    const mapa = new Map<PlanetId, { skrot: string; pl: string; znaczenie: string }>();
    for (const k of karaki) mapa.set(k.planeta, k);
    return mapa;
  }, [karaki]);
  const jogakarakaId = chart.angles ? jogakaraka(chart.angles.lagnaSign) : null;

  return (
    <SekcjaZlota tytul={t("summary")}>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 18, lineHeight: 1.55 }}>
        {t("wstep")}
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
                <span style={{ width: 84, fontSize: "0.86rem", flexShrink: 0 }}>{grahaNazwa(g, locale)}</span>
                <span className="muted" style={{ width: 110, fontSize: "0.8rem", flexShrink: 0 }}>
                  {rasiNazwa(RASIS[p.sign], locale)}{chart.angles && ` · ${t("domKrotko")} ${p.house}`}
                </span>
                <span style={{ flex: 1, minWidth: 60, maxWidth: 160, height: 7, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                  <span style={{ display: "block", width: `${k.procent}%`, height: "100%", borderRadius: 4, background: k.kolor, transition: "width 0.4s var(--ease-out)" }} />
                </span>
                <span style={{ color: k.kolor, fontSize: "0.78rem", fontWeight: 600, width: 60, flexShrink: 0 }}>{etykietaKondycjiNazwa(k.etykieta, locale)}</span>
                <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {rola && (
                    <span className="badge" title={`${rola.pl} — ${rola.znaczenie}`}
                      style={{ borderColor: "rgba(147,166,179,0.4)", color: "#c3d0d8" }}>
                      {rola.skrot}
                    </span>
                  )}
                  {jestJogakaraka && <span className="badge badge-good" title={t("tytulJogakaraka")}>{t("badgeJogakaraka")}</span>}
                  {wargottama && <span className={klasaWargottamy} title={t("tytulWargottama")}>{t("badgeWargottama")}</span>}
                  {p.retrograde && id !== "rahu" && id !== "ketu" && <span className="badge" title={t("tytulRetro")}>℞</span>}
                  {p.combust && <span className="badge badge-warn" title={t("tytulSpalenie")}>{t("badgeSpalona")}</span>}
                  {p.dignity === "egzaltacja" && <span className="badge badge-good" title={t("tytulEgzaltacja")}>{dignityNazwa("egzaltacja", locale)}</span>}
                  {p.dignity === "mulatrikona" && <span className="badge badge-good" title={t("tytulMulatrikona")}>{dignityNazwa("mulatrikona", locale)}</span>}
                  {p.dignity === "upadek" && <span className="badge badge-warn" title={t("tytulUpadek")}>{dignityNazwa("upadek", locale)}</span>}
                  <span className="badge" title={t("tytulRelacja")} style={{
                    color: p.signRelacja === "władanie" || p.signRelacja === "przyjazny" ? "var(--success)"
                      : p.signRelacja === "wrogi" ? "var(--warn)" : "var(--muted)",
                    opacity: p.signRelacja === "neutralny" ? 0.75 : 1,
                  }}>
                    {dignityNazwa(p.signRelacja, locale)}
                  </span>
                </span>
              </div>
              {rozw && (
                <div style={{ margin: "4px 0 10px 40px", fontSize: "0.85rem", lineHeight: 1.6 }}>
                  <p style={{ marginBottom: 6 }}>{zdanieSyntezy(id, k.etykieta)}</p>
                  {d9 && (() => {
                    const dignD9 = d9.planets[id].dignity;
                    const kD9 = kondycjaWskaznik(dignD9);
                    const kOgolem = kondycjaZLiczby((SILA_GODNOSCI[p.dignity] + SILA_GODNOSCI[dignD9]) / 2);
                    return (
                      <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 4 }}>
                        <strong style={{ color: "var(--sand)" }}>{t("kondycjaLabel")}</strong>{" "}
                        {t("kondycjaLinia", {
                          etD1: etykietaKondycjiNazwa(k.etykieta, locale), dygD1: dignityNazwa(p.dignity, locale),
                          etD9: etykietaKondycjiNazwa(kD9.etykieta, locale), dygD9: dignityNazwa(dignD9, locale),
                        })}{" "}
                        → <strong style={{ color: kOgolem.kolor }}>{t("ogolnie", { etOgolem: etykietaKondycjiNazwa(kOgolem.etykieta, locale) })}</strong>.
                      </p>
                    );
                  })()}
                  {rola && (
                    <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 4 }}>
                      <strong style={{ color: "var(--sand)" }}>{rola.skrot} — {rola.pl}:</strong> {rola.znaczenie}.
                    </p>
                  )}
                  {jestJogakaraka && (
                    <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 4 }}>
                      <strong style={{ color: "var(--sand)" }}>{t("jogakarakaLabel")}</strong> {t("jogakarakaOpis")}
                    </p>
                  )}
                  {wargottama && (
                    <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 4 }}>
                      <strong style={{ color: "var(--sand)" }}>{t("wargottamaLabel")}</strong> {t("wargottamaOpis")}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SekcjaZlota>
  );
}
