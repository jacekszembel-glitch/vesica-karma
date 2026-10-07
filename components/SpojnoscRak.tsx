"use client";

import { Fragment, useState } from "react";
import { spojnoscRak, KOLUMNY_RAK, type KolumnaRak, type RodzajRak, type WierszRak } from "@/lib/astro/spojnosc";
import { KRYTERIA_TEMATOW, type TematWspolny, type Wskazanie, type SystemTematu } from "@/lib/astro/tematy";

/**
 * TABELA 4 — „Niebo i dłonie”: ręka wiodąca czytana jak mapa główna (D1), bierna jak nawamsza (D9).
 * Głosują cztery kolumny; numerologia tylko potwierdza (jej 0 nie jest niezgodą) — patrz spojnoscRak().
 * Wersja robocza, pod trzema tabelami spójności.
 */

const NAZWA: Record<KolumnaRak, string> = { d1: "D1", wiodaca: "Dłoń wiodąca", d9: "D9", bierna: "Dłoń bierna" };
/** Krótkie nagłówki kolumn — tabela musi zmieścić się w 640 px Twojej Karmy. */
const KROTKO: Record<KolumnaRak, string> = { d1: "D1", wiodaca: "Wiodąca", d9: "D9", bierna: "Bierna" };
const POD: Record<KolumnaRak, string> = { d1: "mapa", wiodaca: "dłoń", d9: "nawamsza", bierna: "dłoń" };
const pkt = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1).replace(".", ","));

const RODZAJ: Record<RodzajRak, { tekst: (t: number, n: number) => string; klasa: string }> = {
  zgodne_tak: { tekst: (_t, n) => `zgodne ×${n} — tak`, klasa: "sp-tak" },
  wiekszosc_tak: { tekst: (t, n) => `${t} z ${n} — tak`, klasa: "sp-dwa-tak" },
  zgodne_nie: { tekst: (_t, n) => `zgodne ×${n} — nie`, klasa: "sp-nie" },
  wiekszosc_nie: { tekst: (t, n) => `${n - t} z ${n} — nie`, klasa: "sp-dwa-nie" },
  rozbiezne: { tekst: (t, n) => `${t} z ${n} — po równo`, klasa: "sp-rozb" },
  za_malo: { tekst: () => "za mało danych", klasa: "sp-rozb" },
};
/** Wg siły zgodności: wszystkie zgodne (na tak i na nie), potem większość, potem po równo. */
const KOLEJNOSC: RodzajRak[] = ["zgodne_tak", "zgodne_nie", "wiekszosc_tak", "wiekszosc_nie", "rozbiezne", "za_malo"];

