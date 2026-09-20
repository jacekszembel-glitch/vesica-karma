"use client";

import { useState } from "react";
import Link from "next/link";
import type { NumerologyResult } from "@/lib/astro/numerology";
import { VEDIC_PLANETS } from "@/lib/astro/numerology";
import { ZNACZENIE_CYFRY, cyfraDocelowa } from "@/lib/astro/numerologia-tresc";
import Term from "@/components/Term";

/**
 * SIATKA LICZB — Lo Shu jako jeden diagram zamiast rzędu kafli.
 *
 * Chiński magiczny kwadrat 3×3 zlicza WSZYSTKIE cyfry z daty urodzenia
 * (klasyczny układ 4-9-2 / 3-5-7 / 8-1-6). Pięć wyliczonych liczb
 * numerologii (droga życia, urodzenia, przeznaczenia, rok osobisty,
 * ekspresja) NIE jest osobną listą — każda dochodzi do siatki własną
 * linią, w miejscu odpowiadającym jej cyfrze po redukcji. Jedna liczba
 * wyjątkowa (11, 22…) trafia do tej samej komórki co jej suma cyfr.
 * Intensywność wypełnienia komórki = ile razy ta cyfra pada w dacie.
 *
 * Kolumna z prawej tłumaczy pięć liczb od razu, tekstem — diagram sam
 * w sobie (kolory, linie) nie jest czytelny dla kogoś, kto pierwszy raz
 * widzi numerologię; dymek na komórce dopowiada tylko szczegół dla tych,
 * którzy najadą myszką.
 */

const LAYOUT: number[][] = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];

interface Pin {
  klucz: string;
  etykieta: string;
  termin: string;
  wartosc: number;
  krotko: string;
}

const W = 380, GRID_TOP = 16, CELL = 62, GAP = 8;
const GRID_W = 3 * CELL + 2 * GAP;
const GRID_LEFT = (W - GRID_W) / 2;
const PIN_Y = 274, DOT_Y = 250, H = 322;

function cellCenter(n: number): { x: number; y: number } {
  for (let r = 0; r < 3; r++) {
    const c = LAYOUT[r].indexOf(n);
    if (c !== -1) {
      return {
        x: GRID_LEFT + c * (CELL + GAP) + CELL / 2,
        y: GRID_TOP + r * (CELL + GAP) + CELL / 2,
      };
    }
  }
  return { x: W / 2, y: GRID_TOP + GRID_W / 2 };
}

/** Wypełnienie komórki — jeden odcień złota, jaśniej/ciemniej wg liczby wystąpień (skala sekwencyjna). */
function wypelnienie(count: number): string {
  const opacity = [0, 0.1, 0.2, 0.32, 0.46][Math.min(count, 4)];
  return `rgba(230,196,138,${opacity})`;
}

/**
 * SYNTEZA — trzy klasyczne techniki numerologii łączące pięć liczb w jeden wniosek:
 * (1) powtarzająca się cyfra wśród pięciu liczb = wzmocniony, dominujący temat,
 * (2) zestawienie drogi życia z ekspresją = czy wnętrze i sposób bycia są spójne,
 * (3) zestawienie roku osobistego z drogą życia = czy bieżący rok wspiera główny kierunek.
 * Do tego flaga liczby mistrzowskiej, jeśli któraś z pięciu nią jest.
 */
