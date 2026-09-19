import { GRAHAS, RASIS, type PlanetId } from "./constants";
import type { VedicChart } from "./chart";
import { dignityOf } from "./chart";
import { navamsaSign, isVargottama } from "./varga";
import { jogakaraka } from "./karaki";
import { norm360 } from "./math";
import type { Yoga } from "./yogas";

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
  const zasieg = ASPEKTY[kto];
  if (!zasieg) return false;
  const odleglosc = ((znakCelu - chart.planets[kto].sign + 12) % 12) + 1;
  return zasieg.includes(odleglosc);
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
export function neechaBhanga(chart: VedicChart, lord: PlanetId): string | null {
  const p = chart.planets[lord];
  const znak = p.sign;
  const wladca = RASIS[znak].lord;
  const odniesienia = [chart.angles?.lagnaSign, chart.planets.moon.sign]
    .filter((x): x is number => x !== undefined);

  if (odniesienia.some((od) => wKendrzeOd(chart, wladca, od))) {
    return `neecha bhanga — władca znaku upadku (${GRAHAS[wladca].pl}) w kendrze`;
  }
  const egzaltant = (Object.keys(GRAHAS) as PlanetId[])
    .find((id) => GRAHAS[id].exaltation?.sign === znak);
  if (egzaltant && odniesienia.some((od) => wKendrzeOd(chart, egzaltant, od))) {
    return `neecha bhanga — ${GRAHAS[egzaltant].pl} (egzaltujący się tu) w kendrze`;
  }
  if (lord !== "rahu" && lord !== "ketu") {
    const gd9 = dignityOf(lord, navamsaSign(p.longitude), 15);
    if (gd9 === "egzaltacja" || gd9 === "władanie") {
      return "neecha bhanga — mocna w nawamszy";
    }
  }
  if (aspektuje(chart, wladca, znak)) {
    return `neecha bhanga — aspekt władcy znaku (${GRAHAS[wladca].pl})`;
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
export function ocenaWladcy(chart: VedicChart | null | undefined, lord: PlanetId, jogi: Yoga[] = []): OcenaWladcy {
  const czynniki: string[] = [];
  const g = GRAHAS[lord];
  const p = chart?.planets?.[lord];
  const lagna = chart?.angles?.lagnaSign;

  // ── natura naturalna ──
  let punkty: number;
  if (lord === "sun") {
    punkty = -0.5;
    czynniki.push("łagodny malefik (Słońce)");
  } else if (lord === "moon" && chart) {
    // Księżyc wg fazy przy urodzeniu: blisko nowiu (do 72° od Słońca) osłabiony
    const elong = norm360(chart.planets.moon.longitude - chart.planets.sun.longitude);
    const odSlonca = Math.min(elong, 360 - elong);
    if (odSlonca < 72) {
      punkty = -0.25;
      czynniki.push("Księżyc blisko nowiu — osłabiony");
    } else if (elong < 180) {
      punkty = 0.5;
      czynniki.push("Księżyc jasny, przybywający — dobroczynny");
    } else {
      punkty = 0.25;
      czynniki.push("Księżyc jasny, ubywający");
    }
  } else {
    punkty = g.nature as number;
    if (g.nature === 1) czynniki.push("naturalny dobroczyńca");
    else if (g.nature === -1) czynniki.push("naturalny malefik");
  }

  // ── władztwo funkcyjne ──
  if (lagna !== undefined) {
    if (jogakaraka(lagna) === lord) {
      punkty += 1.5;
      czynniki.push("jogakaraka — władca kendry i trikony dla Twojej lagny");
    } else if (g.ownSigns.length) {
      const domy = wladaneDomy(lord, lagna);
      if (domy.includes(1)) { punkty += 0.5; czynniki.push("władca lagny"); }
      if (domy.some((d) => TRIKONY.includes(d))) {
        punkty += 0.75;
        czynniki.push(`władca trikony (${domy.filter((d) => TRIKONY.includes(d)).join(". i ")}. domu)`);
      }
      const zle = domy.filter((d) => [3, 6, 11].includes(d));
      if (zle.length) {
        punkty -= 0.5 * zle.length;
        czynniki.push(`władca ${zle.map((d) => d + ".").join(" i ")} domu — obciążenie funkcyjne`);
      }
      // luminarze zwolnieni ze skazy 8. domu (BPHS)
      if (domy.includes(8) && !domy.includes(1) && lord !== "sun" && lord !== "moon") {
        punkty -= 0.5;
        czynniki.push("władca 8. domu");
      }
      const BENEFIKI_KENDRADHIPATI: PlanetId[] = ["jupiter", "venus", "mercury", "moon"];
      // 1. dom jest naraz kendrą i trikoną — władca lagny NIE podpada pod doszę
      if (BENEFIKI_KENDRADHIPATI.includes(lord) && domy.length > 0
        && domy.every((d) => KENDRY_BEZ_LAGNY.includes(d))) {
        punkty -= 0.5;
        czynniki.push("kendradhipati dosza — dobroczyńca władający tylko kendrami");
      }
    }
  }

  // ── kondycja w mapie ──
  if (p && chart) {
    if (p.dignity === "egzaltacja") { punkty += 1; czynniki.push("egzaltacja w mapie"); }
    else if (p.dignity === "mulatrikona") { punkty += 1; czynniki.push("mulatrikona"); }
    else if (p.dignity === "władanie") { punkty += 1; czynniki.push("we własnym znaku"); }
    else if (p.dignity === "przyjazny") { punkty += 0.5; czynniki.push("w znaku przyjaciela"); }
    else if (p.dignity === "wrogi") { punkty -= 0.5; czynniki.push("w znaku wroga"); }
    else if (p.dignity === "upadek") {
      const nb = neechaBhanga(chart, lord);
      if (nb) {
        punkty += 0.25; // upadek zniesiony i lekko przekuty w siłę
        czynniki.push(nb);
      } else {
        punkty -= 1;
        czynniki.push("w upadku");
      }
    }

    if (lord === "rahu" || lord === "ketu") {
      // węzły działają też przez władcę znaku i lubią domy wzrostu
      const dysp = RASIS[p.sign].lord;
      const dyspP = chart.planets[dysp];
      if (["egzaltacja", "mulatrikona", "władanie", "przyjazny"].includes(dyspP.dignity)) {
        punkty += 0.5;
        czynniki.push(`działa przez mocnego władcę znaku (${GRAHAS[dysp].pl})`);
      } else if (dyspP.dignity === "upadek" || dyspP.dignity === "wrogi") {
        punkty -= 0.25;
        czynniki.push(`władca znaku osłabiony (${GRAHAS[dysp].pl})`);
      }
      if (lagna !== undefined && UPACZAJA.includes(p.house)) {
        punkty += 0.5;
        czynniki.push(`w domu wzrostu (upaczaja, ${p.house}.)`);
      }
    } else {
      // godność w nawamszy — połowa wagi D1
      const d9 = navamsaSign(p.longitude);
      const gd9 = dignityOf(lord, d9, 15);
      if (gd9 === "egzaltacja" || gd9 === "władanie") {
        punkty += 0.5;
        czynniki.push(`mocna w nawamszy (${gd9} w ${RASIS[d9].pl})`);
      } else if (gd9 === "upadek" && p.dignity !== "upadek") {
        punkty -= 0.5;
        czynniki.push("słaba w nawamszy (upadek)");
      }
      if (isVargottama(p.longitude)) {
        punkty += 0.5;
        czynniki.push("vargottama — ten sam znak w D1 i D9");
      }

      // dig bala — siła kierunkowa (wymaga domów)
      if (lagna !== undefined && DIG_BALA[lord] === p.house) {
        punkty += 0.25;
        czynniki.push("dig bala — siła kierunkowa w swoim domu");
      }

      // retrogradacja (czeszta): wzmacnia naturę planety
      if (p.retrograde) {
        if (g.nature === 1) { punkty += 0.25; czynniki.push("retrogradna — dobroczynność wzmocniona (czeszta)"); }
        else if (g.nature === -1) { punkty -= 0.25; czynniki.push("retrogradna — działa intensywniej (czeszta)"); }
      }
    }

    // aspekty pełne na władcę okresu
    if (lord !== "jupiter" && aspektuje(chart, "jupiter", p.sign)) {
      punkty += 0.4;
      czynniki.push("aspekt Jowisza — osłona dobroczyńcy");
    }
    if (lord !== "venus" && aspektuje(chart, "venus", p.sign)) {
      punkty += 0.25;
      czynniki.push("aspekt Wenus");
    }
    if (lord !== "saturn" && aspektuje(chart, "saturn", p.sign)) {
      punkty -= 0.3;
      czynniki.push("aspekt Saturna — dodatkowy ciężar");
    }
    if (lord !== "mars" && aspektuje(chart, "mars", p.sign)) {
      punkty -= 0.3;
      czynniki.push("aspekt Marsa — dodatkowe tarcie");
    }

    if (p.combust) { punkty -= 0.5; czynniki.push("spalona — blisko Słońca"); }
  }

  // ── udzial w wykrytych jogach — patrz komentarz przy parametrze `jogi` ──
  for (const j of jogi) {
    if (!j.planety.includes(lord)) continue;
    punkty += 0.75;
    czynniki.push(`uczestniczy w ${j.nazwa} — ${j.znaczenie}`);
  }

  const ton = punkty >= 0.5 ? "wspierający" : punkty <= -0.75 ? "wymagający" : "mieszany";
  return { punkty: Math.round(punkty * 100) / 100, ton, czynniki };
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
];
export function znakCzynnika(tekst: string): 1 | -1 {
  return CZYNNIKI_MINUS.some((m) => tekst.includes(m)) ? -1 : 1;
}