const znak = (v: number | undefined | null) => (v === undefined || v === null ? "?" : v === 1 ? "✦" : v === 0.5 ? "◐" : "0");
const procent = (x: number) => `${Math.round(x * 100)}%`;
/** Rozwinięcie wiersza: co dokładnie dało wynik w każdej kolumnie, a przy 0 i „?” — czego szukaliśmy. */
function Szczegoly({ r, maBierna }: { r: WierszRak; maBierna: boolean }) {
  const kryt = KRYTERIA_TEMATOW[r.temat.id];
  const pozycje: { nazwa: string; w?: Wskazanie; system: SystemTematu; potwierdza?: boolean; tylkoZnaki?: boolean }[] = [
    { nazwa: "Astrologia — D1 (mapa główna)", w: r.temat.wskazania.kosmogram, system: "kosmogram" },
    { nazwa: "Chiromancja — dłoń wiodąca", w: r.temat.wskazania.dlon, system: "dlon" },
    { nazwa: "Astrologia — D9 (nawamsza)", w: r.temat9?.wskazania.kosmogram, system: "kosmogram" },
    { nazwa: "Chiromancja — dłoń bierna", w: r.temat9?.wskazania.dlon, system: "dlon", tylkoZnaki: !maBierna },
    { nazwa: "Numerologia (tylko potwierdza)", w: r.temat.wskazania.numerologia, system: "numerologia", potwierdza: true },
  ];
  return (
    <div className="sp-szczegoly">
      <p className="sp-szcz-znaczenie">{r.temat.znaczenie}</p>
      <ul>
        {pozycje.map((p) => {
          const st = p.w?.stan;
          const ma = st === "tak" || st === "czesciowo";
          return (
            <li key={p.nazwa} className={ma ? "sp-szcz-ma" : ""}>
              <span className="sp-szcz-nazwa">{p.nazwa}</span>
              <span className="sp-szcz-znak">{!p.w || st === "brak_danych" || st === "nie_dotyczy" ? "?" : st === "tak" ? "✦" : st === "czesciowo" ? "◐" : p.potwierdza ? "—" : "0"}</span>
              <span className="sp-szcz-tresc">
                {ma ? (p.w!.dowody ?? [p.w!.opis]).join("; ")
                  : !p.w || st === "brak_danych" ? `brak danych — tu sprawdzamy: ${kryt?.[p.system] ?? ""}`
                    : p.tylkoZnaki ? `brak znaków; wzgórki i linie tej ręki nie były jeszcze oceniane — sprawdzamy: ${kryt?.[p.system] ?? ""}`
                      : `nic z tego nie występuje: ${kryt?.[p.system] ?? ""}`}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="sp-szcz-uwaga">Skupisko 3+ planet w jednym domu wzmacnia też tematy tego domu (np. 9. dom: podróże, duchowość, ambicja).</p>
    </div>
  );
}

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
  const [otwarte, setOtwarte] = useState<Set<string>>(new Set());
  const przelacz = (id: string) => setOtwarte((o) => {
    const n = new Set(o);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const wiersze = [...s.wiersze].sort((a, b) => KOLEJNOSC.indexOf(a.rodzaj) - KOLEJNOSC.indexOf(b.rodzaj) || b.tak - a.tak || a.szansa - b.szansa);
  const glowne = s.pary.slice(0, 2);
  // punktacja: ✦ = 1, ◐ = ½ w każdej z czterech kolumn; maksimum = liczba ocen z danymi
  const sumaKol = (k: KolumnaRak) => s.wiersze.reduce((a, r) => a + (r.wartosci[k] ?? 0), 0);
  const maxKol = (k: KolumnaRak) => s.wiersze.filter((r) => r.wartosci[k] !== undefined).length;
  const punktyRazem = KOLUMNY_RAK.reduce((a, k) => a + sumaKol(k), 0);
  const maxRazem = KOLUMNY_RAK.reduce((a, k) => a + maxKol(k), 0);
  const potwierdzenLiczb = s.wiersze.filter((r) => r.numerologia).length;
  const zgodnychTak = s.wiersze.filter((r) => r.rodzaj === "zgodne_tak" || r.rodzaj === "wiekszosc_tak").length;
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
        <table className="sp-tabela sp-waska">
          <thead>
            <tr>
              <th>Temat</th>
              {KOLUMNY_RAK.map((k) => <th key={k} className="srodek">{KROTKO[k]}<span className="sp-pod">{POD[k]}</span></th>)}
              <th className="srodek">Liczby<span className="sp-pod">potwierdza</span></th>
              <th>Spójność</th>
              <th className="srodek" title="Jak często taki układ ocen wyszedłby przypadkiem">Rzadkość</th>
              <th className="srodek">Pkt</th>
            </tr>
          </thead>
          <tbody>
            {wiersze.map((r) => (
              <Fragment key={r.temat.id}>
              <tr className={`${RODZAJ[r.rodzaj].klasa} sp-klik${otwarte.has(r.temat.id) ? " sp-otwarty" : ""}`} onClick={() => przelacz(r.temat.id)}>
                <td>
                  <button type="button" className="sp-rozwin" aria-expanded={otwarte.has(r.temat.id)}
                    onClick={(e) => { e.stopPropagation(); przelacz(r.temat.id); }}>
                    <span className="sp-strzalka" aria-hidden="true">▸</span>{r.temat.nazwa}
                  </button>
                </td>
                {KOLUMNY_RAK.map((k) => <td key={k} className="srodek sp-znak">{znak(r.wartosci[k])}</td>)}
                <td className="srodek sp-znak sp-num">{r.numerologia ? znak(r.numerologia) : r.numerologia === 0 ? "—" : "?"}</td>
                <td><span className="sp-rodzaj">{RODZAJ[r.rodzaj].tekst(r.tak, r.n)}</span>{r.numerologia ? <span className="sp-num-potw"> + liczby</span> : null}{r.rodzaj !== "za_malo" && <span className="sp-rz-tel">{rzadkosc(r.szansa)}</span>}</td>
                <td className="srodek sp-rzadkosc">{r.rodzaj === "za_malo" ? "—" : rzadkosc(r.szansa)}</td>
                <td className="srodek sp-pkt">{pkt(KOLUMNY_RAK.reduce((a, k) => a + (r.wartosci[k] ?? 0), 0))}<small>/{r.n}</small></td>
              </tr>
              {otwarte.has(r.temat.id) && (
                <tr className="sp-szcz-wiersz"><td colSpan={9}><Szczegoly r={r} maBierna={maBierna} /></td></tr>
              )}
              </Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Razem</td>
              {KOLUMNY_RAK.map((k) => <td key={k} className="srodek sp-pkt">{pkt(sumaKol(k))}<small>/{maxKol(k)}</small></td>)}
              <td className="srodek sp-pkt">+{potwierdzenLiczb}</td>
              <td className="sp-razem-opis">{zgodnychTak} z {s.wiersze.length} tematów na tak</td>
              <td className="sp-rzadkosc" />
              <td className="srodek sp-pkt sp-pkt-razem">{pkt(punktyRazem)}<small>/{maxRazem}</small></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="sp-podsumowanie">
        <p className="sp-podsumowanie-liczba">{maxRazem ? Math.round((punktyRazem / maxRazem) * 100) : 0}%</p>
        <p>
          Systemy zebrały <strong>{pkt(punktyRazem)} z {maxRazem}</strong> możliwych punktów
          (✦ = 1, ◐ = ½ w każdej z czterech kolumn; maksimum = liczba ocen z danymi, bez „?”).
          {" "}Numerologia potwierdziła {potwierdzenLiczb} {potwierdzenLiczb === 1 ? "temat" : potwierdzenLiczb >= 2 && potwierdzenLiczb <= 4 ? "tematy" : "tematów"} — to premia, nie część wyniku.
        </p>
      </div>
      <p className="muted porownanie-legenda">
        Kliknij wiersz, żeby zobaczyć, co dokładnie daje wynik. ✦ tak · ◐ częściowo · 0 sprawdzone, niezaznaczone · ? brak danych · liczby: ✦/◐ potwierdza, — nie dokłada.
        D9 liczony bez talentów (ich rozkład jest policzony dla mapy głównej).
      </p>
      <p className="muted" style={{ fontSize: "0.76rem", lineHeight: 1.6, marginTop: 8, textAlign: "left" }}>
        <strong>Rzadkość, np. „1 na 7”</strong> — gdyby systemy oceniały tematy losowo (każdy z tą samą liczbą ✦, ◐ i 0,
        jaką ma u Ciebie), taki układ ocen w wierszu wychodziłby mniej więcej raz na 7 tematów. Im większa
        liczba, tym trudniej o przypadek, więc tym mocniejsza zgodność. „Często” = przypadkiem co drugi raz albo częściej.
      </p>
    </section>
  );
}
