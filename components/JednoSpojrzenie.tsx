"use client";

import type { VedicChart } from "@/lib/astro/chart";
import { GRAHAS, RASIS } from "@/lib/astro/constants";
import { atmakaraka } from "@/lib/astro/karaki";
import { navamsaChart } from "@/lib/astro/varga";
import { szadbala, GRAHY_SZADBALI, type WynikSzadbali } from "@/lib/astro/shadbala";
import { bhinnasztakawarga, sarwasztakawarga } from "@/lib/astro/ashtakavarga";
import Term from "@/components/Term";

/**
 * JEDNO SPOJRZENIE — pięć działów kosmogramu zebranych wokół atmakaraki
 * (wskaźnika duszy w systemie Dżajminiego): sama atmakaraka, jej fundament
 * duchowy (karakamsza — znak atmakaraki w nawamszy D9), najsilniejsza planeta
 * w mapie (Szadbala), wsparcie znaku atmakaraki od całej mapy (Sarwasztakawarga)
 * i władca aktualnie trwającej mahaszy. Wygląd 1:1 wg public/brand/jedno-spojrzenie.jpg
 * — złoto wszędzie (jak reszta serwisu), bez osobnego systemu kolorów tonu.
 */

const ELEMENT_DOPELNIACZ: Record<string, string> = {
  "ogień": "ognia", "ziemia": "ziemi", "powietrze": "powietrza", "woda": "wody",
};

const OPIS_ZYWIOLU: Record<string, string> = {
  "ogień": "co skłania Cię do śmiałego, szybkiego działania — łatwiej Ci zacząć, niż długo czekać",
  "ziemia": "co skłania Cię do praktycznego, cierpliwego podejścia — bliżej Ci do sprawdzonych metod niż ryzykownych eksperymentów",
  "powietrze": "co skłania Cię do szukania słów i wymiany myśli — łatwiej Ci nazwać emocje, niż je po prostu przeżyć",
  "woda": "co skłania Cię do kierowania się emocjami i intuicją częściej niż chłodną logiką",
};

/* Geometria diagramu — zmierzona bezpośrednio z public/brand/jedno-spojrzenie.jpg
   (analiza pikseli: 776×743, środek ~(387,296)), przeskalowana ×0.935 do
   kontenera 320×320. Zmierzone realnie, nie z oka:
   atmakaraka r=59, przerwa do obrączki 59-69, szara obrączka 69-104.5,
   przerwa 104.5-114, złoty pierścień 114-131 (CIĄGŁY, bez przegród —
   to co wyglądało na "przegrody" w małym podglądzie to tylko obwódki
   satelitów nakładające się na pierścień), satelity r=36 na promieniu
   ~124 (czyli w połowie grubości złotego pierścienia), pod kątem 45/
   135/225/315°, wystające poza pierścień aż do promienia ~160. */
const SKALA = 0.935;
const D = 320;
const C = D / 2;
const R_AK = 59 * SKALA;
const R_BAND_IN = 69 * SKALA;
const R_BAND_OUT = 104.5 * SKALA;
const R_RING_IN = 114 * SKALA;
const R_RING_OUT = 131 * SKALA;
const R_SAT_CENTER = 124.45 * SKALA;
const R_SAT = 36 * SKALA;
const OFFSET = R_SAT_CENTER / Math.SQRT2;
const OBWODKA = 3;

/** Węzeł kręgu — zawsze złoty, jak reszta serwisu (nie osobny system kolorów). */
function Wezel({
  symbol, size, x, y, labelWewnatrz,
}: { symbol: string; size: number; x: number; y: number; labelWewnatrz?: string }) {
  return (
    <div style={{
      position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size,
      borderRadius: "50%", background: "var(--sand)", color: "var(--bg)",
      border: `${OBWODKA}px solid var(--bg)`, boxSizing: "border-box",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
    }}>
      <span style={{ fontSize: labelWewnatrz ? size * 0.3 : size * 0.42, lineHeight: 1 }}>{symbol}</span>
      {labelWewnatrz && (
        <span style={{ fontSize: size * 0.1, fontWeight: 700, letterSpacing: "0.03em" }}>{labelWewnatrz}</span>
      )}
    </div>
  );
}

