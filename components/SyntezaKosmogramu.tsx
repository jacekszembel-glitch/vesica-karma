"use client";

import { useMemo, useState } from "react";
import type { VedicChart, Dignity } from "@/lib/astro/chart";
import { GRAHAS, RASIS, RASI_LOC, BHAVAS, type PlanetId } from "@/lib/astro/constants";
import { kondycjaWskaznik, poziomWzmocnienia, TEMAT_PLANETY, PREDYSPOZYCJA_OPIS, najsilniejszaPlaneta } from "@/lib/astro/domInterpretacja";
import { atmakaraka } from "@/lib/astro/karaki";
import { wykryteDosze, silaDoszy } from "@/lib/astro/doshas";
import { wykryteJogiPosortowane, domZnaku } from "@/lib/astro/yogas";
import { bhinnasztakawarga, sarwasztakawarga } from "@/lib/astro/ashtakavarga";
import { GLOSSARY } from "@/lib/glossary";
import Term from "@/components/Term";

/**
 * MANDALA SYNTEZY KOSMOGRAMU — dla początkujących, na samej górze strony,
 * zanim ktokolwiek zacznie przewijać. Ten sam wzorzec co Mandala Syntezy na
 * /sciezka (SyntezaSciezki.tsx — świadomie NIE dotykana, zostaje osobno):
 * te same klasy CSS (syn- i synteza-), ten sam kształt (atmakaraka w
 * centrum, sześć węzłów wokół, legenda obok, podsumowanie na dole) — ale
 * węzły opisują to, co jest liczone TU, na kosmogramie, a nie działy całej
 * Ścieżki. Wersja pierwsza — celowo bez przełącznika płasko/orbitalnie i
 * bez mapy miejsc/numerologii z pierwszego szkicu, do rozbudowy później.
 */

const TON_KOLOR: Record<"dobre" | "zle" | "neutralne", string> = {
  dobre: "#6fbf9f", zle: "#e08a63", neutralne: "#b9c7d1",
};

/** Ten sam słownik co w RankingGrah/RankingDomeny ("wspierający/mieszany/wymagający"), żeby słowo znaczyło to samo wszędzie w serwisie. */
const TON_SLOWO: Record<"dobre" | "zle" | "neutralne", string> = {
  dobre: "wspierający, działa gładko", zle: "wymagający, działa z tarciem", neutralne: "mieszany, zależny od sytuacji",
};

/** Krótkie, czytelne nazwy godności — do podpisu przy pierścieniach, żeby "dobrze"/"słabo" nie wisiało bez kontekstu. */
const DIGNITY_KROTKO: Record<Dignity, string> = {
  egzaltacja: "egzaltacja", mulatrikona: "mulatrikona", władanie: "u siebie",
  przyjazny: "znak przyjaciela", neutralny: "znak neutralny", wrogi: "znak wroga", upadek: "upadek",
};

const ZYWIOL_OPIS: Record<string, string> = {
  "ogień": "impulsywny, entuzjastyczny — szybko się zapalasz i szybko reagujesz",
  "ziemia": "praktyczny i stabilny — potrzebujesz namacalnych efektów, nie samych obietnic",
  "powietrze": "komunikatywny i zmienny — żyjesz ideami i wymianą myśli",
  "woda": "wrażliwy i intuicyjny — częściej kierujesz się emocjami niż chłodną logiką",
};

interface Wezel {
  dzial: string;
  glif: string;
  kolor: string;
  wynik: string;
  dlaczego: string;
  /** Ogólna definicja działu — do dymka po najechaniu na nazwę (co to w ogóle jest). */
  ogolnie: string;
  /** Konkretny wniosek DLA TEJ MAPY, w skrócie — do panelu po kliknięciu belki (co to znaczy U CIEBIE). */
  skrot: string;
  zamkniety?: boolean;
}

