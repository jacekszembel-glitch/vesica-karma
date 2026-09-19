import { GRAHAS, RASIS, BHAVAS, PLANET_ORDER, type PlanetId } from "./constants";
import type { VedicChart, ChartPlanet, Dignity } from "./chart";
import { GRAHY_SZADBALI, szadbala } from "./shadbala";

/** Zgrubna siła godności do porównania D1 vs D9 — sama kolejność, nie liczba absolutna. */
export const SILA_GODNOSCI: Record<Dignity, number> = {
  egzaltacja: 2, władanie: 2, mulatrikona: 2, przyjazny: 1, neutralny: 0, wrogi: -1, upadek: -2,
};

/**
 * Główny temat/obszar życia każdej planety — jedno zdanie, wspólne dla
 * "Planet w skrócie" i "Trzech najważniejszych wniosków", żeby te dwa
 * miejsca nie opisywały tej samej planety różnymi słowami.
 */
export const TEMAT_PLANETY: Record<PlanetId, string> = {
  sun: "przywództwo i poczucie własnej wartości",
  moon: "emocje i poczucie bezpieczeństwa",
  mars: "odwagę i zdecydowane działanie",
  mercury: "komunikację i sposób myślenia",
  jupiter: "mądrość, rozwój i poczucie sensu",
  venus: "relacje, piękno i przyjemność",
  saturn: "dyscyplinę, wytrwałość i poczucie odpowiedzialności",
  rahu: "ambicję i wchodzenie w nieznane",
  ketu: "introspekcję i puszczanie tego, co zbędne",
};

/**
 * Pełne, konkretne wyjaśnienie „co to znaczy" dla każdej planety — współdzielone
 * przez Predyspozycje (RankingGrah) i Mandalę Syntezy (węzeł "Najsilniejsza"),
 * żeby te dwa miejsca nie opisywały tej samej planety innymi słowami. Celowo
 * konkretne (co dokładnie łatwiej Ci przychodzi), nie ogólnikowe.
 */
export const PREDYSPOZYCJA_OPIS: Record<PlanetId, string> = {
  sun: "Naturalna zdolność do przewodzenia i brania odpowiedzialności na siebie. Łatwiej niż innym przychodzi Ci być widocznym/ą, podejmować decyzje za grupę i działać z poczuciem własnej wartości.",
  moon: "Wyczuwasz nastroje innych i własne stany wewnętrzne szybciej niż przeciętnie. Naturalnie troszczysz się o otoczenie i płynnie dostosowujesz się do zmiennych okoliczności.",
  mars: "Masz naturalny dostęp do odwagi, energii i szybkiego działania w sytuacjach, które innych paraliżują. Łatwiej Ci bronić granic — własnych i cudzych — i inicjować działanie.",
  mercury: "Naturalna łatwość w analizowaniu, formułowaniu myśli i komunikowaniu się, w piśmie i mowie. Szybko łączysz luźne fakty w spójne całości.",
  jupiter: "Skłonność do szerokiego spojrzenia, nauczania innych i budowania długoterminowych strategii. Naturalnie budzisz zaufanie jako ktoś, kto widzi więcej niż bieżący moment.",
  venus: "Wyczucie piękna, harmonii i relacji międzyludzkich przychodzi Ci naturalnie. Łatwiej niż innym łagodzisz konflikty i tworzysz estetyczne, przyjemne otoczenie.",
  saturn: "Naturalna zdolność do wytrwałej, systematycznej pracy tam, gdzie inni się poddają. Dyscyplina i cierpliwość są dla Ciebie bardziej dostępne niż dla przeciętnej osoby.",
  rahu: "Ciągnie Cię w stronę nieprzetartych ścieżek, nowych technologii i tematów, których jeszcze nikt dobrze nie ogarnął. Naturalna śmiałość wobec nieznanego.",
  ketu: "Naturalna skłonność do wycofania się z powierzchownego zgiełku i patrzenia w głąb — własną albo cudzą. Intuicja działa u Ciebie często ponad logiką.",
};

