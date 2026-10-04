"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import MoonStars from "./MoonStars";
import { useKoloKarmyStart } from "./KoloKarmyStartContext";
import { SEGMENT_GAPY, animacjeDoPokazania, wyczyscAnimacje, type SystemKarmy } from "@/lib/koloKarmyGeometria";
import { usePostepKarmy } from "./usePostepKarmy";

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
  href: string;
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

const HOTSPOTY_BAZA: Hotspot[] = [
  { id: "astrologia", x: 598, y: 175, r: 85, href: "/kosmogram", gap: SEGMENT_GAPY.astrologia },
  { id: "hiromancja", x: 415, y: 470, r: 85, href: "/hiromancja", gap: SEGMENT_GAPY.hiromancja },
  { id: "numerologia", x: 775, y: 470, r: 85, href: "/numerologia", gap: SEGMENT_GAPY.numerologia },
  { id: "panel", x: 596, y: 367, r: 60, href: "/panel" },
  { id: "zwiazki", x: 1012, y: 645, r: 80, href: "/dopasowanie" },
];

/** Piktogramy w soczewkach przenikania (dom/klepsydra/postać) — czysto opisowe,
 *  bez własnej podstrony, więc bez linku: tylko dymek z nazwą danych, które
 *  wpisujesz raz, a trafiają do wszystkich trzech systemów naraz. */
