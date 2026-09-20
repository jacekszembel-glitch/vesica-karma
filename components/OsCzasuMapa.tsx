"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GRAHAS } from "@/lib/astro/constants";
import { rokDlaWieku } from "@/lib/astro/mapaCzasuJogUtils";
import { useRuchDozwolony } from "@/components/OsZycia";
import type { FazaZycia } from "@/components/MapaCzasuJog";

const AXIS_W = 88;
const COL_W = 58;
const BAR_W = 24;
// 4px/rok, nie 3 — przy krótszych mahadaszach (Słońce 6 lat, Mars/Ketu 7 lat)
// 3px/rok dawało tyle miejsca, że sąsiednie etykiety lat prawie się stykały.
const WYS_NA_ROK = 4;
const MIN_WYS = 220;

/** Jedno okno aktywności w kolumnie — już z policzonym przez wywołującego opacity/tytułem. */
export interface OknoOsi {
  key: string;
  fromAge: number;
  toAge: number;
  /** Finalna nieprzezroczystość (np. opacityMocy/silaDoszy) — 0..1. */
  opacity: number;
  /** Wygaszony/przekreślony styl — np. dosza zniesiona klasyczną regułą Bhanga. */
  wygaszona?: boolean;
  title: string;
  ariaLabel: string;
}

/** Jedna kolumna osi — joga albo dosza, komponent nie wie która. */
export interface KolumnaOsi {
  id: string;
  /** title dla kropki nagłówka kolumny. */
  tytul: string;
  /** Symbole planet pod kropką nagłówka. */
  etykieta: React.ReactNode;
  kolor: string;
  okna: OknoOsi[];
}

/**
 * OŚ CZASU MAPY — w duchu Osi Życia: czas płynie z góry na dół, wiek i rok
 * przy lewej krawędzi. Wspólne wyliczenia dla Mapy Czasu Jog i Mapy Czasu Dosz —
 * komponent przyjmuje generyczne kolumny i nie wie, czy rysuje jogi czy
 * dosze; kolor, opacity i treść dymka dostarcza wywołujący.
 *
 * Cały wykres stoi w całości, bez wewnętrznego paska przewijania — strona
 * przewija się normalnie.
 */
