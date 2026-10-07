"use client";

import { Fragment, useState } from "react";
import { GRAHAS, type PlanetId } from "@/lib/astro/constants";
import { DOM, MIANOWNIK, ZNACZENIE, type Glos, type MapaPolaczen as Mapa, type PlanetaMapy, type RodzajPolaczenia } from "@/lib/astro/polaczenia";

/**
 * MAPA POŁĄCZEŃ (lib/astro/polaczenia.ts) — gdzie niebo i dłoń się spotykają, planeta po planecie.
 * Rysunek Vesica: lewe koło niebo (D1), prawe dłoń wiodąca, w części wspólnej planety, które się
 * łączą; złota obwódka = potwierdzają też liczby. Pod spodem cztery kroki: połączenia, dokąd prowadzą,
 * dopełnienie liczbami i kierunek. Wersja robocza pod tabelą 5.
 */

const RODZAJ: Record<RodzajPolaczenia, { tekst: string; klasa: string }> = {
  laczy: { tekst: "łączy się", klasa: "mp-laczy" },
  czesciowo: { tekst: "łączy się częściowo", klasa: "mp-czesc" },
  tylko_niebo: { tekst: "tylko niebo", klasa: "mp-jedno" },
  tylko_dlon: { tekst: "tylko dłoń", klasa: "mp-jedno" },
  w_tle: { tekst: "w tle", klasa: "mp-tlo" },
  brak_danych: { tekst: "brak danych dłoni", klasa: "mp-tlo" },
};
const znak = (g: Glos | null) => (g === null ? "?" : g === 1 ? "✦" : g === 0.5 ? "◐" : "0");
const laczy = (r: RodzajPolaczenia) => r === "laczy" || r === "czesciowo";

function Vesica({ planety }: { planety: PlanetaMapy[] }) {
  const lewe = planety.filter((p) => p.polaczenie === "tylko_niebo");
  const srodek = planety.filter((p) => laczy(p.polaczenie));
  const prawe = planety.filter((p) => p.polaczenie === "tylko_dlon");
  const tlo = planety.filter((p) => p.polaczenie === "w_tle" || p.polaczenie === "brak_danych");
  const kolumna = (lista: PlanetaMapy[], x: number) => lista.map((p, i) => {
    const krok = x === 300 ? Math.min(42, 180 / Math.max(1, lista.length - 1)) : 44;
    const y = 135 + (i - (lista.length - 1) / 2) * krok;
    return (
      <g key={p.planeta}>
        <title>{MIANOWNIK[p.planeta]}{p.liczby.glos > 0 ? " — potwierdzają też liczby" : ""}</title>
        {p.liczby.glos > 0 && <circle cx={x} cy={y} r={19} fill="none" stroke="var(--gold)" strokeWidth={2} />}
        <circle cx={x} cy={y} r={15} fill="rgba(230,196,138,0.14)" stroke="var(--sand)" strokeWidth={1} />
        <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="mp-glif">{GRAHAS[p.planeta].symbol}</text>
        {x !== 300 && (
          <text x={x + (x < 300 ? -26 : 26)} y={y} textAnchor={x < 300 ? "end" : "start"} dominantBaseline="central" className="mp-nazwa">{MIANOWNIK[p.planeta]}</text>
        )}
      </g>
    );
  });
  return (
    <svg viewBox="0 0 600 290" className="mp-vesica" role="img"
      aria-label={`Połączenia nieba i dłoni: łączą się ${srodek.map((p) => MIANOWNIK[p.planeta]).join(", ") || "żadne"}`}>
      <circle cx={225} cy={135} r={120} fill="rgba(230,196,138,0.06)" stroke="var(--sand)" strokeWidth={1.2} />
      <circle cx={375} cy={135} r={120} fill="rgba(230,196,138,0.06)" stroke="var(--sand)" strokeWidth={1.2} />
      <text x={150} y={22} textAnchor="middle" className="mp-kolo">Niebo · D1</text>
      <text x={450} y={22} textAnchor="middle" className="mp-kolo">Dłoń wiodąca</text>
      {kolumna(lewe, 160)}
      {kolumna(srodek, 300)}
      {kolumna(prawe, 440)}
      <text x={300} y={262} textAnchor="middle" className="mp-sr-txt">{srodek.length ? `łączą się: ${srodek.map((p) => MIANOWNIK[p.planeta]).join(", ")}` : ""}</text>
      {tlo.length > 0 && (
        <text x={300} y={282} textAnchor="middle" className="mp-tlo-txt">w tle: {tlo.map((p) => MIANOWNIK[p.planeta]).join(", ")}</text>
      )}
    </svg>
  );
}

