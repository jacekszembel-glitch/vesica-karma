"use client";

import { useState } from "react";
import Term from "@/components/Term";
import HiromancjaZdjecie, { type ZdjecieDane } from "@/components/HiromancjaZdjecie";
import HiromancjaKalibracja from "@/components/HiromancjaKalibracja";
import HiromancjaOdczyt from "@/components/HiromancjaOdczyt";
import { OPIS_TYPU_DLONI } from "@/lib/hiromancja-tresc";
import type { WynikGeometrii } from "@/lib/hiromancja";

/**
 * HIROMANCJA — domyślnie AI patrzy na całe zdjęcie i opisuje jakościowo
 * KSZTAŁT dłoni oraz widoczne LINIE naraz — bez żadnego ręcznego zaznaczania
 * (pierwsza wersja wymagała 5 stuknięć na zdjęciu; test z prawdziwą dłonią
 * pokazał, że to dla zwykłego użytkownika za trudne i mylące). Ręczna
 * kalibracja (lib/hiromancja.ts — czysta matematyka odległości, bez AI)
 * zostaje jako OPCJONALNY dodatek dla dociekliwych: daje dokładniejszy,
 * policzony typ dłoni, który AI dostaje jako pewniejszy kontekst zamiast
 * zgadywać kształt samodzielnie. Obie ścieżki są jasno podpisane — apka
 * wszędzie indziej obiecuje "deterministyczne wyliczenia astronomiczne",
 * więc trzeba uczciwie zaznaczyć, co tu jest pomiarem, a co obserwacją AI.
 *
 * DWIE DŁONIE, jak D1/D9 w astrologii wedyjskiej: dłoń DOMINUJĄCA (ta,
 * którą się pisze) to D1 — co świadomie zrobiłeś ze sobą, przejawione życie;
 * dłoń BIERNA to D9 — wrodzony potencjał i talenty, z którymi się urodziłeś.
 *
 * Układ (wzór: public/brand/chiromancja-1/3/4.jpg): kompaktowy rząd dwóch
 * przycisków uploadu na górze (HiromancjaZdjecie samo pokazuje status —
 * zmienia etykietę na "Zmień zdjęcie" i dokleja wynik szybkiego sprawdzenia
 * jakości), a NIŻEJ, w jednej kolumnie, osobna sekcja na każdą dłoń: złoty
 * okrągły medalion z ikoną dłoni (public/brand/icon-dlon-lewa/prawa.png —
 * wycięte z tej samej pary dłoni co na Kole Karmy, patrz
 * scripts/extract-single-hands.mjs), podpis "LEWA/PRAWA DŁOŃ — dominująca/
 * bierna" i wyjaśnienie D1/D9. Kalibracja i wynik geometrii zostają pod
 * spodem tej samej sekcji, żeby nie gubić istniejącej funkcji.
 *
 * Świadomie POZA zakresem v1: integracja z /karma jako trzeci filar (kolejny,
 * osobny krok — nie ruszamy tu app/karma/page.tsx), getUserMedia/<video>
 * (plik z capture="environment" wystarcza), cache'owanie odczytu AI,
 * automatyczne sprawdzenie jakości zdjęcia przed odczytem (kolejny krok).
 */

type Reka = "prawa" | "lewa";

const KOLOR_TYPU: Record<string, string> = {
  ziemia: "#8a9a5b", powietrze: "#7fd0d8", ogien: "#e08a63", woda: "#6f9fbf",
};

const PLEC_OPCJE: { id: "on" | "ona" | "ono"; label: string }[] = [
  { id: "on", label: "On" }, { id: "ona", label: "Ona" }, { id: "ono", label: "Obiekt" },
];

const IKONA_DLONI: Record<Reka, string> = {
  lewa: "/brand/icon-dlon-lewa.png",
  prawa: "/brand/icon-dlon-prawa.png",
};

