"use client";

import { useState } from "react";
import { SceneHiromancja } from "@/components/infographics";
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
 * Układ na stronie jest PROSTY, nie lustrzany: lewa dłoń zawsze po LEWEJ
 * stronie ekranu, prawa dłoń zawsze po PRAWEJ. Podpis "dominująca" wędruje
 * między kolumnami zależnie od wyboru "którą ręką piszesz", pozycje
 * kolumn — nie.
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

function KartaDloni({ reka, dominujaca, zdjecie, geometria, onZdjecie, onGeometria }: {
  reka: Reka;
  dominujaca: boolean;
  zdjecie: ZdjecieDane | null;
  geometria: WynikGeometrii | null;
  onZdjecie: (dane: ZdjecieDane) => void;
  onGeometria: (wynik: WynikGeometrii) => void;
}) {
  const nazwa = reka === "prawa" ? "Prawa dłoń" : "Lewa dłoń";
  return (
    <div>
      <div className="card" style={{ textAlign: "center" }}>
        <HiromancjaZdjecie
          id={`hiromancja-plik-${reka}`}
          etykieta={`Zrób zdjęcie — ${nazwa.toLowerCase()}`}
          maZdjecie={!!zdjecie}
          onZdjecieGotowe={onZdjecie}
        />
        <p style={{ marginTop: 12, fontSize: "0.85rem" }}>
          <strong>{nazwa}</strong>
          {dominujaca && <span className="badge badge-good" style={{ marginLeft: 8, fontSize: "0.7rem" }}>dominująca</span>}
        </p>
      </div>

      {zdjecie && !geometria && (
        <details className="card fade-up" style={{ marginTop: 20 }}>
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
        <div className="card fade-up" style={{ marginTop: 20, borderTop: `2px solid ${KOLOR_TYPU[geometria.typ]}` }}>
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
    <div className="container section">
      <div className="fade-up" style={{ maxWidth: 340, margin: "0 auto 10px" }}><SceneHiromancja /></div>
      <h1 style={{ textAlign: "center" }}><Term k="hiromancja">Chiromancja</Term></h1>
      <p className="section-sub">
        Prześlij zdjęcia obu dłoni — Claude spojrzy na nie i jakościowo opisze kształt dłoni oraz
        widoczne linie. To subiektywna obserwacja AI, nie pomiar. Jeśli chcesz dokładniejszego,
        policzonego typu dłoni — możesz dodatkowo zaznaczyć 5 punktów ręcznie (opcjonalnie, czysta
        matematyka bez AI).
      </p>
      <p className="muted" style={{ textAlign: "center", fontSize: "0.85rem", maxWidth: 640, margin: "-30px auto 40px", lineHeight: 1.6 }}>
        Tak jak w astrologii wedyjskiej D1 pokazuje przejawione życie, a D9 wrodzoną naturę — tu dłoń{" "}
        <strong style={{ color: "var(--sand)" }}>dominująca</strong> (ta, którą piszesz) pokazuje, co
        świadomie zrobiłeś/aś ze sobą, a dłoń <strong style={{ color: "var(--sand)" }}>bierna</strong>{" "}
        wrodzony potencjał i talenty, z którymi się urodziłeś/aś.
      </p>

      <div>
        <div className="card" style={{ maxWidth: 640, margin: "0 auto" }}>
          <label id="hiro-pismo-label">Którą ręką piszesz?</label>
          <div className="bf-plec" role="radiogroup" aria-labelledby="hiro-pismo-label" style={{ marginBottom: 14 }}>
            <button type="button" role="radio" aria-checked={pismoReka === "prawa"}
              className={`bf-plec-opcja${pismoReka === "prawa" ? " bf-plec-opcja-aktywna" : ""}`}
              onClick={() => setPismoReka("prawa")}>
              Prawą
            </button>
            <button type="button" role="radio" aria-checked={pismoReka === "lewa"}
              className={`bf-plec-opcja${pismoReka === "lewa" ? " bf-plec-opcja-aktywna" : ""}`}
              onClick={() => setPismoReka("lewa")}>
              Lewą
            </button>
          </div>
          <p className="muted" style={{ fontSize: "0.78rem" }}>
            Zdjęcia nigdzie nie są zapisywane — trafiają z przeglądarki prosto do modelu AI (dopiero
            gdy klikniesz „Odczytaj” niżej) i nie są przechowywane na serwerze ani w bazie danych.
          </p>
        </div>

        {/* Układ prosty, nie lustrzany: LEWA zawsze po lewej stronie ekranu, PRAWA zawsze
            po prawej — niezależnie od tego, która jest dominująca. */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 20, marginTop: 20 }}>
          <KartaDloni reka="lewa" dominujaca={pismoReka === "lewa"}
            zdjecie={zdjecia.lewa} geometria={geometrie.lewa}
            onZdjecie={(d) => handleZdjecie("lewa", d)} onGeometria={(w) => setGeometrie((g) => ({ ...g, lewa: w }))} />
          <KartaDloni reka="prawa" dominujaca={pismoReka === "prawa"}
            zdjecie={zdjecia.prawa} geometria={geometrie.prawa}
            onZdjecie={(d) => handleZdjecie("prawa", d)} onGeometria={(w) => setGeometrie((g) => ({ ...g, prawa: w }))} />
        </div>

        {obaZdjeciaGotowe && (
          <div className="fade-up" style={{ marginTop: 20, maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
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
    </div>
  );
}
