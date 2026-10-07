"use client";

import { useState } from "react";
import Link from "next/link";
import { GRAHAS, type PlanetId } from "@/lib/astro/constants";
import {
  MIEJSCE_W_DLONI, PLANETA_CYFRA, SYSTEMY_ZGODNOSCI,
  type Most, type Ocena, type PlanetaPorownania, type SystemZgodnosci, type WynikZgodnosci,
} from "@/lib/astro/zgodnosc";
import type { TypDloni } from "@/lib/hiromancja";

/**
 * Porównanie trzech systemów na Twojej Karmie (tylko złota część, po fali).
 * Wyliczenia w lib/astro/zgodnosc.ts — tu wyłącznie obraz:
 *  1. spójność całego obrazu na tle przypadku,
 *  2. Vesica Piscis — trzy koła = trzy systemy, planeta leży tam, gdzie system
 *     uznaje ją za mocną (środek = mocna we wszystkich trzech),
 *  3. tabela 9 planet × 3 systemy z rodzajem zgodności,
 *  4. zgodność każdego systemu z dwoma pozostałymi, żywioły, wnioski słowami.
 */

const NAZWA: Record<SystemZgodnosci, string> = {
  astrologia: "Astrologia", chiromancja: "Chiromancja", numerologia: "Numerologia",
};
const ZYWIOL: Record<TypDloni, string> = { ziemia: "Ziemia", powietrze: "Powietrze", ogien: "Ogień", woda: "Woda" };

/* Geometria diagramu: A u góry z lewej, N u góry z prawej, Ch na dole. */
const R = 112;
const KOLA: Record<SystemZgodnosci, { cx: number; cy: number; lx: number; ly: number; anchor: "start" | "end" | "middle" }> = {
  astrologia: { cx: 172, cy: 150, lx: 66, ly: 34, anchor: "start" },
  numerologia: { cx: 292, cy: 150, lx: 398, ly: 34, anchor: "end" },
  chiromancja: { cx: 232, cy: 254, lx: 232, ly: 392, anchor: "middle" },
};
/** Środek każdego obszaru diagramu — klucz to posortowana lista systemów, w których planeta jest mocna. */
const OBSZARY: Record<string, [number, number]> = {
  "astrologia": [118, 128],
  "numerologia": [346, 128],
  "chiromancja": [232, 318],
  "astrologia+numerologia": [232, 112],
  "astrologia+chiromancja": [172, 236],
  "chiromancja+numerologia": [292, 236],
  "astrologia+chiromancja+numerologia": [232, 188],
};

function ZnakOceny({ o }: { o: Ocena | null }) {
  if (o === null) return <span className="pz-brak" title="brak danych">–</span>;
  const tytul = o === 1 ? "mocna" : o === 0 ? "przeciętna" : "słaba";
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" role="img" aria-label={tytul}>
      <title>{tytul}</title>
      {o === 1 && <circle cx="9" cy="9" r="7" fill="var(--gold)" />}
      {o === 0 && (
        <>
          <circle cx="9" cy="9" r="6.3" fill="none" stroke="var(--gold)" strokeWidth="1.4" />
          <path d="M 9 2.7 A 6.3 6.3 0 0 1 9 15.3 Z" fill="var(--gold)" />
        </>
      )}
      {o === -1 && <circle cx="9" cy="9" r="6.3" fill="none" stroke="var(--gold)" strokeWidth="1.4" />}
    </svg>
  );
}

const RODZAJ: Record<PlanetaPorownania["rodzaj"], string> = {
  zgodnosc3: "zgodne ×3",
  zgodnosc2: "zgodne ×2",
  roznica: "różnica",
  mieszane: "blisko",
  jeden: "za mało danych",
};

function lista(nazwy: string[]): string {
  if (nazwy.length <= 1) return nazwy.join("");
  return `${nazwy.slice(0, -1).join(", ")} i ${nazwy[nazwy.length - 1]}`;
}


