import { GRAHAS, RASIS, type PlanetId } from "./constants";
import type { VedicChart } from "./chart";
import { dignityOf } from "./chart";
import { navamsaSign, isVargottama } from "./varga";
import { jogakaraka } from "./karaki";
import { norm360 } from "./math";
import type { Yoga } from "./yogas";
import { grahaNazwa, rasiNazwa, dignityNazwa, type AstroLocale } from "./i18nAstro";

/**
 * OCENA WŁADCY OKRESU — jeden rachunek dla całego serwisu.
 *
 * Komplet czynników klasycznych, każdy z jawnym uzasadnieniem po polsku
 * (lista `czynniki` idzie do dymków i do interpretacji — użytkownik i model
 * widzą, SKĄD ocena):
 *
 *  natura naturalna     — benefik/malefik; Słońce liczone pół kroku (łagodny
 *                         malefik); Księżyc wg fazy przy urodzeniu (jasny
 *                         przybywający = benefik, blisko nowiu = osłabiony)
 *  jogakaraka           — władca kendry i trikony naraz: najsilniejszy czynnik
 *  władztwo funkcyjne   — Parashara: lagna +, trikony (5/9) +, władcy 3/6/11 −,
 *                         8. dom − (luminarze zwolnieni z tej skazy — BPHS),
 *                         kendradhipati dosza dla benefików władających
 *                         wyłącznie 4/7/10 (1. dom to naraz kendra i trikona)
 *  godność w D1         — egzaltacja … upadek
 *  neecha bhanga        — zniesienie upadku wg czterech reguł standardowych
 *  godność w D9         — nawamsza połową wagi; vargottama osobno
 *  dig bala             — siła kierunkowa: Jowisz/Merkury w 1., Księżyc/Wenus
 *                         w 4., Saturn w 7., Słońce/Mars w 10. domu
 *  aspekty (graha drszti)— pełny aspekt Jowisza i Wenus wspiera, Saturna
 *                         i Marsa obciąża; liczone po znakach, z aspektami
 *                         specjalnymi (Mars 4/8, Jowisz 5/9, Saturn 3/10)
 *  retrogradacja        — czeszta: wzmacnia naturę (benefik mocniej dobroczynny,
 *                         malefik intensywniejszy)
 *  spalenie             — zbyt blisko Słońca
 *  Rahu/Ketu            — węzły działają też przez władcę znaku (dyspozytora)
 *                         i lubią domy wzrostu (upaczaja 3/6/11)
 *
 * ŚWIADOMIE POMINIĘTE (decyzja merytoryczna Jacka):
 *  - pełna szadbala (kala/czeszta liczbowo, drik bala ważona) — osobny projekt,
 *  - aspekty węzłów (szkoły spierają się, czy Rahu/Ketu aspektują 5/9),
 *  - karaki czarowe w tonie daszy — Dżajmini to odrębny system odczytu.
 */

export interface OcenaWladcy {
  punkty: number;
  ton: "wspierający" | "wymagający" | "mieszany";
  /** Uzasadnienie — po polsku, gotowe do pokazania. */
  czynniki: string[];
}

/** Ocena z rozbiciem na wagi czynników — tylko ocenaWladcy ją liczy (finanse/zdrowie zwracają samo OcenaWladcy). */
export interface OcenaWladcyZWagami extends OcenaWladcy {
  /** Waga każdego czynnika (ten sam indeks co `czynniki`): ile dodał (+) albo odjął (−) do `punkty`. */
  wagi: number[];
  /** Suma czynników dodatnich — siła tego, co planetę wspiera. */
  plus: number;
  /** Suma czynników ujemnych jako wartość dodatnia — siła tego, co ją hamuje. */
  minus: number;
}

const KENDRY_BEZ_LAGNY = [4, 7, 10];
const TRIKONY = [5, 9];
const UPACZAJA = [3, 6, 11];

/** Domy władane przez planetę przy danej lagnie (Whole Sign). */
function wladaneDomy(lord: PlanetId, lagnaSign: number): number[] {
  return GRAHAS[lord].ownSigns.map((s) => ((s - lagnaSign + 12) % 12) + 1);
}

/** Aspekty pełne (graha drszti) liczone po znakach: wszyscy 7., plus specjalne. */
const ASPEKTY: Partial<Record<PlanetId, number[]>> = {
  sun: [7], moon: [7], mercury: [7], venus: [7],
  mars: [4, 7, 8],
  jupiter: [5, 7, 9],
  saturn: [3, 7, 10],
  // węzły pominięte świadomie — patrz nagłówek
};

