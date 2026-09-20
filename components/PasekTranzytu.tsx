"use client";

/**
 * PASEK TRANZYTU — mała, wspólna "miarka" pokazująca, gdzie w oknie
 * wejście→wyjście ze znaku jest "dziś". Używana zarówno w liście gochary
 * (TranzytyTeraz), jak i w boksie Saturna nad Księżycem — jeden spójny
 * wizualny język zamiast osobnej grafiki dla każdego miejsca.
 */

/** „2 lata i 4 miesiące”, „18 dni” — bez końcówek typu „1 lat”. */
export function czasTrwania(ms: number): string {
  const dni = Math.round(ms / 86400000);
  if (dni < 31) return `${dni} ${dni === 1 ? "dzień" : "dni"}`;
  const mies = Math.round(ms / (30.44 * 86400000));
  const l = Math.floor(mies / 12);
  const m = mies % 12;
  const slowoL = l === 1 ? "rok" : l >= 2 && l <= 4 ? "lata" : "lat";
  const slowoM = m === 1 ? "miesiąc" : m >= 2 && m <= 4 ? "miesiące" : "miesięcy";
  if (l === 0) return `${m} ${slowoM}`;
  if (m === 0) return `${l} ${slowoL}`;
  return `${l} ${slowoL} i ${m} ${slowoM}`;
}

const fmtKrotko = (d: Date) => d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });

export default function PasekTranzytu({
  wchodzi, wychodzi, kolor = "var(--line-gold)",
}: { wchodzi: Date | null; wychodzi: Date | null; kolor?: string }) {
  if (!wchodzi && !wychodzi) return null;
  const now = Date.now();
  /** Ułamek 0–1 TYLKO gdy znamy oba krańce — inaczej nie ma z czego liczyć proporcji,
      więc pasek zostaje pusty zamiast zmyślać (100% sugerowałoby "prawie koniec",
      0% "dopiero się zaczyna" — oba równie fałszywe, gdy po prostu nie znamy końca). */
  const postep = wchodzi && wychodzi
    ? Math.min(1, Math.max(0, (now - wchodzi.getTime()) / (wychodzi.getTime() - wchodzi.getTime())))
    : null;
  const zostalo = wychodzi && wychodzi.getTime() > now ? czasTrwania(wychodzi.getTime() - now) : null;

  return (
    <div style={{ maxWidth: 360 }}>
      <div style={{
        height: 6, borderRadius: 3, background: "rgba(127,208,216,0.16)",
        overflow: "hidden", position: "relative",
      }}>
        <div style={{ height: "100%", borderRadius: 3, width: `${(postep ?? 0) * 100}%`, background: kolor }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginTop: 3 }} className="muted">
        <span>{wchodzi ? fmtKrotko(wchodzi) : "dawniej"}</span>
        <span>{zostalo ? `jeszcze ${zostalo}` : ""}</span>
        <span>{wychodzi ? fmtKrotko(wychodzi) : "poza zasięgiem wyliczeń"}</span>
      </div>
    </div>
  );
}
