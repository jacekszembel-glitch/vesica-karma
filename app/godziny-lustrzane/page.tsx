import type { Metadata } from "next";
import Link from "next/link";
import { MIRROR_HOURS } from "@/lib/godziny";
import { SceneGodziny } from "@/components/infographics";

export const metadata: Metadata = {
  title: "Godziny lustrzane — znaczenie wszystkich godzin",
  description:
    "Co oznacza godzina lustrzana, którą ciągle widzisz? Lista godzin lustrzanych i odwróconych ze znaczeniem: 11:11, 21:21, 22:22.",
  alternates: { canonical: "/godziny-lustrzane" },
};

export default function GodzinyLustrzanePage() {
  const lustrzane = MIRROR_HOURS.filter((h) => h.type === "lustrzana");
  const odwrocone = MIRROR_HOURS.filter((h) => h.type === "odwrócona");

  return (
    <div className="container section">
      <div className="fade-up" style={{ maxWidth: 340, margin: "0 auto 10px" }}><SceneGodziny /></div>
      <h1 style={{ textAlign: "center" }}>Godziny lustrzane</h1>
      <p className="section-sub">
        Spojrzałaś/eś na zegarek dokładnie o 21:21? Znowu 11:11? Wybierz godzinę,
        którą widujesz — każda niesie własną wibrację liczby i przesłanie.
      </p>

      <h2 style={{ fontSize: "1.3rem", margin: "10px 0 16px" }}>Godziny lustrzane (podwojone)</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(110px, 100%), 1fr))", gap: 10 }}>
        {lustrzane.map((h) => (
          <Link key={h.slug} href={`/godziny-lustrzane/${h.slug}`} className="card card-hover"
            style={{ padding: "16px 10px", textAlign: "center" }}>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.35rem", color: "var(--primary-soft)", fontVariantNumeric: "tabular-nums" }}>
              {h.display}
            </span>
            <p className="muted" style={{ fontSize: "0.75rem", marginTop: 2 }}>liczba {h.sum === 11 || h.sum === 22 ? h.sum : h.number}</p>
          </Link>
        ))}
      </div>

      <h2 style={{ fontSize: "1.3rem", margin: "34px 0 16px" }}>Godziny odwrócone</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(110px, 100%), 1fr))", gap: 10 }}>
        {odwrocone.map((h) => (
          <Link key={h.slug} href={`/godziny-lustrzane/${h.slug}`} className="card card-hover"
            style={{ padding: "16px 10px", textAlign: "center" }}>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.35rem", color: "var(--primary-soft)", fontVariantNumeric: "tabular-nums" }}>
              {h.display}
            </span>
            <p className="muted" style={{ fontSize: "0.75rem", marginTop: 2 }}>liczba {h.sum === 11 || h.sum === 22 ? h.sum : h.number}</p>
          </Link>
        ))}
      </div>

      <div className="card card-2" style={{ marginTop: 40, maxWidth: 720, marginLeft: "auto", marginRight: "auto", textAlign: "center" }}>
        <h3 style={{ marginBottom: 8 }}>Godziny to znaki chwili. Twoja mapa to całość.</h3>
        <p className="muted" style={{ marginBottom: 16, fontSize: "0.95rem" }}>
          Jeśli liczby do Ciebie mówią — sprawdź, co mówi cała Twoja data urodzenia.
        </p>
        <Link href="/numerologia" className="btn btn-primary">Policz swoją numerologię →</Link>
      </div>
    </div>
  );
}