/** Czy aspektujący rzuca pełny aspekt na dany znak. Współdzielone z yogi.ts. */
export function aspektuje(chart: VedicChart, kto: PlanetId, znakCelu: number): boolean {
  return aspektDystans(chart, kto, znakCelu) !== null;
}

/** Jak `aspektuje`, ale zwraca dystans (w domach liczonych od planety, 1-10)
 *  zamiast bool — żeby UI (dymek/OpisDomuPanel) mógł pokazać, czy to
 *  uniwersalny aspekt 7. czy specjalny aspekt Marsa/Jowisza/Saturna. */
export function aspektDystans(chart: VedicChart, kto: PlanetId, znakCelu: number): number | null {
  const zasieg = ASPEKTY[kto];
  if (!zasieg) return null;
  const odleglosc = ((znakCelu - chart.planets[kto].sign + 12) % 12) + 1;
  return zasieg.includes(odleglosc) ? odleglosc : null;
}

/** Czy planeta stoi w kendrze (1/4/7/10) od danego znaku odniesienia. */
function wKendrzeOd(chart: VedicChart, id: PlanetId, odZnaku: number): boolean {
  const d = ((chart.planets[id].sign - odZnaku + 12) % 12) + 1;
  return d === 1 || KENDRY_BEZ_LAGNY.includes(d);
}

/**
 * Neecha bhanga — zniesienie upadku. Cztery reguły standardowe (BPHS,
 * Phaladeepika); wystarczy jedna:
 *  R1: władca znaku upadku stoi w kendrze od lagny lub od Księżyca,
 *  R2: planeta egzaltująca się w tym znaku stoi w kendrze od lagny lub Księżyca,
 *  R3: planeta w upadku jest w nawamszy w egzaltacji albo we własnym znaku,
 *  R4: władca znaku upadku aspektuje planetę.
 *
 * Eksportowana — yogi.ts używa jej do wykrywania Neeczabhanga Radźa jogi
 * dla KAŻDEJ planety w upadku, nie tylko władcy aktualnej daszy.
 */
export function neechaBhanga(chart: VedicChart, lord: PlanetId, locale: AstroLocale = "pl"): string | null {
  const p = chart.planets[lord];
  const znak = p.sign;
  const wladca = RASIS[znak].lord;
  const nazwa = (id: PlanetId) => grahaNazwa(GRAHAS[id], locale);
  const odniesienia = [chart.angles?.lagnaSign, chart.planets.moon.sign]
    .filter((x): x is number => x !== undefined);

  if (odniesienia.some((od) => wKendrzeOd(chart, wladca, od))) {
    return locale === "en"
      ? `neecha bhanga — the lord of the debilitation sign (${nazwa(wladca)}) is in a kendra`
      : `neecha bhanga — władca znaku upadku (${nazwa(wladca)}) w kendrze`;
  }
  const egzaltant = (Object.keys(GRAHAS) as PlanetId[])
    .find((id) => GRAHAS[id].exaltation?.sign === znak);
  if (egzaltant && odniesienia.some((od) => wKendrzeOd(chart, egzaltant, od))) {
    return locale === "en"
      ? `neecha bhanga — ${nazwa(egzaltant)} (exalted here) is in a kendra`
      : `neecha bhanga — ${nazwa(egzaltant)} (egzaltujący się tu) w kendrze`;
  }
  if (lord !== "rahu" && lord !== "ketu") {
    const gd9 = dignityOf(lord, navamsaSign(p.longitude), 15);
    if (gd9 === "egzaltacja" || gd9 === "władanie") {
      return locale === "en" ? "neecha bhanga — strong in the navamsa" : "neecha bhanga — mocna w nawamszy";
    }
  }
  if (aspektuje(chart, wladca, znak)) {
    return locale === "en"
      ? `neecha bhanga — aspect from the sign lord (${nazwa(wladca)})`
      : `neecha bhanga — aspekt władcy znaku (${nazwa(wladca)})`;
  }
  return null;
}

/** Dom dig bali dla planety. */
const DIG_BALA: Partial<Record<PlanetId, number>> = {
  jupiter: 1, mercury: 1, moon: 4, venus: 4, saturn: 7, sun: 10, mars: 10,
};

