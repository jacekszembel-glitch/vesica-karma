import { RASIS, PLANET_ORDER, type PlanetId } from "./constants";
import type { VedicChart } from "./chart";
import { navamsaChart, dashamsaChart, horaLord } from "./varga";
import { poziomWzmocnienia } from "./domInterpretacja";
import { wykryteJogiPosortowane, type Yoga } from "./yogas";
import { aspektuje, ocenaWladcy, type OcenaWladcy, type OcenaWladcyZWagami } from "./sila";
import { wladcaDomu, type CzynnikDomeny } from "./finanseUczucia";
import type { AstroLocale } from "./i18nAstro";

/**
 * FINANSE WEDYJSKIE — dedykowany silnik, NIE recykling ocenaWladcy.
 *
 * Powód: appka wcześniej liczyła "siłę finansową" tak samo jak siłę ogólną
 * (Predyspozycje) — ta sama funkcja ocenaWladcy dla
 * tej samej planety dawała identyczny wynik w obu miejscach,
 * bo funkcja nie wie, PO CO pyta o planetę. Ten plik pyta wyłącznie o to,
 * co klasyczny Jyotish łączy z majątkiem:
 *  - domy 2./5./9./11. (nie tylko 2./11. jak wczesniej) + czterej naturalni
 *    karakowie (Jowisz, Wenus, Saturn, Merkury — wg specyfikacji uzytkownika),
 *  - Dhana jogi (juz wykrywane w yogas.ts, ale dotad nigdzie nie laczone
 *    z Finansami — tylko pokazywane osobno w Talentach/Jogach),
 *  - potwierdzenie w D9 (nawamsza) — obietnica bogactwa z D1 musi sie
 *    utrzymac w D9, inaczej jest niestabilna,
 *  - D10 (dasamsza) jako zrodlo dochodu/kariery,
 *  - D2 (hora) — CHARAKTER zarabiania (wlasny wysilek vs gromadzenie),
 *    opisowo, nie punktowo — to inny rodzaj informacji niz "ile", tylko "jak",
 *  - Indu Lagna — klasyczny "ascendent bogactwa" (BPHS): 9. dom od lagny
 *    i 9. dom od Ksiezyca, ich wladcy i przypisane im Kala, zliczone od
 *    Ksiezyca,
 *  - biezaca dasza, JESLI jej wladca jest jednym z powyzszych wskaznikow.
 */

/** Kala (klasyczna wartosc liczbowa) siedmiu grah — do Indu Lagna. Rahu/Ketu nie maja Kali (BPHS). */
const KALA: Partial<Record<PlanetId, number>> = {
  sun: 30, moon: 16, mars: 6, mercury: 8, jupiter: 10, venus: 12, saturn: 1,
};

/** Naturalne dobroczyńce/złoczyńce do oceny obsadzenia/aspektu na Indu Lagnę. */
const DOBROCZYNCY: PlanetId[] = ["jupiter", "venus", "mercury", "moon"];

export interface IndulagnaWynik {
  znak: number;
  /** Planety zasiadające w znaku Indu Lagny. */
  wZnaku: PlanetId[];
  /** Planety aspektujące znak Indu Lagny. */
  aspektujace: PlanetId[];
}

/**
 * Indu Lagna (BPHS) — "ascendent bogactwa": suma Kala władcy 9. domu od lagny
 * i władcy 9. domu od Księżyca, policzona w znakach od Księżyca (Księżyc = 1).
 * Wymaga znanej godziny urodzenia (potrzebna lagna).
 */
export function induLagna(chart: VedicChart): IndulagnaWynik | null {
  if (!chart.angles) return null;
  const lord9OdLagny = RASIS[(chart.angles.lagnaSign + 8) % 12].lord;
  const lord9OdKsiezyca = RASIS[(chart.moonSign + 8) % 12].lord;
  const suma = (KALA[lord9OdLagny] ?? 0) + (KALA[lord9OdKsiezyca] ?? 0);
  const krok = suma % 12 === 0 ? 12 : suma % 12;
  const znak = (chart.moonSign + krok - 1) % 12;

  const wZnaku = PLANET_ORDER.filter((id) => chart.planets[id].sign === znak);
  const aspektujace = PLANET_ORDER.filter((id) => !wZnaku.includes(id) && aspektuje(chart, id, znak));
  return { znak, wZnaku, aspektujace };
}

