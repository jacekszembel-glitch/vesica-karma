import { GRAHAS, RASIS, BHAVAS, PLANET_ORDER, type PlanetId } from "./constants";
import type { VedicChart, ChartPlanet, Dignity } from "./chart";
import { GRAHY_SZADBALI, szadbala } from "./shadbala";
import { grahaNazwa, rasiNazwa, domNazwa, domObszar, dignityNazwa, type AstroLocale } from "./i18nAstro";

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

const TEMAT_PLANETY_EN: Record<PlanetId, string> = {
  sun: "leadership and self-worth",
  moon: "emotions and a sense of security",
  mars: "courage and decisive action",
  mercury: "communication and the way you think",
  jupiter: "wisdom, growth and a sense of meaning",
  venus: "relationships, beauty and pleasure",
  saturn: "discipline, perseverance and a sense of responsibility",
  rahu: "ambition and stepping into the unknown",
  ketu: "introspection and letting go of the unnecessary",
};

/** Wersja TEMAT_PLANETY zalezna od jezyka — patrz i18nAstro.ts dla wzorca. */
export function tematPlanetyNazwa(id: PlanetId, locale: AstroLocale): string {
  return locale === "en" ? TEMAT_PLANETY_EN[id] : TEMAT_PLANETY[id];
}

/**
 * Pełne, konkretne wyjaśnienie „co to znaczy" dla każdej planety — współdzielone
 * przez Predyspozycje (RankingGrah) i Mandalę Syntezy (węzeł "Najsilniejsza"),
 * żeby te dwa miejsca nie opisywały tej samej planety innymi słowami. Celowo
 * konkretne (co dokładnie łatwiej Ci przychodzi), nie ogólnikowe.
 */
export const PREDYSPOZYCJA_OPIS: Record<PlanetId, string> = {
  sun: "Naturalna zdolność do przewodzenia i brania odpowiedzialności na siebie. Łatwiej niż innym przychodzi Ci być widocznym/ą, podejmować decyzje za grupę i działać z poczuciem własnej wartości.",
  moon: "Wyczuwasz nastroje innych i własne stany wewnętrzne szybciej niż przeciętnie. Naturalnie troszczysz się o otoczenie i płynnie dostosowujesz się do zmiennych okoliczności. Księżyc to też wyobraźnia i głos — emocja, którą da się przekazać śpiewem, obrazem, opowieścią.",
  mars: "Masz naturalny dostęp do odwagi, energii i szybkiego działania w sytuacjach, które innych paraliżują. Łatwiej Ci bronić granic — własnych i cudzych — i inicjować działanie.",
  mercury: "Naturalna łatwość w analizowaniu, formułowaniu myśli i komunikowaniu się, w piśmie i mowie. Szybko łączysz luźne fakty w spójne całości. Merkury daje też zręczność rąk i poczucie rytmu — rzemiosło, instrumenty, precyzyjną pracę.",
  jupiter: "Skłonność do szerokiego spojrzenia, nauczania innych i budowania długoterminowych strategii. Naturalnie budzisz zaufanie jako ktoś, kto widzi więcej niż bieżący moment.",
  venus: "Wyczucie piękna, harmonii i relacji międzyludzkich przychodzi Ci naturalnie. Łatwiej niż innym łagodzisz konflikty i tworzysz estetyczne, przyjemne otoczenie. To też planeta sztuki i muzyki — wyczucia formy, barwy, melodii.",
  saturn: "Naturalna zdolność do wytrwałej, systematycznej pracy tam, gdzie inni się poddają. Dyscyplina i cierpliwość są dla Ciebie bardziej dostępne niż dla przeciętnej osoby.",
  rahu: "Ciągnie Cię w stronę nieprzetartych ścieżek, nowych technologii i tematów, których jeszcze nikt dobrze nie ogarnął. Naturalna śmiałość wobec nieznanego.",
  ketu: "Naturalna skłonność do wycofania się z powierzchownego zgiełku i patrzenia w głąb — własną albo cudzą. Intuicja działa u Ciebie często ponad logiką.",
};

