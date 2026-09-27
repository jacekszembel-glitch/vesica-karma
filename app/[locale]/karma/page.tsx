"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import Link from "next/link";
import { buildChart, type VedicChart } from "@/lib/astro/chart";
import { numerology, type NumerologyResult } from "@/lib/astro/numerology";
import { odczytKarmy, syntezaKarmy, type OdczytKarmy, type Potwierdzenie } from "@/lib/astro/karma";
import { GRAHAS } from "@/lib/astro/constants";
import Term from "@/components/Term";
import OsZycia from "@/components/OsZycia";
import { loadBirth } from "@/lib/birthStore";
import { ukonczoneSystemyKarmy, type SystemKarmy } from "@/lib/koloKarmyGeometria";
import { wczytajOdczytDloni } from "@/lib/hiromancjaOdczytStore";

/**
 * KARMA — synteza trzech systemów w miejscu satelity "Co z tym zrobić?" na
 * Kole Karmy. Numerologia i astrologia dają tu POLICZONE potwierdzenie (ten
 * sam most co w karma.ts — Mulank/Bhagyank skonfrontowane z ich oceną w
 * mapie); chiromancja dokłada TRZECI, jakościowy głos z ostatniego zapisanego
 * odczytu AI dłoni (lib/hiromancjaOdczytStore.ts) — świadomie bez sztucznego
 * "potwierdzenia" liczbowego, bo to tekst AI, nie ocena punktowa planety.
 *
 * Dane wczytywane automatycznie (loadBirth) — bez osobnego formularza jak we
 * wcześniejszej wersji w 9domie, bo tu dane urodzenia są już wspólne dla
 * całego serwisu. Strona jest ZABLOKOWANA, dopóki wszystkie trzy systemy nie
 * są ukończone (patrz Koło Karmy / Mój Panel) — inaczej pokazuje, czego
 * brakuje, z linkiem wprost do brakującego systemu.
 */

const POTWIERDZENIE_OPIS: Record<Potwierdzenie, string> = {
  potwierdzone: "astrologia potwierdza",
  napiecie: "astrologia pokazuje napięcie",
  neutralne: "astrologia neutralna",
};
const POTWIERDZENIE_BADGE: Record<Potwierdzenie, string> = {
  potwierdzone: "badge badge-good",
  napiecie: "badge badge-warn",
  neutralne: "badge",
};

const SYSTEMY: { id: SystemKarmy; label: string; href: string }[] = [
  { id: "astrologia", label: "Astrologię", href: "/kosmogram" },
  { id: "numerologia", label: "Numerologię", href: "/numerologia" },
  { id: "hiromancja", label: "Chiromancję", href: "/hiromancja" },
];

/** Skromny odpowiednik akapitHtml z Interpretation.tsx — tylko pogrubienia
 *  i złamania linii, bo to jedna karta w środku strony, nie osobny panel. */
function tekstHtml(t: string): string {
  return t
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br/>");
}

