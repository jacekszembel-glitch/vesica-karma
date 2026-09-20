"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import DiagramOdczytu from "@/components/DiagramOdczytu";

function akapitHtml(t: string): string {
  return t
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, "• $1")
    .replace(/\n/g, "<br/>");
}

/**
 * Odczyt renderowany PARTIAMI: każdy nagłówek („# …”, „### …”) otwiera
 * własny kafelek, a jego akapity zostają w środku. Kafelki wchodzą kaskadą
 * (--i steruje opóźnieniem) — całość objawia się sekcja po sekcji.
 */
function renderMd(md: string) {
  const sekcje: { tytul: string | null; akapity: string[] }[] = [];
  for (const block of md.split(/\n{2,}/)) {
    const t = block.trim();
    if (!t) continue;
    if (/^#{1,6}\s/.test(t)) {
      sekcje.push({ tytul: t.replace(/^#+\s*/, ""), akapity: [] });
    } else {
      if (!sekcje.length) sekcje.push({ tytul: null, akapity: [] });
      sekcje[sekcje.length - 1].akapity.push(t);
    }
  }
  return sekcje.map((s, i) => (
    <section key={i} className="interp-blok interp-kafel" style={{ ["--i" as string]: i } as React.CSSProperties}>
      {s.tytul && <h3>{s.tytul}</h3>}
      {s.akapity.map((a, j) => (
        <p key={j} dangerouslySetInnerHTML={{ __html: akapitHtml(a) }} />
      ))}
    </section>
  ));
}

/**
 * Mądrości na czas odsłaniania — krótkie, w duchu serwisu (rozwój, czas,
 * uważność), bez wróżenia. Rotują co kilka sekund, żeby chwila ciszy
 * była częścią doświadczenia, nie nudą.
 */
const MADROSCI = [
  "Nakszatra Księżyca mówi nie o tym, co się zdarzy, lecz jak przeżywasz to, co jest.",
  "W Jyotish czas nie płynie prosto — krąży. Ten sam władca wraca, ale Ty jesteś już kim innym.",
  "Mapa nie podejmuje decyzji. Pokazuje teren — iść musisz sam.",
  "Mocna planeta to nie prezent, lecz narzędzie. Słaba — nie wyrok, lecz lekcja.",
  "Dharma to nie to, co łatwe, tylko to, po czym poznajesz, że jesteś na swoim miejscu.",
  "Okres wymagający uczy więcej niż wspierający — ale tylko, jeśli nie uciekasz.",
  "Atmakaraka wskazuje lekcję duszy: temat, który wraca, aż go przyjmiesz.",
  "Retrogradacja nie cofa życia. Zaprasza do powtórki z tego, co przeszło za szybko.",
  "Miejsce potrafi wzmocnić to, co w Tobie gotowe — nie zastąpi tego, czego nie ma.",
  "Liczby się nie mylą, ale też niczego nie obiecują. Rytm to nie przeznaczenie.",
  "Cierpliwość Saturna: to, co buduje się długo, rozpada się najwolniej.",
  "Księżyc jasny czy ciemny — wciąż ten sam Księżyc. Zmienia się światło, nie natura.",
  "Muhurta nie tworzy dobrych decyzji. Dobrym decyzjom daje sprzyjający wiatr.",
  "Vargottama: gdy to, co pokazujesz światu, i to, kim jesteś w środku, mówią jednym głosem.",
];

/** Pieczęć oczekiwania — obracające się pierścienie wokół bindu + mądrości. */
function PieczecOdslaniania() {
  const [start] = useState(() => Math.floor(Math.random() * MADROSCI.length));
  const [krok, setKrok] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setKrok((k) => k + 1), 7000);
    return () => clearInterval(t);
  }, []);
  const mysl = MADROSCI[(start + krok) % MADROSCI.length];
  return (
    <div className="interp-czekanie" role="status" aria-live="polite">
      <svg viewBox="0 0 96 96" width="82" height="82" fill="none" aria-hidden="true">
        <circle cx="48" cy="48" r="42" stroke="rgba(230,196,138,0.35)" strokeWidth="1"
          strokeDasharray="2 7" className="interp-orbita" />
        <circle cx="48" cy="48" r="30" stroke="rgba(127,208,216,0.4)" strokeWidth="0.9"
          strokeDasharray="1 6" className="interp-orbita interp-orbita-wstecz" />
        <circle cx="48" cy="48" r="17" stroke="rgba(230,196,138,0.5)" strokeWidth="1" />
        <path d="M48 41 l3.4 4 -3.4 4 -3.4 -4 Z" fill="#e6c48a" className="interp-bindu" />
      </svg>
      <p>Mapa się odsłania…</p>
      <p key={krok} className="interp-mysl">
        {mysl}
      </p>
      <p className="muted" style={{ fontSize: "0.74rem" }}>
        odczyt powstaje z Twoich policzonych danych
      </p>
    </div>
  );
}