/** Ocena finansowa JEDNEJ planety — odpowiednik ocenaWladcy, ale pytający wyłącznie o majątek. */
function ocenaFinansowaPlanety(chart: VedicChart, id: PlanetId, indu: IndulagnaWynik | null, dhanaJogi: Yoga[], locale: AstroLocale = "pl"): OcenaWladcyZWagami {
  const czynniki: string[] = [];
  const wagi: number[] = [];
  // Każdy czynnik jest dopisywany zaraz po zmianie `punkty` — waga to przyrost od poprzedniego czynnika.
  let dotychczas = 0;
  const dopisz = (tekst: string) => { czynniki.push(tekst); wagi.push(Math.round((punkty - dotychczas) * 100) / 100); dotychczas = punkty; };
  const dodaj = (pl: string, en: string) => dopisz(locale === "en" ? en : pl);
  let punkty = 0;
  const p = chart.planets[id];

  // 1) godnosc w D1 — ten sam trzystopniowy podzial co reszta appki
  const poziomD1 = poziomWzmocnienia(p.dignity);
  if (poziomD1 === "dobre") {
    punkty += 1;
    dodaj(
      `${p.dignity === "egzaltacja" ? "egzaltacja" : p.dignity === "mulatrikona" ? "mulatrikona" : p.dignity === "władanie" ? "we własnym znaku" : "w znaku przyjaciela"} w D1 — silny sygnał majątkowy`,
      `${p.dignity === "egzaltacja" ? "exalted" : p.dignity === "mulatrikona" ? "mulatrikona" : p.dignity === "władanie" ? "in its own sign" : "in a friend's sign"} in D1 — strong wealth signal`,
    );
  } else if (poziomD1 === "zle") {
    punkty -= 0.75;
    dodaj(
      p.dignity === "upadek" ? "w upadku w D1 — osłabiony sygnał majątkowy" : "w znaku wroga w D1 — utrudniony sygnał majątkowy",
      p.dignity === "upadek" ? "debilitated in D1 — weakened wealth signal" : "in an enemy's sign in D1 — hindered wealth signal",
    );
  }

  // 2) spalenie — ten sam fakt co wszedzie w appce, tu w kontekscie majatku
  if (p.combust) {
    punkty -= 0.5;
    dodaj("spalona — blisko Słońca, sygnał majątkowy trudniej dostrzec", "combust — close to the Sun, the wealth signal is harder to spot");
  }

  // 3) potwierdzenie w D9 (nawamsza) — obietnica z D1 musi sie utrzymac
  const d9 = navamsaChart(chart);
  if (d9) {
    const poziomD9 = poziomWzmocnienia(d9.planets[id].dignity);
    if (poziomD9 === "dobre") {
      punkty += 0.75;
      dodaj("potwierdzone w nawamszy (D9) — trwałe, nie tylko obiecane", "confirmed in the navamsa (D9) — lasting, not just promised");
    } else if (poziomD9 === "zle") {
      punkty -= 0.5;
      dodaj("niepotwierdzone w nawamszy (D9) — obietnica bogactwa niestabilna", "not confirmed in the navamsa (D9) — the promise of wealth is unstable");
    }
  }

  // 4) D10 (dasamsza) — trwalosc zrodla dochodu/kariery
  const d10 = dashamsaChart(chart);
  if (d10) {
    const poziomD10 = poziomWzmocnienia(d10.planets[id].dignity);
    if (poziomD10 === "dobre") {
      punkty += 0.5;
      dodaj("silna w daśamszy (D10) — stabilne źródło dochodu", "strong in the dashamsha (D10) — stable source of income");
    } else if (poziomD10 === "zle") {
      punkty -= 0.4;
      dodaj("słaba w daśamszy (D10) — niepewne źródło dochodu", "weak in the dashamsha (D10) — uncertain source of income");
    }
  }

  // 5) Dhana jogi — bonus za kazda joge bogactwa, w ktorej ta planeta bierze udzial
  const udzial = dhanaJogi.filter((j) => j.planety.includes(id));
  for (const j of udzial) {
    punkty += 1.5;
    dodaj(`uczestniczy w Dhana jodze — ${j.uzasadnienie}`, `participates in a Dhana yoga — ${j.uzasadnienie}`);
  }

  // 6) Indu Lagna — obecnosc/aspekt na "ascendent bogactwa"
  if (indu) {
    const dobroczynca = DOBROCZYNCY.includes(id);
    if (indu.wZnaku.includes(id)) {
      if (dobroczynca) {
        punkty += 1;
        dodaj("zasiada w Indu Lagnie (ascendent bogactwa) — bezpośrednio wzmacnia dobrobyt", "sits in the Indu Lagna (ascendant of wealth) — directly strengthens prosperity");
      } else {
        punkty -= 0.5;
        dodaj("osłabia Indu Lagnę (ascendent bogactwa) swoją obecnością", "weakens the Indu Lagna (ascendant of wealth) by its presence");
      }
    } else if (indu.aspektujace.includes(id)) {
      if (dobroczynca) {
        punkty += 0.5;
        dodaj("aspektuje Indu Lagnę — dodatkowe wsparcie dla dobrobytu", "aspects the Indu Lagna — extra support for prosperity");
      } else {
        punkty -= 0.3;
        dodaj("osłabia Indu Lagnę aspektem — tarcie w temacie dobrobytu", "weakens the Indu Lagna by aspect — friction in the theme of prosperity");
      }
    }
  }

  const ton = punkty >= 0.5 ? "wspierający" : punkty <= -0.75 ? "wymagający" : "mieszany";
  const plus = wagi.filter((w) => w > 0).reduce((a, b) => a + b, 0);
  const minus = -wagi.filter((w) => w < 0).reduce((a, b) => a + b, 0);
  return { punkty: Math.round(punkty * 100) / 100, ton, czynniki, wagi, plus: Math.round(plus * 100) / 100, minus: Math.round(minus * 100) / 100 };
}

