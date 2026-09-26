"use client";

import { useLocale } from "next-intl";

/**
 * MANDALA DWÓCH DASZ — czysto dekoracyjna winieta nad osią czasu na /sade-sati,
 * w duchu koła Majów (Tzolkin/Haab): dwa splecione pierścienie o innym okresie
 * cyklu. Świadomie NIE jest to precyzyjny odczyt dat — do tego służy poniższa
 * oś liniowa (DwieOsieDasz). Statyczny SVG, brak danych z mapy.
 */
const WIMSZOTTARI = [
  { nazwa: "Ketu", skrot: "Ket", skrotEn: "Ket", lata: 7 },
  { nazwa: "Wenus", skrot: "Wen", skrotEn: "Ven", lata: 20 },
  { nazwa: "Słońce", skrot: "Sło", skrotEn: "Sun", lata: 6 },
  { nazwa: "Księżyc", skrot: "Ksż", skrotEn: "Moo", lata: 10 },
  { nazwa: "Mars", skrot: "Mar", skrotEn: "Mar", lata: 7 },
  { nazwa: "Rahu", skrot: "Rah", skrotEn: "Rah", lata: 18 },
  { nazwa: "Jowisz", skrot: "Jow", skrotEn: "Jup", lata: 16 },
  { nazwa: "Saturn", skrot: "Sat", skrotEn: "Sat", lata: 19 },
  { nazwa: "Merkury", skrot: "Mer", skrotEn: "Mer", lata: 17 },
];
const WIMSZOTTARI_LATA = WIMSZOTTARI.map((p) => p.lata); // suma 120
// Skróty zamiast symboli unicode ♈-♓ — te ostatnie bywają renderowane jako
// puste "tofu" gdy czcionka systemowa nie ma tego zakresu (np. część Linuksów).
const ZNAKI = ["Bar", "Byk", "Bli", "Rak", "Lew", "Pan", "Wag", "Skp", "Str", "Koz", "Wod", "Ryb"];
const ZNAKI_EN = ["Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sgr", "Cap", "Aqu", "Psc"];

/** Kąty środkowe segmentów proporcjonalnych (do etykiet) — bez rysowania ścieżek. */
function srodkiProporcjonalne(lata: number[]) {
  const suma = lata.reduce((s, x) => s + x, 0);
  const srodki: number[] = [];
  let kat = 0;
  for (const l of lata) {
    const span = (l / suma) * 360;
    srodki.push(kat + span / 2);
    kat += span;
  }
  return srodki;
}

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function pierscien(cx: number, cy: number, rOut: number, rIn: number, segmenty: number, gap = 1.2) {
  const paths: string[] = [];
  const krok = 360 / segmenty;
  for (let i = 0; i < segmenty; i++) {
    const a0 = i * krok + gap;
    const a1 = (i + 1) * krok - gap;
    const [x1, y1] = polar(cx, cy, rOut, a0);
    const [x2, y2] = polar(cx, cy, rOut, a1);
    const [x3, y3] = polar(cx, cy, rIn, a1);
    const [x4, y4] = polar(cx, cy, rIn, a0);
    const large = a1 - a0 > 180 ? 1 : 0;
    paths.push(`M${x1},${y1} A${rOut},${rOut} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${rIn},${rIn} 0 ${large} 0 ${x4},${y4} Z`);
  }
  return paths;
}

function pierscienProporcjonalny(cx: number, cy: number, rOut: number, rIn: number, lata: number[], gap = 1) {
  const suma = lata.reduce((s, x) => s + x, 0);
  const paths: string[] = [];
  let kat = 0;
  for (const l of lata) {
    const span = (l / suma) * 360;
    const a0 = kat + gap;
    const a1 = kat + span - gap;
    const [x1, y1] = polar(cx, cy, rOut, a0);
    const [x2, y2] = polar(cx, cy, rOut, a1);
    const [x3, y3] = polar(cx, cy, rIn, a1);
    const [x4, y4] = polar(cx, cy, rIn, a0);
    const large = a1 - a0 > 180 ? 1 : 0;
    paths.push(`M${x1},${y1} A${rOut},${rOut} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${rIn},${rIn} 0 ${large} 0 ${x4},${y4} Z`);
    kat += span;
  }
  return paths;
}

