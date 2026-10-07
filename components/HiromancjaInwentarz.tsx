"use client";

import { useMemo, useState } from "react";
import IlustracjaDloni from "./IlustracjaDloni";
import { PieczecOdslaniania } from "./Interpretation";
import {
  MIEJSCA_ZNAKOW, NAZWY_LINII, RODZAJE_ZNAKOW_NAZWY, miejsceZKlucza,
  type LiniaDloni, type MiejsceZnaku, type RodzajZnaku, type ZnakWlasny,
} from "@/lib/astro/zgodnosc";

/**
 * KROK 1 — przewodnik po dłoniach. AI ogląda zdjęcia (/api/hiromancja-ogledziny) i wypisuje
 * tylko to, co widzi. Potem osoba odpowiada na pytania po kolei: najpierw ręka wiodąca, potem
 * bierna; przy każdym pytaniu na rysunku świeci linia albo wzgórek, którego dotyczy, a obok
 * jest to, co zobaczyło AI. Osoba zaznacza „Mam to” — nic nie jest zaznaczone za nią.
 * Wynik: potwierdzona lista (do pełnego odczytu), linie, których nie ma, i znaki zgłoszone
 * przez osobę, których AI nie zobaczyło (źródło „Ty”).
 */

type Reka = "wiodaca" | "bierna";
interface ZnakInw { reka: Reka; miejsce: MiejsceZnaku; znak: RodzajZnaku; pewnosc: "wyrazny" | "delikatny"; gdzie: string }
interface LiniaInw { reka: Reka; linia: LiniaDloni; stan: "wyrazna" | "odcinkowa" | "slaba"; gdzie: string }

export interface InwentarzPotwierdzony {
  /** Pozycje jako tekst — tak trafiają do pełnego odczytu. */
  znaki: string[];
  linie: string[];
  /** Linie, których osoba nie ma. */
  brak: string[];
  ogledzinyTekst: string;
}

interface DaneReki { imageBase64: string; imageMediaType: string; strefy?: { opis: string; imageBase64: string }[] }

const STAN: Record<LiniaInw["stan"], string> = { wyrazna: "wyraźna", odcinkowa: "odcinkami", slaba: "słaba" };
const nazwaMiejsca = (m: MiejsceZnaku) => MIEJSCA_ZNAKOW.find((x) => x.id === m)?.nazwa ?? m;
const nazwaZnaku = (z: RodzajZnaku) => RODZAJE_ZNAKOW_NAZWY.find((x) => x.id === z)?.nazwa ?? z;
const nazwaReki = (r: Reka) => (r === "wiodaca" ? "ręka wiodąca" : "ręka bierna");

/** Główne linie — pytamy o nie zawsze; inne tylko, gdy AI je wypisało. */
const LINIE_GLOWNE: LiniaDloni[] = ["zycia", "glowy", "serca", "losu", "slonca", "merkurego"];
const OPIS_LINII: Partial<Record<LiniaDloni, string>> = {
  zycia: "Okrąża nasadę kciuka, od brzegu dłoni między kciukiem a palcem wskazującym w stronę nadgarstka.",
  glowy: "Biegnie w poprzek dłoni, od tego samego miejsca co linia życia w stronę krawędzi dłoni.",
  serca: "Najwyższa pozioma linia — pod palcami, od krawędzi dłoni w stronę palca wskazującego lub środkowego.",
  losu: "Pionowa linia przez środek dłoni, od nadgarstka w stronę palca środkowego. Może być w kawałkach.",
  slonca: "Pionowa linia pod palcem serdecznym — czasem tylko krótki odcinek tuż pod palcem.",
  merkurego: "Ukośna linia od dołu dłoni w stronę małego palca.",
};
/** Biernik nazw linii — „Czy masz linię losu?”. */
const BIERNIK_LINII: Record<LiniaDloni, string> = {
  zycia: "linię życia", glowy: "linię głowy", serca: "linię serca", losu: "linię losu", slonca: "linię Słońca",
  merkurego: "linię Merkurego", intuicji: "linię intuicji", podrozy: "linie podróży", relacji: "linie relacji",
  pas_wenus: "pas Wenus", pierscien_salomona: "pierścień Salomona", marsa: "linię Marsa (siostrzaną)",
};
/** Wzgórki w kolejności pytań. */
const WZGORKI: MiejsceZnaku[] = ["jupiter", "saturn", "sun", "mercury", "mars", "czworobok", "rahu", "moon", "venus", "ketu"];
const ZNAKI_NA_WZGORKU = RODZAJE_ZNAKOW_NAZWY.filter((z) => z.id !== "krzyz_mistyczny");

