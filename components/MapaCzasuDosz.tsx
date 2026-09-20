"use client";

import { useEffect, useMemo, useState } from "react";
import type { VedicChart } from "@/lib/astro/chart";
import { wykryteDosze, silaDoszy, KOLEJNOSC_KATEGORII_DOSZY, type Dosza } from "@/lib/astro/doshas";
import { GRAHAS } from "@/lib/astro/constants";
import { KATEGORIA_KOLOR_DOSZY } from "@/components/KoloDosz";
import { nazwaZPara, rokDlaWieku } from "@/lib/astro/mapaCzasuJogUtils";
import DymekOkresuDoszy from "@/components/DymekOkresuDoszy";
import OsCzasuMapa, { type KolumnaOsi } from "@/components/OsCzasuMapa";
import type { FazaZycia } from "@/components/MapaCzasuJog";

/**
 * MAPA CZASU DOSZ — odwrotność Mapy Czasu Jog: ta sama klasyczna zasada
 * (dosza daje się odczuć najsilniej w mahadaszy planety, która ją tworzy),
 * ale dla afflictions zamiast jog. Świadomie osobny wykres, nie kolumny
 * w tej samej mapie — nasycenie koloru u jog znaczy "lepiej", tu musi
 * znaczyć "dotkliwiej", więc dosze mają własną, ostrzegawczą paletę
 * (KoloDosz.tsx). Dosza zniesiona klasyczną regułą (Bhanga) zostaje
 * widoczna, ale wygaszona/przekreślona — to fakt o mapie, nie coś do ukrycia,
 * tak samo jak Neeczabhanga w jogach pokazuje zniesiony upadek.
 */

export interface WierszDoszy { dosza: Dosza; okna: FazaZycia[]; sila: number }

