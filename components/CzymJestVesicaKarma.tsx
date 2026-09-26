import { getTranslations } from "next-intl/server";

/**
 * Sekcja pod Kołem Karmy na stronie głównej — wyjaśnienie systemu, złożone
 * z dwóch tekstów dostarczonych przez użytkownika (zredagowane w jeden
 * spójny ciąg, bez powtórzeń), z wykresem (public/brand/wykres.jpg,
 * przekolorowanym na złoto w scripts/extract-wykres.mjs) wplecionym w
 * środku — dokładnie tam, gdzie podsumowuje "3 warunki -> 3 systemy ->
 * Koło Karmy -> kiedy/gdzie/co dalej".
 */
export default async function CzymJestVesicaKarma() {
  const t = await getTranslations("CzymJestVesicaKarma");
  const strong = (c: React.ReactNode) => <strong>{c}</strong>;
  return (
    <div style={{ maxWidth: 720, margin: "70px auto 0" }}>
      <h2
        style={{
          textAlign: "center", fontFamily: "var(--font-sans)", fontWeight: 800,
          fontSize: "1.6rem", letterSpacing: "0.08em", color: "var(--sand)", marginBottom: 14,
        }}
      >
        {t("zacznij")}
      </h2>
      <div style={{ width: 120, height: 2, background: "var(--gold)", margin: "0 auto 40px" }} />

      <div
        style={{
          border: "1px dashed var(--line-gold)", borderRadius: 12, padding: "32px 30px",
          color: "var(--sand)", fontSize: "0.95rem", lineHeight: 1.8,
        }}
      >
        <p style={{ marginBottom: 16 }}>
          {t.rich("wstep", { strong })}
        </p>

        <p style={{ marginBottom: 16 }}>
          {t("trzyWarunki")}
        </p>

        <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
          <li style={{ marginBottom: 10 }}>
            {t.rich("astrologiaPunkt", { strong })}
          </li>
          <li style={{ marginBottom: 10 }}>
            {t.rich("numerologiaPunkt", { strong })}
          </li>
          <li>
            {t.rich("hiromancjaPunkt", { strong })}
          </li>
        </ul>

        <p style={{ marginBottom: 28 }}>
          {t("zadenNieIstnieje")}
        </p>

        <img
          src="/brand/wykres-vesica-karma.png"
          alt={t("wykresAlt")}
          style={{ display: "block", width: "100%", maxWidth: 380, margin: "0 auto 28px" }}
        />

        <p style={{ marginBottom: 16 }}>
          {t.rich("dlonDominujaca", { strong })}
        </p>

        <p style={{ marginBottom: 28 }}>
          {t.rich("dlonBierna", { strong })}
        </p>

        <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", marginBottom: 12 }}>
          {t("kiedyGdzieCoDalej")}
        </p>

        <p style={{ marginBottom: 16 }}>
          {t("wPunkcieNakladania")}
        </p>

        <ul style={{ margin: "0 0 28px", paddingLeft: 20 }}>
          <li style={{ marginBottom: 10 }}>
            {t.rich("kiedyDzialac", { strong })}
          </li>
          <li style={{ marginBottom: 10 }}>
            {t.rich("gdzieRozwijac", { strong })}
          </li>
          <li>
            {t.rich("coZTymZrobic", { strong })}
          </li>
        </ul>

        <p>
          {t.rich("vesicaPiscis", { strong })}
        </p>
      </div>
    </div>
  );
}