const DANE_WSPOLNE_BAZA = [
  { id: "gdzie", gap: [429, 267, 560, 389] as const },
  { id: "kiedy", gap: [632, 267, 764, 391] as const },
  { id: "kto", gap: [529, 452, 663, 571] as const },
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
const SATELITY_BAZA = [
  {
    id: "astrokartografia", angle: -60, out: 70, href: "/astrokartografia",
    side: "left" as const, gap: [283, 94, 464, 421] as const,
  },
  {
    id: "mahadasze", angle: 65, out: 70, href: "/sade-sati",
    side: "right" as const, gap: [735, 98, 908, 416] as const,
  },
  // Karma jest u dołu koła — „na zewnątrz" wzdłuż promienia oznaczałoby zejście
  // poza obraz, więc jej ramię celowo idzie w bok (mniejszy promień), nie w dół.
  {
    id: "karma", angle: 190, out: 25, href: "/karma",
    side: "left" as const, gap: [405, 618, 785, 690] as const,
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
  // Skalibrowane (2026-09-26) wprost z public/brand/nowa-numerologia.jpg —
  // pelny wzorcowy wykres kola z cyframi juz osadzonymi na wlasciwym miejscu.
  // Transformacja wyliczona z polozenia ikony klepsydry (znany punkt
  // odniesienia w obu ukladach wspolrzednych: 34x44px we wzorze = 33x43px
  // tutaj, skala ~0.97, prawie 1:1) i zweryfikowana osobno dla kazdej z 9
  // cyfr wzgledem rzeczywistej krawedzi platka (skan kanalu alfa wiersz po
  // wierszu) — zaden budzil watpliwosci wczesniejszych probach "na oko".
  { id: "numerologia", box: [708, 360, 831, 572] as const },
];

/** Piktogramy we WSPÓLNYCH soczewkach (dom/klepsydra/postać) — każda leży
 *  dokładnie na przecięciu DWÓCH kręgów, więc zapala się złotem, gdy
 *  KTÓRYKOLWIEK z tej pary jest ukończony (tak jak złoty pierścień faktycznie
 *  ją obejmuje) — nie wymaga obu naraz. Wycięte z grafiki tą samą metodą co
 *  piktogramy pulsujące (public/brand/icon-<id>.png), boxy zmierzone przez
 *  izolację spójnych składowych w lokalnym oknie (odporne na dotykanie
 *  pierścienia — patrz nakszatra postaci "kto"). */
const PIKTOGRAMY_WSPOLNE = [
  { id: "gdzie", box: [461, 287, 506, 332] as const, pary: ["astrologia", "hiromancja"] as const },
  { id: "kiedy", box: [695, 288, 730, 333] as const, pary: ["astrologia", "numerologia"] as const },
  { id: "kto", box: [581, 474, 611, 548] as const, pary: ["hiromancja", "numerologia"] as const },
];

function pctX(v: number) { return `${(v / IMG_W) * 100}%`; }
function pctY(v: number) { return `${(v / IMG_H) * 100}%`; }

/** Piktogram jako dwie nałożone warstwy (taupe pod spodem, złota na wierzchu
 *  z przejściem opacity) zamiast twardej zmiany `src` — to samo podejście co
 *  przy głównym obrazie kola, żeby zapalanie/gaszenie było płynne, nie skokowe. */
function IkonaCrossfade({ id, box, zlote }: {
  id: string; box: readonly [number, number, number, number]; zlote: boolean;
}) {
  const wspolny = {
    position: "absolute" as const, pointerEvents: "none" as const,
    left: pctX(box[0]), top: pctY(box[1]),
    width: pctX(box[2] - box[0]), height: pctY(box[3] - box[1]),
  };
  return (
    <>
      <img src={`/brand/icon-${id}-taupe.png`} alt="" style={wspolny} />
      <img src={`/brand/icon-${id}.png`} alt=""
        style={{ ...wspolny, opacity: zlote ? 1 : 0, transition: "opacity 0.7s ease" }} />
    </>
  );
}

const TIP_W = 168;

// SystemKarmy — systemy, które mogą mieć stan „ukończony" (wtedy ich pętla
// świeci złotem zamiast domyślnego taupe; Faza 1 reskinu: stan na sztywno
// z propa, bez prawdziwego śledzenia postępu — to osobna, późniejsza faza).
// Typ w lib/koloKarmyGeometria.ts (re-export tutaj dla wygody importujących).
export type { SystemKarmy };

/** Strona główna (hub nawigacyjny) startuje w pełnym złocie (jak przed
 *  reskinem), ale z `interaktywnyStart` — po kliknięciu nagłówka „Zacznij"
 *  w CzymJestVesicaKarma.tsx (współdzielony stan przez KoloKarmyStartContext)
 *  gaśnie do taupe i odkrywa się dopiero przez najeżdżanie. Prawdziwy,
 *  trwały wskaźnik postępu taupe→złoto to osobny język Mojego Panelu i jego
 *  breadcrumbów na podstronach — KoloKarmyMini.tsx. */
const WSZYSTKIE_SYSTEMY = new Set<SystemKarmy>(["astrologia", "hiromancja", "numerologia"]);

export default function KoloKarmy({ ukonczone: ukonczoneProp = WSZYSTKIE_SYSTEMY, interaktywnyStart = false }: {
  ukonczone?: Set<SystemKarmy>;
  /** Tryb strony głównej: koło startuje w pełnym złocie (bez interakcji);
   *  gdy `wystartowano` (z KoloKarmyStartContext, ustawiane przyciskiem gdzie
   *  indziej na stronie) płynnie gaśnie do taupe — dopiero wtedy najechanie
   *  na dany element zapala go z powrotem. */
  interaktywnyStart?: boolean;
}) {
  const t = useTranslations("KoloKarmy");
  const HOTSPOTY = HOTSPOTY_BAZA.map((h) => ({ ...h, label: t(`hotspoty.${h.id}`) }));
  const DANE_WSPOLNE = DANE_WSPOLNE_BAZA.map((d) => ({ ...d, label: t(`daneWspolne.${d.id}`) }));
  const SATELITY = SATELITY_BAZA.map((s) => ({
    ...s, label: t(`satelity.${s.id}.label`),
    lines: [t(`satelity.${s.id}.linia1`), t(`satelity.${s.id}.linia2`)],
  }));
  const [aktywny, setAktywny] = useState<string | null>(null);
  const [tip, setTip] = useState<{ label: string; left: number; top: number } | null>(null);
  const [hoverTytul, setHoverTytul] = useState(false);
  const { wystartowano } = useKoloKarmyStart();
  // PRAWDZIWY POSTĘP (system zaliczony po interpretacji) — widoczny wszędzie, gdzie jest
  // koło: na stronie głównej po „Zacznij" (zamiast zgaszonego koła), w nagłówkach
  // podstron razem z bieżącą sekcją. Komplet 3/3 = całe koło złote + poświata.
  const postep = usePostepKarmy();
  const komplet = postep.size >= 3;
  const ukonczone = interaktywnyStart
    ? (wystartowano ? postep : WSZYSTKIE_SYSTEMY)
    : new Set<SystemKarmy>([...ukonczoneProp, ...postep]);

  // Animacje zaliczenia czekają w kolejce, aż koło będzie widoczne na ekranie
  // (interpretacja jest na dole strony, koło na górze): najpierw rozbłysk
  // zaliczonego kręgu, po trzecim — światło obiegające zewnętrzny krąg.
  const koloRef = useRef<HTMLDivElement>(null);
  const [rozblysk, setRozblysk] = useState<SystemKarmy | null>(null);
  const [final, setFinal] = useState(false);
  useEffect(() => {
    const el = koloRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const timery: ReturnType<typeof setTimeout>[] = [];
    const obs = new IntersectionObserver((wpisy) => {
      if (!wpisy.some((w) => w.isIntersecting)) return;
      const kolejka = animacjeDoPokazania();
      if (!kolejka.length) return;
      wyczyscAnimacje();
      obs.disconnect();
      let t = 400;
      for (const a of kolejka) {
        if (a === "final") {
          timery.push(setTimeout(() => setFinal(true), t));
          timery.push(setTimeout(() => setFinal(false), t + 3400));
          t += 3400;
        } else {
          timery.push(setTimeout(() => setRozblysk(a), t));
          timery.push(setTimeout(() => setRozblysk(null), t + 1500));
          t += 1700;
        }
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => { obs.disconnect(); timery.forEach(clearTimeout); };
  }, []);

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
  const wszystkoZlote = komplet || (interaktywnyStart ? !wystartowano : ukonczoneProp.size >= 3);

  // Na stronie glownej, zanim ktos nacisnie "Zacznij", nie mozna wejsc wprost
  // w Astrologie/Numerologie/Hiromancje ani w satelity Astrokartografia/
  // Mahadasze/Karma — mozna je tylko podejrzec hoverem (podswietlenie
  // zostaje, patrz wskaz/schowaj nizej). Panel i Zwiazki NIE sa objete tym
  // ograniczeniem — to osobne funkcje, nie "systemy"/etapy Karmy.
  const startBlokuje = interaktywnyStart && !wystartowano;

  return (
    <div ref={koloRef} className={komplet ? "kk-komplet" : undefined}
      style={{ position: "relative", maxWidth: 1000, margin: "0 auto", containerType: "inline-size" } as React.CSSProperties}>
      {/* baza jako dwie nałożone warstwy (taupe pod spodem, złota na wierzchu
          z przejściem opacity) zamiast twardej zmiany `src` — dzięki temu
          "Zacznij" na stronie głównej gasi koło płynnie, nie skokowo. */}
      <img src="/brand/kolo-karmy-taupe.png" alt={t("obrazAlt")}
        style={{ display: "block", width: "100%", height: "auto" }} />
      <img src="/brand/kolo-karmy-gold-clean.png" alt=""
        style={{
          position: "absolute", left: 0, top: 0, width: "100%", height: "100%",
          opacity: wszystkoZlote ? 1 : 0, transition: "opacity 0.9s ease",
        }} />

      {/* pętle „ukończonych" systemów — złote wypełnienie zamiast domyślnego
          taupe, bez poświaty (ostra krawędź, jak reszta grafiki); te same
          złote wycinki wracają na hover nawet dla systemów jeszcze
          nieukończonych (kk-fill-hover-aktywny), więc podświetlenie jest
          dokładnie tym samym kolorem/kształtem co stan „ukończony", nie
          osobnym rozmytym efektem. Renderowane zawsze (nie tylko gdy
          !wszystkoZlote) — na stronie głównej w trybie interaktywnym trzeba
          im dać szansę animować się razem z gaśnięciem bazy. */}
      {(["astrologia", "hiromancja", "numerologia"] as const).map((id) => (
        <img key={`fill-${id}`} src={`/brand/fill-${id}-gold.png`} alt=""
          className={`kk-fill-hover${ukonczone.has(id) || aktywny === id ? " kk-fill-hover-aktywny" : ""}${rozblysk === id ? " kk-rozblysk" : ""}`}
          style={{ left: 0, top: 0, width: "100%", height: "100%" }} />
      ))}
      <MoonStars box={SEGMENT_GAPY.astrologia} zlote={ukonczone.has("astrologia") || aktywny === "astrologia"} />

      {/* finał 3/3 — jasne złote światło obiega zewnętrzny krąg Karmy, potem gaśnie
          (zostaje stała, „oddychająca" poświata całego koła: .kk-komplet) */}
      {final && (
        <svg viewBox={`0 0 ${IMG_W} ${IMG_H}`} aria-hidden="true" className="kk-final"
          style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          <defs>
            <filter id="kk-final-blask" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="9" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <circle className="kk-final-krag" cx={CX} cy={CY} r={326.5} fill="none"
            stroke="#fff3d6" strokeWidth={30} strokeLinecap="round" filter="url(#kk-final-blask)"
            transform={`rotate(-90 ${CX} ${CY})`} pathLength={100} />
        </svg>
      )}

      {/* poświata pól o nieregularnym kształcie — astrologia/hiromancja/
          numerologia pominięte: hover-feedback dla wszystkich trzech daje
          już puls piktogramu (MoonStars / PIKTOGRAMY_PULSUJACE), stara
          poświata dawała niespójny, zbędny efekt w tle. Astrokartografia/
          mahadasze/karma też pominięte — maska (flood fill) nie pasowała
          dokładnie do krzywizny złotego pierścienia, więc poświata wystawała
          poza niego (widoczne jako "skrzydło" na zdjęciu od użytkownika). */}
      {[...KSZTALTNE].filter((id) => !["astrologia", "hiromancja", "numerologia", "astrokartografia", "mahadasze", "karma"].includes(id)).map((id) => (
        <img key={`glow-${id}`} src={`/brand/glow-${id}.png`} alt=""
          className={`kk-glow-ksztalt${aktywny === id ? " kk-glow-aktywny" : ""}`}
          style={{ left: 0, top: 0, width: "100%", height: "100%" }} />
      ))}
      {/* podświetlenie Związków na hover — realny, ostry wycinek własnego
          kształtu ikony (fill-zwiazki-gold.png), ten sam wzorzec co pętle
          systemów wyżej, zamiast poprzedniej rozmytej poświaty (radial-
          gradient + mix-blend-mode). */}
      <img src="/brand/fill-zwiazki-gold.png" alt=""
        className={`kk-fill-hover${aktywny === "zwiazki" ? " kk-fill-hover-aktywny" : ""}`}
        style={{ left: 0, top: 0, width: "100%", height: "100%" }} />

      {/* piktogramy — leżą idealnie na tle. Zapalają się złotem razem z
          pętlą na hover (nie tylko gdy trwale "ukończone"), tą samą
          warstwą crossfade co reszta koła — spójne z gaszeniem "Zacznij". */}
      {PIKTOGRAMY_PULSUJACE.map((p) => (
        <IkonaCrossfade key={`ikona-${p.id}`} id={p.id} box={p.box}
          zlote={ukonczone.has(p.id as SystemKarmy) || aktywny === p.id} />
      ))}

      {/* piktogramy wspólne — złote, gdy choć jeden z dwóch systemów w
          przecięciu jest ukończony LUB akurat pod kursorem (na stronie
          głównej wszystkoZlote=true, więc i tak zawsze złote — to działa
          naprawdę dopiero po "Zacznij" albo na /astrologia, /hiromancja,
          /numerologia, gdzie ukonczone ma 1 element). */}
      {PIKTOGRAMY_WSPOLNE.map((p) => {
        const zlote = wszystkoZlote || p.pary.some((id) => ukonczone.has(id) || aktywny === id);
        return <IkonaCrossfade key={`ikona-wspolna-${p.id}`} id={p.id} box={p.box} zlote={zlote} />;
      })}

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
          const top = { x: p.x, y: p.y - 74 };
          return (
            <g className={`kk-tytul${hoverTytul ? " kk-tytul-widoczny" : ""}`}>
              <circle cx={p.x} cy={p.y} r="6" className="kk-tytul-kropka" />
              <line x1={p.x} y1={p.y} x2={top.x} y2={top.y} className="kk-tytul-linia" />
              <text x={top.x + 22} y={top.y + 24} className="kk-tytul-eyebrow">{t("tytulEyebrow")}</text>
              <text x={top.x + 22} y={top.y + 76} className="kk-tytul-glowny">{t("tytulGlowny")}</text>
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
      {SATELITY.map((s) => {
        const styl = {
          left: pctX(s.gap[0]), top: pctY(s.gap[1]),
          width: pctX(s.gap[2] - s.gap[0]), height: pctY(s.gap[3] - s.gap[1]),
        };
        // Astrokartografia/Mahadasze/Karma tez wymagaja Zacznij na stronie
        // glownej — patrz startBlokuje przy plateczkach Astrologii/Numerologii/
        // Hiromancji wyzej, ten sam mechanizm (hover dziala, klik nie nawiguje).
        return startBlokuje ? (
          <span key={s.id} tabIndex={0} role="button" aria-disabled="true" aria-label={s.label}
            className="kk-hit kk-hit-prostokat" style={styl}
            onMouseEnter={wskaz(s.id, s.label)} onMouseLeave={schowaj}
            onFocus={wskaz(s.id, s.label)} onBlur={schowaj}
          />
        ) : (
          <Link key={s.id} href={s.href} aria-label={s.label} className="kk-hit kk-hit-prostokat" style={styl}
            onMouseEnter={wskaz(s.id, s.label)} onMouseLeave={schowaj}
            onFocus={wskaz(s.id, s.label)} onBlur={schowaj}
          />
        );
      })}

      {/* uchwyty klikalne — pełny płatek Astrologii/Hiromancji/Numerologii (nad
          szczelinami satelitów). Renderowane PRZED soczewkami przenikania —
          soczewki „gdzie/kiedy/kto" leżą w środku płatków, więc muszą być nad
          nimi w DOM, żeby wygrywały hover w tym mniejszym, bardziej precyzyjnym
          obszarze, zamiast oddawać go całemu (dużo większemu) płatkowi. */}
      {HOTSPOTY.filter((n) => n.gap).map((n) => {
        const styl = {
          left: pctX(n.gap![0]), top: pctY(n.gap![1]),
          width: pctX(n.gap![2] - n.gap![0]), height: pctY(n.gap![3] - n.gap![1]),
        };
        // Zablokowane pole zostaje najezdzalne (podswietlenie + dymek dzialaja
        // dalej, patrz startBlokuje wyzej), tylko bez nawigacji po kliknieciu.
        return startBlokuje ? (
          <span key={n.id} tabIndex={0} role="button" aria-disabled="true" aria-label={n.label}
            className="kk-hit kk-hit-prostokat" style={styl}
            onMouseEnter={wskaz(n.id, n.label)} onMouseLeave={schowaj}
            onFocus={wskaz(n.id, n.label)} onBlur={schowaj}
          />
        ) : (
          <Link key={n.id} href={n.href} aria-label={n.label} className="kk-hit kk-hit-prostokat" style={styl}
            onMouseEnter={wskaz(n.id, n.label)} onMouseLeave={schowaj}
            onFocus={wskaz(n.id, n.label)} onBlur={schowaj}
          />
        );
      })}

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
