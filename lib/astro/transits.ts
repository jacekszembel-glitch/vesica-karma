import { allPlanets, planetPosition } from "./ephemeris";
import { RASIS, GRAHAS, type PlanetId } from "./constants";
import { norm360 } from "./math";

/**
 * Gochara — tranzyty planet liczone od znaku Księżyca urodzeniowego
 * (klasyczna metoda wedyjska, nie od ascendentu).
 * Plus Sade Sati — 7,5-letni okres Saturna nad Księżycem.
 */

/** Klasyczne domy sprzyjające dla tranzytów poszczególnych planet (od Księżyca). */
const GOOD_HOUSES: Record<PlanetId, number[]> = {
  sun: [3, 6, 10, 11],
  moon: [1, 3, 6, 7, 10, 11],
  mars: [3, 6, 11],
  mercury: [2, 4, 6, 8, 10, 11],
  jupiter: [2, 5, 7, 9, 11],
  venus: [1, 2, 3, 4, 5, 8, 9, 11, 12],
  saturn: [3, 6, 11],
  rahu: [3, 6, 10, 11],
  ketu: [3, 6, 10, 11],
};

export interface TransitInfo {
  id: PlanetId;
  sign: number;
  /** Dom od Księżyca urodzeniowego (1–12). */
  house: number;
  favorable: boolean;
  retro: boolean;
  opis: string;
  /** Kiedy planeta weszła w bieżący znak — null, gdy poza oknem skanowania (dawno temu). */
  wchodzi: Date | null;
  /** Kiedy planeta OSTATECZNIE opuści bieżący znak — null, gdy poza oknem skanowania. */
  wychodzi: Date | null;
}

const HOUSE_THEME: Record<number, string> = {
  1: "ciało, nastrój, sposób bycia",
  2: "pieniądze, rodzina, mowa",
  3: "odwaga, komunikacja, krótkie wyjazdy",
  4: "dom, spokój wewnętrzny, matka",
  5: "twórczość, dzieci, ryzyko",
  6: "praca codzienna, przeszkody, zdrowie",
  7: "partnerstwo, umowy, druga strona",
  8: "transformacja, kryzysy, cudze zasoby",
  9: "sens, nauka, dalekie podróże",
  10: "kariera, status, działanie w świecie",
  11: "zyski, sieć kontaktów, cele",
  12: "wycofanie, wydatki, sen, duchowość",
};

/**
 * Okno skanowania (zasięg wstecz/w przód w dniach + krok próbkowania) dla
 * znalezienia granic znaku każdej z 6 planet gochary — dobrane do tego, jak
 * długo dana planeta zwykle siedzi w jednym znaku (Słońce ~30 dni, Saturn
 * ~2,5 roku), żeby okno na pewno objęło całą wizytę, a krok był na tyle mały,
 * żeby żadnej granicy znaku nie przeskoczyć niezauważenie (patrz uzasadnienie
 * kroku przy Saturnie w saturnLeavesSign — ta sama logika, tylko uogólniona).
 */
const SCAN_CFG: Record<"sun" | "mars" | "jupiter" | "saturn" | "rahu" | "ketu", { maxDays: number; step: number }> = {
  sun: { maxDays: 60, step: 1 },
  mars: { maxDays: 700, step: 3 },
  jupiter: { maxDays: 500, step: 5 },
  saturn: { maxDays: 1150, step: 5 },
  rahu: { maxDays: 650, step: 5 },
  ketu: { maxDays: 650, step: 5 },
};

export function gochara(natalMoonLongitude: number, at = new Date()): TransitInfo[] {
  const natalSign = Math.floor(norm360(natalMoonLongitude) / 30);
  const p = allPlanets(at);
  const ids: PlanetId[] = ["jupiter", "saturn", "rahu", "ketu", "mars", "sun"];
  return ids.map((id) => {
    const sign = Math.floor(p[id].longitude / 30);
    const house = ((sign - natalSign + 12) % 12) + 1;
    const favorable = GOOD_HOUSES[id].includes(house);
    const cfg = SCAN_CFG[id as keyof typeof SCAN_CFG];
    return {
      id, sign, house, favorable,
      retro: p[id].retrograde,
      opis: HOUSE_THEME[house],
      wchodzi: planetEntersSign(id, at, sign, cfg.maxDays, cfg.step),
      wychodzi: planetLeavesSign(id, at, sign, cfg.maxDays, cfg.step),
    };
  });
}

export type SadeSatiPhase = "brak" | "pierwsza (12. dom)" | "szczyt (1. dom)" | "trzecia (2. dom)" | "dhaiya (4. dom)" | "dhaiya (8. dom)";

