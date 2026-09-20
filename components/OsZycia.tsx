"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GRAHAS } from "@/lib/astro/constants";
import type { DashaPeriod } from "@/lib/astro/dasha";
import type { VedicChart } from "@/lib/astro/chart";
import { ocenaWladcy } from "@/lib/astro/sila";
import { wykryteJogi } from "@/lib/astro/yogas";
import { KATEGORIA_KOLOR } from "@/components/KoloJog";
import { nazwaZPara } from "@/lib/astro/mapaCzasuJogUtils";
import Term from "@/components/Term";

/**
 * MAPA ŻYCIA — cały cykl Vimshottari jako jeden diagram.
 *
 * Warstwa informacyjna: rozdziały naprzemiennie wobec osi (prawo/lewo),
 * lata i wiek zawsze przy osi, ton z pełnej oceny władcy (sila.ts),
 * podokresy rozwijane dotknięciem, przeszłość przygaszona.
 *
 * Warstwa wizualna — przywrócona z pierwotnej osi orbitalnej: złota oś
 * z gradientem i poświatą, KULA ŚWIATŁA biegnąca z góry na dół oraz
 * kreskowane orbity wokół węzła TERAZ. Oś jest nakładką SVG mierzoną do
 * rzeczywistej wysokości listy, więc całość stoi BEZ wewnętrznego paska
 * przewijania — widać całe życie naraz.
 */

const ROK_MS = 365.25 * 86400000;

/** Ile pikseli na rok trwania rozdziału. */
const PX_NA_ROK = 7;
const MIN_WYS = 58;
const MAX_WYS = 170;

type Ton = "wspierający" | "wymagający" | "mieszany";

/** Współdzielone z OsCzasuRodziny.tsx — ten sam kolor tonu okresu wszędzie w serwisie. */
export const TON_KOLOR: Record<Ton, string> = {
  "wspierający": "#6fbf9f",
  "wymagający": "#e08a63",
  "mieszany": "#93a6b3",
};

const mies = (d: Date) => d.toLocaleDateString("pl-PL", { month: "short", year: "2-digit" });

interface Rozdzial {
  okres: DashaPeriod;
  /** Początek przycięty do daty urodzenia — pierwsza mahadasza zaczyna się wcześniej. */
  start: Date;
  end: Date;
  wiekOd: number;
  wiekDo: number;
  lata: number;
  stan: "przeszłość" | "teraz" | "przyszłość";
}

/** Wymiary nakładki świetlnej, mierzone z DOM-u. */
interface Swiatlo {
  w: number;
  h: number;
  /** Pozioma pozycja osi. */
  x: number;
  /** Pionowy środek węzła TERAZ (orbity); null, gdy brak bieżącego. */
  terazY: number | null;
}

/** SMIL w SVG nie reaguje na prefers-reduced-motion — bramkujemy go w JS. */
export function useRuchDozwolony(): boolean {
  const [ok, setOk] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reaguj = () => setOk(!mq.matches);
    reaguj();
    mq.addEventListener("change", reaguj);
    return () => mq.removeEventListener("change", reaguj);
  }, []);
  return ok;
}