function zbudujSyntezę(piny: Pin[], numerology: NumerologyResult): string[] {
  const zdania: string[] = [];

  const grupy = new Map<number, string[]>();
  for (const p of piny) {
    const c = cyfraDocelowa(p.wartosc);
    grupy.set(c, [...(grupy.get(c) ?? []), p.etykieta]);
  }
  const [dominCyfra, dominListy] = [...grupy.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  if (dominListy.length >= 2) {
    zdania.push(
      `Cyfra ${dominCyfra} powtarza się aż ${dominListy.length} razy (${dominListy.join(", ").toLowerCase()}) — ` +
      `to najsilniejszy, wzmocniony temat: ${ZNACZENIE_CYFRY[dominCyfra]}.`,
    );
  } else {
    zdania.push("Wszystkie pięć liczb pokazuje różne cyfry — zestaw zróżnicowanych tematów, bez jednego dominującego motywu.");
  }

  const lp = cyfraDocelowa(numerology.lifePath);
  if (numerology.expression) {
    const ex = cyfraDocelowa(numerology.expression);
    zdania.push(
      lp === ex
        ? `Droga życia i ekspresja to ta sama liczba (${lp}) — to, kim jesteś w środku, i to, jak się pokazujesz na zewnątrz, są ze sobą spójne.`
        : `Droga życia (${lp}) różni się od ekspresji (${ex}) — naturalny sposób bycia to nie to samo, co sposób wyrażania siebie; te dwie strony trzeba świadomie łączyć.`,
    );
  }

  const py = cyfraDocelowa(numerology.personalYear);
  zdania.push(
    py === lp
      ? `Obecny rok osobisty (${py}) pokrywa się z drogą życia — to czas, który naturalnie wzmacnia Twój główny kierunek.`
      : `Rok osobisty (${py}) wnosi inny akcent niż droga życia (${lp}) — to okres stawiający przed Tobą inny temat niż zwykle.`,
  );

  const mistrzowska = piny.find((p) => [11, 22, 33].includes(p.wartosc));
  if (mistrzowska) {
    zdania.push(
      `${mistrzowska.etykieta} to liczba mistrzowska (${mistrzowska.wartosc}) — niesie dodatkowy potencjał ` +
      `i wyzwanie, większe niż samo ${cyfraDocelowa(mistrzowska.wartosc)}.`,
    );
  }

  return zdania;
}

export default function SiatkaLiczb({ numerology }: { numerology: NumerologyResult }) {
  const [aktywny, setAktywny] = useState<string | null>(null);

  const piny: Pin[] = [
    {
      klucz: "lifePath", etykieta: "Droga życia", termin: "drogazycia", wartosc: numerology.lifePath,
      krotko: "kierunek całego życia",
    },
    {
      klucz: "birthday", etykieta: "Liczba urodzenia", termin: "liczbaurodzenia", wartosc: numerology.birthday,
      krotko: "wrodzony temperament",
    },
    {
      klucz: "destiny", etykieta: "Przeznaczenie", termin: "liczbaprzeznaczenia", wartosc: numerology.destiny,
      krotko: "szersze okoliczności losu",
    },
    {
      klucz: "personalYear", etykieta: "Rok osobisty", termin: "rokosobisty", wartosc: numerology.personalYear,
      krotko: "klimat tego roku",
    },
    ...(numerology.expression
      ? [{
        klucz: "expression", etykieta: "Ekspresja", termin: "numekspresja", wartosc: numerology.expression,
        krotko: "naturalne talenty",
      }]
      : []),
  ];
  const n = piny.length;
  const margines = 44;
  const krok = n > 1 ? (W - 2 * margines) / (n - 1) : 0;
  const synteza = zbudujSyntezę(piny, numerology);

  return (
    <div className="card">
      <p className="eyebrow" style={{ marginBottom: 4 }}>Poziom 3 · Liczby</p>
      <p className="muted" style={{ fontSize: "0.84rem", lineHeight: 1.55, marginBottom: 18 }}>
        <Term k="loshu">Siatka Lo Shu</Term> zlicza wszystkie cyfry Twojej daty urodzenia; pięć
        wyliczonych liczb numerologii dochodzi do niej własną linią, w miejscu swojej cyfry po redukcji.
      </p>

      <div className="profil-uklad" style={{ alignItems: "center" }}>
        {/* ── lewo: diagram ── */}
        <div style={{ position: "relative" }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }}
            role="img" aria-label="Siatka Lo Shu z pięcioma liczbami numerologii połączonymi liniami">
            <defs>
              <filter id="sl-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="2.4" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* linie od pinów do ich komórki — pod spodem, żeby siatka i piny leżały na wierzchu */}
            {piny.map((p, i) => {
              const px = margines + i * krok;
              const target = cellCenter(cyfraDocelowa(p.wartosc));
              const midY = (DOT_Y + target.y) / 2;
              const podswietlona = aktywny === `pin-${p.klucz}`;
              return (
                <path key={`line-${p.klucz}`}
                  d={`M ${px},${DOT_Y} Q ${(px + target.x) / 2},${midY} ${target.x},${target.y}`}
                  fill="none" stroke="rgba(127,208,216,0.32)" strokeWidth={podswietlona ? 2 : 1}
                  opacity={podswietlona ? 1 : 0.7}
                  style={{ transition: "stroke-width 0.2s, opacity 0.2s" }} />
              );
            })}

            {/* siatka 3×3 */}
            {LAYOUT.map((row, r) =>
              row.map((cyfra, c) => {
                const count = numerology.loShuGrid[cyfra] ?? 0;
                const x = GRID_LEFT + c * (CELL + GAP);
                const y = GRID_TOP + r * (CELL + GAP);
                const podswietlona = aktywny === `cell-${cyfra}` ||
                  piny.some((p) => aktywny === `pin-${p.klucz}` && cyfraDocelowa(p.wartosc) === cyfra);
                const fontSize = count <= 1 ? 22 : count === 2 ? 17 : count === 3 ? 13 : 11;
                return (
                  <g key={cyfra}
                    onMouseEnter={() => setAktywny(`cell-${cyfra}`)}
                    onMouseLeave={() => setAktywny(null)}
                    style={{ cursor: "default" }}>
                    <rect x={x} y={y} width={CELL} height={CELL} rx="10"
                      fill={wypelnienie(count)}
                      stroke={podswietlona ? "#7fd0d8" : count ? "rgba(230,196,138,0.55)" : "rgba(127,208,216,0.3)"}
                      strokeWidth={podswietlona ? 1.8 : 1.2}
                      style={{ transition: "stroke 0.2s" }} />
                    <text x={x + CELL / 2} y={y + CELL / 2 + fontSize * 0.34} textAnchor="middle"
                      fontFamily="var(--font-serif)" fontSize={fontSize}
                      fill={count ? "var(--sand)" : "rgba(147,166,179,0.45)"}
                      filter={count ? "url(#sl-glow)" : undefined}>
                      {(count ? String(cyfra).repeat(Math.min(count, 4)) : cyfra)}
                    </text>
                  </g>
                );
              }),
            )}

            {/* piny z liczbami numerologii */}
            {piny.map((p, i) => {
              const px = margines + i * krok;
              const podswietlona = aktywny === `pin-${p.klucz}`;
              return (
                <g key={p.klucz}
                  onMouseEnter={() => setAktywny(`pin-${p.klucz}`)}
                  onMouseLeave={() => setAktywny(null)}
                  style={{ cursor: "default" }}>
                  <circle cx={px} cy={DOT_Y} r={podswietlona ? 4.2 : 3.2} fill="#7fd0d8"
                    style={{ transition: "r 0.2s" }} />
                  <text x={px} y={PIN_Y} textAnchor="middle" fontFamily="var(--font-serif)"
                    fontSize="1.85rem" fill={podswietlona ? "#f2d9a8" : "var(--primary-soft)"}
                    style={{ transition: "fill 0.2s" }}>
                    {p.wartosc}
                  </text>
                  <text x={px} y={PIN_Y + 19} textAnchor="middle" fontSize="9"
                    letterSpacing="0.04em" fill="var(--muted)">
                    {p.etykieta.toUpperCase().split(" ").map((slowo, li) => (
                      <tspan key={li} x={px} dy={li === 0 ? 0 : 11}>{slowo}</tspan>
                    ))}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* dymek z opisem najechanej komórki */}
          {aktywny?.startsWith("cell-") && (() => {
            const cyfra = Number(aktywny.slice("cell-".length));
            const count = numerology.loShuGrid[cyfra] ?? 0;
            const c = cellCenter(cyfra);
            return (
              <div style={{
                position: "absolute", left: `${(c.x / W) * 100}%`, top: `${(c.y / H) * 100}%`,
                transform: "translate(-50%, calc(-100% - 14px))", zIndex: 5, pointerEvents: "none",
              }}>
                <div style={{
                  background: "rgba(16, 34, 49, 0.98)", border: "1px solid var(--line)",
                  borderRadius: 10, padding: "8px 12px", width: 220,
                  boxShadow: "0 10px 26px rgba(0,0,0,0.5)",
                  animation: "fadeUp 0.15s var(--ease-out) both",
                  fontSize: "0.82rem", color: "#e8eef2", lineHeight: 1.5,
                }}>
                  cyfra <strong>{cyfra}</strong> — {count === 0 ? "brak w dacie" : `${count}× w dacie`}
                  {" · "}{VEDIC_PLANETS[cyfra]}
                  <br />
                  <span className="muted">{ZNACZENIE_CYFRY[cyfra]}.</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── prawo: co znaczy każda liczba, zawsze widoczne, bez potrzeby najeżdżania ── */}
        <div>
          <p className="eyebrow" style={{ marginBottom: 10 }}>Co znaczą te liczby</p>
          <div style={{ display: "grid", gap: 2, fontSize: "0.88rem", lineHeight: 1.5 }}>
            {piny.map((p) => {
              const znaczenieCyfry = ZNACZENIE_CYFRY[p.wartosc] ?? ZNACZENIE_CYFRY[cyfraDocelowa(p.wartosc)];
              return (
                <p key={p.klucz}
                  style={{
                    margin: 0, padding: "5px 10px", borderRadius: 8,
                    background: aktywny === `pin-${p.klucz}` ? "rgba(127,208,216,0.08)" : "transparent",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={() => setAktywny(`pin-${p.klucz}`)}
                  onMouseLeave={() => setAktywny(null)}>
                  <Term k={p.termin}>{p.etykieta}</Term>{" "}
                  <strong style={{ color: "var(--primary-soft)", fontFamily: "var(--font-serif)", fontSize: "1.1rem" }}>
                    {p.wartosc}
                  </strong>
                  {" — "}
                  <span className="muted">
                    {znaczenieCyfry ?? p.krotko}
                    {znaczenieCyfry && ` (${p.krotko})`}.
                  </span>
                </p>
              );
            })}
          </div>

          <p className="muted" style={{ marginTop: 12, fontSize: "0.85rem" }}>
            planeta władająca: <strong>{numerology.rulingPlanet}</strong> ·
            pełny profil w{" "}
            <Link href="/numerologia" style={{ color: "var(--teal-soft)" }}>kalkulatorze numerologii</Link>
          </p>
        </div>
      </div>

      {/* ── synteza: pod całym układem, na pełną szerokość ── */}
      <div style={{
        marginTop: 18, padding: "14px 18px", borderRadius: 10,
        background: "rgba(230,196,138,0.06)", border: "1px solid var(--line-gold)",
      }}>
        <p className="eyebrow" style={{ marginBottom: 6 }}>Synteza</p>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.65 }}>
          {synteza.map((zdanie, i) => <span key={i}>{zdanie}{" "}</span>)}
        </p>
      </div>
    </div>
  );
}
