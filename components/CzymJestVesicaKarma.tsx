/**
 * Sekcja pod Kołem Karmy na stronie głównej — wyjaśnienie systemu, złożone
 * z dwóch tekstów dostarczonych przez użytkownika (zredagowane w jeden
 * spójny ciąg, bez powtórzeń), z wykresem (public/brand/wykres.jpg,
 * przekolorowanym na złoto w scripts/extract-wykres.mjs) wplecionym w
 * środku — dokładnie tam, gdzie podsumowuje "3 warunki -> 3 systemy ->
 * Koło Karmy -> kiedy/gdzie/co dalej".
 */
export default function CzymJestVesicaKarma() {
  return (
    <div style={{ maxWidth: 720, margin: "70px auto 0" }}>
      <h2
        style={{
          textAlign: "center", fontFamily: "var(--font-sans)", fontWeight: 800,
          fontSize: "1.6rem", letterSpacing: "0.08em", color: "var(--sand)", marginBottom: 14,
        }}
      >
        Zacznij
      </h2>
      <div style={{ width: 120, height: 2, background: "var(--gold)", margin: "0 auto 40px" }} />

      <div
        style={{
          border: "1px dashed var(--line-gold)", borderRadius: 12, padding: "32px 30px",
          color: "var(--sand)", fontSize: "0.95rem", lineHeight: 1.8,
        }}
      >
        <p style={{ marginBottom: 16 }}>
          <strong>Vesica Karma</strong> to uniwersalna matryca przeznaczenia — Astrologia,
          Numerologia i Hiromancja w jednej geometrii.
        </p>

        <p style={{ marginBottom: 16 }}>
          Człowiek nie jest sumą przypadków, lecz precyzyjnie zaprojektowanym splotem czasu,
          miejsca i ciała. Każdy z nas, żeby przyjść na ten świat, musiał spełnić te trzy
          warunki — i każdy z nich ma swój odpowiednik w innym starożytnym wedyjskim systemie
          odczytu:
        </p>

        <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
          <li style={{ marginBottom: 10 }}>
            <strong>Astrologia wedyjska</strong> (czas i miejsce) — układ planet i kosmiczne
            siły w dokładnym momencie Twojego narodzenia.
          </li>
          <li style={{ marginBottom: 10 }}>
            <strong>Numerologia</strong> (wibracja czasu i imienia) — cykliczny rytm
            Twojego życia oraz potencjał zapisany w imieniu i nazwisku.
          </li>
          <li>
            <strong>Hiromancja</strong> (zapis w ciele) — kosmiczny archetyp przełożony wprost
            na linie Twoich dłoni. Nasza karma jest zapisana w ciele tak samo jak w gwiazdach —
            trzeba ją tylko odnaleźć i korzystać z jej dobrodziejstw.
          </li>
        </ul>

        <p style={{ marginBottom: 28 }}>
          Żaden z tych systemów nie istnieje w izolacji. Trzy przenikające się okręgi tworzą
          żywą matrycę Twojego życia — każdy opisuje ten sam wzór z innej perspektywy:
        </p>

        <img
          src="/brand/wykres-vesica-karma.png"
          alt="Schemat: Narodziny rozgałęziają się na Czas, Miejsce i Ciało — te odpowiadają Numerologii, Astrologii i Chiromancji, które razem prowadzą do Koła Karmy (Mahadasze/Jogi/Dosze, Astrokartografia), odpowiadającego na pytania Kiedy? Gdzie? Co dalej?"
          style={{ display: "block", width: "100%", maxWidth: 380, margin: "0 auto 28px" }}
        />

        <p style={{ marginBottom: 16 }}>
          <strong>Dłoń dominująca jak kosmogram D1 (Rasi):</strong> aktywna dłoń to świat
          fizycznej manifestacji i tu-i-teraz — codzienne wybory, widoczne działania, sposób,
          w jaki realizujesz swój los w świecie materialnym.
        </p>

        <p style={{ marginBottom: 28 }}>
          <strong>Dłoń bierna jak kosmogram D9 (Nawamsia):</strong> niedominująca dłoń to
          duchowy fundament i zapis karmy — wrodzone predyspozycje, ukryty potencjał, duchowe
          dziedzictwo, z którym przychodzisz na świat.
        </p>

        <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", marginBottom: 12 }}>
          Twoje Koło Karmy: kiedy, gdzie i co dalej
        </p>

        <p style={{ marginBottom: 16 }}>
          W punkcie, w którym te trzy sfery się nakładają, powstaje Koło Karmy — pełna
          synteza. Aplikacja nie tylko odkrywa Twój zapis karmiczny, ale daje konkretne
          narzędzia nawigacyjne:
        </p>

        <ul style={{ margin: "0 0 28px", paddingLeft: 20 }}>
          <li style={{ marginBottom: 10 }}>
            <strong>Kiedy działać?</strong> Mahadaszy, jogi i dosze wskazują właściwy czas na
            decyzje i zmiany.
          </li>
          <li style={{ marginBottom: 10 }}>
            <strong>Gdzie rozwijać skrzydła?</strong> Astrokartografia pokazuje miejsca na
            Ziemi sprzyjające Twojemu potencjałowi, relacjom i karierze.
          </li>
          <li>
            <strong>Co z tym zrobić?</strong> Praktyczne wskazówki, jak przełożyć wiedzę o
            swojej karmicznej strukturze na codzienne wybory.
          </li>
        </ul>

        <p>
          Cały system zaprojektowany jest na znaku <strong>Vesica Piscis</strong> — potrójnym
          wymiarze istnienia. Symbolizuje spójność trzech przenikających się stref: ciała,
          umysłu i duszy; przeszłości, teraźniejszości i przyszłości. To nie sztywny wyrok, lecz
          żywa przestrzeń, w której kosmiczny plan, osobisty rytm i ciało spotykają się, dając
          Ci pełną kontrolę nad własną ścieżką.
        </p>
      </div>
    </div>
  );
}
