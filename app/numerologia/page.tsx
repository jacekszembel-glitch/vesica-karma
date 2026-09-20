"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Interpretation from "@/components/Interpretation";
import { numerology, personalMonths, type NumerologyResult } from "@/lib/astro/numerology";
import { SceneNumerologia } from "@/components/infographics";
import DateInput from "@/components/DateInput";
import { IconRaportPortret, IconRaportDziecko, IconRaportFinanse, IconRaportRok } from "@/components/icons";
import Term from "@/components/Term";
import SiatkaLiczb from "@/components/SiatkaLiczb";
import RelacjaMulankBhagyank from "@/components/RelacjaMulankBhagyank";
import PredyspozycjeLiczb from "@/components/PredyspozycjeLiczb";
import NaCoUwazacLiczb from "@/components/NaCoUwazacLiczb";
import { odblokuj } from "@/lib/collection";

const MIESIACE = [
  "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
  "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
];

type RodzajRaportu = "portret" | "dziecko" | "finanse" | "rok";

const RAPORTY: { id: RodzajRaportu; label: string; kind: "numerologia" | "numerologia-dziecko" | "numerologia-finanse" | "numerologia-rok"; Icon: (p: { size?: number; className?: string }) => React.ReactElement }[] = [
  { id: "portret", label: "Portret ogólny", kind: "numerologia", Icon: IconRaportPortret },
  { id: "dziecko", label: "Dla dziecka", kind: "numerologia-dziecko", Icon: IconRaportDziecko },
  { id: "finanse", label: "Finanse", kind: "numerologia-finanse", Icon: IconRaportFinanse },
  { id: "rok", label: "Prognoza roczna", kind: "numerologia-rok", Icon: IconRaportRok },
];