/**
 * `jogi` — OPCJONALNA lista wykrytych jog (z wykryteJogiPosortowane w yogas.ts),
 * przekazana PRZEZ WYWOŁUJĄCEGO (nie liczona tu, żeby uniknąć zależności
 * cyklicznej sila.ts <-> yogas.ts — yogas.ts i tak już importuje stąd
 * aspektuje/neechaBhanga). Domyślnie pusta = zero zmiany zachowania dla
 * wszystkich dotychczasowych wywołań (dasza, Ścieżka, raport PDF...) —
 * świadomie NIE włączone wszędzie na raz, tylko tam, gdzie akurat dopisano
 * `jogi` (na razie: Predyspozycje/RankingGrah), żeby nie zmieniać naraz
 * tonu dziesiątek innych miejsc bez osobnej weryfikacji każdego z nich.
 * Bonus: udział planety w KAŻDEJ wykrytej jodze (nie tylko Dhana, jak
 * w finanseWedyjskie.ts) — to samo wzmocnienie realnego układu planet,
 * które "Predyspozycje" już liczy dla wszystkiego innego, tylko dotad
 * pomijało to, co appka i tak juz wykrywa w Talentach/Jogach.
 */
/** Numer domu jako "5." (PL) lub "5th" (EN) — tylko domy 1-12. Wspoldzielone z yogas.ts. */
const DOM_ORDINAL_EN = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];
export function domOrdinal(d: number, locale: AstroLocale): string {
  return locale === "en" ? DOM_ORDINAL_EN[d] : `${d}.`;
}

/**
 * `locale` — jezyk zwracanych tekstow `czynniki` (domyslnie "pl" dla wstecznej
 * zgodnosci z licznymi wywolaniami, ktore celowo chca polskiego tekstu:
 * payload AI, raport PDF, /data-slubu i inne kalkulatory jeszcze bez i18n).
 * WARTOSCI punkty/ton zostaja identyczne niezaleznie od locale — tlumaczy sie
 * tylko wyswietlany tekst uzasadnienia, patrz i18nAstro.ts. */
