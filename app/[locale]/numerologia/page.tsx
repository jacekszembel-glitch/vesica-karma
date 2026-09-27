"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Interpretation from "@/components/Interpretation";
import { numerology, type NumerologyResult } from "@/lib/astro/numerology";
import BirthForm, { type BirthInput } from "@/components/BirthForm";
import KoloDanychPanel from "@/components/KoloDanychPanel";
import Term from "@/components/Term";
import RelacjaMulankBhagyank from "@/components/RelacjaMulankBhagyank";
import PredyspozycjeLiczb from "@/components/PredyspozycjeLiczb";
import NaCoUwazacLiczb from "@/components/NaCoUwazacLiczb";
import { odblokuj } from "@/lib/collection";
import { odblokujSystemKarmy } from "@/lib/koloKarmyGeometria";

function Num({ label, value, big, note }: {
  label: React.ReactNode; value: number | string | null; big?: boolean; note?: React.ReactNode;
}) {
  if (value === null) return null;
  return (
    <div style={{ textAlign: "center" }}>
      <p className="muted" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</p>
      <p style={{
        fontFamily: "var(--font-serif)", color: "var(--primary-soft)",
        fontSize: big ? "2.6rem" : "1.5rem", lineHeight: 1.2,
      }}>{value}</p>
      {note && <p className="muted" style={{ fontSize: "0.68rem", lineHeight: 1.4, marginTop: 2 }}>{note}</p>}
    </div>
  );
}

export default function NumerologiaPage() {
  const [date, setDate] = useState("1990-06-15");
  const [name, setName] = useState<string | undefined>(undefined);
  const [wynik, setWynik] = useState<NumerologyResult | null>(null);
  const [zwiniete, setZwiniete] = useState(false);

  function handleSubmit(input: BirthInput) {
    const rok = new Date().getFullYear();
    setDate(input.isoDate);
    setName(input.name);
    setWynik(numerology(input.isoDate, input.name, "wedyjski", rok));
    setZwiniete(true);
    odblokuj("numerologia");
    odblokujSystemKarmy("numerologia");
  }

  const aiData = useMemo(() => {
    if (!wynik) return null;
    return {
      dataUrodzenia: date,
      imieNazwisko: name || undefined,
      drogaZycia: wynik.lifePath,
      liczbaUrodzenia_mulank: wynik.birthday,
      planetaWladajaca: wynik.rulingPlanet,
      liczbaPrzeznaczenia_bhagyank: wynik.destiny,
      ekspresja: wynik.expression,
      dusza: wynik.soulUrge,
      osobowosc: wynik.personality,
      rokOsobisty: wynik.personalYear,
      siatkaLoShu: wynik.loShuGrid,
    };
  }, [wynik, date, name]);

  return (
    <div className="container section" style={{ paddingTop: 40 }}>
      <h1 style={{ textAlign: "center", color: "var(--sand)", marginBottom: 16 }}>Numerologia wedyjska</h1>
      <div className="skrot-hero-linia" />
      <p className="section-sub" style={{ color: "var(--sand)" }}>
        Indyjski system numerologii — każda liczba ma swoją planetę. Mulank (liczba urodzenia) i
        bhagyank (liczba przeznaczenia) liczymy zawsze z daty urodzenia; imię i nazwisko dodaje
        liczby ekspresji, duszy i osobowości.
      </p>

      <p style={{ textAlign: "center", marginTop: "-20px", marginBottom: 30 }}>
        <Link href="/godziny-lustrzane" className="muted" style={{ fontSize: "0.88rem" }}>
          Ciągle widzisz 11:11 albo 21:21? → sprawdź znaki czasu
        </Link>
      </p>

      {/* Ten sam panel "kolo-danych" co na /kosmogram (wspólny profil przez
          lib/birthStore.ts) — astrologia nie pyta już o imię (usunięte tam),
          numerologia nie pyta o godzinę i miejsce (askTimePlace={false}),
          bo do mulanka/bhagyanka wystarczy data urodzenia. */}
      <KoloDanychPanel zlozone={zwiniete} onRozwin={() => setZwiniete(false)}>
        <p className="kolo-danych-tytul">Twoje dane</p>
        <BirthForm onSubmit={handleSubmit} submitLabel="Oblicz liczby" askTimePlace={false} />
      </KoloDanychPanel>

      {wynik && (
        <div className="fade-up" style={{ marginTop: 48 }}>
          {/* karta liczb i relacja Mulank↔Bhagyank obok siebie, na tej samej, standardowej
              szerokości co reszta strony (siatka, predyspozycje, interpretacja) niżej —
              cała sekcja wyników ma teraz jedną spójną szerokość. */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))", gap: 20 }}>
            <div className="card" style={{ borderTop: "2px solid var(--sand)" }}>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--sand)", marginBottom: 3 }}>Numerologia wedyjska</p>
              <p className="muted" style={{ fontSize: "0.78rem", lineHeight: 1.5, marginBottom: 16 }}>
                Indyjski system — każda liczba ma planetę; mulank, bhagyank i planeta władająca.
              </p>

              <Num label={<Term k="drogazycia">Droga życia</Term>} value={wynik.lifePath} big />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginTop: 16 }}>
                <Num
                  label={<Term k="liczbaurodzenia">Mulank</Term>}
                  value={wynik.birthday}
                  note={wynik.birthdayMaster
                    ? <>z liczby mistrz. <strong style={{ color: "var(--teal-soft)" }}>11</strong> — w wedyjskim redukowana</>
                    : undefined}
                />
                <Num label={<Term k="liczbaprzeznaczenia">Bhagyank</Term>} value={wynik.destiny} />
                <Num label={<Term k="rokosobisty">Rok osobisty</Term>} value={wynik.personalYear} />
                <Num label={<Term k="numekspresja">Ekspresja</Term>} value={wynik.expression} />
                <Num label={<Term k="numdusza">Dusza</Term>} value={wynik.soulUrge} />
                <Num label={<Term k="numosobowosc">Osobowość</Term>} value={wynik.personality} />
              </div>

              <hr className="gold-rule" style={{ margin: "18px 0 12px" }} />
              <p style={{ textAlign: "center", fontSize: "0.85rem" }} className="muted">
                Planeta władająca: <strong style={{ color: "var(--sand)" }}>{wynik.rulingPlanet}</strong>
              </p>
            </div>

            {/* Mulank↔Bhagyank przez przyjaźń planet — tak łączy je klasyczna numerologia wedyjska (nie sumą) */}
            <RelacjaMulankBhagyank numerology={wynik} />
          </div>

          {/* predyspozycje i na co uważać — całościowo: data + wszystkie liczby osobiste, jedna wspólna karta */}
          <div className="card fade-up" style={{ marginTop: 24 }}>
            <PredyspozycjeLiczb numerology={wynik} />
            <NaCoUwazacLiczb numerology={wynik} />
          </div>

          {/* interpretacja AI */}
          <div style={{ marginTop: 32 }}>
            <h3 style={{ textAlign: "center", marginBottom: 20 }}>Interpretacja</h3>
            <Interpretation kind="numerologia" data={aiData!} label="Numerologia wedyjska" />
          </div>
        </div>
      )}
    </div>
  );
}