const PREDYSPOZYCJA_OPIS_EN: Record<PlanetId, string> = {
  sun: "A natural ability to lead and take responsibility. Being visible, making decisions for a group, and acting with self-worth comes to you more easily than to others.",
  moon: "You sense others' moods and your own inner states faster than average. You naturally care for those around you and adapt fluidly to changing circumstances. The Moon is also imagination and voice — emotion that can be passed on through singing, images or storytelling.",
  mars: "You have natural access to courage, energy and quick action in situations that paralyze others. It's easier for you to defend boundaries — your own and other people's — and to initiate action.",
  mercury: "A natural ease in analyzing, formulating thoughts and communicating, in writing and speech. You quickly connect loose facts into coherent wholes. Mercury also gives manual dexterity and a sense of rhythm — craft, instruments, precise work.",
  jupiter: "A tendency toward a broad view, teaching others and building long-term strategies. You naturally inspire trust as someone who sees beyond the present moment.",
  venus: "A sense of beauty, harmony and interpersonal relationships comes naturally to you. You ease conflicts and create an aesthetic, pleasant environment more easily than others. It is also the planet of art and music — a feel for form, colour and melody.",
  saturn: "A natural ability for persistent, systematic work where others give up. Discipline and patience are more accessible to you than to the average person.",
  rahu: "You're drawn toward unbeaten paths, new technologies and topics no one has quite figured out yet. A natural boldness toward the unknown.",
  ketu: "A natural tendency to withdraw from surface noise and look inward — your own or someone else's. Intuition often works for you above logic.",
};

/** Wersja PREDYSPOZYCJA_OPIS zalezna od jezyka — patrz i18nAstro.ts dla wzorca. */
export function predyspozycjaOpisNazwa(id: PlanetId, locale: AstroLocale): string {
  return locale === "en" ? PREDYSPOZYCJA_OPIS_EN[id] : PREDYSPOZYCJA_OPIS[id];
}

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
  moon: "opieka, gastronomia, hotelarstwo, pielęgniarstwo, praca z dziećmi lub publicznością, śpiew, aktorstwo — tam, gdzie liczy się wyczucie nastroju innych",
  mars: "sport, chirurgia, ratownictwo, inżynieria, rzemiosło precyzyjne, praca wymagająca szybkiej decyzji i odwagi, nie tylko planowania",
  mercury: "handel, dziennikarstwo, pisanie, księgowość, informatyka, tłumaczenia, gra na instrumencie, rzemiosło — praca ze słowem, liczbą, rytmem i szybką wymianą informacji",
  jupiter: "nauczanie, doradztwo, prawo, finanse, coaching, duchowość — zawody oparte na przekazywaniu wiedzy i budowaniu zaufania",
  venus: "sztuka, projektowanie, moda, muzyka, kosmetologia, dyplomacja i mediacje — praca z estetyką, harmonią i relacjami",
  saturn: "budownictwo, administracja, zarządzanie procesami, rolnictwo — praca wymagająca długiego, systematycznego wysiłku, rzadziej błyskotliwa, częściej trwała",
  rahu: "nowe technologie, praca za granicą, media, marketing, obszary dopiero się kształtujące — kierunki nietypowe, bez utartej ścieżki",
  ketu: "badania, analiza danych, praca „za kulisami”, terapie alternatywne — obszary wymagające skupienia bez rozgłosu",
};

const MOZLIWE_ZAWODY_EN: Record<PlanetId, string> = {
  sun: "leadership, management, politics, public representation, medicine — anywhere authority and visibility matter",
  moon: "caregiving, hospitality, catering, nursing, work with children or the public, singing, acting — anywhere a feel for others' moods matters",
  mars: "sports, surgery, emergency response, engineering, precision craft, work requiring fast decisions and courage, not just planning",
  mercury: "trade, journalism, writing, accounting, IT, translation, playing an instrument, craft — work with words, numbers, rhythm and fast exchange of information",
  jupiter: "teaching, consulting, law, finance, coaching, spirituality — professions built on sharing knowledge and building trust",
  venus: "art, design, fashion, music, cosmetology, diplomacy and mediation — work with aesthetics, harmony and relationships",
  saturn: "construction, administration, process management, agriculture — work requiring long, systematic effort, rarely flashy, usually lasting",
  rahu: "new technologies, work abroad, media, marketing, areas still taking shape — unconventional directions, without a beaten path",
  ketu: "research, data analysis, behind-the-scenes work, alternative therapies — areas requiring focus without the spotlight",
};

/** Wersja MOZLIWE_ZAWODY zalezna od jezyka — patrz i18nAstro.ts dla wzorca. */
export function mozliweZawodyNazwa(id: PlanetId, locale: AstroLocale): string {
  return locale === "en" ? MOZLIWE_ZAWODY_EN[id] : MOZLIWE_ZAWODY[id];
}