interface Props {
  kind: "numerologia" | "numerologia-dziecko" | "numerologia-finanse" | "numerologia-rok" | "para"
    | "kosmogram" | "kosmogram-dziecko" | "kosmogram-finanse" | "kosmogram-prognoza" | "profil-duszy";
  /** Policzone dane do interpretacji. Zmiana obiektu nie uruchamia automatycznie — user klika. */
  data: Record<string, unknown> | null;
  /** Podpis w historii konta, np. „Mapa życia — Jacek”. */
  label?: string;
  /**
   * Bez złotego "hero" boksu, bez DiagramOdczytu (6 pytań) i bez własnej
   * karty — do osadzenia WEWNĄTRZ istniejącej karty (np. rozwijana sekcja
   * w Profilu Duszy), gdzie ten ciężki, strona-glowna layout zajmowałby
   * za dużo miejsca i dublował już istniejący kontekst.
   */
  compact?: boolean;
}

/** Stabilny skrót danych — ten sam kosmogram daje ten sam klucz.
 *  Eksportowany: raport PDF odnajduje nim zapisaną interpretację. */
export function hash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

const PREFIX = "9dom_interp_";
const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Interpretacja powstaje RAZ dla danego zestawu danych i zostaje zapisana.
 *
 * Powód nie jest tylko kosztowy: te same dane urodzeniowe muszą dawać ten sam
 * odczyt. Gdyby po każdym kliknięciu tekst brzmiał inaczej, użytkownik słusznie
 * przestałby ufać mapie. Ponowienie zostaje wyłącznie po nieudanej próbie.
 *
 * Zalogowani mają historię w bazie (dostępną z każdego urządzenia),
 * niezalogowani — w pamięci przeglądarki.
 */
