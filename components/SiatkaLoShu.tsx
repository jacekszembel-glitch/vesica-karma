"use client";

import { useState } from "react";
import { VEDIC_PLANETS, type NumerologyResult } from "@/lib/astro/numerology";
import { ZNACZENIE_CYFRY } from "@/lib/astro/numerologia-tresc";

/**
 * SIATKA LO SHU — magiczny kwadrat 3×3 (4-9-2 / 3-5-7 / 8-1-6) wypełniony
 * cyframi daty urodzenia: każda cyfra stoi w swoim polu tyle razy, ile razy
 * pada w dacie, puste pola są przygaszone. Złoty styl działów: siatka z samych
 * wewnętrznych linii (bez ramki), pod nią opis wskazanego pola — najechanie
 * pokazuje, kliknięcie przypina (wzór map). Pod spodem klasyczne „strzałki”:
 * pełny rząd/kolumna/przekątna = siła, całkiem pusty = obszar do budowania.
 */

const UKLAD: number[][] = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];
const POLE = 84;
const BOK = POLE * 3;

function srodekPola(cyfra: number): { x: number; y: number } {
  for (let r = 0; r < 3; r++) {
    const c = UKLAD[r].indexOf(cyfra);
    if (c !== -1) return { x: c * POLE + POLE / 2, y: r * POLE + POLE / 2 };
  }
  return { x: BOK / 2, y: BOK / 2 };
}

interface Strzalka {
  id: string;
  cyfry: [number, number, number];
  nazwa: string;
  pelna: string;
  pusta: string;
}

const STRZALKI: Strzalka[] = [
  { id: "umysl", cyfry: [4, 9, 2], nazwa: "Płaszczyzna umysłu",
    pelna: "myślenie, pamięć i planowanie działają razem — łatwo układasz sprawy w głowie",
    pusta: "teoria przychodzi trudniej niż praktyka — uczysz się najlepiej przez działanie i notatki" },
  { id: "uczucia", cyfry: [3, 5, 7], nazwa: "Płaszczyzna uczuć",
    pelna: "bogate życie wewnętrzne i wyczucie nastrojów — swoich i cudzych",
    pusta: "uczucia trudno nazwać i wyrazić — warto dawać im czas, zamiast je odkładać" },
  { id: "praktyka", cyfry: [8, 1, 6], nazwa: "Płaszczyzna praktyczna",
    pelna: "sprawność w świecie materii — ręce, ciało i codzienne sprawy idą w parze",
    pusta: "sprawy praktyczne wymagają świadomego wysiłku — pomaga stały rytm dnia" },
  { id: "plan", cyfry: [4, 3, 8], nazwa: "Strzałka planowania",
    pelna: "naturalny organizator — porządek, plan i pamięć do szczegółów",
    pusta: "plany łatwo się rozmywają — pomaga zapisany cel i struktura z zewnątrz" },
  { id: "wola", cyfry: [9, 5, 1], nazwa: "Strzałka woli",
    pelna: "silna wola i wytrwałość w dążeniu do celu",
    pusta: "motywacja przychodzi falami — cel trzeba trzymać na widoku" },
  { id: "dzialanie", cyfry: [2, 7, 6], nazwa: "Strzałka działania",
    pelna: "myśli szybko zamieniają się w czyn",
    pusta: "łatwiej rozważać niż zaczynać — pomaga ruszanie od małych kroków" },
  { id: "determinacja", cyfry: [4, 5, 6], nazwa: "Strzałka determinacji",
    pelna: "doprowadzasz sprawy do końca, nawet pod wiatr",
    pusta: "łatwo się zniechęcić w połowie drogi — cierpliwość warto ćwiczyć jak mięsień" },
  { id: "wspolczucie", cyfry: [2, 5, 8], nazwa: "Strzałka współczucia",
    pelna: "empatia i łagodność — ludzie czują przy Tobie spokój",
    pusta: "cudze potrzeby łatwo przeoczyć — uważność na innych przychodzi z praktyką" },
];