/**
 * Możliwe kierunki zawodowe dla danej predyspozycji — klasyczne karakatwa
 * zawodowe BPHS, ale świadomie pokazywane TYLKO przy konkretnej, policzonej
 * z mapy predyspozycji (RankingGrah), nie jako osobna, oderwana tabela
 * planeta→zawód. Wcześniej appka miała dokładnie taką oderwaną tabelę
 * (ZAWODY w tym pliku, usunięta) — użytkownik zgłosił ją jako nietrafną na
 * własnym przykładzie (Mars nisko w Predyspozycjach, a tabela i tak sugerowała
 * "wojsko, policja, chirurgia"). Tu ten sam materiał wraca, ale wyłącznie jako
 * tłumaczenie NAPRAWDĘ silnej u tej osoby cechy na kierunki zawodowe — stąd
 * hedge'owany język ("mogą się sprawdzić", nie "Twój zawód to").
 */
export const MOZLIWE_ZAWODY: Record<PlanetId, string> = {
  sun: "przywództwo, zarządzanie, polityka, reprezentacja publiczna, medycyna — wszędzie tam, gdzie liczy się autorytet i widoczność",
  moon: "opieka, gastronomia, hotelarstwo, pielęgniarstwo, praca z dziećmi lub publicznością — tam, gdzie liczy się wyczucie nastroju innych",
  mars: "sport, chirurgia, ratownictwo, inżynieria, rzemiosło precyzyjne, praca wymagająca szybkiej decyzji i odwagi, nie tylko planowania",
  mercury: "handel, dziennikarstwo, pisanie, księgowość, informatyka, tłumaczenia — praca ze słowem, liczbą i szybką wymianą informacji",
  jupiter: "nauczanie, doradztwo, prawo, finanse, coaching, duchowość — zawody oparte na przekazywaniu wiedzy i budowaniu zaufania",
  venus: "sztuka, projektowanie, moda, muzyka, kosmetologia, dyplomacja i mediacje — praca z estetyką, harmonią i relacjami",
  saturn: "budownictwo, administracja, zarządzanie procesami, rolnictwo — praca wymagająca długiego, systematycznego wysiłku, rzadziej błyskotliwa, częściej trwała",
  rahu: "nowe technologie, praca za granicą, media, marketing, obszary dopiero się kształtujące — kierunki nietypowe, bez utartej ścieżki",
  ketu: "badania, analiza danych, praca „za kulisami”, terapie alternatywne — obszary wymagające skupienia bez rozgłosu",
};

/**
 * Zastrzeżenie do PREDYSPOZYCJA_OPIS, gdy planeta ma słabą godność w D1
 * (wrogi/upadek) mimo dodatniego łącznego wyniku w ocenaWladcy — bez tego
 * RankingGrah pokazuje wyłącznie pozytywny, uniwersalny opis, a „w znaku
 * wroga" ginie w środku listy czynników jak neutralny fakt (patrz też
 * zdanieKondycji niżej — ten sam problem, już rozwiązany dla opisu domów).
 */
export function zastrzezenieGodnosci(dignity: Dignity, imiePlanety: string): string | null {
  if (dignity === "wrogi") {
    return `Zastrzeżenie: ${imiePlanety} stoi w Twojej mapie w znaku wroga — ta łatwość jest tu więc częściowo utrudniona i wymaga bardziej świadomej pracy, niż sugerowałby sam wynik.`;
  }
  if (dignity === "upadek") {
    return `Zastrzeżenie: ${imiePlanety} stoi w Twojej mapie w upadku — ta łatwość jest tu więc częściowo utrudniona i wymaga bardziej świadomej pracy, niż sugerowałby sam wynik.`;
  }
  return null;
}

/**
 * Lustrzane zastrzeżenie do NA_CO_UWAZAC_OPIS (komponent NaCoUwazac) — gdy
 * planeta ląduje w „Na co uważać" (ujemny łączny wynik) mimo DOBREJ godności
 * w D1. Bez tego czytelnik widzi np. „Jowisz — naturalny dobroczyńca" jako
 * jedyne uzasadnienie w sekcji ostrzegawczej i nie wie, że to inne czynniki
 * (władztwo domów, aspekty) ciągną wynik w dół, nie sam znak.
 */