export default function MandalaDwochDasz({ wiekLat }: { wiekLat?: number }) {
  const locale = useLocale();
  const en = locale === "en";
  const CX = 300, CY = 300;
  const zewnetrzne = pierscienProporcjonalny(CX, CY, 258, 202, WIMSZOTTARI_LATA);
  const srodkiZewn = srodkiProporcjonalne(WIMSZOTTARI_LATA);
  const wewnetrzne = pierscien(CX, CY, 178, 120, 12);
  const potwierdzenia = [18, 96, 168, 252, 312]; // stałe, dekoracyjne kąty "zbiegu" obu kół

  const wiekKlamrowany = wiekLat === undefined ? null : Math.max(0, Math.min(100, wiekLat));
  const katTeraz = wiekKlamrowany === null ? null : (wiekKlamrowany / 100) * 360;
  const igla = katTeraz === null ? null : {
    wewn: polar(CX, CY, 92, katTeraz),
    zewn: polar(CX, CY, 272, katTeraz),
    grot: polar(CX, CY, 280, katTeraz),
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 36px" }}>
      <svg width={480} height={480} viewBox="0 0 600 600" role="img" aria-label={en ? "Decorative mandala of two dashas" : "Dekoracyjna mandala dwóch dasz"}>
        <circle cx={CX} cy={CY} r={261} fill="var(--bg-2)" stroke="rgba(230,196,138,0.15)" strokeWidth={1.4} />
        {zewnetrzne.map((d, i) => (
          <path key={`z-${i}`} d={d} fill="rgba(230,196,138,0.10)" stroke="var(--sand)" strokeWidth={1.6} opacity={0.85} />
        ))}
        {wewnetrzne.map((d, i) => (
          <path key={`w-${i}`} d={d} fill="rgba(156,147,171,0.16)" stroke="var(--muted)" strokeWidth={1.6} opacity={0.9} />
        ))}
        {srodkiZewn.map((deg, i) => {
          const [x, y] = polar(CX, CY, 230, deg);
          return (
            <text
              key={`p-nazwa-${i}`}
              x={x}
              y={y + 6}
              textAnchor="middle"
              fontSize={15}
              fontWeight={600}
              letterSpacing={0.3}
              fill="var(--sand)"
              opacity={0.95}
            >
              {en ? WIMSZOTTARI[i].skrotEn : WIMSZOTTARI[i].skrot}
            </text>
          );
        })}
        {wewnetrzne.map((_, i) => {
          const [x, y] = polar(CX, CY, 148, i * 30 + 15);
          return (
            <text
              key={`s-${i}`}
              x={x}
              y={y + 7}
              textAnchor="middle"
              fontSize={20}
              fontWeight={600}
              letterSpacing={0.5}
              fill="var(--sand)"
              opacity={0.9}
            >
              {en ? ZNAKI_EN[i] : ZNAKI[i]}
            </text>
          );
        })}
        {potwierdzenia.map((deg, i) => {
          const [x, y] = polar(CX, CY, 230, deg);
          return <circle key={`p-${i}`} cx={x} cy={y} r={5} fill="var(--sand)" opacity={0.9} />;
        })}
        <circle cx={CX} cy={CY} r={90} fill="var(--bg)" stroke="rgba(230,196,138,0.3)" strokeWidth={1.4} strokeDasharray="3 5" />
        <text x={CX} y={CY - 8} textAnchor="middle" fontSize={16} fill="var(--muted)" letterSpacing={1.8}>
          {en ? "CHARA × VIMSHOTTARI" : "CHARA × WIMSZOTTARI"}
        </text>
        <text x={CX} y={CY + 18} textAnchor="middle" fontSize={16} fill="var(--muted)" letterSpacing={1.8}>
          {en ? "0 — 100 YEARS" : "0 — 100 LAT"}
        </text>
        {igla && wiekKlamrowany !== null && (
          <>
            <line
              x1={igla.wewn[0]} y1={igla.wewn[1]} x2={igla.zewn[0]} y2={igla.zewn[1]}
              stroke="var(--teal-soft)" strokeWidth={2.5} opacity={0.95}
            />
            <circle cx={igla.grot[0]} cy={igla.grot[1]} r={7} fill="var(--teal-soft)" stroke="var(--bg)" strokeWidth={1.5} />
            <text
              x={igla.grot[0]}
              y={igla.grot[1]}
              dx={igla.grot[0] > CX ? 16 : igla.grot[0] < CX ? -16 : 0}
              dy={igla.grot[1] > CY ? 18 : -12}
              textAnchor={igla.grot[0] > CX ? "start" : igla.grot[0] < CX ? "end" : "middle"}
              fontSize={15}
              fontWeight={700}
              fill="var(--teal-soft)"
            >
              {en ? `NOW · ${Math.round(wiekKlamrowany)} yrs` : `TERAZ · ${Math.round(wiekKlamrowany)} lat`}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
