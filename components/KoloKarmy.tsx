"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import MoonStars from "./MoonStars";
import { SEGMENT_GAPY, type SystemKarmy } from "@/lib/koloKarmyGeometria";

/**
 * Koło Karmy — gotowa grafika (public/brand/kolo-karmy.png) BEZ satelitów
 * Astrokartografii/Mahadasz/Karmy wypalonych w pliku — te trzy są w całości
 * dorysowane jako SVG/HTML (kropka + ramię + podpis), widoczne dopiero po
 * najechaniu. Dzięki temu nic nie trzeba wycinać z obrazu — nie ma ryzyka
 * śladów po edycji piksele. Współrzędne w przestrzeni pliku (IMG_W × IMG_H),
 * przeliczane na procenty, więc trafiają we właściwe miejsce niezależnie
 * od szerokości renderu. Nazwa systemu w dymku — wzorzec z Term.tsx:
 * portal do <body>, pozycja na sztywno, bez transform.
 */

const IMG_W = 1260, IMG_H = 761;
const CX = 596, CY = 378, R_OUTER = 350;
/** Geometria samego pasa największego pierścienia (Karmy), zmierzona na
 *  grafice: zewnętrzna krawędź ~351px od środka, wewnętrzna ~294px —
 *  środek pasa i jego grubość, do niewidzialnego hotspotu na hover. */
const RING_R = 322.5, RING_W = 60;

type Hotspot = {
  id: string;
  x: number; y: number; r: number;
  glowR?: number;
  href: string;
  label: string;
  /** Gdy pole jest nieregularne (kwiat trzech kół) — dokładny bounding box
   *  z tej samej maski flood-fill co poświata (glow-<id>.png), używany
   *  zamiast koła x/y/r, żeby cały płatek reagował na hover, nie tylko
   *  jego środek. */
  gap?: readonly [number, number, number, number];
};

/** Te cztery mają nieregularny kształt (przenikają się z sąsiadami) — ich
 *  poświata to maska wycięta z samej grafiki metodą wypełnienia (flood fill)
 *  od piktogramu do najbliższej złotej linii — public/brand/glow-<id>.png,
 *  ten sam układ współrzędnych co główny obraz. */
const KSZTALTNE = new Set([
  "astrologia", "hiromancja", "numerologia", "panel",
  "astrokartografia", "mahadasze", "karma",
]);

const HOTSPOTY: Hotspot[] = [
  { id: "astrologia", x: 598, y: 175, r: 85, href: "/kosmogram", label: "Astrologia", gap: SEGMENT_GAPY.astrologia },
  { id: "hiromancja", x: 415, y: 470, r: 85, href: "/hiromancja", label: "Chiromancja", gap: SEGMENT_GAPY.hiromancja },
  { id: "numerologia", x: 775, y: 470, r: 85, href: "/numerologia", label: "Numerologia", gap: SEGMENT_GAPY.numerologia },
  { id: "panel", x: 596, y: 367, r: 60, href: "/panel", label: "Mój Panel" },
  { id: "zwiazki", x: 1012, y: 645, r: 80, glowR: 90, href: "/dopasowanie", label: "Związki" },
];

/** Piktogramy w soczewkach przenikania (dom/klepsydra/postać) — czysto opisowe,
 *  bez własnej podstrony, więc bez linku: tylko dymek z nazwą danych, które
 *  wpisujesz raz, a trafiają do wszystkich trzech systemów naraz. */
const DANE_WSPOLNE = [
  { id: "gdzie", label: "Twoje miejsce urodzenia", gap: [429, 267, 560, 389] as const },
  { id: "kiedy", label: "Twój czas urodzenia", gap: [632, 267, 764, 391] as const },
  { id: "kto", label: "Twoje ciało, imię i nazwisko", gap: [529, 452, 663, 571] as const },
];