/** Dodatek na rysunku dłoni przy pytaniu o cechę linii. */
export type DodatekRysunku = "rozwidlenie_zycia" | "dlugosc_zycia";
interface CechaLinii {
  id: string;
  pytanie: string;
  opis: string;
  opcje: { id: string; tekst: string }[];
  /** Jak opisać odpowiedź w liście dla odczytu. */
  wynik: Record<string, string>;
  rysunek?: DodatekRysunku;
}
/** Pytania dodatkowe o linię — zadawane tylko, gdy osoba ją ma. Kolejne cechy dopisujemy tutaj. */
const CECHY_LINII: Partial<Record<LiniaDloni, CechaLinii[]>> = {
  zycia: [
    {
      id: "dlugosc", pytanie: "Jak długa jest linia życia?",
      opis: "Zobacz, gdzie się kończy. Długa schodzi aż do nadgarstka i okrąża całą nasadę kciuka; krótka kończy się mniej więcej w połowie dłoni.",
      opcje: [{ id: "dluga", tekst: "Długa" }, { id: "srednia", tekst: "Średnia" }, { id: "krotka", tekst: "Krótka" }],
      wynik: { dluga: "długa", srednia: "średniej długości", krotka: "krótka" },
      rysunek: "dlugosc_zycia",
    },
    {
      id: "rozwidlenie", pytanie: "Czy linia życia rozwidla się na końcu?",
      opis: "Przy nadgarstku linia rozdziela się na dwie odnogi — jedna często odchodzi w stronę wzgórka Księżyca. Klasycznie to znak zmiany miejsca zamieszkania, życia z dala od miejsca urodzenia.",
      opcje: [{ id: "tak", tekst: "Mam to" }, { id: "nie", tekst: "Nie mam" }],
      wynik: { tak: "rozwidlona na końcu (klasycznie: zmiana miejsca zamieszkania)", nie: "bez rozwidlenia na końcu" },
      rysunek: "rozwidlenie_zycia",
    },
  ],
};

type Pytanie =
  | { typ: "linia"; reka: Reka; linia: LiniaDloni; ai?: LiniaInw }
  | { typ: "cecha"; reka: Reka; linia: LiniaDloni; cecha: CechaLinii }
  | { typ: "krzyz"; reka: Reka; ai?: ZnakInw }
  | { typ: "wzgorek"; reka: Reka; miejsce: MiejsceZnaku; ai: ZnakInw[] };
type OdpLinii = "wyrazna" | "slaba" | "nie" | "niewiem";
type OdpKrzyza = "mam" | "nie" | "niewiem";
/** Odpowiedź przy wzgórku: zaznaczone znaki albo „nie wiem”. */
type OdpWzgorka = RodzajZnaku[] | "niewiem";
/** Odpowiedź na cechę linii: id opcji albo „niewiem”. */
type Odp = OdpLinii | OdpKrzyza | OdpWzgorka | string;

const klucz = (p: Pytanie) => `${p.reka}:${p.typ}:${p.typ === "linia" ? p.linia : p.typ === "cecha" ? `${p.linia}:${p.cecha.id}` : p.typ === "wzgorek" ? p.miejsce : "krzyz"}`;
const kluczLinii = (reka: Reka, linia: LiniaDloni) => `${reka}:linia:${linia}`;
const maLinie = (o: Odp | undefined) => o === "wyrazna" || o === "slaba";
/** Pytania widoczne przy danych odpowiedziach — cechy linii tylko, gdy osoba linię ma. */
const widoczne = (lista: Pytanie[], odp: Record<string, Odp>) =>
  lista.filter((q) => q.typ !== "cecha" || maLinie(odp[kluczLinii(q.reka, q.linia)]));

