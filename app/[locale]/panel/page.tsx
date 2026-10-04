"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import KoloKarmyMini from "@/components/KoloKarmyMini";
import { useZwiazkiUkonczone } from "@/components/usePostepKarmy";
import ZapisanyOdczyt from "@/components/ZapisanyOdczyt";
import { wczytajSekcje, type ZapisSekcji } from "@/lib/zapisSekcji";
import type { KragKarmy } from "@/lib/koloKarmyGeometria";
import { ukonczoneSystemyKarmy, type SystemKarmy } from "@/lib/koloKarmyGeometria";

/**
 * Twoja Karma (dawniej „Mój panel”) — status trzech systemów (Chiromancja/Astrologia/Numerologia)
 * jako kafelki, wzorowane na mockupach. Faza 2 reskinu: prawdziwe śledzenie
 * (localStorage, patrz koloKarmyGeometria.ts) zamiast danych demo z Fazy 1.
 * Gdy komplet — hasło pod kafelkami staje się linkiem do /karma (synteza).
 */
const SYSTEMY: { id: SystemKarmy; label: string; href: string; opis: string }[] = [
  { id: "hiromancja", label: "Chiromancja", href: "/hiromancja", opis: "ciało — zapis w dłoniach" },
  { id: "astrologia", label: "Astrologia", href: "/kosmogram", opis: "czas i miejsce urodzenia" },
  { id: "numerologia", label: "Numerologia", href: "/numerologia", opis: "data urodzenia i imię" },
];

/** Astrologia nie ma już icon-astrologia.png (kompas wycięty, zastąpiony
 *  gwiazdami+księżycem w KoloKarmy/KoloKarmyMini) — ten sam motyw, tylko
 *  skalowany do kwadratowego kafelka. */
function IkonaAstrologiiKafelek({ gotowe }: { gotowe: boolean }) {
  return (
    <svg viewBox="0 0 46 46" width="62" height="62" aria-hidden="true"
      style={{ color: gotowe ? "var(--sand)" : "var(--taupe)" }}>
      <mask id="kafelek-ks-mask">
        <rect x="0" y="0" width="46" height="46" fill="black" />
        <circle cx="23" cy="23" r="10" fill="white" />
        <circle cx="27" cy="19" r="8.5" fill="black" />
      </mask>
      <circle cx="23" cy="23" r="10" fill="currentColor" mask="url(#kafelek-ks-mask)" />
      {[[36, 12, 3], [8, 30, 2.6], [34, 34, 2]].map(([x, y, s], i) => (
        <path key={i} fill="currentColor"
          d={`M ${x} ${y - s} L ${x + s * 0.28} ${y - s * 0.28} L ${x + s} ${y} L ${x + s * 0.28} ${y + s * 0.28} L ${x} ${y + s} L ${x - s * 0.28} ${y + s * 0.28} L ${x - s} ${y} L ${x - s * 0.28} ${y - s * 0.28} Z`} />
      ))}
    </svg>
  );
}

/** Chiromancja — para dużych dłoni (dlon-*-duza.png, te same co na stronie Chiromancji),
 *  ułożona po skosie jak na Kole Karmy; zachowane proporcje (wcześniejsza ikona 150×170
 *  była ściskana do kwadratu i rozmyta). */
function IkonaDloniKafelek({ gotowe }: { gotowe: boolean }) {
  const kolor = gotowe ? "" : "-taupe";
  const styl = { position: "absolute" as const, width: 36, height: "auto" };
  return (
    <span aria-hidden="true" style={{ position: "relative", width: 64, height: 66, display: "block" }}>
      <img src={`/brand/dlon-lewa-duza${kolor}.png`} alt="" style={{ ...styl, left: 0, top: 0 }} />
      <img src={`/brand/dlon-prawa-duza${kolor}.png`} alt="" style={{ ...styl, right: 0, bottom: 0 }} />
    </span>
  );
}

