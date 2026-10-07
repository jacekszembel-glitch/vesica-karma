"use client";

import { useMemo, useState } from "react";
import IlustracjaDloni from "./IlustracjaDloni";
import { PieczecOdslaniania } from "./Interpretation";
import {
  MIEJSCA_ZNAKOW, NAZWA_MARSA, czescMarsaZKlucza, NAZWY_LINII, RODZAJE_ZNAKOW_NAZWY, miejsceZKlucza,
  type LiniaDloni, type CzescMarsa, type MiejsceZnaku, type RodzajZnaku, type ZnakWlasny,
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
interface ZnakInw { reka: Reka; miejsce: MiejsceZnaku; znak: RodzajZnaku; pewnosc: "wyrazny" | "delikatny"; gdzie: string; czesc?: CzescMarsa }
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
/** Wzgórki w kolejności pytań; Mars dwa razy — górny (przy krawędzi) i dolny (przy kciuku) znaczą co innego. */
const WZGORKI: { miejsce: MiejsceZnaku; czesc?: CzescMarsa }[] = [
  { miejsce: "jupiter" }, { miejsce: "saturn" }, { miejsce: "sun" }, { miejsce: "mercury" }, { miejsce: "mars", czesc: "gorny" },
  { miejsce: "czworobok" }, { miejsce: "rahu" }, { miejsce: "mars", czesc: "dolny" }, { miejsce: "moon" }, { miejsce: "venus" }, { miejsce: "ketu" },
];
/** Co znaczy każdy z Marsów — pokazywane przy pytaniu. */
const OPIS_MARSA: Record<CzescMarsa, string> = {
  gorny: "Mars górny leży przy krawędzi dłoni, pod małym palcem, między linią serca a linią głowy. Klasycznie: odwaga moralna, wytrwałość, opanowanie pod presją.",
  dolny: "Mars dolny leży przy kciuku, nad wzgórkiem Wenus, wewnątrz łuku linii życia. Klasycznie: odwaga fizyczna, siła działania, umiejętność obrony.",
};
const nazwaWzgorka = (m: MiejsceZnaku, czesc?: CzescMarsa) => (m === "mars" && czesc ? NAZWA_MARSA[czesc] : nazwaMiejsca(m));
const ZNAKI_NA_WZGORKU = RODZAJE_ZNAKOW_NAZWY.filter((z) => z.id !== "krzyz_mistyczny");

/** Dodatek na rysunku dłoni przy pytaniu o cechę linii. */
export type DodatekRysunku = "rozwidlenie_zycia" | "dlugosc_zycia" | "rozwidlenie_glowy" | "opadanie_glowy" | "koniec_serca" | "koniec_losu" | "start_slonca" | "rozwidlenie_slonca";
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
  serca: [
    {
      id: "koniec", pytanie: "Gdzie kończy się linia serca?",
      opis: "Linia serca zaczyna się przy krawędzi dłoni pod małym palcem. Zobacz, dokąd dochodzi: nie u wszystkich biegnie przez całą dłoń — czasem kończy się już pod palcem środkowym (wzgórek Saturna).",
      opcje: [
        { id: "saturn", tekst: "Pod palcem środkowym" },
        { id: "miedzy", tekst: "Między środkowym a wskazującym" },
        { id: "jowisz", tekst: "Pod palcem wskazującym" },
        { id: "krawedz", tekst: "Przez całą dłoń" },
      ],
      wynik: {
        saturn: "krótka, kończy się pod wzgórkiem Saturna (klasycznie: uczucia praktyczne, bardziej skupione na sobie, namiętność)",
        miedzy: "kończy się między palcem środkowym a wskazującym (klasycznie: równowaga serca i rozsądku)",
        jowisz: "kończy się pod wzgórkiem Jowisza (klasycznie: idealizm w miłości, wysokie wymagania wobec uczuć)",
        krawedz: "biegnie przez całą dłoń do jej krawędzi (klasycznie: bardzo silne zaangażowanie uczuciowe)",
      },
      rysunek: "koniec_serca",
    },
  ],
  losu: [
    {
      id: "koniec", pytanie: "Gdzie kończy się linia losu?",
      opis: "Linia losu biegnie od dołu dłoni w górę, w stronę palca środkowego. Nie u wszystkich dochodzi do końca — zobacz, gdzie się zatrzymuje. W chiromancji jej wysokość odpowiada okresom życia: linia głowy to mniej więcej 35. rok, linia serca — około 50.",
      opcje: [
        { id: "glowa", tekst: "Na linii głowy" },
        { id: "miedzy", tekst: "Między linią głowy a serca" },
        { id: "serce", tekst: "Na linii serca" },
        { id: "saturn", tekst: "Dochodzi pod palec środkowy" },
        { id: "jowisz", tekst: "Skręca pod palec wskazujący" },
      ],
      wynik: {
        glowa: "kończy się na linii głowy (klasycznie: wyraźnie prowadzona droga do ok. 35. roku życia, potem kierunek wyznacza własna decyzja)",
        miedzy: "kończy się między linią głowy a serca (klasycznie: droga prowadzona mniej więcej do 35.–50. roku życia, później życie bardziej z wyboru niż z przeznaczenia)",
        serce: "kończy się na linii serca (klasycznie: droga prowadzona do ok. 50. roku życia; uczucia i relacje mogą zmienić jej bieg)",
        saturn: "dochodzi do wzgórka Saturna (klasycznie: wyraźna droga i obowiązek przez całe życie, aż do późnych lat)",
        jowisz: "skręca w stronę wzgórka Jowisza (klasycznie: ambicja, osiąganie celów, uznanie)",
      },
      rysunek: "koniec_losu",
    },
  ],
  slonca: [
    {
      id: "start", pytanie: "Skąd zaczyna się linia Słońca?",
      opis: "Linia Słońca zawsze dochodzi pod palec serdeczny (wzgórek Słońca), ale u każdego zaczyna się gdzie indziej — czasem to tylko krótka kreska nad linią serca. Zobacz, skąd startuje.",
      opcje: [
        { id: "wzgorek", tekst: "Tylko na wzgórku Słońca" },
        { id: "glowa", tekst: "Od linii głowy" },
        { id: "srodek", tekst: "Od środka dłoni" },
        { id: "dol", tekst: "Od dołu dłoni, przy nadgarstku" },
        { id: "ksiezyc", tekst: "Od wzgórka Księżyca" },
      ],
      wynik: {
        wzgorek: "tylko krótka linia na wzgórku Słońca, nad linią serca (klasycznie: uznanie i satysfakcja z własnej twórczości w dojrzałych latach)",
        glowa: "zaczyna się od linii głowy (klasycznie: sukces dzięki własnemu umysłowi i wysiłkowi, mniej więcej od średniego wieku)",
        srodek: "zaczyna się w środku dłoni (klasycznie: uznanie przychodzi z czasem, po drodze własnej pracy)",
        dol: "długa, od dołu dłoni (klasycznie: talent i uznanie towarzyszą przez całe życie)",
        ksiezyc: "zaczyna się od wzgórka Księżyca (klasycznie: uznanie dzięki innym ludziom, publiczności, wyobraźni)",
      },
      rysunek: "start_slonca",
    },
    {
      id: "rozwidlenie", pytanie: "Czy linia Słońca się rozwidla?",
      opis: "Przyjrzyj się obu końcom linii na wzgórku Słońca: górnemu, tuż pod palcem serdecznym, i dolnemu, nad linią serca. Rozwidlenie to miejsce, w którym linia rozdziela się na dwie (czasem trzy) odnogi.",
      opcje: [
        { id: "gora", tekst: "U góry, pod palcem" },
        { id: "dol", tekst: "U dołu, nad linią serca" },
        { id: "oba", tekst: "Na obu końcach" },
        { id: "nie", tekst: "Nie rozwidla się" },
      ],
      wynik: {
        gora: "rozwidlona u góry, pod palcem serdecznym (klasycznie: talent rozwija się w kilku kierunkach naraz; trzy odnogi — tzw. trójząb — to znak wyjątkowego uznania)",
        dol: "rozwidlona u dołu, nad linią serca (klasycznie: talent czerpie z dwóch źródeł — dwie drogi prowadzą do tego samego uznania)",
        oba: "rozwidlona na obu końcach (klasycznie: talent z dwóch źródeł, rozwijany w kilku kierunkach)",
        nie: "bez rozwidleń",
      },
      rysunek: "rozwidlenie_slonca",
    },
  ],
  glowy: [
    {
      id: "opadanie", pytanie: "Czy linia głowy opada?",
      opis: "Zobacz, dokąd biegnie pod koniec. Prosta idzie poziomo w poprzek dłoni; opadająca schodzi w dół, w stronę wzgórka Księżyca przy krawędzi dłoni. Klasycznie: prosta — umysł praktyczny i logiczny, opadająca — wyobraźnia, twórczość i intuicja.",
      opcje: [{ id: "prosta", tekst: "Prosta" }, { id: "lekko", tekst: "Lekko opada" }, { id: "mocno", tekst: "Mocno opada" }],
      wynik: {
        prosta: "prosta, pozioma (klasycznie: umysł praktyczny, logiczny)",
        lekko: "lekko opadająca (klasycznie: równowaga logiki i wyobraźni)",
        mocno: "mocno opadająca ku wzgórkowi Księżyca (klasycznie: silna wyobraźnia, twórczość, intuicja)",
      },
      rysunek: "opadanie_glowy",
    },
    {
      id: "rozwidlenie", pytanie: "Czy linia głowy rozwidla się na końcu?",
      opis: "Na końcu linia rozdziela się na dwie odnogi — jedna biegnie dalej prosto, druga schodzi w dół. Klasycznie to „pióro pisarza”: dar słowa, umysł, który widzi sprawy z dwóch stron.",
      opcje: [{ id: "tak", tekst: "Mam to" }, { id: "nie", tekst: "Nie mam" }],
      wynik: { tak: "rozwidlona na końcu (klasycznie: „pióro pisarza”, dar słowa)", nie: "bez rozwidlenia na końcu" },
      rysunek: "rozwidlenie_glowy",
    },
  ],
};