function zOdpowiedzi(znaki: unknown[], linie: unknown[]): { znaki: ZnakInw[]; linie: LiniaInw[] } {
  const reka = (r: unknown): Reka => (r === "bierna" ? "bierna" : "wiodaca");
  const zn = znaki.flatMap((x) => {
    const z = x as Record<string, string>;
    const miejsce = miejsceZKlucza(String(z.wzgorek));
    const znak = RODZAJE_ZNAKOW_NAZWY.find((r) => r.id === z.znak)?.id;
    return miejsce && znak ? [{ reka: reka(z.reka), miejsce, znak, pewnosc: z.pewnosc === "delikatny" ? "delikatny" as const : "wyrazny" as const, gdzie: String(z.gdzie ?? "") }] : [];
  });
  const li = linie.flatMap((x) => {
    const l = x as Record<string, string>;
    const linia = l.linia as LiniaDloni;
    const stan = l.stan === "odcinkowa" || l.stan === "slaba" ? l.stan : "wyrazna";
    return NAZWY_LINII[linia] ? [{ reka: reka(l.reka), linia, stan: stan as LiniaInw["stan"], gdzie: String(l.gdzie ?? "") }] : [];
  });
  return { znaki: zn, linie: li };
}

function pytania(znaki: ZnakInw[], linie: LiniaInw[]): Pytanie[] {
  const lista: Pytanie[] = [];
  for (const reka of ["wiodaca", "bierna"] as Reka[]) {
    const liReki = linie.filter((l) => l.reka === reka);
    const dodatkowe = [...new Set(liReki.map((l) => l.linia).filter((l) => !LINIE_GLOWNE.includes(l)))];
    for (const linia of [...LINIE_GLOWNE, ...dodatkowe]) {
      lista.push({ typ: "linia", reka, linia, ai: liReki.find((l) => l.linia === linia) });
      for (const cecha of CECHY_LINII[linia] ?? []) lista.push({ typ: "cecha", reka, linia, cecha });
    }
    lista.push({ typ: "krzyz", reka, ai: znaki.find((z) => z.reka === reka && z.znak === "krzyz_mistyczny") });
    for (const miejsce of WZGORKI) {
      lista.push({ typ: "wzgorek", reka, miejsce, ai: znaki.filter((z) => z.reka === reka && z.miejsce === miejsce && z.znak !== "krzyz_mistyczny") });
    }
  }
  return lista;
}