export interface SadeSati {
  active: boolean;
  phase: SadeSatiPhase;
  house: number;
  /** Opis fazy — rozwojowo, bez straszenia. */
  opis: string;
  /** Kiedy Saturn wszedł w bieżący dom (znak) od Księżyca — zawsze policzone, nie tylko w aktywnej fazie. */
  phaseStart: Date | null;
  /** Przybliżony koniec bieżącej fazy (wejście Saturna w kolejny znak). */
  phaseEnd: Date | null;
  /**
   * Zgrubne oszacowanie (średni ruch dobowy Saturna, bez skanowania dzień po dniu —
   * to i tak przybliżenie na lata, więc dokładność co do doby nie ma tu znaczenia)
   * odległości do najbliższych okien Sade Sati. Sensowne do pokazania TYLKO gdy
   * `active` jest false — gdy Sade Sati akurat trwa, oba te pola nie mają dobrej
   * interpretacji (patrz komentarz przy SATURN_MEAN_DEG_PER_DAY).
   */
  poprzedniaSadeSatiKoniec: Date | null;
  nastepnaSadeSatiStart: Date | null;
}

const DAY_MS = 86400000;

/**
 * Data, w której planeta OSTATECZNIE opuszcza dany znak (uogólnione z myślą
 * pierwotnie tylko o Saturnie — patrz Sade Sati niżej, teraz też o resztę
 * gochary, patrz SCAN_CFG).
 *
 * Nie wystarczy znaleźć pierwszego przekroczenia granicy znaku: planeta
 * retrogradna potrafi cofnąć się do znaku, który właśnie opuściła. Przykład
 * rzeczywisty (Saturn) — wychodzi z Ryb 2027-06-03, wraca 2027-10-21
 * i naprawdę żegna się z nimi dopiero 2028-02-24. Liczenie pierwszego
 * przekroczenia skróciłoby komuś szczyt Sade Sati o 9 miesięcy.
 *
 * Dlatego szukamy OSTATNIEGO dnia w znaku, a potem doprecyzowujemy do doby.
 * Krok próbkowania (STEP) musi być na tyle mały wobec prędkości danej
 * planety, żeby granicy znaku nie przeskoczyć niezauważenie — dobrany
 * osobno dla każdej planety w SCAN_CFG.
 */
function planetLeavesSign(id: PlanetId, from: Date, sign: number, maxDays: number, step: number): Date | null {
  const signAt = (days: number) =>
    Math.floor(planetPosition(id, new Date(from.getTime() + days * DAY_MS)).longitude / 30);

  let lastInside = 0;
  for (let i = step; i <= maxDays; i += step) {
    if (signAt(i) === sign) lastInside = i;
  }
  // wciąż w znaku na końcu okna — nie potrafimy podać daty
  if (lastInside > maxDays - 2 * step) return null;

  for (let i = lastInside + 1; i <= lastInside + step + 1; i++) {
    if (signAt(i) !== sign) return new Date(from.getTime() + i * DAY_MS);
  }
  return null;
}

/**
 * Data, w której planeta WESZŁA w bieżący znak — skan wstecz, zatrzymujemy
 * się na PIERWSZEJ (najbliższej `from`) granicy. W przeciwieństwie do
 * planetLeavesSign to jest poprawne nawet przy retrogradacji: interesuje nas
 * początek BIEŻĄCEGO pobytu w znaku, więc wcześniejsza, starsza wizyta w tym
 * samym znaku (sprzed poprzedniej retrogradacji) ma nie być brana pod uwagę.
 */
function planetEntersSign(id: PlanetId, from: Date, sign: number, maxDays: number, step: number): Date | null {
  const signAt = (daysAgo: number) =>
    Math.floor(planetPosition(id, new Date(from.getTime() - daysAgo * DAY_MS)).longitude / 30);

  for (let i = step; i <= maxDays; i += step) {
    if (signAt(i) === sign) continue;
    for (let j = i - step + 1; j <= i; j++) {
      if (signAt(j) !== sign) return new Date(from.getTime() - (j - 1) * DAY_MS);
    }
    return new Date(from.getTime() - (i - 1) * DAY_MS);
  }
  // caly znak w oknie — planeta weszla w niego dawniej niz siegamy skanem
  return null;
}

/** Zachowane pod starą nazwą dla Sade Sati — te same parametry co dawniej (bez zmiany zachowania). */
function saturnLeavesSign(from: Date, sign: number): Date | null {
  return planetLeavesSign("saturn", from, sign, SCAN_CFG.saturn.maxDays, SCAN_CFG.saturn.step);
}

/**
 * Sredni ruch dobowy Saturna (stopnie/dzien), z syderycznego okresu orbitalnego
 * 29,4571 roku (10 759,22 dnia). Uzywane WYLACZNIE do zgrubnego "za ile lat"
 * dla najblizszego/poprzedniego okna Sade Sati poza aktywna faza — prawdziwy
 * ruch Saturna jest nierowny (retrogradacje), ale na horyzoncie kilkunastu-
 * -trzydziestu lat blad sredniego ruchu to kwestia tygodni, nie lat, wiec
 * zaokraglenie do "okolo X lat" jest uczciwe bez kosztownego skanowania
 * dzien-po-dniu na dekady w przod.
 */
const SATURN_MEAN_DEG_PER_DAY = 360 / 10759.22;

