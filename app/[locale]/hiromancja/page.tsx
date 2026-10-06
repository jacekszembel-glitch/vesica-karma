"use client";

import { useEffect, useState } from "react";
import Term from "@/components/Term";
import HiromancjaZdjecie, { type ZdjecieDane } from "@/components/HiromancjaZdjecie";
import HiromancjaOdczyt from "@/components/HiromancjaOdczyt";
import HiromancjaSesja from "@/components/HiromancjaSesja";
import HiromancjaInwentarz, { type InwentarzPotwierdzony } from "@/components/HiromancjaInwentarz";
import { wczytajZnakiWlasne, zapiszZnakiWlasne } from "@/lib/hiromancjaOdczytStore";
import type { ZnakWlasny } from "@/lib/astro/zgodnosc";
import { UJECIA, wytnijMiejsce, type Miejsce, type Strefa, type TypUjecia, type Ujecie } from "@/lib/hiromancjaObraz";
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

/** Vercel przyjmuje ~4,5 MB na zapytanie — na obie ręce (base64) zostawiamy zapas. */
const LIMIT_ZNAKOW_NA_REKE = 2_000_000;

/**
 * Wszystko o jednej ręce w kształcie, którego oczekuje /api/hiromancja. Kolejność = priorytet,
 * gdy całość nie mieści się w limicie: wskazane miejsca, potem osobne ujęcia (wg UJECIA),
 * na końcu automatyczne wycinki — te ostatnie pomijamy, gdy są już prawdziwe zbliżenia z bliska.
 */