export interface OcenaFinansowa {
  planety: CzynnikDomeny[];
  indu: IndulagnaWynik | null;
  dhanaJogi: Yoga[];
  /** Charakter zarabiania wg Hory (D2) władców 2./11. domu — opisowo, nie punktowo (patrz nagłówek pliku). */
  hora: { dom: 2 | 11; wladca: PlanetId; typ: "sun" | "moon" }[];
  /** Czy bieżący władca mahadaszy/antardaszy jest jednym z wskaźników finansowych tej mapy. */
  obecnyOkres: { lord: PlanetId; istotny: boolean; ton: OcenaWladcy["ton"] } | null;
}

const KROKI_EN: { dom?: 2 | 5 | 9 | 11; planeta?: PlanetId; rola: string }[] = [
  { dom: 2, rola: "lord of the 2nd house — accumulated wealth, savings, family values" },
  { dom: 5, rola: "lord of the 5th house — speculation, investment, luck from past merit" },
  { dom: 9, rola: "lord of the 9th house — fortune, life's luck, inheritance" },
  { dom: 11, rola: "lord of the 11th house — regular gains, income, fulfilling material goals" },
  { planeta: "jupiter", rola: "natural karaka of wealth and abundance (dhana karaka)" },
  { planeta: "venus", rola: "karaka of material goods, comfort and cash flow" },
  { planeta: "saturn", rola: "long-term, systematic wealth building" },
  { planeta: "mercury", rola: "karaka of trade, negotiation and business sense" },
];

