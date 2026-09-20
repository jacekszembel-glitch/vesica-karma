"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Konwencje from "@/components/Konwencje";
import { numerologiaImienia, type NumSystem } from "@/lib/astro/numerology";
import { znaczenie } from "@/lib/astro/znaczenia-liczb";
import { SceneNumerologia } from "@/components/infographics";

/**
 * NUMEROLOGIA IMIENIA — bramka tematyczna nr 5.
 *
 * Trzy liczby imienne (ekspresja, dusza, osobowość) z rozbiciem litera po
 * literze — użytkownik widzi, SKĄD wynik się wziął, a nie tylko werdykt.
 * Obsługa polskich znaków (ł→l, ż→z…) i trzech systemów wartości liter.
 */

const SYSTEMY: { id: NumSystem; label: string; opis: string }[] = [
  { id: "pitagorejski", label: "Pitagorejski", opis: "zachodni standard — litery wg pozycji w alfabecie" },
  { id: "chaldejski", label: "Chaldejski", opis: "babiloński, wibracyjny — wartości 1–8" },
];

export default function NumerologiaImieniaPage() {
  const [imie, setImie] = useState("");
  const [system, setSystem] = useState<NumSystem>("pitagorejski");
  const [pokazane, setPokazane] = useState("");

  const wynik = useMemo(
    () => (pokazane ? numerologiaImienia(pokazane, system) : null),
    [pokazane, system],
  );

  function policz(e: React.FormEvent) {
    e.preventDefault();
    setPokazane(imie.trim());
  }

  return (
    <div className="container section">
      <div className="fade-up" style={{ maxWidth: 340, margin: "0 auto 10px" }}><SceneNumerologia /></div>
      <h1 style={{ textAlign: "center" }}>Numerologia imienia</h1>
      <p className="section-sub">
        Trzy liczby ukryte w Twoim imieniu: <strong>ekspresja</strong> (jak działasz),{" "}
        <strong>dusza</strong> (czego naprawdę chcesz) i <strong>osobowość</strong>{" "}
        (jak widzą Cię inni) — z pełnym rachunkiem litera po literze.
      </p>

      <form onSubmit={policz} className="card" style={{ maxWidth: 520, margin: "0 auto", display: "grid", gap: 14 }}>
        <div>
          <label htmlFor="ni-imie">Imię (lub imię i nazwisko)</label>
          <input
            id="ni-imie" type="text" required value={imie}
            placeholder="np. Jacek albo Jacek Szembel"
            autoComplete="name" autoCapitalize="words" spellCheck={false}
            maxLength={60}
            onChange={(e) => setImie(e.target.value)}
          />
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {SYSTEMY.map((s) => (
            <label key={s.id} style={{
              display: "flex", gap: 10, alignItems: "baseline", cursor: "pointer",
              textTransform: "none", fontSize: "0.9rem", color: "var(--text)",
              padding: "10px 13px", borderRadius: 10,
              border: system === s.id ? "1px solid var(--line-gold)" : "1px solid var(--line-soft)",
              background: system === s.id ? "rgba(230,196,138,0.06)" : "transparent",
            }}>
              <input type="radio" name="system" checked={system === s.id}
                onChange={() => setSystem(s.id)} style={{ width: "auto" }} />
              <span><strong>{s.label}</strong> <span className="muted">— {s.opis}</span></span>
            </label>
          ))}
        </div>
        <button type="submit" className="btn btn-primary">Policz liczby imienia</button>
      </form>

      {wynik && pokazane && (
        <div className="fade-up" style={{ display: "grid", gap: 22, marginTop: 36 }}>
          {/* ── trzy liczby ── */}
          <div className="card">
            <p className="eyebrow" style={{ textAlign: "center", marginBottom: 18 }}>{pokazane}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))", gap: 20, textAlign: "center" }}>
              {([
                ["Ekspresja", wynik.ekspresja, "jak działasz w świecie"],
                ["Dusza", wynik.dusza, "czego naprawdę chcesz"],
                ["Osobowość", wynik.osobowosc, "jak widzą Cię inni"],
              ] as const).map(([nazwa, n, pod]) => (
                <div key={nazwa}>
                  <p className="muted" style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.09em" }}>{nazwa}</p>
                  <p style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", color: "var(--primary-soft)", lineHeight: 1.15 }}>{n || "—"}</p>
                  <p className="muted" style={{ fontSize: "0.78rem" }}>{pod}</p>
                  {n > 0 && (
                    <p style={{ fontSize: "0.85rem", marginTop: 4, color: "var(--teal-soft)" }}>
                      {znaczenie(n).haslo}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── znaczenie ekspresji ── */}
          {wynik.ekspresja > 0 && (
            <div className="card">
              <p className="eyebrow" style={{ marginBottom: 10 }}>
                Wibracja {wynik.ekspresja} · planeta: {znaczenie(wynik.ekspresja).planeta}
              </p>
              <p style={{ fontSize: "0.95rem", lineHeight: 1.7, marginBottom: 10 }}>{znaczenie(wynik.ekspresja).opis}</p>
              <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.65 }}>{znaczenie(wynik.ekspresja).wImieniu}</p>
            </div>
          )}

          {/* ── rachunek litera po literze ── */}
          <div className="card">
            <p className="eyebrow" style={{ marginBottom: 8 }}>Skąd ten wynik — litera po literze</p>
            <p className="muted" style={{ fontSize: "0.83rem", marginBottom: 14 }}>
              Samogłoski (podświetlone) budują liczbę duszy, spółgłoski — osobowości,
              wszystkie razem — ekspresję. Polskie znaki liczymy po ich literach
              bazowych (ł→l, ż→z).
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {wynik.litery.map((l, i) => (
                <span key={i} style={{
                  display: "grid", placeItems: "center", minWidth: 40, padding: "7px 8px",
                  borderRadius: 9, fontVariantNumeric: "tabular-nums",
                  border: l.samogloska ? "1px solid var(--teal)" : "1px solid var(--line-soft)",
                  background: l.samogloska ? "rgba(17,167,182,0.09)" : "transparent",
                }}>
                  <span style={{ fontSize: "0.95rem", textTransform: "uppercase" }}>{l.litera}</span>
                  <span className="muted" style={{ fontSize: "0.74rem" }}>{l.wartosc}</span>
                </span>
              ))}
            </div>
            <p className="muted" style={{ fontSize: "0.85rem", marginTop: 12 }}>
              suma {wynik.sumaPelna} → <strong style={{ color: "var(--primary-soft)" }}>{wynik.ekspresja}</strong>
              {wynik.ekspresja > 9 && " (liczba mistrzowska — nie redukujemy)"}
            </p>
          </div>

          {/* ── przejście do pełnej analizy ── */}
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", marginBottom: 8 }}>
              Imię to jedna warstwa
            </p>
            <p className="muted" style={{ fontSize: "0.9rem", marginBottom: 16, lineHeight: 1.6 }}>
              Pełny profil zderza liczby imienia z datą urodzenia — drogą życia,
              mulankiem i rokiem osobistym. Dopiero razem widać napięcia i harmonie.
            </p>
            <Link href="/numerologia" className="btn btn-primary">Pełny profil numerologiczny</Link>
          </div>

          <Konwencje compact />
        </div>
      )}
    </div>
  );
}
