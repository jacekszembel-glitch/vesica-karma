"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GLOSSARY, type Term as GlossaryTerm } from "@/lib/glossary";

/**
 * Termin z wyjaśnieniem po najechaniu.
 *
 * Zasady:
 * - działa też z klawiatury (Tab + Escape) i pod palcem (tap), nie tylko myszką,
 * - treść bierze się ze słownika `lib/glossary.ts` ALBO — gdy trzeba wygenerować
 *   ją z konkretnych danych (np. jedna z 27 nakszatr) — z propa `term`, żeby nie
 *   przepisywać ręcznie tego, co appka już policzyła,
 * - dymek renderujemy PRZEZ PORTAL do <body> i pozycjonujemy na sztywno względem
 *   okna. Wcześniej był zwykłym elementem w środku, przez co kontenery z
 *   `overflow: auto` (np. przewijane tabele) po prostu go ucinały.
 */

interface Props {
  /** Klucz hasła w GLOSSARY. Pomijalny, gdy podano `term`. */
  k?: string;
  /** Treść dymka wprost, z pominięciem słownika — dla haseł generowanych dynamicznie. */
  term?: GlossaryTerm;
  /** Tekst do pokazania; domyślnie tytuł hasła. */
  children?: React.ReactNode;
  /** Wyłącza podkreślenie — gdy element sam w sobie jest już wyróżniony (np. pastylka). */
  plain?: boolean;
}

const SZEROKOSC = 320;
const MARGINES = 12;
const ODSTEP = 10;

export default function Term({ k, term, children, plain = false }: Props) {
  const t = term ?? (k ? GLOSSARY[k] : undefined);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; below: boolean } | null>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  const place = useCallback(() => {
    const w = wrapRef.current;
    if (!w) return;
    const r = w.getBoundingClientRect();
    const h = tipRef.current?.offsetHeight ?? 120;

    // domyślnie nad terminem; gdy brak miejsca — pod nim
    const below = r.top - h - ODSTEP < MARGINES;
    const top = below ? r.bottom + ODSTEP : r.top - h - ODSTEP;

    // wyśrodkowanie z dociśnięciem do krawędzi okna
    let left = r.left + r.width / 2 - SZEROKOSC / 2;
    left = Math.max(MARGINES, Math.min(left, window.innerWidth - SZEROKOSC - MARGINES));

    setPos({ left, top, below });
  }, []);

  useLayoutEffect(() => { if (open) place(); }, [open, place]);

  // przy przewijaniu i zmianie rozmiaru dymek musi nadążać za terminem
  useEffect(() => {
    if (!open) return;
    const onMove = () => place();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, place]);

  const onKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((v) => !v); }
  }, []);

  if (!t) return <>{children ?? k}</>;

  const dymek = open && typeof document !== "undefined" ? createPortal(
    <span
      ref={tipRef}
      id={id}
      role="tooltip"
      className="term-tip"
      style={{
        left: pos?.left ?? -9999,
        top: pos?.top ?? -9999,
        width: SZEROKOSC,
        visibility: pos ? "visible" : "hidden",
      }}
    >
      <span className="term-tip-head">
        {t.title}
        {t.sanskrit && <span className="term-tip-skt"> · {t.sanskrit}</span>}
      </span>
      <span className="term-tip-body">{t.text}</span>
    </span>,
    document.body,
  ) : null;

  return (
    <span
      ref={wrapRef}
      className={plain ? "term term-plain" : "term"}
      tabIndex={0}
      role="button"
      aria-describedby={open ? id : undefined}
      aria-expanded={open}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={onKey}
      onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
    >
      {children ?? t.title}
      {dymek}
    </span>
  );
}
