import type { PlanetId } from "./constants";
import { PLANET_ORDER, RASIS } from "./constants";
import type { VedicChart } from "./chart";
import { dziedzinyTalentu, type DziedzinaTalentu } from "./dziedzinyTalentu";
import { ROZKLADY_TALENTU } from "./srednieTalentu";
import { procentNizej } from "./srednieBilansu";
import type { StanWskazania, SystemTematu, TematWspolny } from "./tematy";

/**
 * SPÓJNOŚĆ TRZECH SYSTEMÓW — trzy kroki, jak przy każdym materiale dowodowym:
 *  1. czy systemy mówią to samo — także zgodnie „na nie” (trzy razy brak sygnału);
 *  2. czego dotyczą zgodności i z jaką siłą;
 *  3. co z tego wynika: gdzie i jak (skupisko planet), jakie talenty i czy inne systemy je potwierdzają.
 *
 * Zgodność „na nie” liczy się, ale z poprawką na przypadek: brak sygnału trafia się często,
 * więc trzy zera to słabszy dowód niż trzy „tak”. Szansę przypadku liczymy z rozkładu ocen
 * każdego systemu w tym samym zestawie tematów (jak współczynnik kappa).
 */

export const SYSTEMY: SystemTematu[] = ["kosmogram", "dlon", "numerologia"];

/** Wartość wskazania: tak = 1, częściowo = ½, nie = 0; bez danych = null. */
export function wartosc(stan: StanWskazania): number | null {
  return stan === "tak" ? 1 : stan === "czesciowo" ? 0.5 : stan === "nie" ? 0 : null;
}

export type RodzajSpojnosci = "zgodne_tak" | "dwa_tak" | "zgodne_nie" | "dwa_nie" | "rozbiezne" | "za_malo";

export interface SpojnoscTematu {
  temat: TematWspolny;
  wartosci: Partial<Record<SystemTematu, number>>;
  /** Średnia zgodność par systemów: 1 − |a − b| (0–1). */
  zgodnosc: number;
  rodzaj: RodzajSpojnosci;
  /** Szansa, że taki układ ocen wyjdzie przypadkiem (z rozkładu ocen każdego systemu). */
  szansa: number;
}

export interface Spojnosc {
  tematy: SpojnoscTematu[];
  /** Zgodność zaobserwowana i oczekiwana przypadkiem (0–1) oraz kappa. */
  obserwowana: number;
  przypadek: number;
  kappa: number;
  ile: Record<RodzajSpojnosci, number>;
}

const WARTOSCI = [0, 0.5, 1];