const FORM_COPY: Record<RodzajRaportu, { dateLabel: string; nameLabel: string; namePlaceholder: string; hint: string }> = {
  portret: {
    dateLabel: "Data urodzenia", nameLabel: "Imię i nazwisko (opcjonalnie)", namePlaceholder: "np. Jacek Kowalski",
    hint: "Ogólny profil na podstawie policzonych liczb.",
  },
  dziecko: {
    dateLabel: "Data urodzenia dziecka", nameLabel: "Imię dziecka (opcjonalnie)", namePlaceholder: "np. Zosia Kowalska",
    hint: "Talenty i wskazówki wychowawcze — wpisz dane DZIECKA poniżej, nie swoje.",
  },
  finanse: {
    dateLabel: "Data urodzenia", nameLabel: "Imię i nazwisko (opcjonalnie)", namePlaceholder: "np. Jacek Kowalski",
    hint: "Wzorce finansowe wynikające z Twoich liczb — nie porada inwestycyjna.",
  },
  rok: {
    dateLabel: "Data urodzenia", nameLabel: "Imię i nazwisko (opcjonalnie)", namePlaceholder: "np. Jacek Kowalski",
    hint: "12 miesięcy naprzód, liczone od Twojego roku osobistego.",
  },
};

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
  const [name, setName] = useState("");
  const [wynik, setWynik] = useState<NumerologyResult | null>(null);
  const [raport, setRaport] = useState<RodzajRaportu>("portret");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rok = new Date().getFullYear();
    setWynik(numerology(date, name || undefined, "wedyjski", rok));
    odblokuj("numerologia");
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

  /** Wersja dla prognozy rocznej — dokłada policzone (nie zgadywane przez AI) liczby miesięcy osobistych. */
  const aiDataRok = useMemo(() => {
    if (!aiData || !wynik) return null;
    return {
      ...aiData,
      miesiaceOsobiste: personalMonths(wynik.personalYear).map((n, j) => ({ miesiac: MIESIACE[j], liczba: n })),
    };
  }, [aiData, wynik]);

  const kindWybrany = RAPORTY.find((r) => r.id === raport)!.kind;

  return (
    <div className="container section">
      <div className="fade-up" style={{ maxWidth: 340, margin: "0 auto 10px" }}><SceneNumerologia /></div>
      <h1 style={{ textAlign: "center" }}>Numerologia wedyjska</h1>
      <p className="section-sub">
        Indyjski system numerologii — każda liczba ma swoją planetę. Mulank (liczba urodzenia) i
        bhagyank (liczba przeznaczenia) liczymy zawsze z daty urodzenia; imię i nazwisko dodaje
        liczby ekspresji, duszy i osobowości, a całość domyka siatka Lo Shu.
      </p>

      <p style={{ textAlign: "center", marginTop: "-20px", marginBottom: 30 }}>
        <Link href="/godziny-lustrzane" className="muted" style={{ fontSize: "0.88rem" }}>
          Ciągle widzisz 11:11 albo 21:21? → sprawdź znaki czasu
        </Link>
      </p>

      <div className="numerologia-uklad">
        <div className="card">
          <p className="eyebrow" style={{ marginBottom: 12 }}>Rodzaj odczytu</p>
          <div className="bf-plec numerologia-raporty" role="radiogroup" aria-label="Rodzaj raportu numerologicznego">
            {RAPORTY.map((r) => (
              <button key={r.id} type="button" role="radio" aria-checked={raport === r.id}
                className={`bf-plec-opcja${raport === r.id ? " bf-plec-opcja-aktywna" : ""}`}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "14px 8px" }}
                onClick={() => setRaport(r.id)}>
                <r.Icon size={78} />
                {r.label}
              </button>
            ))}
          </div>
          <p className="muted" style={{ fontSize: "0.82rem", marginTop: 10 }}>{FORM_COPY[raport].hint}</p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ display: "grid", gap: 18, alignContent: "start" }}>
          <DateInput id="num-date" value={date} onChange={setDate} required label={FORM_COPY[raport].dateLabel} />
          <div>
            <label htmlFor="num-name">{FORM_COPY[raport].nameLabel}</label>
            <input id="num-name" type="text" placeholder={FORM_COPY[raport].namePlaceholder} value={name}
              onChange={(e) => setName(e.target.value)} />
          </div>
          <p className="muted" style={{ fontSize: "0.85rem", lineHeight: 1.55 }}>
            Liczymy wedyjską numerologię — mulank, bhagyank, planetę władającą i siatkę Lo Shu.
          </p>
          <button type="submit" className="btn btn-primary">Oblicz liczby</button>
        </form>
      </div>

      {wynik && (
        <div className="fade-up" style={{ marginTop: 48 }}>
          {/* karta liczb i relacja Mulank↔Bhagyank obok siebie, na tej samej, standardowej
              szerokości co reszta strony (siatka, predyspozycje, interpretacja) niżej —
              cała sekcja wyników ma teraz jedną spójną szerokość. */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))", gap: 20 }}>
            <div className="card" style={{ borderTop: "2px solid var(--sand)" }}>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--sand)", marginBottom: 3 }}>Numerologia wedyjska</p>
              <p className="muted" style={{ fontSize: "0.78rem", lineHeight: 1.5, marginBottom: 16 }}>
                Indyjski system — każda liczba ma planetę; mulank, bhagyank i siatka Lo Shu.
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

          {/* Lo Shu — pełny diagram z pinami pięciu liczb i opisami */}
          <div className="fade-up" style={{ marginTop: 32 }}>
            <SiatkaLiczb numerology={wynik} />
          </div>

          {/* predyspozycje i na co uważać — całościowo: data + wszystkie liczby osobiste, jedna wspólna karta */}
          <div className="card fade-up" style={{ marginTop: 24 }}>
            <PredyspozycjeLiczb numerology={wynik} />
            <NaCoUwazacLiczb numerology={wynik} />
          </div>

          {/* interpretacja AI */}
          <div style={{ marginTop: 32 }}>
            <h3 style={{ textAlign: "center", marginBottom: 20 }}>Interpretacja — {RAPORTY.find((r) => r.id === raport)!.label}</h3>
            <Interpretation
              kind={kindWybrany}
              data={raport === "rok" ? aiDataRok! : aiData!}
              label={`Numerologia wedyjska — ${RAPORTY.find((r) => r.id === raport)!.label}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