export default function MapaCzasuDosz({ chart, lifePhases }: { chart: VedicChart; lifePhases: FazaZycia[] }) {
  const [aktywnaDosza, setAktywnaDosza] = useState<string | null>(null);
  // Wybór KLIKNIĘCIEM (nie hover) — rozwija odpowiadającą pozycję w legendzie pod
  // wykresem, o pełne uzasadnienie ("U Ciebie: ..."), niezależnie od dymka na hover.
  const [wybranaDosza, setWybranaDosza] = useState<string | null>(null);

  function kliknijBelke(id: string) {
    setWybranaDosza((prev) => (prev === id ? null : id));
    document.getElementById(`dosza-legenda-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const dosze = useMemo(() => wykryteDosze(chart), [chart]);
  const posortowane = useMemo(
    () => [...dosze].sort((a, b) => KOLEJNOSC_KATEGORII_DOSZY.indexOf(a.kategoria) - KOLEJNOSC_KATEGORII_DOSZY.indexOf(b.kategoria)),
    [dosze],
  );
  const totalYears = Math.min(120, lifePhases[lifePhases.length - 1]?.toAge ?? 100);

  const wiersze = useMemo<WierszDoszy[]>(
    () => posortowane.map((d) => ({
      dosza: d,
      okna: lifePhases.filter((ph) => d.planety.includes(ph.lord)),
      sila: silaDoszy(chart, d),
    })),
    [posortowane, lifePhases, chart],
  );

  const kolumny = useMemo<KolumnaOsi[]>(
    () => wiersze.map(({ dosza, okna, sila }) => ({
      id: dosza.id,
      tytul: nazwaZPara(dosza),
      kolor: KATEGORIA_KOLOR_DOSZY[dosza.kategoria],
      etykieta: dosza.planety.map((p) => (
        <span key={p} style={{ color: GRAHAS[p].color, fontSize: "1.1rem" }}>{GRAHAS[p].symbol}</span>
      )),
      okna: okna.map((ph) => ({
        key: `${ph.lord}-${ph.fromAge}`,
        fromAge: ph.fromAge,
        toAge: ph.toAge,
        opacity: 0.5 + sila * 0.5,
        wygaszona: dosza.zniesiona,
        title: `${nazwaZPara(dosza)} — Mahadasha ${GRAHAS[ph.lord].pl} (${Math.round(ph.fromAge)}–${Math.round(ph.toAge)} lat, ${rokDlaWieku(chart.birth.date, ph.fromAge)}–${rokDlaWieku(chart.birth.date, ph.toAge)})${ph.current ? " — teraz" : ""}${dosza.zniesiona ? " · zniesiona" : ""}`,
        ariaLabel: `${nazwaZPara(dosza)} — mahadasha ${GRAHAS[ph.lord].pl}, ${Math.round(ph.fromAge)}–${Math.round(ph.toAge)} lat${dosza.zniesiona ? ", zniesiona" : ""}`,
      })),
    })),
    [wiersze, chart.birth.date],
  );

  const wybranyWiersz = wiersze.find((w) => w.dosza.id === wybranaDosza) ?? null;

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

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 6 }}>
        <p className="eyebrow" style={{ margin: 0 }}>Mapa czasu dosz</p>
      </div>
      <p className="muted" style={{ fontSize: "0.9rem", marginBottom: 20, lineHeight: 1.6 }}>
        Sama dosza jest STAŁA — obecna w Twojej mapie od urodzenia, nie znika i nie pojawia się w
        konkretnym roku. Oś poniżej nie pokazuje, KIEDY dosza „się pojawia" (jest cały czas), tylko
        kiedy jest najbardziej odczuwalna. Ta sama klasyczna zasada co w Mapie czasu jog, tylko w drugą stronę:{" "}
        <strong>dosza (klasyczne obciążenie) daje się odczuć najsilniej w mahadashy
        planety, która ją tworzy</strong>. Odcinek zaczyna się i kończy dokładnie na
        granicach tej mahadashy. Dosza zniesiona klasyczną regułą (np. mocny Mars we
        własnym znaku znosi Mangal Doszę) zostaje pokazana — ale wygaszona i
        przekreślona, żeby było widać, że teoretyczne obciążenie w Twojej mapie
        nie działa w pełni. Złota przerywana linia to Twój wiek dziś.
      </p>

      {posortowane.length === 0 ? (
        <p className="muted" style={{ fontSize: "0.88rem" }}>
          Żadna z pięciu sprawdzanych dosz nie wystąpiła w tej mapie — nie ma czego
          nanosić na oś czasu.
        </p>
      ) : (
        <OsCzasuMapa
          birth={chart.birth.date} lifePhases={lifePhases} kolumny={kolumny}
          totalYears={totalYears} wiekTeraz={wiekTeraz}
          aktywnaKolumna={aktywnaDosza} setAktywnaKolumna={setAktywnaDosza}
          renderDymek={(faza) => (
            <DymekOkresuDoszy birth={chart.birth.date} faza={faza}
              dosze={wiersze.filter((w) => w.okna.includes(faza)).map((w) => w.dosza)} />
          )}
          onKlikBelki={kliknijBelke}
        />
      )}

      {/* znaczenie każdej doszy — zawsze widoczne, nie tylko po najechaniu na odcinek.
          Nagłówek i szary opis w karcie NIE zmieniają się po kliknięciu — rozszerzony
          opis idzie do osobnej sekcji na pełną szerokość panelu, poniżej całej siatki. */}
      {posortowane.length > 0 && (
        <div className="synteza-lista" style={{ marginTop: 20, gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))" }}>
          {posortowane.map((d) => (
            <div key={d.id} id={`dosza-legenda-${d.id}`}
              className={`synteza-rzad${d.zniesiona ? " zamkniety" : ""}${aktywnaDosza === d.id || wybranaDosza === d.id ? " aktywny" : ""}`}
              style={{ ["--k" as string]: KATEGORIA_KOLOR_DOSZY[d.kategoria], cursor: "pointer" }}
              role="button" tabIndex={0} aria-expanded={wybranaDosza === d.id}
              onMouseEnter={() => setAktywnaDosza(d.id)}
              onMouseLeave={() => setAktywnaDosza(null)}
              onClick={() => setWybranaDosza((prev) => (prev === d.id ? null : d.id))}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setWybranaDosza((prev) => (prev === d.id ? null : d.id)); } }}>
              <span className="synteza-glif">
                {d.planety.map((p) => (
                  <span key={p} style={{ color: GRAHAS[p].color }}>{GRAHAS[p].symbol}</span>
                ))}
              </span>
              <div style={{ minWidth: 0 }}>
                <p className="synteza-wynik"><strong>{nazwaZPara(d)}</strong></p>
                <p className="synteza-dlaczego">{d.ryzyko}</p>
                {d.zniesiona && (
                  <p className="synteza-dlaczego" style={{ marginTop: 2 }}>Zniesiona: {d.powodZniesienia}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* rozszerzony opis wybranej doszy — osobna sekcja na pełną szerokość panelu,
          pod całą siatką kart, nietykająca ich rozmiaru ani układu */}
      {wybranyWiersz && (
        <div style={{
          marginTop: 14, padding: "16px 18px", borderRadius: 12,
          background: "rgba(230,196,138,0.05)", border: "1px solid var(--line-gold)",
          position: "relative",
        }}>
          <button type="button" aria-label="Zamknij" onClick={() => setWybranaDosza(null)}
            style={{
              position: "absolute", top: 12, right: 12, width: 24, height: 24, borderRadius: "50%",
              background: "transparent", border: "1px solid var(--line-soft)", color: "var(--muted)",
              fontSize: "0.85rem", lineHeight: 1, cursor: "pointer",
            }}>×</button>
          <p style={{
            margin: "0 0 6px", fontFamily: "var(--font-serif)", fontSize: "1.05rem", paddingRight: 30,
            textDecoration: wybranyWiersz.dosza.zniesiona ? "line-through" : "none",
            textDecorationColor: "rgba(255,255,255,0.4)",
          }}>
            {nazwaZPara(wybranyWiersz.dosza)}
          </p>
          <p className="muted" style={{ margin: "0 0 10px", fontSize: "0.88rem", lineHeight: 1.6 }}>
            {wybranyWiersz.dosza.ryzyko}.
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
          {wybranyWiersz.dosza.zniesiona && (
            <p className="muted" style={{ margin: "0 0 10px", fontSize: "0.85rem", lineHeight: 1.6 }}>
              Zniesiona: {wybranyWiersz.dosza.powodZniesienia}
            </p>
          )}
          <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.6, color: "var(--sand)" }}>
            U Ciebie: {wybranyWiersz.dosza.uzasadnienie}
          </p>
        </div>
      )}
    </div>
  );
}