export function spojnosc(tematy: TematWspolny[]): Spojnosc {
  // rozkład ocen każdego systemu w tym zestawie tematów
  const rozklad = Object.fromEntries(SYSTEMY.map((s) => {
    const v = tematy.map((t) => wartosc(t.wskazania[s].stan)).filter((x): x is number => x !== null);
    const p = WARTOSCI.map((w) => (v.length ? v.filter((x) => x === w).length / v.length : 0));
    return [s, p];
  })) as Record<SystemTematu, number[]>;

  // oczekiwana zgodność pary systemów przy niezależnych ocenach
  const przypadekPary = (a: SystemTematu, b: SystemTematu) =>
    WARTOSCI.reduce((s, x, i) => s + WARTOSCI.reduce((s2, y, j) => s2 + rozklad[a][i] * rozklad[b][j] * (1 - Math.abs(x - y)), 0), 0);

  const ile: Record<RodzajSpojnosci, number> = { zgodne_tak: 0, dwa_tak: 0, zgodne_nie: 0, dwa_nie: 0, rozbiezne: 0, za_malo: 0 };
  let sumaObs = 0, sumaPrz = 0, n = 0;

  const wynik = tematy.map((temat): SpojnoscTematu => {
    const wartosci: Partial<Record<SystemTematu, number>> = {};
    for (const s of SYSTEMY) {
      const v = wartosc(temat.wskazania[s].stan);
      if (v !== null) wartosci[s] = v;
    }
    const sys = SYSTEMY.filter((s) => wartosci[s] !== undefined);
    if (sys.length < 2) {
      ile.za_malo++;
      return { temat, wartosci, zgodnosc: 0, rodzaj: "za_malo", szansa: 1 };
    }
    const pary: [SystemTematu, SystemTematu][] = [];
    for (let i = 0; i < sys.length; i++) for (let j = i + 1; j < sys.length; j++) pary.push([sys[i], sys[j]]);
    const zgodnosc = pary.reduce((s, [a, b]) => s + 1 - Math.abs(wartosci[a]! - wartosci[b]!), 0) / pary.length;
    const przypadek = pary.reduce((s, [a, b]) => s + przypadekPary(a, b), 0) / pary.length;
    sumaObs += zgodnosc; sumaPrz += przypadek; n++;

    const tak = sys.filter((s) => wartosci[s]! > 0).length;
    const zero = sys.length - tak;
    const rodzaj: RodzajSpojnosci = tak === sys.length ? "zgodne_tak"
      : zero === sys.length ? "zgodne_nie"
        : tak >= 2 ? "dwa_tak"
          : zero >= 2 ? "dwa_nie" : "rozbiezne";
    ile[rodzaj]++;
    const szansa = sys.reduce((s, x) => s * rozklad[x][WARTOSCI.indexOf(wartosci[x]!)], 1);
    return { temat, wartosci, zgodnosc, rodzaj, szansa };
  });

  const obserwowana = n ? sumaObs / n : 0;
  const przypadek = n ? sumaPrz / n : 0;
  const kappa = przypadek < 1 ? (obserwowana - przypadek) / (1 - przypadek) : 0;
  return { tematy: wynik, obserwowana, przypadek, kappa, ile };
}

/* ---------- tabela 3: droga i talenty ---------- */

const MIANOWNIK: Record<PlanetId, string> = {
  sun: "Słońce", moon: "Księżyc", mars: "Mars", mercury: "Merkury", jupiter: "Jowisz",
  venus: "Wenus", saturn: "Saturn", rahu: "Rahu", ketu: "Ketu",
};
const NAZWA_TALENTU: Record<DziedzinaTalentu, string> = {
  muzyka: "muzyka", sztuka: "sztuka", slowo: "słowo", nauczanie: "nauczanie", biznes: "biznes",
  technika: "technika", uzdrawianie: "uzdrawianie", sport: "sport i ruch", przywodztwo: "przywództwo", duchowosc: "duchowość",
};
/** Temat ze „Wspólnych tematów”, w którym ten talent się wyraża — po nim sprawdzamy dłoń i liczby. */
const TALENT_TEMAT: Record<DziedzinaTalentu, string> = {
  muzyka: "uznanie", sztuka: "uznanie", slowo: "umysl", biznes: "umysl", nauczanie: "ambicja", przywodztwo: "ambicja",
  sport: "energia", technika: "praca", uzdrawianie: "duchowosc", duchowosc: "duchowosc",
};
/** Klasyczne dziedziny domów — do opisu, gdzie skupia się życie. */
const DZIEDZINA_DOMU: Record<number, string> = {
  1: "Ty — ciało, osobowość, start", 2: "pieniądze, rodzina, mowa", 3: "wysiłek, odwaga, komunikacja",
  4: "dom, matka, spokój serca", 5: "twórczość, dzieci, nauka", 6: "praca codzienna, służba, zdrowie",
  7: "związek, partnerzy", 8: "przemiany, ukryte sprawy", 9: "sens, nauczyciele, dalekie podróże",
  10: "kariera, działanie w świecie", 11: "zyski, przyjaciele, spełnienie marzeń", 12: "odosobnienie, zagranica, duchowość",
};

export interface TalentWDrodze {
  nazwa: string;
  procent: number;
  temat: string;
  potwierdza: SystemTematu[];
}

export interface Droga {
  /** Skupisko 3+ planet w jednym domu — gdzie i jak skupia się życie. */
  skupisko: { dom: number; znak: string; planety: string[]; dziedzina: string } | null;
  /** Tematy potwierdzone przez co najmniej dwa systemy, od najmocniejszego. */
  kierunek: TematWspolny[];
  talenty: TalentWDrodze[];
  /** Tematy, o których wszystkie systemy milczą. */
  nieOs: TematWspolny[];
}