export default function Interpretation({ kind, data, label, compact }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState<"nowa" | "konto" | "przegladarka">("nowa");
  const abortRef = useRef<AbortController | null>(null);

  const dataHash = data ? hash(JSON.stringify(data)) : null;
  const lsKey = dataHash ? `${PREFIX}${kind}_${dataHash}` : null;

  // ── Wczytanie zapisanej interpretacji ──
  useEffect(() => {
    if (!dataHash || !lsKey) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset stanu przed startem asynchronicznego wczytywania (fetch-effect)
    setError(null);
    setText("");
    setOrigin("nowa");

    (async () => {
      // 1) konto — historia niezależna od urządzenia
      if (hasSupabase) {
        try {
          const supabase = supabaseBrowser();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: row } = await supabase
              .from("interpretations")
              .select("content")
              .eq("user_id", user.id)
              .eq("kind", kind)
              .eq("data_hash", dataHash)
              .maybeSingle();
            if (!alive) return;
            if (row?.content) { setText(row.content); setOrigin("konto"); return; }
          }
        } catch { /* brak sesji albo tabeli — schodzimy do localStorage */ }
      }
      // 2) przeglądarka
      try {
        const saved = localStorage.getItem(lsKey);
        if (!alive) return;
        if (saved) { setText(saved); setOrigin("przegladarka"); }
      } catch { /* tryb prywatny */ }
    })();

    return () => { alive = false; };
  }, [kind, dataHash, lsKey]);

  // ── Zapis po wygenerowaniu ──
  const persist = useCallback(async (content: string) => {
    if (!dataHash || !lsKey) return;
    try { localStorage.setItem(lsKey, content); } catch { /* brak miejsca */ }
    if (!hasSupabase) return;
    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("interpretations").upsert({
        user_id: user.id,
        kind,
        data_hash: dataHash,
        label: label ?? null,
        content,
      }, { onConflict: "user_id,kind,data_hash" });
    } catch { /* historia jest miłym dodatkiem, nie wolno jej wywalić widoku */ }
  }, [kind, dataHash, lsKey, label]);

  const generate = useCallback(async () => {
    if (!data) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy(true);
    setError(null);
    setText("");
    setOrigin("nowa");
    let acc = "";
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, data }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        // Odpowiedź bywa JSON-em z naszym komunikatem, ale przy błędach
        // infrastruktury (np. zapora, pośrednik sieciowy) to zwykły tekst lub HTML.
        // Wcześniej gubiliśmy go i zostawał sam kod — nie dało się nic ustalić.
        const raw = await res.text().catch(() => "");
        let komunikat: string | null = null;
        try { komunikat = (JSON.parse(raw) as { error?: string }).error ?? null; } catch { /* nie JSON */ }

        if (!komunikat) {
          const wskazowka =
            res.status === 403 ? "Zapytanie zostało zablokowane, zanim dotarło do serwisu — najczęściej przez rozszerzenie przeglądarki, sieć firmową albo blokadę operatora. Spróbuj w innej przeglądarce lub na danych komórkowych."
            : res.status === 401 ? "Ta wersja strony jest chroniona hasłem. Otwórz adres czas-duszy.vercel.app."
            : res.status >= 500 ? "Serwis chwilowo nie odpowiada. Spróbuj za chwilę."
            : "";
          komunikat = `Nie udało się pobrać interpretacji (kod ${res.status}). ${wskazowka}`.trim();
        }
        // pełna treść do konsoli — żeby dało się ustalić przyczynę
        console.error("interpret:", res.status, res.headers.get("content-type"), raw.slice(0, 400));
        throw new Error(komunikat);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      // Strumień zbieramy w tle, ale NIE pokazujemy po kawałku — częściowy
      // tekst wyglądał jak pisanie na żywo. Odczyt objawia się w całości,
      // jednym kaskadowym odsłonięciem, dopiero gdy jest kompletny.
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
      }
      setText(acc);
      // zapisujemy dopiero kompletny tekst — urwany strumień nie ma trafić do historii
      if (acc.trim().length > 200) await persist(acc);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [kind, data, persist]);

  if (!data) return null;

  // Przycisk tylko wtedy, gdy jest co zrobić: przed pierwszym odczytem albo po błędzie.
  const showButton = !text || (!!error && !busy);

  // Zanim cokolwiek odczytane: to najważniejsza rzecz na tej stronie — cała
  // policzona mapa przełożona na konkretny język życia. Wyraźnie wyróżniona
  // (złota obwódka, wyśrodkowany duży przycisk), żeby nie ginęła między
  // kartami z surowymi danymi. Po odczytaniu wraca do cichego nagłówka —
  // sama treść poniżej jest już wtedy payoffem, nie trzeba więcej krzyczeć.
  const przedOdczytem = !text && !busy;

  if (compact) {
    return (
      <div>
        {przedOdczytem ? (
          <button className="btn btn-ghost" onClick={generate} style={{ fontSize: "0.86rem" }}>
            {error ? "Spróbuj ponownie" : "Rozwiń pełną analizę (AI)"}
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: text ? 10 : 0 }}>
            {showButton && (
              <button className="btn btn-ghost" onClick={generate} disabled={busy} style={{ fontSize: "0.82rem" }}>
                {busy ? "Mapa się odsłania…" : "Spróbuj ponownie"}
              </button>
            )}
            {!busy && text && origin !== "nowa" && (
              <span className="muted" style={{ fontSize: "0.74rem" }}>
                {origin === "konto" ? "zapisana na Twoim koncie" : "zapisana w tej przeglądarce"}
              </span>
            )}
          </div>
        )}
        {error && <p style={{ color: "var(--warn)", marginTop: 10, fontSize: "0.85rem" }}>{error}</p>}
        {busy && !text && <p className="muted" style={{ fontSize: "0.85rem" }}>Mapa się odsłania…</p>}
        {text && (
          <div className="interpretation interp-odslona" style={{ fontSize: "0.9rem" }}>
            {renderMd(text)}
            {!busy && <span className="interp-skan" aria-hidden="true" />}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card" style={przedOdczytem ? {
      marginTop: 24, textAlign: "center", border: "1px solid var(--line-gold)",
      background: "rgba(230,196,138,0.05)", boxShadow: "0 0 32px -14px var(--primary)",
    } : { marginTop: 24 }}>
      {przedOdczytem ? (
        <>
          <h3 style={{ color: "var(--primary-soft)", fontSize: "1.5rem" }}>✦ Interpretacja</h3>
          <p className="muted" style={{ maxWidth: 480, margin: "8px auto 20px", lineHeight: 1.6 }}>
            Wszystko, co policzone wyżej, przełożone na konkretny język: co to znaczy dla Ciebie,
            kiedy się to dzieje i na co warto zwrócić uwagę.
          </p>
          <button className="btn btn-primary" onClick={generate} style={{ padding: "14px 36px", fontSize: "1rem" }}>
            {error ? "Spróbuj ponownie" : "Odczytaj interpretację"}
          </button>
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <h3 style={{ color: "var(--primary-soft)" }}>✦ Interpretacja</h3>
          {showButton && (
            <button className="btn btn-ghost" onClick={generate} disabled={busy}>
              {busy ? "Mapa się odsłania…" : "Spróbuj ponownie"}
            </button>
          )}
          {!busy && text && origin !== "nowa" && (
            <span className="muted" style={{ fontSize: "0.78rem" }}>
              {origin === "konto"
                ? "zapisana na Twoim koncie"
                : "zapisana w tej przeglądarce"}
            </span>
          )}
        </div>
      )}
      {error && <p style={{ color: "var(--warn)", marginTop: 12 }}>{error}</p>}
      {busy && !text && <PieczecOdslaniania />}
      {text && (
        <>
          <hr className="gold-rule" style={{ margin: "18px 0" }} />
          <DiagramOdczytu data={data} />
          <div className="interpretation interp-odslona">
            {renderMd(text)}
            {!busy && <span className="interp-skan" aria-hidden="true" />}
          </div>
          <p className="muted" style={{ fontSize: "0.8rem", marginTop: 18 }}>
            Interpretacja opracowana na podstawie policzonych danych astronomicznych.
            Ma charakter rozwojowy i edukacyjny.
          </p>
        </>
      )}
    </div>
  );
}