function Szczegoly({ p }: { p: PlanetaMapy }) {
  return (
    <div className="sp-szczegoly">
      <p className="sp-szcz-znaczenie">{MIANOWNIK[p.planeta]}: {ZNACZENIE[p.planeta]}</p>
      <ul>
        <li className={p.niebo.glos > 0 ? "sp-szcz-ma" : ""}>
          <span className="sp-szcz-nazwa">Niebo — D1</span><span className="sp-szcz-znak">{znak(p.niebo.glos)}</span>
          <span className="sp-szcz-tresc">
            {p.niebo.dom ? `${p.niebo.dom}. dom (${DOM[p.niebo.dom]}), ` : ""}znak {p.niebo.znak}
            {p.niebo.powody.length ? ` — ${p.niebo.powody.join("; ")}` : " — bez szczególnych ról w horoskopie"}
          </span>
        </li>
        <li className={p.wiodaca.glos ? "sp-szcz-ma" : ""}>
          <span className="sp-szcz-nazwa">Dłoń wiodąca</span><span className="sp-szcz-znak">{znak(p.wiodaca.glos)}</span>
          <span className="sp-szcz-tresc">{p.wiodaca.glos === null ? "brak danych" : p.wiodaca.dowody.join("; ") || "wzgórek, linia i znaki bez wyróżnień"}</span>
        </li>
        <li className={p.niebo9.glos > 0 ? "sp-szcz-ma" : ""}>
          <span className="sp-szcz-nazwa">Niebo — D9</span><span className="sp-szcz-znak">{znak(p.niebo9.glos)}</span>
          <span className="sp-szcz-tresc">{p.niebo9.dom ? `${p.niebo9.dom}. dom nawamszy, ` : ""}znak {p.niebo9.znak}</span>
        </li>
        <li className={p.bierna.glos ? "sp-szcz-ma" : ""}>
          <span className="sp-szcz-nazwa">Dłoń bierna</span><span className="sp-szcz-znak">{znak(p.bierna.glos)}</span>
          <span className="sp-szcz-tresc">{p.bierna.glos === null ? "brak danych" : p.bierna.dowody.join("; ") || "bez wyróżnień (sprawdzone tylko to, co zapisał odczyt)"}</span>
        </li>
        {p.mosty.map((m, i) => (
          <li key={i} className={m.potwierdza ? "sp-szcz-ma" : ""}>
            <span className="sp-szcz-nazwa">Most</span><span className="sp-szcz-znak">{m.potwierdza ? "✦" : m.potwierdza === false ? "0" : "◐"}</span>
            <span className="sp-szcz-tresc">{m.dlon} ↔ {m.warunek}</span>
          </li>
        ))}
        <li className={p.liczby.glos ? "sp-szcz-ma" : ""}>
          <span className="sp-szcz-nazwa">Liczby</span><span className="sp-szcz-znak">{p.liczby.glos ? znak(p.liczby.glos) : "—"}</span>
          <span className="sp-szcz-tresc">{p.liczby.cyfra}{p.liczby.role.length ? ` — ${p.liczby.role.join(", ")}` : " — nie ma jej wśród Twoich liczb"}</span>
        </li>
      </ul>
    </div>
  );
}

