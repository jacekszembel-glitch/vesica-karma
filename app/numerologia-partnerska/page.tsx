"use client";

import { useState } from "react";
import Link from "next/link";
import { numerologiaPartnerska, type NumPartnerResult } from "@/lib/astro/numerologia-partnerska";
import { SceneRelacje } from "@/components/infographics";
import ParyNav from "@/components/ParyNav";
import DateInput from "@/components/DateInput";

/**
 * Landing SEO: „numerologia partnerska" / „kalkulator miłości".
 * Szybki wynik bez rejestracji + lejek do głębszego Guna Milan (/dopasowanie).
 */

const FAQ = [
  {
    q: "Czym jest numerologia partnerska?",
    a: "To porównanie dróg życia dwojga ludzi — liczb wyliczanych z dat urodzenia. Droga życia opisuje naturalny sposób działania, potrzeby i motywacje, a zestawienie dwóch liczb pokazuje, gdzie energie pary współgrają, a gdzie potrzebują świadomej pracy.",
  },
  {
    q: "Jak liczy się drogę życia?",
    a: "Sumuje się wszystkie cyfry daty urodzenia i redukuje do jednej cyfry (1–9), zatrzymując liczby mistrzowskie 11, 22 i 33. Przykład: 15.06.1990 → 1+5+0+6+1+9+9+0 = 31 → 3+1 = 4.",
  },
  {
    q: "Czy niski wynik oznacza, że nie pasujemy do siebie?",
    a: "Nie. Wynik pokazuje, ile pracy związek wymaga „z natury” — pary o różnych wibracjach często rozwijają się najmocniej, bo uczą się od siebie tego, czego same nie mają. Wynik to mapa, nie wyrok.",
  },
  {
    q: "Czym różni się ten kalkulator od dopasowania wedyjskiego?",
    a: "Numerologia partnerska patrzy na daty urodzenia. Wedyjski Guna Milan analizuje pozycje Księżyców obojga w chwili urodzenia — 8 wymiarów i 36 punktów, w tym temperament, instynkty i energię życiową. To znacznie głębsza analiza — znajdziesz ją u nas w zakładce „Dla par”.",
  },
];

export default function NumerologiaPartnerskaPage() {
  const [dateA, setDateA] = useState("");
  const [dateB, setDateB] = useState("");
  const [result, setResult] = useState<NumPartnerResult | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dateA || !dateB) return;
    setResult(numerologiaPartnerska(dateA, dateB));
  }

  return (
    <div className="container section">
      <div className="fade-up" style={{ maxWidth: 340, margin: "0 auto 10px" }}><SceneRelacje /></div>
      <h1 style={{ textAlign: "center" }}>Numerologia partnerska</h1>
      <p className="section-sub">
        Kalkulator miłości oparty na drogach życia. Wpisz dwie daty urodzenia
        i sprawdź, jak współgrają Wasze wibracje — za darmo, bez rejestracji.
      </p>

      <ParyNav />

      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 560, margin: "0 auto", display: "grid", gap: 16 }}>
        <div className="bf-row">
          <DateInput id="np-a" label="Data urodzenia — osoba 1" value={dateA} onChange={setDateA} required />
          <DateInput id="np-b" label="Data urodzenia — osoba 2" value={dateB} onChange={setDateB} required />
        </div>
        <button type="submit" className="btn btn-primary">Sprawdź dopasowanie ♡</button>
      </form>

      {result && (
        <div className="fade-up" style={{ maxWidth: 640, margin: "40px auto 0", display: "grid", gap: 20 }}>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{
              width: 150, height: 150, margin: "0 auto 14px", borderRadius: "50%",
              background: `conic-gradient(var(--primary) ${result.score * 3.6}deg, var(--surface-2) 0deg)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: 118, height: 118, borderRadius: "50%", background: "var(--surface)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                border: "1px solid var(--line-soft)",
              }}>
                <span style={{ fontFamily: "var(--font-serif)", fontSize: "2.3rem", color: "var(--primary-soft)" }}>
                  {result.score}%
                </span>
              </div>
            </div>
            <h2 style={{ fontSize: "1.55rem", marginBottom: 12 }}>
              <span className="gradient-text" style={{ fontStyle: "italic" }}>{result.label}</span>
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, textAlign: "center", marginBottom: 8 }}>
              <div>
                <p className="muted" style={{ fontSize: "0.78rem" }}>Droga życia — osoba 1</p>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--primary-soft)" }}>{result.lifeA}</p>
                <p className="muted" style={{ fontSize: "0.85rem" }}>{result.opisA}</p>
              </div>
              <div>
                <p className="muted" style={{ fontSize: "0.78rem" }}>Droga życia — osoba 2</p>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--primary-soft)" }}>{result.lifeB}</p>
                <p className="muted" style={{ fontSize: "0.85rem" }}>{result.opisB}</p>
              </div>
            </div>
            <p className="muted" style={{ fontSize: "0.88rem" }}>
              Grupy wibracyjne: {result.groupA} + {result.groupB}
              {result.groupA === result.groupB ? " — ta sama grupa, naturalne porozumienie" : " — różne grupy, energia uzupełniania"}
            </p>
            {result.masterNote && (
              <p style={{ fontSize: "0.88rem", marginTop: 8, color: "var(--accent)" }}>✦ {result.masterNote}</p>
            )}
          </div>

          {/* lejek do Guna Milan */}
          <div className="card card-2" style={{ textAlign: "center" }}>
            <h3 style={{ marginBottom: 8 }}>To dopiero początek</h3>
            <p className="muted" style={{ fontSize: "0.95rem", marginBottom: 16 }}>
              Numerologia patrzy na daty. Wedyjski <strong>Guna Milan</strong> analizuje
              pozycje Księżyców obojga — 8 wymiarów zgodności, 36 punktów:
              temperament, instynkty, umysły i energia życiowa.
            </p>
            <Link href="/dopasowanie" className="btn btn-primary">
              Pełna analiza pary (Guna Milan) →
            </Link>
          </div>
        </div>
      )}

      {/* treść SEO + FAQ */}
      <section style={{ maxWidth: 720, margin: "56px auto 0" }}>
        <h2 style={{ marginBottom: 18, textAlign: "center" }}>Najczęstsze pytania</h2>
        <div style={{ display: "grid", gap: 14 }}>
          {FAQ.map((f) => (
            <details key={f.q} className="card" style={{ padding: "18px 22px" }}>
              <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.05rem" }}>{f.q}</summary>
              <p className="muted" style={{ marginTop: 10, fontSize: "0.95rem" }}>{f.a}</p>
            </details>
          ))}
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQ.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />
      </section>
    </div>
  );
}