function Etykieta({
  dzial, tekst, x, y, strona,
}: { dzial: string; tekst: { title: string; text: string }; x: number; y: number; strona: "lewa" | "prawa" }) {
  return (
    <div style={{
      position: "absolute", top: y, ...(strona === "lewa" ? { right: D - x } : { left: x }),
      transform: "translateY(-50%)", whiteSpace: "nowrap",
    }}>
      <Term term={tekst}>
        <span className="eyebrow" style={{ fontSize: "0.78rem", color: "var(--sand)", fontWeight: 700, cursor: "help" }}>
          {dzial}
        </span>
      </Term>
    </div>
  );
}

export default function JednoSpojrzenie({ chart }: { chart: VedicChart }) {
  if (!chart.angles) return null;

  const ak = atmakaraka(chart);
  const akId = ak.planeta;
  const akSign = chart.planets[akId].sign;

  const d9 = navamsaChart(chart);
  const karakamszaSign = d9 ? d9.planets[akId].sign : akSign;

  const najsilniejsza = GRAHY_SZADBALI
    .map((id) => ({ id, w: szadbala(chart, id) }))
    .filter((d): d is { id: typeof d.id; w: WynikSzadbali } => d.w !== null)
    .sort((a, b) => b.w.razemRupy - a.w.razemRupy)[0];

  const bav = bhinnasztakawarga(chart);
  const bindySAV = bav ? sarwasztakawarga(bav)[akSign] : null;

  const mahadasza = chart.currentDasha.find((d) => d.level === 1);

  const moonSign = chart.planets.moon.sign;
  const element = RASIS[moonSign].element;

  const OPIS_FUNDAMENT = { title: "Fundament (karakamsza)", text: "Znak atmakaraki w nawamszy (D9) — duchowy fundament pod powierzchnią losu." };
  const OPIS_ATMAKARAKA = { title: "Atmakaraka", text: "Planeta z najwyższym stopniem w znaku — wskazuje główny temat i cel duszy w tym wcieleniu." };
  const OPIS_NAJSILNIEJSZA = { title: "Najsilniejsza (Szadbala)", text: "Planeta z najwyższą Szadbalą w tej mapie — ma najwięcej łącznej mocy sprawczej spośród siedmiu klasycznych grah." };
  const OPIS_ASZTAKAWARGA = { title: "Asztakawarga", text: "Suma bindu (Sarwasztakawarga) dla znaku atmakaraki — ile wsparcia od całej mapy ma ten fundament losu." };
  const OPIS_CZAS = { title: "Czas (mahadasza)", text: "Władca aktualnie trwającej mahaszy — kto rozdaje karty w Twoim obecnym rozdziale życia." };

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontFamily: "var(--font-serif)", fontSize: "2.6rem", color: "var(--sand)", fontWeight: 700, marginBottom: 16 }}>
        Jedno spojrzenie
      </p>
      <p style={{ color: "var(--sand)", fontSize: "0.86rem", lineHeight: 1.6, textAlign: "left", marginBottom: 4, maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
        Pięć działów Twojego kosmogramu zebranych wokół <Term k="atmakaraka">atmakaraki</Term> —
        wskaźnika duszy. Najechanie na nazwę działu (w kręgu albo na liście niżej) pokaże, co on
        w ogóle znaczy. {RASIS[moonSign].symbol} {RASIS[moonSign].pl} to znak Twojego Księżyca —
        masz w sobie sporo żywiołu {ELEMENT_DOPELNIACZ[element]}, {OPIS_ZYWIOLU[element]}.
      </p>

      <div style={{ position: "relative", width: D, height: D, margin: "16px auto 0" }}>
        <svg viewBox={`0 0 ${D} ${D}`} width="100%" height="100%" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
          {/* szara obrączka i złoty pierścień są CIĄGŁE (bez przegród) — satelity tylko
              na nich leżą, nadpisując je swoim własnym obrysem w 4 miejscach */}
          <circle cx={C} cy={C} r={(R_BAND_IN + R_BAND_OUT) / 2} fill="none" stroke="var(--taupe)" strokeWidth={R_BAND_OUT - R_BAND_IN} />
          <circle cx={C} cy={C} r={(R_RING_IN + R_RING_OUT) / 2} fill="none" stroke="var(--sand)" strokeWidth={R_RING_OUT - R_RING_IN} />
        </svg>

        <Wezel symbol={RASIS[karakamszaSign].symbol} size={R_SAT * 2} x={C - OFFSET} y={C - OFFSET} />
        <Wezel symbol={GRAHAS[najsilniejsza.id].symbol} size={R_SAT * 2} x={C + OFFSET} y={C - OFFSET} />
        <Wezel symbol={bindySAV === null ? "—" : String(bindySAV)} size={R_SAT * 2} x={C - OFFSET} y={C + OFFSET} />
        <Wezel symbol={mahadasza ? GRAHAS[mahadasza.lord].symbol : "—"} size={R_SAT * 2} x={C + OFFSET} y={C + OFFSET} />
        <Wezel symbol={GRAHAS[akId].symbol} size={R_AK * 2} x={C} y={C} labelWewnatrz="ATMAKARAKA" />

        <Etykieta dzial="FUNDAMENT" tekst={OPIS_FUNDAMENT} strona="lewa" x={C - OFFSET - R_SAT - 10} y={C - OFFSET} />
        <Etykieta dzial="NAJSILNIEJSZA" tekst={OPIS_NAJSILNIEJSZA} strona="prawa" x={C + OFFSET + R_SAT + 10} y={C - OFFSET} />
        <Etykieta dzial="ASZTAKAWARGA" tekst={OPIS_ASZTAKAWARGA} strona="lewa" x={C - OFFSET - R_SAT - 10} y={C + OFFSET} />
        <Etykieta dzial="CZAS" tekst={OPIS_CZAS} strona="prawa" x={C + OFFSET + R_SAT + 10} y={C + OFFSET} />
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 24, textAlign: "left", maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
        <div className="badge" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 999, borderColor: "var(--sand)" }}>
          <span>{GRAHAS[akId].symbol}</span>
          <Term term={OPIS_ATMAKARAKA}><strong style={{ cursor: "help" }}>ATMAKARAKA</strong></Term>
          <span>- {GRAHAS[akId].pl.toUpperCase()} -</span>
        </div>
        <div className="badge" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 999, borderColor: "var(--sand)" }}>
          <span>{RASIS[karakamszaSign].symbol}</span>
          <Term term={OPIS_FUNDAMENT}><strong style={{ cursor: "help" }}>FUNDAMENT</strong></Term>
          <span>- {RASIS[karakamszaSign].pl.toUpperCase()} -</span>
        </div>
        <div className="badge" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 999, borderColor: "var(--sand)" }}>
          <span>{GRAHAS[najsilniejsza.id].symbol}</span>
          <Term term={OPIS_NAJSILNIEJSZA}><strong style={{ cursor: "help" }}>NAJSILNIEJSZA</strong></Term>
          <span>- {GRAHAS[najsilniejsza.id].pl.toUpperCase()} -</span>
        </div>
        <div className="badge" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 999, borderColor: "var(--sand)" }}>
          <span>{bindySAV ?? "—"}</span>
          <Term term={OPIS_ASZTAKAWARGA}><strong style={{ cursor: "help" }}>ASZTAKAWARGA</strong></Term>
          <span>- {bindySAV ?? "—"} -</span>
        </div>
        <div className="badge" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 999, borderColor: "var(--sand)" }}>
          <span>{mahadasza ? GRAHAS[mahadasza.lord].symbol : "—"}</span>
          <Term term={OPIS_CZAS}><strong style={{ cursor: "help" }}>CZAS</strong></Term>
          <span>- {mahadasza ? GRAHAS[mahadasza.lord].pl.toUpperCase() : "—"} -</span>
        </div>
      </div>
      <div className="skrot-hero-linia" />
    </div>
  );
}
