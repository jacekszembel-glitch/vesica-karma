"use client";

import { useMemo, useState } from "react";
import type { VedicChart } from "@/lib/astro/chart";
import { GRAHAS, PLANET_ORDER, type PlanetId } from "@/lib/astro/constants";
import { ocenaWladcy, znakCzynnika } from "@/lib/astro/sila";
import { PREDYSPOZYCJA_OPIS, MOZLIWE_ZAWODY, zastrzezenieGodnosci } from "@/lib/astro/domInterpretacja";
import { wykryteJogiPosortowane } from "@/lib/astro/yogas";
import Term from "@/components/Term";
import { percentylSily, TABELA_PREDYSPOZYCJE } from "@/lib/astro/percentyleDomen";

/**
 * RANKING GRAH — osobny punkt między Karaki Czarowe a Jogi: nie „co masz
 * w mapie" (to już pokazuje tabela planet), tylko „co Ci naturalnie
 * wychodzi najłatwiej wg samego horoskopu wedyjskiego" — bez numerologii
 * (na /kosmogram jej nie liczymy; wersja łącząca astrologię z numerologią
 * to osobny komponent Predyspozycje.tsx na /sciezka).
 *
 * Ranking dziewięciu grah wg TYCH SAMYCH wyliczeń oceny, co reszta serwisu
 * (sila.ts) — długość paska to PERCENTYL siły/wyrazistości działania tej
 * planety (0–100, patrz percentyleDomen.ts — ta sama, prawdziwie stała
 * skala u każdego, bez wyjątków), kolor to ton (gładko / z tarciem / różnie).
 */

const TON_KOLOR: Record<string, string> = {
  "wspierający": "#6fbf9f",
  "mieszany": "#b9c7d1",
  "wymagający": "#5b9bd5",
};

const PREDYSPOZYCJA: Record<PlanetId, string> = {
  sun: "przywództwo i autorytet",
  moon: "empatia i intuicja",
  mars: "odwaga i zdecydowane działanie",
  mercury: "komunikacja i analiza",
  jupiter: "nauczanie, strategia, szeroki ogląd",
  venus: "estetyka, dyplomacja, relacje",
  saturn: "dyscyplina, wytrwałość, porządek",
  rahu: "innowacja, ambicja, wchodzenie w nieznane",
  ketu: "introspekcja, uważność, puszczanie",
};

/** Jeden czynnik pokolorowany wg znaku (zielony = ciągnie w górę, czerwony = w dół) — bez tego np. „w znaku wroga" ginie wśród samych plusów. */
function Czynnik({ tekst }: { tekst: string }) {
  const plus = znakCzynnika(tekst) === 1;
  return <span style={{ color: plus ? "#6fbf9f" : "#e66767" }}>{plus ? "+" : "−"} {tekst}</span>;
}

/** Dymek z pełnym wyjaśnieniem — ten sam styl co w Profilu Duszy i Siatce Liczb. */
function Dymek({ opis }: { opis: string }) {
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
      zIndex: 8, pointerEvents: "none",
    }}>
      <div style={{
        background: "rgba(16, 34, 49, 0.98)", border: "1px solid var(--line)",
        borderRadius: 10, padding: "9px 13px",
        boxShadow: "0 10px 26px rgba(0,0,0,0.5)",
        animation: "fadeUp 0.15s var(--ease-out) both",
        fontSize: "0.82rem", color: "#e8eef2", lineHeight: 1.55,
      }}>
        {opis}
      </div>
    </div>
  );
}