export default function MapaPolaczen({ mapa }: { mapa: Mapa }) {
  const [otwarte, setOtwarte] = useState<Set<PlanetId>>(new Set());
  const przelacz = (id: PlanetId) => setOtwarte((o) => {
    const n = new Set(o);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const wg = [...mapa.planety].sort((a, b) => b.sila - a.sila);
  // najpierw połączenia D1 ↔ ręka wiodąca (to, co budujesz), potem tylko w głębi (D9 ↔ ręka bierna)
  const naWierzchu = wg.filter((p) => laczy(p.polaczenie));
  const wGlebi = wg.filter((p) => !laczy(p.polaczenie) && laczy(p.polaczenie9));
  const drogowskazy = [...naWierzchu, ...wGlebi];
  const liczbowe = wg.filter((p) => p.liczby.glos > 0);
  const glowne = (naWierzchu.length ? naWierzchu : wGlebi).slice(0, 2);
  const tr = mapa.teraz;
  const czyLaczy = (id: PlanetId) => drogowskazy.some((p) => p.planeta === id);
  const domPl = (id: PlanetId) => mapa.planety.find((p) => p.planeta === id)?.niebo.dom ?? null;

  return (
    <section className="sp-sekcja mp" style={{ textAlign: "left" }}>
      <h2 className="porownanie-tytul">Mapa połączeń</h2>
      <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.75 }}>
        Dłoń i kosmogram to dwa zapisy tego samego. Wspólnym językiem są planety: w niebie planeta ma siłę
        i dom, w dłoni — wzgórek, linię i znaki. Tu widać, gdzie oba zapisy się spotykają, dokąd prowadzi
        każde spotkanie, co dopełniają liczby i którędy iść teraz.
      </p>
      <Vesica planety={mapa.planety} />
      <p className="muted porownanie-legenda" style={{ justifyContent: "center" }}>
        W części wspólnej — planety, które podkreśla i niebo, i dłoń · złota obwódka — potwierdzają też liczby
      </p>

      {/* ---------- 1 ---------- */}
      <h3 className="sp-krok"><span>1</span> Gdzie niebo i dłoń się łączą</h3>
      <div className="sp-tabela-wrap">
        <table className="sp-tabela sp-waska">
          <thead>
            <tr>
              <th>Planeta</th>
              <th className="srodek">D1<span className="sp-pod">niebo</span></th>
              <th className="srodek">Wiodąca<span className="sp-pod">dłoń</span></th>
              <th className="srodek">D9<span className="sp-pod">niebo</span></th>
              <th className="srodek">Bierna<span className="sp-pod">dłoń</span></th>
              <th>Połączenie</th>
            </tr>
          </thead>
          <tbody>
            {wg.map((p) => (
              <Fragment key={p.planeta}>
                <tr className={`sp-klik ${RODZAJ[p.polaczenie].klasa}${otwarte.has(p.planeta) ? " sp-otwarty" : ""}`} onClick={() => przelacz(p.planeta)}>
                  <td>
                    <button type="button" className="sp-rozwin" aria-expanded={otwarte.has(p.planeta)}
                      onClick={(e) => { e.stopPropagation(); przelacz(p.planeta); }}>
                      <span className="sp-strzalka" aria-hidden="true">▸</span>
                      <span className="mp-glif-tab">{GRAHAS[p.planeta].symbol}</span> {MIANOWNIK[p.planeta]}
                    </button>
                  </td>
                  <td className="srodek sp-znak">{znak(p.niebo.glos)}</td>
                  <td className="srodek sp-znak">{znak(p.wiodaca.glos)}</td>
                  <td className="srodek sp-znak">{znak(p.niebo9.glos)}</td>
                  <td className="srodek sp-znak">{znak(p.bierna.glos)}</td>
                  <td>
                    <span className="sp-rodzaj mp-rodzaj">{RODZAJ[p.polaczenie].tekst}</span>
                    {laczy(p.polaczenie9) && <span className="mp-d9"> + w głębi (D9)</span>}
                    {p.liczby.glos > 0 && <span className="sp-num-potw"> + liczby</span>}
                  </td>
                </tr>
                {otwarte.has(p.planeta) && <tr className="sp-szcz-wiersz"><td colSpan={6}><Szczegoly p={p} /></td></tr>}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted porownanie-legenda">
        Kliknij planetę, żeby zobaczyć, co ją podkreśla. Niebo: ✦ jedna z trzech najwyrazistszych planet horoskopu, ◐ środek, 0 w tle.
        Dłoń: ✦ wyraźnie (wydatny wzgórek albo linia i znak), ◐ zaznaczona, 0 bez wyróżnień, ? brak danych.
      </p>

      {/* ---------- 2 ---------- */}
      <h3 className="sp-krok"><span>2</span> Dokąd prowadzą połączenia</h3>
      {drogowskazy.length === 0 ? <p className="muted">Niebo i dłoń nie podkreślają wspólnie żadnej planety.</p> : (
        <ul className="mp-drogowskazy">
          {drogowskazy.map((p) => (
            <li key={p.planeta}>
              <p className="mp-dr-tytul"><span className="mp-glif-tab">{GRAHAS[p.planeta].symbol}</span> {MIANOWNIK[p.planeta]} — {ZNACZENIE[p.planeta]}</p>
              <p><strong>Gdzie:</strong> {p.niebo.dom ? `${p.niebo.dom}. dom — ${DOM[p.niebo.dom]}` : "brak domów (nieznana godzina)"}</p>
              {p.wiodaca.dowody.length > 0 && <p><strong>Jak (dłoń):</strong> {p.wiodaca.dowody.join("; ")}</p>}
              {laczy(p.polaczenie9) && (
                <p><strong>W głębi (D9 i ręka bierna):</strong> {p.niebo9.dom ? `${p.niebo9.dom}. dom nawamszy` : ""}{p.bierna.dowody.length ? ` · ${p.bierna.dowody.join("; ")}` : ""}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ---------- 3 ---------- */}
      <h3 className="sp-krok"><span>3</span> Dopełnienie liczbami</h3>
      {liczbowe.length === 0 ? <p className="muted">Twoje liczby nie wskazują żadnej planety wyraźnie.</p> : (
        <ul className="mp-liczby">
          {liczbowe.map((p) => (
            <li key={p.planeta}>
              <strong>{p.liczby.cyfra} — {MIANOWNIK[p.planeta]}</strong> ({p.liczby.role.join(", ")})
              {" "}{czyLaczy(p.planeta)
                ? <span className="sp-potw">· potwierdza połączenie nieba i dłoni</span>
                : <span className="sp-tylko">· tylko w liczbach — niebo i dłoń tej planety razem nie podkreślają</span>}
            </li>
          ))}
        </ul>
      )}

      {/* ---------- 4 ---------- */}
      <h3 className="sp-krok"><span>4</span> Kierunek — którędy iść</h3>
      <div className="mp-kierunek">
        {glowne.length > 0 && (
          <p>
            <strong className="mp-k-tytul">Główny kierunek:</strong>{" "}
            {glowne.map((p, i) => (
              <span key={p.planeta}>
                {i > 0 && " oraz "}
                {ZNACZENIE[p.planeta]} ({MIANOWNIK[p.planeta]}){p.niebo.dom ? ` w sferze: ${DOM[p.niebo.dom]}` : ""}
              </span>
            ))}.
          </p>
        )}
        {tr && (
          <p>
            <strong className="mp-k-tytul">Teraz:</strong> okres {MIANOWNIK[tr.md]} do {tr.mdDo}
            {tr.ad ? `, podokres ${MIANOWNIK[tr.ad]} do ${tr.adDo}` : ""}.{" "}
            {[tr.md, tr.ad].filter((x): x is PlanetId => !!x).map((x) => (
              <span key={x}>
                {MIANOWNIK[x]} {czyLaczy(x)
                  ? `to jedno z Twoich połączeń — ta droga jest teraz otwarta${domPl(x) ? ` (${DOM[domPl(x)!]})` : ""}. `
                  : "nie należy do połączeń nieba i dłoni. "}
              </span>
            ))}
          </p>
        )}
        {mapa.nastepne && (
          <p>
            <strong className="mp-k-tytul">Następne okno:</strong> {mapa.nastepne.poziom} {MIANOWNIK[mapa.nastepne.planeta]} od {mapa.nastepne.od} —
            {" "}otwiera połączenie „{ZNACZENIE[mapa.nastepne.planeta]}”{domPl(mapa.nastepne.planeta) ? ` w sferze: ${DOM[domPl(mapa.nastepne.planeta)!]}` : ""}.
          </p>
        )}
      </div>
    </section>
  );
}
