"use client";

import { spojnoscRak, KOLUMNY_RAK, type KolumnaRak, type RodzajRak } from "@/lib/astro/spojnosc";
import type { TematWspolny } from "@/lib/astro/tematy";

/**
 * TABELA 4 — „Niebo i dłonie”: ręka wiodąca czytana jak mapa główna (D1), bierna jak nawamsza (D9).
 * Głosują cztery kolumny; numerologia tylko potwierdza (jej 0 nie jest niezgodą) — patrz spojnoscRak().
 * Wersja robocza, pod trzema tabelami spójności.
 */

const NAZWA: Record<KolumnaRak, string> = { d1: "D1", wiodaca: "Dłoń wiodąca", d9: "D9", bierna: "Dłoń bierna" };
const POD: Record<KolumnaRak, string> = { d1: "mapa główna", wiodaca: "jak D1", d9: "nawamsza", bierna: "jak D9" };

const RODZAJ: Record<RodzajRak, { tekst: (t: number, n: number) => string; klasa: string }> = {
  zgodne_tak: { tekst: () => "zgodne — tak", klasa: "sp-tak" },
  wiekszosc_tak: { tekst: (t, n) => `${t} z ${n} — tak`, klasa: "sp-dwa-tak" },
  zgodne_nie: { tekst: () => "zgodne — nie", klasa: "sp-nie" },
  wiekszosc_nie: { tekst: (t, n) => `${n - t} z ${n} — nie`, klasa: "sp-dwa-nie" },
  rozbiezne: { tekst: (t, n) => `${t} z ${n} — po równo`, klasa: "sp-rozb" },
  za_malo: { tekst: () => "za mało danych", klasa: "sp-rozb" },
};
const KOLEJNOSC: RodzajRak[] = ["zgodne_tak", "wiekszosc_tak", "rozbiezne", "wiekszosc_nie", "zgodne_nie", "za_malo"];

const znak = (v: number | undefined | null) => (v === undefined || v === null ? "?" : v === 1 ? "✦" : v === 0.5 ? "◐" : "0");
const procent = (x: number) => `${Math.round(x * 100)}%`;
function rzadkosc(p: number): string {
  if (p >= 0.5) return "często";
  return `1 na ${Math.max(2, Math.round(1 / Math.max(p, 0.0001)))}`;
}

export default function SpojnoscRak({ d1, d9, maBierna }: {
  d1: TematWspolny[];
  d9: TematWspolny[];
  /** Czy odczyt dłoni ma osobne oceny ręki biernej (odczyty od 2026-10-07). */
  maBierna: boolean;
}) {
  const s = spojnoscRak(d1, d9);
  const wiersze = [...s.wiersze].sort((a, b) => KOLEJNOSC.indexOf(a.rodzaj) - KOLEJNOSC.indexOf(b.rodzaj) || b.tak - a.tak || a.szansa - b.szansa);
  const glowne = s.pary.slice(0, 2);
  const wewnatrz = s.pary.slice(2);

  return (
    <section className="sp-sekcja" style={{ textAlign: "left" }}>
      <h3 className="sp-krok"><span>4</span> Niebo i dłonie: D1 z ręką wiodącą, D9 z ręką bierną</h3>
      <p className="muted" style={{ fontSize: "0.88rem", lineHeight: 1.7 }}>
        Ręka wiodąca to to, co budujesz i pokazujesz — jak mapa główna (D1). Ręka bierna to to, co niesiesz
        w sobie — jak nawamsza (D9). Głosują cztery kolumny; numerologia ma tylko kilka liczb na jedenaście
        tematów, więc tu jedynie <strong>potwierdza</strong>: jej „tak” dokłada pewności, a jej 0 nie liczy się jako niezgoda.
      </p>

      <div className="sp-pary">
        {glowne.map((p) => (
          <p key={p.a + p.b}>
            <span className="sp-para-nazwa">{NAZWA[p.a]} ↔ {NAZWA[p.b]}</span>
            {p.n ? <><strong>{procent(p.obserwowana)}</strong> <span className="muted">przypadkiem {procent(p.przypadek)} · ponad przypadek {Math.round(p.kappa * 100)}%</span></>
              : <span className="muted">brak danych</span>}
          </p>
        ))}
        <p className="muted" style={{ fontSize: "0.8rem" }}>
          Wewnątrz systemów: {wewnatrz.map((p) => `${NAZWA[p.a]} ↔ ${NAZWA[p.b]} ${p.n ? procent(p.obserwowana) : "—"}`).join(" · ")}
          {" "}· razem cztery kolumny: <strong>{procent(s.obserwowana)}</strong> (przypadkiem {procent(s.przypadek)}, ponad przypadek {Math.round(s.kappa * 100)}%)
        </p>
      </div>
      {!maBierna && (
        <p className="sp-uwaga">
          Ten odczyt dłoni ma osobno tylko znaki ręki biernej — linie i wzgórki zapisywał dla ręki wiodącej.
          Dlatego w kolumnie „Dłoń bierna” jest dużo „?”. Nowy odczyt dłoni zapisze rękę bierną w całości.
        </p>
      )}

      <div className="sp-tabela-wrap">
        <table className="sp-tabela">
          <thead>
            <tr>
              <th>Temat</th>
              {KOLUMNY_RAK.map((k) => <th key={k} className="srodek">{NAZWA[k]}<span className="sp-pod">{POD[k]}</span></th>)}
              <th className="srodek">Numerologia<span className="sp-pod">potwierdza</span></th>
              <th>Spójność</th>
              <th className="srodek">Przypadkiem</th>
            </tr>
          </thead>
          <tbody>
            {wiersze.map((r) => (
              <tr key={r.temat.id} className={RODZAJ[r.rodzaj].klasa}>
                <td>{r.temat.nazwa}</td>
                {KOLUMNY_RAK.map((k) => <td key={k} className="srodek sp-znak">{znak(r.wartosci[k])}</td>)}
                <td className="srodek sp-znak sp-num">{r.numerologia ? znak(r.numerologia) : r.numerologia === 0 ? "—" : "?"}</td>
                <td><span className="sp-rodzaj">{RODZAJ[r.rodzaj].tekst(r.tak, r.n)}</span>{r.numerologia ? <span className="sp-num-potw"> + liczby</span> : null}</td>
                <td className="srodek sp-rzadkosc">{r.rodzaj === "za_malo" ? "—" : rzadkosc(r.szansa)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted porownanie-legenda">
        ✦ tak · ◐ częściowo · 0 sprawdzone, niezaznaczone · ? brak danych · numerologia: ✦/◐ potwierdza, — nie dokłada.
        D9 liczony bez talentów (ich rozkład jest policzony dla mapy głównej).
      </p>
    </section>
  );
}