type Pytanie =
  | { typ: "linia"; reka: Reka; linia: LiniaDloni; ai?: LiniaInw }
  | { typ: "cecha"; reka: Reka; linia: LiniaDloni; cecha: CechaLinii }
  | { typ: "krzyz"; reka: Reka; ai?: ZnakInw }
  | { typ: "wzgorek"; reka: Reka; miejsce: MiejsceZnaku; czesc?: CzescMarsa; ai: ZnakInw[] };
type OdpLinii = "wyrazna" | "slaba" | "nie" | "niewiem";
type OdpKrzyza = "mam" | "nie" | "niewiem";
/** Odpowiedź przy wzgórku: zaznaczone znaki albo „nie wiem”. */
type OdpWzgorka = RodzajZnaku[] | "niewiem";
/** Odpowiedź na cechę linii: id opcji albo „niewiem”. */
type Odp = OdpLinii | OdpKrzyza | OdpWzgorka | string;

const klucz = (p: Pytanie) => `${p.reka}:${p.typ}:${p.typ === "linia" ? p.linia : p.typ === "cecha" ? `${p.linia}:${p.cecha.id}` : p.typ === "wzgorek" ? `${p.miejsce}${p.czesc ? `_${p.czesc}` : ""}` : "krzyz"}`;
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
    return miejsce && znak ? [{ reka: reka(z.reka), miejsce, znak, pewnosc: z.pewnosc === "delikatny" ? "delikatny" as const : "wyrazny" as const, gdzie: String(z.gdzie ?? ""), czesc: czescMarsaZKlucza(String(z.wzgorek)) }] : [];
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
    for (const { miejsce, czesc } of WZGORKI) {
      // znak AI na Marsie bez podanej części pokazujemy przy obu Marsach (osoba wskaże, gdzie go ma)
      lista.push({ typ: "wzgorek", reka, miejsce, czesc, ai: znaki.filter((z) => z.reka === reka && z.miejsce === miejsce && z.znak !== "krzyz_mistyczny" && (!czesc || !z.czesc || z.czesc === czesc)) });
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
  // ekran przejścia: ręka wiodąca opisana, zanim zaczną się pytania o bierną
  const [wiodacaZamknieta, setWiodacaZamknieta] = useState(false);

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
    if (lista[Math.max(0, nr - 1)]?.reka === "wiodaca") setWiodacaZamknieta(false);
    const poprz = Math.max(0, nr - 1);
    setNr(poprz);
    const o = odp[klucz(lista[poprz])];
    setWybrane(Array.isArray(o) ? o : []);
  }

  function zakoncz() {
    const znaki: string[] = [], linie: string[] = [], brak: string[] = [];
    const wlasne: ZnakWlasny[] = [];
    // znak AI na Marsie bez części jest pytany przy obu Marsach — liczymy go raz
    const uzyteAI = new Set<ZnakInw>();
    const opisZnaku = (z: ZnakInw, dopisek: string) =>
      `${nazwaZnaku(z.znak)} — ${nazwaWzgorka(z.miejsce, z.czesc)}, ${nazwaReki(z.reka)}, ${z.pewnosc === "delikatny" ? "delikatny" : "wyraźny"}${z.gdzie ? ` (${z.gdzie})` : ""} — ${dopisek}`;
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
          for (const z of p.ai) if (!uzyteAI.has(z)) { uzyteAI.add(z); znaki.push(opisZnaku(z, "osoba nie jest pewna")); }
        } else if (Array.isArray(o)) {
          for (const zn of o) {
            const ai = p.ai.find((z) => z.znak === zn);
            if (ai && !uzyteAI.has(ai)) { uzyteAI.add(ai); znaki.push(opisZnaku({ ...ai, czesc: ai.czesc ?? p.czesc }, "osoba potwierdza")); }
            else if (!ai) wlasne.push({ reka: p.reka, miejsce: p.miejsce, znak: zn, ...(p.czesc ? { czesc: p.czesc } : {}) });
          }
        }
      }
    }
    onZnakiWlasne(wlasne.slice(0, 12));
    onDalej({ znaki, linie, brak, ogledzinyTekst: wynik!.ogledzinyTekst });
  }

  /** To, co osoba zaznaczyła — do podsumowań (całości albo jednej ręki). */
  const potwierdzoneDla = (reka?: Reka) => lista.filter((p) => !reka || p.reka === reka).flatMap((p) => {
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
      return Array.isArray(o) ? o.map((z) => `${nazwaZnaku(z)} — ${nazwaWzgorka(p.miejsce, p.czesc)}, ${r}`) : [];
    });

  if (koniec) {
    const potwierdzone = potwierdzoneDla();
    return (
      <div className="prz">
        <p className="prz-postep">Obie dłonie opisane</p>
        <p className="prz-etap">Gotowe — przeszliśmy razem obie dłonie</p>
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

  // koniec ręki wiodącej — wyraźne zamknięcie, zanim zaczną się pytania o bierną
  if (p.reka === "bierna" && nrWRece === 1 && !wiodacaZamknieta) {
    const wiodace = potwierdzoneDla("wiodaca").map((t) => t.replace(/ — ręka wiodąca$/, "").replace(/, ręka wiodąca$/, ""));
    return (
      <div className="prz">
        <p className="prz-postep">Ręka wiodąca ({nazwyRak.wiodaca}) · opisana</p>
        <div className="prz-pasek"><span style={{ width: `${(nr / lista.length) * 100}%` }} /></div>
        <p className="prz-etap">✦ Ręka wiodąca opisana</p>
        <p className="prz-etap-opis">
          Twoja ręka wiodąca — {nazwyRak.wiodaca}, ta, którą piszesz — jest już cała przejrzana. Pokazuje to, co
          świadomie budujesz i robisz ze swoim życiem. Teraz przejdziemy w ten sam sposób przez rękę bierną
          ({nazwyRak.bierna}): ona mówi o tym, z czym przychodzisz na świat — o wrodzonym potencjale.
        </p>
        {wiodace.length > 0 && (
          <>
            <p className="hs-tytul" style={{ textAlign: "center", marginTop: 18 }}>Na ręce wiodącej</p>
            <ul className="prz-podsumowanie">{wiodace.map((t) => <li key={t}>{t}</li>)}</ul>
          </>
        )}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button className="btn btn-primary" onClick={() => setWiodacaZamknieta(true)} style={{ padding: "14px 36px", fontSize: "1rem" }}>
            Przejdź do ręki biernej
          </button>
          <p style={{ marginTop: 10 }}>
            <button type="button" className="hs-usun" onClick={cofnij}>← wróć do ostatniego pytania</button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="prz">
      <p className="prz-postep">
        {p.reka === "wiodaca" ? "Ręka wiodąca" : "Ręka bierna"} ({nazwyRak[p.reka]}) · pytanie {nrWRece} z {wRece.length}
      </p>
      <div className="prz-pasek"><span style={{ width: `${(nr / lista.length) * 100}%` }} /></div>

      <div className="prz-uklad">
        <div className="prz-rysunek">
          <IlustracjaDloni lewa={nazwyRak[p.reka] === "lewa"}
            linia={p.typ === "linia" || p.typ === "cecha" ? p.linia : null}
            dodatek={p.typ === "cecha" ? p.cecha.rysunek ?? null : null}
            aktywne={p.typ === "wzgorek" ? p.miejsce : p.typ === "krzyz" ? "czworobok" : null}
            czescMarsa={p.typ === "wzgorek" ? p.czesc ?? null : null} />
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
              <h3>{nazwaWzgorka(p.miejsce, p.czesc).replace(/^./, (c) => c.toUpperCase())}</h3>
              {p.czesc && <p className="prz-opis">{OPIS_MARSA[p.czesc]}</p>}
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
