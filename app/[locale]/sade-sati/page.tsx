"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Term from "@/components/Term";
import DwieOsieDasz from "@/components/DwieOsieDasz";
import MandalaDwochDasz from "@/components/MandalaDwochDasz";
import { buildChart, type VedicChart } from "@/lib/astro/chart";
import { loadBirth } from "@/lib/birthStore";

/**
 * MAHADASHE, JOGI I DOSZE — skondensowana strona satelity "Mahadasze" na
 * Kole Karmy (dotąd placeholder "wkrótce"). Głównym widokiem jest DwieOsieDasz
 * (Chara Dasza × Wimszottari na jednej osi, z jogami/doszami wpisanymi w
 * każdy okres) — ten sam komponent co w /kosmogram w 9domie, tu jako
 * samodzielna, skondensowana strona zamiast fragmentu wiekszej strony.
 *
 * Dane wczytywane automatycznie (loadBirth), jak /karma — bez osobnego
 * formularza, bo dane urodzenia są już wspólne dla całego serwisu.
 */
export default function SadeSatiPage() {
  const t = useTranslations("SadeSatiPage");
  const [chart, setChart] = useState<VedicChart | null>(null);
  const [wiekLat, setWiekLat] = useState<number | null>(null);
  const [brakDanych, setBrakDanych] = useState(false);

  useEffect(() => {
    const b = loadBirth();
    if (!b) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydratacja z localStorage po zamontowaniu
      setBrakDanych(true);
      return;
    }
    const effectiveTime = b.timeKnown ? b.time : "12:00";
    const local = DateTime.fromISO(`${b.date}T${effectiveTime}`, { zone: b.place.tz });
    if (!local.isValid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- jw.
      setBrakDanych(true);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- jw.
    setChart(buildChart({
      date: local.toUTC().toJSDate(), latitude: b.place.lat, longitude: b.place.lon, timeKnown: b.timeKnown,
    }));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- jw.
    setWiekLat(DateTime.now().diff(local, "years").years);
  }, []);

  if (brakDanych) {
    return (
      <div className="container section" style={{ maxWidth: 560, textAlign: "center" }}>
        <h1 style={{ marginBottom: 12 }}>{t("tytul")}</h1>
        <p className="muted" style={{ marginBottom: 28, lineHeight: 1.6 }}>
          {t("brakDanych")}
        </p>
        <Link href="/kosmogram" className="btn btn-primary">{t("policzKosmogram")}</Link>
      </div>
    );
  }

  if (!chart) return null; // czekamy na hydratację z localStorage

  return (
    <div className="container section">
      <h1 style={{ textAlign: "center" }}>{t.rich("tytulRich", { joga: (c) => <Term k="joga">{c}</Term>, dosza: (c) => <Term k="dosza">{c}</Term> })}</h1>
      <p className="section-sub">
        {t.rich("opis", { mahadasza: (c) => <Term k="mahadasza">{c}</Term> })}
      </p>
      <MandalaDwochDasz wiekLat={wiekLat ?? undefined} />
      <DwieOsieDasz chart={chart} />
    </div>
  );
}
