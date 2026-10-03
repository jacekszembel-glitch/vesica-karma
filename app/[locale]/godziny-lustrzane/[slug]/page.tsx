import type { Metadata } from "next";
import { skrocOpis } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import SekcjaZlota from "@/components/SekcjaZlota";
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

  // styl vesicakarma: złota godzina, złote sekcje z kreską i nagłówkiem, bez kart, złote koło
  return (
    <div className="container section" style={{ maxWidth: 760, paddingTop: 40 }}>
      <p style={{ textAlign: "center", marginBottom: 8 }}>
        <Link href="/godziny-lustrzane" className="link-zloty">← wszystkie godziny lustrzane</Link>
      </p>
      <h1 style={{ textAlign: "center", fontVariantNumeric: "tabular-nums", color: "var(--sand)", marginBottom: 16, fontSize: "clamp(3.6rem, 12vw, 5.2rem)" }}>
        {h.display}
      </h1>
      <div className="skrot-hero-linia" />
      <p className="section-sub" style={{ color: "var(--sand)", marginBottom: 8 }}>
        godzina {h.type} · suma cyfr {h.sum} · wibracja liczby <strong>{num}</strong> · {c.meaning.planeta}
      </p>

      <SekcjaZlota tytul={<>Co oznacza {h.display}?</>}>
        <p style={{ lineHeight: 1.8 }}>
          Godzina {h.display} {c.intro} Suma jej cyfr to {h.sum}, co daje wibrację
          liczby <strong>{num}</strong> — liczby,
          której tematem jest <strong>{c.meaning.temat}</strong>. W numerologii wedyjskiej
          tej wibracji patronuje {c.meaning.planeta}.
        </p>
      </SekcjaZlota>
      <SekcjaZlota tytul="Przesłanie tej godziny">
        <p style={{ lineHeight: 1.8 }}>
          Jeśli {h.display} pojawia się w Twoim życiu częściej, niż wypadałoby z przypadku,
          potraktuj to jako delikatne szturchnięcie: {c.actionText}.
        </p>
      </SekcjaZlota>
      <SekcjaZlota tytul={<>{h.display} a miłość</>}>
        <p style={{ lineHeight: 1.8 }}>{c.loveText}</p>
      </SekcjaZlota>

      <SekcjaZlota tytul="Twoja data mówi więcej">
        <p style={{ textAlign: "center", marginBottom: 22, fontSize: "0.95rem" }}>
          Liczby mówią do Ciebie? Sprawdź, co mówi cała Twoja data urodzenia.
        </p>
        <p style={{ textAlign: "center" }}>
          <Link href="/numerologia" className="przycisk-kolo">Twoja numerologia</Link>
        </p>
        <p style={{ textAlign: "center", marginTop: 18 }}>
          <a href="https://9dom.pl/dzis" className="link-zloty">Horoskop dnia na 9dom.pl →</a>
        </p>
      </SekcjaZlota>

      <div className="skrot-hero-linia" style={{ margin: "32px auto 16px" }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Link href={`/godziny-lustrzane/${prev.slug}`} className="link-zloty" style={{ fontSize: "0.95rem" }}>← {prev.display}</Link>
        <Link href={`/godziny-lustrzane/${next.slug}`} className="link-zloty" style={{ fontSize: "0.95rem" }}>{next.display} →</Link>
      </div>
    </div>
  );
}
