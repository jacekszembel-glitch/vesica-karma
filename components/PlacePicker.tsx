"use client";

import { useEffect, useId, useRef, useState } from "react";
import { searchPlaces, preloadPlaces, type Place } from "@/lib/geo";

/**
 * Wyszukiwarka miejscowości urodzenia — 3500+ polskich miejscowości
 * (GeoNames) + miasta świata. Ignoruje polskie znaki.
 * Dokładne współrzędne mają znaczenie: 1° długości geograficznej
 * przesuwa ascendent o ok. 1°.
 *
 * UWAGI DOTYCZĄCE TELEFONU (stąd brały się zgłaszane problemy):
 * - pole NIE czyści się po dotknięciu — wcześniej znikała wybrana miejscowość
 *   i użytkownik nie miał jak jej odzyskać; teraz treść zostaje i jest zaznaczona,
 *   więc pisanie i tak ją zastępuje;
 * - zamykanie listy słucha `pointerdown`, nie `mousedown`: iOS nie generuje
 *   zdarzeń myszy przy dotknięciu zwykłego tła, więc lista potrafiła zostać
 *   otwarta i zasłonić resztę formularza;
 * - po otwarciu klawiatury pole samo przewija się na środek ekranu, bo lista
 *   rozwija się w dół i chowała się za klawiaturą;
 * - wyłączona autokorekta i wielkie litery — klawiatura „poprawiała” nazwy;
 * - pozycje listy mają min. 46 px wysokości (wytyczne dotykowe).
 */

export default function PlacePicker({
  value, onChange, label = "Miejsce urodzenia", id,
}: {
  value: Place;
  onChange: (p: Place) => void;
  label?: string;
  id?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [query, setQuery] = useState(value.name);
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // synchronizacja przy zmianie z zewnątrz (np. wczytanie zapamiętanych danych) — dopasowanie w trakcie renderu
  const [poprzednieName, setPoprzednieName] = useState(value.name);
  if (value.name !== poprzednieName) {
    setPoprzednieName(value.name);
    setQuery(value.name);
  }

  // wyszukiwanie z opóźnieniem
  useEffect(() => {
    if (!open) return;
    let alive = true;
    const t = setTimeout(async () => {
      const r = await searchPlaces(query);
      if (alive) { setResults(r); setHighlight(0); }
    }, 120);
    return () => { alive = false; clearTimeout(t); };
  }, [query, open]);

  // zamknięcie po kliknięciu/dotknięciu poza polem
  useEffect(() => {
    if (!open) return;
    const onDown = (e: Event) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value.name); // przywróć wybraną wartość
      }
    };
    // pointerdown obsługuje mysz, dotyk i rysik jednocześnie
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, value.name]);

  function pick(p: Place) {
    onChange(p);
    setQuery(p.name);
    setOpen(false);
    inputRef.current?.blur(); // schowaj klawiaturę po wyborze
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && results[highlight]) { e.preventDefault(); pick(results[highlight]); }
    else if (e.key === "Escape") { setOpen(false); setQuery(value.name); inputRef.current?.blur(); }
  }

  function onFocus() {
    setOpen(true);
    // baza swiata ma ok. 1,4 MB — zaczynamy pobierac, zanim uzytkownik skonczy pisac
    preloadPlaces();
    // Zaznaczamy zamiast czyścić: nazwa zostaje widoczna, a pisanie ją zastępuje.
    inputRef.current?.select();
    // Klawiatura zasłania dolną połowę ekranu — podciągamy pole na środek.
    setTimeout(() => {
      boxRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 250);
  }

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <label htmlFor={inputId}>{label}</label>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        value={query}
        placeholder="miejscowość w Polsce lub na świecie…"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        inputMode="search"
        enterKeyHint="search"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${inputId}-lista`}
        onFocus={onFocus}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul
          id={`${inputId}-lista`}
          role="listbox"
          style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 30,
            marginTop: 4, listStyle: "none",
            // niższa lista na telefonie, żeby zmieściła się nad klawiaturą
            maxHeight: "min(46vh, 300px)",
            overflowY: "auto",
            // przewijanie listy nie ma przewijać strony pod spodem
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: 12, boxShadow: "0 14px 36px rgba(0,0,0,0.5)",
          }}
        >
          {results.length === 0 ? (
            <li style={{ padding: "14px 15px" }}>
              <p className="muted" style={{ fontSize: "0.88rem", lineHeight: 1.5 }}>
                {query.trim().length < 2
                  ? "Wpisz co najmniej dwie litery."
                  : <>Nie znaleziono „{query}”. Spróbuj krótszego fragmentu nazwy — polskie znaki nie mają znaczenia.</>}
              </p>
            </li>
          ) : results.map((p, i) => (
            <li key={`${p.name}-${p.lat}`} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                // zapobiega utracie skupienia z pola przed obsłużeniem wyboru
                onPointerDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(p)}
                style={{
                  display: "flex", width: "100%", alignItems: "center",
                  justifyContent: "space-between", gap: 10,
                  minHeight: 46, padding: "10px 15px",
                  border: "none", cursor: "pointer",
                  background: i === highlight ? "rgba(17,167,182,0.12)" : "transparent",
                  color: "var(--text)", fontFamily: "var(--font-sans)",
                  fontSize: "0.95rem", textAlign: "left",
                }}
              >
                <span>{p.name}</span>
                <span className="muted" style={{ fontSize: "0.78rem", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {p.lat.toFixed(2)}°N {p.lon.toFixed(2)}°E
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