function SekcjaDloni({ reka, dominujaca, zdjecie, geometria, onGeometria }: {
  reka: Reka;
  dominujaca: boolean;
  zdjecie: ZdjecieDane | null;
  geometria: WynikGeometrii | null;
  onGeometria: (wynik: WynikGeometrii) => void;
}) {
  const nazwa = reka === "prawa" ? "PRAWA DŁOŃ" : "LEWA DŁOŃ";
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
      <div style={{
        width: 200, height: 200, borderRadius: "50%", border: "3px solid var(--sand)",
        margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <img src={IKONA_DLONI[reka]} alt="" style={{ width: "58%", height: "auto" }} />
      </div>
      <p style={{ marginTop: 16, marginBottom: 0, fontFamily: "var(--font-serif)", fontSize: "1.1rem", color: "var(--sand)", letterSpacing: "0.02em" }}>
        {nazwa} — {dominujaca ? "dominująca" : "bierna"}
      </p>
      <p style={{ marginTop: 12, lineHeight: 1.6, color: "var(--sand)" }}>
        Tak jak w astrologii wedyjskiej D1 pokazuje przejawione życie, a D9 wrodzoną naturę — ta dłoń{" "}
        {dominujaca
          ? <><strong>dominująca</strong> (ta, którą piszesz) pokazuje, co świadomie zrobiłeś/aś ze sobą.</>
          : <><strong>bierna</strong> pokazuje wrodzony potencjał i talenty, z którymi się urodziłeś/aś.</>}
      </p>

      {zdjecie && !geometria && (
        <details className="card fade-up" style={{ marginTop: 20, textAlign: "left" }}>
          <summary style={{ cursor: "pointer", fontSize: "0.85rem", color: "var(--sand)" }}>
            Zaznacz punkty ręcznie — dokładniejszy, policzony typ dłoni (opcjonalnie)
          </summary>
          <p className="muted" style={{ fontSize: "0.8rem", marginTop: 10, marginBottom: 4, lineHeight: 1.5 }}>
            Bez tego AI i tak oceni kształt dłoni jakościowo, patrząc na zdjęcie. Ręczne zaznaczenie
            5 punktów daje dokładniejszy, policzony wynik (czysta matematyka, bez AI) — dla tych,
            którzy chcą precyzji.
          </p>
          <HiromancjaKalibracja dataUrl={zdjecie.dataUrl} onGotowe={onGeometria} />
        </details>
      )}

      {geometria && (
        <div className="card fade-up" style={{ marginTop: 20, textAlign: "left", borderTop: `2px solid ${KOLOR_TYPU[geometria.typ]}` }}>
          <p className="eyebrow" style={{ marginBottom: 6 }}>Typ dłoni — geometria (deterministyczne, ręczna kalibracja)</p>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", color: KOLOR_TYPU[geometria.typ], marginBottom: 8 }}>
            {OPIS_TYPU_DLONI[geometria.typ].title}
          </p>
          <p style={{ fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 14 }}>
            {OPIS_TYPU_DLONI[geometria.typ].text}
          </p>
          <p className="muted" style={{ fontSize: "0.76rem" }}>
            Kształt: {geometria.stosunekDloni.toFixed(2)} (długość/szerokość) ·
            {" "}proporcja palca: {geometria.stosunekPalca.toFixed(2)} (palec/długość dłoni)
          </p>

          <details style={{ marginTop: 14 }}>
            <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "var(--sand)" }}>
              Metodologia — co jest pewne, a co uproszczone
            </summary>
            <p className="muted" style={{ fontSize: "0.8rem", marginTop: 10, lineHeight: 1.55 }}>
              Kształt dłoni (kwadratowa/wydłużona) i proporcja palca (krótki/długi) to dwa realne,
              policzone stosunki odległości między punktami, które wskazałeś/aś. Progi klasyfikacji
              (1.15 dla kształtu, 1.0 dla proporcji palca) to najczęściej cytowane wartości w źródłach
              popularnych o chiromancji — nie ma tu jednego, naukowo zmierzonego standardu, różne
              szkoły podają nieco inne progi. Wynik zależy też od precyzji Twojej kalibracji i kąta
              zdjęcia — jeśli typ wydaje się nie pasować, spróbuj skalibrować ponownie.
            </p>
          </details>
        </div>
      )}
    </div>
  );
}

