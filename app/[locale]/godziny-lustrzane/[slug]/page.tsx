import type { Metadata } from "next";
import { skrocOpis } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MIRROR_HOURS, hourBySlug, hourContent } from "@/lib/godziny";

/** ~37 statycznych stron godzin lustrzanych — programmatic SEO. */

export function generateStaticParams() {
  return MIRROR_HOURS.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const h = hourBySlug(slug);
  if (!h) return {};
  return {
    title: `${h.display} — znaczenie godziny lustrzanej`,
    description: skrocOpis(`Ciągle widzisz ${h.display} na zegarku? Znaczenie godziny ${h.type === "lustrzana" ? "lustrzanej" : "odwróconej"}: numerologia, przesłanie, miłość i planeta władająca.`),
    alternates: { canonical: `/godziny-lustrzane/${h.slug}` },
  };
}

export default async function GodzinaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const h = hourBySlug(slug);
  if (!h) notFound();
  const c = hourContent(h);
  const num = h.sum === 11 || h.sum === 22 ? h.sum : h.number;

  const idx = MIRROR_HOURS.findIndex((x) => x.slug === h.slug);
  const prev = MIRROR_HOURS[(idx - 1 + MIRROR_HOURS.length) % MIRROR_HOURS.length];
  const next = MIRROR_HOURS[(idx + 1) % MIRROR_HOURS.length];

  return (
    <div className="container section" style={{ maxWidth: 760 }}>
      <p style={{ textAlign: "center", marginBottom: 8 }}>
        <Link href="/godziny-lustrzane" className="muted" style={{ fontSize: "0.85rem" }}>← wszystkie godziny lustrzane</Link>
      </p>
      <h1 style={{ textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
        <span className="gradient-text">{h.display}</span>
      </h1>
      <p className="section-sub" style={{ marginBottom: 34 }}>
        godzina {h.type} · suma cyfr {h.sum} · wibracja liczby <strong>{num}</strong> · {c.meaning.planeta}
      </p>

      <div className="card" style={{ display: "grid", gap: 18 }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", marginBottom: 8 }}>Co oznacza {h.display}?</h2>
          <p className="muted" style={{ lineHeight: 1.8 }}>
            Godzina {h.display} {c.intro} Suma jej cyfr to {h.sum}, co daje wibrację
            liczby <strong style={{ color: "var(--primary-soft)" }}>{num}</strong> — liczby,
            której tematem jest <strong>{c.meaning.temat}</strong>. W numerologii wedyjskiej
            tej wibracji patronuje {c.meaning.planeta}.
          </p>
        </div>
        <div>
          <h2 style={{ fontSize: "1.25rem", marginBottom: 8 }}>Przesłanie tej godziny</h2>
          <p className="muted" style={{ lineHeight: 1.8 }}>
            Jeśli {h.display} pojawia się w Twoim życiu częściej, niż wypadałoby z przypadku,
            potraktuj to jako delikatne szturchnięcie: {c.actionText}.
          </p>
        </div>
        <div>
          <h2 style={{ fontSize: "1.25rem", marginBottom: 8 }}>{h.display} a miłość</h2>
          <p className="muted" style={{ lineHeight: 1.8 }}>{c.loveText}</p>
        </div>
      </div>

      <div className="card card-2" style={{ marginTop: 24, textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", marginBottom: 6 }}>
          Liczby mówią do Ciebie? Sprawdź, co mówi cała Twoja data urodzenia.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 12 }}>
          <Link href="/numerologia" className="btn btn-primary" style={{ padding: "11px 24px", fontSize: "0.92rem" }}>
            Twoja numerologia →
          </Link>
          <a href="https://9dom.pl/dzis" className="btn btn-ghost" style={{ padding: "11px 24px", fontSize: "0.92rem" }}>
            Horoskop dnia
          </a>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
        <Link href={`/godziny-lustrzane/${prev.slug}`} className="muted" style={{ fontSize: "0.9rem" }}>← {prev.display}</Link>
        <Link href={`/godziny-lustrzane/${next.slug}`} className="muted" style={{ fontSize: "0.9rem" }}>{next.display} →</Link>
      </div>
    </div>
  );
}
