"use client";

import { useId, useRef, useState } from "react";

/**
 * Pole daty urodzenia — trzy osobne pola zamiast natywnego kalendarza.
 *
 * DLACZEGO NIE `input[type="date"]`:
 * na telefonie otwiera się koło przewijane, ustawione na rok bieżący. Żeby dojść
 * do roku urodzenia trzeba je kręcić kilkadziesiąt razy — przy dacie z lat 70.
 * jest to droga przez mękę i to właśnie zgłaszali użytkownicy. Rok wpisany
 * z klawiatury numerycznej zajmuje cztery dotknięcia.
 *
 * Pola przeskakują same: po dwóch cyfrach dnia kursor idzie do miesiąca,
 * po wybraniu miesiąca — do roku. Kto woli kalendarz, ma przełącznik.
 */

const MIESIACE = [
  "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
  "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
];

/** Skrócone nazwy — do wąskich kontekstów (np. koło danych w kosmogramie),
 * gdzie pełne "październik"/"wrzesień" nie mieszczą się w polu select. */
const MIESIACE_SKROT = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

const MIN_ROK = 1900;

interface Props {
  /** Data w formacie ISO (YYYY-MM-DD) lub pusty ciąg. */
  value: string;
  onChange: (iso: string) => void;
  label?: string;
  id?: string;
  required?: boolean;
  /** Skrócone nazwy miesięcy (sty, lut, ...) — dla wąskich pól, np. koła danych. */
  compact?: boolean;
}

/** Ile dni ma miesiąc (z uwzględnieniem lat przestępnych). */
function dniWMiesiacu(rok: number, miesiac: number): number {
  if (!rok || !miesiac) return 31;
  return new Date(rok, miesiac, 0).getDate();
}

export default function DateInput({ value, onChange, label = "Data urodzenia", id, required, compact }: Props) {
  const nazwyMiesiecy = compact ? MIESIACE_SKROT : MIESIACE;
  const autoId = useId();
  const bazaId = id ?? autoId;
  const [dzien, setDzien] = useState("");
  const [miesiac, setMiesiac] = useState("");
  const [rok, setRok] = useState("");
  const [kalendarz, setKalendarz] = useState(false);
  const miesiacRef = useRef<HTMLSelectElement>(null);
  const rokRef = useRef<HTMLInputElement>(null);

  // wczytanie wartości z zewnątrz (np. zapamiętane dane) — dopasowanie stanu do propa w trakcie renderu
  const [poprzedniaValue, setPoprzedniaValue] = useState(value);
  if (value !== poprzedniaValue) {
    setPoprzedniaValue(value);
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (m) {
      setRok(m[1]);
      setMiesiac(String(Number(m[2])));
      setDzien(String(Number(m[3])));
    }
  }

  /** Składa datę i zgłasza w górę dopiero, gdy jest kompletna i sensowna. */
  function zglos(d: string, m: string, r: string) {
    const dn = Number(d), mn = Number(m), rn = Number(r);
    const biezacyRok = new Date().getFullYear();
    if (!dn || !mn || r.length !== 4 || rn < MIN_ROK || rn > biezacyRok) { onChange(""); return; }
    const maks = dniWMiesiacu(rn, mn);
    if (dn < 1 || dn > maks) { onChange(""); return; }
    onChange(`${r}-${String(mn).padStart(2, "0")}-${String(dn).padStart(2, "0")}`);
  }

  function zmienDzien(v: string) {
    const czysty = v.replace(/\D/g, "").slice(0, 2);
    setDzien(czysty);
    zglos(czysty, miesiac, rok);
    // po dwóch cyfrach (albo cyfrze wykluczającej dalszy ciąg) idziemy dalej
    if (czysty.length === 2 || Number(czysty) > 3) miesiacRef.current?.focus();
  }

  function zmienMiesiac(v: string) {
    setMiesiac(v);
    zglos(dzien, v, rok);
    if (v) rokRef.current?.focus();
  }

  function zmienRok(v: string) {
    const czysty = v.replace(/\D/g, "").slice(0, 4);
    setRok(czysty);
    zglos(dzien, miesiac, czysty);
  }

  const maksDzien = dniWMiesiacu(Number(rok), Number(miesiac));
  const dzienZly = dzien !== "" && (Number(dzien) < 1 || Number(dzien) > maksDzien);
  const rokZly = rok.length === 4 && (Number(rok) < MIN_ROK || Number(rok) > new Date().getFullYear());

  if (kalendarz) {
    return (
      <div>
        <label htmlFor={`${bazaId}-kal`}>{label}</label>
        <input
          id={`${bazaId}-kal`}
          type="date"
          required={required}
          value={value}
          min={`${MIN_ROK}-01-01`}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" className="date-przelacznik" onClick={() => setKalendarz(false)}>
          wpisz datę ręcznie
        </button>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={`${bazaId}-d`}>{label}</label>
      <div className="date-pola">
        <input
          id={`${bazaId}-d`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="bday-day"
          placeholder="dz."
          aria-label="Dzień"
          aria-invalid={dzienZly || undefined}
          maxLength={2}
          value={dzien}
          onChange={(e) => zmienDzien(e.target.value)}
          onFocus={(e) => e.target.select()}
          style={dzienZly ? { borderColor: "var(--warn)" } : undefined}
        />
        <select
          ref={miesiacRef}
          aria-label="Miesiąc"
          value={miesiac}
          onChange={(e) => zmienMiesiac(e.target.value)}
        >
          <option value="">miesiąc</option>
          {nazwyMiesiecy.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <input
          ref={rokRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="bday-year"
          placeholder="rok"
          aria-label="Rok"
          aria-invalid={rokZly || undefined}
          maxLength={4}
          value={rok}
          onChange={(e) => zmienRok(e.target.value)}
          onFocus={(e) => e.target.select()}
          style={rokZly ? { borderColor: "var(--warn)" } : undefined}
        />
      </div>
      {(dzienZly || rokZly) && (
        <p style={{ color: "var(--warn)", fontSize: "0.78rem", marginTop: 5 }}>
          {dzienZly
            ? `Ten miesiąc ma ${maksDzien} dni.`
            : `Podaj rok między ${MIN_ROK} a ${new Date().getFullYear()}.`}
        </p>
      )}
      <button type="button" className="date-przelacznik" onClick={() => setKalendarz(true)}>
        wybierz z kalendarza
      </button>
    </div>
  );
}
