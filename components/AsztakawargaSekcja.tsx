"use client";

import { useMemo, useState } from "react";
import type { VedicChart } from "@/lib/astro/chart";
import { RASIS } from "@/lib/astro/constants";
import { GRAHAS } from "@/lib/astro/constants";
import { bhinnasztakawarga, sarwasztakawarga, GRAHY_ASZTAKAWARGI } from "@/lib/astro/ashtakavarga";
import Term from "@/components/Term";

const SREDNIA_NA_ZNAK = 337 / 12; // 337 bindu rozlozone rowno na 12 znakow — punkt odniesienia "wysoko/nisko"
const MAX_TEORETYCZNY = 56; // 7 grah x 8 zrodel, w praktyce prawie nigdy nie osiagany

function Dymek({ znak, wartosc, bav }: { znak: number; wartosc: number; bav: Record<string, number[]> }) {
  const roznica = wartosc - SREDNIA_NA_ZNAK;
  const ocena = roznica >= 4 ? "wyraźnie powyżej średniej — mocny grunt"
    : roznica >= 1 ? "lekko powyżej średniej"
    : roznica <= -4 ? "wyraźnie poniżej średniej — słabszy grunt"
    : roznica <= -1 ? "lekko poniżej średniej"
    : "dokładnie na średniej";
  return (
    <div style={{
      position: "absolute", bottom: "calc(100% + 10px)", left: "50%", transform: "translateX(-50%)",
      width: 210, zIndex: 20, pointerEvents: "none",
    }}>
      <div style={{
        background: "rgba(16, 34, 49, 0.98)", border: "1px solid var(--line-gold)",
        borderRadius: 10, padding: "10px 13px", boxShadow: "0 10px 26px rgba(0,0,0,0.5)",
        animation: "fadeUp 0.15s var(--ease-out) both", fontSize: "0.8rem", color: "#e8eef2", lineHeight: 1.5,
      }}>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem", marginBottom: 4, color: "var(--sand)" }}>
          {RASIS[znak].symbol} {RASIS[znak].pl}
        </p>
        <p style={{ marginBottom: 6 }}>
          <strong>{wartosc}</strong> bindu (średnia dla znaku: {SREDNIA_NA_ZNAK.toFixed(1)}, teoretyczne maksimum: {MAX_TEORETYCZNY}) — {ocena}.
        </p>
        <p className="muted" style={{ fontSize: "0.74rem" }}>
          {GRAHY_ASZTAKAWARGI.map((g) => `${GRAHAS[g].symbol}${bav[g][znak]}`).join("  ")}
        </p>
      </div>
    </div>
  );
}

/**
 * ASZTAKAWARGA — Sarwasztakawarga jako słupkowy wykres siły 12 znaków
 * (magnitude po kategorii → forma słupkowa, kolor sekwencyjny jednej barwy
 * wg wartości, nie kategorii), pod nim klasyczna siatka Bhinnasztakawargi
 * (7 grah × 12 znaków), tak jak pokazuje ją każde oprogramowanie jyotisz.
 */

const BAR_H = 150;

