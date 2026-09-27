"use client";

import { useTranslations } from "next-intl";
import { useKoloKarmyStart } from "./KoloKarmyStartContext";

/**
 * Sekcja pod Kołem Karmy na stronie głównej — wyjaśnienie systemu, złożone
 * z dwóch tekstów dostarczonych przez użytkownika (zredagowane w jeden
 * spójny ciąg, bez powtórzeń), z wykresem (public/brand/wykres.jpg,
 * przekolorowanym na złoto w scripts/extract-wykres.mjs) wplecionym w
 * środku — dokładnie tam, gdzie podsumowuje "3 warunki -> 3 systemy ->
 * Koło Karmy -> kiedy/gdzie/co dalej".
 *
 * Nagłówek "Zacznij" jest jednocześnie przyciskiem uruchamiającym tryb
 * interaktywny Koła Karmy wyżej na stronie (KoloKarmyStartContext) — po
 * kliknięciu koło gaśnie do taupe i odkrywa się przez najeżdżanie. Komponent
 * musiał przez to przejść na klienta (useTranslations zamiast getTranslations).
 */
export default function CzymJestVesicaKarma() {
  const t = useTranslations("CzymJestVesicaKarma");
  const { wystartowano, zacznij } = useKoloKarmyStart();
  const strong = (c: React.ReactNode) => <strong>{c}</strong>;
  return (
    <div style={{ maxWidth: 720, margin: "70px auto 0" }}>
      <h2 style={{ textAlign: "center", marginBottom: 14 }}>
        <button
          type="button"
          onClick={zacznij}
          disabled={wystartowano}
          style={{
            font: "inherit", fontFamily: "var(--font-sans)", fontWeight: 800,
            fontSize: "1.6rem", letterSpacing: "0.08em", color: "var(--sand)",
            background: "none", border: "none", padding: 0,
            cursor: wystartowano ? "default" : "pointer",
            opacity: wystartowano ? 0.6 : 1, transition: "opacity 0.3s ease",
          }}
        >
          {t("zacznij")}
        </button>
      </h2>
      <div className="skrot-hero-linia" />

      {/* Nagłówek "Jedno spojrzenie" — bez ramek/boxów, sekcje niżej dzieli
          wyłącznie pozioma kreska (.skrot-hero-linia), ten sam wzorzec co
          np. ProfilDuszy.tsx. */}
      <h1 style={{
        fontFamily: "var(--font-serif)", fontSize: "2.6rem", color: "var(--sand)",
        fontWeight: 700, marginBottom: 16, textAlign: "center",
      }}>
        {t("tytul")}
      </h1>
      <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--sand)", textAlign: "center", marginBottom: 32 }}>
        {t("podtytul")}
      </p>

      <div style={{ color: "var(--sand)", fontSize: "0.95rem", lineHeight: 1.8 }}>
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

        <p>
          {t.rich("dlonBierna", { strong })}
        </p>
      </div>

      <div className="skrot-hero-linia" />

      <div style={{ color: "var(--sand)", fontSize: "0.95rem", lineHeight: 1.8 }}>
        <p style={{
          fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--sand)",
          textAlign: "center", marginBottom: 16,
        }}>
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

      <div className="skrot-hero-linia" />
    </div>
  );
}
