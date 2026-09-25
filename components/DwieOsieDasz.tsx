"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { GRAHAS, RASIS, BHAVAS, type PlanetId } from "@/lib/astro/constants";
import type { VedicChart } from "@/lib/astro/chart";
import { charaDasza, wladcaDlaCharaDaszy, okupanciZnaku, rashiDrishti } from "@/lib/astro/charaDasza";
import { ocenaWladcy } from "@/lib/astro/sila";
import { wykryteJogi, type Yoga } from "@/lib/astro/yogas";
import { wykryteDosze, type Dosza } from "@/lib/astro/doshas";
import { TEMAT_PLANETY } from "@/lib/astro/domInterpretacja";
import { nazwaZPara, opisMocy } from "@/lib/astro/mapaCzasuJogUtils";
import { KATEGORIA_KOLOR } from "@/components/KoloJog";
import { KATEGORIA_KOLOR_DOSZY } from "@/components/KoloDosz";
import { TON_KOLOR } from "@/components/OsZycia";
import Interpretation from "@/components/Interpretation";
import type { Plec } from "@/components/BirthForm";

/**
 * DWIE OSIE DASZ — synteza dwóch systemów Jyotisz na jednej osi czasu, punkt
 * wyjścia do płatnej interpretacji AI (kind="rozdzial-dasz"). Samodzielna
 * sekcja, świadomie NIE wpięta w Chara Dasza ani Oś życia — czyta się ją
 * osobno, z własnym wstępem.
 *
 * Pomysł: profesjonalni astrolodzy dżajminowscy nakładają Wimszottari
 * (planety, stałe długości, suma 120 lat) i Chara Daszę (znaki, zmienne
 * długości 1-12 lat) na wspólną oś czasu — gdy oba systemy w tym samym
 * momencie wskazują na podobny temat, to "potwierdzenie" i wydarzenie
 * uchodzi za silniejsze. Lewa strona = Chara Dasza, prawa = Wimszottari,
 * obie skalowane do tych samych lat od urodzenia.
 *
 * Wzbogacone o (ta sama metodologia co "Mapa czasu jog/dosz" i Oś życia,
 * żeby liczby się nie rozjeżdżały między widokami):
 * - ocenaWladcy(chart, wladca, jogi) → ton (wspierający/wymagający/mieszany)
 *   i siła (opisMocy) władcy KAŻDEGO okresu, po obu stronach.
 * - Do czego: TEMAT_PLANETY dla Wimszottari (co reprezentuje planeta),
 *   BHAVAS[dom].obszar dla Chara Daszy (dom liczony od Lagny — ten sam
 *   sposób co w Profilu Atmakaraki i sekcji Chara Dasza).
 * - Kropki jog/dosz aktywnych w danym okresie (ta sama zasada co Mapa czasu
 *   jog: joga/dosza najsilniej odczuwalna w mahadaszy planety, która ją tworzy).
 */

const PX_NA_ROK = 11;
const MAX_LAT = 100;

/** Kolory kolejnych rozdziałów, NIEZALEŻNE od kolorów tonu (zielony/pomarańcz/szary
 *  wewnątrz rozdziału i tak już zajęte) — rozdział to grupa okresów w czasie,
 *  nie ocena, więc dostaje własną, rotującą paletę do oznaczenia ramki wokół siebie. */
const PALETA_ROZDZIALOW = ["#e6c48a", "#7dd3c0", "#c792ea", "#f2a65a", "#6fa8dc", "#e0839b"];
const ROK_MS = 365.25 * 86400000;

const fmt = (d: Date) => d.toLocaleDateString("pl-PL", { year: "numeric", month: "2-digit", day: "2-digit" });

/** "#rrggbb" → "rgba(r,g,b,a)" — do gradientów/poświaty skalowanych siłą władcy,
 *  bez trzymania osobnej palety rgba obok każdego koloru w TON_KOLOR/GRAHAS. */
