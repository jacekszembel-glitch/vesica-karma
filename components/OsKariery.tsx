"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { VedicChart } from "@/lib/astro/chart";
import { GRAHAS, PLANET_ORDER, type PlanetId } from "@/lib/astro/constants";
import { grahaNazwa, type AstroLocale } from "@/lib/astro/i18nAstro";
import { ocenaKariery } from "@/lib/astro/karieraWedyjska";
import { ROZKLADY_KARIERY, SKALE_KARIERY } from "@/lib/astro/srednieKariery";
import { mozliweZawodyNazwa } from "@/lib/astro/domInterpretacja";
import OsDomeny from "@/components/OsDomeny";
import SekcjaZlota from "./SekcjaZlota";

/**
 * ZAWÓD I KARIERA — planety realnie związane z 10. domem w tej mapie
 * (karieraWedyjska.ts), na tej samej osi co Predyspozycje. Kolejność wg siły
 * związku z karierą, bilans porównany z tą samą planetą-wskaźnikiem kariery
 * u innych ludzi (srednieKariery.ts).
 */
export default function OsKariery({ chart }: { chart: VedicChart }) {
  const t = useTranslations("ZawodKariera");
  const tr = useTranslations("RankingGrah");
  const locale = useLocale() as AstroLocale;

  const wiersze = useMemo(() => ocenaKariery(chart, locale), [chart, locale]);
  const zwiazek = useMemo(() => new Map(wiersze?.map((w) => [w.id, w.zwiazek]) ?? []), [wiersze]);
  // pary trzech planet najsilniej związanych z karierą (wiersze są już posortowane wg związku);
  // klucz pary w kolejności PLANET_ORDER, jak w tekstach ZawodKariera.pary
  const pary = useMemo(() => {
    const top = (wiersze ?? []).slice(0, 3).map((w) => w.id);
    const para = (a: PlanetId, b: PlanetId): [PlanetId, PlanetId] =>
      PLANET_ORDER.indexOf(a) < PLANET_ORDER.indexOf(b) ? [a, b] : [b, a];
    const wynik: [PlanetId, PlanetId][] = [];
    if (top.length >= 2) wynik.push(para(top[0], top[1]));
    if (top.length >= 3) wynik.push(para(top[0], top[2]), para(top[1], top[2]));
    return wynik;
  }, [wiersze]);

  return (
    <SekcjaZlota tytul={t("summary")}>
      {!wiersze ? (
        <p className="muted" style={{ fontSize: "0.86rem", lineHeight: 1.55, marginTop: 12 }}>{t("brakGodziny")}</p>
      ) : (
        <>
          <OsDomeny<PlanetId>
            eyebrow={t("eyebrow")}
            wstep={t("wstep")}
            wiersze={wiersze.map((w) => ({ id: w.id, ocena: w.ocena }))}
            skale={SKALE_KARIERY}
            rozklad={(id) => ROZKLADY_KARIERY[id]}
            kolejnosc={(id) => zwiazek.get(id) ?? 0}
            podpis={(w) => t(`krotko.${w.id}`)}
            krotko={(w) => t(`krotko.${w.id}`)}
            opis={(id) => t(`opisy.${id}`)}
            uwagaTemat={(id) => t(`uwagaTematy.${id}`)}
            uwagaOpis={(id) => t(`uwagaOpisy.${id}`)}
            teksty="ZawodKariera"
            dodatek={(id) => (
              <p className="muted" style={{ fontSize: "0.8rem", lineHeight: 1.55, marginTop: 8 }}>
                <span style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.68rem" }}>{tr("mozliweZawody")}</span>{" "}
                {mozliweZawodyNazwa(id, locale)}
              </p>
            )}
          />
          {pary.length > 0 && (
            <div style={{ borderTop: "1px solid var(--line-soft)", marginTop: 20, paddingTop: 16 }}>
              <p className="eyebrow" style={{ color: "var(--sand)", marginBottom: 6, textAlign: "left" }}>{t("kierunekTytul")}</p>
              <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 10, lineHeight: 1.55 }}>{t("kierunekWstep")}</p>
              {pary.map(([a, b], i) => (
                <p key={`${a}-${b}`} style={{ fontSize: i === 0 ? "0.92rem" : "0.86rem", lineHeight: 1.6, marginBottom: 8 }}>
                  <strong>
                    <span style={{ color: GRAHAS[a].color }} aria-hidden="true">{GRAHAS[a].symbol}</span> {grahaNazwa(GRAHAS[a], locale)}
                    {" + "}
                    <span style={{ color: GRAHAS[b].color }} aria-hidden="true">{GRAHAS[b].symbol}</span> {grahaNazwa(GRAHAS[b], locale)}
                  </strong>
                  {i === 0 && <span className="muted" style={{ fontSize: "0.74rem" }}> · {t("kierunekGlowny")}</span>}
                  {" — "}{t(`pary.${a}-${b}`)}
                </p>
              ))}
            </div>
          )}
          <p className="muted" style={{ fontSize: "0.8rem", marginTop: 12, lineHeight: 1.55, fontStyle: "italic" }}>{t("uwaga")}</p>
        </>
      )}
    </SekcjaZlota>
  );
}
