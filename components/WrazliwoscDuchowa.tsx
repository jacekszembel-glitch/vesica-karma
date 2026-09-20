"use client";

import type { VedicChart } from "@/lib/astro/chart";
import { wrazliwoscDuchowa, OPIS_ODCIENIA, type PoziomWrazliwosci } from "@/lib/astro/duchowaWrazliwosc";

const POZIOM_OPIS: Record<PoziomWrazliwosci, string> = {
  "wyraźna": "Wyraźny temat w Twojej mapie — łatwiej niż wielu innym przychodzi Ci wyczuwanie tego, co niewypowiedziane: nastrojów, atmosfery miejsc, subtelnych sygnałów, które inni pomijają.",
  "umiarkowana": "Obecny, ale nie dominujący temat — masz dostęp do tej wrażliwości, choć nie definiuje ona całej Twojej natury tak, jak dzieje się to u osób z silniejszym wskazaniem.",
  "subtelna": "Delikatny, w tle — ta strona nie jest u Ciebie szczególnie wyostrzona. To nie ujma, po prostu inne tematy w Twojej mapie mówią głośniej.",
};

const POZIOM_PROCENT: Record<PoziomWrazliwosci, number> = { "wyraźna": 90, "umiarkowana": 55, "subtelna": 25 };
const POZIOM_KOLOR: Record<PoziomWrazliwosci, string> = { "wyraźna": "#6fbf9f", "umiarkowana": "#e6c48a", "subtelna": "#93a6b3" };

export default function WrazliwoscDuchowa({ chart }: { chart: VedicChart }) {
  const w = wrazliwoscDuchowa(chart);
  const kolor = POZIOM_KOLOR[w.poziom];

  return (
    <details className="card" style={{ marginBottom: 24 }}>
      <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)" }}>
        Wrażliwość duchowa
      </summary>
      <p className="muted" style={{ fontSize: "0.84rem", margin: "12px 0 18px", lineHeight: 1.55 }}>
        Klasyczny Jyotish nie ma osobnej kategorii na konkretne "zdolności paranormalne" (np.
        radiestezję) — to inny, uczciwszy temat: naturalne wyczulenie na to, co niematerialne
        (intuicja, atmosfera, podświadomość), wynikające z Ketu (klasycznego karaki intuicji i
        mistyki) oraz domów 8. (tajemnica), 9. (dharma, guru, wiara) i 12. (duchowość). To temat
        i skłonność widoczna w mapie — nie zweryfikowana "moc" ani gwarancja konkretnej umiejętności.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <span style={{ flex: 1, minWidth: 60, maxWidth: 260, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
          <span style={{
            display: "block", width: `${POZIOM_PROCENT[w.poziom]}%`, height: "100%", borderRadius: 4,
            background: kolor, transition: "width 0.4s var(--ease-out)",
          }} />
        </span>
        <span style={{ color: kolor, fontWeight: 600, fontSize: "0.9rem" }}>{w.poziom}</span>
      </div>

      <p style={{ fontSize: "0.88rem", lineHeight: 1.55, marginBottom: 10 }}>{POZIOM_OPIS[w.poziom]}</p>

      {w.odcien && (
        <p className="muted" style={{ fontSize: "0.84rem", lineHeight: 1.55, marginBottom: 10 }}>
          W Twojej mapie ten temat przechyla się najbardziej w stronę: <strong style={{ color: "var(--sand)" }}>{OPIS_ODCIENIA[w.odcien]}</strong>.
        </p>
      )}

      {w.czynniki.length > 0 ? (
        <p className="muted" style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>
          <span style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.68rem" }}>
            Skąd to wynika w Twojej mapie:
          </span>{" "}
          {w.czynniki.join(" · ")}
        </p>
      ) : (
        <p className="muted" style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>
          Żaden z pięciu sprawdzanych czynników (kondycja Ketu, planety w 8./9./12. domu, koniunkcja
          Księżyc-Ketu, aspekt Jowisza na Ketu) nie wystąpił w Twojej mapie w wyraźnej formie.
        </p>
      )}
    </details>
  );
}