/** Główna funkcja — pełna, dedykowana ocena finansowa wg specyfikacji użytkownika (patrz nagłówek pliku). */
export function ocenaFinansowa(chart: VedicChart, locale: AstroLocale = "pl"): OcenaFinansowa {
  const indu = induLagna(chart);
  const dhanaJogi = wykryteJogiPosortowane(chart, locale).filter((j) => j.kategoria === "dhana");

  const role = new Map<PlanetId, string[]>();
  if (locale === "en") {
    const DOM_PLANETA: Record<2 | 5 | 9 | 11, PlanetId | null> = {
      2: wladcaDomu(chart, 2), 5: wladcaDomu(chart, 5), 9: wladcaDomu(chart, 9), 11: wladcaDomu(chart, 11),
    };
    for (const { dom, planeta, rola } of KROKI_EN) {
      const id = dom ? DOM_PLANETA[dom] : (planeta ?? null);
      if (!id) continue;
      const obecne = role.get(id) ?? [];
      obecne.push(rola);
      role.set(id, obecne);
    }
  } else {
    const KROKI: { planeta: PlanetId | null; rola: string }[] = [
      { planeta: wladcaDomu(chart, 2), rola: "władca 2. domu — zgromadzony majątek, oszczędności, wartości rodzinne" },
      { planeta: wladcaDomu(chart, 5), rola: "władca 5. domu — spekulacja, inwestycje, szczęście z przeszłych zasług" },
      { planeta: wladcaDomu(chart, 9), rola: "władca 9. domu — fortuna, szczęście życiowe, dziedzictwo" },
      { planeta: wladcaDomu(chart, 11), rola: "władca 11. domu — regularne zyski, dochody, spełnianie celów materialnych" },
      { planeta: "jupiter", rola: "naturalny karaka bogactwa i obfitości (dhana karaka)" },
      { planeta: "venus", rola: "karaka dóbr materialnych, komfortu i przepływu gotówki" },
      { planeta: "saturn", rola: "długoterminowe, systematyczne budowanie majątku" },
      { planeta: "mercury", rola: "karaka handlu, negocjacji i zmysłu biznesowego" },
    ];
    for (const { planeta, rola } of KROKI) {
      if (!planeta) continue;
      const obecne = role.get(planeta) ?? [];
      obecne.push(rola);
      role.set(planeta, obecne);
    }
  }

  const planety: CzynnikDomeny[] = Array.from(role.entries())
    .map(([planeta, role]) => ({
      planeta, role,
      ocena: ocenaFinansowaPlanety(chart, planeta, indu, dhanaJogi, locale),
      dignity: chart.planets[planeta].dignity,
    }))
    .sort((a, b) => b.ocena.punkty - a.ocena.punkty);

  const hora: OcenaFinansowa["hora"] = [2, 11].flatMap((dom) => {
    const wladca = wladcaDomu(chart, dom as 2 | 11);
    if (!wladca) return [];
    return [{ dom: dom as 2 | 11, wladca, typ: horaLord(chart.planets[wladca].longitude) }];
  });

  const finansowoIstotne = new Set<PlanetId>(planety.map((p) => p.planeta));
  const wladcaOkresu = chart.currentDasha[0]?.lord ?? null;
  const obecnyOkres: OcenaFinansowa["obecnyOkres"] = wladcaOkresu
    ? { lord: wladcaOkresu, istotny: finansowoIstotne.has(wladcaOkresu), ton: ocenaWladcy(chart, wladcaOkresu).ton }
    : null;

  return { planety, indu, dhanaJogi, hora, obecnyOkres };
}

/** Opis charakteru hory dla tekstu UI. */
export const HORA_OPIS: Record<"sun" | "moon", string> = {
  sun: "wysiłku i inicjatywy — pieniądze przychodzą tu bardziej przez aktywne działanie niż same z siebie",
  moon: "gromadzenia i naturalnego przepływu — pieniądze przychodzą tu bardziej przez oszczędzanie i cierpliwość niż przez rywalizację",
};

const HORA_OPIS_EN: Record<"sun" | "moon", string> = {
  sun: "effort and initiative — money here comes more through active action than on its own",
  moon: "accumulation and natural flow — money here comes more through saving and patience than through competition",
};

/** Wersja HORA_OPIS zalezna od jezyka — patrz i18nAstro.ts dla wzorca. */
export function horaOpisNazwa(typ: "sun" | "moon", locale: "pl" | "en"): string {
  return locale === "en" ? HORA_OPIS_EN[typ] : HORA_OPIS[typ];
}