function doOdczytu(z: ZdjecieDane, ujecia: Partial<Record<TypUjecia, Ujecie>>, miejsca: Miejsce[]) {
  const wskazane = miejsca.map((m, i) => wytnijMiejsce(z.zrodlo, m, i + 1));
  const osobne: Strefa[] = UJECIA.filter((u) => ujecia[u.typ]).map((u) => ({ opis: u.opisDlaAI, base64: ujecia[u.typ]!.base64 }));
  const saZblizenia = !!(ujecia.gora || ujecia.dol);
  const kolejka = [...wskazane, ...osobne, ...(saZblizenia ? [] : z.strefy)];
  let suma = z.base64.length;
  const strefy = kolejka.filter((s) => (suma += s.base64.length) <= LIMIT_ZNAKOW_NA_REKE);
  return {
    imageBase64: z.base64, imageMediaType: z.mediaType,
    strefy: strefy.map((s) => ({ opis: s.opis, imageBase64: s.base64 })),
  };
}

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
  const [ujecia, setUjecia] = useState<Record<Reka, Partial<Record<TypUjecia, Ujecie>>>>({ prawa: {}, lewa: {} });
  const [miejsca, setMiejsca] = useState<Record<Reka, Miejsce[]>>({ prawa: [], lewa: [] });
  const [znakiWlasne, setZnakiWlasne] = useState<ZnakWlasny[]>([]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydratacja z localStorage po zamontowaniu
  useEffect(() => { setZnakiWlasne(wczytajZnakiWlasne()); }, []);
  const zmienZnakiWlasne = (z: ZnakWlasny[]) => { setZnakiWlasne(z); zapiszZnakiWlasne(z); };
  // krok 1 (co AI widzi) → „Dalej” → krok 2 (odczyt z tą listą)
  const [inwentarz, setInwentarz] = useState<InwentarzPotwierdzony | null>(null);

  function handleZdjecie(reka: Reka, dane: ZdjecieDane) {
    setInwentarz(null); // nowe zdjęcie — lista znaków do zrobienia od nowa
    setZdjecia((z) => {
      // nowe zdjęcie główne (inny plik) — wskazane miejsca dotyczyły starego
      if (z[reka] && z[reka]!.zrodlo !== dane.zrodlo) {
        setMiejsca((m) => ({ ...m, [reka]: [] }));
        z[reka]!.zrodlo.close(); // zwolnij pamięć starego oryginału
      }
      return { ...z, [reka]: dane };
    });
  }

  const obaZdjeciaGotowe = zdjecia.prawa && zdjecia.lewa;
  // ukończona sekcja — zapisany odczyt widoczny od razu, bez ponownego wgrywania zdjęć
  const zapis = useZapisSekcji("hiromancja");
  const rekaBierna: Reka = pismoReka === "prawa" ? "lewa" : "prawa";

  // co jeszcze trzeba, żeby pojawił się przycisk odczytu — widoczne przy samym odczycie
  const brakuje = (
    <div className="hiro-braki">
      <p>Przycisk „Odczytaj dłonie” pojawi się tutaj, gdy wgrasz <strong>Zdjęcie 1: cała dłoń</strong> dla obu rąk:</p>
      <ul>
        {(["lewa", "prawa"] as const).map((r) => {
          const dodatkowe = Object.keys(ujecia[r]).length;
          return (
            <li key={r} className={zdjecia[r] ? "ok" : undefined}>
              {r === "lewa" ? "Lewa" : "Prawa"} dłoń — zdjęcie całej dłoni: {zdjecia[r] ? "wgrane ✓" : "brak"}
              {dodatkowe > 0 && ` · dodatkowe ujęcia: ${dodatkowe}`}
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div className="container section" style={{ paddingTop: 40 }}>
      <h1 style={{ textAlign: "center", color: "var(--sand)", marginBottom: 16 }}><Term k="hiromancja" plain>Chiromancja</Term></h1>
      <div className="skrot-hero-linia" />
      <p className="section-sub" style={{ color: "var(--sand)" }}>
        Zrób kilka zdjęć każdej dłoni: całą dłoń i zbliżenia z bliska — Claude obejrzy je razem
        i opisze kształt dłoni, linie i znaki. To subiektywna obserwacja AI, nie pomiar.
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
      {/* jak zrobić zdjęcie, na którym widać niuanse — od tego zależy jakość odczytu */}
      <div className="dlon-wskazowki">
        <p className="eyebrow" style={{ marginBottom: 8, color: "var(--sand)" }}>Jak zrobić dobre zdjęcie</p>
        <ul>
          <li>Światło z boku — najlepiej przy oknie w dzień. Bez lampy błyskowej: spłaszcza linie.</li>
          <li>Dłoń płasko, palce lekko rozsunięte, cała dłoń z nadgarstkiem w kadrze.</li>
          <li>Telefon równolegle do dłoni, ok. 25–30 cm nad nią; stuknij w dłoń na ekranie, żeby ustawić ostrość.</li>
        </ul>
      </div>

      <div className="dlon-wgrywanie">
        {(["lewa", "prawa"] as const).map((r) => (
          <div key={r} className="dlon-wgrywanie-kolumna">
            <div className={`dlon-kolo${zdjecia[r] ? "" : " dlon-kolo-czeka"}`}>
              <img src={zdjecia[r] ? IKONA_DLONI[r] : `/brand/dlon-${r}-duza-taupe.png`} alt="" />
            </div>
            <HiromancjaZdjecie id={`hiromancja-plik-${r}`} etykieta={`Zdjęcie 1: cała dłoń — ${r === "lewa" ? "LEWA" : "PRAWA"}`}
              maZdjecie={!!zdjecia[r]} onZdjecieGotowe={(d) => handleZdjecie(r, d)} />
            <p className={`dlon-status${zdjecia[r] ? " dlon-status-ok" : ""}`}>
              {zdjecia[r] ? "Wgrane poprawnie" : "Wgraj zdjęcie"}
            </p>
          </div>
        ))}
      </div>

      {/* sesja zdjęć: dodatkowe ujęcia i wskazane miejsca — widoczna od początku, żeby było jasne,
          że zdjęć jest kilka; „obejrzyj to miejsce” pojawia się po wgraniu zdjęcia całej dłoni */}
      <div className="hs-sekcja">
          <p className="eyebrow" style={{ textAlign: "center", color: "var(--sand)", marginBottom: 6 }}>Kolejne zdjęcia każdej dłoni</p>
          <p style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 22px", fontSize: "0.86rem", lineHeight: 1.6, color: "var(--sand)" }}>
            Poza zdjęciem całej dłoni zrób zbliżenia i ujęcia z poniższej listy — znaki takie jak krzyże,
            gwiazdy czy kratki najlepiej widać z bliska i przy świetle z boku. Każde ujęcie to więcej
            prawdziwych szczegółów do odczytu.
          </p>
          <div className="hs-rece">
            {(["lewa", "prawa"] as const).map((r) => (
              <HiromancjaSesja key={r} idBaza={`hs-${r}`}
                etykieta={`${r === "lewa" ? "Lewa" : "Prawa"} dłoń — ${r === pismoReka ? "wiodąca" : "bierna"}`}
                dataUrlGlowne={zdjecia[r]?.dataUrl ?? null}
                ujecia={ujecia[r]}
                onUjecie={(typ, u) => setUjecia((s) => {
                  const nowe = { ...s[r] };
                  if (u) nowe[typ] = u; else delete nowe[typ];
                  return { ...s, [r]: nowe };
                })}
                miejsca={miejsca[r]}
                onMiejsca={(m) => setMiejsca((s) => ({ ...s, [r]: m }))} />
            ))}
          </div>
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
            {brakuje}
          </SekcjaZlota>
        </div>
      )}
      {!obaZdjeciaGotowe && !zapis && (
        <SekcjaZlota tytul="Odczyt dłoni">
          <p style={{ textAlign: "center", maxWidth: 520, margin: "0 auto 18px", lineHeight: 1.6 }}>
            Odczyt AI obu dłoni zapala krąg Chiromancji w Kole Karmy.
          </p>
          {brakuje}
        </SekcjaZlota>
      )}

      {obaZdjeciaGotowe && !inwentarz && (
        <div className="fade-up sekcja-zlota-ai">
          <SekcjaZlota tytul="Krok 1 — co widać na Twoich dłoniach">
            <HiromancjaInwentarz
              wiodaca={doOdczytu(zdjecia[pismoReka]!, ujecia[pismoReka], miejsca[pismoReka])}
              bierna={doOdczytu(zdjecia[rekaBierna]!, ujecia[rekaBierna], miejsca[rekaBierna])}
              nazwyRak={{ wiodaca: pismoReka, bierna: rekaBierna }}
              znakiWlasne={znakiWlasne}
              onZnakiWlasne={zmienZnakiWlasne}
              onDalej={setInwentarz}
            />
          </SekcjaZlota>
        </div>
      )}

      {obaZdjeciaGotowe && inwentarz && (
        <div className="fade-up sekcja-zlota-ai">
          <SekcjaZlota tytul="Krok 2 — odczyt dłoni">
          <p style={{ textAlign: "center", marginBottom: 6 }}>
            <button type="button" className="hs-usun" onClick={() => setInwentarz(null)}>← wróć do listy znaków</button>
          </p>
          <HiromancjaOdczyt
            wiodaca={doOdczytu(zdjecia[pismoReka]!, ujecia[pismoReka], miejsca[pismoReka])}
            bierna={doOdczytu(zdjecia[rekaBierna]!, ujecia[rekaBierna], miejsca[rekaBierna])}
            plec={plec}
            imie={imie.trim() || undefined}
            deklaracje={znakiWlasne}
            inwentarz={inwentarz}
            autoStart
          />
          </SekcjaZlota>
        </div>
      )}

      <div className="skrot-hero-linia" />

      <div style={{ display: "grid", gap: 40, marginTop: 40 }}>
        <SekcjaDloni reka="lewa" dominujaca={pismoReka === "lewa"} />

        <div className="skrot-hero-linia" style={{ width: "100%", margin: 0 }} />

        <SekcjaDloni reka="prawa" dominujaca={pismoReka === "prawa"} />
      </div>

    </div>
  );
}
