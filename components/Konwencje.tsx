/**
 * Jawne konwencje obliczeniowe — pokazywane pod wynikami.
 * Powód: różne programy astrologiczne używają różnych ustawień;
 * bez tej informacji użytkownik nie wie, dlaczego np. Rahu wypada
 * w innym znaku niż w kalkulatorze konkurencji.
 */

const POZYCJE = [
  {
    k: "Który zodiak",
    v: "indyjski (syderyczny)",
    d: "Liczymy tak, jak astrologia indyjska: według rzeczywistego położenia gwiazd na niebie. Horoskopy z gazet i większość stron zachodnich używają innego układu, przesuniętego o prawie cały znak. Dlatego u nas Twój znak może wyjść inny — i to nie pomyłka, tylko inna szkoła.",
  },
  {
    k: "Rahu i Ketu",
    v: "wersja tradycyjna",
    d: "To dwa punkty na niebie liczone na dwa sposoby. Wybieramy ten starszy, klasyczny. Nowsza metoda daje wynik przesunięty o ok. 1,8° — czasem wystarczy, by wyszedł sąsiedni znak. Jeśli gdzieś indziej widzisz inny wynik, prawie zawsze chodzi właśnie o to.",
  },
  {
    k: "Podział na domy",
    v: "cały znak to jeden dom",
    d: "Najstarszy i najprostszy sposób dzielenia mapy na 12 obszarów życia. Inne programy tną domy pod innym kątem — wtedy część planet wypada w sąsiednim obszarze.",
  },
  {
    k: "Dokładność",
    v: "sprawdzona na zaćmieniach",
    d: "Pozycje Słońca i Księżyca zgadzają się z rzeczywistymi momentami zaćmień co do kilkunastu sekund. Daty przejść planet między znakami pokrywają się z tymi publikowanymi w Indiach.",
  },
  {
    k: "Godzina urodzenia",
    v: "z uwzględnieniem dawnego czasu letniego",
    d: "Zegary w przeszłości przestawiano inaczej niż dziś — Polska nie miała czasu letniego w latach 1950–1976, a Sri Lanka zmieniała strefę w 1996 i 2006. Bierzemy to pod uwagę, żeby godzina urodzenia była policzona poprawnie.",
  },
];

export default function Konwencje({ compact = false }: { compact?: boolean }) {
  return (
    <details className="konwencje">
      <summary>
        <span className="konwencje-ico">ℹ</span> Jak to liczymy
      </summary>
      <div className="konwencje-body">
        <p className="muted" style={{ fontSize: "0.85rem", marginBottom: 14 }}>
          Jeśli porównujesz wynik z innym programem i coś się różni, przyczyna
          jest niemal zawsze tutaj — nie w błędzie obliczeń.
        </p>
        <div style={{ display: "grid", gap: 12 }}>
          {POZYCJE.map((p) => (
            <div key={p.k}>
              <p style={{ fontSize: "0.9rem" }}>
                <strong style={{ color: "var(--sand)" }}>{p.k}:</strong> {p.v}
              </p>
              {!compact && (
                <p className="muted" style={{ fontSize: "0.82rem", lineHeight: 1.55 }}>{p.d}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
