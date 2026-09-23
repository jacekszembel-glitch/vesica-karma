"use client";

import { useMemo, useState } from "react";
import type { VedicChart } from "@/lib/astro/chart";
import { GRAHAS, PLANET_ORDER, RASIS, RASI_LOC, BHAVAS, type PlanetId } from "@/lib/astro/constants";
import { atmakaraka } from "@/lib/astro/karaki";
import { navamsaSign } from "@/lib/astro/varga";
import Term from "@/components/Term";
import Interpretation from "@/components/Interpretation";

/**
 * PROFIL DUSZY — wykres radarowy z brandbooka („WIZUALIZACJA DANYCH").
 *
 * Osie to cztery klasyczne cele życia (purusharthy), a wartości — rozkład
 * dziewięciu grah po domach pogrupowanych tradycyjnie:
 *   dharma (sens)      — domy 1, 5, 9
 *   artha (środki)     — domy 2, 6, 10
 *   kama (pragnienia)  — domy 3, 7, 11
 *   moksza (wolność)   — domy 4, 8, 12
 * To rachunek klasyczny i sprawdzalny, nie „wskaźnik nastroju" — dlatego mamy
 * prawo go rysować. Wymaga znanej godziny urodzenia (bez lagny nie ma domów).
 */

const GRUPY = [
  {
    klucz: "dharma", pl: "Dharma", pod: "sens i droga", domy: [1, 5, 9],
    opis: "sens, powołanie i droga — po co tu jesteś",
  },
  {
    klucz: "artha", pl: "Artha", pod: "środki i praca", domy: [2, 6, 10],
    opis: "środki do życia — praca, pieniądze, status",
  },
  {
    klucz: "kama", pl: "Kama", pod: "pragnienia i więzi", domy: [3, 7, 11],
    opis: "pragnienia i więzi — czego chcesz i z kim",
  },
  {
    klucz: "moksza", pl: "Moksza", pod: "wolność i głębia", domy: [4, 8, 12],
    opis: "wolność i głębia — wyzwolenie z automatycznych wzorców",
  },
] as const;

/** Polska odmiana liczebnika przy słowie "planeta" (1 / 2-4 / 0,5+). */
function liczbaPlanet(n: number): string {
  if (n === 1) return "1 planeta";
  if (n >= 2 && n <= 4) return `${n} planety`;
  return `${n} planet`;
}

/**
 * Czego dusza uczy się przez daną planetę jako atmakarakę (Dżajmini).
 * DO PRZEGLĄDU PRZEZ JACKA — sformułowania interpretacyjne.
 */
const AK_OPISY: Partial<Record<string, string>> = {
  sun: "lekcja pokory — dusza uczy się, że blask nie pochodzi z ego, lecz z autentyczności; droga przez zmierzenie się z dumą i potrzebą uznania",
  moon: "lekcja współodczuwania — dusza uczy się troski o innych i o siebie; droga przez emocje, których nie wolno tłumić ani którym nie wolno się oddać w niewolę",
  mars: "lekcja niestosowania przemocy — dusza uczy się kierować siłę i odwagę ku obronie, nie agresji; droga przez cierpliwość",
  mercury: "lekcja prawdomówności — dusza uczy się używać słowa i intelektu w służbie prawdy; droga przez szczerość w mowie",
  jupiter: "lekcja otwartości — dusza uczy się dzielić mądrością bez wywyższania; droga przez szacunek dla cudzej ścieżki i własnych nauczycieli",
  venus: "lekcja czystości pragnień — dusza uczy się kochać bez zawłaszczania; droga przez relacje i umiar w przyjemnościach",
  saturn: "lekcja współczucia wobec cierpienia — dusza uczy się wytrwałości i dzielenia ciężaru innych; droga przez samotność, która staje się siłą",
  rahu: "lekcja rozpoznawania złudzeń — dusza wchodzi w nieznane terytoria, by nauczyć się odróżniać pragnienie od potrzeby; droga przez nienasycenie",
  ketu: "lekcja puszczania — dusza domyka stare wątki; droga przez intuicję i zgodę na to, co niedokończone",
};

