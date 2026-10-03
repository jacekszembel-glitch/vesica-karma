"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { VedicChart } from "@/lib/astro/chart";
import { PLANET_ORDER } from "@/lib/astro/constants";
import { ocenaWladcy } from "@/lib/astro/sila";
import { predyspozycjaOpisNazwa, mozliweZawodyNazwa } from "@/lib/astro/domInterpretacja";
import { wykryteJogiPosortowane } from "@/lib/astro/yogas";
import { TABELA_POTENCJAL, TABELA_TARCIE, TABELA_PREDYSPOZYCJE } from "@/lib/astro/percentyleDomen";
import type { AstroLocale } from "@/lib/astro/i18nAstro";
import Term from "@/components/Term";
import OsDomeny from "@/components/OsDomeny";

/**
 * PREDYSPOZYCJE — wszystkie 9 grah na wspólnej osi (OsDomeny): jedna ocena
 * (ocenaWladcy Z JOGAMI) zamiast dawnych dwóch list liczonych różnie
 * („Predyspozycje" z jogami, „Na co uważać" bez nich — przez to np. Saturn
 * bywał naraz na plusie i na minusie).
 */
export default function OsPredyspozycji({ chart }: { chart: VedicChart }) {
  const t = useTranslations("OsPredyspozycji");
  const tr = useTranslations("RankingGrah");
  const tu = useTranslations("NaCoUwazac");
  const locale = useLocale() as AstroLocale;

  const jogi = useMemo(() => wykryteJogiPosortowane(chart, locale), [chart, locale]);
  const wiersze = useMemo(
    () => PLANET_ORDER.map((id) => ({ id, ocena: ocenaWladcy(chart, id, jogi, locale) })),
    [chart, jogi, locale],
  );

  return (
    <OsDomeny
      dziedzina="predyspozycje"
      eyebrow={t("eyebrow")}
      wstep={t.rich("wstep", { graha: (c) => <Term k="graha">{c}</Term> })}
      wiersze={wiersze}
      skale={{ potencjal: TABELA_POTENCJAL, tarcie: TABELA_TARCIE, bilans: TABELA_PREDYSPOZYCJE }}
      podpis={(w) => tr(`predyspozycje.${w.id}`)}
      krotko={(w) => tr(`predyspozycje.${w.id}`)}
      opis={(id) => predyspozycjaOpisNazwa(id, locale)}
      uwagaTemat={(id) => tu(`tematy.${id}`)}
      uwagaOpis={(id) => tu(`opisy.${id}`)}
      dodatek={(id) => (
        <p className="muted" style={{ fontSize: "0.8rem", lineHeight: 1.55, marginTop: 8 }}>
          <span style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.68rem" }}>{tr("mozliweZawody")}</span>{" "}
          {mozliweZawodyNazwa(id, locale)}
        </p>
      )}
    />
  );
}