export function ocenaWladcy(chart: VedicChart | null | undefined, lord: PlanetId, jogi: Yoga[] = [], locale: AstroLocale = "pl"): OcenaWladcyZWagami {
  const czynniki: string[] = [];
  const wagi: number[] = [];
  // Każdy czynnik jest dopisywany zaraz po zmianie `punkty` — waga to przyrost od poprzedniego czynnika.
  let dotychczas = 0;
  const dopisz = (tekst: string) => { czynniki.push(tekst); wagi.push(Math.round((punkty - dotychczas) * 100) / 100); dotychczas = punkty; };
  const dodaj = (pl: string, en: string) => dopisz(locale === "en" ? en : pl);
  const g = GRAHAS[lord];
  const p = chart?.planets?.[lord];
  const lagna = chart?.angles?.lagnaSign;
  const nazwa = (id: PlanetId) => grahaNazwa(GRAHAS[id], locale);

  // ── natura naturalna ──
  let punkty: number;
  if (lord === "sun") {
    punkty = -0.5;
    dodaj("łagodny malefik (Słońce)", "mild malefic (Sun)");
  } else if (lord === "moon" && chart) {
    // Księżyc wg fazy przy urodzeniu: blisko nowiu (do 72° od Słońca) osłabiony
    const elong = norm360(chart.planets.moon.longitude - chart.planets.sun.longitude);
    const odSlonca = Math.min(elong, 360 - elong);
    if (odSlonca < 72) {
      punkty = -0.25;
      dodaj("Księżyc blisko nowiu — osłabiony", "Moon close to new moon — weakened");
    } else if (elong < 180) {
      punkty = 0.5;
      dodaj("Księżyc jasny, przybywający — dobroczynny", "Moon bright, waxing — benefic");
    } else {
      punkty = 0.25;
      dodaj("Księżyc jasny, ubywający", "Moon bright, waning");
    }
  } else {
    punkty = g.nature as number;
    if (g.nature === 1) dodaj("naturalny dobroczyńca", "natural benefic");
    else if (g.nature === -1) dodaj("naturalny malefik", "natural malefic");
  }

  // ── władztwo funkcyjne ──
  if (lagna !== undefined) {
    if (jogakaraka(lagna) === lord) {
      punkty += 1.5;
      dodaj("jogakaraka — władca kendry i trikony dla Twojej lagny", "jogakaraka — lord of both a kendra and a trikona for your ascendant");
    } else if (g.ownSigns.length) {
      const domy = wladaneDomy(lord, lagna);
      if (domy.includes(1)) { punkty += 0.5; dodaj("władca lagny", "lord of the ascendant"); }
      if (domy.some((d) => TRIKONY.includes(d))) {
        punkty += 0.75;
        const trikony = domy.filter((d) => TRIKONY.includes(d));
        dodaj(
          `władca trikony (${trikony.join(". i ")}. domu)`,
          `lord of a trikona (house${trikony.length > 1 ? "s" : ""} ${trikony.map((d) => domOrdinal(d, "en")).join(" and ")})`,
        );
      }
      const zle = domy.filter((d) => [3, 6, 11].includes(d));
      if (zle.length) {
        punkty -= 0.5 * zle.length;
        dodaj(
          `władca ${zle.map((d) => d + ".").join(" i ")} domu — obciążenie funkcyjne`,
          `lord of house${zle.length > 1 ? "s" : ""} ${zle.map((d) => domOrdinal(d, "en")).join(" and ")} — functional burden`,
        );
      }
      // luminarze zwolnieni ze skazy 8. domu (BPHS)
      if (domy.includes(8) && !domy.includes(1) && lord !== "sun" && lord !== "moon") {
        punkty -= 0.5;
        dodaj("władca 8. domu", "lord of the 8th house");
      }
      const BENEFIKI_KENDRADHIPATI: PlanetId[] = ["jupiter", "venus", "mercury", "moon"];
      // 1. dom jest naraz kendrą i trikoną — władca lagny NIE podpada pod doszę
      if (BENEFIKI_KENDRADHIPATI.includes(lord) && domy.length > 0
        && domy.every((d) => KENDRY_BEZ_LAGNY.includes(d))) {
        punkty -= 0.5;
        dodaj("kendradhipati dosza — dobroczyńca władający tylko kendrami", "kendradhipati dosha — a benefic ruling only kendras");
      }
    }
  }

  // ── kondycja w mapie ──
  if (p && chart) {
    if (p.dignity === "egzaltacja") { punkty += 1; dodaj("egzaltacja w mapie", "exalted in the chart"); }
    else if (p.dignity === "mulatrikona") { punkty += 1; dodaj("mulatrikona", "mulatrikona"); }
    else if (p.dignity === "władanie") { punkty += 1; dodaj("we własnym znaku", "in its own sign"); }
    else if (p.dignity === "przyjazny") { punkty += 0.5; dodaj("w znaku przyjaciela", "in a friend's sign"); }
    else if (p.dignity === "wrogi") { punkty -= 0.5; dodaj("w znaku wroga", "in an enemy's sign"); }
    else if (p.dignity === "upadek") {
      const nb = neechaBhanga(chart, lord, locale);
      if (nb) {
        punkty += 0.25; // upadek zniesiony i lekko przekuty w siłę
        dopisz(nb);
      } else {
        punkty -= 1;
        dodaj("w upadku", "debilitated");
      }
    }

    if (lord === "rahu" || lord === "ketu") {
      // węzły działają też przez władcę znaku i lubią domy wzrostu
      const dysp = RASIS[p.sign].lord;
      const dyspP = chart.planets[dysp];
      if (["egzaltacja", "mulatrikona", "władanie", "przyjazny"].includes(dyspP.dignity)) {
        punkty += 0.5;
        dodaj(`działa przez mocnego władcę znaku (${nazwa(dysp)})`, `acts through a strong sign lord (${grahaNazwa(GRAHAS[dysp], "en")})`);
      } else if (dyspP.dignity === "upadek" || dyspP.dignity === "wrogi") {
        punkty -= 0.25;
        dodaj(`władca znaku osłabiony (${nazwa(dysp)})`, `sign lord weakened (${grahaNazwa(GRAHAS[dysp], "en")})`);
      }
      if (lagna !== undefined && UPACZAJA.includes(p.house)) {
        punkty += 0.5;
        dodaj(`w domu wzrostu (upaczaja, ${p.house}.)`, `in a house of growth (upachaya, ${domOrdinal(p.house, "en")})`);
      }
    } else {
      // godność w nawamszy — połowa wagi D1
      const d9 = navamsaSign(p.longitude);
      const gd9 = dignityOf(lord, d9, 15);
      if (gd9 === "egzaltacja" || gd9 === "władanie") {
        punkty += 0.5;
        dodaj(`mocna w nawamszy (${gd9} w ${RASIS[d9].pl})`, `strong in the navamsa (${dignityNazwa(gd9, "en")} in ${rasiNazwa(RASIS[d9], "en")})`);
      } else if (gd9 === "upadek" && p.dignity !== "upadek") {
        punkty -= 0.5;
        dodaj("słaba w nawamszy (upadek)", "weak in the navamsa (debilitated)");
      }
      if (isVargottama(p.longitude)) {
        punkty += 0.5;
        dodaj("vargottama — ten sam znak w D1 i D9", "vargottama — same sign in D1 and D9");
      }

      // dig bala — siła kierunkowa (wymaga domów)
      if (lagna !== undefined && DIG_BALA[lord] === p.house) {
        punkty += 0.25;
        dodaj("dig bala — siła kierunkowa w swoim domu", "dig bala — directional strength in its own house");
      }

      // retrogradacja (czeszta): wzmacnia naturę planety
      if (p.retrograde) {
        if (g.nature === 1) { punkty += 0.25; dodaj("retrogradna — dobroczynność wzmocniona (czeszta)", "retrograde — benefic quality strengthened (cheshta)"); }
        else if (g.nature === -1) { punkty -= 0.25; dodaj("retrogradna — działa intensywniej (czeszta)", "retrograde — acts more intensely (cheshta)"); }
      }
    }

    // aspekty pełne na władcę okresu
    if (lord !== "jupiter" && aspektuje(chart, "jupiter", p.sign)) {
      punkty += 0.4;
      dodaj("aspekt Jowisza — osłona dobroczyńcy", "Jupiter's aspect — a benefic's protection");
    }
    if (lord !== "venus" && aspektuje(chart, "venus", p.sign)) {
      punkty += 0.25;
      dodaj("aspekt Wenus", "Venus's aspect");
    }
    if (lord !== "saturn" && aspektuje(chart, "saturn", p.sign)) {
      punkty -= 0.3;
      dodaj("aspekt Saturna — dodatkowy ciężar", "Saturn's aspect — extra weight");
    }
    if (lord !== "mars" && aspektuje(chart, "mars", p.sign)) {
      punkty -= 0.3;
      dodaj("aspekt Marsa — dodatkowe tarcie", "Mars's aspect — extra friction");
    }

    if (p.combust) { punkty -= 0.5; dodaj("spalona — blisko Słońca", "combust — close to the Sun"); }
  }

  // ── udzial w wykrytych jogach — patrz komentarz przy parametrze `jogi` ──
  for (const j of jogi) {
    if (!j.planety.includes(lord)) continue;
    punkty += 0.75;
    dodaj(`uczestniczy w ${j.nazwa} — ${j.znaczenie}`, `participates in ${j.nazwa} — ${j.znaczenie}`);
  }

  const ton = punkty >= 0.5 ? "wspierający" : punkty <= -0.75 ? "wymagający" : "mieszany";
  const plus = wagi.filter((w) => w > 0).reduce((a, b) => a + b, 0);
  const minus = -wagi.filter((w) => w < 0).reduce((a, b) => a + b, 0);
  return { punkty: Math.round(punkty * 100) / 100, ton, czynniki, wagi, plus: Math.round(plus * 100) / 100, minus: Math.round(minus * 100) / 100 };
}

