"use client";

import { useMemo, useState } from "react";
import type { VedicChart } from "@/lib/astro/chart";
import {
  wykryteJogi, domZnaku, ETYKIETA_KATEGORII, KOLEJNOSC_KATEGORII,
  type Yoga, type KategoriaJogi,
} from "@/lib/astro/yogas";
import { GRAHAS, type PlanetId } from "@/lib/astro/constants";
import Term from "@/components/Term";
import KoloJog, { KATEGORIA_KOLOR } from "@/components/KoloJog";

/**
 * JOGI I SZCZĘŚCIE — pod Karaki Czarowe. Ten sam wzorzec co Mandala Syntezy
 * (/sciezka): diagram i legenda podświetlają się w obie strony, na dole
 * policzona synteza. Świadomie BEZ dosz (Mangal, Kalasarpa) — to osobny,
 * mniej „pozytywny" temat; ta sekcja odpowiada na „jakie mam predyspozycje
 * i szczęście", nie na afflictions.
 */

/** Cztery klasyczne cele życia — ten sam podział co w Profilu Duszy, żeby synteza mówiła tym samym językiem. */
const PURUSZARTHY = [
  { pl: "Dharmy", pod: "sens i droga", domy: [1, 5, 9] },
  { pl: "Arthy", pod: "środki i praca", domy: [2, 6, 10] },
  { pl: "Kamy", pod: "pragnienia i więzi", domy: [3, 7, 11] },
  { pl: "Mokszy", pod: "wolność i głębia", domy: [4, 8, 12] },
] as const;

function zbudujSyntezę(jogi: Yoga[], chart: VedicChart): string | null {
  if (jogi.length === 0 || !chart.angles) return null;
  const lagnaSign = chart.angles.lagnaSign;
  const planety = [...new Set(jogi.flatMap((j) => j.planety))] as PlanetId[];
  const domy = planety.map((id) => domZnaku(lagnaSign, chart.planets[id].sign));
  const liczby = PURUSZARTHY.map((g) => domy.filter((d) => (g.domy as readonly number[]).includes(d)).length);
  const maks = Math.max(...liczby);
  const zdania: string[] = [];
  if (maks > 0) {
    const grupa = PURUSZARTHY[liczby.indexOf(maks)];
    zdania.push(
      `Planety uwikłane w wykryte jogi skupiają się najmocniej w sferze ${grupa.pl} (${grupa.pod}) — ` +
      `to obszar, w którym Twoje szczęście i predyspozycje mają najsilniejsze oparcie.`,
    );
  }
  const licznik = new Map<KategoriaJogi, number>();
  for (const j of jogi) licznik.set(j.kategoria, (licznik.get(j.kategoria) ?? 0) + 1);
  const [topKat, topCount] = [...licznik.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCount > 1) {
    zdania.push(`Najliczniej reprezentowany typ to ${ETYKIETA_KATEGORII[topKat].split(" — ")[0]} jogi (${topCount}×).`);
  }
  return zdania.join(" ");
}

/** Jogi pasujące do aktualnie najechanego elementu diagramu (planeta albo konkretna nić/poświata). */
function jogiDlaAktywnego(aktywny: string | null, jogi: Yoga[]): Yoga[] {
  if (!aktywny) return [];
  if (aktywny.startsWith("planeta-")) {
    const id = aktywny.slice(8) as PlanetId;
    return jogi.filter((j) => j.planety.includes(id));
  }
  if (aktywny.startsWith("yoga-")) {
    const yid = aktywny.slice(5);
    return jogi.filter((j) => j.id === yid);
  }
  return [];
}

/** Jeden wiersz jogi — współdzielony przez panel kontekstowy (prawa strona) i pełną listę (dół). */
function WierszJogi({ j, podswietlona, onHover }: {
  j: Yoga; podswietlona: boolean; onHover: (v: string | null) => void;
}) {
  return (
    <div
      className={`synteza-rzad${podswietlona ? " aktywny" : ""}`}
      style={{ ["--k" as string]: KATEGORIA_KOLOR[j.kategoria] }}
      onMouseEnter={() => onHover(`yoga-${j.id}`)}
      onMouseLeave={() => onHover(null)}>
      <span className="synteza-glif">
        {j.planety.map((p) => (
          <span key={p} style={{ color: GRAHAS[p].color }}>{GRAHAS[p].symbol}</span>
        ))}
      </span>
      <div style={{ minWidth: 0 }}>
        <p className="synteza-wynik">
          <span className="synteza-dzial">{ETYKIETA_KATEGORII[j.kategoria]}</span>
          {" "}<strong>{j.nazwa}</strong> — {j.znaczenie}
        </p>
        <p className="synteza-dlaczego">{j.uzasadnienie}</p>
      </div>
    </div>
  );
}