export default function OsCzasuMapa({
  birth, lifePhases, kolumny, totalYears, wiekTeraz, aktywnaKolumna, setAktywnaKolumna, renderDymek, onKlikBelki,
}: {
  birth: Date; lifePhases: FazaZycia[]; kolumny: KolumnaOsi[]; totalYears: number; wiekTeraz: number | null;
  aktywnaKolumna: string | null; setAktywnaKolumna: (v: string | null) => void;
  renderDymek: (faza: FazaZycia) => React.ReactNode;
  /** Klik (lub Enter/Spacja) na belce — id kolumny, żeby wywołujący mógł rozwinąć odpowiadającą pozycję w legendzie pod wykresem. */
  onKlikBelki: (kolumnaId: string) => void;
}) {
  const [aktywnaMahadasza, setAktywnaMahadasza] = useState<number | null>(null);
  // Najechanie na PUSTE pole (bez świeczki jogi) też ma podświetlać okres i pokazywać dymek —
  // aktywnaKolumna zostaje wtedy null (żadna kolumna nie ma być wyróżniona), więc dymekWidoczny
  // potrzebuje osobnej flagi zamiast polegać tylko na aktywnaKolumna !== null.
  const [nadPasem, setNadPasem] = useState(false);
  const wys = Math.max(MIN_WYS, totalYears * WYS_NA_ROK);
  const y = (age: number) => (Math.min(age, totalYears) / totalYears) * wys;
  const fazaAktywna = aktywnaMahadasza !== null ? lifePhases[aktywnaMahadasza] : null;
  const ruch = useRuchDozwolony();
  const sciezkaOsi = `M ${AXIS_W - 2} 6 L ${AXIS_W - 2} ${wys - 6}`;

  // Dymek renderujemy PRZEZ PORTAL do <body> (jak Term.tsx) i pozycjonujemy
  // na sztywno względem okna — inaczej kontener z overflow-x:auto (patrz
  // wyżej) przycina go, gdy wystaje poniżej swojej wysokości. Podąża za
  // kursorem myszy (z małym przesunięciem, jak natywny tooltip), nie za
  // stałym punktem na wierszu — inaczej dla wysokiej mahadaszy dymek
  // pojawiał się daleko od miejsca, gdzie akurat jest mysz.
  const rzedRef = useRef<HTMLDivElement>(null);
  const dymekRef = useRef<HTMLDivElement>(null);
  const [dymekPos, setDymekPos] = useState<{ left: number; top: number } | null>(null);
  const [mysz, setMysz] = useState<{ x: number; y: number } | null>(null);
  const dymekWidoczny = fazaAktywna !== null && (aktywnaKolumna !== null || nadPasem);

  useLayoutEffect(() => {
    if (!dymekWidoczny || !mysz) { setDymekPos(null); return; }
    const h = dymekRef.current?.offsetHeight ?? 200;
    const w = 260;
    const ODSTEP = 16;
    let left = mysz.x + ODSTEP;
    let top = mysz.y + ODSTEP;
    if (left + w + 12 > window.innerWidth) left = mysz.x - w - ODSTEP;
    if (top + h + 12 > window.innerHeight) top = mysz.y - h - ODSTEP;
    left = Math.max(12, left);
    top = Math.max(12, top);
    setDymekPos({ left, top });
  }, [dymekWidoczny, mysz]);

  const fazaIdx = (fromAge: number) => lifePhases.findIndex((ph) => ph.fromAge === fromAge);

  return (
    <div>
      {/* overflowX: "auto" bez jawnego overflowY zmusza Chrome do policzenia
          overflow-y jako "auto" też (kwirk specyfikacji przeglądarek przy
          mieszaniu osi) — bez paddingBottom to obcina etykietę ostatniej
          granicy wieku (wystaje position:absolute poza wys) i pokazuje
          niechciany pionowy scrollbar. */}
      <div style={{ overflowX: "auto", paddingBottom: 36 }}>
        {/* etykiety kolumn — nad wykresem, żeby było widać, która kolumna to co */}
        <div style={{
          display: "flex", marginLeft: AXIS_W,
          paddingBottom: 6, marginBottom: 4, borderBottom: "1px solid var(--line-soft)",
        }}>
          {kolumny.map((k) => {
            const aktywna = aktywnaKolumna === k.id;
            return (
              <div key={k.id}
                title={k.tytul}
                onMouseEnter={() => setAktywnaKolumna(k.id)}
                onMouseLeave={() => setAktywnaKolumna(null)}
                style={{
                  width: COL_W, flexShrink: 0, textAlign: "center", cursor: "pointer", paddingTop: 4,
                  opacity: aktywnaKolumna && !aktywna ? 0.5 : 1, transition: "opacity 0.2s",
                }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: k.kolor, display: "inline-block" }} />
                <div style={{ display: "flex", justifyContent: "center", gap: 1, marginTop: 2 }}>
                  {k.etykieta}
                </div>
              </div>
            );
          })}
        </div>

      <div ref={rzedRef} style={{ display: "flex", position: "relative", minWidth: AXIS_W + kolumny.length * (COL_W + 2) }}
        onMouseMove={(e) => setMysz({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => { setAktywnaMahadasza(null); setAktywnaKolumna(null); setNadPasem(false); }}>
        {/* naprzemienne cieniowanie pasów mahadasz na całej szerokości (oś + wykres) — pierwsze
            w kolejności DOM-u, więc maluje się pod resztą bez z-index (ujemny z-index bez własnego
            kontekstu warstw potrafi schować się za tłem karty zamiast tylko za rodzeństwem) */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {lifePhases.map((ph, i) => (
            <div key={i} style={{
              position: "absolute", top: y(ph.fromAge), left: 0, right: 0,
              height: y(Math.min(ph.toAge, totalYears)) - y(ph.fromAge),
              background: i % 2 === 0 ? "rgba(255,255,255,0.05)" : "transparent",
            }} />
          ))}
        </div>

        {/* światełko biegnące wzdłuż osi — ten sam pomysł co w Osi Życia, żeby oś czuła się żywa */}
        <svg style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
          width={AXIS_W} height={wys} viewBox={`0 0 ${AXIS_W} ${wys}`} aria-hidden>
          <defs>
            <linearGradient id="ocm-osiowy" x1="0" y1="0" x2="0" y2={wys} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="rgba(230,196,138,0.15)" />
              <stop offset="0.1" stopColor="#e6c48a" />
              <stop offset="0.9" stopColor="#c39a3b" />
              <stop offset="1" stopColor="rgba(195,154,59,0.15)" />
            </linearGradient>
            <filter id="ocm-blask" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="2.4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="ocm-blask-miekki" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <radialGradient id="ocm-iskra" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#fff3d6" />
              <stop offset="0.4" stopColor="#e6c48a" />
              <stop offset="1" stopColor="rgba(230,196,138,0)" />
            </radialGradient>
          </defs>
          <path d={sciezkaOsi} stroke="#c9a23b" strokeWidth="1.4" opacity="0.7" strokeLinecap="round" />
          <path d={sciezkaOsi} stroke="url(#ocm-osiowy)" strokeWidth="2.2" filter="url(#ocm-blask)" strokeLinecap="round" />
          {/* kula światła z ogonem komety — ten sam pomysł co w Osi Życia, żeby oś czuła się żywa */}
          {ruch && (
            <g>
              <circle r="4" fill="url(#ocm-iskra)" opacity="0.25">
                <animateMotion dur="8s" begin="-7.65s" repeatCount="indefinite" path={sciezkaOsi} />
              </circle>
              <circle r="5.2" fill="url(#ocm-iskra)" opacity="0.5">
                <animateMotion dur="8s" begin="-7.8s" repeatCount="indefinite" path={sciezkaOsi} />
              </circle>
              <circle r="6.4" fill="url(#ocm-iskra)" opacity="0.9">
                <animateMotion dur="8s" repeatCount="indefinite" path={sciezkaOsi} />
              </circle>
              <circle r="2.4" fill="#fff3d6" filter="url(#ocm-blask-miekki)">
                <animateMotion dur="8s" repeatCount="indefinite" path={sciezkaOsi} />
              </circle>
            </g>
          )}
        </svg>

        {/* oś — wiek i rok, granice mahadasz najechalne (podświetlają cały pas) */}
        <div style={{ position: "relative", width: AXIS_W, flexShrink: 0, height: wys }}>
          {lifePhases.map((ph, i) => (
            <div key={i}
              role="button" tabIndex={0}
              title={`Mahadasha ${GRAHAS[ph.lord].pl}: ${Math.round(ph.fromAge)}–${Math.round(ph.toAge)} lat (${rokDlaWieku(birth, ph.fromAge)}–${rokDlaWieku(birth, ph.toAge)})`}
              onMouseEnter={() => { setAktywnaMahadasza(i); setAktywnaKolumna(null); }}
              onFocus={() => { setAktywnaMahadasza(i); setAktywnaKolumna(null); }}
              onBlur={() => setAktywnaMahadasza(null)}
              style={{
                position: "absolute", top: y(ph.fromAge), left: 0, right: 0,
                borderTop: "1px solid var(--line-soft)", paddingTop: 3, cursor: "pointer",
                background: aktywnaMahadasza === i ? "rgba(230,196,138,0.08)" : "transparent",
              }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3, whiteSpace: "nowrap" }}>
                <span style={{ color: GRAHAS[ph.lord].color, fontSize: "1rem" }}>{GRAHAS[ph.lord].symbol}</span>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--teal-soft)", fontVariantNumeric: "tabular-nums" }}>
                  {rokDlaWieku(birth, ph.fromAge)}
                </span>
                <span className="muted" style={{ fontSize: "0.58rem", fontVariantNumeric: "tabular-nums" }}>{Math.round(ph.fromAge)}l.</span>
              </div>
            </div>
          ))}
          {/* domknięcie ostatniej granicy */}
          <div style={{ position: "absolute", top: y(totalYears), left: 0, right: 0, borderTop: "1px solid var(--line-soft)", paddingTop: 3, whiteSpace: "nowrap" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--teal-soft)", fontVariantNumeric: "tabular-nums" }}>
              {rokDlaWieku(birth, totalYears)}
            </span>{" "}
            <span className="muted" style={{ fontSize: "0.58rem", fontVariantNumeric: "tabular-nums" }}>{Math.round(totalYears)}l.</span>
          </div>
        </div>

        {/* pas podświetlający najechaną mahadaszę na całej szerokości kolumn */}
        <div style={{ position: "relative", flex: 1 }}>
          {fazaAktywna && (
            <div style={{
              position: "absolute", left: 0, right: 0,
              top: y(fazaAktywna.fromAge), height: y(fazaAktywna.toAge) - y(fazaAktywna.fromAge),
              background: "rgba(230,196,138,0.055)",
              borderTop: "1px solid rgba(230,196,138,0.25)", borderBottom: "1px solid rgba(230,196,138,0.25)",
              pointerEvents: "none", zIndex: 0,
            }} />
          )}

          {/* dymek — tylko po najechaniu na konkretną świeczkę, nie na sam pas osi.
              Portal do <body>, bo inaczej kontener z overflow-x:auto (patrz komentarz
              na górze pliku) przycina go, gdy wystaje poniżej wykresu. */}
          {dymekWidoczny && fazaAktywna && typeof document !== "undefined" && createPortal(
            <div ref={dymekRef} style={{
              position: "fixed", left: dymekPos?.left ?? -9999, top: dymekPos?.top ?? -9999,
              visibility: dymekPos ? "visible" : "hidden", zIndex: 9999, pointerEvents: "none",
            }}>
              {renderDymek(fazaAktywna)}
            </div>,
            document.body,
          )}

          {/* poziome linie granic mahadasz — cichy kontekst pod kolumnami */}
          {lifePhases.map((ph, i) => (
            <div key={i} style={{
              position: "absolute", top: y(ph.fromAge), left: 0, right: 0,
              borderTop: "1px solid rgba(255,255,255,0.06)", pointerEvents: "none",
            }} />
          ))}

          {/* linia "teraz" */}
          {wiekTeraz !== null && (
            <div style={{
              position: "absolute", top: y(wiekTeraz), left: 0, right: 0,
              borderTop: "2px dashed var(--primary)", pointerEvents: "none", zIndex: 1,
            }}>
              <span style={{
                position: "absolute", top: -16, left: 4, fontSize: "0.62rem",
                color: "var(--primary-soft)", letterSpacing: "0.04em",
              }}>
                TERAZ
              </span>
            </div>
          )}

          {/* pasy najechalne na CAŁĄ szerokość każdej mahadaszy — bez tego puste pole (tam,
              gdzie żadna świeczka jogi nie sięga) było martwe: nie podświetlało okresu i nie
              pokazywało dymka. Leżą pod świeczkami (niższy DOM = niższy priorytet trafienia
              myszy przy tym samym z-index), więc świeczka nad nimi nadal wygrywa hover. */}
          {lifePhases.map((ph, i) => (
            <div key={i}
              onMouseEnter={() => { setAktywnaMahadasza(i); setAktywnaKolumna(null); setNadPasem(true); }}
              onMouseLeave={() => setNadPasem(false)}
              style={{
                position: "absolute", top: y(ph.fromAge), left: 0, right: 0,
                height: Math.max(y(Math.min(ph.toAge, totalYears)) - y(ph.fromAge), 1),
              }} />
          ))}

          {/* kolumny — podświetlenie idzie po CZASIE (aktywnaMahadasza), nie po tożsamości
              kolumny: najechanie na jeden odcinek nie ma podświetlać innego, odległego w czasie
              odcinka tej samej kolumny — tylko to, co dzieje się w TYM SAMYM okresie. */}
          <div style={{ display: "flex", height: wys, position: "relative", pointerEvents: "none" }}>
            {kolumny.map((k, ci) => {
              const uczestniczy = aktywnaMahadasza !== null && k.okna.some((o) => fazaIdx(o.fromAge) === aktywnaMahadasza);
              const kolumnaAktywna = aktywnaKolumna === k.id;
              return (
                <div key={k.id}
                  style={{
                    position: "relative", width: COL_W, flexShrink: 0,
                    borderLeft: ci > 0 ? "1px solid var(--line-soft)" : "none",
                    background: kolumnaAktywna ? `${k.kolor}1f` : "transparent",
                    opacity: aktywnaMahadasza !== null && !uczestniczy ? 0.45 : 1,
                    transition: "opacity 0.2s, background 0.2s",
                    // pusty kontener kolumny NIE ma przechwytywać myszy — inaczej blokuje pas
                    // najechalny pod spodem (patrz wyżej) w miejscach bez świeczki jogi. Same
                    // świeczki jawnie włączają sobie pointer-events niżej.
                    pointerEvents: "none",
                  }}>
                  {k.okna.map((o) => {
                    const top = y(o.fromAge);
                    const h = Math.max(y(o.toAge) - top, 5);
                    const podswietlony = aktywnaMahadasza === fazaIdx(o.fromAge);
                    return (
                      <div key={o.key}
                        role="button"
                        tabIndex={0}
                        aria-label={o.ariaLabel}
                        title={o.title}
                        onMouseEnter={(e) => { setAktywnaMahadasza(fazaIdx(o.fromAge)); setAktywnaKolumna(k.id); setMysz({ x: e.clientX, y: e.clientY }); }}
                        onFocus={() => { setAktywnaMahadasza(fazaIdx(o.fromAge)); setAktywnaKolumna(k.id); }}
                        onBlur={() => { setAktywnaMahadasza(null); setAktywnaKolumna(null); }}
                        onClick={(e) => { e.stopPropagation(); setAktywnaKolumna(k.id); onKlikBelki(k.id); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); setAktywnaKolumna(k.id); onKlikBelki(k.id); }
                        }}
                        style={{
                          position: "absolute", top, left: (COL_W - BAR_W) / 2, width: BAR_W, height: h,
                          pointerEvents: "auto",
                          borderRadius: 999,
                          background: k.kolor,
                          opacity: (podswietlony ? 1 : 0.88) * (o.wygaszona ? Math.min(o.opacity, 0.35) : o.opacity),
                          border: o.wygaszona ? "1px dashed rgba(255,255,255,0.45)" : "none",
                          boxShadow: o.wygaszona ? "none" : (podswietlony
                            ? `0 0 0 2px var(--surface), 0 0 14px ${k.kolor}99`
                            : `0 0 0 2px var(--surface)`),
                          cursor: "pointer",
                          zIndex: podswietlony ? 6 : 2,
                          transition: "opacity 0.2s, box-shadow 0.2s",
                        }} />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