export default function SiatkaLoShu({ numerology }: { numerology: NumerologyResult }) {
  const [najechane, setNajechane] = useState<number | null>(null);
  const [przypiete, setPrzypiete] = useState<number | null>(null);
  const [strzalka, setStrzalka] = useState<string | null>(null);
  const siatka = numerology.loShuGrid;
  const aktywne = najechane ?? przypiete;

  const pelne = STRZALKI.filter((s) => s.cyfry.every((c) => (siatka[c] ?? 0) > 0));
  const puste = STRZALKI.filter((s) => s.cyfry.every((c) => (siatka[c] ?? 0) === 0));
  const wskazana = STRZALKI.find((s) => s.id === strzalka);

  const opis = (cyfra: number) => {
    const ile = siatka[cyfra] ?? 0;
    const czestosc = ile === 0 ? "nie pada w dacie urodzenia" : ile === 1 ? "pada w dacie raz" : `pada w dacie ${ile} razy`;
    return (
      <>
        <strong>{cyfra} · {VEDIC_PLANETS[cyfra]}</strong> — {czestosc}. {ZNACZENIE_CYFRY[cyfra].charAt(0).toUpperCase() + ZNACZENIE_CYFRY[cyfra].slice(1)}
        {ile === 0 ? " — ten temat trzeba budować świadomie." : ile >= 3 ? " — tej energii jest dużo, czasem aż za dużo." : "."}
      </>
    );
  };

  return (
    <div className="loshu">
      <p className="muted loshu-wstep">
        Chiński magiczny kwadrat, w którym każda kolumna, rząd i przekątna sumują się do 15.
        Każda cyfra Twojej daty urodzenia trafia do swojego pola — tyle razy, ile razy pada w dacie.
        Najedź na pole, żeby zobaczyć, co znaczy; kliknij, żeby przypiąć opis.
      </p>

      <svg viewBox={`-6 -6 ${BOK + 12} ${BOK + 12}`} className="loshu-siatka" role="img"
        aria-label="Siatka Lo Shu z cyframi daty urodzenia">
        {/* wewnętrzne linie siatki — bez zewnętrznej ramki */}
        {[1, 2].map((i) => (
          <g key={i} stroke="var(--sand)" strokeOpacity="0.4" strokeWidth="1">
            <line x1={i * POLE} y1={4} x2={i * POLE} y2={BOK - 4} />
            <line x1={4} y1={i * POLE} x2={BOK - 4} y2={i * POLE} />
          </g>
        ))}

        {/* wskazana strzałka — złota linia przez trzy pola */}
        {wskazana && (() => {
          const a = srodekPola(wskazana.cyfry[0]), b = srodekPola(wskazana.cyfry[2]);
          return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--primary-soft)" strokeOpacity="0.55"
            strokeWidth="26" strokeLinecap="round" />;
        })()}

        {UKLAD.flatMap((rzad, r) => rzad.map((cyfra, c) => {
          const ile = siatka[cyfra] ?? 0;
          const zapis = ile ? String(cyfra).repeat(Math.min(ile, 4)) : String(cyfra);
          const rozmiar = ile <= 1 ? 30 : ile === 2 ? 26 : ile === 3 ? 21 : 17;
          const wybrane = aktywne === cyfra;
          return (
            <g key={cyfra} className="loshu-pole" tabIndex={0} role="button"
              aria-label={`Cyfra ${cyfra}: ${ile}× w dacie`}
              onMouseEnter={() => setNajechane(cyfra)} onMouseLeave={() => setNajechane(null)}
              onFocus={() => setNajechane(cyfra)} onBlur={() => setNajechane(null)}
              onClick={() => setPrzypiete((p) => (p === cyfra ? null : cyfra))}>
              <rect x={c * POLE + 3} y={r * POLE + 3} width={POLE - 6} height={POLE - 6} rx="10"
                fill={wybrane ? "rgba(230,196,138,0.14)" : "transparent"} style={{ transition: "fill 0.2s" }} />
              <text x={c * POLE + POLE / 2} y={r * POLE + POLE / 2 + rozmiar * 0.2} textAnchor="middle"
                fontFamily="var(--font-serif)" fontSize={rozmiar} fontWeight={700}
                fill="var(--sand)" opacity={ile ? 1 : 0.22}>{zapis}</text>
              <text x={c * POLE + POLE / 2} y={r * POLE + POLE - 11} textAnchor="middle"
                fontSize="9.5" letterSpacing="0.08em" fill="var(--sand)" opacity={ile ? 0.7 : 0.3}>
                {VEDIC_PLANETS[cyfra].toUpperCase()}
              </text>
            </g>
          );
        }))}
      </svg>

      <p className="loshu-opis" aria-live="polite">
        {aktywne !== null ? opis(aktywne) : <span className="muted">Wskaż pole siatki, żeby przeczytać jego opis.</span>}
      </p>

      <div className="loshu-strzalki">
        <div>
          <p className="eyebrow">Strzałki siły</p>
          {pelne.length ? pelne.map((s) => (
            <p key={s.id} className="loshu-strzalka" onMouseEnter={() => setStrzalka(s.id)} onMouseLeave={() => setStrzalka(null)}>
              <strong>{s.nazwa}</strong> <span className="muted">({s.cyfry.join("-")})</span> — {s.pelna}.
            </p>
          )) : <p className="muted loshu-strzalka">Żaden rząd, kolumna ani przekątna nie jest pełny — siła rozkłada się po pojedynczych cyfrach.</p>}
        </div>
        <div>
          <p className="eyebrow">Puste strzałki</p>
          {puste.length ? puste.map((s) => (
            <p key={s.id} className="loshu-strzalka" onMouseEnter={() => setStrzalka(s.id)} onMouseLeave={() => setStrzalka(null)}>
              <strong>{s.nazwa}</strong> <span className="muted">({s.cyfry.join("-")})</span> — {s.pusta}.
            </p>
          )) : <p className="muted loshu-strzalka">Żadna linia siatki nie jest całkiem pusta.</p>}
        </div>
      </div>
    </div>
  );
}