export function droga(chart: VedicChart, s: Spojnosc): Droga {
  let skupisko: Droga["skupisko"] = null;
  if (chart.angles) {
    const domy = [...Array(12).keys()].map((i) => ({ d: i + 1, ps: PLANET_ORDER.filter((p) => chart.planets[p].house === i + 1) }))
      .sort((a, b) => b.ps.length - a.ps.length);
    const top = domy[0];
    if (top && top.ps.length >= 3) {
      skupisko = { dom: top.d, znak: RASIS[chart.planets[top.ps[0]].sign].pl, planety: top.ps.map((p) => MIANOWNIK[p]), dziedzina: DZIEDZINA_DOMU[top.d] };
    }
  }
  const potwierdzone = s.tematy.filter((t) => t.rodzaj === "zgodne_tak" || t.rodzaj === "dwa_tak")
    .sort((a, b) => b.temat.sila - a.temat.sila || a.szansa - b.szansa);
  const poId = new Map(s.tematy.map((t) => [t.temat.id, t]));
  const talenty = (dziedzinyTalentu(chart) ?? [])
    .map((w) => ({ id: w.id, p: procentNizej(w.punkty, ROZKLADY_TALENTU[w.id]) }))
    .filter((x) => x.p >= 75)
    .sort((a, b) => b.p - a.p)
    .map((x): TalentWDrodze => {
      const t = poId.get(TALENT_TEMAT[x.id]);
      const potwierdza = (["dlon", "numerologia"] as SystemTematu[]).filter((sys) => (t?.wartosci[sys] ?? 0) > 0);
      return { nazwa: NAZWA_TALENTU[x.id], procent: Math.round(x.p), temat: t?.temat.nazwa ?? "", potwierdza };
    });
  return {
    skupisko,
    kierunek: potwierdzone.map((t) => t.temat),
    talenty,
    nieOs: s.tematy.filter((t) => t.rodzaj === "zgodne_nie").map((t) => t.temat),
  };
}

/* ---------- tabela 4: D1 + ręka wiodąca, D9 + ręka bierna ---------- */

/**
 * Wiodąca dłoń czyta się jak mapa główna (D1), bierna jak nawamsza (D9). Głosują cztery kolumny
 * (D1, dłoń wiodąca, D9, dłoń bierna); numerologia tylko POTWIERDZA — jej „tak” dodaje pewności,
 * a jej 0 nie liczy się jako niezgoda. Powód (ten sam dla każdego): numerologia ma trzy–cztery
 * liczby na jedenaście tematów, więc jej 0 znaczy „nie wśród Twoich liczb”, a nie „tego nie ma”.
 */
export type KolumnaRak = "d1" | "wiodaca" | "d9" | "bierna";
export const KOLUMNY_RAK: KolumnaRak[] = ["d1", "wiodaca", "d9", "bierna"];
export type RodzajRak = "zgodne_tak" | "wiekszosc_tak" | "zgodne_nie" | "wiekszosc_nie" | "rozbiezne" | "za_malo";

export interface WierszRak {
  temat: TematWspolny;
  /** Ten sam temat policzony dla D9 i ręki biernej. */
  temat9?: TematWspolny;
  wartosci: Partial<Record<KolumnaRak, number>>;
  /** Numerologia: 1 / ½ = potwierdza, 0 = nie dokłada, null = brak danych. */
  numerologia: number | null;
  rodzaj: RodzajRak;
  /** Ile kolumn mówi „tak” (z ilu, które mają dane). */
  tak: number;
  n: number;
  szansa: number;
}
export interface ParaRak { a: KolumnaRak; b: KolumnaRak; obserwowana: number; przypadek: number; kappa: number; n: number }
export interface SpojnoscRak {
  wiersze: WierszRak[];
  obserwowana: number;
  przypadek: number;
  kappa: number;
  /** Zgodność par: D1↔wiodąca i D9↔bierna (główne), D1↔D9 i wiodąca↔bierna (wewnątrz systemu). */
  pary: ParaRak[];
}

