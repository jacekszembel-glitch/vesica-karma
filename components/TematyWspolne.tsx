"use client";

import type { StanWskazania, SystemTematu, TematWspolny } from "@/lib/astro/tematy";

/**
 * Wspólne tematy trzech systemów (lib/astro/tematy.ts) — jeden sens życiowy w wierszu,
 * a w kolumnach to, co go pokazuje w kosmogramie, w dłoni i w numerologii. Wiersz,
 * który wskazują co najmniej dwa systemy, jest wyróżniony — to temat potwierdzony.
 */

const KOLUMNY: { id: SystemTematu; nazwa: string }[] = [
  { id: "kosmogram", nazwa: "Kosmogram" },
  { id: "dlon", nazwa: "Dłoń" },
  { id: "numerologia", nazwa: "Numerologia" },
];

const ZNACZNIK: Record<StanWskazania, { znak: string; tytul: string }> = {
  tak: { znak: "✦", tytul: "wyraźnie zaznaczone" },
  czesciowo: { znak: "◐", tytul: "częściowo" },
  nie: { znak: "·", tytul: "niezaznaczone" },
  nie_dotyczy: { znak: "—", tytul: "ten system nie mówi o tym temacie" },
  brak_danych: { znak: "?", tytul: "brak danych" },
};

function etykieta(t: TematWspolny): string | null {
  const pelne = Object.values(t.wskazania).filter((w) => w.stan === "tak").length;
  const wskazuja = Object.values(t.wskazania).filter((w) => w.stan === "tak" || w.stan === "czesciowo").length;
  if (pelne >= 2 && wskazuja === 3) return "potwierdza 3 systemy";
  if (wskazuja >= 2 && pelne >= 1) return `potwierdza ${wskazuja} systemy`;
  return null;
}

const NAZWA_SYSTEMU: Record<SystemTematu, string> = { kosmogram: "kosmogram", dlon: "dłoń", numerologia: "numerologia" };

/** Zestawienie z boku tabeli: same potwierdzone tematy, od najmocniejszych, z wnioskiem i źródłami. */
function Zestawienie({ tematy }: { tematy: TematWspolny[] }) {
  const potwierdzone = tematy.filter((t) => etykieta(t));
  const trzy = potwierdzone.filter((t) => etykieta(t) === "potwierdza 3 systemy");
  return (
    <aside className="tw-zestawienie">
      <p className="tw-zest-tytul">Co się zgadza</p>
      {potwierdzone.length === 0 ? (
        <p className="tw-zest-tekst">
          Żaden temat nie jest jeszcze potwierdzony w dwóch systemach naraz. Nowy odczyt dłoni zapisze więcej
          linii — wtedy zestawienie może się wypełnić.
        </p>
      ) : (
        <>
          <p className="tw-zest-tekst">
            {trzy.length > 0
              ? <>Najmocniej — bo wskazują je wszystkie trzy systemy niezależnie od siebie — w Twoim życiu
                zapisane są: <strong>{trzy.map((t) => t.nazwa.toLowerCase()).join("; ")}</strong>.</>
              : <>Te tematy wskazują co najmniej dwa systemy niezależnie od siebie:</>}
          </p>
          <ol className="tw-zest-lista">
            {potwierdzone.map((t) => {
              const zrodla = (Object.keys(t.wskazania) as SystemTematu[])
                .filter((s) => t.wskazania[s].stan === "tak" || t.wskazania[s].stan === "czesciowo");
              return (
                <li key={t.id}>
                  <p className="tw-zest-nazwa">{t.nazwa}<span>{zrodla.length === 3 ? "3 z 3" : "2 z 3"}</span></p>
                  <p className="tw-zest-tekst">{t.wniosek}</p>
                  <p className="tw-zest-zrodla">
                    {zrodla.map((s) => `${NAZWA_SYSTEMU[s]}: ${t.wskazania[s].opis}`).join(" · ")}
                  </p>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </aside>
  );
}

export default function TematyWspolne({ tematy }: { tematy: TematWspolny[] }) {
  return (
    <section className="tw-sekcja" style={{ textAlign: "left" }}>
      <h2 className="porownanie-tytul">Wspólne tematy</h2>
      <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.75 }}>
        Ten sam sens życiowy może być zapisany w niebie, w dłoni i w liczbach — np. skupisko planet
        w jednym domu i wyraźna linia losu mówią to samo: jest zaznaczony cel. Nie oceniamy tu, jaka to
        droga, tylko czy dany temat jest w Twoim życiu wyraźnie zaznaczony — i w ilu systemach naraz.
      </p>


      <div className="tw-uklad">
      <Zestawienie tematy={tematy} />
      <div className="tw-glowna">
      <div className="tw-tabela" role="table" aria-label="Wspólne tematy trzech systemów">
        <div className="tw-wiersz tw-naglowek" role="row">
          <span role="columnheader">Temat</span>
          {KOLUMNY.map((k) => <span key={k.id} role="columnheader">{k.nazwa}</span>)}
        </div>
        {tematy.map((t) => {
          const e = etykieta(t);
          return (
            <div key={t.id} className={`tw-wiersz${e ? " tw-potwierdzony" : ""}`} role="row">
              <div className="tw-temat" role="cell">
                <p className="tw-nazwa">{t.nazwa}</p>
                <p className="tw-znaczenie">{t.znaczenie}</p>
                {e && <p className="tw-etykieta">✦ {e}</p>}
              </div>
              {KOLUMNY.map((k) => {
                const w = t.wskazania[k.id];
                return (
                  <div key={k.id} className={`tw-komorka tw-${w.stan}`} role="cell">
                    <span className="tw-system">{k.nazwa}</span>
                    <span className="tw-znacznik" title={ZNACZNIK[w.stan].tytul}>{ZNACZNIK[w.stan].znak}</span>
                    {w.opis && <span className="tw-opis">{w.opis}</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <p className="muted porownanie-legenda" style={{ marginTop: 12 }}>
        ✦ wyraźnie zaznaczone · ◐ częściowo · · niezaznaczone · — ten system nie mówi o tym temacie · ? brak danych
      </p>
      <p className="muted" style={{ fontSize: "0.74rem", marginTop: 10, lineHeight: 1.6 }}>
        Pojedyncze wskazanie zdarza się często — każdy horoskop i każda dłoń coś podkreśla. Znaczenie
        ma zbieżność: dwa albo trzy niezależne systemy wskazujące ten sam temat. Linie dłoni pochodzą
        z ostatniego odczytu dłoni (nowsze odczyty zapisują ich więcej).
      </p>
      </div>
      </div>
    </section>
  );
}