export default function HiromancjaInwentarz({ wiodaca, bierna, nazwyRak, onZnakiWlasne, onDalej, testowe }: {
  wiodaca: DaneReki;
  bierna: DaneReki;
  /** Np. { wiodaca: "prawa", bierna: "lewa" } — do nagłówków i odbicia rysunku. */
  nazwyRak: Record<Reka, string>;
  /** Znaki zaznaczone przez osobę, których AI nie zobaczyło — idą do odczytu jako jej obserwacje. */
  onZnakiWlasne: (z: ZnakWlasny[]) => void;
  onDalej: (inw: InwentarzPotwierdzony) => void;
  /** Tylko localhost (?przewodnik): gotowe znaleziska AI — przewodnik bez zdjęć i bez płatnych oględzin. */
  testowe?: { znaki: unknown[]; linie: unknown[] };
}) {
  const [busy, setBusy] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const [wynik, setWynik] = useState<{ znaki: ZnakInw[]; linie: LiniaInw[]; ogledzinyTekst: string } | null>(
    () => (testowe ? { ...zOdpowiedzi(testowe.znaki, testowe.linie), ogledzinyTekst: "" } : null),
  );
  const [nr, setNr] = useState(0);
  const [odp, setOdp] = useState<Record<string, Odp>>({});
  // zaznaczenia przy bieżącym wzgórku, zanim osoba kliknie „Dalej”
  const [wybrane, setWybrane] = useState<RodzajZnaku[]>([]);

  const wszystkie = useMemo(() => (wynik ? pytania(wynik.znaki, wynik.linie) : []), [wynik]);
  const lista = widoczne(wszystkie, odp);

  async function obejrzyj() {
    setBusy(true); setBlad(null); setWynik(null);
    try {
      const res = await fetch("/api/hiromancja-ogledziny", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wiodaca, bierna }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `Nie udało się obejrzeć dłoni (kod ${res.status}).`);
      setWynik({ ...zOdpowiedzi(j.znaki ?? [], j.linie ?? []), ogledzinyTekst: String(j.ogledzinyTekst ?? "") });
      setNr(0); setOdp({}); setWybrane([]);
    } catch (e) {
      setBlad((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!wynik) {
    return (
      <div style={{ textAlign: "center" }}>
        <p style={{ maxWidth: 520, margin: "0 auto 18px", lineHeight: 1.6 }}>
          Najpierw AI obejrzy Twoje dłonie i zanotuje tylko to, co na nich widzi. Potem przejdziemy
          razem po dłoni pytanie po pytaniu — na rysunku zobaczysz, gdzie patrzeć.
        </p>
        {busy ? (
          <PieczecOdslaniania tytul="Oglądam Twoje dłonie…" mysli={["Każde zbliżenie oglądam osobno, pod lupą.", "Szukam znaków na wzgórkach i linii — bez interpretacji.", "Za chwilę zaczniemy pytania."]} podpis="oględziny trwają około 1–2 minut" />
        ) : (
          <button className="btn btn-primary" onClick={() => void obejrzyj()} style={{ padding: "14px 36px", fontSize: "1rem" }}>
            {blad ? "Spróbuj ponownie" : "Obejrzyj dłonie"}
          </button>
        )}
        {blad && <p style={{ color: "var(--warn)", marginTop: 12 }}>{blad}</p>}
      </div>
    );
  }

  const koniec = nr >= lista.length;

  function odpowiedz(o: Odp) {
    const p = lista[nr];
    const nowe = { ...odp, [klucz(p)]: o };
    setOdp(nowe);
    const nast = nr + 1;
    setNr(nast);
    const np = widoczne(wszystkie, nowe)[nast];
    const poprz = np ? odp[klucz(np)] : undefined;
    setWybrane(Array.isArray(poprz) ? poprz : []);
  }

  function cofnij() {
    const poprz = Math.max(0, nr - 1);
    setNr(poprz);
    const o = odp[klucz(lista[poprz])];
    setWybrane(Array.isArray(o) ? o : []);
  }

  function zakoncz() {
    const znaki: string[] = [], linie: string[] = [], brak: string[] = [];
    const wlasne: ZnakWlasny[] = [];
    const opisZnaku = (z: ZnakInw, dopisek: string) =>
      `${nazwaZnaku(z.znak)} — ${nazwaMiejsca(z.miejsce)}, ${nazwaReki(z.reka)}, ${z.pewnosc === "delikatny" ? "delikatny" : "wyraźny"}${z.gdzie ? ` (${z.gdzie})` : ""} — ${dopisek}`;
    for (const p of lista) {
      const o = odp[klucz(p)];
      if (p.typ === "cecha") continue; // dopisywane do opisu linii niżej
      if (p.typ === "linia") {
        const nazwa = `${NAZWY_LINII[p.linia]}, ${nazwaReki(p.reka)}`;
        if (o === "wyrazna" || o === "slaba") {
          const cechy = lista.filter((q): q is Extract<Pytanie, { typ: "cecha" }> => q.typ === "cecha" && q.reka === p.reka && q.linia === p.linia)
            .map((q) => q.cecha.wynik[String(odp[klucz(q)])]).filter(Boolean);
          const stan = (o === "wyrazna" ? "wyraźna" : "słaba lub odcinkami") + (cechy.length ? `; ${cechy.join("; ")}` : "");
          linie.push(p.ai
            ? `${nazwa} — ${stan} (osoba potwierdza; AI: ${STAN[p.ai.stan]}${p.ai.gdzie ? `, ${p.ai.gdzie}` : ""})`
            : `${nazwa} — ${stan} (osoba widzi ją na swojej dłoni; AI jej nie wypisało)`);
        } else if (o === "nie") {
          brak.push(nazwa);
        } else if (p.ai) {
          linie.push(`${nazwa} — ${STAN[p.ai.stan]}${p.ai.gdzie ? ` (${p.ai.gdzie})` : ""} — osoba nie jest pewna`);
        }
      } else if (p.typ === "krzyz") {
        if (o === "mam") {
          if (p.ai) znaki.push(opisZnaku(p.ai, "osoba potwierdza"));
          else wlasne.push({ reka: p.reka, miejsce: "czworobok", znak: "krzyz_mistyczny" });
        } else if (o === "niewiem" && p.ai) znaki.push(opisZnaku(p.ai, "osoba nie jest pewna"));
      } else {
        if (o === "niewiem") {
          for (const z of p.ai) znaki.push(opisZnaku(z, "osoba nie jest pewna"));
        } else if (Array.isArray(o)) {
          for (const zn of o) {
            const ai = p.ai.find((z) => z.znak === zn);
            if (ai) znaki.push(opisZnaku(ai, "osoba potwierdza"));
            else wlasne.push({ reka: p.reka, miejsce: p.miejsce, znak: zn });
          }
        }
      }
    }
    onZnakiWlasne(wlasne.slice(0, 12));
    onDalej({ znaki, linie, brak, ogledzinyTekst: wynik!.ogledzinyTekst });
  }

  if (koniec) {
    const potwierdzone = lista.flatMap((p) => {
      const o = odp[klucz(p)];
      const r = nazwaReki(p.reka);
      if (p.typ === "cecha") return [];
      if (p.typ === "linia") {
        if (!maLinie(o)) return [];
        const cechy = lista.filter((q): q is Extract<Pytanie, { typ: "cecha" }> => q.typ === "cecha" && q.reka === p.reka && q.linia === p.linia)
          .map((q) => q.cecha.wynik[String(odp[klucz(q)])]).filter(Boolean);
        return [`${NAZWY_LINII[p.linia]} (${o === "wyrazna" ? "wyraźna" : "słaba"}${cechy.length ? `; ${cechy.join("; ")}` : ""}) — ${r}`];
      }
      if (p.typ === "krzyz") return o === "mam" ? [`krzyż mistyczny — ${r}`] : [];
      return Array.isArray(o) ? o.map((z) => `${nazwaZnaku(z)} — ${nazwaMiejsca(p.miejsce)}, ${r}`) : [];
    });
    return (
      <div className="prz">
        <p className="prz-postep">Gotowe — wszystkie pytania za Tobą</p>
        <p className="hs-tytul" style={{ textAlign: "center" }}>Na Twoich dłoniach</p>
        {potwierdzone.length === 0 ? <p className="hs-instrukcja" style={{ textAlign: "center" }}>Nic nie zostało zaznaczone.</p> : (
          <ul className="prz-podsumowanie">{potwierdzone.map((t) => <li key={t}>{t}</li>)}</ul>
        )}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button className="btn btn-primary" onClick={zakoncz} style={{ padding: "14px 36px", fontSize: "1rem" }}>
            Odczytaj dłonie
          </button>
          <p style={{ marginTop: 10 }}>
            <button type="button" className="hs-usun" onClick={cofnij}>← wróć do pytań</button>
          </p>
        </div>
      </div>
    );
  }

  const p = lista[nr];
  const wRece = lista.filter((q) => q.reka === p.reka);
  const nrWRece = wRece.indexOf(p) + 1;
  const pierwszeBiernej = p.reka === "bierna" && nrWRece === 1;

  return (
    <div className="prz">
      <p className="prz-postep">
        {p.reka === "wiodaca" ? "Ręka wiodąca" : "Ręka bierna"} ({nazwyRak[p.reka]}) · pytanie {nrWRece} z {wRece.length}
      </p>
      <div className="prz-pasek"><span style={{ width: `${(nr / lista.length) * 100}%` }} /></div>
      {pierwszeBiernej && <p className="prz-zmiana">Ręka wiodąca gotowa. Teraz ręka bierna — {nazwyRak.bierna} dłoń.</p>}

      <div className="prz-uklad">
        <div className="prz-rysunek">
          <IlustracjaDloni lewa={nazwyRak[p.reka] === "lewa"}
            linia={p.typ === "linia" || p.typ === "cecha" ? p.linia : null}
            dodatek={p.typ === "cecha" ? p.cecha.rysunek ?? null : null}
            aktywne={p.typ === "wzgorek" ? p.miejsce : p.typ === "krzyz" ? "czworobok" : null} />
          <p className="hs-instrukcja" style={{ textAlign: "center" }}>{nazwyRak[p.reka] === "lewa" ? "Lewa" : "Prawa"} dłoń od wewnątrz</p>
        </div>

        <div className="prz-pytanie" key={klucz(p)}>
          {p.typ === "linia" && (
            <>
              <h3>Czy masz {BIERNIK_LINII[p.linia]}?</h3>
              {OPIS_LINII[p.linia] && <p className="prz-opis">{OPIS_LINII[p.linia]}</p>}
              <p className="prz-ai">{p.ai ? <>AI widzi: <strong>{STAN[p.ai.stan]}</strong>{p.ai.gdzie && ` — ${p.ai.gdzie}`}</> : "AI jej nie wypisało — sprawdź na swojej dłoni."}</p>
              <div className="prz-odpowiedzi">
                <button type="button" className="prz-btn prz-btn-mam" onClick={() => odpowiedz("wyrazna")}>Mam — wyraźną</button>
                <button type="button" className="prz-btn prz-btn-mam" onClick={() => odpowiedz("slaba")}>Mam — słabą lub w kawałkach</button>
                <button type="button" className="prz-btn" onClick={() => odpowiedz("nie")}>Nie mam</button>
                <button type="button" className="prz-btn prz-btn-cichy" onClick={() => odpowiedz("niewiem")}>Nie wiem</button>
              </div>
            </>
          )}
          {p.typ === "cecha" && (
            <>
              <h3>{p.cecha.pytanie}</h3>
              <p className="prz-opis">{p.cecha.opis}</p>
              <div className="prz-odpowiedzi">
                {p.cecha.opcje.map((op) => (
                  <button key={op.id} type="button" className={`prz-btn${op.id !== "nie" ? " prz-btn-mam" : ""}`} onClick={() => odpowiedz(op.id)}>{op.tekst}</button>
                ))}
                <button type="button" className="prz-btn prz-btn-cichy" onClick={() => odpowiedz("niewiem")}>Nie wiem</button>
              </div>
            </>
          )}
          {p.typ === "krzyz" && (
            <>
              <h3>Czy masz krzyż mistyczny?</h3>
              <p className="prz-opis">Wyraźny X albo krzyżyk w czworoboku — między linią serca a linią głowy, zwykle pod palcem środkowym.</p>
              <p className="prz-ai">{p.ai ? <>AI widzi: <strong>krzyż mistyczny{p.ai.pewnosc === "delikatny" ? ", delikatny" : ""}</strong>{p.ai.gdzie && ` — ${p.ai.gdzie}`}</> : "AI go nie zauważyło — sprawdź na swojej dłoni."}</p>
              <div className="prz-odpowiedzi">
                <button type="button" className="prz-btn prz-btn-mam" onClick={() => odpowiedz("mam")}>Mam to</button>
                <button type="button" className="prz-btn" onClick={() => odpowiedz("nie")}>Nie mam</button>
                <button type="button" className="prz-btn prz-btn-cichy" onClick={() => odpowiedz("niewiem")}>Nie wiem</button>
              </div>
            </>
          )}
          {p.typ === "wzgorek" && (
            <>
              <h3>{nazwaMiejsca(p.miejsce).replace(/^./, (c) => c.toUpperCase())}</h3>
              <p className="prz-opis">Czy widzisz tu któryś z tych znaków? Zaznacz wszystkie, które masz.</p>
              {p.ai.length > 0 && (
                <p className="prz-ai">AI widzi: {p.ai.map((z, i) => (
                  <span key={i}>{i > 0 && "; "}<strong>{nazwaZnaku(z.znak)}</strong>{z.pewnosc === "delikatny" ? " (delikatny)" : ""}{z.gdzie && ` — ${z.gdzie}`}</span>
                ))}</p>
              )}
              <div className="prz-znaki">
                {ZNAKI_NA_WZGORKU.map((z) => {
                  const zaz = wybrane.includes(z.id);
                  const ai = p.ai.some((a) => a.znak === z.id);
                  return (
                    <button key={z.id} type="button" className={`prz-znak${zaz ? " prz-znak-zaz" : ""}`} aria-pressed={zaz}
                      onClick={() => setWybrane((w) => (zaz ? w.filter((x) => x !== z.id) : [...w, z.id]))}>
                      {zaz ? "✓ " : ""}{z.nazwa}{ai && <span className="prz-znak-ai">AI</span>}
                    </button>
                  );
                })}
              </div>
              <div className="prz-odpowiedzi">
                {wybrane.length > 0
                  ? <button type="button" className="prz-btn prz-btn-mam" onClick={() => odpowiedz(wybrane)}>Mam to — dalej</button>
                  : <button type="button" className="prz-btn" onClick={() => odpowiedz([])}>Nic tu nie mam</button>}
                <button type="button" className="prz-btn prz-btn-cichy" onClick={() => odpowiedz("niewiem")}>Nie wiem</button>
              </div>
            </>
          )}
          {nr > 0 && (
            <p style={{ marginTop: 14 }}>
              <button type="button" className="hs-usun" onClick={cofnij}>← poprzednie pytanie</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