export default function HiromancjaPage() {
  const [pismoReka, setPismoReka] = useState<Reka>("prawa");
  const [zdjecia, setZdjecia] = useState<Record<Reka, ZdjecieDane | null>>({ prawa: null, lewa: null });
  const [geometrie, setGeometrie] = useState<Record<Reka, WynikGeometrii | null>>({ prawa: null, lewa: null });
  const [imie, setImie] = useState("");
  const [plec, setPlec] = useState<"on" | "ona" | "ono">("ona");

  function handleZdjecie(reka: Reka, dane: ZdjecieDane) {
    setZdjecia((z) => ({ ...z, [reka]: dane }));
    setGeometrie((g) => ({ ...g, [reka]: null })); // nowe zdjęcie = ewentualna kalibracja od nowa
  }

  const obaZdjeciaGotowe = zdjecia.prawa && zdjecia.lewa;
  const rekaBierna: Reka = pismoReka === "prawa" ? "lewa" : "prawa";

  return (
    <div className="container section" style={{ paddingTop: 40 }}>
      <h1 style={{ textAlign: "center", color: "var(--sand)", marginBottom: 16 }}><Term k="hiromancja">Chiromancja</Term></h1>
      <div className="skrot-hero-linia" />
      <p className="section-sub" style={{ color: "var(--sand)" }}>
        Prześlij zdjęcia obu dłoni — Claude spojrzy na nie i jakościowo opisze kształt dłoni oraz
        widoczne linie. To subiektywna obserwacja AI, nie pomiar. Jeśli chcesz dokładniejszego,
        policzonego typu dłoni — możesz dodatkowo zaznaczyć 5 punktów ręcznie (opcjonalnie, czysta
        matematyka bez AI).
      </p>

      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <p id="hiro-pismo-label" style={{ textAlign: "center", fontWeight: 700, color: "var(--sand)", marginBottom: 10 }}>
          Którą ręką piszesz?
        </p>
        {/* Prawdziwy wycinek pikseli z chiromanca-2.jpg (scripts/extract-hand-toggle.mjs)
            zamiast plaskich kolorow CSS — dwa stany (ktora strona zlota) to dwa
            gotowe obrazki, nie przemalowany na biezaco div. */}
        <div role="radiogroup" aria-labelledby="hiro-pismo-label"
          style={{ position: "relative", maxWidth: 320, margin: "0 auto", lineHeight: 0 }}>
          <img
            src={pismoReka === "lewa" ? "/brand/toggle-lewa-aktywna.png" : "/brand/toggle-prawa-aktywna.png"}
            alt="" style={{ width: "100%", height: "auto", display: "block" }}
          />
          <button type="button" role="radio" aria-checked={pismoReka === "lewa"} aria-label="Lewa"
            onClick={() => setPismoReka("lewa")}
            style={{ position: "absolute", left: 0, top: 0, width: "50%", height: "100%", background: "transparent", border: "none", cursor: "pointer" }} />
          <button type="button" role="radio" aria-checked={pismoReka === "prawa"} aria-label="Prawa"
            onClick={() => setPismoReka("prawa")}
            style={{ position: "absolute", right: 0, top: 0, width: "50%", height: "100%", background: "transparent", border: "none", cursor: "pointer" }} />
        </div>
        <div style={{ display: "flex", maxWidth: 320, margin: "6px auto 24px" }}>
          <span style={{ flex: 1, textAlign: "center", fontSize: "0.68rem", letterSpacing: "0.05em", color: "var(--sand)", fontWeight: 700 }}>
            {pismoReka === "lewa" ? "DOMINUJĄCA" : ""}
          </span>
          <span style={{ flex: 1, textAlign: "center", fontSize: "0.68rem", letterSpacing: "0.05em", color: "var(--sand)", fontWeight: 700 }}>
            {pismoReka === "prawa" ? "DOMINUJĄCA" : ""}
          </span>
        </div>

        <p className="muted" style={{ fontSize: "0.78rem", textAlign: "center", maxWidth: 480, margin: "0 auto 28px" }}>
          Zdjęcia nigdzie nie są zapisywane — trafiają z przeglądarki prosto do modelu AI (dopiero
          gdy klikniesz „Odczytaj” niżej) i nie są przechowywane na serwerze ani w bazie danych.
        </p>

        {/* podglad na pierwszy rzut oka: zloty pierscien = dlon dominujaca (D1),
            taupe = bierna (D9) — ten sam jezyk zloto/taupe co Kolo Karmy. */}
        <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 24 }}>
          <div style={{
            width: 90, height: 90, borderRadius: "50%",
            border: `3px solid ${pismoReka === "lewa" ? "var(--sand)" : "var(--taupe)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <img src={pismoReka === "lewa" ? "/brand/icon-dlon-lewa.png" : "/brand/icon-dlon-lewa-taupe.png"} alt="" style={{ width: "58%", height: "auto" }} />
          </div>
          <div style={{
            width: 90, height: 90, borderRadius: "50%",
            border: `3px solid ${pismoReka === "prawa" ? "var(--sand)" : "var(--taupe)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <img src={pismoReka === "prawa" ? "/brand/icon-dlon-prawa.png" : "/brand/icon-dlon-prawa-taupe.png"} alt="" style={{ width: "58%", height: "auto" }} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", margin: "0 0 28px" }}>
        <HiromancjaZdjecie id="hiromancja-plik-lewa" etykieta="Prześlij zdjęcie — lewa dłoń"
          maZdjecie={!!zdjecia.lewa} onZdjecieGotowe={(d) => handleZdjecie("lewa", d)} />
        <HiromancjaZdjecie id="hiromancja-plik-prawa" etykieta="Prześlij zdjęcie — prawa dłoń"
          maZdjecie={!!zdjecia.prawa} onZdjecieGotowe={(d) => handleZdjecie("prawa", d)} />
      </div>

      <div className="skrot-hero-linia" />

      <div style={{ display: "grid", gap: 40, marginTop: 40 }}>
        <SekcjaDloni reka="lewa" dominujaca={pismoReka === "lewa"}
          zdjecie={zdjecia.lewa} geometria={geometrie.lewa}
          onGeometria={(w) => setGeometrie((g) => ({ ...g, lewa: w }))} />

        <div className="skrot-hero-linia" />

        <SekcjaDloni reka="prawa" dominujaca={pismoReka === "prawa"}
          zdjecie={zdjecia.prawa} geometria={geometrie.prawa}
          onGeometria={(w) => setGeometrie((g) => ({ ...g, prawa: w }))} />
      </div>

      {obaZdjeciaGotowe && (
        <div className="fade-up" style={{ marginTop: 40, maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
          <div className="skrot-hero-linia" style={{ marginTop: 0 }} />
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 14 }}>
              <label htmlFor="hiro-imie">Imię (opcjonalnie — do tonu odczytu AI)</label>
              <input id="hiro-imie" type="text" placeholder="np. Jacek" value={imie}
                onChange={(e) => setImie(e.target.value)} />
            </div>
            <div>
              <label id="hiro-plec-label">Płeć (do tonu odczytu AI)</label>
              <div className="bf-plec" role="radiogroup" aria-labelledby="hiro-plec-label">
                {PLEC_OPCJE.map((p) => (
                  <button key={p.id} type="button" role="radio" aria-checked={plec === p.id}
                    className={`bf-plec-opcja${plec === p.id ? " bf-plec-opcja-aktywna" : ""}`}
                    onClick={() => setPlec(p.id)}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <HiromancjaOdczyt
            wiodaca={{
              imageBase64: zdjecia[pismoReka]!.base64, imageMediaType: zdjecia[pismoReka]!.mediaType,
              geometria: geometrie[pismoReka] ? {
                typ: geometrie[pismoReka]!.typ,
                stosunekDloni: geometrie[pismoReka]!.stosunekDloni,
                stosunekPalca: geometrie[pismoReka]!.stosunekPalca,
              } : undefined,
            }}
            bierna={{
              imageBase64: zdjecia[rekaBierna]!.base64, imageMediaType: zdjecia[rekaBierna]!.mediaType,
              geometria: geometrie[rekaBierna] ? {
                typ: geometrie[rekaBierna]!.typ,
                stosunekDloni: geometrie[rekaBierna]!.stosunekDloni,
                stosunekPalca: geometrie[rekaBierna]!.stosunekPalca,
              } : undefined,
            }}
            plec={plec}
            imie={imie.trim() || undefined}
          />

          <p className="muted" style={{ fontSize: "0.78rem", marginTop: 20, textAlign: "center" }}>
            To na razie samodzielna strona — w przyszłości ten odczyt dołączy do{" "}
            <a href="/karma" style={{ color: "var(--teal-soft)" }}>Karmy</a> jako trzeci filar, obok
            numerologii i astrologii.
          </p>
        </div>
      )}
    </div>
  );
}
