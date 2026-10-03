/**
 * Złota sekcja — ten sam styl co góra kosmogramu („Jedno spojrzenie”, „Profil duszy”):
 * pozioma kreska z kropką, nagłówek 2,6rem var(--sand), złoty tekst, bez ramek i kart.
 * Używana przez działy przeniesione z 9dom.pl (zdrowie, predyspozycje, talenty, kariera,
 * finanse, wrażliwość duchowa, talenty z jog) — w 9dom są w rozwijanych kartach.
 */
export default function SekcjaZlota({ tytul, children }: { tytul: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="sekcja-zlota">
      <div className="skrot-hero-linia" style={{ margin: "32px auto 16px" }} />
      <p className="sekcja-zlota-tytul">{tytul}</p>
      {children}
    </section>
  );
}
