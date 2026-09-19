"use client";

import { useState } from "react";
import { policzGeometrie, walidujPunkty, type Punkt, type PunktyKalibracji, type WynikGeometrii } from "@/lib/hiromancja";

/**
 * KALIBRACJA — 5 stuknięć na zdjęciu zamiast automatycznego rozpoznawania
 * (którego dla LINII dłoni nie da się wiarygodnie zrobić gotowymi
 * narzędziami — patrz nagłówek lib/hiromancja.ts). Nakładka jest zwykłym
 * pozycjonowanym `<div>`, nie `<canvas>` — nie rysujemy pikseli, tylko
 * znaczniki, a współrzędne liczymy względem WYRENDEROWANEGO (możliwe że
 * przeskalowanego CSS-em) obrazka — nieistotne, bo dalej liczymy tylko
 * STOSUNKI odległości.
 */

const KOLEJNOSC: (keyof PunktyKalibracji)[] = ["nadgarstek", "podstawaPalca", "szczytPalca", "krawedzLewa", "krawedzPrawa"];

const ETYKIETY: Record<keyof PunktyKalibracji, string> = {
  nadgarstek: "A", podstawaPalca: "B", szczytPalca: "C", krawedzLewa: "D", krawedzPrawa: "E",
};

const INSTRUKCJE: Record<keyof PunktyKalibracji, string> = {
  nadgarstek: "Stuknij środek bruzdy nadgarstka.",
  podstawaPalca: "Stuknij podstawę palca środkowego — tam, gdzie łączy się z dłonią.",
  szczytPalca: "Stuknij czubek palca środkowego.",
  krawedzLewa: "Stuknij lewą krawędź dłoni, na wysokości podstawy palców.",
  krawedzPrawa: "Stuknij prawą krawędź dłoni, na tej samej wysokości.",
};

const GHOST_BTN: React.CSSProperties = {
  padding: "8px 16px", borderRadius: 999, border: "1px solid var(--line-soft)",
  background: "transparent", color: "var(--muted)", fontSize: "0.82rem", cursor: "pointer",
};

/** Pozycje punktów A–E na schematycznej dłoni (viewBox 0 0 120 160) — legenda, nie prawdziwe zdjęcie. */
const SCHEMAT_POZYCJE: Record<keyof PunktyKalibracji, { x: number; y: number }> = {
  nadgarstek: { x: 60, y: 128 },
  podstawaPalca: { x: 60, y: 78 },
  szczytPalca: { x: 60, y: 14 },
  krawedzLewa: { x: 32, y: 78 },
  krawedzPrawa: { x: 88, y: 78 },
};

/**
 * STAŁA LEGENDA — schematyczna dłoń z zawsze widocznymi punktami A–E, żeby
 * użytkownik miał referencję niezależnie od tego, na którym jest kroku
 * (sam, znikający tekst instrukcji okazał się za mało jasny — punkty
 * lądowały skupione w jednym miejscu zamiast rozproszone po dłoni).
 * Aktualny krok podświetlony i pulsujący.
 */