/** Satelity pierścienia Karmy — Astrokartografia / Mahadasze / Co z tym zrobić.
 *  W tej grafice nie ma ich wcale (celowo), więc kropka + ramię + podpis to
 *  w 100% SVG/HTML, chowane/pokazywane razem, tylko na hover. Kąt liczony
 *  od góry, zgodnie z ruchem wskazówek zegara. */
function naOkregu(angleDeg: number, r: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad) };
}

/** Pole aktywujące satelitę to NIE promień od środka — to dokładna szczelina
 *  (sierp) między pierścieniem Karmy a kwiatem trzech kół, wyznaczona metodą
 *  wypełnienia (flood fill) bezpośrednio z pliku, tak jak maski poświaty
 *  powyżej. Bounding box tej szczeliny: public/brand/glow-<id>.png. */
const SATELITY = [
  {
    id: "astrokartografia", angle: -60, out: 70, href: "/astrokartografia", label: "Astrokartografia",
    lines: ["ASTRO-", "KARTOGRAFIA"], side: "left" as const, gap: [283, 94, 464, 421] as const,
  },
  {
    id: "mahadasze", angle: 65, out: 70, href: "/sade-sati", label: "Mahadashe, jogi i dosze",
    lines: ["MAHADASHE", "JOGI I DOSHE"], side: "right" as const, gap: [735, 98, 908, 416] as const,
  },
  // Karma jest u dołu koła — „na zewnątrz" wzdłuż promienia oznaczałoby zejście
  // poza obraz, więc jej ramię celowo idzie w bok (mniejszy promień), nie w dół.
  {
    id: "karma", angle: 190, out: 25, href: "/karma", label: "Co z tym zrobić?",
    lines: ["CO Z TYM", "ZROBIĆ?"], side: "left" as const, gap: [405, 618, 785, 690] as const,
  },
].map((s) => ({ ...s, dot: naOkregu(s.angle, R_OUTER + 22) }));

/** Piktogramy Astrologii/Hiromancji/Numerologii jako osobna, dociosana
 *  wycinka tego samego pliku (public/brand/icon-<id>.png) — leżą dokładnie
 *  na tych samych pikselach co w tle, więc w spoczynku są nie do odróżnienia;
 *  dopiero na hover dostają puls (transform:scale), którego nie da się zrobić
 *  na płaskim tle. Prostokąt wycinka w przestrzeni pliku. */
// Astrologia pominięta — jej piktogram (kompas) wycięty z grafiki, zastąpiony
// przez <MoonStars> (osobny puls, patrz aktywny === "astrologia" niżej).
const PIKTOGRAMY_PULSUJACE = [
  { id: "hiromancja", box: [340, 385, 490, 555] as const },
  { id: "numerologia", box: [715, 400, 870, 550] as const },
];

function pctX(v: number) { return `${(v / IMG_W) * 100}%`; }
function pctY(v: number) { return `${(v / IMG_H) * 100}%`; }

const TIP_W = 168;

// SystemKarmy — systemy, które mogą mieć stan „ukończony" (wtedy ich pętla
// świeci złotem zamiast domyślnego taupe; Faza 1 reskinu: stan na sztywno
// z propa, bez prawdziwego śledzenia postępu — to osobna, późniejsza faza).
// Typ w lib/koloKarmyGeometria.ts (re-export tutaj dla wygody importujących).
export type { SystemKarmy };

/** Jedyne obecne użycie tego komponentu to strona główna (hub nawigacyjny) —
 *  ta ma zostać zawsze w pełnym złocie, jak przed reskinem (potwierdzone:
 *  wskaźnik postępu taupe→złoto to język Mojego Panelu i jego breadcrumbów
 *  na podstronach — KoloKarmyMini.tsx — nie strony głównej). */
const WSZYSTKIE_SYSTEMY = new Set<SystemKarmy>(["astrologia", "hiromancja", "numerologia"]);