/** Ile dni (zawsze naprzod, 0-360° ruchu) dzieli `fromLon` od poczatku znaku `targetSign`. */
function daysForwardToSign(fromLon: number, targetSign: number, degPerDay: number): number {
  const delta = ((targetSign * 30 - fromLon) % 360 + 360) % 360;
  return delta / degPerDay;
}

/** Ile dni TEMU `fromLon` wychodzi z punktu poczatkowego znaku `targetSign`, licząc wstecz. */
function daysBackToSign(fromLon: number, targetSign: number, degPerDay: number): number {
  const delta = ((fromLon - targetSign * 30) % 360 + 360) % 360;
  return delta / degPerDay;
}

/** Saturn nad Księżycem: Sade Sati (12/1/2) oraz „małe" dhaiya (4 i 8). */
export function sadeSati(natalMoonLongitude: number, at = new Date()): SadeSati {
  const natalSign = Math.floor(norm360(natalMoonLongitude) / 30);
  const p = allPlanets(at);
  const satSign = Math.floor(p.saturn.longitude / 30);
  const house = ((satSign - natalSign + 12) % 12) + 1;

  const map: Partial<Record<number, { phase: SadeSatiPhase; opis: string }>> = {
    12: {
      phase: "pierwsza (12. dom)",
      opis: "Pierwsza faza Sade Sati: czas porządkowania i odpuszczania. Rosną wydatki i potrzeba samotności — to etap sprzątania przed nowym rozdziałem, nie kara.",
    },
    1: {
      phase: "szczyt (1. dom)",
      opis: "Szczyt Sade Sati: Saturn nad Twoim Księżycem. Największa praca nad tożsamością i wytrzymałością. Dbaj o sen, ciało i realne granice — to okres, który buduje charakter.",
    },
    2: {
      phase: "trzecia (2. dom)",
      opis: "Ostatnia faza Sade Sati: tematem są pieniądze, rodzina i mowa. Saturn uczy tu gospodarności i mówienia tylko tego, za czym stoisz. Najtrudniejsze już za Tobą.",
    },
    4: {
      phase: "dhaiya (4. dom)",
      opis: "Kantaka śani (małe dhaiya): 2,5 roku pracy z domem, spokojem wewnętrznym i sprawami rodzinnymi. Dobry czas na remont — także tego wewnętrznego.",
    },
    8: {
      phase: "dhaiya (8. dom)",
      opis: "Asztama śani (małe dhaiya): 2,5 roku transformacji. Wychodzi to, co ukryte. Nie forsuj tempa — to etap przemiany, nie sprintu.",
    },
  };

  const phaseStart = planetEntersSign("saturn", at, satSign, SCAN_CFG.saturn.maxDays, SCAN_CFG.saturn.step);
  const phaseEnd = saturnLeavesSign(at, satSign);

  // dom 12. i 3. od Ksiezyca = poczatek/koniec calej Sade Sati (12-1-2); patrz
  // komentarz przy poprzedniaSadeSatiKoniec/nastepnaSadeSatiStart w interfejsie.
  const sign12 = (natalSign + 11) % 12;
  const sign3 = (natalSign + 2) % 12;
  const poprzedniaSadeSatiKoniec = new Date(at.getTime() - daysBackToSign(p.saturn.longitude, sign3, SATURN_MEAN_DEG_PER_DAY) * DAY_MS);
  const nastepnaSadeSatiStart = new Date(at.getTime() + daysForwardToSign(p.saturn.longitude, sign12, SATURN_MEAN_DEG_PER_DAY) * DAY_MS);

  const hit = map[house];
  if (!hit) {
    return {
      active: false, phase: "brak", house, phaseStart, phaseEnd,
      opis: `Saturn tranzytuje ${house}. dom od Twojego Księżyca (${HOUSE_THEME[house]}) — poza okresami Sade Sati i dhaiya.`,
      poprzedniaSadeSatiKoniec, nastepnaSadeSatiStart,
    };
  }

  return {
    active: house === 12 || house === 1 || house === 2,
    phase: hit.phase, house, opis: hit.opis, phaseStart, phaseEnd,
    poprzedniaSadeSatiKoniec, nastepnaSadeSatiStart,
  };
}

/** Pakiet tranzytów dla AI. */
export function transitsForAI(natalMoonLongitude: number, at = new Date()) {
  const g = gochara(natalMoonLongitude, at);
  const s = sadeSati(natalMoonLongitude, at);
  return {
    tranzyty: g.map((t) => ({
      planeta: GRAHAS[t.id].pl,
      znak: RASIS[t.sign].pl,
      domOdKsiezyca: t.house,
      obszar: t.opis,
      ocena: t.favorable ? "sprzyjający" : "wymagający",
      retro: t.retro || undefined,
      wZnakuOd: t.wchodzi ? t.wchodzi.toISOString().slice(0, 10) : undefined,
      wZnakuDo: t.wychodzi ? t.wychodzi.toISOString().slice(0, 10) : undefined,
    })),
    sadeSati: s.phase === "brak" ? "nie trwa" : { faza: s.phase, opis: s.opis },
  };
}
