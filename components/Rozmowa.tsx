"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * ROZMOWA O WŁASNEJ MAPIE — pytania do gotowego horoskopu.
 *
 * Odpowiedzi opierają się wyłącznie na policzonych danych przekazanych w `mapa`,
 * więc rozmowa dotyczy TEJ konkretnej osoby, a nie astrologii w ogóle.
 * Historia zapisuje się w przeglądarce pod kluczem wyliczonym z danych mapy —
 * po powrocie na stronę rozmowa jest tam, gdzie ją zostawiono.
 */

interface Wiadomosc { rola: "user" | "assistant"; tresc: string }

const PREFIX = "9dom_rozmowa_";
/** Ile ostatnich wymian wysyłamy jako kontekst — reszta i tak jest w mapie. */
const KONTEKST = 8;

const PODPOWIEDZI = [
  "Co jest moją największą siłą w tej mapie?",
  "Nad czym powinienem teraz popracować?",
  "Czy to dobry moment na zmianę pracy?",
  "Co mówi mój obecny okres o relacjach?",
  "Jak najlepiej wykorzystać najbliższe dwa lata?",
];

/** Stabilny skrót danych — ta sama mapa daje ten sam klucz rozmowy. */
function hash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

/** Lekki render Markdown — akapity i pogrubienia. */
function render(t: string) {
  return t.split(/\n{2,}/).map((blok, i) => {
    const b = blok.trim();
    if (!b) return null;
    const html = b
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      // Linki do wnętrza serwisu (ścieżki od "/") ALBO do siostrzanej apki
      // 9dom.pl (pełne https://) — model dostaje katalog narzędzi i odsyła
      // np. do [Dobra data ślubu](https://9dom.pl/data-slubu).
      .replace(
        /\[([^\]]{1,60})\]\((\/[a-z0-9\-/]{1,60}|https:\/\/9dom\.pl\/[a-z0-9\-/]{1,60})\)/g,
        '<a href="$2" style="color:var(--teal-soft);text-decoration:underline;text-underline-offset:3px">$1</a>',
      )
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/^[-•] (.+)$/gm, "• $1")
      .replace(/^#+\s*/gm, "")
      .replace(/\n/g, "<br/>");
    return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />;
  });
}

export default function Rozmowa({ mapa, tytul = "Zapytaj o swoją mapę" }: {
  mapa: Record<string, unknown> | null;
  tytul?: string;
}) {
  const [wiadomosci, setWiadomosci] = useState<Wiadomosc[]>([]);
  const [pytanie, setPytanie] = useState("");
  const [busy, setBusy] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const koniecRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const klucz = mapa ? `${PREFIX}${hash(JSON.stringify(mapa))}` : null;

  // wczytanie zapisanej rozmowy
  useEffect(() => {
    if (!klucz) return;
    try {
      const zapisana = localStorage.getItem(klucz);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronizacja z localStorage przy zmianie klucza rozmowy
      setWiadomosci(zapisana ? (JSON.parse(zapisana) as Wiadomosc[]) : []);
    } catch { setWiadomosci([]); }
  }, [klucz]);

  // zapis po każdej zmianie
  useEffect(() => {
    if (!klucz || !wiadomosci.length) return;
    try { localStorage.setItem(klucz, JSON.stringify(wiadomosci)); } catch { /* brak miejsca */ }
  }, [klucz, wiadomosci]);

  useEffect(() => {
    koniecRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [wiadomosci, busy]);

  const zapytaj = useCallback(async (tresc: string) => {
    if (!mapa || !tresc.trim() || busy) return;
    const pyt = tresc.trim();
    setPytanie("");
    setBlad(null);
    setBusy(true);

    // historia BEZ bieżącego pytania — serwer dokłada je sam
    const historia = wiadomosci.slice(-KONTEKST);
    setWiadomosci((w) => [...w, { rola: "user", tresc: pyt }, { rola: "assistant", tresc: "" }]);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/rozmowa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pytanie: pyt, mapa, historia }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const raw = await res.text().catch(() => "");
        let komunikat: string | null = null;
        try { komunikat = (JSON.parse(raw) as { error?: string }).error ?? null; } catch { /* nie JSON */ }
        throw new Error(komunikat ?? `Nie udało się uzyskać odpowiedzi (kod ${res.status}).`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setWiadomosci((w) => {
          const kopia = [...w];
          kopia[kopia.length - 1] = { rola: "assistant", tresc: acc };
          return kopia;
        });
      }
      if (!acc.trim()) throw new Error("Odpowiedź była pusta. Spróbuj ponownie.");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setBlad((e as Error).message);
      // usuwamy pustą odpowiedź, żeby nie zostawał sierocy dymek
      setWiadomosci((w) => (w.at(-1)?.tresc === "" ? w.slice(0, -1) : w));
    } finally {
      setBusy(false);
    }
  }, [mapa, busy, wiadomosci]);

  function wyczysc() {
    setWiadomosci([]);
    setBlad(null);
    if (klucz) { try { localStorage.removeItem(klucz); } catch { /* nic */ } }
  }

  if (!mapa) return null;

  return (
    <div className="card rozmowa">
      <div className="rozmowa-naglowek">
        <h3 style={{ color: "var(--primary-soft)" }}>✦ {tytul}</h3>
        {wiadomosci.length > 0 && (
          <button type="button" className="rozmowa-wyczysc" onClick={wyczysc}>zacznij od nowa</button>
        )}
      </div>

      <p className="muted" style={{ fontSize: "0.85rem", lineHeight: 1.6, marginBottom: 14 }}>
        Pytania dotyczą <strong style={{ color: "var(--teal-soft)" }}>Twojej policzonej mapy</strong> —
        nie astrologii w ogóle. Odpowiedzi opierają się wyłącznie na tym, co wynika z Twoich danych.
      </p>

      {wiadomosci.length === 0 && (
        <div className="rozmowa-podpowiedzi">
          {PODPOWIEDZI.map((p) => (
            <button key={p} type="button" onClick={() => zapytaj(p)} disabled={busy}>{p}</button>
          ))}
        </div>
      )}

      {wiadomosci.length > 0 && (
        <div className="rozmowa-watek">
          {wiadomosci.map((w, i) => (
            <div key={i} className={w.rola === "user" ? "rozmowa-pytanie" : "rozmowa-odpowiedz"}>
              {w.rola === "assistant" && !w.tresc
                ? <p className="muted rozmowa-czeka">czytam Twoją mapę…</p>
                : render(w.tresc)}
            </div>
          ))}
          <div ref={koniecRef} />
        </div>
      )}

      {blad && <p style={{ color: "var(--warn)", fontSize: "0.86rem", marginTop: 10 }}>{blad}</p>}

      <form
        className="rozmowa-pole"
        onSubmit={(e) => { e.preventDefault(); zapytaj(pytanie); }}
      >
        <input
          type="text"
          value={pytanie}
          onChange={(e) => setPytanie(e.target.value)}
          placeholder="O co chcesz zapytać?"
          maxLength={600}
          enterKeyHint="send"
          disabled={busy}
          aria-label="Twoje pytanie"
        />
        <button type="submit" className="btn btn-primary" disabled={busy || !pytanie.trim()}>
          {busy ? "…" : "Zapytaj"}
        </button>
      </form>

      <p className="muted" style={{ fontSize: "0.74rem", marginTop: 10, lineHeight: 1.5 }}>
        Rozmowa zapisuje się w tej przeglądarce. Nie zastępuje porady medycznej,
        prawnej ani finansowej.
      </p>
    </div>
  );
}