export function zastrzezenieGodnosciNaMinus(dignity: Dignity, imiePlanety: string): string | null {
  const gdzie = dignity === "egzaltacja" ? "w egzaltacji"
    : dignity === "władanie" ? "we własnym znaku"
    : dignity === "mulatrikona" ? "w mulatrikonie"
    : dignity === "przyjazny" ? "w znaku przyjaznym"
    : null;
  if (!gdzie) return null;
  return `Zastrzeżenie: ${imiePlanety} stoi w Twojej mapie ${gdzie} — samo miejsce w znaku tu nie szkodzi, w dół ciągną ją inne czynniki (władztwo domów, aspekty, natura).`;
}

/**
 * Najsilniejsza planeta w mapie — pełna Szadbala, gdy znana godzina urodzenia
 * (Dig i Kendradi Bala wymagają domów, bez nich Szadbala jest mocno okrojona
 * i myliłaby bardziej niż pomagała). Bez godziny: sama godność w znaku —
 * jedyny wskaźnik siły, który nie wymaga lagny. Współdzielone między
 * "Trzema wnioskami"/Mandalą Syntezy Kosmogramu, żeby nie liczyły tego samego
 * na dwa różne sposoby.
 */
export function najsilniejszaPlaneta(chart: VedicChart): { id: PlanetId; metoda: string } {
  if (chart.angles) {
    const ranking = GRAHY_SZADBALI
      .map((id) => ({ id, w: szadbala(chart, id) }))
      .filter((d): d is { id: PlanetId; w: NonNullable<ReturnType<typeof szadbala>> } => d.w !== null)
      .sort((a, b) => b.w.razemRupy - a.w.razemRupy);
    return { id: ranking[0].id, metoda: "licząc łączną, sześciorako mierzoną moc sprawczą (Szadbalę)" };
  }
  const ranking = [...GRAHY_SZADBALI].sort(
    (a, b) => SILA_GODNOSCI[chart.planets[b].dignity] - SILA_GODNOSCI[chart.planets[a].dignity],
  );
  return { id: ranking[0], metoda: "wg pozycji w znaku — bez znanej godziny urodzenia to jedyny pewny wskaźnik" };
}

/** Wizualny wskaźnik kondycji planety — pasek: zielony/długi = super, czerwony/długi = źle. */
export interface KondycjaWskaznik { kolor: string; procent: number; etykieta: string }
export function kondycjaWskaznik(dignity: Dignity): KondycjaWskaznik {
  const s = SILA_GODNOSCI[dignity];
  if (s >= 2) return { kolor: "#6fbf9f", procent: 100, etykieta: "super" };
  if (s === 1) return { kolor: "#6fbf9f", procent: 55, etykieta: "dobrze" };
  if (s === 0) return { kolor: "#5b9bd5", procent: 40, etykieta: "zmiennie" };
  if (s === -1) return { kolor: "#e66767", procent: 55, etykieta: "słabo" };
  return { kolor: "#e66767", procent: 100, etykieta: "źle" };
}

/**
 * Poziom wzmocnienia dla odznak typu wargottama — SAMA wargottama nie jest
 * ani dobra, ani zła, wzmacnia to, co planeta i tak reprezentuje. Kolor
 * odznaki musi więc podążać za godnością, nie być stałym neutralnym złotem —
 * współdzielone między tabelą pozycji planet a "Planety w skrócie", żeby te
 * dwa miejsca nie pokazywały tej samej odznaki w różnych kolorach.
 */
export type PoziomWzmocnienia = "dobre" | "zle" | "neutralne";
export function poziomWzmocnienia(dignity: Dignity): PoziomWzmocnienia {
  if (dignity === "egzaltacja" || dignity === "władanie" || dignity === "mulatrikona" || dignity === "przyjazny") return "dobre";
  if (dignity === "wrogi" || dignity === "upadek") return "zle";
  return "neutralne";
}