/**
 * Zastrzeżenie do PREDYSPOZYCJA_OPIS, gdy planeta ma słabą godność w D1
 * (wrogi/upadek) mimo dodatniego łącznego wyniku w ocenaWladcy — bez tego
 * RankingGrah pokazuje wyłącznie pozytywny, uniwersalny opis, a „w znaku
 * wroga" ginie w środku listy czynników jak neutralny fakt (patrz też
 * zdanieKondycji niżej — ten sam problem, już rozwiązany dla opisu domów).
 */
export function zastrzezenieGodnosci(dignity: Dignity, imiePlanety: string, locale: AstroLocale = "pl"): string | null {
  if (locale === "en") {
    if (dignity === "wrogi") {
      return `Caveat: ${imiePlanety} stands in your chart in an enemy's sign — this ease is therefore somewhat hindered and needs more conscious work than the score alone would suggest.`;
    }
    if (dignity === "upadek") {
      return `Caveat: ${imiePlanety} stands in your chart debilitated — this ease is therefore somewhat hindered and needs more conscious work than the score alone would suggest.`;
    }
    return null;
  }
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
export function zastrzezenieGodnosciNaMinus(dignity: Dignity, imiePlanety: string, locale: AstroLocale = "pl"): string | null {
  if (locale === "en") {
    const where = dignity === "egzaltacja" ? "exalted"
      : dignity === "władanie" ? "in its own sign"
      : dignity === "mulatrikona" ? "in mulatrikona"
      : dignity === "przyjazny" ? "in a friendly sign"
      : null;
    if (!where) return null;
    return `Caveat: ${imiePlanety} stands in your chart ${where} — the sign placement itself doesn't hurt here, it's other factors (house rulership, aspects, nature) pulling it down.`;
  }
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
export function najsilniejszaPlaneta(chart: VedicChart, locale: AstroLocale = "pl"): { id: PlanetId; metoda: string } {
  if (chart.angles) {
    const ranking = GRAHY_SZADBALI
      .map((id) => ({ id, w: szadbala(chart, id) }))
      .filter((d): d is { id: PlanetId; w: NonNullable<ReturnType<typeof szadbala>> } => d.w !== null)
      .sort((a, b) => b.w.razemRupy - a.w.razemRupy);
    return {
      id: ranking[0].id,
      metoda: locale === "en" ? "counting the combined, six-fold measured effective strength (Shadbala)" : "licząc łączną, sześciorako mierzoną moc sprawczą (Szadbalę)",
    };
  }
  const ranking = [...GRAHY_SZADBALI].sort(
    (a, b) => SILA_GODNOSCI[chart.planets[b].dignity] - SILA_GODNOSCI[chart.planets[a].dignity],
  );
  return {
    id: ranking[0],
    metoda: locale === "en" ? "by sign placement — without a known birth time this is the only reliable indicator" : "wg pozycji w znaku — bez znanej godziny urodzenia to jedyny pewny wskaźnik",
  };
}

/** Wizualny wskaźnik kondycji planety — pasek: zielony/długi = super, czerwony/długi = źle.
 * Przyjmuje gotową liczbę siły (np. średnią D1+D9), nie tylko pojedynczą godność —
 * dzięki temu ten sam koszyk progów obsługuje zarówno czystą D1, jak i połączony wynik. */
/** `etykieta` zostaje ZAWSZE po polsku (kanoniczny klucz do porownan logicznych
 *  w zdanieKondycji ponizej) — do wyswietlenia patrz etykietaKondycjiNazwa(). */
export interface KondycjaWskaznik { kolor: string; procent: number; etykieta: string }
export function kondycjaZLiczby(s: number): KondycjaWskaznik {
  if (s >= 1.5) return { kolor: "#6fbf9f", procent: 100, etykieta: "super" };
  if (s >= 0.5) return { kolor: "#6fbf9f", procent: 55, etykieta: "dobrze" };
  if (s > -0.5) return { kolor: "#5b9bd5", procent: 40, etykieta: "zmiennie" };
  if (s > -1.5) return { kolor: "#e66767", procent: 55, etykieta: "słabo" };
  return { kolor: "#e66767", procent: 100, etykieta: "źle" };
}
export function kondycjaWskaznik(dignity: Dignity): KondycjaWskaznik {
  return kondycjaZLiczby(SILA_GODNOSCI[dignity]);
}

const ETYKIETA_KONDYCJI_EN: Record<string, string> = {
  super: "great", dobrze: "good", zmiennie: "mixed", słabo: "weak", źle: "poor",
};
/** Etykieta kondycji (kondycjaWskaznik().etykieta) do wyswietlenia — WARTOSC
 *  zostaje po polsku do porownan logicznych, patrz komentarz przy KondycjaWskaznik. */
export function etykietaKondycjiNazwa(etykieta: string, locale: AstroLocale): string {
  return locale === "en" ? (ETYKIETA_KONDYCJI_EN[etykieta] ?? etykieta) : etykieta;
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

/** Jak wyzej, po angielsku — bez rozroznienia rodzaju gramatycznego (angielski go nie ma). */
const CHARAKTER_NATURY_EN: Record<number, string> = {
  1: "benefic and supportive",
  0: "a mixed bag — depends who it's interacting with",
  [-1]: "demanding — a mild malefic, it mobilizes, it doesn't coddle",
};

/** Godnosc jako fraza w zdaniu ("w egzaltacji", "in exaltation"...) — osobna od dignityNazwa()
 *  (odznaka), bo tu potrzebny jest przyimek dopasowany do zdania. */
function godnoscFraza(dignity: Dignity, locale: AstroLocale): string {
  if (locale === "en") {
    return dignity === "egzaltacja" ? "exalted"
      : dignity === "władanie" ? "in its own sign"
      : dignity === "mulatrikona" ? "in mulatrikona (almost like in its own sign)"
      : dignity === "przyjazny" ? "in a friendly sign"
      : dignity === "wrogi" ? "in an enemy's sign"
      : dignity === "upadek" ? "debilitated"
      : "in a neutral sign";
  }
  return dignity === "egzaltacja" ? "w egzaltacji"
    : dignity === "władanie" ? "we własnym znaku"
    : dignity === "mulatrikona" ? "w mulatrikonie (niemal jak we własnym znaku)"
    : dignity === "przyjazny" ? "w znaku przyjaznym"
    : dignity === "wrogi" ? "w znaku wroga"
    : dignity === "upadek" ? "w upadku"
    : "w znaku neutralnym";
}

/**
 * Zdanie łączące DWIE osobne osie w jedną, spójną myśl: natura (stała cecha
 * planety) i godność W TEJ MAPIE (pasek kondycjaWskaznik). Bez tego czytelnik
 * widzi dwa niby-sprzeczne fakty naraz („z natury wymagająca" + pasek „dobrze")
 * i nie wie, że to odpowiedzi na dwa różne pytania.
 */
function zdanieKondycji(p: ChartPlanet, glownyObszar: string, locale: AstroLocale = "pl"): string {
  const k = kondycjaWskaznik(p.dignity);
  const dobra = k.etykieta === "super" || k.etykieta === "dobrze";
  const zla = k.etykieta === "słabo" || k.etykieta === "źle";
  const g = GRAHAS[p.id];
  const gdzie = godnoscFraza(p.dignity, locale);
  const etykieta = etykietaKondycjiNazwa(k.etykieta, locale);

  if (locale === "en") {
    if (g.nature === -1 && dobra) {
      return `In your chart it stands ${gdzie} (bar: ${etykieta}) — despite this demanding nature, here it `
        + `works more often IN your favor than uphill: the theme "${glownyObszar}" mobilizes, but without constant self-doubt.`;
    }
    if (g.nature === 1 && zla) {
      return `In your chart it stands ${gdzie} (bar: ${etykieta}) — despite being a benefic by nature, here `
        + `support doesn't come as easily as usual: the theme "${glownyObszar}" can be a source of doubt until you consciously work through it.`;
    }
    if (dobra) {
      return `In your chart it stands ${gdzie} (bar: ${etykieta}) — this side of its character clearly works in your favor here.`;
    }
    if (zla) {
      return `In your chart it stands ${gdzie} (bar: ${etykieta}) — this side of its character is further complicated here, worth consciously tending to.`;
    }
    return `In your chart it stands ${gdzie} (bar: ${etykieta}) — neither especially strengthened nor weakened.`;
  }

  if (g.nature === -1 && dobra) {
    return `W Twojej mapie stoi jednak ${gdzie} (pasek: ${etykieta}) — mimo tej wymagającej natury, akurat tutaj `
      + `działa częściej NA Twoją korzyść niż pod górkę: temat "${glownyObszar}" mobilizuje, ale bez ciągłego zwątpienia.`;
  }
  if (g.nature === 1 && zla) {
    return `W Twojej mapie stoi jednak ${gdzie} (pasek: ${etykieta}) — mimo że z natury to dobroczyńca, akurat tu `
      + `wsparcie nie przychodzi tak łatwo jak zwykle: temat "${glownyObszar}" bywa źródłem zwątpienia, dopóki świadomie się go nie przepracuje.`;
  }
  if (dobra) {
    return `W Twojej mapie stoi ${gdzie} (pasek: ${etykieta}) — ta strona charakteru gra tu wyraźnie na Twoją korzyść.`;
  }
  if (zla) {
    return `W Twojej mapie stoi ${gdzie} (pasek: ${etykieta}) — ta strona charakteru dodatkowo się komplikuje, warto ją świadomie pielęgnować.`;
  }
  return `W Twojej mapie stoi ${gdzie} (pasek: ${etykieta}) — ani szczególnie wzmocniona, ani osłabiona.`;
}

export function opisDomu(chart: VedicChart, house: number, compareChart?: VedicChart, locale: AstroLocale = "pl"): OpisDomu | null {
  if (!chart.angles) return null;
  const en = locale === "en";
  const lagnaSign = chart.angles.lagnaSign;
  const sign = (lagnaSign + house - 1) % 12;
  const wladcaZnaku = RASIS[sign].lord;
  const wladcaDomu = chart.planets[wladcaZnaku];
  const planetyWDomu = PLANET_ORDER.filter((id) => chart.planets[id].house === house).map((id) => chart.planets[id]);
  const bhava = BHAVAS[house - 1];
  const glownyObszar = domObszar(house - 1, locale).split(",")[0];

  const wnioski: string[] = [];

  if (planetyWDomu.length === 0) {
    wnioski.push(en
      ? `No planet stands directly in this house — its theme (${glownyObszar}) develops mainly `
        + `through where and how strong the sign lord, ${grahaNazwa(GRAHAS[wladcaZnaku], "en")}, is, rather than through a planet's direct presence here.`
      : `Żadna planeta nie stoi bezpośrednio w tym domu — jego temat (${glownyObszar}) rozwija się głównie `
        + `przez to, gdzie i jak silny jest władca znaku, ${GRAHAS[wladcaZnaku].pl}, a nie przez bezpośrednią obecność planety tutaj.`);
  } else {
    for (const p of planetyWDomu) {
      const g = GRAHAS[p.id];
      const retro = p.retrograde && p.id !== "rahu" && p.id !== "ketu";
      const r = RODZAJ_PLANETY[p.id];
      let zdanie = en
        ? `${grahaNazwa(g, "en")} by nature tends to be ${CHARAKTER_NATURY_EN[g.nature]}. ${zdanieKondycji(p, glownyObszar, "en")}`
        : `${g.pl} z natury bywa ${CHARAKTER_NATURY[g.nature][r]}. ${zdanieKondycji(p, glownyObszar)}`;
      if (p.combust) {
        if (en) {
          zdanie += ` It is also combust from proximity to the Sun — its influence here is easily overshadowed by self-doubt.`;
        } else {
          const spalony = przym(r, "spalony", "spalona", "spalone");
          const jego = przym(r, "jego", "jej", "jego");
          zdanie += ` Dodatkowo ${spalony} bliskością Słońca — ${jego} wpływ tutaj łatwo przyćmić własną niepewnością.`;
        }
      }
      if (retro) {
        if (en) {
          zdanie += ` It is also retrograde (℞) — the theme "${glownyObszar}" doesn't develop here in a straight line forward, it comes back, `
            + `demanding the same lesson be worked through again, more deeply, before it truly moves on; classically this also means the effect `
            + `works more inward than outward.`;
        } else {
          const retrogradowany = przym(r, "retrogradowany", "retrogradowana", "retrogradowane");
          zdanie += ` W dodatku ${retrogradowany} (℞) — temat "${glownyObszar}" nie rozwija się tu liniowo do przodu, tylko wraca, `
            + `każe przepracować to samo jeszcze raz, głębiej, zanim naprawdę ruszy dalej; klasycznie oznacza to też, że efekt `
            + `działa bardziej do wewnątrz niż na zewnątrz.`;
        }
      }
      wnioski.push(zdanie);

      // porównanie z D9 (nawamszą) — ta sama planeta, sprawdzamy czy głębsza
      // struktura potwierdza to, co widać w D1, czy raczej temu zaprzecza
      if (compareChart) {
        const pD9 = compareChart.planets[p.id];
        if (en) {
          let cmp = `In D9 (navamsa) ${grahaNazwa(g, "en")} stands in ${rasiNazwa(RASIS[pD9.sign], "en")}`;
          if (pD9.sign === p.sign) {
            cmp += " — the same sign as in D1, i.e. vargottama: this planet's effect is clearer and more lasting than usual, "
              + "both charts speak with one voice.";
          } else {
            const roznica = SILA_GODNOSCI[pD9.dignity] - SILA_GODNOSCI[p.dignity];
            if (roznica >= 2) {
              cmp += `, noticeably stronger than in D1 (there ${dignityNazwa(p.dignity, "en")}, here ${dignityNazwa(pD9.dignity, "en")}) — this planet has more inner `
                + `reserve of strength than a glance at the main chart alone would suggest.`;
            } else if (roznica <= -2) {
              cmp += `, noticeably weaker than in D1 (there ${dignityNazwa(p.dignity, "en")}, here ${dignityNazwa(pD9.dignity, "en")}) — what shows on the surface isn't `
                + `fully backed by the deeper structure; worth consciously strengthening this side, not assuming it will "hold up on its own".`;
            } else {
              cmp += ` (${dignityNazwa(pD9.dignity, "en")}) — a similar level of strength as in D1, no major surprises between what shows and what's underneath.`;
            }
          }
          wnioski.push(cmp);
        } else {
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
    }

    if (planetyWDomu.length >= 2) {
      const dobroczynne = planetyWDomu.filter((p) => GRAHAS[p.id].nature === 1).length;
      const zlosliwe = planetyWDomu.filter((p) => GRAHAS[p.id].nature === -1).length;
      let razem: string;
      if (en) {
        const nazwyEn = planetyWDomu.map((p) => grahaNazwa(GRAHAS[p.id], "en")).join(" and ");
        if (dobroczynne >= 2 && zlosliwe === 0) {
          razem = `${nazwyEn} together in one house reinforce each other — a rare concentration of pure support, `
            + `which classically makes this theme one of the strongest sides of the whole chart.`;
        } else if (zlosliwe >= 2 && dobroczynne === 0) {
          razem = `${nazwyEn} together in one house is a concentration of pure pressure — the theme needs conscious work `
            + `and discipline here, but it's exactly from this kind of accumulated tension that real strength and resilience are often later born.`;
        } else if (dobroczynne > 0 && zlosliwe > 0) {
          razem = `${nazwyEn} together in one house is a mix of support and friction at once — the benefic softens the malefic's `
            + `edge, but the malefic also complicates the benefic's ease a little. In practice this theme is rarely simple here, `
            + `but rarely clearly bad either — it's a field of continuous balancing.`;
        } else {
          razem = `${nazwyEn} together in one house — several influences act here at once, so this theme tends to be more `
            + `complex and variable than if only one planet stood here.`;
        }
      } else {
        const nazwy = planetyWDomu.map((p) => GRAHAS[p.id].pl).join(" i ");
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
      }
      wnioski.push(razem);
    }
  }

  if (en) {
    const godnoscWladcyEn = wladcaDomu.dignity === "egzaltacja" ? " (exalted — very strongly)"
      : wladcaDomu.dignity === "władanie" ? " (in its own sign — securely)"
      : wladcaDomu.dignity === "upadek" ? " (debilitated — with difficulty)"
      : wladcaDomu.dignity === "wrogi" ? " (in an enemy's sign — uphill)"
      : "";
    wnioski.push(
      `The lord of this house, ${grahaNazwa(GRAHAS[wladcaZnaku], "en")}, stands in house ${wladcaDomu.house} (${rasiNazwa(RASIS[wladcaDomu.sign], "en")})${godnoscWladcyEn} `
      + `— its condition mostly determines how much energy this theme gets in your life, and in what way, even when nothing stands `
      + `directly in house ${house} itself.`,
    );
  } else {
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
  }

  return {
    numer: house, nazwa: domNazwa(house - 1, locale), sanskryt: bhava.sanskrit, obszar: domObszar(house - 1, locale),
    znak: sign, wladcaZnaku, planetyWDomu, wladcaDomu, wnioski,
  };
}
