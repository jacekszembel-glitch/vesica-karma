"use client";

import { useCallback, useRef, useState } from "react";
import type { TypDloni } from "@/lib/hiromancja";

/**
 * ODCZYT AI — uproszczony sibling Interpretation.tsx, świadomie NIE ten sam
 * komponent: Interpretation cache'uje wynik po hashu danych (Supabase +
 * localStorage) — dobre dla deterministycznych danych astro/numerologii,
 * złe dla zdjęcia (nie chcemy trzymać zdjęcia dłoni w localStorage, a "ten
 * sam hash = ten sam wynik" nie ma tu sensu, bo zdjęcie nie jest
 * deterministyczne). Tu generujemy zawsze na żywo, bez zapisu.
 *
 * renderMd()/akapitHtml() skopiowane z Interpretation.tsx (nie wydzielone
 * do wspólnego helpera w v1 — mniejsze ryzyko dla istniejącego, działającego
 * komponentu; do rozważenia, jeśli pojawi się trzeci konsument).
 */

function akapitHtml(t: string): string {
  return t
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, "• $1")
    .replace(/\n/g, "<br/>");
}

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

export interface DloniDane {
  imageBase64: string;
  imageMediaType: "image/jpeg";
  /** Tylko jeśli użytkownik dodatkowo skorzystał z opcjonalnej, ręcznej kalibracji. */
  geometria?: { typ: TypDloni; stosunekDloni: number; stosunekPalca: number };
}

interface Props {
  wiodaca: DloniDane;
  bierna: DloniDane;
  plec?: "on" | "ona" | "ono";
  imie?: string;
}

export default function HiromancjaOdczyt({ wiodaca, bierna, plec, imie }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy(true);
    setError(null);
    setText("");
    let acc = "";
    try {
      const res = await fetch("/api/hiromancja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wiodaca, bierna, plec, imie }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const raw = await res.text().catch(() => "");
        let komunikat: string | null = null;
        try { komunikat = (JSON.parse(raw) as { error?: string }).error ?? null; } catch { /* nie JSON */ }
        throw new Error(komunikat ?? `Nie udało się pobrać odczytu (kod ${res.status}).`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
      }
      setText(acc);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [wiodaca, bierna, plec, imie]);

  const przedOdczytem = !text && !busy;

  return (
    <div className="card" style={przedOdczytem ? {
      marginTop: 20, textAlign: "center", border: "1px solid var(--line-gold)",
      background: "rgba(230,196,138,0.05)",
    } : { marginTop: 20 }}>
      {przedOdczytem ? (
        <>
          <p className="eyebrow" style={{ marginBottom: 6 }}>Odczyt AI — obserwacja jakościowa</p>
          <p className="muted" style={{ maxWidth: 480, margin: "0 auto 18px", lineHeight: 1.6, fontSize: "0.88rem" }}>
            Claude spojrzy na obie dłonie naraz i opisze ich kształt oraz widoczne linie serca, głowy,
            życia i losu — osobno dla wiodącej i biernej, plus co je łączy lub różni. To subiektywny
            odczyt AI, nie pomiar.
          </p>
          <button className="btn btn-primary" onClick={generate}>
            {error ? "Spróbuj ponownie" : "Odczytaj obie dłonie (AI)"}
          </button>
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <p className="eyebrow" style={{ margin: 0 }}>Odczyt AI — obserwacja jakościowa</p>
          {(!text || (!!error && !busy)) && (
            <button className="btn btn-ghost" onClick={generate} disabled={busy} style={{ fontSize: "0.82rem" }}>
              {busy ? "Odczytuję…" : "Spróbuj ponownie"}
            </button>
          )}
        </div>
      )}
      {error && <p style={{ color: "var(--warn)", marginTop: 12, fontSize: "0.85rem" }}>{error}</p>}
      {busy && !text && <p className="muted" style={{ fontSize: "0.85rem", marginTop: 14 }}>Odczytuję obie dłonie…</p>}
      {text && (
        <>
          <hr className="gold-rule" style={{ margin: "16px 0" }} />
          <div className="interpretation interp-odslona" style={{ fontSize: "0.9rem", textAlign: "left" }}>
            {renderMd(text)}
          </div>
          <p className="muted" style={{ fontSize: "0.8rem", marginTop: 16 }}>
            To subiektywny odczyt AI na podstawie zdjęć, nie pomiar. Jakość linii na fotografii zależy
            od oświetlenia, rozdzielczości i kąta — traktuj to jako inspirację do refleksji, nie diagnozę.
          </p>
        </>
      )}
    </div>
  );
}