/**
 * Jak bieżąca mahadasza (obojętnie, jakiego jest tematu) BARWI przerabianie
 * lekcji duszy — nie co ta planeta znaczy w ogóle, tylko jaki nadaje TRYB
 * przerabiania: przez działanie, przez uczucie, przez naukę, przez odpuszczanie…
 */
const MAHADASZA_TON: Record<PlanetId, string> = {
  sun: "obecny okres wymusza konkretność i widoczność — lekcja duszy przestaje być teorią, trzeba wziąć za nią odpowiedzialność publicznie, przed innymi",
  moon: "obecny okres przerabia ten temat przez emocje i codzienność — mniej przez wielkie decyzje, bardziej przez to, jak się z nim czujesz na co dzień",
  mars: "obecny okres domaga się działania, nie kontemplacji — lekcja duszy przechodzi teraz przez konkretne, czasem konfrontacyjne kroki",
  mercury: "obecny okres uczy tego tematu przez rozmowę, naukę i nazywanie rzeczy po imieniu — zrozumienie wyprzedza tu działanie",
  jupiter: "obecny okres otwiera i rozszerza ten temat — pojawiają się nauczyciele i okazje, ale też pokusa, by przesadzić z optymizmem",
  venus: "obecny okres przerabia ten temat łagodnie, przez relacje i przyjemność — łatwiej tu o zgodę niż o konfrontację, choć to bywa pułapką",
  saturn: "obecny okres testuje ten temat cierpliwością i ograniczeniem — nic nie przychodzi szybko, ale to, co się teraz zbuduje, zostaje na dłużej",
  rahu: "obecny okres popycha ten temat w nieznane — intensywnie, czasem chaotycznie, z pragnieniem większym niż realna potrzeba",
  ketu: "obecny okres odcina od tego tematu to, co zbędne — mniej przez zdobywanie, bardziej przez odpuszczanie i wewnętrzne uproszczenie",
};

const S = 348;
const CX = S / 2;
const CY = S / 2 + 6;
const R = 100;
// Skala STAŁA (nie względna do maksimum w danej mapie) — 4 pierścienie tła
// odpowiadają dosłownie 1/2/3/4 planetom, jak w pliku wzorcowym. Dzięki temu
// "Kama - 3" zawsze trafia dokładnie na 3. pierścień, niezależnie od tego, ile
// planet ma najmocniej obsadzona grupa w tej konkretnej mapie.
const MAKS_SKALI = 4;

/** Punkt na osi o indeksie i (0 = góra, zgodnie z zegarem) w ułamku promienia t. */
function punkt(i: number, t: number): [number, number] {
  const kat = (i / GRUPY.length) * 2 * Math.PI - Math.PI / 2;
  return [CX + Math.cos(kat) * R * t, CY + Math.sin(kat) * R * t];
}

/** Gładka zamknięta krzywa (Catmull-Rom → Bezier) przez punkty — zamiast prostego
 * romba ostre naroża znikają, a przy typowej mapie (Dharma/Karma wysokie, Artha/
 * Moksza niższe) kształt naturalnie robi się soczewkowaty — jak w pliku wzorcowym. */
