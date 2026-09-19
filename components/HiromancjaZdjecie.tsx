"use client";

import { useState } from "react";

/**
 * ZDJĘCIE DŁONI — wybór pliku (na telefonie `capture="environment"` od razu
 * otwiera aparat) + przeskalowanie po stronie przeglądarki, zanim
 * cokolwiek trafi na serwer: maks. 1000px dłuższego boku, JPEG q=0.8.
 * Bez `getUserMedia`/`<video>` — świadomie poza zakresem v1, plik
 * wystarcza i działa wszędzie.
 *
 * Zdjęcie NIE jest tu nigdzie zapisywane ani wysyłane — tylko przeskalowane
 * lokalnie i przekazane do rodzica przez `onZdjecieGotowe`.
 */

export interface ZdjecieDane {
  dataUrl: string;
  /** Bez prefiksu "data:image/jpeg;base64,". */
  base64: string;
  mediaType: "image/jpeg";
}

async function wczytajIPrzeskaluj(file: File): Promise<ZdjecieDane> {
  const bitmap = await createImageBitmap(file);
  const skala = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * skala));
  const h = Math.max(1, Math.round(bitmap.height * skala));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Brak kontekstu canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
  const base64 = dataUrl.split(",")[1] ?? "";
  return { dataUrl, base64, mediaType: "image/jpeg" };
}

export default function HiromancjaZdjecie({ id, onZdjecieGotowe, maZdjecie, etykieta }: {
  /** Unikalny id pola pliku — strona ma dwa takie komponenty naraz (lewa/prawa dłoń). */
  id: string;
  onZdjecieGotowe: (dane: ZdjecieDane) => void;
  maZdjecie: boolean;
  /** Treść przycisku przed wyborem zdjęcia, np. "Zrób zdjęcie lewej dłoni". */
  etykieta: string;
}) {
  const [blad, setBlad] = useState<string | null>(null);
  const [przetwarzam, setPrzetwarzam] = useState(false);
  const [sprawdzanie, setSprawdzanie] = useState(false);
  const [werdykt, setWerdykt] = useState<{ ok: boolean; komentarz: string | null } | null>(null);

  /** Szybkie, tanie sprawdzenie jakości zdjęcia — miękkie ostrzeżenie, NIE blokuje dalszego kroku. */
  async function sprawdzZdjecie(dane: ZdjecieDane) {
    setSprawdzanie(true);
    setWerdykt(null);
    try {
      const res = await fetch("/api/hiromancja-sprawdz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dane.base64, imageMediaType: dane.mediaType }),
      });
      if (res.ok) setWerdykt(await res.json());
    } catch {
      /* sprawdzenie jest tylko podpowiedzią — cicha awaria, użytkownik i tak może kontynuować */
    } finally {
      setSprawdzanie(false);
    }
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // pozwala wybrać ten sam plik ponownie po "zmień zdjęcie"
    if (!file) return;
    setBlad(null);
    setWerdykt(null);
    setPrzetwarzam(true);
    try {
      const dane = await wczytajIPrzeskaluj(file);
      onZdjecieGotowe(dane);
      void sprawdzZdjecie(dane); // w tle, nie blokuje przejścia dalej
    } catch {
      setBlad("Nie udało się wczytać tego zdjęcia. Spróbuj innego pliku.");
    } finally {
      setPrzetwarzam(false);
    }
  }

  return (
    <div style={{ textAlign: "center" }}>
      <input type="file" accept="image/*" capture="environment"
        id={id} style={{ display: "none" }} onChange={handleChange} />
      <label htmlFor={id} className="btn btn-primary" style={{ cursor: "pointer", display: "inline-block", fontSize: "0.9rem", padding: "12px 24px" }}>
        {przetwarzam ? "Wczytuję…" : maZdjecie ? "Zmień zdjęcie" : etykieta}
      </label>
      {blad && <p style={{ color: "var(--warn)", fontSize: "0.85rem", marginTop: 10 }}>{blad}</p>}
      {sprawdzanie && <p className="muted" style={{ fontSize: "0.78rem", marginTop: 10 }}>Sprawdzam zdjęcie…</p>}
      {werdykt && !werdykt.ok && werdykt.komentarz && (
        <p style={{ color: "var(--warn)", fontSize: "0.8rem", marginTop: 10, lineHeight: 1.45 }}>
          ⚠ {werdykt.komentarz} Możesz kontynuować mimo to, ale odczyt będzie dokładniejszy z lepszym zdjęciem.
        </p>
      )}
      {werdykt?.ok && (
        <p className="muted" style={{ fontSize: "0.76rem", marginTop: 10, color: "var(--success)" }}>
          ✓ Zdjęcie wygląda dobrze
        </p>
      )}
    </div>
  );
}
