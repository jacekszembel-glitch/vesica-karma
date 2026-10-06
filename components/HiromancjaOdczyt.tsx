"use client";

import { useCallback, useRef, useState } from "react";
import type { TypDloni } from "@/lib/hiromancja";
import { zapiszOdczytDloni } from "@/lib/hiromancjaOdczytStore";
import { rozdzielOdczytDloni } from "@/lib/astro/zgodnosc";
import ZapalKrag from "./ZapalKrag";
import { PieczecOdslaniania } from "./Interpretation";

/** Złote myśli na czas odczytu dłoni — w duchu chiromancji, bez wróżenia. */
const MYSLI_DLONI = [
  "Dłoń bierna pokazuje, z czym przychodzisz. Wiodąca — co z tym zrobiłeś.",
  "Linie dłoni zmieniają się wolno, ale się zmieniają. Nic tu nie jest wyryte na zawsze.",
  "Linia życia nie mówi, jak długo żyjesz, tylko jak mocno w nim jesteś.",
  "Linia głowy to sposób myślenia, nie poziom inteligencji.",
  "Linia serca opowiada, jak kochasz — nie kogo i nie kiedy.",
  "Kształt dłoni to żywioł: ziemia, powietrze, ogień albo woda w Twoim charakterze.",
  "Różnica między dwiema dłońmi to droga, którą już przeszedłeś.",
  "Dłoń nie przepowiada losu. Pokazuje skłonności — wybór zostaje przy Tobie.",
  "Kciuk to wola. Im wyraźniejszy, tym łatwiej Ci stawiać granice.",
  "Brak linii losu nie znaczy braku drogi — tylko że piszesz ją sam, bez schematu.",
];

/**
 * ODCZYT AI — uproszczony sibling Interpretation.tsx, świadomie NIE ten sam
 * komponent: Interpretation cache'uje wynik po hashu danych (Supabase +
 * localStorage) — dobre dla deterministycznych danych astro/numerologii,
 * złe dla zdjęcia (nie chcemy trzymać zdjęcia dłoni w localStorage, a "ten
 * sam hash = ten sam wynik" nie ma tu sensu, bo zdjęcie nie jest
 * deterministyczne). Tu generujemy zawsze na żywo, ZDJĘCIE nigdy nie jest
 * zapisywane — ale sam gotowy TEKST odczytu zapisujemy (zapiszOdczytDloni),
 * żeby /karma mogła go pokazać jako trzeci głos syntezy bez ponownego
 * przesyłania zdjęć; to samo zdarzenie odblokowuje hiromancję jako
 * "zrobiony" system w Kole Karmy.
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
  /** Zbliżenia stref dłoni (lib/hiromancjaObraz.ts). */
  strefy?: { opis: string; imageBase64: string }[];
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
      // na końcu odczytu AI dopisuje ukryty blok danych (wzgórki, żywioł) — do porównania systemów, nie do czytania
      const { tekst, dane } = rozdzielOdczytDloni(acc);
      setText(tekst);
      zapiszOdczytDloni(tekst, dane);
      // krąg Chiromancji zapala przycisk ZapalKrag pod odczytem (nie automat)
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [wiodaca, bierna, plec, imie]);

  const przedOdczytem = !text && !busy;

  // Ten sam układ co Interpretation.tsx (kosmogram, numerologia): w .sekcja-zlota-ai karta jest
  // rozebrana z ramek, własne nagłówki h3 schowane (tytuł daje SekcjaZlota), a przycisk
  // odczytu to złote koło — dzięki temu odczyt dłoni wygląda jak reszta strony.
  return (
    <div className="card" style={przedOdczytem ? {
      marginTop: 24, textAlign: "center", border: "1px solid var(--line-gold)",
      background: "rgba(230,196,138,0.05)", boxShadow: "0 0 32px -14px var(--primary)",
    } : { marginTop: 24 }}>
      {przedOdczytem ? (
        <>
          <h3 style={{ color: "var(--primary-soft)", fontSize: "1.5rem" }}>✦ Odczyt dłoni</h3>
          <p className="muted" style={{ maxWidth: 480, margin: "8px auto 20px", lineHeight: 1.6 }}>
            Claude obejrzy obie dłonie w całości i w zbliżeniach — kształt, palce, linie główne
            i drobne, wzgórki i znaki — osobno dla wiodącej i biernej, plus co je łączy lub różni.
            Dokładny odczyt trwa około 1–2 minut.
          </p>
          <button className="btn btn-primary" onClick={generate} style={{ padding: "14px 36px", fontSize: "1rem" }}>
            {error ? "Spróbuj ponownie" : "Odczytaj dłonie"}
          </button>
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <h3 style={{ color: "var(--primary-soft)" }}>✦ Odczyt dłoni</h3>
          {!busy && (!text || !!error) && (
            <button className="btn btn-ghost" onClick={generate}>Spróbuj ponownie</button>
          )}
        </div>
      )}
      {error && <p style={{ color: "var(--warn)", marginTop: 12 }}>{error}</p>}
      {busy && !text && <PieczecOdslaniania tytul="Dłonie się odsłaniają…" mysli={MYSLI_DLONI} podpis="oglądam obie dłonie strefa po strefie — to potrwa 1–2 minuty" />}
      {text && (
        <>
          <hr className="gold-rule" style={{ margin: "18px 0" }} />
          <div className="interpretation interp-odslona">
            {renderMd(text)}
            {!busy && <span className="interp-skan" aria-hidden="true" />}
          </div>
          <p className="muted" style={{ fontSize: "0.8rem", marginTop: 18 }}>
            To subiektywny odczyt AI na podstawie zdjęć, nie pomiar. Jakość linii na fotografii zależy
            od oświetlenia, rozdzielczości i kąta — traktuj to jako inspirację do refleksji, nie diagnozę.
          </p>
          {text.trim().length > 200 && <ZapalKrag system="hiromancja"
            zapis={{ tekst: text, podpis: `Chiromancja — ${imie || "obie dłonie"}` }} />}
        </>
      )}
    </div>
  );
}