function hexA(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function domOdLagny(sign: number, lagnaSign: number): number {
  return ((sign - lagnaSign + 12) % 12) + 1;
}

/** Tytuł rozdziału z surowego tekstu interpretacji (pierwsza linia, pogrubiona
 *  wg promptu w KIND_PROMPTS["rozdzial-dasz"]) — bez gwiazdek markdown. */
function wyciagnijTytul(text: string): string {
  const pierwszy = text.split(/\n{2,}/)[0]?.trim() ?? "";
  return pierwszy.replace(/^\*\*(.+?)\*\*$/, "$1").replace(/\*\*/g, "").trim();
}

/** Dwa udokumentowane czynniki oceny znaku Chara Daszy OBOK siły władcy —
 *  okupanci (planety fizycznie stojące w znaku) i Rashi Drishti (aspekt
 *  znakowy Dżajminiego) — dotąd tylko pokazywane w dymku, teraz realnie
 *  przesuwają ton okresu, nie tylko go opisują. Dobroczynna planeta w znaku
 *  wspiera, złoczynna obciąża; aspekt z zajętego znaku liczy się słabiej niż
 *  bezpośrednie zajęcie znaku (GRAHAS[id].nature: 1 dobroczynna, -1 złoczynna).*/
function bonusOkupanciIAspekty(chart: VedicChart, sign: number): number {
  let bonus = 0;
  for (const id of okupanciZnaku(chart, sign)) bonus += GRAHAS[id].nature * 0.3;
  for (const s of rashiDrishti(sign)) {
    for (const id of okupanciZnaku(chart, s)) bonus += GRAHAS[id].nature * 0.15;
  }
  return bonus;
}

interface Pasek {
  etykieta: string; symbol: string; kolor: string;
  wiekOd: number; wiekDo: number;
  dataOd: string; dataDo: string;
  ton: "wspierający" | "wymagający" | "mieszany"; sila: string; punkty: number; temat: string;
  jogiOkresu: Yoga[]; doszeOkresu: Dosza[];
  okupanci?: PlanetId[];
  wladca?: PlanetId;
  aspektujaceZnaki?: { sign: number; planety: PlanetId[] }[];
  dom?: number;
  /** Znak D1, w ktorym planeta stoi w mapie urodzeniowej — TYLKO dla Wimszottari
   *  (Chara Dasza JEST znakiem, wiec pole nie ma tu sensu). Stale przez cale zycie. */
  znakPlanety?: number;
}

interface Aktywne { nazwa: string; opis: string; kolor: string; kategoria: string; typ: "joga" | "dosza" }

const TIP_W = 250;
const TIP_MARGIN = 12;

/** Wyzwalacz + dymek — identyczny wzorzec co przy diagramie D1/D9 (NorthChart/
 *  SouthChart): portal do <body>, position:fixed liczony z getBoundingClientRect(),
 *  więc dymek nigdy nie jest przycięty przez overflow:hidden ramki okresu
 *  i zawsze jest nad resztą strony. Współdzielony przez kropki jog/dosz,
 *  symbole planet-okupantów i cały okres — różni je tylko wyzwalacz i treść. */
function ZDymkiem({ trigger, content, pelnyRozmiar, onKlik }: { trigger: React.ReactNode; content: React.ReactNode; pelnyRozmiar?: boolean; onKlik?: () => void }) {
  const [tip, setTip] = useState<{ left: number; top: number; below: boolean } | null>(null);

  function pokaz(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    let left = rect.left + rect.width / 2;
    left = Math.max(TIP_MARGIN + TIP_W / 2, Math.min(left, window.innerWidth - TIP_MARGIN - TIP_W / 2));
    // Wyzwalacz pelnorozmiarowy (np. cala kolorowa strefa rozdzialu) bywa
    // dużo wyzszy niz ekran — dymek idzie za kursorem (e.clientY), nie za
    // gornym rogiem calego obszaru, bo inaczej wyskakiwalby daleko nad tym,
    // co user realnie najechal.
    const top = pelnyRozmiar ? e.clientY : rect.top;
    setTip({ left, top, below: top < window.innerHeight * 0.35 });
  }

  return (
    <>
      <span
        onMouseEnter={pokaz} onMouseMove={pelnyRozmiar ? pokaz : undefined} onMouseLeave={() => setTip(null)}
        onClick={(e) => { e.stopPropagation(); onKlik?.(); if (tip) setTip(null); else pokaz(e); }}
        style={pelnyRozmiar
          ? { position: "absolute", inset: 0, cursor: "help", display: "block" }
          : { padding: 5, margin: -5, cursor: "help", display: "inline-flex" }}>
        {trigger}
      </span>
      {tip && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed", left: tip.left, top: tip.top,
          transform: `translate(-50%, ${tip.below ? "14px" : "calc(-100% - 14px)"})`,
          zIndex: 9999, width: TIP_W, pointerEvents: "none",
        }}>
          <div style={{
            background: "rgba(16, 34, 49, 0.98)", border: "1px solid var(--line)", borderRadius: 12,
            padding: "14px 16px", boxShadow: "0 16px 40px rgba(0,0,0,0.55), 0 0 22px -10px rgba(230,196,138,0.35)",
            animation: "fadeUp 0.2s var(--ease-out) both", color: "#e8eef2",
          }}>
            {content}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function DymekTytul({ dzieci }: { dzieci: React.ReactNode }) {
  return <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", color: "var(--sand)", marginBottom: 3 }}>{dzieci}</p>;
}
function DymekPodtytul({ dzieci }: { dzieci: React.ReactNode }) {
  return <p style={{ fontSize: "0.78rem", color: "#8ba0b0", marginBottom: 8 }}>{dzieci}</p>;
}
function DymekOpis({ dzieci }: { dzieci: React.ReactNode }) {
  return <p style={{ fontSize: "0.84rem", lineHeight: 1.55, color: "#b9c7d1", margin: "0 0 6px" }}>{dzieci}</p>;
}

function KropkaZDymkiem({ info, wypelniona }: { info: Aktywne; wypelniona: boolean }) {
  return (
    <ZDymkiem
      content={<>
        <DymekTytul dzieci={info.nazwa} />
        <DymekPodtytul dzieci={info.typ === "joga" ? "joga — sprzyjający układ" : "dosza — na co uważać"} />
        <DymekOpis dzieci={info.opis} />
      </>}
      trigger={
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: wypelniona ? info.kolor : "transparent",
          border: wypelniona ? "none" : `1px solid ${info.kolor}`,
        }} />
      }
    />
  );
}