export default function OsZycia({ dashas, birth, chart }: {
  dashas: DashaPeriod[]; birth: Date;
  /** Mapa urodzeniowa — z nią ton uwzględnia pełną ocenę władcy. */
  chart?: VedicChart;
}) {
  const [teraz] = useState(() => Date.now());
  const [rozwiniety, setRozwiniety] = useState<number | null>(null);
  /** Który podokres (antardasza) w obrębie otwartego rozdziału ma rozwinięty kolejny poziom (pratjantardasza). */
  const [rozwinietyPod, setRozwinietyPod] = useState<number | null>(null);
  const [swiatlo, setSwiatlo] = useState<Swiatlo | null>(null);
  const ruch = useRuchDozwolony();
  const listaRef = useRef<HTMLDivElement>(null);

  /**
   * PRÓBA: warstwa jog wprost na rozdziałach — alternatywa dla osobnej Mapy
   * czasu jog, testowana obok niej (przełącznik, nic nie znika). Kropka w
   * kolorze kategorii przy nagłówku rozdziału = joga aktywna w tej mahadaszy.
   */
  const jogi = useMemo(() => (chart?.angles ? wykryteJogi(chart) : []), [chart]);

  const rozdzialy = useMemo<Rozdzial[]>(() => {
    const birthMs = birth.getTime();
    return dashas
      .filter((d) => d.end.getTime() > birthMs)
      .map((d) => {
        const start = d.start.getTime() < birthMs ? birth : d.start;
        return {
          okres: d,
          start,
          end: d.end,
          wiekOd: Math.max(0, (start.getTime() - birthMs) / ROK_MS),
          wiekDo: (d.end.getTime() - birthMs) / ROK_MS,
          lata: (d.end.getTime() - start.getTime()) / ROK_MS,
          stan: d.end.getTime() < teraz ? "przeszłość"
            : d.start.getTime() <= teraz ? "teraz" : "przyszłość",
        } as Rozdzial;
      })
      .filter((r) => r.wiekOd < 100);
  }, [dashas, birth, teraz]);

  const idxTeraz = rozdzialy.findIndex((r) => r.stan === "teraz");
  const [poprzedniIdxTeraz, setPoprzedniIdxTeraz] = useState<number | null>(null);
  if (idxTeraz !== poprzedniIdxTeraz) {
    setPoprzedniIdxTeraz(idxTeraz);
    setRozwiniety(idxTeraz >= 0 ? idxTeraz : null);
  }

  /**
   * Pomiar osi: pozioma pozycja toru, pełna wysokość listy i środek węzła
   * TERAZ. ResizeObserver łapie też zmianę wysokości po rozwinięciu
   * podokresów, więc kula zawsze biegnie po całej, aktualnej długości.
   */
  const zmierz = useCallback(() => {
    const lista = listaRef.current;
    if (!lista) return;
    const tor = lista.querySelector<HTMLElement>(".os-tor");
    if (!tor) return;
    const rl = lista.getBoundingClientRect();
    const rt = tor.getBoundingClientRect();
    const wezel = lista.querySelector<HTMLElement>(".os-wezel-teraz");
    const rw = wezel?.getBoundingClientRect();
    setSwiatlo({
      w: Math.round(rl.width),
      h: Math.round(lista.scrollHeight),
      x: Math.round(rt.left - rl.left + rt.width / 2),
      terazY: rw ? Math.round(rw.top - rl.top + rw.height / 2) : null,
    });
  }, []);

  useEffect(() => {
    zmierz();
    const lista = listaRef.current;
    if (!lista || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(zmierz);
    ro.observe(lista);
    return () => ro.disconnect();
  }, [zmierz, rozdzialy.length]);

  useEffect(() => { zmierz(); }, [rozwiniety, zmierz]);

  if (!rozdzialy.length) return null;

  const ostatni = rozdzialy[rozdzialy.length - 1];
  const sciezkaKuli = swiatlo ? `M ${swiatlo.x} 10 L ${swiatlo.x} ${swiatlo.h - 10}` : "";
  /** Orbity nie mogą wyjść poza kartę — promień przycięty do wolnego miejsca. */
  const rx1 = swiatlo ? Math.min(200, swiatlo.x - 16, swiatlo.w - swiatlo.x - 16) : 0;
  const rx2 = Math.min(132, rx1 * 0.66);

  return (
    <div className="os-zycia">
      <div className="os-legenda">
        <span><i className="os-kropka os-kropka-przeszlosc" /> przeszłość</span>
        <span><i className="os-kropka os-kropka-teraz" /> teraz</span>
        <span><i className="os-kropka os-kropka-przyszlosc" /> przyszłość</span>
        <span className="os-hint">
          dotknij rozdziału, aby rozwinąć <Term k="antardasza">podokresy</Term>
        </span>
      </div>

      <div className="os-lista" ref={listaRef}>
        {/* ── nakładka świetlna: złota oś, kula, orbity wokół TERAZ ── */}
        {swiatlo && (
          <svg
            className="os-swiatlo"
            viewBox={`0 0 ${swiatlo.w} ${swiatlo.h}`}
            width={swiatlo.w}
            height={swiatlo.h}
            aria-hidden
          >
            <defs>
              <linearGradient id="os-osiowy" x1="0" y1="0" x2="0" y2={swiatlo.h} gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="rgba(230,196,138,0.15)" />
                <stop offset="0.1" stopColor="#e6c48a" />
                <stop offset="0.9" stopColor="#c39a3b" />
                <stop offset="1" stopColor="rgba(195,154,59,0.15)" />
              </linearGradient>
              <filter id="os-blask" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="2.6" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="os-blask-miekki" x="-150%" y="-150%" width="400%" height="400%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
              <radialGradient id="os-iskra" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="#fff3d6" />
                <stop offset="0.4" stopColor="#e6c48a" />
                <stop offset="1" stopColor="rgba(230,196,138,0)" />
              </radialGradient>
            </defs>

            {/* orbity wokół bieżącego rozdziału */}
            {swiatlo.terazY !== null && rx1 > 40 && (
              <g>
                <ellipse cx={swiatlo.x} cy={swiatlo.terazY} rx={rx1} ry="76"
                  stroke="rgba(127,208,216,0.25)" strokeWidth="0.9" strokeDasharray="1 6" fill="none">
                  {ruch && <animate attributeName="stroke-dashoffset" values="0;140" dur="26s" repeatCount="indefinite" />}
                </ellipse>
                <ellipse cx={swiatlo.x} cy={swiatlo.terazY} rx={rx2} ry="50"
                  stroke="rgba(230,196,138,0.28)" strokeWidth="0.9" strokeDasharray="1 5" fill="none">
                  {ruch && <animate attributeName="stroke-dashoffset" values="140;0" dur="19s" repeatCount="indefinite" />}
                </ellipse>
              </g>
            )}

            {/* oś — solidna baza + gradientowa poświata */}
            <path d={sciezkaKuli} stroke="#c9a23b" strokeWidth="1.6" opacity="0.75" strokeLinecap="round" />
            <path d={sciezkaKuli} stroke="url(#os-osiowy)" strokeWidth="2.4" filter="url(#os-blask)" strokeLinecap="round" />

            {/* kula światła z ogonem komety (fazy przesunięte ujemnym begin) */}
            {ruch && (
              <g className="os-kula">
                <circle r="5" fill="url(#os-iskra)" opacity="0.25">
                  <animateMotion dur="7s" begin="-6.7s" repeatCount="indefinite" path={sciezkaKuli} />
                </circle>
                <circle r="6.5" fill="url(#os-iskra)" opacity="0.5">
                  <animateMotion dur="7s" begin="-6.85s" repeatCount="indefinite" path={sciezkaKuli} />
                </circle>
                <circle r="8" fill="url(#os-iskra)" opacity="0.9">
                  <animateMotion dur="7s" repeatCount="indefinite" path={sciezkaKuli} />
                </circle>
                <circle r="3" fill="#fff3d6" filter="url(#os-blask-miekki)">
                  <animateMotion dur="7s" repeatCount="indefinite" path={sciezkaKuli} />
                </circle>
              </g>
            )}
          </svg>
        )}

        {rozdzialy.map((r, i) => {
          const g = GRAHAS[r.okres.lord];
          const wys = Math.max(MIN_WYS, Math.min(MAX_WYS, r.lata * PX_NA_ROK));
          const otwarty = rozwiniety === i;
          const ocena = ocenaWladcy(chart, r.okres.lord);
          const t = ocena.ton;
          const poPrawej = i % 2 === 0;
          const jogiRozdzialu = jogi.filter((j) => j.planety.includes(r.okres.lord));

          return (
            <div
              key={i}
              className={poPrawej ? "os-rzad os-rzad-prawy" : "os-rzad os-rzad-lewy"}
              data-stan={r.stan}
              style={{ "--i": i } as React.CSSProperties}
            >
              {/* ── rok i wiek przy osi ── */}
              <div className="os-rok">
                <span className="os-rok-liczba">{r.start.getFullYear()}</span>
                <span className="os-rok-wiek">{Math.round(r.wiekOd)} l.</span>
              </div>

              {/* ── węzeł na osi ── */}
              <div className="os-tor" style={{ minHeight: otwarty ? undefined : wys }}>
                <span
                  className={`os-wezel${r.stan === "teraz" ? " os-wezel-teraz" : ""}`}
                  style={{ borderColor: g.color, color: g.color }}
                >
                  {g.symbol}
                </span>
              </div>

              {/* ── rozdział ── */}
              <div className="os-tresc">
                <button
                  type="button"
                  className="os-naglowek"
                  onClick={() => { setRozwiniety(otwarty ? null : i); setRozwinietyPod(null); }}
                  aria-expanded={otwarty}
                >
                  <span className="os-tytul">
                    {g.pl}
                    {r.stan === "teraz" && <span className="os-teraz">teraz</span>}
                  </span>
                  <span className="os-zakres">
                    do {r.end.getFullYear()} · {Math.round(r.lata)} {Math.round(r.lata) === 1 ? "rok" : Math.round(r.lata) < 5 ? "lata" : "lat"}
                  </span>
                  <span className="os-ton" style={{ color: TON_KOLOR[t], borderColor: TON_KOLOR[t] }}
                    title={"Skąd ta ocena: " + ocena.czynniki.join(" · ")}>
                    {t}
                  </span>
                  {jogiRozdzialu.length > 0 && (
                    <span className="os-jogi-kropki"
                      aria-label={`Jogi aktywne w tym okresie: ${jogiRozdzialu.map((j) => nazwaZPara(j)).join(", ")}`}>
                      {jogiRozdzialu.map((j) => (
                        <span key={j.id} className="os-jogi-kropka"
                          style={{ background: KATEGORIA_KOLOR[j.kategoria] }}
                          title={`${nazwaZPara(j)} — ${j.znaczenie}`} />
                      ))}
                    </span>
                  )}
                  <span className="os-strzalka" aria-hidden>{otwarty ? "▾" : "▸"}</span>
                </button>

                {otwarty && r.okres.sub && (
                  <ul className="os-podokresy">
                    {r.okres.sub
                      .filter((s) => s.end.getTime() > birth.getTime())
                      .map((s, j) => {
                        const sg = GRAHAS[s.lord];
                        const st = ocenaWladcy(chart, s.lord).ton;
                        const aktywny = s.start.getTime() <= teraz && s.end.getTime() > teraz;
                        const minelo = s.end.getTime() < teraz;
                        const podOtwarty = rozwinietyPod === j;
                        return (
                          <li key={j}
                            className={aktywny ? "os-pod-aktywny" : minelo ? "os-pod-minelo" : undefined}
                            style={{ "--j": j } as React.CSSProperties}>
                            <button type="button" className="os-pod-naglowek"
                              onClick={() => setRozwinietyPod(podOtwarty ? null : j)}
                              aria-expanded={podOtwarty}
                              disabled={!s.sub}>
                              <span className="os-pod-symbol" style={{ color: sg.color }}>{sg.symbol}</span>
                              <span className="os-pod-nazwa">{sg.pl}</span>
                              <span className="os-pod-daty">{mies(s.start)} — {mies(s.end)}</span>
                              <span className="os-pod-ton" style={{ background: TON_KOLOR[st] }} title={st} />
                              {s.sub && <span className="os-pod-strzalka" aria-hidden>{podOtwarty ? "▾" : "▸"}</span>}
                            </button>

                            {podOtwarty && s.sub && (
                              <ul className="os-podpodokresy">
                                {s.sub
                                  .filter((t) => t.end.getTime() > birth.getTime())
                                  .map((t, k) => {
                                    const tg = GRAHAS[t.lord];
                                    const tAktywny = t.start.getTime() <= teraz && t.end.getTime() > teraz;
                                    const tMinelo = t.end.getTime() < teraz;
                                    return (
                                      <li key={k}
                                        className={tAktywny ? "os-pod-aktywny" : tMinelo ? "os-pod-minelo" : undefined}>
                                        <span className="os-pod-symbol" style={{ color: tg.color }}>{tg.symbol}</span>
                                        <span className="os-pod-nazwa">{tg.pl}</span>
                                        <span className="os-pod-daty">{mies(t.start)} — {mies(t.end)}</span>
                                      </li>
                                    );
                                  })}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                  </ul>
                )}
              </div>
            </div>
          );
        })}

        {/* domknięcie osi — rok końca ostatniego rozdziału */}
        <div className={`os-rzad os-rzad-koniec ${rozdzialy.length % 2 === 0 ? "os-rzad-prawy" : "os-rzad-lewy"}`} data-stan="przyszłość">
          <div className="os-rok">
            <span className="os-rok-liczba">{ostatni.end.getFullYear()}</span>
            <span className="os-rok-wiek">{Math.round(ostatni.wiekDo)} l.</span>
          </div>
          <div className="os-tor os-tor-koniec">
            <span className="os-wezel os-wezel-koniec" />
          </div>
          <div className="os-tresc">
            <p className="muted" style={{ fontSize: "0.78rem", paddingTop: 14 }}>
              koniec widocznego cyklu
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