export default function JogiISzczescie({ chart }: { chart: VedicChart }) {
  const [aktywny, setAktywny] = useState<string | null>(null);
  const jogi = useMemo(() => wykryteJogi(chart), [chart]);
  const posortowane = useMemo(
    () => [...jogi].sort((a, b) => KOLEJNOSC_KATEGORII.indexOf(a.kategoria) - KOLEJNOSC_KATEGORII.indexOf(b.kategoria)),
    [jogi],
  );
  const synteza = useMemo(() => zbudujSyntezę(posortowane, chart), [posortowane, chart]);
  const obecneKategorie = useMemo(
    () => KOLEJNOSC_KATEGORII.filter((k) => posortowane.some((j) => j.kategoria === k)),
    [posortowane],
  );

  return (
    <details className="card" style={{ marginBottom: 24 }} open>
      <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)", marginBottom: 6 }}>
        <Term k="jogiklasyczne">Jogi i szczęście</Term>
      </summary>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 18, lineHeight: 1.55 }}>
        Programowe przeszukanie mapy pod kątem siedmiu klasycznych jog pomyślności — pokazujemy
        tylko te, które faktycznie wystąpiły. Nić między dwiema planetami niżej to koniunkcja albo
        aspekt tworzący jogę; poświata wokół jednej planety — joga jednoplanetowa. Najedź na
        planetę lub nić, żeby zobaczyć uzasadnienie. Pełną listę ze szczegółami i tym, kiedy
        w życiu dana joga jest najsilniejsza, znajdziesz niżej w sekcji „Mapa czasu jog”. To nie
        jest pełny przegląd doszów (np. Mangal, Kalasarpa) — te są osobnym tematem.
      </p>

      {!chart.angles ? (
        <p className="muted" style={{ fontSize: "0.82rem" }}>
          Bez znanej godziny urodzenia domy są nieznane, więc większość jog (poza Gadźakesari
          i Budha-Aditja) nie może być sprawdzona.
        </p>
      ) : posortowane.length === 0 ? (
        <p className="muted" style={{ fontSize: "0.88rem" }}>
          Żadna z siedmiu sprawdzanych jog nie wystąpiła w tej mapie w klasycznej, ścisłej formie.
          To nie oznacza braku talentów czy szczęścia — te jogi to jeden z wielu klasycznych
          wskaźników, nie jedyny.
        </p>
      ) : (
        <>
          <div className="synteza-uklad" style={{ alignItems: "start" }}>
            {/* ── lewo: konstelacja ── */}
            <div>
              <div style={{ textAlign: "center" }}>
                <KoloJog chart={chart} jogi={posortowane} aktywny={aktywny} setAktywny={setAktywny} />
              </div>
              {/* legenda kolorów — kolor nici/poświaty na diagramie = kategoria jogi */}
              <div style={{ display: "flex", justifyContent: "center", gap: 16, rowGap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {obecneKategorie.map((k) => (
                  <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.76rem" }}>
                    <span style={{
                      width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
                      background: KATEGORIA_KOLOR[k], display: "inline-block",
                    }} />
                    <span className="muted">{ETYKIETA_KATEGORII[k]}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* ── prawo: panel kontekstowy — jogi najechanej planety/nici ── */}
            <div className="synteza-lista">
              {(() => {
                const wybrane = jogiDlaAktywnego(aktywny, posortowane);
                if (wybrane.length === 0) {
                  return (
                    <p className="muted" style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
                      Najedź na planetę (albo nić między nimi) na diagramie, żeby zobaczyć tu jej jogi.
                    </p>
                  );
                }
                return wybrane.map((j) => <WierszJogi key={j.id} j={j} podswietlona onHover={setAktywny} />);
              })()}
            </div>
          </div>
        </>
      )}

      {synteza && (
        <div style={{
          marginTop: 18, padding: "14px 18px", borderRadius: 10,
          background: "rgba(230,196,138,0.06)", border: "1px solid var(--line-gold)",
        }}>
          <p className="eyebrow" style={{ marginBottom: 6 }}>Synteza</p>
          <p style={{ fontSize: "0.9rem", lineHeight: 1.65 }}>{synteza}</p>
        </div>
      )}
    </details>
  );
}