export default function RankingGrah({ chart }: { chart: VedicChart }) {
  const [rozwinieta, setRozwinieta] = useState<PlanetId | null>(null);
  const [najechana, setNajechana] = useState<string | null>(null);

  // wszystkie wykryte jogi (nie tylko Dhana) — uzytkownik chcial, zeby wynik
  // jak najwierniej odzwierciedlal caly kosmogram, wiec ranking sily bierze
  // pod uwage tez to, co appka juz wykrywa w Talentach/Jogach
  const jogi = useMemo(() => wykryteJogiPosortowane(chart), [chart]);
  const ranking = useMemo(
    () => PLANET_ORDER.map((id) => {
      const ocena = ocenaWladcy(chart, id, jogi);
      return { id, ocena, percentyl: percentylSily(ocena.punkty, TABELA_PREDYSPOZYCJE) };
    }).sort((a, b) => b.ocena.punkty - a.ocena.punkty),
    [chart, jogi],
  );
  const top3 = ranking.slice(0, 3);

  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: 6 }}>Predyspozycje</p>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 18, lineHeight: 1.55 }}>
        Ranking dziewięciu <Term k="graha">grah</Term> wg tych samych wyliczeń oceny, co reszta
        mapy (godność, władztwo domów, aspekty). Pasek koduje dwie osobne rzeczy naraz:
        <strong> długość</strong> to percentyl siły tej planety — ile procent z 20 000 sprawdzonych
        map ma tę predyspozycję słabiej zaznaczoną niż Ty (ta sama skala u każdego, więc wyniki
        są realnie porównywalne między osobami) — <strong>kolor</strong> to jak łatwo ta obecność
        się wyraża. Długi niebieski pasek (np. Saturn) to więc nie „słaba, trudna cecha” — to
        bardzo silna, wyraźna predyspozycja (wysoki percentyl), która wymaga po prostu więcej
        wysiłku niż te na zielono. Liczba obok paska: 50% to przeciętna siła, 90% to mocniej
        zaznaczone niż u 9 na 10 osób. Kliknij planetę, żeby zobaczyć pełne uzasadnienie i możliwe
        kierunki zawodowe — ta sama cecha (np. odwaga Marsa) wyraża się inaczej u żołnierza, a inaczej
        u rzeźbiarza czy tancerza, więc traktuj to jako punkt wyjścia do przemyślenia, nie gotową odpowiedź.
      </p>

      {/* trzy czołowe predyspozycje — wyróżnione, zanim zejdzie się do pełnego rankingu */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: 12, marginBottom: 24,
      }}>
        {top3.map((d, i) => {
          const g = GRAHAS[d.id];
          const zastrzezenie = zastrzezenieGodnosci(chart.planets[d.id].dignity, g.pl);
          return (
            <div key={d.id} style={{
              border: `1px solid ${TON_KOLOR[d.ocena.ton]}66`, borderRadius: 12,
              padding: "14px 16px", background: "rgba(255,255,255,0.02)",
            }}>
              <p className="eyebrow" style={{ marginBottom: 6, color: TON_KOLOR[d.ocena.ton] }}>
                #{i + 1} predyspozycja
              </p>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", lineHeight: 1.4 }}>
                <span style={{ color: g.color, fontSize: "1.2rem" }}>{g.symbol}</span> {PREDYSPOZYCJA[d.id]}
              </p>
              <p className="muted" style={{ fontSize: "0.8rem", marginTop: 6, lineHeight: 1.45 }}>
                {g.pl} — <Czynnik tekst={d.ocena.czynniki[0]} />
              </p>
              <p className="muted" style={{ fontSize: "0.76rem", marginTop: 8, lineHeight: 1.45 }}>
                <span style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.66rem" }}>
                  Możliwe kierunki zawodowe:
                </span>{" "}
                {MOZLIWE_ZAWODY[d.id]}
              </p>
              {zastrzezenie && (
                <p style={{ fontSize: "0.76rem", marginTop: 8, lineHeight: 1.4, color: "#e6a05a" }}>
                  {zastrzezenie}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* legenda kolorów — bez niej znaczenie barwy paska trzeba zgadywać */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center", margin: "0 0 14px 8px" }}>
        {([
          ["wspierający", "działa gładko"],
          ["mieszany", "zależnie od sytuacji"],
          ["wymagający", "działa z tarciem"],
        ] as const).map(([ton, opis]) => (
          <span key={ton} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.78rem" }}>
            <span style={{
              width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
              background: TON_KOLOR[ton], display: "inline-block",
            }} />
            <span className="muted">{ton} — {opis}</span>
          </span>
        ))}
      </div>

      {/* pełny ranking — słupki, rozwijane uzasadnienie po kliknięciu */}
      <div style={{ display: "grid", gap: 4 }}>
        {ranking.map((d) => {
          const g = GRAHAS[d.id];
          const szerokosc = Math.max(6, d.percentyl);
          const rozw = rozwinieta === d.id;
          const najechanaTeraz = najechana === d.id;
          return (
            <div key={d.id} style={{ position: "relative" }}>
              <div
                role="button" tabIndex={0} aria-expanded={rozw}
                onClick={() => setRozwinieta(rozw ? null : d.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setRozwinieta(rozw ? null : d.id); } }}
                onMouseEnter={() => setNajechana(d.id)}
                onMouseLeave={() => setNajechana(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "7px 8px",
                  borderRadius: 8, cursor: "pointer",
                  background: rozw ? "rgba(255,255,255,0.04)" : "transparent",
                  transition: "background 0.2s",
                }}>
                <span style={{ width: 20, textAlign: "center", color: g.color, fontSize: "1.05rem" }}>{g.symbol}</span>
                <span style={{ width: 74, fontSize: "0.84rem", flexShrink: 0 }}>{g.pl}</span>
                <div style={{ flex: 1, minWidth: 40, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                  <div style={{
                    width: `${szerokosc}%`, height: "100%", borderRadius: 4,
                    background: TON_KOLOR[d.ocena.ton], transition: "width 0.5s var(--ease-out)",
                  }} />
                </div>
                <span className="muted" style={{
                  fontSize: "0.76rem", width: 44, textAlign: "right", flexShrink: 0,
                  fontVariantNumeric: "tabular-nums", color: TON_KOLOR[d.ocena.ton],
                }}>
                  {Math.round(d.percentyl)}%
                </span>
                <span className="muted" style={{ fontSize: "0.76rem", width: 150, textAlign: "right", flexShrink: 0 }}>
                  {PREDYSPOZYCJA[d.id].split(",")[0]}
                </span>
              </div>

              {/* dymek po najechaniu — szybkie, zrozumiałe wyjaśnienie; znika, gdy wiersz jest już rozwinięty kliknięciem */}
              {najechanaTeraz && !rozw && <Dymek opis={PREDYSPOZYCJA_OPIS[d.id]} />}

              {rozw && (() => {
                const zastrzezenie = zastrzezenieGodnosci(chart.planets[d.id].dignity, g.pl);
                return (
                <div style={{ margin: "4px 0 10px 38px" }}>
                  <p style={{ fontSize: "0.85rem", lineHeight: 1.55, marginBottom: 6 }}>
                    {PREDYSPOZYCJA_OPIS[d.id]}
                  </p>
                  {zastrzezenie && (
                    <p style={{ fontSize: "0.8rem", lineHeight: 1.5, marginBottom: 6, color: "#e6a05a" }}>
                      {zastrzezenie}
                    </p>
                  )}
                  <p className="muted" style={{ fontSize: "0.78rem", lineHeight: 1.5, marginBottom: 6 }}>
                    <span style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.68rem" }}>
                      Skąd to wynika w Twojej mapie:
                    </span>{" "}
                    {d.ocena.czynniki.map((c, i) => (
                      <span key={i}>
                        <Czynnik tekst={c} />
                        {i < d.ocena.czynniki.length - 1 && <span className="muted"> · </span>}
                      </span>
                    ))}
                  </p>
                  <p className="muted" style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>
                    <span style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.68rem" }}>
                      Możliwe kierunki zawodowe:
                    </span>{" "}
                    {MOZLIWE_ZAWODY[d.id]}.
                  </p>
                </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
