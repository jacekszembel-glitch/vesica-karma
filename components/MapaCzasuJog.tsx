"use client";

import { useEffect, useMemo, useState } from "react";
import type { VedicChart } from "@/lib/astro/chart";
import { wykryteJogi, KOLEJNOSC_KATEGORII, type Yoga } from "@/lib/astro/yogas";
import { GRAHAS, type PlanetId } from "@/lib/astro/constants";
import { ocenaWladcy } from "@/lib/astro/sila";
import { KATEGORIA_KOLOR } from "@/components/KoloJog";
import { nazwaZPara, opacityMocy, opisMocy, rokDlaWieku } from "@/lib/astro/mapaCzasuJogUtils";
import DymekOkresu from "@/components/DymekOkresu";
import OsCzasuMapa, { type KolumnaOsi } from "@/components/OsCzasuMapa";

/**
 * MAPA CZASU JOG — klasyczna zasada Jyotisz: joga daje się odczuć najsilniej
 * w mahadaszy (wielkim okresie) planety, która ją tworzy. Kolumna = joga,
 * czas płynie z góry na dół (w duchu Osi Życia). Odcinek zaczyna się
 * i kończy DOKŁADNIE na granicach mahadaszy; nasycenie koloru to siła tej
 * jogi w TEJ mapie (ocenaWladcy — te same wyliczenia co Predyspozycje).
 *
 * Wariant poziomy (tor = joga, oś = wiek) tymczasowo wyłączony z widoku —
 * kod zostaje w components/MapaCzasuJogPozioma.tsx, nieużywany, na wypadek
 * powrotu do niego.
 *
 * Świadomie tylko poziom mahadaszy (nie antardaszy) — inaczej okien robi
 * się kilkaset i wykres przestaje być czytelny.
 */

export interface FazaZycia { lord: PlanetId; fromAge: number; toAge: number; current: boolean }
export interface WierszJogi { joga: Yoga; okna: FazaZycia[]; moc: number }