/**
 * Znak pojedynczego czynnika z `czynniki` — czy ciągnie ocenę w górę czy
 * w dół. Wyprowadzone wprost z push()'ów w ocenaWladcy powyżej (zamknięty
 * zbiór tekstów z tej samej funkcji, nie zgadywanie po dowolnym tekście) —
 * dopisz tu, gdy dopiszesz nowy czynnik obciążający powyżej. Bez tego lista
 * czynników w UI (RankingGrah) wygląda jak neutralne fakty, choć część z nich
 * to jedyny powód, dla którego wynik nie jest wyższy.
 */
const CZYNNIKI_MINUS = [
  "osłabiony", "naturalny malefik", "obciążenie funkcyjne", "władca 8. domu",
  "kendradhipati dosza", "w znaku wroga", "w upadku", "władca znaku osłabiony",
  "słaba w nawamszy", "działa intensywniej", "dodatkowy ciężar", "dodatkowe tarcie",
  "spalona", "łagodny malefik",
  // finanseWedyjskie.ts/zdrowieWedyjski.ts — dedykowane silniki domenowe,
  // ten sam mechanizm kolorowania
  "niepotwierdzone w nawamszy", "słaba w daśamszy", "osłabia Indu Lagnę",
  // odpowiedniki angielskie (locale="en") — ten sam mechanizm dopasowania,
  // patrz komentarz przy ocenaWladcy() o parametrze locale
  "weakened", "natural malefic", "functional burden", "lord of the 8th house",
  "kendradhipati dosha", "enemy's sign", "debilitated", "sign lord weakened",
  "weak in the navamsa", "acts more intensely", "extra weight", "extra friction",
  "combust", "mild malefic",
  "not confirmed in the navamsa", "weak in the dashamsha", "weakens the Indu Lagna",
];
export function znakCzynnika(tekst: string): 1 | -1 {
  return CZYNNIKI_MINUS.some((m) => tekst.includes(m)) ? -1 : 1;
}