/**
 * OPIS DOMU — rozszerzona, narracyjna wersja tego, co dziś jest tylko w dymku
 * (skrótowe fakty). Tu dokładamy WNIOSKI: co obecność/nieobecność planet
 * i kondycja władcy domu faktycznie znaczą w praktyce — nie nowa metoda,
 * tylko to samo rozumowanie co ocenaWladcy/RankingGrah (godność, władztwo
 * domu) ubrane w pełne zdania zamiast punktowej listy.
 */

export interface OpisDomu {
  numer: number;
  nazwa: string;
  sanskryt: string;
  obszar: string;
  znak: number;
  wladcaZnaku: PlanetId;
  planetyWDomu: ChartPlanet[];
  wladcaDomu: ChartPlanet;
  /** Jawne wnioski po polsku — jedno zdanie na czynnik, jak wszędzie w tych wyliczeniach. */
  wnioski: string[];
}

type Rodzaj = "m" | "f" | "n";
/** Dobiera formę przymiotnika/zaimka wg rodzaju gramatycznego planety. */
function przym(rodzaj: Rodzaj, m: string, f: string, n: string): string {
  return rodzaj === "m" ? m : rodzaj === "f" ? f : n;
}
/** Rodzaj gramatyczny nazwy każdej planety — bez tego przymiotniki niżej się nie zgadzają
 *  (np. „Słońce" jest nijakie: wymagajĄCE, nie wymagajĄCA jak przy „Wenus"). */
const RODZAJ_PLANETY: Record<PlanetId, Rodzaj> = {
  sun: "n", moon: "m", mars: "m", mercury: "m", jupiter: "m",
  venus: "f", saturn: "m", rahu: "m", ketu: "m",
};

/** Natura planety — STAŁA cecha, prawdziwa w każdej mapie (inna oś niż godność niżej — patrz zdanieKondycji). */
const CHARAKTER_NATURY: Record<number, Record<Rodzaj, string>> = {
  1: { m: "dobroczynny i wspierający", f: "dobroczynna i wspierająca", n: "dobroczynne i wspierające" },
  0: {
    m: "wypadkowy — zależy, z kim akurat współdziała",
    f: "wypadkowa — zależy, z kim akurat współdziała",
    n: "wypadkowe — zależy, z kim akurat współdziała",
  },
  [-1]: {
    m: "wymagający — łagodny malefik, mobilizuje, nie rozpieszcza",
    f: "wymagająca — łagodny malefik, mobilizuje, nie rozpieszcza",
    n: "wymagające — łagodny malefik, mobilizuje, nie rozpieszcza",
  },
};

/**
 * Zdanie łączące DWIE osobne osie w jedną, spójną myśl: natura (stała cecha
 * planety) i godność W TEJ MAPIE (pasek kondycjaWskaznik). Bez tego czytelnik
 * widzi dwa niby-sprzeczne fakty naraz („z natury wymagająca" + pasek „dobrze")
 * i nie wie, że to odpowiedzi na dwa różne pytania.
 */