/** Pierścieniowy wskaźnik procentowy — trzy u góry (Ascendent/Słońce/Księżyc), ta sama semantyka co pasek kondycjaWskaznik gdzie indziej w serwisie. */
function Pierscien({ procent, kolor, size = 64 }: { procent: number; kolor: string; size?: number }) {
  const r = size / 2 - 6;
  const obwod = 2 * Math.PI * r;
  const dl = (Math.max(2, procent) / 100) * obwod;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={kolor} strokeWidth="6"
        strokeDasharray={`${dl} ${obwod - dl}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dasharray 0.6s var(--ease-out)" }} />
    </svg>
  );
}

function WezelKrag({ w, i, p, r, cy, aktywny, setAktywny }: {
  w: Wezel; i: number; p: { x: number; y: number }; r: number; cy: number;
  aktywny: string | null; setAktywny: (v: string | null) => void;
}) {
  return (
    <g className={`syn-wezel${w.zamkniety ? " syn-wezel-zamkniety" : ""}`} style={{ "--i": i } as React.CSSProperties}>
      <g className={`syn-wezel-krag${aktywny === w.dzial ? " aktywny" : ""}`}
        onMouseEnter={() => setAktywny(w.dzial)} onMouseLeave={() => setAktywny(null)}>
        <title>{w.dzial} — {w.ogolnie}</title>
        <circle cx={p.x} cy={p.y} r={r} fill="rgba(13,27,42,0.85)"
          stroke={w.zamkniety ? "#4a5b68" : w.kolor} strokeWidth="1.3"
          strokeDasharray={w.zamkniety ? "3 5" : undefined} />
        {w.zamkniety ? (
          <text x={p.x} y={p.y + 7} textAnchor="middle" fill="#4a5b68" fontSize="20">?</text>
        ) : (
          <text x={p.x} y={p.y + 7} textAnchor="middle" fill={w.kolor}
            fontSize={w.glif.length > 1 ? 21 : 25} filter="url(#synk-glow)">{w.glif}</text>
        )}
      </g>
      <text x={p.x} y={p.y + (p.y < cy ? -(r + 9) : r + 17)} textAnchor="middle"
        fill={w.zamkniety ? "#5c6b76" : "#93a6b3"} fontSize="10" letterSpacing="0.16em">
        {w.dzial.toUpperCase()}
      </text>
    </g>
  );
}

export default function SyntezaKosmogramu({ chart }: { chart: VedicChart }) {
  const wezly = useMemo<Wezel[]>(() => {
    const naj = najsilniejszaPlaneta(chart);
    const tonNaj = poziomWzmocnienia(chart.planets[naj.id].dignity);

    const maha = chart.currentDasha.find((d) => d.level === 1);
    const antar = chart.currentDasha.find((d) => d.level === 2);
    const tonCzasu = maha ? poziomWzmocnienia(chart.planets[maha.lord].dignity) : "neutralne";
    const tonAntaru = antar ? poziomWzmocnienia(chart.planets[antar.lord].dignity) : null;

    const dosze = wykryteDosze(chart).filter((d) => !d.zniesiona).sort((a, b) => silaDoszy(chart, b) - silaDoszy(chart, a));
    const dosza = dosze[0] ?? null;

    const jogi = wykryteJogiPosortowane(chart);
    const joga = jogi[0] ?? null;

    const bav = chart.angles ? bhinnasztakawarga(chart) : null;
    const sarwa = bav ? sarwasztakawarga(bav) : null;
    const najlepszyZnak = sarwa ? sarwa.indexOf(Math.max(...sarwa)) : null;
    const domNajlepszego = chart.angles && najlepszyZnak !== null ? domZnaku(chart.angles.lagnaSign, najlepszyZnak) : null;

    const lagna = chart.angles ? RASIS[chart.angles.lagnaSign] : null;

    return [
      {
        dzial: "Fundament",
        glif: lagna ? lagna.symbol : GRAHAS.moon.symbol,
        kolor: "#7fd0d8",
        wynik: lagna
          ? `lagna ${lagna.pl} · Księżyc w ${chart.moonNakshatra.nakshatra.pl}`
          : `Księżyc w ${chart.moonNakshatra.nakshatra.pl}`,
        dlaczego: lagna ? `władca ascendentu: ${GRAHAS[lagna.lord].pl}` : "nakszatra Księżyca prowadzi cały odczyt",
        ogolnie: "Fundament to lagna (znak wschodzący) i Księżyc w nakszatrze — najbardziej osobista, odruchowa warstwa mapy.",
        skrot: lagna
          ? `${lagna.pl} nadaje Ci styl działania i pierwsze wrażenie, jakie robisz na innych; Księżyc w ${chart.moonNakshatra.nakshatra.pl} to Twój emocjonalny rytm — to, co daje wewnętrzne poczucie bezpieczeństwa, niezależnie od okoliczności.`
          : `Bez znanej godziny urodzenia lagna pozostaje nieznana — Księżyc w ${chart.moonNakshatra.nakshatra.pl} to jedyny pewny punkt odniesienia: Twój emocjonalny rytm i to, co daje wewnętrzne poczucie bezpieczeństwa.`,
      },
      {
        dzial: "Najsilniejsza",
        glif: GRAHAS[naj.id].symbol,
        kolor: TON_KOLOR[tonNaj],
        wynik: `${GRAHAS[naj.id].pl} — ${TEMAT_PLANETY[naj.id]}`,
        dlaczego: naj.metoda,
        ogolnie: "Planeta z najwyższą łączną oceną siły w Twojej mapie — obszar, przez który działanie przychodzi najłatwiej.",
        skrot: PREDYSPOZYCJA_OPIS[naj.id],
      },
      {
        dzial: "Czas",
        glif: maha ? GRAHAS[maha.lord].symbol : "◌",
        kolor: maha ? TON_KOLOR[tonCzasu] : "#b9c7d1",
        wynik: maha
          ? `mahadasha ${GRAHAS[maha.lord].pl}${antar ? ` · podokres ${GRAHAS[antar.lord].pl}` : ""}`
          : "—",
        dlaczego: maha ? `władca bieżącego wielkiego okresu stoi ${chart.planets[maha.lord].dignity === "władanie" ? "we własnym znaku" : `w ${chart.planets[maha.lord].signPl}`}` : "",
        ogolnie: "Vimshottari Dasza — 120-letni cykl, w którym po kolei „rządzą” poszczególne planety, licząc od Księżyca w nakszatrze.",
        skrot: maha
          ? `Mahadasha ${GRAHAS[maha.lord].pl} to okres ${TON_SLOWO[tonCzasu]}.`
            + (antar && tonAntaru ? ` Bieżący podokres (antardasza) ${GRAHAS[antar.lord].pl} jest ${TON_SLOWO[tonAntaru]} — to on barwi teraźniejszość najmocniej, mahadasha to tylko tło.` : "")
          : "Bez znanej godziny urodzenia dasza wciąż jest liczona (od Księżyca), ale bez domów trudniej ocenić ton okresu.",
      },
      {
        dzial: "Dosze",
        glif: dosza ? "⚠" : "✓",
        kolor: dosza ? TON_KOLOR.zle : TON_KOLOR.dobre,
        wynik: dosza ? dosza.nazwa : "brak wyraźnej, aktywnej doszy",
        dlaczego: dosza ? dosza.ryzyko : "żadna klasyczna afflictacja nie rysuje się tu ostro",
        ogolnie: "Dosze to klasyczne, programowo wykryte obciążenia — nie wyroki, tylko tematy, które warto świadomie przepracować. To fakt STAŁY, wpisany w mapę od urodzenia — nie okres, w którym akurat jesteś (tym jest węzeł „Czas” obok). Zmienia się tylko to, jak mocno się czuje: najsilniej w mahadashy planety, która ją tworzy.",
        skrot: dosza
          ? `${dosza.nazwa}: ${dosza.ryzyko}. ${dosza.zniesiona ? `Zniesiona: ${dosza.powodZniesienia}` : "Aktywna — najsilniej odczuwalna w mahadashy/antardaszy planet, które ją tworzą."}`
          : "Żadna z pięciu sprawdzanych klasycznych dosz nie wystąpiła w Twojej mapie w aktywnej formie — to normalne, dotyczy większości map.",
      },
      {
        dzial: "Jogi",
        glif: joga ? "✦" : "◌",
        kolor: joga ? TON_KOLOR.dobre : "#b9c7d1",
        wynik: joga ? joga.nazwa : "brak wyraźnej klasycznej jogi",
        dlaczego: joga ? joga.znaczenie : "to nie ujma — większość ludzi ma zero albo jedną",
        ogolnie: "Jogi to klasyczne kombinacje planet uznawane za wskaźniki talentu i szczęścia. To fakt STAŁY, wpisany w mapę od urodzenia — nie okres, w którym akurat jesteś (tym jest węzeł „Czas” obok). Zmienia się tylko to, jak mocno się to czuje: najsilniej w mahadashy planety, która tę jogę tworzy.",
        skrot: joga
          ? `${joga.nazwa} — ${joga.uzasadnienie} Najsilniej odczuwalna w mahadashy/antardaszy planet, które ją tworzą.`
          : "Żadna z siedmiu sprawdzanych klasycznych jog nie wystąpiła w Twojej mapie w czystej formie — to normalne, dotyczy większości map.",
      },
      {
        dzial: "Asztakawarga",
        glif: domNajlepszego ? String(domNajlepszego) : "?",
        kolor: domNajlepszego ? "#e6c48a" : "#4a5b68",
        wynik: domNajlepszego ? `najmocniejszy: ${domNajlepszego}. dom` : "wymaga znanej godziny urodzenia",
        dlaczego: domNajlepszego && najlepszyZnak !== null
          ? `${sarwa![najlepszyZnak]} bindu w ${RASIS[najlepszyZnak].pl} — średnia na znak to ok. 28, więc wyraźnie powyżej średniej`
          : "",
        ogolnie: "Asztakawarga liczy, ile z ośmiu źródeł (7 grah i lagna, każde po 0-8 punktów-\"bindu\") wskazuje dany znak jako sprzyjający — suma na 12 znaków to zawsze 337, czyli średnio ok. 28 na znak. Dom z najwyższym bindu to nie konkretne wydarzenie ani okres, tylko ogólny „grunt” pod ten temat: tranzyty i dasze przechodzące przez niego działają zwykle pewniej i z mniejszym oporem niż przez domy poniżej średniej.",
        skrot: domNajlepszego
          ? `Dom ${domNajlepszego} — ${BHAVAS[domNajlepszego - 1].obszar.split(",")[0]} — ma najsilniejszy grunt spośród wszystkich 12 domów Twojej mapy. To nie konkretny okres ani zdarzenie: po prostu ten obszar życia zwykle rozwija się z mniejszym oporem niż inne.`
          : "Bez znanej godziny urodzenia nie da się policzyć domów, więc Asztakawarga (jako podział na 12 domów) pozostaje niedostępna.",
        zamkniety: !domNajlepszego,
      },
    ];
  }, [chart]);

  const ak = useMemo(() => atmakaraka(chart), [chart]);
  const zywiol = RASIS[chart.planets.moon.sign].element;

  const synteza = useMemo(() => {
    const naj = najsilniejszaPlaneta(chart);
    const akObj = atmakaraka(chart);
    const maha = chart.currentDasha.find((d) => d.level === 1);
    const dosze = wykryteDosze(chart).filter((d) => !d.zniesiona).sort((a, b) => silaDoszy(chart, b) - silaDoszy(chart, a));
    const dosza = dosze[0] ?? null;
    const joga = wykryteJogiPosortowane(chart)[0] ?? null;

    const zdania: string[] = [
      naj.id === akObj.planeta
        ? `Najmocniejsza planeta Twojej mapy i wskaźnik duszy to ta sama planeta — ${GRAHAS[naj.id].pl}. To, w czym jesteś naturalnie najsilniejszy/a, i główny temat tego wcielenia idą tu w parze — rzadka, wyrazista spójność.`
        : `Najmocniejsza planeta (${GRAHAS[naj.id].pl}) i wskaźnik duszy (${GRAHAS[akObj.planeta].pl}) to dwie różne planety — naturalna siła i główna lekcja duszy leżą w innych obszarach; nie licz, że jeden temat automatycznie da drugi, warto świadomie rozwijać oba.`,
    ];

    if (maha) {
      zdania.push(
        `Obecnie trwa mahadasha ${GRAHAS[maha.lord].pl} — to praktyczny punkt wejścia, żeby pracować z tematem tej planety właśnie teraz, niezależnie od tego, co pokazują inne działy.`,
      );
    }

    if (joga && dosza) {
      zdania.push(
        `W mapie widać naraz wyraźną ${joga.nazwa} (${joga.znaczenie}) i aktywną ${dosza.nazwa} (${dosza.ryzyko}) — to normalne: żadna mapa nie jest jednoznacznie „dobra" ani „zła", wsparcie i wyzwanie zwykle idą w parze, jedno nie unieważnia drugiego.`,
      );
    } else if (joga) {
      zdania.push(`Dodatkowym atutem jest ${joga.nazwa} — ${joga.znaczenie}, bez wyraźnie aktywnej doszy, która by to komplikowała.`);
    } else if (dosza) {
      zdania.push(`Poza tym warto świadomie popracować nad tematem ${dosza.nazwa} — ${dosza.ryzyko}.`);
    } else {
      zdania.push(`Żadna klasyczna dosza ani wyróżniona joga nie rysują się tu wyraźnie — obraz spokojny, bez ostrych skrajności w żadną stronę.`);
    }

    return zdania.join(" ");
  }, [chart]);

  const [aktywny, setAktywny] = useState<string | null>(null);
  const [rozwinieta, setRozwinieta] = useState<string | null>(null);

  const S = 380, cx = S / 2, cy = S / 2, R = 132, rW = 40;
  const pos = (i: number) => {
    const a = ((i * 60 - 90) * Math.PI) / 180;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  };
  const wezlyZPoz = wezly.map((w, i) => ({ w, i, p: pos(i) }));

  const donuty: { etykieta: string; znak: string; procent: number; kolor: string; opis: string }[] = [
    ...(chart.angles ? [(() => {
      const wladcaAscendentu = RASIS[chart.angles.lagnaSign].lord;
      const dig = chart.planets[wladcaAscendentu].dignity;
      const k = kondycjaWskaznik(dig);
      return {
        etykieta: "Ascendent", znak: RASIS[chart.angles.lagnaSign].pl, procent: k.procent, kolor: k.kolor,
        opis: `władca (${GRAHAS[wladcaAscendentu].pl}, ${DIGNITY_KROTKO[dig]}) — kondycja: ${k.etykieta}`,
      };
    })()] : []),
    ...(["sun", "moon"] as const).map((id) => {
      const p = chart.planets[id];
      const k = kondycjaWskaznik(p.dignity);
      return { etykieta: GRAHAS[id].pl, znak: p.signPl, procent: k.procent, kolor: k.kolor, opis: `${DIGNITY_KROTKO[p.dignity]} — kondycja: ${k.etykieta}` };
    }),
    (() => {
      const p = chart.planets[ak.planeta];
      const k = kondycjaWskaznik(p.dignity);
      return {
        etykieta: "Atmakaraka", znak: GRAHAS[ak.planeta].pl, procent: k.procent, kolor: k.kolor,
        opis: `${DIGNITY_KROTKO[p.dignity]} — kondycja: ${k.etykieta}`,
      };
    })(),
  ];

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <p className="eyebrow" style={{ marginBottom: 4 }}>Synteza · jedno spojrzenie</p>
      <p className="muted" style={{ fontSize: "0.9rem", marginBottom: 14, lineHeight: 1.55 }}>
        Sześć działów Twojego kosmogramu zebranych wokół <Term k="atmakaraka">atmakaraki</Term> —
        wskaźnika duszy. Kolor węzła to ton wyniku, a najechanie na nazwę działu (w kręgu albo na
        liście obok) pokaże, co on w ogóle znaczy. Emocjonalnie masz w sobie sporo żywiołu{" "}
        <strong style={{ color: "var(--sand)" }}>{zywiol}</strong> — Księżyc stoi w {RASI_LOC[chart.planets.moon.sign]},
        co robi Cię {ZYWIOL_OPIS[zywiol]}.
      </p>

      <p className="muted" style={{ fontSize: "0.76rem", marginBottom: 10 }}>
        Cztery kluczowe punkty mapy — pierścień pokazuje siłę godności w znaku (im więcej wypełnienia
        i zieleni, tym mocniej i gładziej ta pozycja działa).
      </p>
      <div style={{ display: "flex", gap: 18, marginBottom: 18, flexWrap: "wrap" }}>
        {donuty.map((d) => (
          <div key={d.etykieta} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Pierscien procent={d.procent} kolor={d.kolor} />
            <div>
              <p className="eyebrow" style={{ marginBottom: 2, fontSize: "0.68rem" }}>{d.etykieta}</p>
              <p style={{ fontSize: "0.92rem", color: "var(--sand)" }}>{d.znak}</p>
              <p className="muted" style={{ fontSize: "0.76rem" }}>{d.opis}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="synteza-uklad">
        <svg viewBox={`0 0 ${S} ${S}`} className="synteza-mandala" role="img" aria-label="Mandala syntezy kosmogramu — sześć działów">
          <defs>
            <filter id="synk-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <circle className="syn-orbita-zewn" cx={cx} cy={cy} r={R} stroke="rgba(127,208,216,0.18)" strokeWidth="1" fill="none" strokeDasharray="2 7" />
          <circle className="syn-orbita-wewn" cx={cx} cy={cy} r={R - 58} stroke="rgba(230,196,138,0.14)" strokeWidth="0.8" fill="none" />

          {wezlyZPoz.map(({ w, i, p }) => (
            <line key={`r${i}`} className="syn-promien" style={{ "--i": i } as React.CSSProperties}
              x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={w.kolor} strokeOpacity="0.22" strokeWidth="1" />
          ))}

          <g className={`syn-wezel-krag${aktywny === "centrum" ? " aktywny" : ""}`}
            onMouseEnter={() => setAktywny("centrum")} onMouseLeave={() => setAktywny(null)}>
            <title>Atmakaraka — {GLOSSARY.atmakaraka.text}</title>
            <circle className="syn-atmakaraka-glow" cx={cx} cy={cy} r={46} fill="none" stroke="#e6c48a" strokeWidth="1.4" />
            {/* sylwetka — prosty glif czlowieka (glowa + tulow), nie pelna mapa ciala; symbol atmakaraki na piersi */}
            <circle cx={cx} cy={cy - 20} r={9} fill="rgba(127,208,216,0.16)" stroke="#7fd0d8" strokeWidth="1.4" />
            <path d={`M ${cx - 16},${cy + 34} Q ${cx - 16},${cy - 7} ${cx},${cy - 7} Q ${cx + 16},${cy - 7} ${cx + 16},${cy + 34} Z`}
              fill="rgba(127,208,216,0.12)" stroke="#7fd0d8" strokeWidth="1.4" filter="url(#synk-glow)" />
            <text x={cx} y={cy + 14} textAnchor="middle" fill="#e6c48a" fontSize="22" filter="url(#synk-glow)">{GRAHAS[ak.planeta].symbol}</text>
          </g>
          <text x={cx} y={cy + 56} textAnchor="middle" fill="#93a6b3" fontSize="10.5" letterSpacing="0.18em">ATMAKARAKA</text>

          {wezlyZPoz.map(({ w, i, p }) => (
            <WezelKrag key={w.dzial} w={w} i={i} p={p} r={rW} cy={cy} aktywny={aktywny} setAktywny={setAktywny} />
          ))}
        </svg>

        <div className="synteza-lista">
          <div>
            <div className={`synteza-rzad synteza-rzad-centrum${aktywny === "centrum" ? " aktywny" : ""}`}
              style={{ ["--k" as string]: "#e6c48a" }}
              role="button" tabIndex={0} aria-expanded={rozwinieta === "centrum"}
              onMouseEnter={() => setAktywny("centrum")} onMouseLeave={() => setAktywny(null)}
              onClick={() => setRozwinieta((v) => (v === "centrum" ? null : "centrum"))}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setRozwinieta((v) => (v === "centrum" ? null : "centrum")); } }}>
              <span className="synteza-glif" style={{ color: "#e6c48a" }}>{GRAHAS[ak.planeta].symbol}</span>
              <div style={{ minWidth: 0 }}>
                <p className="synteza-wynik">
                  <Term k="atmakaraka" plain><span className="synteza-dzial">Atmakaraka</span></Term> —{" "}
                  {GRAHAS[ak.planeta].pl} ({ak.stopien.toFixed(1)}° w znaku)
                </p>
                <p className="synteza-dlaczego">{ak.znaczenie} — centrum, wokół którego układają się pozostałe działy.</p>
              </div>
            </div>
            {rozwinieta === "centrum" && (
              <p className="muted" style={{ margin: "6px 0 12px 38px", fontSize: "0.84rem", lineHeight: 1.55 }}>
                {GRAHAS[ak.planeta].pl} jako atmakaraka oznacza, że głównym tematem tego wcielenia jest{" "}
                {TEMAT_PLANETY[ak.planeta]} — to on w największym stopniu kształtuje Twoją drogę,
                niezależnie od tego, co pokazują pozostałe działy.
              </p>
            )}
          </div>
          {wezly.map((w) => (
            <div key={w.dzial}>
              <div className={`synteza-rzad${aktywny === w.dzial ? " aktywny" : ""}${w.zamkniety ? " zamkniety" : ""}`}
                style={{ ["--k" as string]: w.zamkniety ? "#4a5b68" : w.kolor }}
                role="button" tabIndex={0} aria-expanded={rozwinieta === w.dzial}
                onMouseEnter={() => setAktywny(w.dzial)} onMouseLeave={() => setAktywny(null)}
                onClick={() => setRozwinieta((v) => (v === w.dzial ? null : w.dzial))}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setRozwinieta((v) => (v === w.dzial ? null : w.dzial)); } }}>
                <span className="synteza-glif" style={{ color: w.zamkniety ? "#4a5b68" : w.kolor }}>{w.glif}</span>
                <div style={{ minWidth: 0 }}>
                  <p className="synteza-wynik">
                    <Term term={{ title: w.dzial, text: w.ogolnie }} plain>
                      <span className="synteza-dzial">{w.dzial}</span>
                    </Term> — {w.wynik}
                  </p>
                  {w.dlaczego && <p className="synteza-dlaczego">{w.dlaczego}</p>}
                </div>
              </div>
              {rozwinieta === w.dzial && (
                <p className="muted" style={{ margin: "6px 0 12px 38px", fontSize: "0.84rem", lineHeight: 1.55 }}>
                  {w.skrot}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        marginTop: 18, padding: "14px 18px", borderRadius: 10,
        background: "rgba(230,196,138,0.06)", border: "1px solid var(--line-gold)",
      }}>
        <p className="eyebrow" style={{ marginBottom: 6 }}>Synteza</p>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.65 }}>{synteza}</p>
      </div>
    </div>
  );
}
