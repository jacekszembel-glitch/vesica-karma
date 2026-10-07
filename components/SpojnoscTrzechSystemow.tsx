"use client";

import { Fragment, useState } from "react";
import type { VedicChart } from "@/lib/astro/chart";
import { KRYTERIA_TEMATOW, opisKosmogramu, type TematWspolny, type SystemTematu } from "@/lib/astro/tematy";
import { droga, spojnosc, SYSTEMY, type RodzajSpojnosci } from "@/lib/astro/spojnosc";

/**
 * SPÓJNOŚĆ TRZECH SYSTEMÓW — trzy tabele pod „Wspólnymi tematami” (lib/astro/spojnosc.ts):
 *  1. czy systemy mówią to samo (także zgodnie „na nie”) i jak rzadki jest taki układ,
 *  2. czego dotyczą zgodności i z jaką siłą,
 *  3. droga i talenty — tylko to, co wynika z danych.
 * Wersja robocza: ma pokazać, jak to wypada; porządki w całej Twojej Karmie na końcu.
 */

const NAZWA_SYSTEMU: Record<SystemTematu, string> = { kosmogram: "Kosmogram", dlon: "Dłoń", numerologia: "Numerologia" };
const PELNA_NAZWA: Record<SystemTematu, string> = { kosmogram: "Astrologia (kosmogram)", dlon: "Chiromancja (dłoń)", numerologia: "Numerologia" };

