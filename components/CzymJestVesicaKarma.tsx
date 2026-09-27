"use client";

import { useState } from "react";
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
 * Przycisk jest na dole strony, więc klik od razu przewija do koła (patrz
 * id="kolo-karmy" w page.tsx) i dopiero po 2s — gdy przewijanie na pewno się
 * skończyło — woła zacznij(), żeby użytkownik zdążył zobaczyć samo gaśnięcie.
 */
export default function CzymJestVesicaKarma() {
  const t = useTranslations("CzymJestVesicaKarma");
  const { zacznij } = useKoloKarmyStart();
  const strong = (c: React.ReactNode) => <strong>{c}</strong>;
  // Klikniecie od razu blokuje przycisk (kliknieto) i przewija do kola, ale
  // samo zacznij() — czyli faktyczne gasniecie zlota na Kole Karmy — czeka
  // 2s, zeby uzytkownik zdazyl dojechac scrollem i zobaczyc animacje, zamiast
  // przegapic ja w trakcie przewijania.
  const [kliknieto, setKliknieto] = useState(false);
  return (
    <div style={{ maxWidth: 720, margin: "40px auto 0" }}>
      {/* Ten sam h1 co "Astrologia Wedyjska" na /kosmogram — domyslny rozmiar
          z globals.css (clamp 2.5-4.1rem), tylko kolor/wyrownanie nadpisane.
          Sekcje nizej dzieli wylacznie pozioma kreska (.skrot-hero-linia),
          bez ramek/boxow. */}
      <h1 style={{ textAlign: "center", color: "var(--sand)", marginBottom: 16 }}>
        {t("tytul")}
      </h1>
      <div className="skrot-hero-linia" />
      <p style={{ fontSize: "1.05rem", lineHeight: 1.6, color: "var(--sand)", textAlign: "center", marginBottom: 32 }}>
        {t("podtytul")}
      </p>

      <div style={{ color: "var(--sand)", lineHeight: 1.8 }}>
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
          style={{ display: "block", width: "100%", maxWidth: 520, margin: "0 auto 28px" }}
        />

        <p style={{ marginBottom: 16 }}>
          {t.rich("dlonDominujaca", { strong })}
        </p>

        <p>
          {t.rich("dlonBierna", { strong })}
        </p>
      </div>

      <div className="skrot-hero-linia" />

      <div style={{ color: "var(--sand)", lineHeight: 1.8 }}>
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

        <p style={{ marginBottom: 16 }}>
          {t.rich("vesicaPiscisCzymJest", { em: (c) => <em>{c}</em> })}
        </p>

        <p>
          {t.rich("vesicaPiscis", { strong })}
        </p>
      </div>

      <div className="skrot-hero-linia" />

      <h2 style={{ textAlign: "center", margin: 0 }}>
        <button
          type="button"
          onClick={() => {
            if (kliknieto) return;
            setKliknieto(true);
            // Przycisk jest teraz na dole strony — bez tego uzytkownik nie
            // widzialby wcale gasniecia zlota do taupe na Kole Karmy u gory.
            document.getElementById("kolo-karmy")?.scrollIntoView({ behavior: "smooth", block: "start" });
            setTimeout(zacznij, 2000);
          }}
          disabled={kliknieto}
          style={{
            width: 150, height: 150, borderRadius: "50%",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-sans)", fontWeight: 800, textTransform: "uppercase",
            fontSize: "1.15rem", letterSpacing: "0.08em", color: "var(--bg)",
            background: "var(--sand)", border: "none",
            cursor: kliknieto ? "default" : "pointer",
            opacity: kliknieto ? 0.6 : 1, transition: "opacity 0.3s ease",
          }}
        >
          {t("zacznij")}
        </button>
      </h2>
    </div>
  );
}