/** Symbol planety-okupanta ze znakiem, z dymkiem tłumaczącym co ona tu znaczy —
 *  to samo pytanie co przy władcy znaku, ale dla planety, która akurat w tym
 *  znaku fizycznie stoi (jeden z trzech udokumentowanych czynników oceny
 *  okresu Chara Daszy, obok siły władcy i Rashi Drishti). */
function PlanetaZDymkiem({ id }: { id: PlanetId }) {
  const g = GRAHAS[id];
  return (
    <ZDymkiem
      content={<>
        <DymekTytul dzieci={g.pl} />
        <DymekPodtytul dzieci="planeta fizycznie stojąca w tym znaku" />
        <DymekOpis dzieci={`${TEMAT_PLANETY[id]}. Stoi w tym znaku, więc jej temat miesza się z tematem tego okresu — nie tylko sam władca znaku ma tu głos.`} />
      </>}
      trigger={<span style={{ color: g.color, fontSize: "0.82rem" }}>{g.symbol}</span>}
    />
  );
}

/** Dymek całego okresu (znak lub planeta) — wyzwalany z grupy symbol+nazwa,
 *  NIE z całej ramki, żeby nie kolidować z osobnymi dymkami jog/dosz/planet
 *  w środku (te maja wlasny hover, nachodzenie by je przykrywalo). Pokazuje
 *  daty, temat, wladce znaku (dla Chara Daszy) z jego wlasnym tonem/sila. */
function OkresZDymkiem({ p, trigger }: { p: Pasek; trigger: React.ReactNode }) {
  return (
    <ZDymkiem
      trigger={trigger}
      content={<>
        <DymekTytul dzieci={`${p.etykieta} (${p.dataOd} — ${p.dataDo})`} />
        {p.dom !== undefined
          ? <DymekPodtytul dzieci={`Twój ${p.dom}. dom`} />
          : <DymekPodtytul dzieci={`Mahadasza ${p.etykieta}${p.znakPlanety !== undefined ? ` w znaku ${RASIS[p.znakPlanety].pl}` : ""}`} />}
        <DymekOpis dzieci={p.temat} />
        {p.wladca !== undefined && (
          <DymekOpis dzieci={<>
            Władca znaku: <span style={{ color: GRAHAS[p.wladca].color }}>{GRAHAS[p.wladca].symbol}</span>{" "}
            <strong style={{ color: "var(--sand)" }}>{GRAHAS[p.wladca].pl}</strong> —{" "}
            <strong style={{ color: TON_KOLOR[p.ton] }}>{p.ton}</strong>, {p.sila}.
          </>} />
        )}
        {p.wladca === undefined && (
          <DymekOpis dzieci={<><strong style={{ color: TON_KOLOR[p.ton] }}>{p.ton}</strong>, {p.sila}.</>} />
        )}
        {p.okupanci !== undefined && (
          <DymekOpis dzieci={
            p.okupanci.length
              ? `W tym znaku stoi: ${p.okupanci.map((id) => GRAHAS[id].pl).join(", ")}.`
              : "W tym znaku nie stoi żadna planeta."
          } />
        )}
        {p.aspektujaceZnaki !== undefined && p.aspektujaceZnaki.length > 0 && (
          <DymekOpis dzieci={`Rashi Drishti (aspekt znakowy) z: ${p.aspektujaceZnaki.map((a) => `${RASIS[a.sign].pl} (${a.planety.map((id) => GRAHAS[id].pl).join("/")})`).join(", ")}.`} />
        )}
      </>}
    />
  );
}

const MIN_WYSOKOSC = 22;

