"use client";

import { useLocale, useTranslations } from "next-intl";
import type { VedicChart } from "@/lib/astro/chart";
import { wrazliwoscDuchowa, opisOdcieniaNazwa, poziomWrazliwosciNazwa, type PoziomWrazliwosci } from "@/lib/astro/duchowaWrazliwosc";
import type { AstroLocale } from "@/lib/astro/i18nAstro";

const POZIOM_PROCENT: Record<PoziomWrazliwosci, number> = { "wyraźna": 90, "umiarkowana": 55, "subtelna": 25 };
const POZIOM_KOLOR: Record<PoziomWrazliwosci, string> = { "wyraźna": "#6fbf9f", "umiarkowana": "#e6c48a", "subtelna": "#11a7b6" };

export default function WrazliwoscDuchowa({ chart }: { chart: VedicChart }) {
  const t = useTranslations("WrazliwoscDuchowa");
  const locale = useLocale() as AstroLocale;
  const w = wrazliwoscDuchowa(chart, locale);
  const kolor = POZIOM_KOLOR[w.poziom];

  return (
    <details className="card" style={{ marginBottom: 24 }}>
      <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)" }}>
        {t("summary")}
      </summary>
      <p className="muted" style={{ fontSize: "0.84rem", margin: "12px 0 18px", lineHeight: 1.55 }}>
        {t("wstep")}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <span style={{ flex: 1, minWidth: 60, maxWidth: 260, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
          <span style={{
            display: "block", width: `${POZIOM_PROCENT[w.poziom]}%`, height: "100%", borderRadius: 4,
            background: kolor, transition: "width 0.4s var(--ease-out)",
          }} />
        </span>
        <span style={{ color: kolor, fontWeight: 600, fontSize: "0.9rem" }}>{poziomWrazliwosciNazwa(w.poziom, locale)}</span>
      </div>

      <p style={{ fontSize: "0.88rem", lineHeight: 1.55, marginBottom: 10 }}>{t(`opisy.${w.poziom}`)}</p>

      {w.odcien && (
        <p className="muted" style={{ fontSize: "0.84rem", lineHeight: 1.55, marginBottom: 10 }}>
          {t("przechylaSie")} <strong style={{ color: "var(--sand)" }}>{opisOdcieniaNazwa(w.odcien, locale)}</strong>.
        </p>
      )}

      {w.czynniki.length > 0 ? (
        <p className="muted" style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>
          <span style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.68rem" }}>
            {t("skadWynika")}
          </span>{" "}
          {w.czynniki.join(" · ")}
        </p>
      ) : (
        <p className="muted" style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>
          {t("brakCzynnikow")}
        </p>
      )}
    </details>
  );
}
