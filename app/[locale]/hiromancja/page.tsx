"use client";

import { useState } from "react";
import Term from "@/components/Term";
import { Link } from "@/i18n/navigation";
import HiromancjaZdjecie, { type ZdjecieDane } from "@/components/HiromancjaZdjecie";
import HiromancjaOdczyt from "@/components/HiromancjaOdczyt";
import SekcjaZlota from "@/components/SekcjaZlota";
import KoloDanychPanel from "@/components/KoloDanychPanel";
import ZapisanyOdczyt, { useZapisSekcji } from "@/components/ZapisanyOdczyt";

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
 * bierna" i wyjaśnienie D1/D9. (Ręczna kalibracja punktów usunięta 2026-10-04 —
 * AI sam ocenia kształt dłoni ze zdjęcia; imię i płeć są na górze, nad wyborem ręki).
 *
 * Świadomie POZA zakresem v1: integracja z /karma jako trzeci filar (kolejny,
 * osobny krok — nie ruszamy tu app/karma/page.tsx), getUserMedia/<video>
 * (plik z capture="environment" wystarcza), cache'owanie odczytu AI,
 * automatyczne sprawdzenie jakości zdjęcia przed odczytem (kolejny krok).
 */

type Reka = "prawa" | "lewa";

const PLEC_OPCJE: { id: "on" | "ona" | "ono"; label: string }[] = [
  { id: "on", label: "On" }, { id: "ona", label: "Ona" },
];

/** Dłonie wycięte dosłownie z wzorów public/brand/chiromancja-3.jpg (lewa) i -4.jpg (prawa),
 *  przezroczyste tło, kolor złota strony; *-taupe = ten sam kształt w taupe ze wzoru (#8c7f6f).
 *  Wcześniejsze icon-dlon-*.png miały 112 px i rozmywały się w dużych kołach. */
const IKONA_DLONI: Record<Reka, string> = {
  lewa: "/brand/dlon-lewa-duza.png",
  prawa: "/brand/dlon-prawa-duza.png",
};

function SekcjaDloni({ reka, dominujaca }: { reka: Reka; dominujaca: boolean }) {
  const nazwa = reka === "prawa" ? "PRAWA DŁOŃ" : "LEWA DŁOŃ";
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
      {/* duże złote koło z grubym pierścieniem i dłonią wypełniającą środek — wzór chiromancja-3/4.jpg */}
      <div className="dlon-kolo dlon-kolo-duze">
        <img src={IKONA_DLONI[reka]} alt="" />
      </div>
      <p style={{ marginTop: 18, marginBottom: 0, fontWeight: 700, fontSize: "1.05rem", color: "var(--sand)", letterSpacing: "0.02em" }}>
        {nazwa} — {dominujaca ? "dominująca" : "bierna"}
      </p>
      <p style={{ marginTop: 12, lineHeight: 1.6, color: "var(--sand)" }}>
        Tak jak w astrologii wedyjskiej D1 pokazuje przejawione życie, a D9 wrodzoną naturę — ta dłoń{" "}
        {dominujaca
          ? <><strong>dominująca</strong> (ta, którą piszesz) pokazuje, co świadomie zrobiłeś/aś ze sobą.</>
          : <><strong>bierna</strong> pokazuje wrodzony potencjał i talenty, z którymi się urodziłeś/aś.</>}
      </p>

    </div>
  );
}

