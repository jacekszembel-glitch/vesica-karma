"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import BirthForm, { type BirthInput } from "@/components/BirthForm";
import { loadBirth } from "@/lib/birthStore";
import NorthChart from "@/components/NorthChart";
import SouthChart from "@/components/SouthChart";
import Interpretation from "@/components/Interpretation";
import Rozmowa from "@/components/Rozmowa";
import { buildChart, type VedicChart, type Dignity } from "@/lib/astro/chart";
import { GRAHAS, RASIS, PLANET_ORDER } from "@/lib/astro/constants";
import { formatDMS } from "@/lib/astro/math";
import Konwencje from "@/components/Konwencje";
import Term from "@/components/Term";
import { navamsaChart, dashamsaChart, isVargottama } from "@/lib/astro/varga";
import { nakshatraOf, nakshatraTerm } from "@/lib/astro/nakshatra";
import ProfilDuszy from "@/components/ProfilDuszy";
import DaszaSekcja from "@/components/DaszaSekcja";
import PlanetyWSkrocie from "@/components/PlanetyWSkrocie";
import Talenty from "@/components/Talenty";
import WrazliwoscDuchowa from "@/components/WrazliwoscDuchowa";
import { poziomWzmocnienia, kondycjaWskaznik, MOZLIWE_ZAWODY } from "@/lib/astro/domInterpretacja";
import { ocenaWladcy } from "@/lib/astro/sila";
import { wykryteJogiPosortowane } from "@/lib/astro/yogas";
import JednoSpojrzenie from "@/components/JednoSpojrzenie";
import WargiDodatkowe from "@/components/WargiDodatkowe";
import AsztakawargaSekcja from "@/components/AsztakawargaSekcja";
import SzadbalaSekcja from "@/components/SzadbalaSekcja";
import { karakiCzarowe, jogakaraka } from "@/lib/astro/karaki";
import KarakiCzarowe from "@/components/KarakiCzarowe";
import JogiISzczescie from "@/components/JogiISzczescie";
import MapaCzasuJog from "@/components/MapaCzasuJog";
import MapaCzasuDosz from "@/components/MapaCzasuDosz";
import OsZycia from "@/components/OsZycia";
import { fazyZycia } from "@/lib/astro/lifemap";
import RankingGrah from "@/components/RankingGrah";
import NaCoUwazac from "@/components/NaCoUwazac";
import RankingDomeny from "@/components/RankingDomeny";
import { TABELA_FINANSE, TABELA_ZDROWIE } from "@/lib/astro/percentyleDomen";
import NaCoUwazacDomeny from "@/components/NaCoUwazacDomeny";
import {
  FINANSE_OPIS, FINANSE_UWAGA, FINANSE_UWAGA_OPIS,
} from "@/lib/astro/finanseUczucia";
import { ocenaFinansowa, HORA_OPIS } from "@/lib/astro/finanseWedyjskie";
import {
  ocenaZdrowotna, ZDROWIE_OPIS, ZDROWIE_UWAGA, ZDROWIE_UWAGA_OPIS,
} from "@/lib/astro/zdrowieWedyjski";
import GodloPlanety from "@/components/GodloPlanety";
import HeksDomu from "@/components/HeksDomu";
import { BHAVAS } from "@/lib/astro/constants";
import { odblokuj } from "@/lib/collection";

type StylWykresu = "polnocny" | "poludniowy";
const KLUCZ_STYLU = "9dom_styl_wykresu";

/**
 * VesicaKarma nie ma "Rodzaju odczytu" (Portret/Dziecko/Finanse/Prognoza) —
 * strona pokazuje zawsze CAŁY kosmogram, wszystkie sekcje naraz (dawny tryb
 * "portret"). Finanse i inne wątki tematyczne trafiają do jednej, wspólnej
 * interpretacji AI na dole, zamiast osobnego, węższego raportu. Panel danych
 * jest dla JEDNEJ osoby (Twój własny profil, wspólny ze wszystkimi modułami
 * serwisu przez lib/birthStore.ts) — wcześniejsza wersja z kafelkami wielu
 * zapisanych osób (lib/osobyStore.ts) została wycofana na rzecz koła danych
 * wzorowanego na designie 9dom.pl.
 */
type SekcjaKosmogramu = "techniczne" | "czasGleboko" | "dusza" | "predyspozycje" | "finanse" | "zdrowie";
const WSZYSTKIE_SEKCJE: Record<SekcjaKosmogramu, boolean> = {
  techniczne: true, czasGleboko: true, dusza: true, predyspozycje: true, finanse: true, zdrowie: true,
};

/**
 * Kolor odznaki wzmacniacza (vargottama) — sam wzmacniacz nie jest ani dobry,
 * ani zły, wzmacnia to, co planeta i tak reprezentuje. Zielony/czerwony tylko
 * gdy godność jednoznacznie wskazuje kierunek, inaczej zostaje neutralne złoto.
 */
function wzmocnienieBadge(dignity: Dignity): { className: string; style?: React.CSSProperties } {
  const poziom = poziomWzmocnienia(dignity);
  if (poziom === "dobre") return { className: "badge badge-good" };
  if (poziom === "zle") return { className: "badge badge-warn" };
  return { className: "badge", style: { borderColor: "var(--line-gold)", color: "var(--primary-soft)" } };
}


