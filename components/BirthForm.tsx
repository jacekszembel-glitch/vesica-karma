"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import PlacePicker from "./PlacePicker";
import DateInput from "./DateInput";
import type { Place } from "@/lib/geo";
import { loadBirth, saveBirth, DEFAULT_PLACE } from "@/lib/birthStore";

export type Plec = "on" | "ona" | "ono";

/** Imię i nazwisko zawsze z wielkiej litery w każdym członie — niezależnie od tego, jak ktoś je wpisał. */
function capitalizeName(s: string): string {
  return s.trim().replace(/\s+/g, " ").split(" ").map((word) =>
    word.split("-").map((part) => (part ? part.charAt(0).toLocaleUpperCase("pl") + part.slice(1).toLocaleLowerCase("pl") : part)).join("-")
  ).join(" ");
}

export interface BirthInput {
  /** Chwila urodzenia w UTC (godzina nieznana → południe lokalne). */
  utc: Date;
  latitude: number;
  longitude: number;
  timeKnown: boolean;
  isoDate: string;
  placeName: string;
  /** Godzina LOKALNA urodzenia „HH:mm" — do zapisu i wyświetlania. */
  localTime: string;
  /** Do jakiej formy gramatycznej AI ma się zwracać w interpretacji. */
  plec: Plec;
  /** Opcjonalne — do podpisu raportów i historii. */
  name?: string;
}

interface Props {
  onSubmit: (input: BirthInput) => void;
  submitLabel?: string;
  /** Czy pokazywać pola godziny i miejsca (numerologia ich nie potrzebuje). */
  askTimePlace?: boolean;
  busy?: boolean;
  children?: React.ReactNode;
  /** Etykieta pola daty — np. „Data urodzenia dziecka" dla raportu dla dziecka. */
  dateLabel?: string;
  /** Etykieta i placeholder pola imienia. */
  nameLabel?: string;
  namePlaceholder?: string;
  /**
   * Czy wczytywać i zapisywać dane we wspólnym profilu (localStorage), z którego
   * korzystają panel, /dzis i sade sati. WYŁĄCZ dla danych kogoś innego niż
   * użytkownik (np. dziecka) — inaczej wpisanie ich danych nadpisałoby Twój
   * własny zapamiętany profil używany w reszcie serwisu.
   */
  persist?: boolean;
}

export default function BirthForm({
  onSubmit, submitLabel = "Oblicz", askTimePlace = true, busy, children,
  dateLabel = "Data urodzenia",
  nameLabel = "Imię i nazwisko (opcjonalnie)",
  namePlaceholder = "np. Jacek Kowalski",
  persist = true,
}: Props) {
  const [date, setDate] = useState("1990-06-15");
  const [time, setTime] = useState("12:00");
  const [timeKnown, setTimeKnown] = useState(true);
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE);
  const [plec, setPlec] = useState<Plec>("ona");
  const [name, setName] = useState("");

  // wczytaj dane zapamiętane w innym module (spójność w całym serwisie) —
  // tylko gdy to dane samego użytkownika, nie kogoś innego (np. dziecka)
  useEffect(() => {
    if (!persist) return;
    const b = loadBirth();
    if (!b) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- celowa hydratacja zapamiętanych danych po zamontowaniu
    setDate(b.date);
    setTime(b.time);
    setTimeKnown(b.timeKnown);
    setPlace(b.place);
    if (b.plec) setPlec(b.plec);
    if (b.name) setName(b.name);
  }, [persist]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const effectiveTime = timeKnown ? time : "12:00";
    const local = DateTime.fromISO(`${date}T${effectiveTime}`, { zone: place.tz });
    if (!local.isValid) return;
    const nazwaOsoby = name.trim() ? capitalizeName(name) : "";
    if (nazwaOsoby !== name) setName(nazwaOsoby);
    if (persist) saveBirth({ date, time, timeKnown, place, plec, name: nazwaOsoby || undefined });
    onSubmit({
      utc: local.toUTC().toJSDate(),
      latitude: place.lat,
      longitude: place.lon,
      timeKnown: askTimePlace ? timeKnown : false,
      isoDate: date,
      placeName: place.name,
      localTime: effectiveTime,
      plec,
      name: nazwaOsoby || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: "grid", gap: 18 }}>
      <div>
        <label htmlFor="bf-name">{nameLabel}</label>
        <input id="bf-name" type="text" placeholder={namePlaceholder} autoComplete={persist ? "name" : "off"}
          value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className={askTimePlace ? "bf-row" : ""} style={askTimePlace ? undefined : { display: "grid", gap: 16 }}>
        <DateInput id="bf-date" value={date} onChange={setDate} required label={dateLabel} />
        {askTimePlace && (
          <div>
            <label htmlFor="bf-time">Godzina urodzenia</label>
            <input id="bf-time" type="time" value={time} disabled={!timeKnown}
              onChange={(e) => setTime(e.target.value)} style={{ opacity: timeKnown ? 1 : 0.4 }} />
          </div>
        )}
      </div>

      {askTimePlace && (
        <>
          <label style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 44, textTransform: "none", fontSize: "0.95rem", color: "var(--text)", cursor: "pointer" }}>
            <input type="checkbox" checked={!timeKnown} onChange={(e) => setTimeKnown(!e.target.checked)}
              style={{ width: 22, height: 22, flex: "none", accentColor: "var(--teal)" }} />
            Nie znam godziny urodzenia
          </label>
          {!timeKnown && (
            <p className="muted" style={{ fontSize: "0.85rem", marginTop: -8 }}>
              Bez godziny nie policzymy ascendentu (lagny) i domów — pokażemy pozycje planet,
              nakszatrę Księżyca i okresy planetarne. Uwaga: Księżyc przechodzi ok. 13° na dobę,
              więc jego nakszatra może być niedokładna.
            </p>
          )}
          <PlacePicker value={place} onChange={setPlace} id="bf-place" />
        </>
      )}

      <div>
        <label id="bf-plec-label">Płeć</label>
        <div className="bf-plec" role="radiogroup" aria-labelledby="bf-plec-label">
          {(["on", "ona", "ono"] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={plec === p}
              className={`bf-plec-opcja${plec === p ? " bf-plec-opcja-aktywna" : ""}`}
              onClick={() => setPlec(p)}
              title={p === "ono" ? "Podmiot inny niż osoba — np. auto, miasto, firma" : undefined}
            >
              {p === "on" ? "On" : p === "ona" ? "Ona" : "Obiekt"}
            </button>
          ))}
        </div>
        {plec === "ono" && (
          <p className="muted" style={{ fontSize: "0.85rem", marginTop: 6 }}>
            Wybierz to dla podmiotu, który nie jest osobą — np. auta, miasta, firmy czy wydarzenia.
          </p>
        )}
      </div>

      {children}

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Liczę…" : submitLabel}
      </button>
    </form>
  );
}