/**
 * Zgodność PONAD PRZYPADEK (jak kappa Cohena): 0 = tyle, ile dałby sam przypadek, 1 = pełna zgodność,
 * poniżej 0 = rzadziej niż przypadek. Surowy odsetek (np. 67%) myli, bo dużą jego część daje los —
 * a poziom losu zmienia się z rozkładem ocen. Ta liczba od niego nie „pływa”.
 */
export function ponadPrzypadek(w: WynikZgodnosci): number {
  return w.przypadek < 1 ? (w.spojnosc - w.przypadek) / (1 - w.przypadek) : 0;
}

function werdykt(w: WynikZgodnosci): { tytul: string; opis: string } {
  const k = ponadPrzypadek(w);
  if (k >= 0.3) return {
    tytul: "Obraz wyraźnie spójny",
    opis: "Trzy systemy zgadzają się ze sobą znacznie częściej, niż wynikałoby z przypadku — to, co mówią o Tobie, wzajemnie się potwierdza.",
  };
  if (k >= 0.12) return {
    tytul: "Obraz raczej spójny",
    opis: "Systemy częściej się zgadzają, niż przeczą — rdzeń obrazu się potwierdza, a różnice pokazują miejsca, gdzie warto czytać uważniej.",
  };
  if (k > -0.12) return {
    tytul: "Obraz mieszany",
    opis: "Zgodności jest mniej więcej tyle, ile dałby przypadek — każdy system mówi tu własnym głosem. Najcenniejsze są pojedyncze planety, w których jednak się spotykają.",
  };
  return {
    tytul: "Systemy się rozchodzą",
    opis: "Systemy zgadzają się rzadziej, niż wynikałoby z przypadku — to nie błąd, tylko wyraźne napięcie między tym, co wrodzone (czas, imię), a tym, co rozwinięte (dłoń).",
  };
}

const ZRODLO_ZNAKU: Record<"tak" | "mozliwe" | "nie", string> = {
  tak: "AI też to widzi na zdjęciach",
  mozliwe: "AI widzi to możliwie, słabo",
  nie: "na zdjęciach tego nie widać",
};

