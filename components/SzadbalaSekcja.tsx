"use client";

import { useMemo, useState } from "react";
import type { VedicChart } from "@/lib/astro/chart";
import { GRAHAS } from "@/lib/astro/constants";
import { szadbala, GRAHY_SZADBALI, type WynikSzadbali } from "@/lib/astro/shadbala";
import Term from "@/components/Term";

/**
 * SZADBALA — ranking 7 grah wg sumy sześciu klasycznych składników (Sthana,
 * Dig, Naisargika, Czeszta, Drik, Kala Bala), gdzie Kala Bala to pełny
 * zestaw: Paksza, Nathonnata, Tribhaga, Dina, Hora, Warsza, Masa, Ajana i
 * Juddha. Kilka podskładników (Czeszta, Drik, kwota Juddhy) to świadome
 * uproszczenia wobec niejednoznacznych źródeł (patrz nagłówek shadbala.ts)
 * — dlatego suma wciąż nie jest co do jedności porównywalna z klasycznym
 * minimum BPHS, choć rząd wielkości powinien być zbliżony.
 */

export default function SzadbalaSekcja({ chart }: { chart: VedicChart }) {
  const [rozwinieta, setRozwinieta] = useState<string | null>(null);
  const dane = useMemo(
    () => GRAHY_SZADBALI
      .map((id) => ({ id, w: szadbala(chart, id) }))
      .filter((d): d is { id: typeof d.id; w: WynikSzadbali } => d.w !== null)
      .sort((a, b) => b.w.razemRupy - a.w.razemRupy),
    [chart],
  );
  if (dane.length === 0) return null;

  const maxRupy = Math.max(...dane.map((d) => d.w.razemRupy));
  const najsilniejsza = dane[0];
  const najslabsza = dane[dane.length - 1];
  // tercjale WZGLĘDEM SIEBIE w tej mapie — nie wobec klasycznego minimum BPHS (nieporównywalnego, bo Kala Bala częściowa)
  const gornaTercja = Math.ceil(dane.length / 3);
  const dolnaTercja = dane.length - gornaTercja;

  return (
    <details className="card" style={{ marginBottom: 24 }}>
      <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)", marginBottom: 6 }}>
        <Term k="szadbala">Szadbala</Term>
      </summary>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 8, lineHeight: 1.55 }}>
        Klasyczna, liczbowa sześcioraka siła planet — pozycyjna (Sthana), kierunkowa (Dig), naturalna
        (Naisargika), ruchu (Czeszta), aspektu (Drik) i czasowa (Kala — faza Księżyca, pora dnia/nocy,
        trzecia dnia/nocy, dzień tygodnia, godzina planetarna, władca roku i miesiąca oraz deklinacja
        planety w chwili urodzenia).
      </p>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 8, lineHeight: 1.55 }}>
        <strong style={{ color: "var(--sand)" }}>Jak to czytać:</strong> liczba sama w sobie nic nie mówi —
        liczy się TYLKO porównanie między planetami w TEJ mapie, nie odległość od jakiegoś uniwersalnego
        progu (kilka podskładników — Czeszta, Drik, kwota Juddhy — to świadome uproszczenia wobec
        niejednoznacznych źródeł, więc suma nie jest co do jedności wprost porównywalna z klasycznym
        minimum BPHS). Kolor pokazuje właśnie porównanie W TEJ MAPIE: <span style={{ color: "#6fbf9f" }}>zielony</span> —
        {" "}górna tercja w tej mapie, realizuje swoje obietnice najpełniej i najbardziej niezawodnie;
        {" "}złoty — środek stawki; <span style={{ color: "#e08a63" }}>pomarańczowy</span> — dolna tercja,
        wciąż realna siła, ale częściej z opóźnieniem albo wymaga świadomego wysiłku, nie „wada".
      </p>
      <p className="muted" style={{ fontSize: "0.82rem", marginBottom: 8, lineHeight: 1.55 }}>
        W tej mapie najsilniejsza jest <strong style={{ color: "var(--sand)" }}>{GRAHAS[najsilniejsza.id].pl}</strong>{" "}
        ({najsilniejsza.w.razemRupy.toFixed(2)} rupy), najsłabsza —{" "}
        <strong style={{ color: "var(--sand)" }}>{GRAHAS[najslabsza.id].pl}</strong> ({najslabsza.w.razemRupy.toFixed(2)} rupy).
      </p>
      <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 18, lineHeight: 1.55, fontStyle: "italic" }}>
        Ta lista nie unieważnia tego, co mówią godność (egzaltacja/upadek) czy Atmakaraka wyżej na
        stronie — odpowiada na INNE pytanie. Godność mówi, JAK dana energia się wyraża (szlachetnie
        czy pod górkę); Atmakaraka mówi, CO ta planeta znaczy dla Ciebie (główny temat duszy);
        Szadbala mówi, ILE ma łącznej mocy sprawczej z wielu technicznych czynników naraz. Planeta
        może być jednocześnie w egzaltacji, Atmakaraką i nisko tutaj — to nie sprzeczność, tylko
        wskazówka, że jej temat może potrzebować więcej świadomego wysiłku lub dobrego timingu, żeby
        w pełni się zmaterializować. Nie sumuj ani nie porównuj tych systemów wprost.
      </p>
      <div style={{ display: "grid", gap: 4, marginTop: 18 }}>
        {dane.map(({ id, w }, i) => {
          const g = GRAHAS[id];
          const pct = Math.max(6, (w.razemRupy / maxRupy) * 100);
          const rozw = rozwinieta === id;
          const kolorPaska = i < gornaTercja ? "#6fbf9f" : i >= dolnaTercja ? "#e08a63" : "rgba(230,196,138,0.7)";
          return (
            <div key={id}>
              <div
                role="button" tabIndex={0} aria-expanded={rozw}
                onClick={() => setRozwinieta(rozw ? null : id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setRozwinieta(rozw ? null : id); } }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 8, cursor: "pointer",
                  background: rozw ? "rgba(255,255,255,0.04)" : "transparent", transition: "background 0.2s",
                }}>
                <span style={{ width: 20, textAlign: "center", color: g.color, fontSize: "1.05rem" }}>{g.symbol}</span>
                <span style={{ width: 74, fontSize: "0.84rem", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                  {g.pl}
                  {w.juddha !== 0 && (
                    <span className={w.juddha > 0 ? "badge badge-good" : "badge badge-warn"} style={{ fontSize: "0.66rem", padding: "1px 5px" }} title="Graha Juddha — wojna planet">
                      ⚔
                    </span>
                  )}
                </span>
                <div style={{ flex: 1, minWidth: 40, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: kolorPaska, transition: "width 0.5s var(--ease-out)" }} />
                </div>
                <span className="muted" style={{ fontSize: "0.78rem", width: 90, textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                  {w.razemRupy.toFixed(2)} rupy
                </span>
              </div>
              {rozw && (
                <div style={{ margin: "4px 0 10px 38px", fontSize: "0.82rem", lineHeight: 1.6 }}>
                  <p className="muted" style={{ marginBottom: 4 }}>
                    Naisargika {w.naisargika.toFixed(1)} · Dig {w.dig?.toFixed(1) ?? "—"} ·
                    {" "}Sthana {w.sthana?.razem.toFixed(1) ?? "—"} ·
                    {" "}Czeszta {w.czeszta?.toFixed(1) ?? "brak (zamiennik poza zakresem)"} ·
                    {" "}Drik {w.drik >= 0 ? "+" : ""}{w.drik.toFixed(1)}
                  </p>
                  <p className="muted" style={{ marginBottom: 4, fontSize: "0.76rem" }}>
                    Kala: Paksza {w.paksza.toFixed(1)} · Nathonnata {w.nathonnata?.toFixed(1) ?? "—"} ·
                    {" "}Tribhaga {w.tribhaga ?? "—"} · Dina {w.dina ?? "—"} · Hora {w.hora ?? "—"} ·
                    {" "}Warsza {w.warsza ?? "—"} · Masa {w.masa ?? "—"} ·
                    {" "}Ajana {w.ajana.toFixed(1)} · Juddha {w.juddha >= 0 ? "+" : ""}{w.juddha.toFixed(1)}
                  </p>
                  {w.sthana && (
                    <p className="muted" style={{ fontSize: "0.76rem" }}>
                      Sthana: Uczcza {w.sthana.uczcza.toFixed(1)} · Saptawargadźa {w.sthana.saptawargadza.toFixed(1)} ·
                      {" "}Odźajugmaraśjamsza {w.sthana.odzajugma} · Kendradi {w.sthana.kendradi} · Drekkana {w.sthana.drekkana}
                    </p>
                  )}
                  <p className="muted" style={{ fontSize: "0.76rem", marginTop: 4 }}>
                    Klasyczne minimum BPHS (dla pełnej, sześciorakiej Szadbali): {(w.wymaganeRupy).toFixed(1)} rupy —
                    orientacyjnie, nie co do jedności (patrz uproszczenia wyżej na stronie).
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <details style={{ marginTop: 18 }}>
        <summary style={{ cursor: "pointer", fontSize: "0.82rem", color: "var(--sand)" }}>
          Metodologia — co jest pewne, a co uproszczone
        </summary>
        <div style={{ marginTop: 10, fontSize: "0.8rem", lineHeight: 1.6 }}>
          <p className="muted" style={{ marginBottom: 10 }}>
            Szadbala liczona jest tylko dla siedmiu grah klasycznych (jak Asztakawarga) — Rahu/Ketu nie
            mają w BPHS własnej tabeli. Część składników ma w dostępnych źródłach jednoznaczne,
            zgodne potwierdzenie; część opiera się na świadomie wybranej konwencji tam, gdzie źródła
            się rozjeżdżają (nie zgadujemy dokładnych progów bez dostępu do oryginału BPHS w sanskrycie).
          </p>

          <p style={{ marginBottom: 4, color: "#6fbf9f", fontWeight: 600 }}>Pewne (wiele zgodnych źródeł)</p>
          <ul className="muted" style={{ margin: "0 0 12px", paddingLeft: 18 }}>
            <li>Naisargika Bala — stałe wartości.</li>
            <li>Dig Bala — czysty wzór kątowy z policzonego MC/Ascendentu.</li>
            <li>Sthana Bala: Uczcza, Saptawargadźa, Kendradi, Odźajugmaraśjamsza, Drekkana Bala.</li>
            <li>Kala Bala: Paksza (faza Księżyca), Tribhaga (reguła binarna), Dina, Hora, Ajana.</li>
          </ul>

          <p style={{ marginBottom: 4, color: "#e08a63", fontWeight: 600 }}>Świadomie uproszczone</p>
          <ul className="muted" style={{ margin: 0, paddingLeft: 18 }}>
            <li>
              <strong style={{ color: "var(--sand)" }}>Czeszta Bala</strong> — ciągła interpolacja wg
              realnej prędkości względem średniej, zamiast ośmiu nazwanych stanów (Wakra/Anuwakra/...),
              których dokładne progi prędkości różnią się między źródłami.
            </li>
            <li>
              <strong style={{ color: "var(--sand)" }}>Drik Bala</strong> — krzywa siły aspektu wg
              odległości kątowej, interpolowana liniowo między potwierdzonymi punktami (0/30/60/90/120/150/180°).
            </li>
            <li>
              <strong style={{ color: "var(--sand)" }}>Nathonnata Bala</strong> — potwierdzone punkty
              (wschód/zachód, szczyt) interpolowane liniowo między nimi (brak potwierdzonej dokładnej
              krzywej trygonometrycznej w dostępnych źródłach).
            </li>
            <li>
              <strong style={{ color: "var(--sand)" }}>Warsza i Masa Bala</strong> (władca roku/miesiąca)
              — źródła różnią się co do epoki, od której liczyć narastające lata/miesiące. Przyjęta
              konwencja: władcą jest planeta dnia tygodnia, na który przypadła ostatnia sankranti przed
              urodzeniem (Mesza Sankranti dla roku, wejście Słońca w znak urodzenia dla miesiąca) —
              jednoznaczna metoda, bo dzień tygodnia jest faktem kalendarzowym niezależnym od epoki.
            </li>
            <li>
              <strong style={{ color: "var(--sand)" }}>Juddha Bala</strong> (wojna planet) — reguła
              zwycięstwa (większa szerokość ekliptyczna północna wygrywa, Wenus odwrotnie) jest
              potwierdzona wprost, ale dokładna kwota wymienianych wirup jest sporna. Przyjęta
              konwencja: połowa różnicy dotychczasowej Szadbali między dwoma przeciwnikami —
              umiarkowana wersja zamiast zgadywania mnożnika.
            </li>
          </ul>

          <p className="muted" style={{ marginTop: 12, fontSize: "0.76rem", fontStyle: "italic" }}>
            Suma powyżej to suma wszystkich policzonych składników — nic nie brakuje z klasycznego
            zestawu, ale porównanie z minimum BPHS pozostaje przybliżone przez te uproszczenia, nie
            przez pominięte części.
          </p>
        </div>
      </details>
    </details>
  );
}