function zdanieKondycji(p: ChartPlanet, glownyObszar: string): string {
  const k = kondycjaWskaznik(p.dignity);
  const dobra = k.etykieta === "super" || k.etykieta === "dobrze";
  const zla = k.etykieta === "słabo" || k.etykieta === "źle";
  const g = GRAHAS[p.id];

  const gdzie = p.dignity === "egzaltacja" ? "w egzaltacji"
    : p.dignity === "władanie" ? "we własnym znaku"
    : p.dignity === "mulatrikona" ? "w mulatrikonie (niemal jak we własnym znaku)"
    : p.dignity === "przyjazny" ? "w znaku przyjaznym"
    : p.dignity === "wrogi" ? "w znaku wroga"
    : p.dignity === "upadek" ? "w upadku"
    : "w znaku neutralnym";

  if (g.nature === -1 && dobra) {
    return `W Twojej mapie stoi jednak ${gdzie} (pasek: ${k.etykieta}) — mimo tej wymagającej natury, akurat tutaj `
      + `działa częściej NA Twoją korzyść niż pod górkę: temat "${glownyObszar}" mobilizuje, ale bez ciągłego zwątpienia.`;
  }
  if (g.nature === 1 && zla) {
    return `W Twojej mapie stoi jednak ${gdzie} (pasek: ${k.etykieta}) — mimo że z natury to dobroczyńca, akurat tu `
      + `wsparcie nie przychodzi tak łatwo jak zwykle: temat "${glownyObszar}" bywa źródłem zwątpienia, dopóki świadomie się go nie przepracuje.`;
  }
  if (dobra) {
    return `W Twojej mapie stoi ${gdzie} (pasek: ${k.etykieta}) — ta strona charakteru gra tu wyraźnie na Twoją korzyść.`;
  }
  if (zla) {
    return `W Twojej mapie stoi ${gdzie} (pasek: ${k.etykieta}) — ta strona charakteru dodatkowo się komplikuje, warto ją świadomie pielęgnować.`;
  }
  return `W Twojej mapie stoi ${gdzie} (pasek: ${k.etykieta}) — ani szczególnie wzmocniona, ani osłabiona.`;
}

