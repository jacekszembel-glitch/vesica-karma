"use client";

import { useState } from "react";
import { przygotujUjecie, UJECIA, type Miejsce, type TypUjecia, type Ujecie } from "@/lib/hiromancjaObraz";

/**
 * SESJA ZDJĘĆ jednej ręki — dodatkowe ujęcia (zbliżenia z bliska, dłoń zgięta,
 * krawędź, grzbiet) z rysunkiem ułożenia, oraz „obejrzyj to miejsce”: stuknięcie
 * na zdjęciu głównym zaznacza punkt, z którego AI dostaje duże zbliżenie.
 * Osoba NIE podpisuje, co tam jest — AI ma samo opisać, co widzi (sprawdzenie,
 * nie podpowiedź). Zdjęcia żyją tylko w pamięci przeglądarki.
 */

const MAKS_MIEJSC = 3;

/** Schemat ułożenia dłoni do danego ujęcia (viewBox 60×64). */
function Schemat({ typ }: { typ: TypUjecia }) {
  const kreska = { fill: "none", stroke: "currentColor", strokeWidth: 1.6 } as const;
  const dlon = (
    <g {...kreska}>
      <rect x="15" y="26" width="30" height="30" rx="8" />
      {[16, 23, 30, 37].map((x, i) => <rect key={x} x={x} y={[10, 6, 8, 13][i]} width="6" height={[18, 22, 20, 15][i]} rx="3" />)}
      <path d="M 15 40 Q 6 36 7 28" />
    </g>
  );
  const ramka = (y0: number, y1: number) => (
    <rect x="9" y={y0} width="42" height={y1 - y0} rx="3" fill="var(--sand)" fillOpacity="0.16" stroke="var(--sand)" strokeDasharray="3 2" />
  );
  return (
    <svg viewBox="0 0 60 64" width="54" height="58" aria-hidden="true" style={{ color: "var(--sand)", flexShrink: 0 }}>
      {typ === "gora" && <>{dlon}{ramka(20, 42)}</>}
      {typ === "dol" && <>{dlon}{ramka(36, 60)}</>}
      {typ === "zgieta" && (
        <g {...kreska}>
          <path d="M 14 54 Q 10 38 16 26 L 44 26 Q 50 38 46 54 Z" />
          {[17, 24, 31, 38].map((x) => <path key={x} d={`M ${x + 3} 26 Q ${x + 1} 16 ${x + 4} 9`} />)}
          <path d="M 20 34 Q 30 40 41 33 M 19 42 Q 29 46 40 42" strokeWidth="1.2" />
        </g>
      )}
      {typ === "krawedz" && (
        <g {...kreska}>
          <path d="M 22 58 L 22 24 Q 22 14 30 10 L 36 10 Q 40 14 40 24 L 40 58" />
          <path d="M 40 30 L 44 30 M 40 33 L 44 33" stroke="var(--sand)" />
        </g>
      )}
      {typ === "grzbiet" && (
        <g {...kreska}>
          {dlon}
          {[16, 23, 30, 37].map((x, i) => <rect key={x} x={x + 1} y={[10, 6, 8, 13][i] + 1} width="4" height="5" rx="1.5" fill="var(--sand)" fillOpacity="0.5" />)}
        </g>
      )}
    </svg>
  );
}

export default function HiromancjaSesja({ etykieta, idBaza, dataUrlGlowne, ujecia, onUjecie, miejsca, onMiejsca }: {
  etykieta: string;
  idBaza: string;
  /** Zdjęcie główne tej ręki — do wskazywania miejsc. */
  dataUrlGlowne: string | null;
  ujecia: Partial<Record<TypUjecia, Ujecie>>;
  onUjecie: (typ: TypUjecia, u: Ujecie | null) => void;
  miejsca: Miejsce[];
  onMiejsca: (m: Miejsce[]) => void;
}) {
  const [wczytuje, setWczytuje] = useState<TypUjecia | null>(null);
  const [blad, setBlad] = useState<string | null>(null);

  async function wybierz(typ: TypUjecia, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBlad(null);
    setWczytuje(typ);
    try {
      onUjecie(typ, await przygotujUjecie(file, typ));
    } catch {
      setBlad("Nie udało się wczytać tego zdjęcia. Spróbuj innego pliku.");
    } finally {
      setWczytuje(null);
    }
  }

  function stuknij(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const m = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    if (miejsca.length >= MAKS_MIEJSC) return;
    onMiejsca([...miejsca, m]);
  }

  return (
    <div className="hs">
      <p className="hs-tytul">{etykieta}</p>

      <ul className="hs-lista">
        {UJECIA.map((u) => {
          const jest = ujecia[u.typ];
          const id = `${idBaza}-${u.typ}`;
          return (
            <li key={u.typ} className={`hs-ujecie${jest ? " hs-ujecie-jest" : ""}`}>
              <Schemat typ={u.typ} />
              <div className="hs-opis">
                <p className="hs-nazwa">
                  {u.nazwa} <span className="hs-znacznik">{u.zalecane ? "zalecane" : "opcjonalne"}</span>
                </p>
                <p className="hs-instrukcja">{u.instrukcja}</p>
                {jest?.lokalnie.problem && <p className="hs-ostrzezenie">⚠ {jest.lokalnie.problem}</p>}
              </div>
              <div className="hs-akcje">
                <input type="file" accept="image/*" capture="environment" id={id} style={{ display: "none" }}
                  onChange={(e) => void wybierz(u.typ, e)} />
                {jest && (
                  // eslint-disable-next-line @next/next/no-img-element -- lokalny podgląd zdjęcia użytkownika
                  <img src={jest.dataUrl} alt="" className="hs-miniatura" />
                )}
                <label htmlFor={id} className="dlon-przycisk">
                  {wczytuje === u.typ ? "Wczytuję…" : jest ? "Zmień" : "Dodaj"}
                </label>
                {jest && (
                  <button type="button" className="hs-usun" onClick={() => onUjecie(u.typ, null)}>usuń</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {blad && <p className="hs-ostrzezenie">{blad}</p>}

      {!dataUrlGlowne && (
        <p className="hs-instrukcja" style={{ marginTop: 14 }}>
          Po wgraniu zdjęcia całej dłoni (wyżej) możesz też wskazać na nim miejsca, którym AI ma się przyjrzeć z bliska.
        </p>
      )}
      {dataUrlGlowne && (
        <div className="hs-miejsca">
          <p className="hs-nazwa">Obejrzyj to miejsce <span className="hs-znacznik">opcjonalne</span></p>
          <p className="hs-instrukcja">
            Stuknij na zdjęciu miejsce, któremu AI ma się przyjrzeć z bliska (do {MAKS_MIEJSC}). Nie podpowiadamy,
            co tam jest — AI samo opisze, co widzi. Stuknij znacznik, żeby go usunąć.
          </p>
          <div className="hs-obraz" onClick={stuknij} style={{ cursor: miejsca.length >= MAKS_MIEJSC ? "default" : "crosshair" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- lokalny podgląd zdjęcia użytkownika */}
            <img src={dataUrlGlowne} alt="Zdjęcie dłoni — stuknij miejsce do obejrzenia" draggable={false} />
            {miejsca.map((m, i) => (
              <button key={i} type="button" className="hs-punkt" style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
                aria-label={`Usuń miejsce ${i + 1}`}
                onClick={(e) => { e.stopPropagation(); onMiejsca(miejsca.filter((_, j) => j !== i)); }}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