/** Numerologia — wektorowe cyfry w kroju strony (Outfit), układ jak na Kole Karmy:
 *  duża 7 w środku, wokół mniejsze — ostre w każdej wielkości. */
function IkonaLiczbKafelek({ gotowe }: { gotowe: boolean }) {
  const cyfry: [string, number, number, number][] = [
    ["6", 30, 10, 9], ["4", 39, 15, 13], ["1", 23, 19, 9], ["8", 42, 26, 9],
    ["3", 9, 35, 14], ["7", 24, 41, 27], ["5", 38, 40, 16], ["9", 4, 52, 14], ["2", 19, 52, 9],
  ];
  return (
    <svg width="66" height="68" viewBox="0 0 54 56" aria-hidden="true"
      style={{ color: gotowe ? "var(--sand)" : "var(--taupe)", position: "relative" }}>
      {cyfry.map(([c, x, y, rozmiar]) => (
        <text key={c} x={x} y={y} fontSize={rozmiar} fontWeight={700} fill="currentColor"
          fontFamily="var(--font-sans)">{c}</text>
      ))}
    </svg>
  );
}

/** Kafelek systemu w stylu skrótu z Astrologii (PierscienZnaku + .skrot-hero-*):
 *  pierścień 108 px o grubości 9 px z ikoną w środku, nazwa, status i kreska z opisem —
 *  kolory bez zmian: złoty pierścień i ikona po ukończeniu, taupe przed. */