export default function AsztakawargaSekcja({ chart }: { chart: VedicChart }) {
  const bav = useMemo(() => bhinnasztakawarga(chart), [chart]);
  const sav = useMemo(() => (bav ? sarwasztakawarga(bav) : null), [bav]);
  const [najechany, setNajechany] = useState<number | null>(null);

  if (!chart.angles || !bav || !sav) return null;

  const maxSav = Math.max(...sav, MAX_TEORETYCZNY * 0.7); // skala wzgledem realistycznego zakresu, nie samych wynikow tej mapy
  const lagnaSign = chart.angles.lagnaSign;
  const sredniaY = 100 - (SREDNIA_NA_ZNAK / maxSav) * 100; // pozycja linii sredniej od gory kontenera, w %

  return (
    <details className="card" style={{ marginBottom: 24 }}>
      <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)", marginBottom: 6 }}>
        <Term k="asztakawarga">Asztakawarga</Term>
      </summary>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 20, lineHeight: 1.55 }}>
        Osiem źródeł (siedem grah klasycznych i lagna) „głosuje" na korzystne domy licząc od siebie —
        znak, który dostaje najwięcej głosów (bindu), jest ogólnie silniejszym gruntem: tranzyty i okresy
        przechodzące przezeń działają pewniej. Suma na całą mapę zawsze wynosi 337 — liczy się rozkład,
        nie suma.
      </p>

      <p className="eyebrow" style={{ marginBottom: 4 }}>Sarwasztakawarga — siła 12 znaków</p>
      <p className="muted" style={{ fontSize: "0.78rem", marginBottom: 10, lineHeight: 1.5 }}>
        Przerywana linia — średnia na znak przy równym rozkładzie ({SREDNIA_NA_ZNAK.toFixed(1)} z 337÷12).
        Teoretyczne maksimum to {MAX_TEORETYCZNY} (wszystkie 8 źródeł naraz), w praktyce prawie nieosiągalne —
        licz się z linią średniej, nie z tym pułapem. Najedź na słupek po szczegóły.
      </p>
      <div style={{ position: "relative", height: BAR_H, marginBottom: 8 }}>
        <div style={{
          position: "absolute", left: 0, right: 0, top: `${sredniaY}%`,
          borderTop: "1px dashed rgba(230,196,138,0.4)", zIndex: 1,
        }} />
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: "100%", position: "relative" }}>
          {sav.map((v, znak) => {
            const pct = maxSav > 0 ? (v / maxSav) * 100 : 0;
            const jestLagna = znak === lagnaSign;
            const jestNajechany = najechany === znak;
            return (
              <div key={znak}
                onMouseEnter={() => setNajechany(znak)}
                onMouseLeave={() => setNajechany(null)}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", position: "relative", cursor: "default" }}>
                {jestNajechany && <Dymek znak={znak} wartosc={v} bav={bav} />}
                <span style={{
                  fontSize: "0.72rem", marginBottom: 4, fontVariantNumeric: "tabular-nums",
                  color: jestNajechany ? "var(--primary-soft)" : "var(--sand)",
                }}>{v}</span>
                <div style={{
                  width: "100%", maxWidth: 34, height: `${Math.max(4, pct)}%`, borderRadius: "4px 4px 0 0",
                  background: jestNajechany
                    ? "var(--primary)"
                    : `rgba(230,196,138,${0.25 + (v / (maxSav || 1)) * 0.65})`,
                  border: jestLagna ? "1px solid var(--primary)" : "1px solid transparent",
                  transition: "height 0.5s var(--ease-out), background 0.15s",
                }} />
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
        {sav.map((_, znak) => (
          <div key={znak} style={{ flex: 1, textAlign: "center", fontSize: "0.68rem" }}>
            <span style={{ color: znak === lagnaSign ? "var(--primary-soft)" : "var(--muted)" }}>
              {RASIS[znak].symbol}
            </span>
          </div>
        ))}
      </div>
      <p className="muted" style={{ fontSize: "0.78rem", marginBottom: 24, lineHeight: 1.5 }}>
        Złota obwódka — Twoja lagna ({RASIS[lagnaSign].pl}).
      </p>

      <p className="eyebrow" style={{ marginBottom: 4 }}>Bhinnasztakawarga — bindu wg grahy</p>
      <p className="muted" style={{ fontSize: "0.78rem", marginBottom: 12, lineHeight: 1.5 }}>
        Ostatnia kolumna („zawsze") to STAŁA liczba — Jowisz zawsze ma 56 punktów do rozdania, Saturn
        zawsze 39, niezależnie od mapy, więc porównywanie jej między planetami nic nie mówi o Tobie.
        To, co jest osobiste, to w KTÓRYCH znakach te punkty wylądowały — patrz na cyfry w wierszu: przy
        średnio ~4 punktach na znak (bo 8 źródeł dzieli się na 12 znaków), 6–7 to dużo, 0–1 to mało.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Graha</th>
              {RASIS.map((r) => <th key={r.pl} style={{ textAlign: "center" }}>{r.symbol}</th>)}
              <th style={{ textAlign: "center" }} className="muted">zawsze</th>
            </tr>
          </thead>
          <tbody>
            {GRAHY_ASZTAKAWARGI.map((g) => (
              <tr key={g}>
                <td><span style={{ color: GRAHAS[g].color }}>{GRAHAS[g].symbol}</span> {GRAHAS[g].pl}</td>
                {bav[g].map((v, znak) => (
                  <td key={znak} style={{ textAlign: "center", color: v === 0 ? "var(--muted)" : "var(--text)" }}>{v}</td>
                ))}
                <td className="muted" style={{ textAlign: "center" }} title="Stała — ta sama liczba w każdej mapie">
                  {bav[g].reduce((a, b) => a + b, 0)}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: "1px solid var(--line-gold)" }}>
              <td style={{ fontWeight: 600 }}>Sarwasztakawarga</td>
              {sav.map((v, znak) => <td key={znak} style={{ textAlign: "center", fontWeight: 600 }}>{v}</td>)}
              <td className="muted" style={{ textAlign: "center" }} title="Stała — ta sama liczba w każdej mapie">337</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  );
}