/** Rozwinięcie wiersza tabeli 1: co w każdym systemie daje znacznik, a przy 0 i „?” — czego szukaliśmy. */
function Szczegoly({ temat }: { temat: TematWspolny }) {
  const kryt = KRYTERIA_TEMATOW[temat.id];
  return (
    <div className="sp-szczegoly">
      <p className="sp-szcz-znaczenie">{temat.znaczenie}</p>
      <ul>
        {SYSTEMY.map((x) => {
          const w = temat.wskazania[x];
          const ma = w.stan === "tak" || w.stan === "czesciowo";
          return (
            <li key={x} className={ma ? "sp-szcz-ma" : ""}>
              <span className="sp-szcz-nazwa">{PELNA_NAZWA[x]}</span>
              <span className="sp-szcz-znak">{w.stan === "tak" ? "✦" : w.stan === "czesciowo" ? "◐" : w.stan === "nie" ? "0" : "?"}</span>
              <span className="sp-szcz-tresc">
                {(x === "kosmogram" ? opisKosmogramu(w) : null) ?? (ma ? (w.dowody ?? [w.opis]).join("; ")
                  : w.stan === "nie" ? `nic z tego nie występuje: ${kryt?.[x] ?? ""}`
                    : `brak danych — tu sprawdzamy: ${kryt?.[x] ?? ""}`)}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="sp-szcz-uwaga">Skupisko 3+ planet w jednym domu wzmacnia też tematy tego domu.</p>
    </div>
  );
}

/** Kolejność wierszy wg siły zgodności: wszystkie systemy zgodne (na tak i na nie), potem większość, potem rozbieżne. */
const KOLEJNOSC: RodzajSpojnosci[] = ["zgodne_tak", "zgodne_nie", "dwa_tak", "dwa_nie", "rozbiezne", "za_malo"];

const RODZAJ: Record<RodzajSpojnosci, { tekst: string; klasa: string }> = {
  zgodne_tak: { tekst: "zgodne ×3 — tak", klasa: "sp-tak" },
  dwa_tak: { tekst: "2 z 3 — tak", klasa: "sp-dwa-tak" },
  zgodne_nie: { tekst: "zgodne ×3 — nie", klasa: "sp-nie" },
  dwa_nie: { tekst: "2 z 3 — nie", klasa: "sp-dwa-nie" },
  rozbiezne: { tekst: "rozbieżne", klasa: "sp-rozb" },
  za_malo: { tekst: "za mało danych", klasa: "sp-rozb" },
};

const znak = (v: number | undefined) => (v === undefined ? "?" : v === 1 ? "✦" : v === 0.5 ? "◐" : "0");
const procent = (x: number) => `${Math.round(x * 100)}%`;
/** „1 na N” — jak często taki układ ocen wychodzi przypadkiem. */
function rzadkosc(p: number): string {
  if (p >= 0.5) return "często";
  return `1 na ${Math.max(2, Math.round(1 / Math.max(p, 0.0001)))}`;
}
const pkt = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1).replace(".", ","));

export default function SpojnoscTrzechSystemow({ tematy, chart }: { tematy: TematWspolny[]; chart: VedicChart }) {
  const [otwarte, setOtwarte] = useState<Set<string>>(new Set());
  const przelacz = (id: string) => setOtwarte((o) => {
    const n = new Set(o);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const s = spojnosc(tematy);
  const d = droga(chart, s);
  // punktacja tabeli 1: ✦ = 1, ◐ = ½ w każdym systemie; maksimum = oceny z danymi
  const punktySystemu = (x: SystemTematu) => s.tematy.reduce((a, t) => a + (t.wartosci[x] ?? 0), 0);
  const maxSystemu = (x: SystemTematu) => s.tematy.filter((t) => t.wartosci[x] !== undefined).length;
  const punktyRazem = SYSTEMY.reduce((a, x) => a + punktySystemu(x), 0);
  const maxRazem = SYSTEMY.reduce((a, x) => a + maxSystemu(x), 0);
  const potwierdzone = s.tematy.filter((t) => t.rodzaj === "zgodne_tak" || t.rodzaj === "dwa_tak")
    .sort((a, b) => b.temat.sila - a.temat.sila || a.szansa - b.szansa);

  return (
    <section className="sp-sekcja" style={{ textAlign: "left" }}>
      <h2 className="porownanie-tytul">Spójność trzech systemów</h2>
      <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.75 }}>
        Trzy kroki: najpierw czy systemy mówią to samo — także zgodnie „na nie”, gdy wszystkie milczą
        o temacie. Potem czego dotyczą zgodności i jak mocno. Na końcu, co z tego wynika dla Twojej drogi.
      </p>

      {/* ---------- 1. czy systemy mówią to samo ---------- */}
      <h3 className="sp-krok"><span>1</span> Czy systemy mówią to samo</h3>
      <div className="sp-wynik">
        <p><strong>{procent(s.obserwowana)}</strong> zgodności ocen <span className="muted">· przypadkiem wyszłoby ok. {procent(s.przypadek)}</span></p>
        <p className="muted">
          Ponad przypadek: <strong style={{ color: "var(--gold)" }}>{Math.round(s.kappa * 100)}%</strong>
          {" "}(0% = tyle, ile dałby przypadek; 100% = pełna zgodność) · zgodne na tak: {s.ile.zgodne_tak + s.ile.dwa_tak},
          {" "}zgodne na nie: {s.ile.zgodne_nie + s.ile.dwa_nie}, rozbieżne: {s.ile.rozbiezne}
        </p>
      </div>
      <div className="sp-tabela-wrap">
        <table className="sp-tabela sp-kompakt">
          <thead>
            <tr>
              <th>Temat</th>
              {SYSTEMY.map((x) => <th key={x} className="srodek">{NAZWA_SYSTEMU[x]}</th>)}
              <th>Spójność</th>
              <th className="srodek sp-rzadkosc-th" title="Jak często taki układ ocen wychodzi przypadkiem">Przypadkiem</th>
              <th className="srodek">Pkt</th>
            </tr>
          </thead>
          <tbody>
            {[...s.tematy].sort((a, b) => KOLEJNOSC.indexOf(a.rodzaj) - KOLEJNOSC.indexOf(b.rodzaj) || a.szansa - b.szansa).map((t) => (
              <Fragment key={t.temat.id}>
              <tr className={`${RODZAJ[t.rodzaj].klasa} sp-klik${otwarte.has(t.temat.id) ? " sp-otwarty" : ""}`} onClick={() => przelacz(t.temat.id)}>
                <td>
                  <button type="button" className="sp-rozwin" aria-expanded={otwarte.has(t.temat.id)}
                    onClick={(e) => { e.stopPropagation(); przelacz(t.temat.id); }}>
                    <span className="sp-strzalka" aria-hidden="true">▸</span>{t.temat.nazwa}
                  </button>
                </td>
                {SYSTEMY.map((x) => <td key={x} className="srodek sp-znak">{znak(t.wartosci[x])}</td>)}
                <td><span className="sp-rodzaj">{RODZAJ[t.rodzaj].tekst}</span><span className="sp-rz-tel">{rzadkosc(t.szansa)}</span></td>
                <td className="srodek sp-rzadkosc">{rzadkosc(t.szansa)}</td>
                <td className="srodek sp-pkt">{pkt(SYSTEMY.reduce((a, x) => a + (t.wartosci[x] ?? 0), 0))}<small>/{SYSTEMY.filter((x) => t.wartosci[x] !== undefined).length}</small></td>
              </tr>
              {otwarte.has(t.temat.id) && <tr className="sp-szcz-wiersz"><td colSpan={7}><Szczegoly temat={t.temat} /></td></tr>}
              </Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="sp-razem-wiersz">
              <td>Razem</td>
              {SYSTEMY.map((x) => <td key={x} className="srodek sp-pkt">{pkt(punktySystemu(x))}<small>/{maxSystemu(x)}</small></td>)}
              <td className="sp-razem-opis">{s.ile.zgodne_tak + s.ile.zgodne_nie} z {s.tematy.length} zgodne ×3</td>
              <td className="sp-rzadkosc" />
              <td className="srodek sp-pkt sp-pkt-razem">{pkt(punktyRazem)}<small>/{maxRazem}</small></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="sp-podsumowanie">
        <p className="sp-podsumowanie-liczba">{maxRazem ? Math.round((punktyRazem / maxRazem) * 100) : 0}%</p>
        <p>
          Systemy zebrały <strong>{pkt(punktyRazem)} z {maxRazem}</strong> możliwych punktów (✦ = 1, ◐ = ½; maksimum = liczba
          ocen z danymi, bez „?”). Kosmogram {pkt(punktySystemu("kosmogram"))}/{maxSystemu("kosmogram")}, dłoń {pkt(punktySystemu("dlon"))}/{maxSystemu("dlon")},
          {" "}numerologia {pkt(punktySystemu("numerologia"))}/{maxSystemu("numerologia")}. Zgodne we wszystkich trzech: {s.ile.zgodne_tak} na tak
          i {s.ile.zgodne_nie} na nie.
        </p>
      </div>
      <p className="muted porownanie-legenda">
        Kliknij wiersz, żeby zobaczyć, co w każdym systemie daje wynik. ✦ tak · ◐ częściowo · 0 sprawdzone, niezaznaczone · ? brak danych · „Przypadkiem” — jak często taki
        układ ocen wychodzi sam z siebie przy Twoim rozkładzie ocen; im rzadziej, tym mocniejsza zgodność.
      </p>

      {/* ---------- 2. czego dotyczą i z jaką siłą ---------- */}
      <h3 className="sp-krok"><span>2</span> Czego dotyczą zgodności i z jaką siłą</h3>
      {potwierdzone.length === 0 ? (
        <p className="muted">Żaden temat nie jest wskazany przez co najmniej dwa systemy.</p>
      ) : (
        <div className="sp-tabela-wrap">
          <table className="sp-tabela">
            <thead>
              <tr>
                <th>Temat</th>
                <th>Siła</th>
                <th>Co to pokazuje</th>
                <th className="srodek">Przypadkiem</th>
              </tr>
            </thead>
            <tbody>
              {potwierdzone.map((t) => (
                <tr key={t.temat.id}>
                  <td>
                    {t.temat.nazwa}
                    <span className="porownanie-pod muted">{t.temat.znaczenie}</span>
                  </td>
                  <td className="sp-sila">
                    <span className="sp-sila-tor"><span style={{ width: `${(t.temat.sila / 3) * 100}%` }} /></span>
                    <span className="sp-sila-liczba">{pkt(t.temat.sila)} / 3</span>
                  </td>
                  <td>
                    <ul className="sp-dowody">
                      {SYSTEMY.filter((x) => (t.wartosci[x] ?? 0) > 0).map((x) => {
                        const w = t.temat.wskazania[x];
                        return <li key={x}><strong>{NAZWA_SYSTEMU[x]}:</strong> {(w.dowody ?? [w.opis]).join("; ")}</li>;
                      })}
                    </ul>
                  </td>
                  <td className="srodek sp-rzadkosc">{rzadkosc(t.szansa)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {d.nieOs.length > 0 && (
        <p className="sp-nie-os">
          <strong>Zgodne na nie</strong> — wszystkie systemy milczą, więc to raczej nie jest Twoja oś:{" "}
          {d.nieOs.map((t) => t.nazwa).join(" · ")}.
          <span className="muted"> To brak sygnału, a nie dowód, że tego w Tobie nie ma.</span>
        </p>
      )}

      {/* ---------- 3. droga i talenty ---------- */}
      <h3 className="sp-krok"><span>3</span> Twoja droga i talenty</h3>
      <div className="sp-tabela-wrap">
        <table className="sp-tabela sp-droga">
          <tbody>
            <tr>
              <th scope="row">Kierunek</th>
              <td>
                {d.kierunek.length === 0 ? <span className="muted">Systemy nie wskazują wspólnie żadnego tematu.</span> : (
                  <>
                    <p className="sp-kierunek">{d.kierunek.slice(0, 2).map((t) => t.nazwa).join(" + ")}</p>
                    <p>{d.kierunek[0].wniosek}</p>
                    {d.kierunek[1] && <p className="muted" style={{ marginTop: 6 }}>{d.kierunek[1].wniosek}</p>}
                  </>
                )}
              </td>
            </tr>
            <tr>
              <th scope="row">Gdzie i jak</th>
              <td>
                {d.skupisko ? (
                  <p>
                    Skupisko {d.skupisko.planety.length} planet ({d.skupisko.planety.join(", ")}) w {d.skupisko.dom}. domu,
                    w znaku {d.skupisko.znak} — tu skupia się życie: <strong>{d.skupisko.dziedzina}</strong>.
                  </p>
                ) : <span className="muted">Brak skupiska trzech lub więcej planet w jednym domu — energia jest rozłożona szerzej.</span>}
              </td>
            </tr>
            <tr>
              <th scope="row">Talenty</th>
              <td>
                {d.talenty.length === 0 ? <span className="muted">Żaden talent nie wychodzi ponad 75% osób.</span> : (
                  <ul className="sp-talenty">
                    {d.talenty.map((t) => (
                      <li key={t.nazwa}>
                        <strong>{t.nazwa}</strong> — wyżej niż u {t.procent}% osób
                        <span className={t.potwierdza.length ? "sp-potw" : "sp-tylko"}>
                          {t.potwierdza.length
                            ? ` · potwierdza: ${t.potwierdza.map((x) => NAZWA_SYSTEMU[x].toLowerCase()).join(" i ")} (temat „${t.temat}”)`
                            : " · tylko kosmogram"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ fontSize: "0.74rem", marginTop: 10, lineHeight: 1.6 }}>
        Systemy nie są całkiem niezależne — numerologia wedyjska przypisuje cyfry planetom — więc wynik
        to wskazówka, nie dowód. Talenty liczone są tak samo jak w zakładce Talenty, na tle 20 000 losowych horoskopów.
      </p>
    </section>
  );
}