export default function KarmaPage() {
  const [ukonczone, setUkonczone] = useState<Set<SystemKarmy> | null>(null);
  const [chart, setChart] = useState<VedicChart | null>(null);
  const [num, setNum] = useState<NumerologyResult | null>(null);
  const [dloniTekst, setDloniTekst] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydratacja z localStorage po zamontowaniu
    setUkonczone(ukonczoneSystemyKarmy());
    const b = loadBirth();
    if (b) {
      const effectiveTime = b.timeKnown ? b.time : "12:00";
      const local = DateTime.fromISO(`${b.date}T${effectiveTime}`, { zone: b.place.tz });
      if (local.isValid) {
        setChart(buildChart({
          date: local.toUTC().toJSDate(), latitude: b.place.lat, longitude: b.place.lon, timeKnown: b.timeKnown,
        }));
        setNum(numerology(b.date, b.name, "wedyjski", new Date().getFullYear()));
      }
    }
    const zapisany = wczytajOdczytDloni();
    if (zapisany) setDloniTekst(zapisany.text);
  }, []);

  if (!ukonczone) return null; // czekamy na hydratację z localStorage

  const brakujace = SYSTEMY.filter((s) => !ukonczone.has(s.id));

  if (brakujace.length > 0) {
    return (
      <div className="container section" style={{ maxWidth: 560, textAlign: "center" }}>
        <h1 style={{ marginBottom: 12 }}>Co z tym zrobić?</h1>
        <p className="muted" style={{ marginBottom: 28, lineHeight: 1.6 }}>
          Pełna synteza Karmy łączy trzy systemy naraz — jeszcze do zrobienia:{" "}
          {brakujace.map((s) => s.label).join(", ")}.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          {brakujace.map((s) => (
            <Link key={s.id} href={s.href} className="btn btn-primary">{s.label} →</Link>
          ))}
        </div>
      </div>
    );
  }

  const karma: OdczytKarmy | null = chart && num ? odczytKarmy(chart, num) : null;

  if (!karma || !chart) {
    return (
      <div className="container section" style={{ maxWidth: 560, textAlign: "center" }}>
        <h1 style={{ marginBottom: 12 }}>Co z tym zrobić?</h1>
        <p className="muted">Brakuje danych urodzenia — wróć na Kosmogram lub Numerologię i policz jeszcze raz.</p>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1 style={{ textAlign: "center" }}><Term k="karma">Karma</Term></h1>
      <p className="section-sub">
        Trzy warunki narodzin — czas, miejsce, rodzina (ciało, imię i nazwisko) — karmią trzy systemy
        odczytu. Numerologia i astrologia dają tu policzone potwierdzenie; chiromancja dokłada trzeci,
        jakościowy głos z Twojego ostatniego odczytu dłoni.
      </p>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Numerologia -> planeta -> ocena astrologiczna tej planety w TEJ mapie */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 20, marginBottom: 20 }}>
          {[karma.mulank, karma.bhagyank].map((o) => {
            const g = GRAHAS[o.planeta];
            return (
              <div key={o.etykieta} className="card">
                <p className="eyebrow" style={{ marginBottom: 6 }}>{o.etykieta} → {g.pl}</p>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.7rem", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: g.color }}>{g.symbol}</span> {o.cyfra}
                </p>
                <span className={POTWIERDZENIE_BADGE[o.potwierdzenie]}>{POTWIERDZENIE_OPIS[o.potwierdzenie]}</span>
                {o.ocena.czynniki.length > 0 && (
                  <p className="muted" style={{ fontSize: "0.8rem", marginTop: 10, lineHeight: 1.5 }}>
                    {o.ocena.czynniki.slice(0, 3).join("; ")}.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="card fade-up" style={{ marginBottom: 20, borderTop: "2px solid var(--sand)" }}>
          <p className="eyebrow" style={{ marginBottom: 8 }}>Synteza — numerologia × astrologia</p>
          <p style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>{syntezaKarmy(karma)}</p>
        </div>

        {/* Trzeci, jakosciowy glos — nie liczbowe potwierdzenie, tylko co dlon mowi o tym samym temacie */}
        {dloniTekst && (
          <div className="card fade-up" style={{ marginBottom: 20, borderTop: "2px solid var(--teal-soft)" }}>
            <p className="eyebrow" style={{ marginBottom: 8 }}>Trzeci głos — chiromancja</p>
            <div style={{ fontSize: "0.9rem", lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: `<p>${tekstHtml(dloniTekst)}</p>` }} />
            <p className="muted" style={{ fontSize: "0.76rem", marginTop: 14 }}>
              Ostatni zapisany odczyt dłoni — jakościowa obserwacja AI, nie policzone potwierdzenie jak
              wyżej. <Link href="/hiromancja" style={{ color: "var(--teal-soft)" }}>Odczytaj dłonie ponownie →</Link>
            </p>
          </div>
        )}

        {/* GDZIE — astrokartografia, z kontekstem konkretnych planet karmy */}
        <Link href="/astrokartografia" className="card fade-up" style={{ display: "block", color: "var(--text)", marginBottom: 20 }}>
          <p className="eyebrow" style={{ marginBottom: 4 }}>Gdzie</p>
          <p className="muted" style={{ fontSize: "0.86rem", lineHeight: 1.6 }}>
            Sprawdź na mapie linie <strong style={{ color: "var(--primary-soft)" }}>{GRAHAS[karma.mulank.planeta].pl}</strong> (Mulank)
            {" "}i <strong style={{ color: "var(--primary-soft)" }}>{GRAHAS[karma.bhagyank.planeta].pl}</strong> (Bhagyank) —
            tam, gdzie są najsilniejsze, ta karma realizuje się najłatwiej. <strong style={{ color: "var(--primary-soft)" }}>Przejdź do astrokartografii →</strong>
          </p>
        </Link>

        {/* KIEDY — os dasz, z dopiskiem gdy akurat trwa mahadasza jednej z dwoch planet karmy */}
        {chart.dashas.length > 0 && (
          <div className="panel-navy fade-up" style={{ padding: "30px 22px 20px" }}>
            <p className="eyebrow" style={{ marginBottom: 6 }}>Kiedy</p>
            <p className="muted" style={{ fontSize: "0.9rem", marginBottom: 14, lineHeight: 1.6 }}>
              Klasyczna zasada: temat planety jest najbardziej odczuwalny w jej własnej{" "}
              <Term k="mahadasza">mahadashy</Term>.
              {karma.aktualnaMahadasza && (karma.aktualnaMahadasza === karma.mulank.planeta || karma.aktualnaMahadasza === karma.bhagyank.planeta) && (
                <> Akurat teraz trwa mahadasha <strong style={{ color: "var(--sand)" }}>{GRAHAS[karma.aktualnaMahadasza].pl}</strong> —
                {" "}to jedna z Twoich dwóch planet karmy, dobry czas na jej temat.</>
              )}
            </p>
            <OsZycia dashas={chart.dashas} birth={chart.birth.date} chart={chart} />
          </div>
        )}
      </div>
    </div>
  );
}