const kappaZ = (obs: number, prz: number) => (prz < 1 ? (obs - prz) / (1 - prz) : 0);

export function spojnoscRak(d1: TematWspolny[], d9: TematWspolny[]): SpojnoscRak {
  const zD9 = new Map(d9.map((t) => [t.id, t]));
  const surowe = d1.map((t) => {
    const t9 = zD9.get(t.id);
    const v: Partial<Record<KolumnaRak, number>> = {};
    const dodaj = (k: KolumnaRak, x: number | null) => { if (x !== null) v[k] = x; };
    dodaj("d1", wartosc(t.wskazania.kosmogram.stan));
    dodaj("wiodaca", wartosc(t.wskazania.dlon.stan));
    if (t9) { dodaj("d9", wartosc(t9.wskazania.kosmogram.stan)); dodaj("bierna", wartosc(t9.wskazania.dlon.stan)); }
    return { temat: t, temat9: t9, wartosci: v, numerologia: wartosc(t.wskazania.numerologia.stan) };
  });

  const rozklad = Object.fromEntries(KOLUMNY_RAK.map((k) => {
    const v = surowe.map((r) => r.wartosci[k]).filter((x): x is number => x !== undefined);
    return [k, WARTOSCI.map((w) => (v.length ? v.filter((x) => x === w).length / v.length : 0))];
  })) as Record<KolumnaRak, number[]>;
  const przypadekPary = (a: KolumnaRak, b: KolumnaRak) =>
    WARTOSCI.reduce((s, x, i) => s + WARTOSCI.reduce((s2, y, j) => s2 + rozklad[a][i] * rozklad[b][j] * (1 - Math.abs(x - y)), 0), 0);

  const PARY: [KolumnaRak, KolumnaRak][] = [["d1", "wiodaca"], ["d9", "bierna"], ["d1", "d9"], ["wiodaca", "bierna"]];
  const pary: ParaRak[] = PARY.map(([a, b]) => {
    const wsp = surowe.filter((r) => r.wartosci[a] !== undefined && r.wartosci[b] !== undefined);
    const obserwowana = wsp.length ? wsp.reduce((s, r) => s + 1 - Math.abs(r.wartosci[a]! - r.wartosci[b]!), 0) / wsp.length : 0;
    const przypadek = przypadekPary(a, b);
    return { a, b, obserwowana, przypadek, kappa: wsp.length ? kappaZ(obserwowana, przypadek) : 0, n: wsp.length };
  });

  let sumaObs = 0, sumaPrz = 0, ile = 0;
  const wiersze = surowe.map((r): WierszRak => {
    const kol = KOLUMNY_RAK.filter((k) => r.wartosci[k] !== undefined);
    if (kol.length < 2) return { ...r, rodzaj: "za_malo", tak: 0, n: kol.length, szansa: 1 };
    const pr: [KolumnaRak, KolumnaRak][] = [];
    for (let i = 0; i < kol.length; i++) for (let j = i + 1; j < kol.length; j++) pr.push([kol[i], kol[j]]);
    sumaObs += pr.reduce((s, [a, b]) => s + 1 - Math.abs(r.wartosci[a]! - r.wartosci[b]!), 0) / pr.length;
    sumaPrz += pr.reduce((s, [a, b]) => s + przypadekPary(a, b), 0) / pr.length;
    ile++;
    const tak = kol.filter((k) => r.wartosci[k]! > 0).length;
    const zero = kol.length - tak;
    const rodzaj: RodzajRak = tak === kol.length ? "zgodne_tak" : zero === kol.length ? "zgodne_nie"
      : tak > zero ? "wiekszosc_tak" : zero > tak ? "wiekszosc_nie" : "rozbiezne";
    const szansa = kol.reduce((s, k) => s * rozklad[k][WARTOSCI.indexOf(r.wartosci[k]!)], 1);
    return { ...r, rodzaj, tak, n: kol.length, szansa };
  });
  const obserwowana = ile ? sumaObs / ile : 0;
  const przypadek = ile ? sumaPrz / ile : 0;
  return { wiersze, obserwowana, przypadek, kappa: kappaZ(obserwowana, przypadek), pary };
}
