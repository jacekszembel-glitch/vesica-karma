"use client";

import { useState } from "react";
import { przygotujZdjecie, wytnijStrefy, type RamkiDloni, type ZdjecieDloni } from "@/lib/hiromancjaObraz";

/**
 * ZDJĘCIE DŁONI — wybór pliku (na telefonie `capture="environment"` od razu
 * otwiera aparat) + przeskalowanie po stronie przeglądarki, zanim
 * cokolwiek trafi na serwer: całe zdjęcie 1568 px + zbliżenia stref z oryginału
 * (lib/hiromancjaObraz.ts), do tego lokalna ocena ostrości i jasności.
 * Bez `getUserMedia`/`<video>` — świadomie poza zakresem v1, plik
 * wystarcza i działa wszędzie.
 *
 * Zdjęcie NIE jest tu nigdzie zapisywane ani wysyłane — tylko przeskalowane
 * lokalnie i przekazane do rodzica przez `onZdjecieGotowe`.
 */

export type ZdjecieDane = ZdjecieDloni;

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
  const [lokalnyProblem, setLokalnyProblem] = useState<string | null>(null);

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
      if (res.ok) {
        const w = (await res.json()) as { ok: boolean; komentarz: string | null; ramki?: RamkiDloni | null };
        setWerdykt(w);
        // ramki stref z AI — wycinamy zbliżenia dokładnie tam, gdzie leży dłoń i palce
        if (w.ramki?.dlon) onZdjecieGotowe({ ...dane, strefy: wytnijStrefy(dane.zrodlo, w.ramki) });
      }
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
    setLokalnyProblem(null);
    setPrzetwarzam(true);
    try {
      const dane = await przygotujZdjecie(file);
      setLokalnyProblem(dane.lokalnie.problem);
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
      {/* płaski złoty przycisk jak we wzorze public/brand/chiromanca-2.jpg */}
      <label htmlFor={id} className="dlon-przycisk">
        {przetwarzam ? "Wczytuję…" : maZdjecie ? "Zmień zdjęcie" : etykieta}
      </label>
      {blad && <p style={{ color: "var(--warn)", fontSize: "0.85rem", marginTop: 10 }}>{blad}</p>}
      {lokalnyProblem && (
        <p style={{ color: "var(--warn)", fontSize: "0.8rem", marginTop: 10, lineHeight: 1.45 }}>⚠ {lokalnyProblem}</p>
      )}
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