export default function HiromancjaPage() {
  const [pismoReka, setPismoReka] = useState<Reka>("prawa");
  const [zdjecia, setZdjecia] = useState<Record<Reka, ZdjecieDane | null>>({ prawa: null, lewa: null });
  const [imie, setImie] = useState("");
  const [plec, setPlec] = useState<"on" | "ona" | "ono">("ona");
  const [zwiniete, setZwiniete] = useState(false);

  function handleZdjecie(reka: Reka, dane: ZdjecieDane) {
    setZdjecia((z) => ({ ...z, [reka]: dane }));
  }

  const obaZdjeciaGotowe = zdjecia.prawa && zdjecia.lewa;
  // ukończona sekcja — zapisany odczyt widoczny od razu, bez ponownego wgrywania zdjęć
  const zapis = useZapisSekcji("hiromancja");
  const rekaBierna: Reka = pismoReka === "prawa" ? "lewa" : "prawa";

  return (
    <div className="container section" style={{ paddingTop: 40 }}>
      <h1 style={{ textAlign: "center", color: "var(--sand)", marginBottom: 16 }}><Term k="hiromancja" plain>Chiromancja</Term></h1>
      <div className="skrot-hero-linia" />
      <p className="section-sub" style={{ color: "var(--sand)" }}>
        Prześlij zdjęcia obu dłoni — Claude spojrzy na nie i jakościowo opisze kształt dłoni oraz
        widoczne linie. To subiektywna obserwacja AI, nie pomiar.
      </p>

      {/* dane w złotym kole — ten sam panel co w Astrologii i Numerologii (KoloDanychPanel):
          imię, ręka pisząca i płeć; po „Zapisz” koło zwija się do złotej kropki „Twoje dane” */}
      <KoloDanychPanel zlozone={zwiniete} onRozwin={() => setZwiniete(false)}>
        <p className="kolo-danych-tytul">Twoje dane</p>
        <form className="card" style={{ display: "grid", gap: 18 }}
          onSubmit={(e) => { e.preventDefault(); setZwiniete(true); }}>
          <div>
            <label htmlFor="hiro-imie">Imię</label>
            <input id="hiro-imie" type="text" placeholder="np. Jacek" autoComplete="given-name"
              value={imie} onChange={(e) => setImie(e.target.value)} />
          </div>
          <div className="hiro-kolo-wybory">
            <div>
              <label id="hiro-pismo-label">Którą ręką piszesz?</label>
              <div className="bf-plec" role="radiogroup" aria-labelledby="hiro-pismo-label">
                {(["lewa", "prawa"] as const).map((r) => (
                  <button key={r} type="button" role="radio" aria-checked={pismoReka === r}
                    className={`bf-plec-opcja${pismoReka === r ? " bf-plec-opcja-aktywna" : ""}`}
                    onClick={() => setPismoReka(r)}>
                    {r === "lewa" ? "Lewa" : "Prawa"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label id="hiro-plec-label">Płeć</label>
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
          <button type="submit" className="btn btn-primary">Zapisz</button>
        </form>
      </KoloDanychPanel>

      <p style={{ fontSize: "0.8rem", textAlign: "center", maxWidth: 480, margin: "24px auto 28px", color: "var(--sand)" }}>
        Zdjęcia nigdzie nie są zapisywane — trafiają z przeglądarki prosto do modelu AI (dopiero
        gdy klikniesz „Odczytaj” niżej) i nie są przechowywane na serwerze ani w bazie danych.
      </p>

      {/* wgrywanie — wzór public/brand/chiromanca-2.jpg: duże koło z dłonią (ZŁOTE = zdjęcie
          wgrane, TAUPE = jeszcze nie), pod nim płaski złoty przycisk i podpis stanu.
          Dominującą rękę pokazuje przełącznik wyżej, nie kolor koła. */}
      <div className="dlon-wgrywanie">
        {(["lewa", "prawa"] as const).map((r) => (
          <div key={r} className="dlon-wgrywanie-kolumna">
            <div className={`dlon-kolo${zdjecia[r] ? "" : " dlon-kolo-czeka"}`}>
              <img src={zdjecia[r] ? IKONA_DLONI[r] : `/brand/dlon-${r}-duza-taupe.png`} alt="" />
            </div>
            <HiromancjaZdjecie id={`hiromancja-plik-${r}`} etykieta={`Prześlij zdjęcie — ${r === "lewa" ? "LEWA" : "PRAWA"} DŁOŃ`}
              maZdjecie={!!zdjecia[r]} onZdjecieGotowe={(d) => handleZdjecie(r, d)} />
            <p className={`dlon-status${zdjecia[r] ? " dlon-status-ok" : ""}`}>
              {zdjecia[r] ? "Wgrane poprawnie" : "Wgraj zdjęcie"}
            </p>
          </div>
        ))}
      </div>

      <div className="skrot-hero-linia" />

      <div style={{ display: "grid", gap: 40, marginTop: 40 }}>
        <SekcjaDloni reka="lewa" dominujaca={pismoReka === "lewa"} />

        <div className="skrot-hero-linia" style={{ width: "100%", margin: 0 }} />

        <SekcjaDloni reka="prawa" dominujaca={pismoReka === "prawa"} />
      </div>

      {/* odczyt dłoni widoczny zawsze — wcześniej pojawiał się dopiero po wgraniu obu zdjęć,
          więc trudno go było znaleźć; to on zapala krąg Chiromancji w Kole Karmy */}
      {!obaZdjeciaGotowe && zapis && (
        <div className="sekcja-zlota-ai">
          <SekcjaZlota tytul="Twój odczyt dłoni">
            <ZapisanyOdczyt zapis={zapis} />
            <p className="zapal-krag-info">
              ✦ Krąg Chiromancji świeci w Kole Karmy. Chcesz nowy odczyt? Wgraj zdjęcia obu dłoni powyżej.
            </p>
          </SekcjaZlota>
        </div>
      )}
      {!obaZdjeciaGotowe && !zapis && (
        <SekcjaZlota tytul="Odczyt dłoni">
          <p style={{ textAlign: "center", maxWidth: 520, margin: "0 auto 18px", lineHeight: 1.6 }}>
            Odczyt AI obu dłoni zapala krąg Chiromancji w Kole Karmy. Wgraj zdjęcia obu dłoni
            powyżej — wtedy w tym miejscu pojawi się przycisk odczytu.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 28, flexWrap: "wrap" }}>
            {(["lewa", "prawa"] as const).map((r) => (
              <span key={r} className={`dlon-status${zdjecia[r] ? " dlon-status-ok" : ""}`} style={{ fontSize: "0.74rem" }}>
                {r === "lewa" ? "Lewa dłoń" : "Prawa dłoń"}: {zdjecia[r] ? "wgrana ✓" : "brak zdjęcia"}
              </span>
            ))}
          </div>
        </SekcjaZlota>
      )}

      {obaZdjeciaGotowe && (
        <div className="fade-up" style={{ marginTop: 40, maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
          <div className="skrot-hero-linia" style={{ marginTop: 0 }} />
          <div className="sekcja-zlota-ai">
          <HiromancjaOdczyt
            wiodaca={{ imageBase64: zdjecia[pismoReka]!.base64, imageMediaType: zdjecia[pismoReka]!.mediaType }}
            bierna={{ imageBase64: zdjecia[rekaBierna]!.base64, imageMediaType: zdjecia[rekaBierna]!.mediaType }}
            plec={plec}
            imie={imie.trim() || undefined}
          />
          </div>

          <p className="muted" style={{ fontSize: "0.78rem", marginTop: 20, textAlign: "center" }}>
            To na razie samodzielna strona — w przyszłości ten odczyt dołączy do{" "}
            <Link href="/karma" style={{ color: "var(--sand)", textDecoration: "underline" }}>Karmy</Link> jako trzeci filar, obok
            numerologii i astrologii.
          </p>
        </div>
      )}
    </div>
  );
}