export function opisDomu(chart: VedicChart, house: number, compareChart?: VedicChart): OpisDomu | null {
  if (!chart.angles) return null;
  const lagnaSign = chart.angles.lagnaSign;
  const sign = (lagnaSign + house - 1) % 12;
  const wladcaZnaku = RASIS[sign].lord;
  const wladcaDomu = chart.planets[wladcaZnaku];
  const planetyWDomu = PLANET_ORDER.filter((id) => chart.planets[id].house === house).map((id) => chart.planets[id]);
  const bhava = BHAVAS[house - 1];
  const glownyObszar = bhava.obszar.split(",")[0];

  const wnioski: string[] = [];

  if (planetyWDomu.length === 0) {
    wnioski.push(
      `Żadna planeta nie stoi bezpośrednio w tym domu — jego temat (${glownyObszar}) rozwija się głównie `
      + `przez to, gdzie i jak silny jest władca znaku, ${GRAHAS[wladcaZnaku].pl}, a nie przez bezpośrednią obecność planety tutaj.`,
    );
  } else {
    for (const p of planetyWDomu) {
      const g = GRAHAS[p.id];
      const retro = p.retrograde && p.id !== "rahu" && p.id !== "ketu";
      const r = RODZAJ_PLANETY[p.id];
      let zdanie = `${g.pl} z natury bywa ${CHARAKTER_NATURY[g.nature][r]}. ${zdanieKondycji(p, glownyObszar)}`;
      if (p.combust) {
        const spalony = przym(r, "spalony", "spalona", "spalone");
        const jego = przym(r, "jego", "jej", "jego");
        zdanie += ` Dodatkowo ${spalony} bliskością Słońca — ${jego} wpływ tutaj łatwo przyćmić własną niepewnością.`;
      }
      if (retro) {
        const retrogradowany = przym(r, "retrogradowany", "retrogradowana", "retrogradowane");
        zdanie += ` W dodatku ${retrogradowany} (℞) — temat "${glownyObszar}" nie rozwija się tu liniowo do przodu, tylko wraca, `
          + `każe przepracować to samo jeszcze raz, głębiej, zanim naprawdę ruszy dalej; klasycznie oznacza to też, że efekt `
          + `działa bardziej do wewnątrz niż na zewnątrz.`;
      }
      wnioski.push(zdanie);

      // porównanie z D9 (nawamszą) — ta sama planeta, sprawdzamy czy głębsza
      // struktura potwierdza to, co widać w D1, czy raczej temu zaprzecza
      if (compareChart) {
        const pD9 = compareChart.planets[p.id];
        let cmp = `W D9 (nawamszy) ${g.pl} stoi w ${RASIS[pD9.sign].pl}`;
        if (pD9.sign === p.sign) {
          cmp += " — ten sam znak co w D1, czyli vargottama: efekt tej planety jest tu wyraźniejszy i trwalszy niż zwykle, "
            + "obie mapy mówią jednym głosem.";
        } else {
          const roznica = SILA_GODNOSCI[pD9.dignity] - SILA_GODNOSCI[p.dignity];
          if (roznica >= 2) {
            cmp += `, wyraźnie silniej niż w D1 (tam ${p.dignity}, tu ${pD9.dignity}) — ta planeta ma więcej wewnętrznej `
              + `rezerwy siły, niż widać na pierwszy rzut oka w samej mapie głównej.`;
          } else if (roznica <= -2) {
            cmp += `, wyraźnie słabiej niż w D1 (tam ${p.dignity}, tu ${pD9.dignity}) — to, co widać na zewnątrz, nie do `
              + `końca ma pokrycie w głębszej strukturze; warto tę stronę świadomie wzmacniać, nie zakładać, że "samo się utrzyma".`;
          } else {
            cmp += ` (${pD9.dignity}) — podobny poziom siły co w D1, bez większych niespodzianek między tym, co widać, a co jest pod spodem.`;
          }
        }
        wnioski.push(cmp);
      }
    }

    if (planetyWDomu.length >= 2) {
      const dobroczynne = planetyWDomu.filter((p) => GRAHAS[p.id].nature === 1).length;
      const zlosliwe = planetyWDomu.filter((p) => GRAHAS[p.id].nature === -1).length;
      const nazwy = planetyWDomu.map((p) => GRAHAS[p.id].pl).join(" i ");
      let razem: string;
      if (dobroczynne >= 2 && zlosliwe === 0) {
        razem = `${nazwy} razem w jednym domu wzmacniają się nawzajem — to rzadkie skupienie samego wsparcia, `
          + `które klasycznie robi z tego tematu jedną z najsilniejszych stron całej mapy.`;
      } else if (zlosliwe >= 2 && dobroczynne === 0) {
        razem = `${nazwy} razem w jednym domu to skupienie samej presji — temat wymaga tu świadomej pracy `
          + `i dyscypliny, ale właśnie z takiego nagromadzenia napięcia często rodzi się później realna siła i odporność.`;
      } else if (dobroczynne > 0 && zlosliwe > 0) {
        razem = `${nazwy} razem w jednym domu to mieszanka wsparcia i tarcia naraz — dobroczyńca łagodzi ostrość `
          + `malefika, ale malefik też trochę komplikuje łatwość dobroczyńcy. W praktyce ten temat rzadko bywa tu prosty, `
          + `ale i rzadko bywa jednoznacznie zły — to pole ciągłego balansowania.`;
      } else {
        razem = `${nazwy} razem w jednym domu — kilka wpływów działa tu naraz, więc ten temat bywa bardziej `
          + `złożony i zmienny niż gdyby stała tu tylko jedna planeta.`;
      }
      wnioski.push(razem);
    }
  }

  const godnoscWladcy = wladcaDomu.dignity === "egzaltacja" ? " (w egzaltacji — bardzo mocno)"
    : wladcaDomu.dignity === "władanie" ? " (we własnym znaku — pewnie)"
    : wladcaDomu.dignity === "upadek" ? " (w upadku — z trudem)"
    : wladcaDomu.dignity === "wrogi" ? " (w znaku wroga — pod górkę)"
    : "";
  const jegoWladcy = przym(RODZAJ_PLANETY[wladcaZnaku], "jego", "jej", "jego");
  wnioski.push(
    `Władca tego domu, ${GRAHAS[wladcaZnaku].pl}, stoi w ${wladcaDomu.house}. domu (${RASIS[wladcaDomu.sign].pl})${godnoscWladcy} `
    + `— to głównie od ${jegoWladcy} kondycji zależy, ile energii i w jaki sposób ten temat dostaje w Twoim życiu, nawet gdy w samym `
    + `${house}. domu nic bezpośrednio nie stoi.`,
  );

  return {
    numer: house, nazwa: bhava.pl, sanskryt: bhava.sanskrit, obszar: bhava.obszar,
    znak: sign, wladcaZnaku, planetyWDomu, wladcaDomu, wnioski,
  };
}
