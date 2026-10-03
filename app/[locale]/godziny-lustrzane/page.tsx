import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MIRROR_HOURS, type MirrorHour } from "@/lib/godziny";
import { SceneGodziny } from "@/components/infographics";
import SekcjaZlota from "@/components/SekcjaZlota";

export const metadata: Metadata = {
  title: "Godziny lustrzane — znaczenie wszystkich godzin",
  description:
    "Co oznacza godzina lustrzana, którą ciągle widzisz? Lista godzin lustrzanych i odwróconych ze znaczeniem: 11:11, 21:21, 22:22.",
  alternates: { canonical: "/godziny-lustrzane" },
};

/** Styl vesicakarma (jak astrologia i numerologia): złoty nagłówek z kreską, złote sekcje,
 *  godziny jako złote pastylki zamiast ciemnych kart, zachęta jako złote koło. */
export default async function GodzinyLustrzanePage() {
  const t = await getTranslations("GodzinyLustrzane");
  const lustrzane = MIRROR_HOURS.filter((h) => h.type === "lustrzana");
  const odwrocone = MIRROR_HOURS.filter((h) => h.type === "odwrócona");

  const siatka = (lista: MirrorHour[]) => (
    <div className="godziny-siatka">
      {lista.map((h) => (
        <Link key={h.slug} href={`/godziny-lustrzane/${h.slug}`} className="godzina-pastylka">
          <span className="godzina-pastylka-czas">{h.display}</span>
          <span className="godzina-pastylka-liczba">{t("liczbaEtykieta", { n: h.sum === 11 || h.sum === 22 ? h.sum : h.number })}</span>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="container section" style={{ paddingTop: 40 }}>
      <div className="fade-up" style={{ maxWidth: 340, margin: "0 auto 10px" }}><SceneGodziny /></div>
      <h1 style={{ textAlign: "center", color: "var(--sand)", marginBottom: 16 }}>{t("tytul")}</h1>
      <div className="skrot-hero-linia" />
      <p className="section-sub" style={{ color: "var(--sand)" }}>{t("opis")}</p>

      <SekcjaZlota tytul={t("lustrzaneTytul")}>{siatka(lustrzane)}</SekcjaZlota>
      <SekcjaZlota tytul={t("odwroconeTytul")}>{siatka(odwrocone)}</SekcjaZlota>

      <SekcjaZlota tytul={t("stopkaTytul")}>
        <p style={{ textAlign: "center", marginBottom: 22, fontSize: "0.95rem" }}>{t("stopkaOpis")}</p>
        <p style={{ textAlign: "center" }}>
          <Link href="/numerologia" className="przycisk-kolo">{t("stopkaCta")}</Link>
        </p>
      </SekcjaZlota>
    </div>
  );
}
