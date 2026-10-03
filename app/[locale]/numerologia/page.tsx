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
import SekcjaZlota from "@/components/SekcjaZlota";
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
        <div className="fade-up" style={{ marginTop: 16 }}>
          {/* wyniki w złotym stylu działów (jak kosmogram): kreska z kropką, nagłówek
              2,6rem, złoty tekst, bez kart i ramek — components/SekcjaZlota.tsx */}
          <SekcjaZlota tytul="Twoje liczby">
              <p className="muted" style={{ fontSize: "0.86rem", lineHeight: 1.5, marginBottom: 16, textAlign: "center" }}>
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

              <p style={{ textAlign: "center", fontSize: "0.9rem", marginTop: 18 }}>
                Planeta władająca: <strong>{wynik.rulingPlanet}</strong>
              </p>
          </SekcjaZlota>

          {/* Mulank↔Bhagyank przez przyjaźń planet — tak łączy je klasyczna numerologia wedyjska (nie sumą) */}
          <SekcjaZlota tytul={<Term k="relacjamulankbhagyank" plain>Mulank i Bhagyank</Term>}>
            <RelacjaMulankBhagyank numerology={wynik} />
          </SekcjaZlota>

          {/* predyspozycje i na co uważać — całościowo: data + wszystkie liczby osobiste */}
          <SekcjaZlota tytul="Predyspozycje">
            <PredyspozycjeLiczb numerology={wynik} />
          </SekcjaZlota>
          <SekcjaZlota tytul="Na co uważać">
            <NaCoUwazacLiczb numerology={wynik} />
          </SekcjaZlota>

          {/* interpretacja AI — ten sam złoty styl co na kosmogramie */}
          <div className="sekcja-zlota-ai">
            <SekcjaZlota tytul="Interpretacja">
              <Interpretation kind="numerologia" data={aiData!} label="Numerologia wedyjska" />
            </SekcjaZlota>
          </div>
        </div>
      )}
    </div>
  );
}