function Segment({ p, strona }: { p: Pasek; strona: "lewa" | "prawa" }) {
  // Okres MOZE realnie konczyc sie daleko poza MAX_LAT (mahadasza do 12 lat,
  // Wimszottari tez), ale kontener jest wysoki tylko do MAX_LAT — bez tego
  // przyciecia taki okres rozciagalby sie poza wykres, nachodzac na tresc pod
  // nim. Wizualnie ucinamy go na granicy, data w dymku i tak pokazuje realny koniec.
  const wiekDoPrzyciete = Math.min(p.wiekDo, MAX_LAT);
  const h = Math.max(1, (wiekDoPrzyciete - p.wiekOd) * PX_NA_ROK) - 2;
  const lewa = strona === "lewa";
  // Krotki okres rozciagniety do MIN_WYSOKOSC siega ponizej swojego realnego
  // konca, na teren NASTEPNEGO okresu — bez podniesienia go nad sasiada
  // (ktory w DOM idzie po nim) jego etykieta chowalaby sie pod cudzym,
  // teraz nieprzezroczystym, kolorowym tlem.
  const rozciagniety = h < MIN_WYSOKOSC;

  // Wypelnienie swieci od strony osi na zewnatrz, a jego intensywnosc rosnie
  // z sila wladcy okresu (punkty z ocenaWladcy, ten sam wynik co pokazuje
  // dymek) — mocny wladca daje wyrazniejsza poswiate, slaby cichsze tlo.
  // Obwodka jest teraz JEDNAKOWO mocna po OBU stronach osi (wczesniej prawa
  // kolumna, z rzadszymi ale dluzszymi okresami Wimszottari, wygladala plasko
  // przy gestszej lewej) — kolor zawsze wg tonu, nie planety, zeby dwie osie
  // czytalo sie jako jeden spojny jezyk kolorow.
  const intensywnosc = Math.max(0, Math.min(1, (p.punkty + 1.5) / 4.5));
  const slabo = hexA(TON_KOLOR[p.ton], 0.1);
  const mocno = hexA(TON_KOLOR[p.ton], 0.2 + intensywnosc * 0.34);
  const background = `linear-gradient(to ${lewa ? "right" : "left"}, ${slabo}, ${mocno})`;
  // Wspierajace okresy dostaja dodatkowo delikatny blask na zewnatrz — to one
  // maja "przyciagac oko" na pierwszy rzut oka, obwodka jest mocna wszedzie.
  const wspierajacy = p.ton === "wspierający";

  return (
    <div style={{
      position: "absolute", [lewa ? "right" : "left"]: 4, top: p.wiekOd * PX_NA_ROK, height: Math.max(MIN_WYSOKOSC, h),
      width: "calc(100% - 8px)", borderRadius: 8, zIndex: rozciagniety ? 2 : 1,
      background,
      borderStyle: "solid", borderColor: hexA(TON_KOLOR[p.ton], 0.85),
      borderTopWidth: 1.5, borderBottomWidth: 1.5,
      borderLeftWidth: lewa ? 1.5 : 3, borderRightWidth: lewa ? 3 : 1.5,
      boxShadow: wspierajacy ? `0 0 ${6 + intensywnosc * 10}px -2px ${hexA(TON_KOLOR[p.ton], 0.3 + intensywnosc * 0.3)}` : "none",
      display: "flex", alignItems: "center",
      padding: "1px 8px", boxSizing: "border-box", overflow: "visible",
    }}>
      {/* jedna linia, ale w kolejnosci grup ODWROTNEJ dla lewej kolumny — symbol
          i nazwa znaku/planety maja DOTYKAC osi (prawa krawedz po lewej stronie,
          lewa krawedz po prawej), reszta info rozciaga sie od nich na zewnatrz. */}
      <div style={{
        display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", width: "100%",
        justifyContent: lewa ? "flex-end" : "flex-start",
      }}>
        {(() => {
          const grupaZnak = (
            <OkresZDymkiem key="znak" p={p} trigger={
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ color: p.kolor, fontSize: "0.9rem" }}>{p.symbol}</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, whiteSpace: "nowrap" }}>{p.etykieta}</span>
                {p.znakPlanety !== undefined && (
                  <span className="muted" style={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                    {RASIS[p.znakPlanety].symbol} {RASIS[p.znakPlanety].pl}
                  </span>
                )}
              </span>
            } />
          );
          // Wladca znaku jako WLASNY, widoczny chip (nie tylko tekst w dymku) —
          // TYLKO Chara Dasza ma "znak, ktorego dotyczy" osobno od wladajacej nim
          // planety; Wimszottari to juz sama planeta, wiec ten chip nie ma tam sensu.
          const chipWladca = p.wladca !== undefined ? (
            <OkresZDymkiem key="wladca" p={p} trigger={
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: GRAHAS[p.wladca].color, fontSize: "0.82rem" }}>{GRAHAS[p.wladca].symbol}</span>
                <span className="muted" style={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}>{GRAHAS[p.wladca].pl}</span>
              </span>
            } />
          ) : null;
          const tonISila = (
            <span key="ton-sila" style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.66rem", fontWeight: 600, color: TON_KOLOR[p.ton], whiteSpace: "nowrap" }}>{p.ton}</span>
              {/* Pasek sily — dlugosc/jasnosc wypelnienia rosnie z punktami wladcy
                  (ten sam wynik co poswiata tla i opis w dymku), zeby sile bylo
                  widac na pierwszy rzut oka, bez najezdzania na okres. */}
              <span title={`Siła: ${p.sila}`} style={{
                display: "inline-block", width: 44, height: 7, borderRadius: 3.5,
                background: "rgba(255,255,255,0.16)", overflow: "hidden", flexShrink: 0,
              }}>
                <span style={{ display: "block", height: "100%", width: `${Math.round(intensywnosc * 100)}%`, background: TON_KOLOR[p.ton] }} />
              </span>
            </span>
          );
          const kropki = (
            <span key="kropki" style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              {p.okupanci && p.okupanci.length > 0 && (
                <>
                  <span className="muted" style={{ fontSize: "0.62rem", whiteSpace: "nowrap" }}>w znaku:</span>
                  {p.okupanci.map((id) => <PlanetaZDymkiem key={id} id={id} />)}
                </>
              )}
              {p.jogiOkresu.map((j) => (
                <KropkaZDymkiem key={j.id} wypelniona
                  info={{ nazwa: nazwaZPara(j), opis: `${j.znaczenie}.`, kolor: KATEGORIA_KOLOR[j.kategoria], kategoria: j.kategoria, typ: "joga" }} />
              ))}
              {p.doszeOkresu.map((d) => (
                <KropkaZDymkiem key={d.id} wypelniona={false}
                  info={{ nazwa: nazwaZPara(d), opis: `${d.ryzyko}.`, kolor: KATEGORIA_KOLOR_DOSZY[d.kategoria], kategoria: d.kategoria, typ: "dosza" }} />
              ))}
            </span>
          );
          // prawa: planeta (identyfikator) + jej znak PRZY OSI, dalej ton/sila,
          // najdalej od osi kropki jog/dosz.
          // lewa: TA SAMA kolejnosc pojec, lustrzana strona na strone — znak
          // Chara Daszy (identyfikator) + jego wladca PRZY OSI, dalej ton/sila,
          // najdalej od osi okupanci/kropki jog/dosz.
          return lewa
            ? <>{kropki}{tonISila}{chipWladca}{grupaZnak}</>
            : <>{grupaZnak}{tonISila}{kropki}</>;
        })()}
      </div>
    </div>
  );
}