export default function KoloKarmy({ ukonczone = WSZYSTKIE_SYSTEMY }: { ukonczone?: Set<SystemKarmy> }) {
  const [aktywny, setAktywny] = useState<string | null>(null);
  const [tip, setTip] = useState<{ label: string; left: number; top: number } | null>(null);
  const [hoverTytul, setHoverTytul] = useState(false);

  const wskaz = (id: string, label: string) => (e: React.MouseEvent | React.FocusEvent) => {
    setAktywny(id);
    if (id === "astrokartografia" || id === "mahadasze" || id === "karma") return; // mają własny stały podpis
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let left = r.left + r.width / 2 - TIP_W / 2;
    left = Math.max(10, Math.min(left, window.innerWidth - TIP_W - 10));
    setTip({ label, left, top: r.top - 44 });
  };
  const schowaj = () => { setAktywny(null); setTip(null); };

  const dymek = tip && typeof document !== "undefined" ? createPortal(
    <span className="kk-tip" style={{ left: tip.left, top: tip.top, width: TIP_W }}>{tip.label}</span>,
    document.body,
  ) : null;

  // Gdy wszystkie trzy systemy są „ukończone" (domyślny stan na stronie
  // głównej), wracamy do oryginalnej, w pełni złotej grafiki — łącznie
  // z zewnętrznym pierścieniem Karmy i Związkami, których warstwy taupe/gold
  // nie obejmują (dotyczą tylko trzech wewnętrznych pętli-systemów).
  const wszystkoZlote = ukonczone.size >= 3;

  return (
    <div style={{ position: "relative", maxWidth: 1000, margin: "0 auto", containerType: "inline-size" } as React.CSSProperties}>
      <img
        src={wszystkoZlote ? "/brand/kolo-karmy-gold-clean.png" : "/brand/kolo-karmy-taupe.png"}
        alt="Koło Karmy — Astrologia, Numerologia i Chiromancja wokół Twojego Panelu, z Astrokartografią, Mahadashami i Karmą jako punktami wyjścia"
        style={{ display: "block", width: "100%", height: "auto" }}
      />

      {/* pętle „ukończonych" systemów — złote wypełnienie zamiast domyślnego
          taupe, z miękką poświatą (drop-shadow), Faza 1: stan na sztywno z propa.
          Pominięte, gdy baza już jest w pełni złota (patrz wyżej). */}
      {!wszystkoZlote && (["astrologia", "hiromancja", "numerologia"] as const).filter((id) => ukonczone.has(id)).map((id) => (
        <img key={`fill-${id}`} src={`/brand/fill-${id}-gold.png`} alt=""
          style={{
            position: "absolute", left: 0, top: 0, width: "100%", height: "100%",
            filter: "drop-shadow(0 0 14px rgba(230, 196, 138, 0.55))",
          }} />
      ))}
      <MoonStars box={SEGMENT_GAPY.astrologia} zlote={ukonczone.has("astrologia")} puls={aktywny === "astrologia"} />

      {/* poświata pól o nieregularnym kształcie — astrologia/hiromancja/
          numerologia pominięte: hover-feedback dla wszystkich trzech daje
          już puls piktogramu (MoonStars / PIKTOGRAMY_PULSUJACE), stara
          poświata dawała niespójny, zbędny efekt w tle */}
      {[...KSZTALTNE].filter((id) => !["astrologia", "hiromancja", "numerologia"].includes(id)).map((id) => (
        <img key={`glow-${id}`} src={`/brand/glow-${id}.png`} alt=""
          className={`kk-glow-ksztalt${aktywny === id ? " kk-glow-aktywny" : ""}`}
          style={{ left: 0, top: 0, width: "100%", height: "100%" }} />
      ))}
      {/* poświata Związków — proste koło */}
      {(() => {
        const z = HOTSPOTY.find((h) => h.id === "zwiazki")!;
        const gr = z.glowR ?? z.r * 1.3;
        return (
          <span className={`kk-glow${aktywny === "zwiazki" ? " kk-glow-aktywny" : ""}`}
            style={{ left: pctX(z.x - gr), top: pctY(z.y - gr), width: pctX(gr * 2), height: pctY(gr * 2) }} />
        );
      })()}

      {/* piktogramy, które pulsują po najechaniu — leżą idealnie na tle (taupe
          albo złote, zależnie od stanu), widać tylko puls */}
      {PIKTOGRAMY_PULSUJACE.map((p) => (
        <img key={`ikona-${p.id}`}
          src={`/brand/icon-${p.id}${ukonczone.has(p.id as SystemKarmy) ? "" : "-taupe"}.png`} alt=""
          className={`kk-ikona-puls${aktywny === p.id ? " kk-ikona-puls-aktywna" : ""}`}
          style={{
            left: pctX(p.box[0]), top: pctY(p.box[1]),
            width: pctX(p.box[2] - p.box[0]), height: pctY(p.box[3] - p.box[1]),
          }} />
      ))}

      {/* satelity Karmy — kropka, ramię i podpis w całości narysowane, widoczne tylko na hover */}
      <svg viewBox={`0 0 ${IMG_W} ${IMG_H}`} aria-hidden="true"
        style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {/* niewidzialny pas na obwodzie największego pierścienia (Karmy) — sam
            hover pokazuje podpis "Twoje Koło Karmy". Renderowany PRZED
            wszystkimi innymi uchwytami (najniższy priorytet), więc szczeliny
            satelitów i inne pola dalej wygrywają hover na swoim obszarze. */}
        <circle
          cx={CX} cy={CY} r={RING_R}
          fill="none" stroke="rgba(0,0,0,0.001)" strokeWidth={RING_W}
          style={{ pointerEvents: "stroke" }}
          onMouseEnter={() => setHoverTytul(true)}
          onMouseLeave={() => setHoverTytul(false)}
        />
        {SATELITY.map((s) => {
          const active = aktywny === s.id;
          const out = naOkregu(s.angle, R_OUTER + s.out);
          const tickEnd = { x: out.x + (s.side === "left" ? -55 : 55), y: out.y - 18 };
          const textX = tickEnd.x + (s.side === "left" ? -8 : 8);
          const gapCx = (s.gap[0] + s.gap[2]) / 2, gapCy = (s.gap[1] + s.gap[3]) / 2;
          return (
            <g key={s.id} className={`kk-ramie${active ? " kk-ramie-aktywna" : ""}`}>
              <circle cx={s.dot.x} cy={s.dot.y} r="9" />
              <line x1={s.dot.x} y1={s.dot.y} x2={gapCx} y2={gapCy} className="kk-ramie-do-szczeliny" />
              <line x1={s.dot.x} y1={s.dot.y} x2={out.x} y2={out.y} />
              <line x1={out.x} y1={out.y} x2={tickEnd.x} y2={tickEnd.y} />
              {s.lines.map((l, i) => (
                <text key={i} x={textX} y={tickEnd.y - 6 + i * 15}
                  textAnchor={s.side === "left" ? "end" : "start"} className="kk-satelita-tekst">{l}</text>
              ))}
            </g>
          );
        })}

        {/* podpis całości — kropka na pierścieniu + prosta pionowa kreska,
            widoczny tylko po najechaniu na największy żółty pierścień */}
        {(() => {
          const p = naOkregu(38, R_OUTER);
          const top = { x: p.x, y: p.y - 64 };
          return (
            <g className={`kk-tytul${hoverTytul ? " kk-tytul-widoczny" : ""}`}>
              <circle cx={p.x} cy={p.y} r="6" className="kk-tytul-kropka" />
              <line x1={p.x} y1={p.y} x2={top.x} y2={top.y} className="kk-tytul-linia" />
              <text x={top.x + 22} y={top.y + 24} className="kk-tytul-eyebrow">TWOJE KOŁO</text>
              <text x={top.x + 22} y={top.y + 56} className="kk-tytul-glowny">KARMY</text>
            </g>
          );
        })()}
      </svg>

      {/* uchwyty klikalne — nie na kropce, tylko w dokładnej szczelinie między
          pierścieniem Karmy a kwiatem trzech kół (ten sam obszar co maska
          poświaty), bo tam ma się aktywować podświetlenie. Renderowane PRZED
          piktogramami — ich prostokąt bywa szerszy niż faktyczny sierp i
          zachodzi na górny skrawek koła obok (Hiromancja/Numerologia), więc
          piktogram musi leżeć nad nimi w DOM, żeby zawsze wygrywał hover. */}
      {SATELITY.map((s) => (
        <Link key={s.id} href={s.href} aria-label={s.label} className="kk-hit kk-hit-prostokat"
          style={{
            left: pctX(s.gap[0]), top: pctY(s.gap[1]),
            width: pctX(s.gap[2] - s.gap[0]), height: pctY(s.gap[3] - s.gap[1]),
          }}
          onMouseEnter={wskaz(s.id, s.label)}
          onMouseLeave={schowaj}
          onFocus={wskaz(s.id, s.label)}
          onBlur={schowaj}
        />
      ))}

      {/* uchwyty klikalne — pełny płatek Astrologii/Hiromancji/Numerologii (nad
          szczelinami satelitów). Renderowane PRZED soczewkami przenikania —
          soczewki „gdzie/kiedy/kto" leżą w środku płatków, więc muszą być nad
          nimi w DOM, żeby wygrywały hover w tym mniejszym, bardziej precyzyjnym
          obszarze, zamiast oddawać go całemu (dużo większemu) płatkowi. */}
      {HOTSPOTY.filter((n) => n.gap).map((n) => (
        <Link key={n.id} href={n.href} aria-label={n.label} className="kk-hit kk-hit-prostokat"
          style={{
            left: pctX(n.gap![0]), top: pctY(n.gap![1]),
            width: pctX(n.gap![2] - n.gap![0]), height: pctY(n.gap![3] - n.gap![1]),
          }}
          onMouseEnter={wskaz(n.id, n.label)}
          onMouseLeave={schowaj}
          onFocus={wskaz(n.id, n.label)}
          onBlur={schowaj}
        />
      ))}

      {/* soczewki przenikania — dom/klepsydra/postać: sam dymek, bez linku.
          Pole aktywujące to dokładna soczewka (jak szczeliny satelitów), nie
          mały okrąg na samej ikonie — inaczej brzegi soczewki nie reagowały.
          Renderowane PRZED Panelem i płatkami-piktogramami — soczewki leżą
          w środku kwiatu (na Panelu i na płatkach), więc te muszą być nad
          nimi, żeby zawsze wygrywały hover na swoim mniejszym obszarze. */}
      {DANE_WSPOLNE.map((d) => (
        <span key={d.id} aria-label={d.label} tabIndex={0} role="button" className="kk-hit kk-hit-prostokat"
          style={{
            left: pctX(d.gap[0]), top: pctY(d.gap[1]),
            width: pctX(d.gap[2] - d.gap[0]), height: pctY(d.gap[3] - d.gap[1]),
          }}
          onMouseEnter={wskaz(d.id, d.label)}
          onMouseLeave={schowaj}
          onFocus={wskaz(d.id, d.label)}
          onBlur={schowaj}
        />
      ))}

      {/* uchwyty klikalne — Panel i Związki, proste koła w samym środku/rogu,
          nad soczewkami i płatkami, żeby zawsze wygrywały na swoim obszarze. */}
      {HOTSPOTY.filter((n) => !n.gap).map((n) => (
        <Link key={n.id} href={n.href} aria-label={n.label} className="kk-hit"
          style={{
            left: pctX(n.x - n.r), top: pctY(n.y - n.r),
            width: pctX(n.r * 2), height: pctY(n.r * 2),
          }}
          onMouseEnter={wskaz(n.id, n.label)}
          onMouseLeave={schowaj}
          onFocus={wskaz(n.id, n.label)}
          onBlur={schowaj}
        />
      ))}

      {dymek}
    </div>
  );
}