function MostyDloni({ mosty }: { mosty: Most[] }) {
  const proc = (x: number) => `${Math.round(x * 100)}%`;
  const zBaza = mosty.filter((m) => m.baza !== null && m.potwierdza !== null);
  const liczone = mosty.filter((m) => m.potwierdza !== null);
  const trafione = liczone.filter((m) => m.potwierdza).length;
  const oczekiwane = zBaza.reduce((s, m) => s + (m.baza ?? 0), 0);
  const trafioneZBaza = zBaza.filter((m) => m.potwierdza).length;
  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: 8 }}>Mosty: dłoń ↔ horoskop</p>
      <p className="muted" style={{ fontSize: "0.86rem", lineHeight: 1.65, marginBottom: 14 }}>
        Każdy znak w dłoni ma klasyczne znaczenie — tu sprawdzamy, czy Twój horoskop mówi to samo
        o tej samej planecie (np. X na wzgórku Księżyca ↔ Księżyc w trudnym domu).
      </p>
      {mosty.length === 0 ? (
        <p className="muted" style={{ fontSize: "0.84rem" }}>
          Odczyt dłoni nie zawiera jeszcze znaków ani linii w nowym zapisie — pojawią się po kolejnym odczycie
          dłoni. Możesz też zgłosić znaki, które widzisz na swojej dłoni, na stronie Chiromancji.
        </p>
      ) : (
        <>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.6, marginBottom: 12 }}>
            <strong>Horoskop potwierdza {trafione} z {liczone.length}</strong>
            {zBaza.length > 0 && (
              <span className="muted">
                {" "}· przy znakach na wzgórkach: {trafioneZBaza} z {zBaza.length}, przypadkiem około {oczekiwane.toFixed(1)}
              </span>
            )}
          </p>
          <ul className="mosty-lista">
            {mosty.map((m, i) => (
              <li key={i} className={m.potwierdza ? "mosty-tak" : "mosty-nie"}>
                <span className="mosty-znak" title={m.potwierdza === null ? "częściowo — nie liczone" : undefined}>
                  {m.potwierdza ? "✓" : m.potwierdza === null ? "≈" : "–"}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p className="mosty-dlon">
                    {m.dlon}
                    <span className="mosty-zrodlo">{m.zrodlo === "osoba" ? "zgłoszone przez Ciebie" : "zauważone przez AI"}</span>
                  </p>
                  <p className="muted mosty-warunek">
                    {m.warunek}
                    {m.baza !== null && ` · ten sam warunek spełnia ${proc(m.baza)} planet w Twoim horoskopie`}
                    {m.zrodlo === "osoba" && m.aiWidzi && ` · ${ZRODLO_ZNAKU[m.aiWidzi]}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default function PorownanieSystemow({ wynik, mosty, dlonZrodlo, dlonZapisano, korekty = {}, onKorekta, ocenyAI = {} }: {
  wynik: WynikZgodnosci; mosty: Most[]; dlonZrodlo: "odczyt" | "tekst" | null; dlonZapisano: number | null;
  /** Oceny wzgórków ustawione przez osobę (nadpisują AI). */
  korekty?: Partial<Record<PlanetId, Ocena>>;
  onKorekta?: (p: PlanetId, o: Ocena | null) => void;
  /** Oceny dłoni z odczytu AI — do pokazania, co zmieniła korekta. */
  ocenyAI?: Partial<Record<PlanetId, Ocena | null>>;
}) {
  // kliknięcie w ocenę dłoni: mocna → przeciętna → słaba → z powrotem ocena AI
  const nastepna = (p: PlanetId) => {
    const teraz = korekty[p];
    const kolejne: (Ocena | null)[] = [1, 0, -1, null];
    const start = teraz === undefined ? -1 : kolejne.indexOf(teraz);
    onKorekta?.(p, kolejne[(start + 1) % kolejne.length]);
  };
  const [aktywna, setAktywna] = useState<PlanetId | null>(null);
  const w = werdykt(wynik);
  const proc = (x: number) => `${Math.round(x * 100)}%`;

  // planety w obszarach diagramu
  const wObszarze = new Map<string, PlanetId[]>();
  const poza: PlanetId[] = [];
  for (const p of wynik.planety) {
    if (!p.mocnaW.length) { poza.push(p.planeta); continue; }
    const k = [...p.mocnaW].sort().join("+");
    wObszarze.set(k, [...(wObszarze.get(k) ?? []), p.planeta]);
  }

  const nazwa = (p: PlanetId) => GRAHAS[p].pl;
  const mocneRdzen = wynik.planety.filter((p) => (p.rodzaj === "zgodnosc3" || p.rodzaj === "zgodnosc2")
    && Object.values(p.oceny).filter((o) => o === 1).length >= 2);
  const slabeRdzen = wynik.planety.filter((p) => (p.rodzaj === "zgodnosc3" || p.rodzaj === "zgodnosc2")
    && Object.values(p.oceny).filter((o) => o === -1).length >= 2);
  const roznice = wynik.planety.filter((p) => p.rodzaj === "roznica");
  // dwa systemy zgodne, trzeci mówi coś przeciwnego (mocna ↔ słaba) — warte jednego zdania
  const przeciwOdstajace = wynik.planety.filter((p) => p.odstaje && p.oceny[p.odstaje] !== null
    && Object.values(p.oceny).some((o) => o !== null && Math.abs(o - p.oceny[p.odstaje!]!) === 2));
  const brakDloni = wynik.systemy.chiromancja.par === 0;

  const przygas = (p: PlanetId) => (aktywna && aktywna !== p ? 0.28 : 1);

  return (
    <section className="porownanie" style={{ textAlign: "left" }}>
      <h2 className="porownanie-tytul">Zgodność trzech systemów</h2>
      <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.75 }}>
        Astrologia, chiromancja i numerologia mówią wspólnym językiem dziewięciu planet. Każdy system
        ocenia każdą planetę jako mocną, przeciętną albo słabą — tu widać, gdzie te oceny się spotykają,
        a gdzie rozchodzą.
      </p>

      {/* 1. Spójność na tle przypadku */}
      <div className="porownanie-wynik">
        <p className="porownanie-liczba">{Math.round(ponadPrzypadek(wynik) * 100)}%</p>
        <div>
          <p className="porownanie-werdykt">{w.tytul}</p>
          <p className="muted" style={{ fontSize: "0.86rem", lineHeight: 1.6 }}>
            Zgodność ponad przypadek: 0% = tyle, ile dałby sam przypadek, 100% = pełna zgodność. {w.opis}
          </p>
          <p className="muted" style={{ fontSize: "0.76rem", lineHeight: 1.5, marginTop: 6 }}>
            Skąd ta liczba: oceny planet zgadzają się średnio w {proc(wynik.spojnosc)} ({wynik.par} porównań par
            systemów; ta sama ocena liczy się w całości, sąsiednia w połowie, przeciwna wcale), a sam przypadek
            dałby około {proc(wynik.przypadek)}.
          </p>
        </div>
      </div>

      <div className="ornament" style={{ margin: "30px 0 22px" }} />

      {/* 2. Vesica Piscis */}
      <p className="eyebrow" style={{ textAlign: "center", marginBottom: 6 }}>Gdzie planeta jest mocna</p>
      <svg viewBox="0 0 464 410" className="porownanie-vesica" role="img"
        aria-label="Diagram trzech kół: planety mocne w jednym, dwóch albo trzech systemach">
        {SYSTEMY_ZGODNOSCI.map((s) => {
          const k = KOLA[s];
          return (
            <g key={s}>
              <circle cx={k.cx} cy={k.cy} r={R} fill="var(--gold)" fillOpacity="0.05" stroke="var(--gold)" strokeWidth="1.4" />
              <text x={k.lx} y={k.ly} textAnchor={k.anchor} className="porownanie-kolo-podpis">{NAZWA[s]}</text>
            </g>
          );
        })}
        {[...wObszarze.entries()].map(([k, planety]) => {
          const [x, y] = OBSZARY[k];
          const krok = 42;
          return planety.map((p, i) => {
            const wRzedzie = Math.min(planety.length, 3);
            const rzad = Math.floor(i / 3), kol = i % 3;
            const px = x + (kol - (wRzedzie - 1) / 2) * krok;
            const py = y + rzad * 38 - (planety.length > 3 ? 18 : 0);
            return (
              <g key={p} style={{ cursor: "pointer", opacity: przygas(p), transition: "opacity 0.2s" }}
                onMouseEnter={() => setAktywna(p)} onMouseLeave={() => setAktywna(null)}
                onClick={() => setAktywna((a) => (a === p ? null : p))}>
                <circle cx={px} cy={py} r={aktywna === p ? 15 : 13} fill="var(--bg, #0c0a1a)"
                  stroke="var(--gold)" strokeWidth={aktywna === p ? 2 : 1} style={{ transition: "r 0.2s" }} />
                <text x={px} y={py + 5} textAnchor="middle" className="porownanie-symbol">{GRAHAS[p].symbol}</text>
                <text x={px} y={py + 26} textAnchor="middle" className="porownanie-nazwa">{nazwa(p)}</text>
              </g>
            );
          });
        })}
      </svg>
      {poza.length > 0 && (
        <p className="muted" style={{ fontSize: "0.82rem", textAlign: "center", marginTop: 4 }}>
          Poza kołami (żaden system nie uznaje ich za mocne): {lista(poza.map(nazwa))}.
        </p>
      )}

      <div className="ornament" style={{ margin: "30px 0 22px" }} />

      {/* 3. Tabela */}
      <div className="porownanie-tabela-wrap">
        <table className="porownanie-tabela">
          <thead>
            <tr>
              <th>Planeta</th>
              {SYSTEMY_ZGODNOSCI.map((s) => (
                <th key={s}><span className="pz-dlugie">{NAZWA[s]}</span><span className="pz-krotkie">{NAZWA[s].slice(0, 4)}.</span></th>
              ))}
              <th>Wynik</th>
            </tr>
          </thead>
          <tbody>
            {wynik.planety.map((p) => (
              <tr key={p.planeta} className={aktywna === p.planeta ? "aktywny" : undefined}
                style={{ opacity: przygas(p.planeta) }}
                onMouseEnter={() => setAktywna(p.planeta)} onMouseLeave={() => setAktywna(null)}>
                <td>
                  <span className="porownanie-symbol-tab">{GRAHAS[p.planeta].symbol}</span> {nazwa(p.planeta)}
                  <span className="muted porownanie-pod">cyfra {PLANETA_CYFRA[p.planeta]}{MIEJSCE_W_DLONI[p.planeta] ? ` · ${MIEJSCE_W_DLONI[p.planeta]}` : ""}</span>
                </td>
                {SYSTEMY_ZGODNOSCI.map((s) => (
                  <td key={s} className="srodek">
                    {s === "chiromancja" && onKorekta ? (
                      <button type="button" className={`pz-korekta${korekty[p.planeta] !== undefined ? " pz-korekta-ty" : ""}`}
                        title="Kliknij, żeby ustawić ocenę dłoni samemu (mocna → przeciętna → słaba → ocena AI)"
                        onClick={() => nastepna(p.planeta)}>
                        <ZnakOceny o={p.oceny[s]} />
                        {korekty[p.planeta] !== undefined && <span className="pz-ty">Ty</span>}
                      </button>
                    ) : <ZnakOceny o={p.oceny[s]} />}
                  </td>
                ))}
                <td>
                  <span className={`porownanie-rodzaj r-${p.rodzaj}`}>{RODZAJ[p.rodzaj]}</span>
                  {p.odstaje && <span className="porownanie-odstaje">{NAZWA[p.odstaje].toLowerCase()} inaczej</span>}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="pz-razem">
              <td>Wynik tabeli</td>
              {SYSTEMY_ZGODNOSCI.map((s) => {
                const mocne = wynik.planety.filter((p) => p.oceny[s] === 1).length;
                const zg = wynik.systemy[s].zgodnosc;
                return (
                  <td key={s} className="srodek">
                    <span className="pz-razem-liczba">{zg === null ? "–" : proc(zg)}</span>
                    <span className="porownanie-pod muted">zgodność z resztą · mocne: {mocne}</span>
                  </td>
                );
              })}
              <td>
                <span className="pz-razem-liczba">{proc(wynik.spojnosc)}</span>
                <span className="porownanie-pod muted">
                  {(["zgodnosc3", "zgodnosc2", "mieszane", "roznica"] as const)
                    .map((r) => [RODZAJ[r], wynik.planety.filter((p) => p.rodzaj === r).length] as const)
                    .filter(([, n]) => n > 0).map(([t, n]) => `${t}: ${n}`).join(" · ")}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="muted" style={{ fontSize: "0.78rem", marginTop: 8, lineHeight: 1.5 }}>
        Wynik tabeli: w kolumnach — jak często oceny danego systemu zgadzają się z dwoma pozostałymi i ile planet uznaje
        za mocne; w ostatniej kolumnie — średnia zgodność ocen wszystkich par ({proc(wynik.spojnosc)}, przypadkiem byłoby
        {" "}{proc(wynik.przypadek)}) i ile planet ma każdy rodzaj wyniku.
      </p>
      {onKorekta && (
        <p className="muted" style={{ fontSize: "0.78rem", marginTop: 10, lineHeight: 1.5 }}>
          Znasz swoją dłoń lepiej niż zdjęcie? Kliknij ocenę w kolumnie Chiromancja, żeby ją ustawić samemu
          (mocna → przeciętna → słaba → z powrotem ocena AI). Twoje ustawienia mają podpis „Ty”
          {Object.keys(korekty).length > 0 && ` — zmieniono: ${Object.keys(korekty).length}, ocena AI była: ${Object.entries(korekty).map(([pl]) => `${GRAHAS[pl as PlanetId].pl} ${ocenyAI[pl as PlanetId] === 1 ? "mocna" : ocenyAI[pl as PlanetId] === -1 ? "słaba" : ocenyAI[pl as PlanetId] === 0 ? "przeciętna" : "brak"}`).join(", ")}`}.
        </p>
      )}
      <p className="muted porownanie-legenda">
        <ZnakOceny o={1} /> mocna <ZnakOceny o={0} /> przeciętna <ZnakOceny o={-1} /> słaba <span className="pz-brak">–</span> brak danych
      </p>

      {dlonZapisano && (
        <p className="muted" style={{ fontSize: "0.78rem", marginTop: 8 }}>
          Chiromancja: odczyt dłoni z {new Date(dlonZapisano).toLocaleString("pl-PL", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          {dlonZrodlo === "odczyt" ? " — oceny podane wprost przez odczyt." : " — oceny wyłuskane z tekstu odczytu."}
          {" "}Astrologia i numerologia liczą się zawsze z tych samych danych urodzenia, więc zmienia je tylko inna data, godzina lub imię.
        </p>
      )}

      <div className="ornament" style={{ margin: "30px 0 22px" }} />

      {/* 3b. Mosty dłoń ↔ horoskop — konkretny znak w dłoni sprawdzony z konkretnym układem planety */}
      <MostyDloni mosty={mosty} />

      <div className="ornament" style={{ margin: "30px 0 22px" }} />

      {/* 4. Każdy system na tle dwóch pozostałych */}
      <p className="eyebrow" style={{ marginBottom: 14 }}>Każdy system na tle pozostałych</p>
      <div className="porownanie-paski">
        {SYSTEMY_ZGODNOSCI.map((s) => {
          const d = wynik.systemy[s];
          return (
            <div key={s} className="porownanie-pasek">
              <span className="porownanie-pasek-nazwa">{NAZWA[s]}</span>
              <span className="porownanie-pasek-tor">
                {d.zgodnosc !== null && <span className="porownanie-pasek-wypelnienie" style={{ width: proc(d.zgodnosc) }} />}
                {d.przypadek !== null && <span className="porownanie-pasek-przypadek" style={{ left: proc(d.przypadek) }} title="przypadek" />}
              </span>
              <span className="porownanie-pasek-liczba">{d.zgodnosc !== null ? proc(d.zgodnosc) : "–"}</span>
            </div>
          );
        })}
      </div>
      <p className="muted" style={{ fontSize: "0.78rem", marginTop: 8 }}>
        Pasek — jak często system zgadza się z dwoma pozostałymi; pionowa kreska — ile dałby przypadek.
      </p>

      {/* 5. Żywioły */}
      <p className="eyebrow" style={{ margin: "26px 0 10px" }}>Żywioł</p>
      <p style={{ fontSize: "0.92rem", lineHeight: 1.7 }}>
        Dłoń: <strong>{wynik.zywioly.dlon ? ZYWIOL[wynik.zywioly.dlon] : "brak danych"}</strong>
        {" · "}Ascendent: <strong>{wynik.zywioly.lagna ? ZYWIOL[wynik.zywioly.lagna as TypDloni] : "bez godziny"}</strong>
        {" · "}Księżyc: <strong>{ZYWIOL[wynik.zywioly.ksiezyc as TypDloni]}</strong>
        {wynik.zywioly.dlon && (
          <span className="muted">
            {" — "}
            {wynik.zywioly.dlon === wynik.zywioly.lagna || wynik.zywioly.dlon === wynik.zywioly.ksiezyc
              ? `dłoń powtarza żywioł ${wynik.zywioly.dlon === wynik.zywioly.lagna ? "ascendentu" : "Księżyca"}: ciało i niebo mówią tu to samo.`
              : "dłoń ma inny żywioł niż ascendent i Księżyc — ciało pokazuje stronę, której mapa nieba nie podkreśla."}
          </span>
        )}
      </p>

      <div className="ornament" style={{ margin: "30px 0 22px" }} />

      {/* 6. Wnioski słowami — z tabeli, nie zgadywane */}
      <p className="eyebrow" style={{ marginBottom: 10 }}>Co z tego wynika</p>
      <div style={{ fontSize: "0.92rem", lineHeight: 1.75, display: "grid", gap: 12 }}>
        {mocneRdzen.length > 0 && (
          <p>
            <strong>Rdzeń potwierdzony:</strong> {lista(mocneRdzen.map((p) => nazwa(p.planeta)))} —
            mocne w co najmniej dwóch systemach naraz. To tematy, na których możesz polegać najpewniej.
          </p>
        )}
        {slabeRdzen.length > 0 && (
          <p>
            <strong>Zgodnie słabsze:</strong> {lista(slabeRdzen.map((p) => nazwa(p.planeta)))} — kilka systemów
            widzi tu mniej siły. Nie wyrok, tylko obszar do świadomego rozwijania.
          </p>
        )}
        {roznice.map((p) => {
          const mocne = SYSTEMY_ZGODNOSCI.filter((s) => p.oceny[s] === 1).map((s) => NAZWA[s].toLowerCase());
          const slabe = SYSTEMY_ZGODNOSCI.filter((s) => p.oceny[s] === -1).map((s) => NAZWA[s].toLowerCase());
          return (
            <p key={p.planeta}>
              <strong>Różnica — {nazwa(p.planeta)}:</strong> {lista(mocne)} widzi ją jako mocną, {lista(slabe)} jako
              słabą. W takich miejscach to, co wrodzone, i to, co rozwinięte, rozeszło się —
              warto zapytać, dlaczego.
            </p>
          );
        })}
        {przeciwOdstajace.map((p) => (
          <p key={`o-${p.planeta}`}>
            <strong>Jeden system inaczej — {nazwa(p.planeta)}:</strong> {lista(SYSTEMY_ZGODNOSCI.filter((x) => x !== p.odstaje).map((x) => NAZWA[x].toLowerCase()))}{" "}
            zgodnie widzą ją jako {p.oceny[p.odstaje!] === 1 ? "słabą" : "mocną"}, a {NAZWA[p.odstaje!].toLowerCase()} jako{" "}
            {p.oceny[p.odstaje!] === 1 ? "mocną" : "słabą"}. Większość mówi jednym głosem — trzeci system
            pokazuje stronę tej planety, której dwa pozostałe nie podkreślają.
          </p>
        ))}
        {!mocneRdzen.length && !slabeRdzen.length && !roznice.length && !przeciwOdstajace.length && (
          <p>Żadna planeta nie wyróżnia się zgodnie w dwóch systemach — obraz jest rozproszony.</p>
        )}
      </div>

      {(brakDloni || dlonZrodlo === "tekst") && (
        <p className="muted" style={{ fontSize: "0.8rem", marginTop: 18, lineHeight: 1.6 }}>
          {brakDloni
            ? "Chiromancja nie ma jeszcze ocen wzgórków — porównanie obejmuje na razie astrologię i numerologię. "
            : "Oceny dłoni wyłuskane z tekstu wcześniejszego odczytu — pełniejsze będą po nowym odczycie. "}
          <Link href="/hiromancja" style={{ color: "var(--gold)" }}>Odczytaj dłonie ponownie →</Link>
        </p>
      )}
      <p className="muted" style={{ fontSize: "0.74rem", marginTop: 14, lineHeight: 1.6 }}>
        Jak liczymy: astrologia — jak mocno planeta kształtuje Twój horoskop: władca ascendentu i znaku
        Księżyca, atmakaraka, planety w ascendencie i na osiach, aspekt na ascendent, własny znak lub
        egzaltacja, bieżąca mahadasza (trzy najwyrazistsze, trzy najmniej);
        numerologia — cyfra planety jako Mulank, Bhagyank, liczba imienia albo powtórzona w dacie
        (mocna), nieobecna w dacie (słaba); chiromancja — wzgórek, palec i linia planety, porównane
        między sobą w Twojej dłoni; Rahu i Ketu według chiromancji indyjskiej (środek dłoni i obszar nad
        nadgarstkiem). Rahu i Ketu nie mają
        w dłoni klasycznego miejsca. Nic nie jest tu oceniane „na oko” — wszystko wynika z tych reguł.
      </p>
    </section>
  );
}
