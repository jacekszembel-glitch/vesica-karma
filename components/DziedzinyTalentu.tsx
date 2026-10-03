"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { VedicChart } from "@/lib/astro/chart";
import type { AstroLocale } from "@/lib/astro/i18nAstro";
import type { OcenaWladcyZWagami } from "@/lib/astro/sila";
import { dziedzinyTalentu, type DziedzinaTalentu } from "@/lib/astro/dziedzinyTalentu";
import { ROZKLADY_TALENTU, SKALE_TALENTU } from "@/lib/astro/srednieTalentu";
import OsDomeny, { type WierszOsi } from "@/components/OsDomeny";

/**
 * DZIEDZINY TALENTU — muzyka, sztuka, słowo… na TEJ SAMEJ osi co
 * Predyspozycje (OsDomeny): w lewo tarcie (wskaźniki, które hamują daną
 * dziedzinę), w prawo potencjał (wspierające), Bilans z średnią tej samej
 * dziedziny u innych ludzi (srednieTalentu.ts, 20 000 map). Wskaźniki
 * każdej dziedziny — planety, domy, jogi — opisane w dziedzinyTalentu.ts.
 */
export default function DziedzinyTalentu({ chart }: { chart: VedicChart }) {
  const t = useTranslations("DziedzinyTalentu");
  const locale = useLocale() as AstroLocale;

  const wiersze = useMemo((): WierszOsi<DziedzinaTalentu>[] | null => {
    const w = dziedzinyTalentu(chart, locale);
    if (!w) return null;
    return w.map((d) => {
      const wagi = d.czynniki.map((c) => c.punkty);
      const plus = wagi.filter((x) => x > 0).reduce((a, b) => a + b, 0);
      const minus = -wagi.filter((x) => x < 0).reduce((a, b) => a + b, 0);
      const ocena: OcenaWladcyZWagami = {
        punkty: d.punkty,
        ton: d.punkty >= 0.5 ? "wspierający" : d.punkty <= -0.75 ? "wymagający" : "mieszany",
        czynniki: d.czynniki.map((c) => c.tekst),
        wagi,
        plus: Math.round(plus * 100) / 100,
        minus: Math.round(minus * 100) / 100,
      };
      return { id: d.id, ocena };
    });
  }, [chart, locale]);

  return (
    <details className="card" style={{ marginBottom: 24 }} open>
      <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)" }}>
        {t("summary")}
      </summary>
      {!wiersze ? (
        <p className="muted" style={{ fontSize: "0.86rem", lineHeight: 1.55, marginTop: 12 }}>{t("brakGodziny")}</p>
      ) : (
        <>
          <OsDomeny<DziedzinaTalentu>
            eyebrow={t("eyebrow")}
            wstep={t("wstep")}
            wiersze={wiersze}
            skale={SKALE_TALENTU}
            rozklad={(id) => ROZKLADY_TALENTU[id]}
            nazwa={(id) => t(`nazwy.${id}`)}
            symbol={() => null}
            podpis={(w) => t(`krotko.${w.id}`)}
            krotko={(w) => t(`nazwy.${w.id}`)}
            opis={(id) => t(`opisy.${id}`)}
            teksty="DziedzinyTalentu"
            wgPorownania
          />
          <p className="muted" style={{ fontSize: "0.8rem", marginTop: 12, lineHeight: 1.55, fontStyle: "italic" }}>{t("uwaga")}</p>
        </>
      )}
    </details>
  );
}