/**
 * Pierścień znaku zodiaku — glif na środku, wypełnienie pierścienia to
 * "kondycja" (siła godności) tej pozycji, ta sama wartość co pasek
 * kondycjaWskaznik gdzie indziej w serwisie (Synteza niżej na tej samej
 * stronie) — dwa miejsca liczą siłę identycznie, tylko rysują ją inaczej.
 * Kolor zawsze złoto/taupe (nie zielony/czerwony jak gdzie indziej) — to
 * skrót tuż pod Kołem Karmy, ma być wizualnie jednym z nim, nie osobnym
 * systemem kolorów. Ostre (nie zaokrąglone) końce wypełnienia — spójne
 * z resztą serwisu, gdzie ostre krawędzie są świadomym wyborem.
 */
function PierscienZnaku({ symbol, procent, size = 108 }: { symbol: string; procent: number; size?: number }) {
  const stroke = 9;
  const r = size / 2 - stroke / 2;
  const obwod = 2 * Math.PI * r;
  const dl = (Math.max(0, Math.min(100, procent)) / 100) * obwod;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--taupe)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sand)" strokeWidth={stroke}
        strokeDasharray={`${dl} ${obwod - dl}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 0.6s var(--ease-out)" }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        fontSize={size * 0.36} fill="var(--sand)">{symbol}</text>
    </svg>
  );
}

type TrybKosmogramu = "poczatkujacy" | "zaawansowany";
const KLUCZ_TRYBU = "9dom_tryb_kosmogramu";

export default function KosmogramPage() {
  const [chart, setChart] = useState<VedicChart | null>(null);
  const [birthInput, setBirthInput] = useState<BirthInput | null>(null);
  const [styl, setStyl] = useState<StylWykresu>("polnocny");
  const [tryb, setTryb] = useState<TrybKosmogramu>("poczatkujacy");

  useEffect(() => {
    const s = localStorage.getItem(KLUCZ_STYLU);
    const t = localStorage.getItem(KLUCZ_TRYBU);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- celowa hydratacja preferencji z localStorage po zamontowaniu
    if (s === "polnocny" || s === "poludniowy") setStyl(s);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- jw.
    if (t === "poczatkujacy" || t === "zaawansowany") setTryb(t);

    // Panel jest teraz dla jednej osoby (własny profil, wspólny ze wszystkimi
    // modułami serwisu) — wracający użytkownik od razu widzi swój kosmogram,
    // bez ponownego wypełniania formularza.
    const b = loadBirth();
    if (!b) return;
    const effectiveTime = b.timeKnown ? b.time : "12:00";
    const local = DateTime.fromISO(`${b.date}T${effectiveTime}`, { zone: b.place.tz });
    if (!local.isValid) return;
    handleSubmit({
      utc: local.toUTC().toJSDate(),
      latitude: b.place.lat,
      longitude: b.place.lon,
      timeKnown: b.timeKnown,
      isoDate: b.date,
      placeName: b.place.name,
      localTime: effectiveTime,
      plec: b.plec ?? "ona",
      name: b.name,
      place: b.place,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tylko przy montowaniu, handleSubmit stabilny w obrębie renderu
  }, []);

  function zmienStyl(s: StylWykresu) {
    setStyl(s);
    try { localStorage.setItem(KLUCZ_STYLU, s); } catch { /* tryb prywatny */ }
  }

  function zmienTryb(t: TrybKosmogramu) {
    setTryb(t);
    try { localStorage.setItem(KLUCZ_TRYBU, t); } catch { /* tryb prywatny */ }
  }

  function handleSubmit(input: BirthInput) {
    setBirthInput(input);
    setChart(
      buildChart({
        date: input.utc,
        latitude: input.latitude,
        longitude: input.longitude,
        timeKnown: input.timeKnown,
      }),
    );
    odblokuj("kosmogram");
  }

  /** Kompaktowe dane dla AI — tylko to, co potrzebne do interpretacji. */
  const aiData = useMemo(() => {
    if (!chart || !birthInput) return null;
    return {
      imie: birthInput.name || undefined,
      plec: birthInput.plec,
      miejsce: birthInput.placeName,
      dataUrodzenia: birthInput.isoDate,
      godzinaZnana: chart.birth.timeKnown,
      lagna: chart.angles
        ? { znak: RASIS[chart.angles.lagnaSign].pl, stopien: formatDMS(chart.angles.ascendant % 30) }
        : null,
      planety: PLANET_ORDER.map((id) => {
        const p = chart.planets[id];
        return {
          planeta: GRAHAS[id].pl,
          znak: p.signPl,
          stopien: p.degreeFormatted,
          dom: p.house || undefined,
          nakszatra: `${p.nakshatra.nakshatra.pl} (pada ${p.nakshatra.pada})`,
          godnosc: p.dignity,
          retrogradacja: p.retrograde || undefined,
          spalona: p.combust || undefined,
        };
      }),
      nakszatraKsiezyca: {
        nazwa: chart.moonNakshatra.nakshatra.pl,
        wladca: GRAHAS[chart.moonNakshatra.nakshatra.lord].pl,
        motyw: chart.moonNakshatra.nakshatra.motyw,
        pada: chart.moonNakshatra.pada,
      },
      jogakaraka: chart.angles && jogakaraka(chart.angles.lagnaSign)
        ? GRAHAS[jogakaraka(chart.angles.lagnaSign)!].pl
        : null,
      karakiCzarowe: karakiCzarowe(chart).map((ka) => ({
        rola: `${ka.skrot} (${ka.pl})`, planeta: GRAHAS[ka.planeta].pl, znaczenie: ka.znaczenie,
      })),
      aktualnyOkres: chart.currentDasha.map((d) => ({
        poziom: d.level === 1 ? "mahadasza" : d.level === 2 ? "antardasza" : "pratjantardasza",
        wladca: GRAHAS[d.lord].pl,
        do: d.end.toISOString().slice(0, 10),
      })),
      // horyzont ~15 lat naprzod (mahadasza+antardasza, bez pratjantardaszy — zeby nie
      // rozdmuchiwac payloadu) — bez tego model nie mial danych o przyszlych podokresach
      // i szczerze odpowiadal "nie wiem", np. o podokresie zaczynajacym sie za kilka lat.
      nadchodzaceOkresy: (() => {
        const teraz = new Date();
        const horyzont = new Date(teraz.getTime() + 15 * 365.25 * 86400000);
        const wpisy: { poziom: string; wladca: string; od: string; do: string }[] = [];
        for (const maha of chart.dashas) {
          if (maha.end <= teraz || maha.start >= horyzont) continue;
          wpisy.push({
            poziom: "mahadasza", wladca: GRAHAS[maha.lord].pl,
            od: maha.start.toISOString().slice(0, 10), do: maha.end.toISOString().slice(0, 10),
          });
          for (const antar of maha.sub ?? []) {
            if (antar.end <= teraz || antar.start >= horyzont) continue;
            wpisy.push({
              poziom: "antardasza", wladca: GRAHAS[antar.lord].pl,
              od: antar.start.toISOString().slice(0, 10), do: antar.end.toISOString().slice(0, 10),
            });
          }
        }
        return wpisy;
      })(),
      // predyspozycje i jogi — do sekcji "czym się zajmować, jaka dziedzina", ktora
      // uzytkownicy pytaja najczesciej; bez tego model zgadywal bez policzonych danych.
      // jogiDlaOceny liczone raz i przekazane do ocenaWladcy, zeby ranking uwzgledniал
      // udzial w jogach tak samo jak RankingGrah na stronie (spojnosc z tym, co user widzi)
      // pole 'zawody' — kierunki zawodowe DOPISANE do najsilniejszej predyspozycji tej planety
      // (MOZLIWE_ZAWODY), nie z osobnego, oderwanego silnika kariery — na wyrazna prosbe
      // uzytkownika, ktory uznal osobna sekcje "Zawod i kariera" (wladca 10. domu/D10/Amatyakaraka)
      // za nietrafna wobec wlasnego doswiadczenia i wolal, zeby zawody wynikaly wprost z Predyspozycji.
      predyspozycje: (() => {
        const jogiDlaOceny = wykryteJogiPosortowane(chart);
        return PLANET_ORDER.map((id) => ({ id, ocena: ocenaWladcy(chart, id, jogiDlaOceny) }))
          .sort((a, b) => b.ocena.punkty - a.ocena.punkty)
          .slice(0, 5)
          .map((d) => ({
            planeta: GRAHAS[d.id].pl, ton: d.ocena.ton, punkty: d.ocena.punkty,
            uzasadnienie: d.ocena.czynniki.slice(0, 3),
            zawody: MOZLIWE_ZAWODY[d.id],
          }));
      })(),
      talenty: wykryteJogiPosortowane(chart).map((j) => ({ nazwa: j.nazwa, znaczenie: j.znaczenie, uzasadnienie: j.uzasadnienie })),
    };
  }, [chart, birthInput]);

  const d9 = useMemo(() => (chart ? navamsaChart(chart) : null), [chart]);
  const d10 = useMemo(() => (chart ? dashamsaChart(chart) : null), [chart]);
  const finansowe = useMemo(() => (chart ? ocenaFinansowa(chart) : null), [chart]);
  const finanse = finansowe?.planety ?? [];
  const zdrowotne = useMemo(() => (chart ? ocenaZdrowotna(chart) : null), [chart]);
  const zdrowie = zdrowotne?.planety ?? [];
  const lifePhases = useMemo(() => (chart ? fazyZycia(chart, chart.birth.date) : []), [chart]);

  const w = WSZYSTKIE_SEKCJE;
  const maPelneDane = true;

  return (
    <div className="container section">
      <h1 style={{ textAlign: "center", color: "var(--sand)" }}>Astrologia Wedyjska</h1>
      <p className="section-sub" style={{ color: "var(--sand)" }}>
        Mapa nieba z chwili urodzenia w zodiaku syderycznym (ayanamsa Lahiri) —
        <Term k="lagna">lagna</Term>, <Term k="graha">9 grah</Term>, <Term k="dom">domy</Term>,{" "}
        <Term k="nakszatra">nakszatry</Term> i <Term k="dasza">okresy planetarne</Term>.
      </p>

      {/* Koło danych — panel dla JEDNEJ osoby (Twój własny profil, wspólny
          ze wszystkimi modułami serwisu przez lib/birthStore.ts), wzorowany
          na designie 9dom.pl i na public/brand/panel.jpg. BirthForm.tsx jest
          używany wyłącznie tutaj, więc jego układ (Płeć obok "Nie znam
          godziny") jest dopasowany pod ten kontekst; wygląd pól dopina
          scoped CSS (.kolo-danych ...). */}
      <div className="kolo-danych-scena">
        <div className="kolo-danych">
          <p className="kolo-danych-tytul">Twoje dane</p>
          <BirthForm onSubmit={handleSubmit} submitLabel="Zapisz" />
        </div>
      </div>

      {chart && (
        <div className="fade-up" style={{ marginTop: 48 }}>
          {/* skrót najważniejszych faktów — trzy duże pierścienie ze znakiem
              zodiaku tuż pod Kołem Karmy, zanim zejdzie się do szczegółów.
              Wypełnienie pierścienia = kondycjaWskaznik tej pozycji (dla
              Ascendentu — godność JEGO WŁADCY, ten sam skrót co w panelu
              Synteza niżej), więc zmienia się automatycznie wraz z danymi
              urodzenia, nie jest wpisane na sztywno. */}
          <div className="skrot-hero">
            <div className="skrot-hero-linia" />
            <div className="skrot-hero-rzad">
              {chart.angles && (() => {
                const lagnaNak = nakshatraOf(chart.angles.ascendant);
                const wladcaAscendentu = RASIS[chart.angles.lagnaSign].lord;
                const k = kondycjaWskaznik(chart.planets[wladcaAscendentu].dignity);
                return (
                  <div className="skrot-hero-item">
                    <PierscienZnaku symbol={RASIS[chart.angles.lagnaSign].symbol} procent={k.procent} />
                    <p className="skrot-hero-znak">{RASIS[chart.angles.lagnaSign].pl}</p>
                    <p className="eyebrow skrot-hero-rola"><Term k="lagna">Ascendent</Term></p>
                    <div className="skrot-hero-podkreslenie" />
                    <p className="muted skrot-hero-detal" style={{ color: "var(--sand)" }}>{formatDMS(chart.angles.ascendant % 30)}</p>
                    <p className="muted skrot-hero-detal" style={{ color: "var(--sand)" }}>
                      <Term k="nakszatra" plain>{lagnaNak.nakshatra.pl}</Term> <span>p.{lagnaNak.pada}</span>
                    </p>
                  </div>
                );
              })()}
              {(["sun", "moon"] as const).map((id) => {
                const p = chart.planets[id];
                const g = GRAHAS[id];
                const k = kondycjaWskaznik(p.dignity);
                return (
                  <div key={id} className="skrot-hero-item">
                    <PierscienZnaku symbol={RASIS[p.sign].symbol} procent={k.procent} />
                    <p className="skrot-hero-znak">{p.signPl}</p>
                    <p className="eyebrow skrot-hero-rola">{g.pl}</p>
                    <div className="skrot-hero-podkreslenie" />
                    <p className="muted skrot-hero-detal" style={{ color: "var(--sand)" }}>
                      {p.degreeFormatted}{chart.angles && ` · dom ${p.house}`}
                    </p>
                    <p className="muted skrot-hero-detal" style={{ color: "var(--sand)" }}>
                      <Term term={nakshatraTerm(p.nakshatra)} plain>{p.nakshatra.nakshatra.pl}</Term> <span>p.{p.nakshatra.pada}</span>
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="skrot-hero-linia" />
          </div>

          <JednoSpojrzenie chart={chart} />

          {chart.angles && w.dusza && <ProfilDuszy chart={chart} />}

          {/* poczatkujacy/zaawansowany — poczatkujacy pokazuje tylko interpretacyjne rankingi
              (Predyspozycje/Finanse/Zdrowie), zaawansowany cala reszte (diagramy, tabele, warga,
              Asztakawarga, Szadbala, Dasza, Karaki, Jogi, Dosze, glosariusze). Kazda osoba ma
              zawsze pelny kosmogram, wiec ten przelacznik jest zawsze widoczny (maPelneDane = true). */}
          {maPelneDane && (
          <div className="card poziom-blok" style={{ marginBottom: 24 }}>
            <p className="eyebrow" style={{ marginBottom: 14 }}>Wybierz poziom szczegółowości</p>
            <div className="poziom-siatka" role="radiogroup" aria-label="Poziom szczegółowości kosmogramu">
              <button type="button" role="radio" aria-checked={tryb === "poczatkujacy"}
                className={`poziom-opcja${tryb === "poczatkujacy" ? " poziom-opcja-aktywna" : ""}`}
                onClick={() => zmienTryb("poczatkujacy")}>
                <span className="poziom-opcja-etykieta">Odczyt</span>
                <span className="poziom-opcja-opis">Kluczowe wnioski, bez surowych tabel</span>
              </button>
              <button type="button" role="radio" aria-checked={tryb === "zaawansowany"}
                className={`poziom-opcja${tryb === "zaawansowany" ? " poziom-opcja-aktywna" : ""}`}
                onClick={() => zmienTryb("zaawansowany")}>
                <span className="poziom-opcja-etykieta">Pełne dane</span>
                <span className="poziom-opcja-opis">Diagramy, warga, dasza, jogi i dosze</span>
              </button>
            </div>
            <p className="muted" style={{ fontSize: "0.8rem", marginTop: 14 }}>
              {tryb === "poczatkujacy"
                ? "Predyspozycje (z możliwymi zawodami), finanse, zdrowie — bez surowych tabel i technicznych systemów."
                : "Pełny obraz: diagramy D1/D9, wszystkie warga (w tym D10), Asztakawarga, Szadbala, dasza, jogi i dosze."}
            </p>
          </div>
          )}

          {chart.angles && tryb === "zaawansowany" && w.techniczne && (
            <details className="card" style={{ marginBottom: 24 }} open>
              <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)", marginBottom: 4 }}>
                Diagramy D1 i D9
              </summary>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18, marginTop: 14 }}>
                <div className="bf-plec" style={{ width: "min(320px, 100%)", gridTemplateColumns: "repeat(2, 1fr)" }} role="radiogroup" aria-label="Styl diagramu">
                  <button type="button" role="radio" aria-checked={styl === "polnocny"}
                    className={`bf-plec-opcja${styl === "polnocny" ? " bf-plec-opcja-aktywna" : ""}`}
                    onClick={() => zmienStyl("polnocny")}>
                    Północnoindyjski
                  </button>
                  <button type="button" role="radio" aria-checked={styl === "poludniowy"}
                    className={`bf-plec-opcja${styl === "poludniowy" ? " bf-plec-opcja-aktywna" : ""}`}
                    onClick={() => zmienStyl("poludniowy")}>
                    Południowoindyjski
                  </button>
                </div>
              </div>
              {/* D1 obok D9 — astrolog indyjski czyta je zawsze razem:
                  mapa główna mówi, co widać, nawamsza — ile w tym siły. */}
              <div className="wykresy-para">
                <div>
                  <p className="wykres-podpis">
                    D1 · Rasi <span>mapa główna</span>
                  </p>
                  {styl === "polnocny" ? <NorthChart chart={chart} compareChart={d9 ?? undefined} /> : <SouthChart chart={chart} compareChart={d9 ?? undefined} />}
                </div>
                {d9 && (
                  <div>
                    <p className="wykres-podpis">
                      <Term k="nawamsza">D9 · Nawamsza</Term> <span>wewnętrzna siła</span>
                    </p>
                    {styl === "polnocny" ? <NorthChart chart={d9} /> : <SouthChart chart={d9} />}
                  </div>
                )}
              </div>
              <p className="muted" style={{ textAlign: "center", fontSize: "0.85rem", marginTop: 14, lineHeight: 1.6 }}>
                Diagram {styl === "polnocny" ? "północnoindyjski" : "południowoindyjski"} · domy Whole Sign · ayanamsa Lahiri {chart.ayanamsa.toFixed(2)}°
                <br />
                Planeta słaba w mapie głównej, ale mocna w nawamszy, i tak się w końcu obroni.
                Ta sama w obu wykresach — <Term k="vargottama">vargottama</Term> — działa wyjątkowo spójnie.
              </p>
            </details>
          )}

          {tryb === "zaawansowany" && w.techniczne && <>
          <details className="card" style={{ overflowX: "auto", marginBottom: 24 }} open>
            <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)", marginBottom: 14 }}>
              Pozycje planet — D1 · Rasi
            </summary>
            <table>
              <thead>
                <tr>
                  <th>Graha</th><th>Znak</th><th>Stopień</th>
                  {chart.angles && <th>Dom</th>}
                  <th><Term k="nakszatra">Nakszatra</Term></th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {PLANET_ORDER.map((id) => {
                  const p = chart.planets[id];
                  const g = GRAHAS[id];
                  return (
                    <tr key={id}>
                      <td><span style={{ color: g.color }}>{g.symbol}</span> {g.pl}</td>
                      <td>{p.signPl}</td>
                      <td>{p.degreeFormatted}</td>
                      {chart.angles && <td>{p.house}</td>}
                      <td>
                        <Term term={nakshatraTerm(p.nakshatra)} plain>{p.nakshatra.nakshatra.pl}</Term>{" "}
                        <span className="muted">p.{p.nakshatra.pada}</span>
                      </td>
                      <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {chart.angles && jogakaraka(chart.angles.lagnaSign) === id && (
                          <Term k="jogakaraka" plain>
                            <span className="badge badge-good">jogakaraka</span>
                          </Term>
                        )}
                        {isVargottama(p.longitude) && (() => {
                          const b = wzmocnienieBadge(p.dignity);
                          return (
                            <Term k="vargottama" plain>
                              <span className={b.className} style={b.style}>vargottama</span>
                            </Term>
                          );
                        })()}
                        {p.retrograde && id !== "rahu" && id !== "ketu" && (
                          <Term k="retrogradacja" plain><span className="badge">retro</span></Term>
                        )}
                        {p.combust && (
                          <Term k="spalenie" plain><span className="badge badge-warn">spalona</span></Term>
                        )}
                        {p.dignity === "egzaltacja" && (
                          <Term k="egzaltacja" plain><span className="badge badge-good">egzaltacja</span></Term>
                        )}
                        {p.dignity === "mulatrikona" && (
                          <Term k="mulatrikona" plain><span className="badge badge-good">mulatrikona</span></Term>
                        )}
                        {p.dignity === "upadek" && (
                          <Term k="upadek" plain><span className="badge badge-warn">upadek</span></Term>
                        )}
                        {/* relacja z władcą znaku — pokazywana zawsze, nawet gdy planeta
                            jest jednocześnie w egzaltacji/upadku/mulatrikonie */}
                        <Term k={p.signRelacja === "władanie" ? "wladanie" : `znak_${p.signRelacja}`} plain>
                          <span className="badge" style={{
                            color: p.signRelacja === "władanie" || p.signRelacja === "przyjazny" ? "var(--success)"
                              : p.signRelacja === "wrogi" ? "var(--warn)" : "var(--muted)",
                            opacity: p.signRelacja === "neutralny" ? 0.75 : 1,
                          }}>
                            {p.signRelacja === "władanie" ? "u siebie"
                              : p.signRelacja === "przyjazny" ? "znak przyjaciela"
                              : p.signRelacja === "wrogi" ? "znak wroga" : "znak neutralny"}
                          </span>
                        </Term>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </details>

          {d9 && d9.angles && (
            <details className="card" style={{ overflowX: "auto", marginBottom: 24 }} open>
              <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)", marginBottom: 6 }}>
                Pozycje planet — <Term k="nawamsza">D9 · Nawamsza</Term>
              </summary>
              <p className="muted" style={{ fontSize: "0.82rem", marginBottom: 14 }}>
                Stopień liczony wewnątrz nawamszy (0–30°) — to nie ta sama skala co w D1.
                Dom liczony od lagny D9, nakszatra zostaje z rzeczywistej długości ekliptycznej.
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Graha</th><th>Znak</th><th>Stopień</th><th>Dom</th>
                    <th><Term k="nakszatra">Nakszatra</Term></th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {PLANET_ORDER.map((id) => {
                    const p = d9.planets[id];
                    const g = GRAHAS[id];
                    return (
                      <tr key={id}>
                        <td><span style={{ color: g.color }}>{g.symbol}</span> {g.pl}</td>
                        <td>{p.signPl}</td>
                        <td>{p.degreeFormatted}</td>
                        <td>{p.house}</td>
                        <td>
                          <Term term={nakshatraTerm(p.nakshatra)} plain>{p.nakshatra.nakshatra.pl}</Term>{" "}
                          <span className="muted">p.{p.nakshatra.pada}</span>
                        </td>
                        <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {isVargottama(p.longitude) && (() => {
                            const b = wzmocnienieBadge(p.dignity);
                            return (
                              <Term k="vargottama" plain>
                                <span className={b.className} style={b.style}>vargottama</span>
                              </Term>
                            );
                          })()}
                          {p.retrograde && id !== "rahu" && id !== "ketu" && (
                            <Term k="retrogradacja" plain><span className="badge">retro</span></Term>
                          )}
                          {p.combust && (
                            <Term k="spalenie" plain><span className="badge badge-warn">spalona</span></Term>
                          )}
                          {p.dignity === "egzaltacja" && (
                            <Term k="egzaltacja" plain><span className="badge badge-good">egzaltacja</span></Term>
                          )}
                          {p.dignity === "mulatrikona" && (
                            <Term k="mulatrikona" plain><span className="badge badge-good">mulatrikona</span></Term>
                          )}
                          {p.dignity === "upadek" && (
                            <Term k="upadek" plain><span className="badge badge-warn">upadek</span></Term>
                          )}
                          <Term k={p.signRelacja === "władanie" ? "wladanie" : `znak_${p.signRelacja}`} plain>
                            <span className="badge" style={{
                              color: p.signRelacja === "władanie" || p.signRelacja === "przyjazny" ? "var(--success)"
                                : p.signRelacja === "wrogi" ? "var(--warn)" : "var(--muted)",
                              opacity: p.signRelacja === "neutralny" ? 0.75 : 1,
                            }}>
                              {p.signRelacja === "władanie" ? "u siebie"
                                : p.signRelacja === "przyjazny" ? "znak przyjaciela"
                                : p.signRelacja === "wrogi" ? "znak wroga" : "znak neutralny"}
                            </span>
                          </Term>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </details>
          )}

          <WargiDodatkowe chart={chart} styl={styl} d10={d10} />

          {/* karaki czarowe (Dzajmini) — osiem rol wg stopnia w znaku, z rozwijanymi opisami planeta×rola */}
          <KarakiCzarowe chart={chart} />

          <AsztakawargaSekcja chart={chart} />

          <SzadbalaSekcja chart={chart} />
          </>}

          {/* predyspozycje + na co uwazac — jedna wspolna rozwijana karta, widoczna w trybie
              poczatkujacym (maPelneDane jest zawsze true, wiec warunek sprowadza sie do trybu). */}
          {(tryb === "poczatkujacy" || !maPelneDane) && <>
          <PlanetyWSkrocie chart={chart} />

          {w.predyspozycje && <>
          <details className="card" style={{ marginBottom: 24 }} open>
            <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)" }}>
              Predyspozycje i na co uważać
            </summary>
            <RankingGrah chart={chart} />
            <NaCoUwazac chart={chart} />
          </details>

          <Talenty chart={chart} />

          <WrazliwoscDuchowa chart={chart} />
          </>}

          {/* finanse — dedykowany silnik (finanseWedyjskie.ts): wladcy 2./5./9./11. domu, czterej
              karakowie, Dhana jogi, potwierdzenie w D9/D10, Indu Lagna, Hora, biezaca dasza.
              NIE recykling ocenaWladcy jak reszta domen — patrz naglowek finanseWedyjskie.ts. */}
          {w.finanse && finansowe && (
          <details className="card" style={{ marginBottom: 24 }} open>
            <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)" }}>
              Finanse
            </summary>
            <RankingDomeny
              eyebrow="Finanse"
              wstep={<>
                Dedykowane wyliczenia finansowe wg klasycznej astrologii wedyjskiej: władcy czterech domów
                majątkowych (2. — zgromadzony majątek, 5. — spekulacja i inwestycje, 9. — fortuna i dziedzictwo,
                11. — dochody i zyski) oraz czterej naturalni karakowie (Jowisz, Wenus, Saturn, Merkury).
                Każda ocena uwzględnia dodatkowo: potwierdzenie w nawamszy (D9) i daśamszy (D10), udział
                w Dhana jogach i wpływ na Indu Lagnę — to nie ten sam wynik co w Predyspozycjach.{" "}
                <strong>Długość</strong> paska to siła czynnika — <strong>kolor</strong> to jak łatwo się wyraża.
              </>}
              dane={finanse}
              opisy={FINANSE_OPIS}
              tabelaPercentyli={TABELA_FINANSE}
            />
            <NaCoUwazacDomeny dane={finanse} uwaga={FINANSE_UWAGA} uwagaOpis={FINANSE_UWAGA_OPIS} />

            {/* Dhana jogi — surowane tu wprost, nie tylko w osobnej sekcji Talenty/Jogi */}
            {finansowe.dhanaJogi.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <p className="eyebrow" style={{ marginBottom: 8 }}>Dhana jogi w Twojej mapie</p>
                <div style={{ display: "grid", gap: 8 }}>
                  {finansowe.dhanaJogi.map((j) => (
                    <div key={j.id} style={{
                      padding: "10px 14px", borderRadius: 8,
                      border: "1px solid rgba(111,191,159,0.4)", background: "rgba(255,255,255,0.02)",
                    }}>
                      <p style={{ fontSize: "0.88rem" }}>
                        {j.planety.map((id) => (
                          <span key={id} style={{ color: GRAHAS[id].color, marginRight: 4 }}>{GRAHAS[id].symbol}</span>
                        ))}
                        <strong>{j.nazwa}</strong> — {j.znaczenie}
                      </p>
                      <p className="muted" style={{ fontSize: "0.78rem", marginTop: 4 }}>{j.uzasadnienie}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Indu Lagna — klasyczny "ascendent bogactwa" */}
            {finansowe.indu && (
              <div style={{ marginTop: 18, padding: "12px 16px", borderRadius: 8, border: "1px solid var(--line-gold)" }}>
                <p className="eyebrow" style={{ marginBottom: 6 }}>
                  <Term k="indulagna" plain>Indu Lagna</Term> — ascendent bogactwa
                </p>
                <p style={{ fontSize: "0.88rem", lineHeight: 1.55 }}>
                  Wypada w znaku <strong>{RASIS[finansowe.indu.znak].symbol} {RASIS[finansowe.indu.znak].pl}</strong>.{" "}
                  {finansowe.indu.wZnaku.length > 0 && (
                    <>Zasiadają tam: {finansowe.indu.wZnaku.map((id) => GRAHAS[id].pl).join(", ")}. </>
                  )}
                  {finansowe.indu.aspektujace.length > 0 && (
                    <>Aspektują ją: {finansowe.indu.aspektujace.map((id) => GRAHAS[id].pl).join(", ")}. </>
                  )}
                  {finansowe.indu.wZnaku.length === 0 && finansowe.indu.aspektujace.length === 0 && (
                    <>Żadna planeta jej nie obsadza ani nie aspektuje — sam znak i jego władca dają obraz bez dodatkowych wzmocnień/obciążeń.</>
                  )}
                </p>
              </div>
            )}

            {/* Hora (D2) - charakter zarabiania, opisowo nie punktowo */}
            {finansowe.hora.length > 0 && (
              <p className="muted" style={{ fontSize: "0.82rem", marginTop: 14, lineHeight: 1.6 }}>
                <Term k="hora" plain><strong>Hora (D2) — charakter zarabiania:</strong></Term>{" "}
                {finansowe.hora.map((h, i) => (
                  <span key={h.dom}>
                    {i > 0 && " "}Władca {h.dom}. domu ({GRAHAS[h.wladca].pl}) stoi w horze {HORA_OPIS[h.typ]}.
                  </span>
                ))}
              </p>
            )}

            {/* biezaca dasza a finanse */}
            {finansowe.obecnyOkres && (
              <p className="muted" style={{ fontSize: "0.82rem", marginTop: 8, lineHeight: 1.6 }}>
                <strong>Obecny okres a pieniądze:</strong>{" "}
                {finansowe.obecnyOkres.istotny
                  ? <>władca Twojej bieżącej mahadashy ({GRAHAS[finansowe.obecnyOkres.lord].pl}) jest jednym z powyższych wskaźników finansowych —
                      okres wypada {finansowe.obecnyOkres.ton === "wspierający" ? "wspierająco" : finansowe.obecnyOkres.ton === "wymagający" ? "wymagająco" : "mieszanie"} dla tematu pieniędzy.</>
                  : <>władca Twojej bieżącej mahadashy ({GRAHAS[finansowe.obecnyOkres.lord].pl}) nie jest jednym z powyższych wskaźników finansowych —
                      to nie jest okres szczególnie naznaczony tematem pieniędzy, ani w jedną, ani w drugą stronę.</>}
              </p>
            )}
          </details>
          )}

          {/* zdrowie — dedykowany silnik (zdrowieWedyjski.ts): wladca lagny/6./8. domu, Slonce/
              Ksiezyc jako karakowie, potwierdzenie w D9, aspekty malefikow/Jowisza. Nowa karta
              (nie zamiana), bo zdrowie to jeden z trzech najczesciej szukanych tematow u
              astrologow. UWAGA: swiadomie NIE diagnoza medyczna, patrz zastrzezenie w tekscie. */}
          {w.zdrowie && zdrowotne && (
          <details className="card" style={{ marginBottom: 24 }} open>
            <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)" }}>
              Zdrowie
            </summary>
            <p style={{
              fontSize: "0.8rem", lineHeight: 1.55, marginBottom: 14, padding: "10px 14px",
              borderRadius: 8, border: "1px solid var(--line-gold)", background: "rgba(230,196,138,0.06)",
            }}>
              <strong>Zastrzeżenie:</strong> to NIE jest diagnoza medyczna. Astrologia wedyjska pokazuje klasyczne
              skłonności i tematy wymagające uważności — nie konkretne choroby, nie zastępuje lekarza. Przy
              jakichkolwiek realnych dolegliwościach zawsze skonsultuj się z lekarzem.
            </p>
            <RankingDomeny
              eyebrow="Zdrowie"
              wstep={<>
                Dedykowane wyliczenia zdrowotne wg klasycznej astrologii wedyjskiej: władca lagny
                (Tanu bhava — samo ciało) oraz władcy domów zdrowia (6. — codzienne dolegliwości
                i odporność, 8. — tematy przewlekłe/ukryte), a także naturalni karakowie (Słońce —
                witalność, Księżyc — stabilność umysłu). Każda ocena uwzględnia dodatkowo
                potwierdzenie w nawamszy (D9) i aspekty Marsa/Saturna/Jowisza.{" "}
                <strong>Długość</strong> paska to siła czynnika — <strong>kolor</strong> to jak łatwo się wyraża.
              </>}
              dane={zdrowie}
              opisy={ZDROWIE_OPIS}
              tabelaPercentyli={TABELA_ZDROWIE}
            />
            <NaCoUwazacDomeny dane={zdrowie} uwaga={ZDROWIE_UWAGA} uwagaOpis={ZDROWIE_UWAGA_OPIS} />
          </details>
          )}

          {/* dasza — dziala tez bez znanej godziny urodzenia (Ksiezyc jest liczony zawsze); przeniesiona
              tu z trybu "Pełne dane" na prosbe uzytkownika */}
          <DaszaSekcja chart={chart} />

          {/* pas dziewieciu godel — jezyk symboli z brandbooka, przeniesiony tu z zaawansowanego na prosbe uzytkownika */}
          <details className="card" style={{ marginBottom: 24 }}>
            <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)", marginBottom: 14 }}>
              Dziewięć grah — język symboli
            </summary>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(84px, 100%), 1fr))", gap: 14, justifyItems: "center" }}>
              {PLANET_ORDER.map((id) => <GodloPlanety key={id} id={id} size={70} podpis />)}
            </div>
          </details>
          </>}

          {/* jogi klasyczne — szczęście, tuż pod predyspozycjami */}
          {tryb === "zaawansowany" && w.czasGleboko && <>

          {/* os zycia — glowny diagram mapy zycia (przeszlosc/teraz/przyszlosc dasz z
              rozwijanymi podokresami), przeniesiony z /mapa-zycia na prosbe uzytkownika;
              umieszczony PRZED joga/dosza, bo to fundament ("kiedy"), na ktorym te dwie
              mapy czasu dopiero nadbudowuja "co dokladnie sie wtedy odpala" */}
          <div className="panel-navy" style={{ padding: "30px 22px 20px", marginBottom: 24 }}>
            <p className="eyebrow" style={{ marginBottom: 6 }}>Twoja mapa linii czasu — kiedy · najbliższe okresy</p>
            <p className="muted" style={{ fontSize: "0.9rem", marginBottom: 14 }}>
              Twój czas ma dwa poziomy: wieloletni <Term k="mahadasza">wielki okres</Term>{" "}
              i krótsze <Term k="antardasza">podokresy</Term> wewnątrz niego.
              Najedź na podokres, aby poznać jego charakter.
            </p>
            <OsZycia dashas={chart.dashas} birth={chart.birth.date} chart={chart} />
          </div>

          <JogiISzczescie chart={chart} />

          {/* mapa czasu jog — KIEDY dokladnie te same jogi "odpalaja sie" na osi zycia;
              przeniesione z /mapa-zycia, umieszczone tuz pod statyczna lista jog (ten sam
              temat, tylko w czasie zamiast punktowo) zamiast na koncu strony bez kontekstu */}
          {lifePhases.length > 0 && <MapaCzasuJog chart={chart} lifePhases={lifePhases} />}

          {/* mapa czasu dosz — jw., ale dla dosz; przeniesione z /mapa-zycia. Zastepuje usuniety
              DoszeKlasyczne.tsx (byla to zdublowana, zawsze widoczna lista - dokladnie te same
              karty co ponizej, bez zadnego unikalnego diagramu jak przy Jogach), na wyrazna
              prosbe uzytkownika po analizie tego samego problemu co przy Jogi i szczescie. */}
          {lifePhases.length > 0 && <MapaCzasuDosz chart={chart} lifePhases={lifePhases} />}

          {/* 12 domow — obszary zycia (plansza DOMY) */}
          <details className="card" style={{ marginBottom: 24 }}>
            <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)" }}>
              12 domów — obszary życia
            </summary>
            <p className="muted" style={{ fontSize: "0.85rem", margin: "12px 0 16px", lineHeight: 1.6 }}>
              Złota obwódka — kendry i trikony, filary mapy. Dom podświetlony,
              gdy stoi w nim któraś z Twoich planet.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(112px, 100%), 1fr))", gap: 10, justifyItems: "center" }}>
              {BHAVAS.map((b, i) => (
                <HeksDomu key={i} dom={i + 1} size={106}
                  aktywny={!!chart.angles && PLANET_ORDER.some((id) => chart.planets[id].house === i + 1)} />
              ))}
            </div>
          </details>
          </>}

          <Interpretation
            kind="kosmogram"
            data={aiData}
            label={`Kosmogram${birthInput?.name ? ` — ${birthInput.name}` : ""}`}
          />
          <Rozmowa mapa={aiData} tytul="Zapytaj o swój kosmogram" />
        </div>
      )}
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <Konwencje />
      </div>
    </div>
  );
}