function Kafelek({ id, label, href, gotowe, opis }: { id: SystemKarmy; label: string; href: string; gotowe: boolean; opis: string }) {
  const size = 108, stroke = 9, r = size / 2 - stroke / 2;
  return (
    <Link href={href} className="skrot-hero-item" style={{ textDecoration: "none" }}>
      <span style={{ position: "relative", width: size, height: size, display: "grid", placeItems: "center" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={gotowe ? "var(--gold)" : "var(--taupe)"} strokeWidth={stroke} style={{ transition: "stroke 0.3s" }} />
        </svg>
        {id === "astrologia" ? <IkonaAstrologiiKafelek gotowe={gotowe} />
          : id === "hiromancja" ? <IkonaDloniKafelek gotowe={gotowe} />
          : <IkonaLiczbKafelek gotowe={gotowe} />}
      </span>
      <p className="skrot-hero-znak" style={{ color: "var(--text)" }}>{label}</p>
      <p className="eyebrow skrot-hero-rola" style={{ color: gotowe ? "var(--gold)" : "var(--muted)", fontSize: "0.68rem" }}>
        {gotowe ? "Ukończone" : "Nie ukończone"}
      </p>
      <div className="skrot-hero-podkreslenie" />
      <p className="muted skrot-hero-detal">{opis}</p>
    </Link>
  );
}

/** Strzałka od podpowiedzi do pierwszego nieukończonego kafelka — narysowana
 *  pod pozycję lewego (pierwszego) kafelka w rzędzie, tak jak w referencji.
 *  Faza 1: układ na sztywno pod demo-stan (Chiromancja zawsze pierwsza). */
function StrzalkaDoKafelka() {
  return (
    <svg width="70" height="110" viewBox="0 0 70 110" aria-hidden="true"
      style={{ position: "absolute", left: -10, top: -96, overflow: "visible" }}>
      <defs>
        <marker id="grot" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--sand)" />
        </marker>
      </defs>
      <path d="M 58 105 C 15 105, 8 55, 28 8" fill="none" stroke="var(--sand)" strokeWidth="2" markerEnd="url(#grot)" />
    </svg>
  );
}

export default function Page() {
  // localStorage dostępny dopiero po zamontowaniu — start z pustym zbiorem,
  // zeby SSR i pierwszy render klienta sie zgadzaly, potem hydratacja.
  const [ukonczone, setUkonczone] = useState<Set<SystemKarmy>>(new Set());
  // odczyty ukończonych sekcji (zapisane przy zapaleniu kręgu) — do podglądu w każdej chwili
  const [zapisy, setZapisy] = useState<ZapisSekcji[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydratacja z localStorage po zamontowaniu
    setUkonczone(ukonczoneSystemyKarmy());
    setZapisy((["hiromancja", "astrologia", "numerologia", "zwiazki"] as KragKarmy[])
      .map((id) => wczytajSekcje(id)).filter((z): z is ZapisSekcji => !!z));
  }, []);

  const zwiazki = useZwiazkiUkonczone();

  const brakujace = SYSTEMY.filter((s) => !ukonczone.has(s.id));
  const strzalkaPasuje = brakujace.length > 0 && brakujace[0].id === SYSTEMY[0].id;
  const komplet = brakujace.length === 0;

  return (
    <div className="container section" style={{ maxWidth: 640, textAlign: "center" }}>
      <KoloKarmyMini ukonczone={ukonczone} zwiazki={zwiazki} />

      <h1 style={{ margin: "28px 0 18px" }}>Twoja Karma</h1>
      <div className="ornament" style={{ marginBottom: 32 }} />

      <div className="skrot-hero-rzad">
        {SYSTEMY.map((s) => (
          <Kafelek key={s.id} {...s} gotowe={ukonczone.has(s.id)} />
        ))}
      </div>

      <div className="ornament" style={{ margin: "36px 0 20px" }} />

      <div style={{ position: "relative", display: "inline-block" }}>
        {strzalkaPasuje && <StrzalkaDoKafelka />}
        {!komplet ? (
          <p style={{ color: "var(--sand)", fontFamily: "var(--font-serif)", fontSize: "1.2rem" }}>
            Już prawie gotowe! Jeszcze tylko {brakujace.map((s) => s.label).join(" i ")}{" "}
            i zaczynamy analizę!
          </p>
        ) : (
          <Link href="/karma" style={{
            color: "var(--gold)", fontFamily: "var(--font-serif)", fontSize: "1.2rem",
            textDecoration: "none", borderBottom: "1px solid var(--gold)", paddingBottom: 2,
          }}>
            Wszystkie trzy systemy gotowe — zobacz pełną syntezę Twojego Koła Karmy →
          </Link>
        )}
      </div>

      {zapisy.length > 0 && (
        <>
          <div className="ornament" style={{ margin: "36px 0 20px" }} />
          <p className="eyebrow" style={{ marginBottom: 14 }}>Twoje zapisane odczyty</p>
          <div className="panel-odczyty">
            {zapisy.map((z) => (
              <details key={z.podpis + z.zapisano} className="panel-odczyt">
                <summary>{z.podpis}</summary>
                <ZapisanyOdczyt zapis={z} bezPodpisu />
              </details>
            ))}
          </div>
        </>
      )}

      <div className="ornament" style={{ margin: "36px 0 20px" }} />

      <div style={{ textAlign: "left" }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>Vesica Karma</p>
        <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.75 }}>
          Jest zestawieniem trzech systemów, które każdy w inny sposób opisuje każdego z nas
          od samego urodzenia. Każdy z nas, aby mógł przyjść na ten świat, musiał spełnić trzy
          warunki: miejsce, czas oraz ciało. Te trzy bezwzględne warunki mają swoje odpowiedniki
          w astrologii, numerologii i chiromancji — pierwsza metoda opisuje za pomocą miejsca,
          daty i godziny, druga metoda używa daty oraz imienia i nazwiska, trzecia zaś korzysta
          z samego ciała, na którym zapisana jest — tak samo jak w gwiazdach — nasza karma.
          Musimy ją tylko odnaleźć i korzystać z jej dobrodziejstw.
        </p>
        <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.75, marginTop: 16 }}>
          Cały system został zaprojektowany na znaku Vesica Piscis — potrójmy wymiar istnienia:
          symbolizuje spójność trzech przenikających się stref — ciała, umysłu i duszy; czasu
          (przeszłości, teraźniejszości i przyszłości).
        </p>
      </div>
    </div>
  );
}