export default function DwieOsieDasz({ chart, plec, imie }: { chart: VedicChart; plec?: Plec; imie?: string }) {
  // Tytul kazdego rozdzialu, wyciagniety z juz wygenerowanej (albo wczytanej
  // z cache) interpretacji AI ponizej — zeby dymek na osi mogl go pokazac
  // bez duplikowania wywolania /api/interpret. Pusty dopoki user nie kliknie
  // "Rozwin pelna analize" pod danym rozdzialem (albo od razu, jesli juz kiedys
  // wygenerowal i jest w localStorage/koncie).
  const [tytuly, setTytuly] = useState<Record<number, string>>({});

  // Klik na kolorowy pas rozdzialu na osi przewija do jego karty w "Rozdzialy
  // (AI)" ponizej i podswietla ja na chwile — bez tego trzeba bylo recznie
  // szukac wsrod kart, ktora odpowiada klikanemu fragmentowi osi.
  const [podswietlony, setPodswietlony] = useState<number | null>(null);
  useEffect(() => {
    if (podswietlony === null) return;
    const t = setTimeout(() => setPodswietlony(null), 2600);
    return () => clearTimeout(t);
  }, [podswietlony]);
  function podswietlRozdzial(i: number) {
    setPodswietlony(i);
    document.getElementById(`rozdzial-karta-${i}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const cd = charaDasza(chart);
  if (!cd || !chart.angles) return null;
  const lagnaSign = chart.angles.lagnaSign;

  const urodzenie = chart.birth.date.getTime();
  const teraz = Date.now();
  const wiekTeraz = (teraz - urodzenie) / ROK_MS;

  const jogi = wykryteJogi(chart);
  const dosze = wykryteDosze(chart).filter((d) => !d.zniesiona);

  // UWAGA: celowo BEZ trzeciego argumentu `jogi` — ocenaWladcy dodaje wtedy bonus
  // punktowy za udzial w kazdej wykrytej jodze, ale ten bonus jest (wg komentarza
  // w sila.ts) świadomie wlaczony TYLKO w Predyspozycjach/RankingGrah, a NIE w
  // "dasza" (Os zycia, DaszaSekcja) — zeby ten sam Saturn mial ten sam ton
  // wszedzie na osiach czasu. Wczesniej ta sekcja przekazywala `jogi`, co
  // dawalo INNY ton niz "Os zycia" dla tej samej planety — niespojnosc.
  // `znakDlaBonusu`: podane TYLKO dla okresow Chara Daszy (znak) — okupanci
  // i Rashi Drishti to czynniki znakowe, nie maja odpowiednika przy mahadaszy
  // Wimszottari (tam okres to sama planeta, bez "znaku, ktorego dotyczy").
  function ocenIOpisz(wladca: PlanetId, znakDlaBonusu?: number): Pick<Pasek, "ton" | "sila" | "punkty" | "jogiOkresu" | "doszeOkresu"> {
    const ocena = ocenaWladcy(chart, wladca);
    let punkty = ocena.punkty;
    let ton = ocena.ton;
    if (znakDlaBonusu !== undefined) {
      punkty = Math.round((punkty + bonusOkupanciIAspekty(chart, znakDlaBonusu)) * 100) / 100;
      // Ten sam prog co ocenaWladcy w sila.ts — po doliczeniu okupantow/Rashi
      // Drishti trzeba przeliczyc ton od nowa, bo mogl sie przesunac.
      ton = punkty >= 0.5 ? "wspierający" : punkty <= -0.75 ? "wymagający" : "mieszany";
    }
    return {
      ton,
      sila: opisMocy(punkty),
      punkty,
      jogiOkresu: jogi.filter((j) => j.planety.includes(wladca)),
      doszeOkresu: dosze.filter((d) => d.planety.includes(wladca)),
    };
  }

  // Chara Dasza z charaDasza() to JEDEN przebieg przez 12 znakow (koniec zalezy
  // od chartu — moze wypasc dlugo przed 100 lat). W realnym zyciu, jesli ktos
  // zyje dluzej niz trwa jeden pelny cykl, sekwencja PO PROSTU ZACZYNA SIE OD
  // NOWA od tego samego znaku startowego, z tymi samymi dlugosciami (D1 sie
  // nie zmienia) — wiec powtarzamy ja tyle razy, ile trzeba, zeby pokryc caly
  // widoczny zakres (tyle samo co Wimszottari, MAX_LAT lat).
  const cyklCharaDaszy: typeof cd.mahadaszy = [];
  {
    let kursor = cd.mahadaszy[0].start;
    while ((kursor.getTime() - urodzenie) / ROK_MS < MAX_LAT) {
      for (const m of cd.mahadaszy) {
        const start = kursor;
        const end = new Date(start.getTime() + m.lata * ROK_MS);
        cyklCharaDaszy.push({ sign: m.sign, start, end, lata: m.lata });
        kursor = end;
        if ((kursor.getTime() - urodzenie) / ROK_MS >= MAX_LAT) break;
      }
    }
  }

  const lewa: Pasek[] = cyklCharaDaszy
    .map((m): Pasek => {
      const wladca = wladcaDlaCharaDaszy(chart, m.sign);
      const dom = domOdLagny(m.sign, lagnaSign);
      const { ton, sila, punkty, jogiOkresu, doszeOkresu } = ocenIOpisz(wladca, m.sign);
      // Trzy udokumentowane czynniki oceny znaku Chara Daszy: sila wladcy (wyzej),
      // OKUPANCI (planety fizycznie stojace w tym znaku w D1) i RASHI DRISHTI
      // (aspekt znakowy Dzajminiego — inny system niz planetarne graha dristi).
      const okupanci = okupanciZnaku(chart, m.sign);
      const aspektujaceZnaki = rashiDrishti(m.sign)
        .map((s) => ({ sign: s, planety: okupanciZnaku(chart, s) }))
        .filter((a) => a.planety.length > 0);
      return {
        etykieta: RASIS[m.sign].pl, symbol: RASIS[m.sign].symbol, kolor: "#e6c48a",
        wiekOd: (m.start.getTime() - urodzenie) / ROK_MS, wiekDo: (m.end.getTime() - urodzenie) / ROK_MS,
        dataOd: fmt(m.start), dataDo: fmt(m.end),
        ton, sila, punkty, temat: BHAVAS[dom - 1].obszar,
        jogiOkresu, doszeOkresu, okupanci, wladca, aspektujaceZnaki, dom,
      };
    })
    .filter((r) => r.wiekOd < MAX_LAT);

  const prawa: Pasek[] = chart.dashas
    .filter((d) => d.end.getTime() > urodzenie)
    .map((d): Pasek => {
      const { ton, sila, punkty, jogiOkresu, doszeOkresu } = ocenIOpisz(d.lord);
      const g = GRAHAS[d.lord];
      const start = d.start.getTime() < urodzenie ? chart.birth.date : d.start;
      return {
        etykieta: g.pl, symbol: g.symbol, kolor: g.color,
        wiekOd: Math.max(0, (d.start.getTime() - urodzenie) / ROK_MS), wiekDo: (d.end.getTime() - urodzenie) / ROK_MS,
        dataOd: fmt(start), dataDo: fmt(d.end),
        ton, sila, punkty, temat: TEMAT_PLANETY[d.lord],
        jogiOkresu, doszeOkresu, znakPlanety: chart.planets[d.lord].sign,
      };
    })
    .filter((r) => r.wiekOd < MAX_LAT);

  const maxWiek = Math.min(MAX_LAT, Math.ceil(Math.max(
    lewa.length ? lewa[lewa.length - 1].wiekDo : 0,
    prawa.length ? prawa[prawa.length - 1].wiekDo : 0,
  )));
  // + MIN_WYSOKOSC: bufor na wypadek, gdyby ostatni (najkrotszy) okres byl
  // rozciagniety do minimalnej wysokosci i wystawal poza wyliczona wysokosc
  // kontenera, nachodzac na tresc PO wykresie (np. legende nizej).
  const wysokoscCalkowita = maxWiek * PX_NA_ROK + MIN_WYSOKOSC;

  // "Potwierdzenia" — granice mahadaszy z obu systemow, ktore wypadaja blisko
  // siebie w czasie (do PROG_LAT lat) — to wlasnie ten moment, w ktorym oba
  // systemy razem "przelaczaja temat", wiec klasycznie uchodzi za mocniejszy.
  const PROG_LAT = 1.5;
  const graniceLewe = lewa.slice(1).map((r) => r.wiekOd);
  const granicePrawe = prawa.slice(1).map((r) => r.wiekOd);
  const potwierdzenia: number[] = [];
  for (const gl of graniceLewe) {
    let najblizsza = Infinity;
    for (const gp of granicePrawe) if (Math.abs(gp - gl) < Math.abs(najblizsza - gl)) najblizsza = gp;
    if (Number.isFinite(najblizsza) && Math.abs(najblizsza - gl) <= PROG_LAT) {
      potwierdzenia.push(Math.round(((gl + najblizsza) / 2) * 10) / 10);
    }
  }

  // ROZDZIALY — odcinki MIEDZY kolejnymi potwierdzeniami (plus poczatek i koniec
  // calej osi). To naturalne granice: tam OBA systemy jednoczesnie zmieniaja
  // temat. W jednym rozdziale moze byc kilka mahadasz Wimszottari i kilka
  // znakow Chara Daszy naraz (patrz przyklad usera: Wenus+Slonce w jednym
  // rozdziale) — AI dostaje WSZYSTKIE, nie tylko "glowna" planete/znak.
  const graniceRozdzialow = [0, ...potwierdzenia, maxWiek]
    .sort((a, b) => a - b)
    .filter((g, i, arr) => i === 0 || g - arr[i - 1] > 0.5);

  const rozdzialy = graniceRozdzialow.slice(0, -1).map((od, i) => {
    const doGr = graniceRozdzialow[i + 1];
    const lewaW = lewa.filter((p) => p.wiekOd < doGr && p.wiekDo > od);
    const prawaW = prawa.filter((p) => p.wiekOd < doGr && p.wiekDo > od);
    const jogiMapa = new Map<string, Yoga>();
    const doszeMapa = new Map<string, Dosza>();
    for (const p of [...lewaW, ...prawaW]) {
      for (const j of p.jogiOkresu) jogiMapa.set(j.id, j);
      for (const d of p.doszeOkresu) doszeMapa.set(d.id, d);
    }
    return {
      lataOd: Math.round(od), lataDo: Math.round(doGr),
      imie, plec,
      planety: prawaW.map((p) => ({ nazwa: p.etykieta, ton: p.ton, sila: p.sila })),
      znaki: lewaW.map((p) => ({ nazwa: p.etykieta, dom: p.dom ?? 0, temat: p.temat })),
      jogi: [...jogiMapa.values()].map((j) => ({ nazwa: nazwaZPara(j), znaczenie: j.znaczenie })),
      dosze: [...doszeMapa.values()].map((d) => ({ nazwa: nazwaZPara(d), ryzyko: d.ryzyko })),
    };
  });

  return (
    <details className="card" style={{ marginBottom: 24 }} open>
      <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)", marginBottom: 6 }}>
        Dwie osie dasz — Chara Dasza × Wimszottari
      </summary>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 10, lineHeight: 1.55 }}>
        Ten sam odcinek życia widziany dwoma systemami naraz: po lewej Chara Dasza (znaki, ile obszaru
        życia dotyczy okres), po prawej Wimszottari (planety, jaka energia działa). Oba paski są
        skalowane do tych samych lat od urodzenia — jeśli granice okresów z obu stron wypadają blisko
        siebie, to moment, w którym oba systemy „potwierdzają" zmianę tematu.
      </p>
      <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 18, lineHeight: 1.55 }}>
        Kolor ramki i podpis to ton władcy okresu (ta sama metoda co Oś życia i Mapa czasu jog/dosz):{" "}
        <strong style={{ color: TON_KOLOR["wspierający"] }}>wspierający</strong>,{" "}
        <strong style={{ color: TON_KOLOR["wymagający"] }}>wymagający</strong>,{" "}
        <strong style={{ color: TON_KOLOR["mieszany"] }}>mieszany</strong>. Wypełnione kółka = aktywne jogi,
        puste (same obwódki) = aktywne dosze — najedź na KONKRETNE kółko, żeby zobaczyć, o którą jogę/doszę
        chodzi (legenda kółek na dole). Złoty romb na osi środkowej = granica obu systemów wypada w tym
        samym roku (do {PROG_LAT} lat różnicy) — „potwierdzenie".
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 44px 1fr", marginBottom: 8 }}>
        <span className="eyebrow" style={{ fontSize: "0.7rem", textAlign: "center" }}>Chara Dasza (znaki)</span>
        <span />
        <span className="eyebrow" style={{ fontSize: "0.7rem", textAlign: "center" }}>Wimszottari (planety)</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 44px 1fr", gap: 0, position: "relative", height: wysokoscCalkowita }}>
        <div style={{ position: "relative" }}>
          {lewa.map((p, i) => <Segment key={i} p={p} strona="lewa" />)}
        </div>

        <div style={{ position: "relative", borderLeft: "1px solid var(--line-soft)", borderRight: "1px solid var(--line-soft)" }}>
          {/* Kolor rozdzialu TYLKO na wasnej osi srodkowej (nie na calej szerokosci
              obu kolumn) — najprostszy, najczytelniejszy uklad: pelne, plaskie tlo
              koloru rozdzialu z PALETA_ROZDZIALOW, liczby dekad zostaja czytelne
              na wierzchu. Caly kolorowy pas jest wyzwalaczem dymka (tytul + dlugosc
              rozdzialu, bez listy znakow/planet/jog/dosz — to jest juz nizej w
              kartach "Rozdzialy (AI)"). */}
          {graniceRozdzialow.slice(0, -1).map((od, i) => {
            const doGr = graniceRozdzialow[i + 1];
            const kolor = PALETA_ROZDZIALOW[i % PALETA_ROZDZIALOW.length];
            const r = rozdzialy[i];
            if (!r) return null;
            return (
              <div key={i} style={{ position: "absolute", left: 0, right: 0, top: od * PX_NA_ROK, height: (doGr - od) * PX_NA_ROK }}>
                <ZDymkiem pelnyRozmiar onKlik={() => podswietlRozdzial(i)}
                  trigger={
                    <div style={{
                      width: "100%", height: "100%", background: hexA(kolor, 0.4),
                      borderTop: i > 0 ? `1px solid ${hexA(kolor, 0.85)}` : "none",
                    }} />
                  }
                  content={<>
                    <DymekTytul dzieci={`Rozdział ${i + 1}`} />
                    {tytuly[i] && <DymekPodtytul dzieci={tytuly[i]} />}
                    <DymekOpis dzieci={`${r.lataOd}–${r.lataDo} lat`} />
                  </>}
                />
              </div>
            );
          })}
          {Array.from({ length: Math.floor(maxWiek / 10) + 1 }, (_, i) => i * 10).map((rok) => (
            <div key={rok} style={{ position: "absolute", top: rok * PX_NA_ROK - 7, left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
              <span className="muted" style={{ fontSize: "0.66rem" }}>{rok}</span>
            </div>
          ))}
          <div style={{
            position: "absolute", top: wiekTeraz * PX_NA_ROK, left: -6, right: -6, height: 2,
            background: "var(--primary)", boxShadow: "0 0 8px var(--primary)", pointerEvents: "none",
          }} title="teraz" />
          {potwierdzenia.map((wiek, i) => (
            <span key={i} title={`Potwierdzenie obu systemów w okolicy ${Math.round(wiek)}. roku życia`} style={{
              position: "absolute", top: wiek * PX_NA_ROK - 6, left: "50%", width: 12, height: 12,
              background: "#e6c48a", transform: "translateX(-50%) rotate(45deg)",
              boxShadow: "0 0 0 4px rgba(230,196,138,0.12), 0 0 16px -2px var(--primary)",
              animation: "os-puls 3.4s ease-in-out infinite",
            }} />
          ))}
        </div>

        <div style={{ position: "relative" }}>
          {prawa.map((p, i) => <Segment key={i} p={p} strona="prawa" />)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 44px 1fr", marginTop: 10 }}>
        <span className="eyebrow" style={{ fontSize: "0.7rem", textAlign: "center" }}>Chara Dasza (znaki)</span>
        <span />
        <span className="eyebrow" style={{ fontSize: "0.7rem", textAlign: "center" }}>Wimszottari (planety)</span>
      </div>

      {(jogi.length > 0 || dosze.length > 0) && (
        <div style={{ marginTop: 22, display: "flex", gap: 18, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--muted)" }} />
            <span className="muted">wypełnione kółko = aktywna joga (sprzyjający układ)</span>
          </span>
          <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", border: "1px solid var(--muted)" }} />
            <span className="muted">puste kółko (sama obwódka) = aktywna dosza (na co uważać)</span>
          </span>
          <span className="muted" style={{ fontSize: "0.8rem" }}>— najedź na kółko przy okresie, żeby zobaczyć, o którą konkretnie chodzi.</span>
        </div>
      )}

      {rozdzialy.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <p className="eyebrow" style={{ fontSize: "0.7rem", marginBottom: 6 }}>Rozdziały (AI)</p>
          <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 14, lineHeight: 1.5 }}>
            Granice tam, gdzie oba systemy jednocześnie zmieniają temat — w środku może być kilka mahadasz
            i kilka znaków naraz. AI dostaje wszystkie policzone fakty (planety, znaki, jogi, dosze) i nazywa
            całość jednym, zrozumiałym rozdziałem.
          </p>
          <div style={{ display: "grid", gap: 14 }}>
            {rozdzialy.map((r, i) => (
              <div key={i} id={`rozdzial-karta-${i}`} style={{
                border: `1.5px solid ${hexA(PALETA_ROZDZIALOW[i % PALETA_ROZDZIALOW.length], podswietlony === i ? 1 : 0.5)}`,
                borderRadius: 10, padding: "14px 16px", scrollMarginTop: 24,
                background: podswietlony === i ? hexA(PALETA_ROZDZIALOW[i % PALETA_ROZDZIALOW.length], 0.08) : "transparent",
                boxShadow: podswietlony === i ? `0 0 24px -4px ${hexA(PALETA_ROZDZIALOW[i % PALETA_ROZDZIALOW.length], 0.5)}` : "none",
                transition: "background 0.4s, box-shadow 0.4s, border-color 0.4s",
              }}>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", color: "var(--sand)", marginBottom: 6 }}>
                  <span style={{
                    fontSize: "0.68rem", fontWeight: 700, marginRight: 8, color: "#16232f",
                    background: PALETA_ROZDZIALOW[i % PALETA_ROZDZIALOW.length], padding: "2px 8px", borderRadius: 6,
                  }}>rozdział {i + 1}</span>
                  {r.lataOd}–{r.lataDo} lat
                </p>
                <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 12, lineHeight: 1.5 }}>
                  Planety: {r.planety.map((p) => p.nazwa).join(", ") || "—"} · Znaki: {r.znaki.map((z) => z.nazwa).join(", ") || "—"}
                  {r.jogi.length > 0 && <> · Jogi: {r.jogi.map((j) => j.nazwa).join(", ")}</>}
                  {r.dosze.length > 0 && <> · Dosze: {r.dosze.map((d) => d.nazwa).join(", ")}</>}
                </p>
                <Interpretation kind="rozdzial-dasz" data={r} compact label={`Rozdział ${r.lataOd}-${r.lataDo} lat`}
                  onText={(t) => setTytuly((prev) => ({ ...prev, [i]: wyciagnijTytul(t) }))} />
              </div>
            ))}
          </div>
        </div>
      )}
    </details>
  );
}
