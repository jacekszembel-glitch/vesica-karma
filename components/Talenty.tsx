"use client";

import { useLocale, useTranslations } from "next-intl";
import type { VedicChart } from "@/lib/astro/chart";
import { wykryteJogiPosortowane } from "@/lib/astro/yogas";
import { GRAHAS } from "@/lib/astro/constants";
import type { AstroLocale } from "@/lib/astro/i18nAstro";
import Term from "@/components/Term";
import SekcjaZlota from "./SekcjaZlota";

/**
 * TALENTY (Z JOG) — dla początkujących, osobno od Predyspozycji. Ta sama
 * kategoria źródeł (BPHS) co Jogi i szczęście w trybie zaawansowanym
 * (wykryteJogi z yogas.ts), tylko podane prościej: karty zamiast rankingu
 * z paskami, bo jog jest zwykle 0-3 w mapie, nie 9 jak grah — ranking
 * paskowy nie miałby tu sensu. Odpowiada na INNE pytanie niż Predyspozycje:
 * Predyspozycje liczą siłę KAŻDEJ planety osobno (ocenaWladcy), jogi to
 * konkretne, nazwane układy KILKU planet naraz — rzadsze, bardziej
 * wyjątkowe. Brak jogi w mapie nie znaczy braku talentu w ogóle.
 */

export default function Talenty({ chart }: { chart: VedicChart }) {
  const t = useTranslations("Talenty");
  const locale = useLocale() as AstroLocale;
  const jogi = wykryteJogiPosortowane(chart, locale);

  return (
    <SekcjaZlota tytul={t("summary")}>
      <p className="muted" style={{ fontSize: "0.84rem", margin: "12px 0 18px", lineHeight: 1.55 }}>
        {t.rich("wstep", { jogiklasyczne: (c) => <Term k="jogiklasyczne" plain>{c}</Term> })}
      </p>

      {jogi.length === 0 ? (
        <p className="muted" style={{ fontSize: "0.86rem", lineHeight: 1.55 }}>
          {t("brak")}
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {jogi.map((j) => (
            <div key={j.id} style={{ padding: "4px 0" }}>
              <p className="eyebrow" style={{ marginBottom: 6 }}>{t("talent")}</p>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", lineHeight: 1.4, marginBottom: 6 }}>
                {j.planety.map((id) => (
                  <span key={id} style={{ color: GRAHAS[id].color, marginRight: 4 }}>{GRAHAS[id].symbol}</span>
                ))}
                {j.nazwa}
              </p>
              <p style={{ fontSize: "0.88rem", lineHeight: 1.5, marginBottom: 8 }}>{j.znaczenie}</p>
              <p className="muted" style={{ fontSize: "0.78rem", lineHeight: 1.45 }}>{j.uzasadnienie}</p>
            </div>
          ))}
        </div>
      )}
    </SekcjaZlota>
  );
}