function gladkaSciezka(pkt: [number, number][]): string {
  const n = pkt.length;
  const cz1: [number, number][] = [];
  const cz2: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const p0 = pkt[(i - 1 + n) % n], p1 = pkt[i], p2 = pkt[(i + 1) % n], p3 = pkt[(i + 2) % n];
    cz1.push([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]);
    cz2.push([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]);
  }
  let d = `M ${pkt[0][0].toFixed(1)} ${pkt[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p2 = pkt[(i + 1) % n];
    d += ` C ${cz1[i][0].toFixed(1)} ${cz1[i][1].toFixed(1)}, ${cz2[i][0].toFixed(1)} ${cz2[i][1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + " Z";
}

/**
 * SYNTEZA — łączy dwie niezależnie policzone rzeczy w jeden wniosek:
 * (1) która purushartha ma najwięcej planet (rozkład domów),
 * (2) w którym domu — a więc w której puruszarcie — leży atmakaraka.
 * Ten sam dom = naturalny nadmiar i lekcja duszy ciągną w tę samą stronę;
 * różne domy = dwa różne kierunki, które trzeba świadomie łączyć.
 */
function zbudujSyntezęProfilu(
  dane: { dominanta: (typeof GRUPY)[number] } | null,
  ak: { dom: number; planeta: PlanetId; vargottama: boolean },
): string[] | null {
  if (!dane || !ak.dom) return null;
  const grupaAk = GRUPY.find((g) => (g.domy as readonly number[]).includes(ak.dom));
  if (!grupaAk) return null;

  const zdania: string[] = [];
  zdania.push(
    grupaAk.klucz === dane.dominanta.klucz
      ? `Atmakaraka (${GRAHAS[ak.planeta].pl}) siedzi w ${ak.dom}. domu, należącym do ${grupaAk.pl} — tej samej sfery, ` +
        `która jest u Ciebie najmocniej obsadzona planetami. Naturalny nadmiar i główna lekcja duszy ciągną w tę samą stronę: ${grupaAk.pod}.`
      : `Atmakaraka (${GRAHAS[ak.planeta].pl}) siedzi w ${ak.dom}. domu, należącym do ${grupaAk.pl} (${grupaAk.pod}) — ` +
        `inaczej niż najmocniej obsadzona u Ciebie ${dane.dominanta.pl} (${dane.dominanta.pod}). To dwa różne kierunki: gdzie masz ` +
        `naturalny nadmiar planet, a gdzie leży główna lekcja duszy — warto świadomie je łączyć, nie wybierać jednego kosztem drugiego.`,
  );
  if (ak.vargottama) {
    zdania.push("Do tego atmakaraka jest vargottama — ten sam znak w D1 i D9 wzmacnia ten przekaz, czyni go wyjątkowo spójnym i trudnym do zignorowania.");
  }
  return zdania;
}

/**
 * PORTRET — krótka, płynna synteza spinająca to, co gdzie indziej na stronie
 * jest podane osobno: kim jesteś na zewnątrz (Lagna/Słońce), jaki masz rytm
 * wewnętrzny (Księżyc), jaka jest główna lekcja duszy (atmakaraka +
 * karakamsza) i w jakim punkcie tej lekcji jesteś teraz (bieżąca mahadasza).
 * Świadomie kilka zdań, nie osobna strona — te fakty już są policzone
 * gdzie indziej, tu tylko łączymy je w jedną narrację.
 */
function zbudujPortret(
  chart: VedicChart,
  ak: { planeta: PlanetId; d9: (typeof RASIS)[number]; karakamszaDom: number },
): string[] {
  const zdania: string[] = [];

  if (chart.angles) {
    const lagna = RASIS[chart.angles.lagnaSign];
    zdania.push(
      `Na zewnątrz wchodzisz w świat jako ${lagna.pl} (władca: ${GRAHAS[lagna.lord].pl}) —`
      + ` a Słońce w ${RASI_LOC[chart.planets.sun.sign]} pokazuje, gdzie szukasz uznania i poczucia własnej siły.`,
    );
  } else {
    zdania.push(`Bez znanej godziny urodzenia lagna pozostaje nieznana — Słońce w ${RASI_LOC[chart.planets.sun.sign]} to Twój najpewniejszy punkt tożsamości.`);
  }

  zdania.push(
    `Wewnątrz rządzi Księżyc w nakszatrze ${chart.moonNakshatra.nakshatra.pl} (${chart.moonNakshatra.nakshatra.motyw.split(",")[0]})`
    + ` — to odruchowy, emocjonalny rytm, który działa niezależnie od tego, jak prezentujesz się na zewnątrz.`,
  );

  const akOpis = AK_OPISY[ak.planeta];
  zdania.push(
    `Najgłębszym tematem tego wcielenia jest ${GRAHAS[ak.planeta].pl} jako atmakaraka — ${akOpis}`
    + (ak.karakamszaDom > 0
      ? `; dojrzewa on w ${ak.karakamszaDom}. domu (${BHAVAS[ak.karakamszaDom - 1].obszar.split(",")[0]}) — to tam owoc tej lekcji ostatecznie się materializuje.`
      : "."),
  );

  const maha = chart.currentDasha.find((d) => d.level === 1);
  if (maha) {
    zdania.push(
      `Obecnie ta lekcja przechodzi przez mahadashę ${GRAHAS[maha.lord].pl} (do ${maha.end.getFullYear()} r.) — ${MAHADASZA_TON[maha.lord]}.`,
    );
  }

  return zdania;
}

export default function ProfilDuszy({ chart }: { chart: VedicChart }) {
  const dane = useMemo(() => {
    if (!chart.angles) return null;
    const liczby = GRUPY.map((g) =>
      PLANET_ORDER.filter((id) => (g.domy as readonly number[]).includes(chart.planets[id].house)).length,
    );
    return {
      liczby,
      // skala stała: 0 planet = 8% promienia (żeby punkt nie znikał w centrum),
      // 1-4 planety = dosłownie 1.-4. pierścień; 4+ ląduje na brzegu.
      ulamki: liczby.map((n) => (n === 0 ? 0.08 : Math.min(1, n / MAKS_SKALI))),
      dominanta: GRUPY[liczby.indexOf(Math.max(...liczby))],
    };
  }, [chart]);

  // atmakaraka nie wymaga godziny urodzenia (poza domem) — liczymy zawsze
  const ak = useMemo(() => {
    const k = atmakaraka(chart);
    const p = chart.planets[k.planeta];
    const znak = RASIS[Math.floor(p.longitude / 30)];
    const d9 = RASIS[navamsaSign(p.longitude)];
    const dom = chart.angles ? p.house : 0;
    // KARAKAMSZA — dom, w którym (liczony od Lagny D1) ląduje znak nawamszy
    // atmakaraki. To osobna, klasyczna informacja od "domu D1 atmakaraki"
    // powyżej: pokazuje, gdzie dojrzały, wewnętrzny owoc lekcji duszy się
    // materializuje, nie gdzie sama planeta stoi w mapie urodzeniowej.
    const karakamszaDom = chart.angles
      ? ((d9.index - chart.angles.lagnaSign + 12) % 12) + 1
      : 0;
    return { ...k, znak, d9, dom, karakamszaDom, vargottama: znak.index === d9.index };
  }, [chart]);

  const [aktywny, setAktywny] = useState<string | null>(null);

  if (!dane && !ak) return null;

  const planetyGrupy = (g: (typeof GRUPY)[number]) =>
    PLANET_ORDER.filter((id) => (g.domy as readonly number[]).includes(chart.planets[id].house)).map((id) => GRAHAS[id].pl);

  const synteza = zbudujSyntezęProfilu(dane, ak);
  const portret = zbudujPortret(chart, ak);

  // dane do rozbudowanej analizy AI — ten sam podzial (GRUPY) i te same liczby co wykres, tylko z dolozonym zywiolem (wg lagny) i informacja o atmakarace
  const aiData = dane && chart.angles ? (() => {
    const lagnaSign = chart.angles!.lagnaSign;
    const grupy = GRUPY.map((g, i) => ({
      nazwa: g.pl, obszar: g.pod, zywiol: RASIS[(lagnaSign + i) % 12].element,
      liczbaPlanet: dane.liczby[i], planety: planetyGrupy(g),
    }));
    const grupaAk = GRUPY.find((g) => (g.domy as readonly number[]).includes(ak.dom));
    return {
      grupy,
      osPionowa: { nazwa: "Dharma-Kama", suma: dane.liczby[0] + dane.liczby[2] },
      osPozioma: { nazwa: "Artha-Moksza", suma: dane.liczby[1] + dane.liczby[3] },
      atmakaraka: { planeta: GRAHAS[ak.planeta].pl, dom: ak.dom, grupa: grupaAk?.pl ?? null },
    };
  })() : null;

  const obrys = dane ? gladkaSciezka(dane.ulamki.map((t, i) => punkt(i, t))) : null;

  return (
    <div style={{ maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
      <p style={{ fontFamily: "var(--font-serif)", fontSize: "2.6rem", color: "var(--sand)", fontWeight: 700, marginBottom: 16, textAlign: "center" }}>
        Profil duszy
      </p>
      <p style={{ fontSize: "0.86rem", lineHeight: 1.6, color: "var(--sand)", textAlign: "center", marginBottom: 20 }}>
        Rozkład <Term k="graha" plain>dziewięciu grah</Term> po czterech klasycznych celach życia
        (purusharthach) — <Term k="dom" plain>domy</Term> pogrupowane tradycyjnie.
      </p>

      {/* ── portret: krótka, płynna narracja spinająca tożsamość, rytm emocjonalny,
          lekcję duszy (atmakaraka + karakamsza) i bieżący czas (mahadasza) — na
          samej górze, jako przystępny nagłówek karty, ZANIM zacznie się część
          techniczna (wykres, tabela Atmakaraki, Synteza pod spodem). Świadomie
          nie obok Syntezy: dwie narracje jedna pod drugą się gryzły, a Synteza
          i tak komentuje wykres, więc lepiej pasuje bezpośrednio pod nim. ── */}
      <div style={{ marginBottom: 20 }}>
        <p className="eyebrow" style={{ marginBottom: 6, color: "var(--sand)" }}>Portret</p>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.65, color: "var(--sand)" }}>
          {portret.map((zdanie, i) => <span key={i}>{zdanie}{" "}</span>)}
        </p>
      </div>

      <div style={{ display: "grid", gap: 28 }}>
        {/* ── wykres radarowy, wyśrodkowany, nad tekstem Atmakaraki (nie obok) ── */}
        <div style={{ position: "relative" }}>
          {dane && <>
          <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 452, display: "block", margin: "0 auto" }}
            role="img" aria-label={`Profil duszy: ${GRUPY.map((g, i) => `${g.pl} ${dane.liczby[i]}`).join(", ")}`}>
            {/* pierścienie tła — okręgi, jak w pliku wzorcowym (nie romby) */}
            {[0.25, 0.5, 0.75, 1].map((t) => (
              <circle key={t} cx={CX} cy={CY} r={R * t} fill="none" stroke="rgba(230,196,138,0.22)" strokeWidth="1" />
            ))}
            {/* osie */}
            {GRUPY.map((g, i) => {
              const [px, py] = punkt(i, 1);
              const podswietlona = aktywny === g.klucz;
              return (
                <line key={i} x1={CX} y1={CY} x2={px} y2={py}
                  stroke={podswietlona ? "#7fd0d8" : "rgba(230,196,138,0.3)"}
                  strokeWidth={podswietlona ? 1.6 : 1}
                  style={{ transition: "stroke 0.2s, stroke-width 0.2s" }} />
              );
            })}

            {/* kształt profilu — gładka soczewkowata krzywa, nie ostry romb */}
            <path d={obrys ?? undefined} fill="rgba(230,196,138,0.16)" stroke="#e6c48a" strokeWidth="1.8"
              strokeLinejoin="round" />
            {dane.ulamki.map((t, i) => {
              const [px, py] = punkt(i, t);
              const podswietlona = aktywny === GRUPY[i].klucz;
              return (
                <circle key={i} cx={px} cy={py} r={podswietlona ? 5 : 3.4} fill="#0d1b2a"
                  stroke={podswietlona ? "#7fd0d8" : "#e6c48a"} strokeWidth="1.6"
                  style={{ transition: "r 0.2s, stroke 0.2s" }} />
              );
            })}

            {/* etykiety osi z liczbą planet — najedź, żeby zobaczyć które planety */}
            {GRUPY.map((g, i) => {
              const [px, py] = punkt(i, 1.24);
              const podswietlona = aktywny === g.klucz;
              return (
                <text key={g.klucz} x={px} y={py} textAnchor="middle" fontFamily="var(--font-sans)"
                  style={{ cursor: "default" }}
                  onMouseEnter={() => setAktywny(g.klucz)}
                  onMouseLeave={() => setAktywny(null)}>
                  <tspan x={px} fontSize="12.5" fontWeight="600" fill={podswietlona ? "#7fd0d8" : "#e6c48a"}
                    style={{ transition: "fill 0.2s" }}>{g.pl} - {dane.liczby[i]}</tspan>
                  <tspan x={px} dy="13" fontSize="9" fill="#93a6b3">{g.pod}</tspan>
                </text>
              );
            })}
          </svg>

          {/* dymek z planetami dla najechanej osi */}
          {aktywny && (() => {
            const i = GRUPY.findIndex((g) => g.klucz === aktywny);
            const g = GRUPY[i];
            const [px, py] = punkt(i, 1.24);
            const planety = planetyGrupy(g);
            return (
              <div style={{
                position: "absolute", left: `${(px / S) * 100}%`, top: `${(py / S) * 100}%`,
                transform: `translate(-50%, ${py < CY ? "calc(-100% - 30px)" : "18px"})`,
                zIndex: 5, pointerEvents: "none",
              }}>
                <div style={{
                  background: "rgba(16, 34, 49, 0.98)", border: "1px solid var(--line)",
                  borderRadius: 10, padding: "10px 14px", maxWidth: 220,
                  boxShadow: "0 10px 26px rgba(0,0,0,0.5)",
                  animation: "fadeUp 0.15s var(--ease-out) both",
                  fontSize: "0.82rem", color: "#e8eef2", lineHeight: 1.5,
                }}>
                  <strong>{g.pl}</strong> ({g.pod})
                  <p className="muted" style={{ fontSize: "0.76rem", marginTop: 2, marginBottom: 6 }}>{g.opis}</p>
                  {liczbaPlanet(planety.length)} w tych domach
                  {planety.length > 0 && <>: {planety.join(", ")}</>}
                </div>
              </div>
            );
          })()}

          <p className="muted" style={{ fontSize: "0.86rem", lineHeight: 1.6, textAlign: "center", marginTop: 10 }}>
            Najmocniejsza obsadzona: <strong style={{ color: "var(--sand)" }}>{dane.dominanta.pl.toUpperCase()}</strong>{" "}
            ({dane.dominanta.pod}) - {PLANET_ORDER
              .filter((id) => (dane.dominanta.domy as readonly number[]).includes(chart.planets[id].house))
              .map((id) => GRAHAS[id].pl)
              .join(", ")}.
          </p>
          </>}
        </div>

        {/* ── atmakaraka — znak · dom · nawamsza, pod wykresem ── */}
        <div>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", fontWeight: 700, color: "var(--sand)", marginBottom: 10 }}>
            <Term k="atmakaraka">Atmakaraka</Term> — wskaźnik duszy
          </p>
          <p style={{ fontSize: "0.95rem", lineHeight: 1.6, marginBottom: 10 }}>
            <span style={{ color: GRAHAS[ak.planeta].color, fontSize: "1.15rem" }}>
              {GRAHAS[ak.planeta].symbol}
            </span>{" "}
            <strong>{GRAHAS[ak.planeta].pl}</strong>{" "}
            <span className="muted">
              ({ak.stopien.toFixed(1)}° — najwyższy stopień w znaku)
            </span>{" "}
            — {AK_OPISY[ak.planeta]}.
          </p>
          <div style={{ display: "grid", gap: 7, fontSize: "0.88rem", lineHeight: 1.55 }}>
            <p>
              <span className="muted">W znaku:</span>{" "}
              <strong>{ak.znak.symbol} {ak.znak.pl}</strong>{" "}
              <span className="muted">
                — żywioł {ak.znak.element}, władca {GRAHAS[ak.znak.lord].pl}; ton, w jakim dusza
                przerabia swoją lekcję.
              </span>
            </p>
            {ak.dom > 0 && (
              <p>
                <span className="muted">W domu:</span>{" "}
                <strong>{ak.dom}. dom</strong>{" "}
                <span className="muted">
                  — {BHAVAS[ak.dom - 1].obszar}; obszar życia, w którym ta lekcja
                  najmocniej się materializuje.
                </span>
              </p>
            )}
            <p>
              <span className="muted">W <Term k="nawamsza">nawamszy</Term> (karakamsza):</span>{" "}
              <strong>{ak.d9.symbol} {ak.d9.pl}</strong>{" "}
              <span className="muted">
                {ak.vargottama
                  ? "— vargottama: ten sam znak w D1 i D9, przekaz duszy wyjątkowo spójny i mocny."
                  : `— dojrzały kierunek duszy: owoc lekcji ujawnia się w tonie znaku ${ak.d9.pl} (władca: ${GRAHAS[ak.d9.lord].pl}).`}
              </span>
            </p>
            {ak.karakamszaDom > 0 && (
              <p>
                <span className="muted">Karakamsza licząc od Lagny:</span>{" "}
                <strong>{ak.karakamszaDom}. dom</strong>{" "}
                <span className="muted">
                  — {BHAVAS[ak.karakamszaDom - 1].obszar}.{" "}
                  {ak.vargottama
                    ? `Wychodzi ten sam dom co przy pozycji D1 wyżej — to nie powtórka, tylko efekt vargottamy: skoro D1 i D9 dzielą ten sam znak, `
                      + `dom liczony od Lagny musi wyjść identyczny. Lekcja duszy nie „przesuwa się” do innego obszaru życia w miarę dojrzewania — `
                      + `zaczyna się i owocuje w tym samym, jednym polu. To rzadkie i wzmacnia przekaz zamiast go rozdwajać.`
                    : `To pole, w którym ta lekcja duszy dojrzewa najpełniej — inne niż dom, w którym atmakaraka stoi w samej mapie urodzeniowej `
                      + `(wyżej): tamten pokazuje, gdzie lekcja się zaczyna, ten — do czego ostatecznie prowadzi.`}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── synteza: łączy dominującą puruszartę z domem atmakaraki w jeden wniosek ── */}
      {synteza && (
        <div style={{ marginTop: 18 }}>
          <p className="eyebrow" style={{ marginBottom: 6, color: "var(--sand)" }}>Synteza</p>
          <p style={{ fontSize: "0.9rem", lineHeight: 1.65, color: "var(--sand)" }}>
            {synteza.map((zdanie, i) => <span key={i}>{zdanie}{" "}</span>)}
          </p>
          {aiData && (
            <details style={{ marginTop: 14 }}>
              <summary style={{ cursor: "pointer", fontSize: "0.84rem", color: "var(--teal-soft)" }}>
                Rozbudowana analiza (AI)
              </summary>
              <div style={{ marginTop: 10 }}>
                <Interpretation kind="profil-duszy" data={aiData} label="Profil duszy — rozbudowana analiza" compact />
              </div>
            </details>
          )}
        </div>
      )}

      <div className="skrot-hero-linia" />
    </div>
  );
}
