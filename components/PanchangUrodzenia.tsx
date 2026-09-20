"use client";

import { useMemo } from "react";
import { DateTime } from "luxon";
import { panchang } from "@/lib/astro/panchang";
import { GRAHAS, RASI_LOC } from "@/lib/astro/constants";
import Term from "@/components/Term";

/**
 * PAŃĆANG URODZENIA — pięć „kończyn" wedyjskiego dnia w chwili urodzenia
 * (tithi, wara, nakszatra, joga, karana). Te same wyliczenia co /dzis
 * (panchang() w panchang.ts), tu zastosowane do momentu urodzenia zamiast
 * dzisiejszej daty.
 *
 * Wara (dzień tygodnia) NIE jest liczona z panchang().vara — ta funkcja
 * czyta Date.getDay() w strefie PRZEGLĄDARKI widza, co dla „dzisiaj" jest
 * zamierzone, ale dla urodzenia dałoby dzień tygodnia widza, nie dzień
 * w miejscu urodzenia. Liczymy więc wprost z lokalnej daty kalendarzowej
 * (isoDate z formularza), niezależnie od strefy czasowej przeglądarki.
 */

const VARA_PL: { pl: string; lord: keyof typeof GRAHAS }[] = [
  { pl: "niedziela", lord: "sun" }, { pl: "poniedziałek", lord: "moon" },
  { pl: "wtorek", lord: "mars" }, { pl: "środa", lord: "mercury" },
  { pl: "czwartek", lord: "jupiter" }, { pl: "piątek", lord: "venus" },
  { pl: "sobota", lord: "saturn" },
];

export default function PanchangUrodzenia({ birthUtc, isoDate }: { birthUtc: Date; isoDate: string }) {
  const p = useMemo(() => panchang(birthUtc), [birthUtc]);
  const wara = useMemo(() => {
    const jsDay = DateTime.fromISO(isoDate).weekday % 7; // Luxon: 1=pon…7=nie → 0=nie…6=sob
    return VARA_PL[jsDay];
  }, [isoDate]);

  return (
    <details className="card" style={{ marginBottom: 24 }}>
      <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)", marginBottom: 6 }}>
        Pańćang urodzenia
      </summary>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 16, lineHeight: 1.55 }}>
        Pięć „kończyn" wedyjskiego dnia w chwili Twojego urodzenia — klasyczny dodatek do
        samej mapy planet, używany m.in. do wyboru pomyślnych dat (muhurta).
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <Term k="tithi" plain>
          <span className="badge">{p.tithi.name} · {p.tithi.paksha.split(" ")[0]} ({p.tithi.percent}%)</span>
        </Term>
        <span className="badge">{GRAHAS[wara.lord].symbol} {wara.pl}</span>
        <Term k="nakszatra" plain>
          <span className="badge">☾ {p.moonNakshatra.nakshatra.pl} p.{p.moonNakshatra.pada}</span>
        </Term>
        <Term k="joga" plain>
          <span className={p.yoga.auspicious ? "badge badge-good" : "badge badge-warn"}>
            joga {p.yoga.name} — {p.yoga.auspicious ? "sprzyjająca" : "wymagająca"}
          </span>
        </Term>
        <Term k="karana" plain>
          <span className={p.karana.isBhadra ? "badge badge-warn" : "badge badge-good"}>
            karana {p.karana.name}{p.karana.isBhadra ? " (Bhadra) — niesprzyjająca" : " — sprzyjająca"}
          </span>
        </Term>
        <span className="badge">Księżyc w {RASI_LOC[p.moonSign]}</span>
      </div>
      <p className="muted" style={{ fontSize: "0.82rem", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--sand)" }}>Co to znaczy:</strong> joga i karana to dwie z pięciu
        „kończyn" dnia klasycznie oceniane pod kątem sprzyjania — Twoja joga {p.yoga.name} jest{" "}
        {p.yoga.auspicious ? "z grupy sprzyjających (18 z 27 klasycznych jog)" : "z grupy wymagających (9 z 27) — nie oznacza to nic złego w samej mapie, tylko że dzień urodzenia niósł nieco więcej tarcia w tle"};{" "}
        karana {p.karana.name} {p.karana.isBhadra ? "to Bhadra — klasycznie odradzana do zaczynania ważnych spraw, choć na samo urodzenie nie ma to wpływu" : "jest sprzyjająca"}.
        Tithi i nakszatra to fakty opisowe (faza Księżyca i jego pozycja), nie ocena dobra/zła.
      </p>
    </details>
  );
}