function LegendaSchemat({ aktualnyKrok }: { aktualnyKrok: keyof PunktyKalibracji | null }) {
  return (
    <svg viewBox="0 0 120 160" width="110" style={{ flexShrink: 0 }} aria-hidden="true">
      {/* palec środkowy + dłoń — czysto schematyczne, nie prawdziwe zdjęcie */}
      <rect x="48" y="10" width="24" height="72" rx="11" fill="none" stroke="var(--line-soft)" strokeWidth="1.4" />
      <rect x="28" y="66" width="64" height="64" rx="16" fill="none" stroke="var(--line-soft)" strokeWidth="1.4" />
      {KOLEJNOSC.map((klucz) => {
        const { x, y } = SCHEMAT_POZYCJE[klucz];
        const aktywny = klucz === aktualnyKrok;
        return (
          <g key={klucz}>
            <circle cx={x} cy={y} r={aktywny ? 11 : 9} fill={aktywny ? "#e6c48a" : "rgba(230,196,138,0.35)"}
              stroke="var(--navy)" strokeWidth="1.5" className={aktywny ? "hiro-pulse" : undefined} />
            <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fontWeight={700}
              fill={aktywny ? "var(--navy)" : "var(--sand)"}>{ETYKIETY[klucz]}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function HiromancjaKalibracja({ dataUrl, onGotowe }: {
  dataUrl: string;
  onGotowe: (wynik: WynikGeometrii) => void;
}) {
  const [punkty, setPunkty] = useState<Partial<PunktyKalibracji>>({});
  const [wynik, setWynik] = useState<WynikGeometrii | null>(null);
  const krokIdx = KOLEJNOSC.findIndex((k) => !(k in punkty));
  const zakonczone = krokIdx === -1;

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (zakonczone) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const punkt: Punkt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const klucz = KOLEJNOSC[krokIdx];
    const nowe: Partial<PunktyKalibracji> = { ...punkty, [klucz]: punkt };
    setPunkty(nowe);
    if (KOLEJNOSC.every((k) => k in nowe)) {
      const w = policzGeometrie(nowe as PunktyKalibracji);
      setWynik(w);
      onGotowe(w);
    }
  }

  function cofnij() {
    const idxDoCofniecia = (zakonczone ? KOLEJNOSC.length : krokIdx) - 1;
    if (idxDoCofniecia < 0) return;
    const nowe = { ...punkty };
    delete nowe[KOLEJNOSC[idxDoCofniecia]];
    setPunkty(nowe);
    setWynik(null);
  }

  function resetuj() {
    setPunkty({});
    setWynik(null);
  }

  const pelneDoWalidacji = zakonczone ? (punkty as PunktyKalibracji) : null;
  const ostrzezenie = pelneDoWalidacji !== null && !walidujPunkty(pelneDoWalidacji);
  const liczbaPunktow = Object.keys(punkty).length;

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <p className="eyebrow" style={{ marginBottom: 6 }}>Kalibracja — {Math.min(liczbaPunktow + (zakonczone ? 0 : 1), 5)}/5</p>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <LegendaSchemat aktualnyKrok={zakonczone ? null : KOLEJNOSC[krokIdx]} />
        <p style={{ fontSize: "0.9rem", flex: 1, minWidth: 180 }}>
          {zakonczone ? "Gotowe — wszystkie 5 punktów wskazanych." : INSTRUKCJE[KOLEJNOSC[krokIdx]]}
        </p>
      </div>

      <div
        onClick={handleClick}
        style={{
          position: "relative", display: "inline-block", maxWidth: "100%",
          cursor: zakonczone ? "default" : "crosshair", lineHeight: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- lokalny data URL (zdjęcie użytkownika), nie zasób do optymalizacji next/image */}
        <img src={dataUrl} alt="Zdjęcie dłoni do kalibracji" draggable={false}
          style={{ display: "block", maxWidth: "100%", borderRadius: 8, userSelect: "none" }} />
        {KOLEJNOSC.map((klucz) => {
          const p = punkty[klucz];
          if (!p) return null;
          return (
            <span key={klucz} style={{
              position: "absolute", left: p.x, top: p.y, transform: "translate(-50%, -50%)",
              width: 22, height: 22, borderRadius: "50%", background: "rgba(230,196,138,0.9)",
              border: "2px solid var(--navy)", color: "var(--navy)", fontSize: "0.72rem", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none",
            }}>
              {ETYKIETY[klucz]}
            </span>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <button type="button" style={GHOST_BTN} onClick={cofnij} disabled={liczbaPunktow === 0}>
          Cofnij ostatni punkt
        </button>
        <button type="button" style={GHOST_BTN} onClick={resetuj} disabled={liczbaPunktow === 0}>
          Zacznij od nowa
        </button>
      </div>

      {ostrzezenie && (
        <p style={{ fontSize: "0.82rem", marginTop: 12, color: "var(--warn)" }}>
          Te punkty wyglądają nietypowo — sprawdź, czy kolejność (nadgarstek → podstawa palca → czubek palca → krawędzie)
          się zgadza. Możesz je poprawić przyciskiem „Zacznij od nowa”.
        </p>
      )}
      {wynik && !ostrzezenie && (
        <p className="muted" style={{ fontSize: "0.82rem", marginTop: 12 }}>
          Policzone — zobacz wynik niżej.
        </p>
      )}
    </div>
  );
}
