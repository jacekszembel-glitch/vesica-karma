"use client";

import { useState } from "react";
import IlustracjaDloni from "./IlustracjaDloni";
import { MIEJSCA_ZNAKOW, RODZAJE_ZNAKOW_NAZWY, type MiejsceZnaku, type Reka, type RodzajZnaku, type ZnakWlasny } from "@/lib/astro/zgodnosc";

/**
 * ZNAKI, KTÓRE SAM WIDZISZ — osoba ogląda swoją dłoń na żywo, zdjęcie bywa słabsze od oka.
 * Zgłoszenie trafia do odczytu jako jawnie podpisana obserwacja osoby: AI osobno mówi,
 * czy widzi to samo na zdjęciach, a na Twojej Karmie znak ma źródło „Ty”, nie „AI”.
 */
export default function ZnakiWlasne({ znaki, onZmiana, nazwyRak }: {
  znaki: ZnakWlasny[];
  onZmiana: (z: ZnakWlasny[]) => void;
  /** Która fizyczna ręka jest wiodąca — rysunek dłoni odbija się dla lewej. */
  nazwyRak?: Record<Reka, string>;
}) {
  const [reka, setReka] = useState<Reka>("wiodaca");
  const [miejsce, setMiejsce] = useState<MiejsceZnaku>("jupiter");
  const [znak, setZnak] = useState<RodzajZnaku>("x");

  const nazwaMiejsca = (m: MiejsceZnaku) => MIEJSCA_ZNAKOW.find((x) => x.id === m)?.nazwa ?? m;
  const nazwaZnaku = (z: RodzajZnaku) => RODZAJE_ZNAKOW_NAZWY.find((x) => x.id === z)?.nazwa ?? z;

  return (
    <div className="zw">
      <p className="hs-tytul" style={{ textAlign: "center" }}>Dopisz, czego brakuje</p>
      <p className="hs-instrukcja" style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 12px" }}>
        Oko widzi więcej niż zdjęcie. Czego brakuje na liście wyżej — dopisz tutaj. W odczycie i na
        Twojej Karmie będzie podpisane jako Twoja obserwacja.
      </p>
      {/* rysunek: wybrane miejsce świeci, kliknięcie w rysunek wybiera miejsce */}
      <div className="zw-rysunek">
        <IlustracjaDloni lewa={nazwyRak?.[reka] === "lewa"} szerokosc={200}
          aktywne={znak === "krzyz_mistyczny" ? "czworobok" : miejsce}
          onWybierz={(m) => { setMiejsce(m); if (m !== "czworobok" && znak === "krzyz_mistyczny") setZnak("x"); }} />
        <p className="hs-instrukcja" style={{ textAlign: "center" }}>
          {nazwyRak ? `${reka === "wiodaca" ? "Ręka wiodąca" : "Ręka bierna"} — ${nazwyRak[reka]} dłoń od wewnątrz. ` : ""}Kliknij miejsce na rysunku albo wybierz je z listy.
        </p>
      </div>
      <div className="zw-formularz">
        <select value={reka} onChange={(e) => setReka(e.target.value as Reka)} aria-label="Ręka">
          <option value="wiodaca">ręka wiodąca</option>
          <option value="bierna">ręka bierna</option>
        </select>
        <select value={znak} onChange={(e) => setZnak(e.target.value as RodzajZnaku)} aria-label="Znak">
          {RODZAJE_ZNAKOW_NAZWY.map((z) => <option key={z.id} value={z.id}>{z.nazwa}</option>)}
        </select>
        {znak !== "krzyz_mistyczny" && (
          <select value={miejsce} onChange={(e) => setMiejsce(e.target.value as MiejsceZnaku)} aria-label="Miejsce">
            {MIEJSCA_ZNAKOW.map((m) => <option key={m.id} value={m.id}>{m.nazwa}</option>)}
          </select>
        )}
        <button type="button" className="dlon-przycisk" disabled={znaki.length >= 12}
          onClick={() => onZmiana([...znaki, { reka, znak, miejsce: znak === "krzyz_mistyczny" ? "czworobok" : miejsce }])}>
          Dodaj znak
        </button>
      </div>
      {znaki.length > 0 && (
        <ul className="zw-lista">
          {znaki.map((z, i) => (
            <li key={i}>
              <span><strong>{nazwaZnaku(z.znak)}</strong>{z.znak !== "krzyz_mistyczny" && <> — {nazwaMiejsca(z.miejsce)}</>}, {z.reka === "wiodaca" ? "ręka wiodąca" : "ręka bierna"}</span>
              <button type="button" className="hs-usun" onClick={() => onZmiana(znaki.filter((_, j) => j !== i))}>usuń</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