export default function MapaCzasuJog({ chart, lifePhases }: { chart: VedicChart; lifePhases: FazaZycia[] }) {
  const [aktywnaJoga, setAktywnaJoga] = useState<string | null>(null);
  // Wybór KLIKNIĘCIEM (nie hover) — rozwija odpowiadającą pozycję w legendzie pod
  // wykresem, o pełne uzasadnienie ("U Ciebie: ..."), niezależnie od dymka na hover.
  const [wybranaJoga, setWybranaJoga] = useState<string | null>(null);

  function kliknijBelke(id: string) {
    setWybranaJoga((prev) => (prev === id ? null : id));
    document.getElementById(`joga-legenda-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const jogi = useMemo(() => wykryteJogi(chart), [chart]);
  const posortowane = useMemo(
    () => [...jogi].sort((a, b) => KOLEJNOSC_KATEGORII.indexOf(a.kategoria) - KOLEJNOSC_KATEGORII.indexOf(b.kategoria)),
    [jogi],
  );
  const totalYears = Math.min(120, lifePhases[lifePhases.length - 1]?.toAge ?? 100);

  const mocJogi = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const j of posortowane) {
      const punkty = j.planety.map((p) => ocenaWladcy(chart, p).punkty);
      mapa.set(j.id, punkty.reduce((s, x) => s + x, 0) / punkty.length);
    }
    return mapa;
  }, [posortowane, chart]);

  const wiersze = useMemo<WierszJogi[]>(
    () => posortowane.map((j) => ({
      joga: j,
      okna: lifePhases.filter((ph) => j.planety.includes(ph.lord)),
      moc: mocJogi.get(j.id) ?? 0,
    })),
    [posortowane, lifePhases, mocJogi],
  );

  const kolumny = useMemo<KolumnaOsi[]>(
    () => wiersze.map(({ joga, okna, moc }) => ({
      id: joga.id,
      tytul: nazwaZPara(joga),
      kolor: KATEGORIA_KOLOR[joga.kategoria],
      etykieta: joga.planety.map((p) => (
        <span key={p} style={{ color: GRAHAS[p].color, fontSize: "1.1rem" }}>{GRAHAS[p].symbol}</span>
      )),
      okna: okna.map((ph) => ({
        key: `${ph.lord}-${ph.fromAge}`,
        fromAge: ph.fromAge,
        toAge: ph.toAge,
        opacity: opacityMocy(moc),
        title: `${nazwaZPara(joga)} — Mahadasha ${GRAHAS[ph.lord].pl} (${Math.round(ph.fromAge)}–${Math.round(ph.toAge)} lat, ${rokDlaWieku(chart.birth.date, ph.fromAge)}–${rokDlaWieku(chart.birth.date, ph.toAge)})${ph.current ? " — teraz" : ""} · ${opisMocy(moc)}`,
        ariaLabel: `${nazwaZPara(joga)} — mahadasha ${GRAHAS[ph.lord].pl}, ${Math.round(ph.fromAge)}–${Math.round(ph.toAge)} lat, ${opisMocy(moc)}`,
      })),
    })),
    [wiersze, chart.birth.date],
  );

  const wybranyWiersz = wiersze.find((w) => w.joga.id === wybranaJoga) ?? null;

  // Date.now() poza efektem naruszałoby czystość renderu (react-hooks/purity) —
  // odczyt "teraz" odkładamy na po zamontowaniu.
  const [teraz, setTeraz] = useState<number | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- jedyny sposób na nieulotny odczyt "teraz" bez naruszania czystości renderu
  useEffect(() => { setTeraz(Date.now()); }, []);
  const wiekTeraz = useMemo(() => {
    if (teraz === null) return null;
    const lata = (teraz - chart.birth.date.getTime()) / (365.25 * 86400000);
    return lata >= 0 && lata <= totalYears ? lata : null;
  }, [teraz, chart.birth.date, totalYears]);

  if (!chart.angles) {
    return (
      <div className="card" style={{ marginBottom: 24 }}>
        <p className="eyebrow" style={{ marginBottom: 6 }}>Mapa czasu jog</p>
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          Bez znanej godziny urodzenia większość jog nie może być sprawdzona, więc nie ma czego
          nanieść na oś czasu.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 6 }}>
        <p className="eyebrow" style={{ margin: 0 }}>Mapa czasu jog</p>
      </div>
      <p className="muted" style={{ fontSize: "0.9rem", marginBottom: 20, lineHeight: 1.6 }}>
        Sama joga jest STAŁA — obecna w Twojej mapie od urodzenia, niezależnie od tego, jaki dziś
        mamy rok. Oś poniżej nie pokazuje, KIEDY joga „się pojawia" (jest cały czas), tylko kiedy
        jest najbardziej odczuwalna. Klasyczna zasada Jyotisz: joga daje się odczuć najsilniej w{" "}
        <strong>mahadashy planety, która ją tworzy</strong> — poza tym oknem jest raczej
        potencjałem niż działaniem. Odcinek zaczyna się i kończy dokładnie na granicach tej
        mahadashy, z przerwą tam, gdzie akurat rządzi inna planeta. Nasycenie koloru to{" "}
        <strong>siła tej jogi w Twojej mapie</strong> — im mocniejsza i mniej obciążona planeta
        ją tworzy, tym odcinek pełniejszy. Najedź na granicę mahadashy, żeby podświetlić cały ten
        okres — te jogi działają razem. Złota przerywana linia to Twój wiek dziś.
      </p>

      {posortowane.length === 0 ? (
        <p className="muted" style={{ fontSize: "0.88rem" }}>
          Żadna z siedmiu sprawdzanych jog nie wystąpiła w tej mapie — nie ma czego nanosić
          na oś czasu.
        </p>
      ) : (
        <OsCzasuMapa
          birth={chart.birth.date} lifePhases={lifePhases} kolumny={kolumny}
          totalYears={totalYears} wiekTeraz={wiekTeraz}
          aktywnaKolumna={aktywnaJoga} setAktywnaKolumna={setAktywnaJoga}
          renderDymek={(faza) => (
            <DymekOkresu birth={chart.birth.date} faza={faza}
              jogi={wiersze.filter((w) => w.okna.includes(faza)).map((w) => w.joga)} />
          )}
          onKlikBelki={kliknijBelke}
        />
      )}

      {/* znaczenie każdej jogi — zawsze widoczne, nie tylko po najechaniu na odcinek.
          Nagłówek i szary opis w karcie NIE zmieniają się po kliknięciu — rozszerzony
          opis idzie do osobnej sekcji na pełną szerokość panelu, poniżej całej siatki,
          żeby klik nigdy nie rozpychał ani nie przesuwał kart obok. */}
      {posortowane.length > 0 && (
        <div className="synteza-lista" style={{ marginTop: 20, gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))" }}>
          {posortowane.map((j) => (
            <div key={j.id} id={`joga-legenda-${j.id}`}
              className={`synteza-rzad${aktywnaJoga === j.id || wybranaJoga === j.id ? " aktywny" : ""}`}
              style={{ ["--k" as string]: KATEGORIA_KOLOR[j.kategoria], cursor: "pointer" }}
              role="button" tabIndex={0} aria-expanded={wybranaJoga === j.id}
              onMouseEnter={() => setAktywnaJoga(j.id)}
              onMouseLeave={() => setAktywnaJoga(null)}
              onClick={() => setWybranaJoga((prev) => (prev === j.id ? null : j.id))}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setWybranaJoga((prev) => (prev === j.id ? null : j.id)); } }}>
              <span className="synteza-glif">
                {j.planety.map((p) => (
                  <span key={p} style={{ color: GRAHAS[p].color }}>{GRAHAS[p].symbol}</span>
                ))}
              </span>
              <div style={{ minWidth: 0 }}>
                <p className="synteza-wynik"><strong>{nazwaZPara(j)}</strong></p>
                <p className="synteza-dlaczego">{j.znaczenie}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* rozszerzony opis wybranej jogi — osobna sekcja na pełną szerokość panelu,
          pod całą siatką kart, nietykająca ich rozmiaru ani układu */}
      {wybranyWiersz && (
        <div style={{
          marginTop: 14, padding: "16px 18px", borderRadius: 12,
          background: "rgba(230,196,138,0.05)", border: "1px solid var(--line-gold)",
          position: "relative",
        }}>
          <button type="button" aria-label="Zamknij" onClick={() => setWybranaJoga(null)}
            style={{
              position: "absolute", top: 12, right: 12, width: 24, height: 24, borderRadius: "50%",
              background: "transparent", border: "1px solid var(--line-soft)", color: "var(--muted)",
              fontSize: "0.85rem", lineHeight: 1, cursor: "pointer",
            }}>×</button>
          <p style={{ margin: "0 0 6px", fontFamily: "var(--font-serif)", fontSize: "1.05rem", paddingRight: 30 }}>
            {nazwaZPara(wybranyWiersz.joga)}
          </p>
          <p className="muted" style={{ margin: "0 0 10px", fontSize: "0.88rem", lineHeight: 1.6 }}>
            {wybranyWiersz.joga.znaczenie}.
          </p>
          <p className="muted" style={{ margin: "0 0 10px", fontSize: "0.82rem", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--text)" }}>Kiedy działa: </strong>
            {wybranyWiersz.okna.map((ph, i) => (
              <span key={i}>
                {i > 0 && ", "}
                mahadasha {GRAHAS[ph.lord].pl} ({Math.round(ph.fromAge)}–{Math.round(ph.toAge)} lat,{" "}
                {rokDlaWieku(chart.birth.date, ph.fromAge)}–{rokDlaWieku(chart.birth.date, ph.toAge)})
                {ph.current && " — trwa teraz"}
              </span>
            ))}.
          </p>
          <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.6, color: "var(--sand)" }}>
            U Ciebie: {wybranyWiersz.joga.uzasadnienie}
          </p>
        </div>
      )}
    </div>
  );
}
