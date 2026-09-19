import { GRAHAS, RASIS, type PlanetId } from "./constants";
import { FRIENDS, ENEMIES, type VedicChart } from "./chart";
import { norm360 } from "./math";
import {
  navamsaSign, dashamsaSign, drekkanaSign, chaturthamsaSign, saptamsaSign,
  dwadasamsaSign, horaLord, trimsamszaWladca,
} from "./varga";
import { wschodyZachody, sankrantiPrzed } from "./ephemeris";
import { eclipticToEquatorial } from "./astrocarto";
import { ayanamsa } from "./ayanamsa";

/**
 * SZADBALA (BPHS) — sześcioraka, liczbowa siła planet (Sthana, Dig, Kala,
 * Czeszta, Naisargika, Drik Bala), wyrażona w wirupach (60 wirup = 1 rupa).
 *
 * Liczona TYLKO dla siedmiu grah klasycznych (jak Asztakawarga) — Rahu/Ketu
 * nie mają w BPHS własnej tabeli Szadbali.
 *
 * Zakres i pewność źródeł — jawnie, bo różne części tego systemu mają
 * bardzo różną jakość potwierdzenia w dostępnych źródłach:
 *  PEWNE (wiele niezależnych, zgodnych źródeł, matematycznie spójne):
 *   - Naisargika Bala — stałe wartości.
 *   - Dig Bala — czysty wzór kątowy z już policzonego MC/Ascendentu.
 *   - Sthana Bala: Uczcza, Kendradi, Odźajugmaraśjamsza, Drekkana Bala.
 *  UPROSZCZONE ŚWIADOMIE (źródła niejednoznaczne albo wymagają danych,
 *  których nie da się wiarygodnie potwierdzić bez dostępu do oryginału
 *  BPHS w sanskrycie — nie zgadujemy dokładnych progów):
 *   - Czeszta Bala — ciągła interpolacja wg realnej prędkości względem
 *     średniej (już policzonej w ephemeris.ts), zamiast ośmiu nazwanych
 *     stanów (Wakra/Anuwakra/...), których dokładne progi prędkości
 *     różnią się między dostępnymi źródłami.
 *   - Drik Bala — krzywa siły aspektu wg odległości kątowej (potwierdzone
 *     punkty: 0 przy 30°, 15 przy 60°, 45 przy 90°, 30 przy 120°, 0 przy
 *     150°, 60 przy 180°), interpolowana liniowo między punktami.
 *   - Kala Bala: Paksza Bala — czysty wzór z elongacji Księżyc-Słońce.
 *   - Kala Bala: Nathonnata Bala — potwierdzone punkty (30 na wschodzie/
 *     zachodzie Słońca, 60 na szczycie „własnej" pory doby, Merkury zawsze
 *     60), interpolowane liniowo; wymaga dokładnego wschodu/zachodu Słońca
 *     w miejscu urodzenia (SearchRiseSet z astronomy-engine, już w projekcie).
 *   - Kala Bala: Tribhaga Bala — dzień/noc podzielone na 3 (Merkury/Słońce/
 *     Saturn za dnia, Księżyc/Wenus/Mars w nocy, Jowisz zawsze 60) — reguła
 *     binarna (60 albo 0), potwierdzona wprost.
 *   - Kala Bala: Dina i Hora Bala — władca dnia tygodnia (45) i władca
 *     godziny planetarnej liczonej w kolejności chaldejskiej od wschodu
 *     Słońca (60). Władca dnia liczony z LOKALNEGO CZASU ŚREDNIEGO (długość
 *     geograficzna/15h), nie strefy cywilnej — klasyczna konwencja: doba
 *     wedyjska zaczyna się o wschodzie Słońca w miejscu urodzenia, nie
 *     o północy w administracyjnej strefie czasowej.
 *   - Kala Bala: Warsza Bala (władca roku, maks. 15) i Masa Bala (władca
 *     miesiąca, maks. 30) — dostępne źródła różnią się co do EPOKI, od
 *     której liczyć narastające lata/miesiące (część źródeł każe liczyć od
 *     początku Kali Jugi, inne od innych punktów odniesienia) — to jest
 *     dokładnie ten rodzaj rozbieżności, którego nie da się rozstrzygnąć
 *     bez dostępu do oryginału. Świadomie WYBRANA konwencja, która tej
 *     niejednoznaczności unika: władcą roku/miesiąca jest planeta dnia
 *     tygodnia (ta sama tabela i ta sama zasada LOKALNEGO CZASU ŚREDNIEGO
 *     co przy Dinie/Horze), na który przypadła ostatnia sankranti PRZED
 *     urodzeniem — Mesza Sankranti (wejście Słońca w syderycznego Barana,
 *     SearchSunLongitude z astronomy-engine) dla roku, wejście Słońca w
 *     znak, w którym stoi ono w chwili urodzenia, dla miesiąca. Dzień
 *     tygodnia jest faktem kalendarzowym niezależnym od epoki odniesienia,
 *     więc ta metoda wyznaczenia władcy jest jednoznaczna — sporne są tylko
 *     inne, tu świadomie nieużyte metody.
 *   - Kala Bala: Ajana Bala — czysty wzór z deklinacji (Kranti) planety,
 *     policzonej z już istniejącej, przetestowanej eclipticToEquatorial()
 *     z astrocarto.ts. Trzy grupy planet wg tego, gdzie mają maksimum
 *     (Rak/Rak-i-Koziorożec/Koziorożec) — matematycznie spójne (0 wirup
 *     przy skrajnej deklinacji przeciwnej, 30 przy równonocy, 60 przy
 *     szczycie), bez interpolacji czy zgadywania progów.
 *   - Juddha Bala (wojna planet) — REGUŁA ZWYCIĘSTWA potwierdzona wprost
 *     (wygrywa większa szerokość ekliptyczna PÓŁNOCNA, Wenus odwrotnie),
 *     ale dokładna KWOTA wymienianych wirup jest w dostępnych źródłach
 *     sporna (różne teksty każą dzielić różnicę Szadbali przez różne
 *     wielkości, część wymaga średnicy kątowej planety — nieliczonej tu).
 *     Świadomie przyjęta konwencja: połowa różnicy dotychczasowej Szadbali
 *     między dwoma przeciwnikami — umiarkowana wersja zamiast zgadywania
 *     dokładnego mnożnika któregoś z konkurujących wzorów.
 *
 * Suma poniżej to więc suma WSZYSTKICH policzonych składników — Kala Bala
 * w niej to teraz PEŁNY klasyczny zestaw (Paksza+Nathonnata+Tribhaga+Dina+
 * Hora+Warsza+Masa+Ajana), plus Juddha Bala. Porównanie z klasycznym
 * minimum BPHS wciąż pozostaje przybliżone — nie przez brakujące składniki
 * (już ich nie brakuje), tylko przez świadome uproszczenia wymienione wyżej
 * (Czeszta, Drik i kwota Juddhy).
 */

/** Siedem grah klasycznych, jak w Asztakawardze. */
export const GRAHY_SZADBALI: PlanetId[] = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];

/** Minimalna wymagana siła (rupy) wg BPHS — punkt odniesienia „czy to dużo".
 *  Źródło: 390/360/300/420/390/330/300 wirup (Słońce…Saturn) ÷ 60. */
export const WYMAGANE_RUPY: Record<PlanetId, number> = {
  sun: 6.5, moon: 6, mars: 5, mercury: 7, jupiter: 6.5, venus: 5.5, saturn: 5,
  rahu: 0, ketu: 0,
};

/** ── Naisargika Bala — stała siła naturalna, w krokach 60/7 (Słońce najjaśniejsze, Saturn najsłabsze). ── */
export const NAISARGIKA_BALA: Record<PlanetId, number> = {
  sun: (60 / 7) * 7, moon: (60 / 7) * 6, venus: (60 / 7) * 5, jupiter: (60 / 7) * 4,
  mercury: (60 / 7) * 3, mars: (60 / 7) * 2, saturn: (60 / 7) * 1,
  rahu: 0, ketu: 0,
};

/** Odległość kątowa między dwoma długościami, licząc krótszą drogą (0–180°). */
function odlegloscKolowa(a: number, b: number): number {
  const d = Math.abs(norm360(a) - norm360(b));
  return d > 180 ? 360 - d : d;
}

/**
 * Dig Bala — siła kierunkowa. Słońce/Mars silne na MC (10. dom), Merkury/
 * Jowisz na lagnie (1. dom), Księżyc/Wenus na IC (4. dom), Saturn na
 * Descendencie (7. dom); zerowe w punkcie dokładnie przeciwnym. Wzór:
 * odległość kątowa od punktu ZEROWEJ siły / 3, co daje zakres 0–60 wirup
 * (bo maks. odległość kątowa to 180°, 180/3=60).
 */
export function digBala(chart: VedicChart, id: PlanetId): number | null {
  if (!chart.angles || id === "rahu" || id === "ketu") return null;
  const { ascendant, mc } = chart.angles;
  const punktZerowy: Record<Exclude<PlanetId, "rahu" | "ketu">, number> = {
    sun: norm360(mc + 180), mars: norm360(mc + 180),
    mercury: norm360(ascendant + 180), jupiter: norm360(ascendant + 180),
    moon: mc, venus: mc,
    saturn: ascendant,
  };
  const lon = chart.planets[id].longitude;
  return odlegloscKolowa(lon, punktZerowy[id]) / 3;
}

/* ══════════════════ STHANA BALA (siła pozycyjna) ══════════════════ */

/**
 * Pięciopoziomowa przyjaźń (Panczadha Maitri, BPHS 3.57–58) — łączy
 * przyjaźń naturalną (stałą, z chart.ts) z czasową (z pozycji W TEJ mapie):
 * B jest czasowym przyjacielem A, gdy stoi w 2./3./4./10./11./12. znaku od
 * A, wrogiem — gdy w 1./5./6./7./8./9. Kombinacja obu daje 5 poziomów:
 * przyjaciel+przyjaciel = wielki przyjaciel; wróg+wróg = wielki wróg;
 * mieszane wyniki (przyjaciel+neutralny, wróg+neutralny) dają zwykłego
 * przyjaciela/wroga; przyjaciel+wróg i neutralny+neutralny dają neutralnego.
 */
const CZASOWI_PRZYJACIELE = new Set([2, 3, 4, 10, 11, 12]);

export type PoziomPrzyjazni = "wielki przyjaciel" | "przyjaciel" | "neutralny" | "wróg" | "wielki wróg";

export function pieciorakaPrzyjazn(chart: VedicChart, a: PlanetId, b: PlanetId): PoziomPrzyjazni {
  if (a === b) return "wielki przyjaciel"; // planeta wobec samej siebie — traktowana jak własny znak wyżej, ale dla spójności typu
  const naturalna: "przyjaciel" | "neutralny" | "wróg" =
    FRIENDS[a]?.includes(b) ? "przyjaciel" : ENEMIES[a]?.includes(b) ? "wróg" : "neutralny";
  const signA = chart.planets[a].sign;
  const signB = chart.planets[b].sign;
  const domOdA = ((signB - signA + 12) % 12) + 1;
  const czasowa: "przyjaciel" | "wróg" = CZASOWI_PRZYJACIELE.has(domOdA) ? "przyjaciel" : "wróg";

  if (naturalna === "przyjaciel" && czasowa === "przyjaciel") return "wielki przyjaciel";
  if (naturalna === "wróg" && czasowa === "wróg") return "wielki wróg";
  if (naturalna === "przyjaciel" && czasowa === "wróg") return "neutralny";
  if (naturalna === "wróg" && czasowa === "przyjaciel") return "neutralny";
  if (naturalna === "neutralny") return czasowa === "przyjaciel" ? "przyjaciel" : "wróg";
  return "neutralny"; // naturalna==="przyjaciel"||"wróg" && odpowiadajaca czasowa juz obsluzone wyzej; tu tylko neutralny+neutralny
}

const PUNKTY_PRZYJAZNI: Record<PoziomPrzyjazni, number> = {
  "wielki przyjaciel": 20, "przyjaciel": 15, "neutralny": 10, "wróg": 4, "wielki wróg": 2,
};

/**
 * Saptawargadźa Bala — dignity planety w 7 wargach (D1,D2,D9,D3,D12,D30,D7 wg
 * kolejności użytej niżej), sumowane. Punkty za wpis: mulatrikona 45, własny
 * znak 30, dalej wg pięciopoziomowej przyjazni z władcą znaku tej wargi
 * (wielki przyjaciel 20, przyjaciel 15, neutralny 10, wróg 4, wielki wróg 2).
 * D2 (hora) nie ma znaku — trafienie we „własną" horę (Słońce w horze Słońca,
 * Księżyc w horze Księżyca) liczone jak własny znak (30), reszta jak zwykła
 * planeta w znaku władanym przez tę horę (Lew dla Słońca, Rak dla Księżyca).
 */
function saptawargadzaBala(chart: VedicChart, id: PlanetId): number {
  const p = chart.planets[id];
  const mt = GRAHAS[id].mulatrikona;

  // D1 osobno: mulatrikona jest ściśle stopniowa (wąski wycinek 0–30° w obrębie
  // znaku, patrz dignityOf() w chart.ts) — sprawdzamy dokładnie tak samo
  // (mt.from/mt.to), inaczej planeta w tym samym znaku co mulatrikona, ale POZA
  // jej właściwym zakresem stopni, dostawała niesłusznie pełne 45 zamiast 30.
  let suma: number;
  if (mt && mt.sign === p.sign && p.degreeInSign >= mt.from && p.degreeInSign < mt.to) {
    suma = 45;
  } else if (GRAHAS[id].ownSigns.includes(p.sign)) {
    suma = 30;
  } else {
    suma = PUNKTY_PRZYJAZNI[pieciorakaPrzyjazn(chart, id, RASIS[p.sign].lord)];
  }

  // pozostałe 6 warg — mulatrikona sprawdzana tylko po znaku, bez odpowiednika
  // stopnia: to świadome uproszczenie, bo źródła nie zgadzają się, czy
  // stopniową mulatrikonę stosować poza D1 (część oprogramowania w ogóle jej
  // tam nie przyznaje).
  const wargi: number[] = [
    horaLord(p.longitude) === "sun" ? 4 : 3, // D2: Lew(4)/Rak(3) jako umowny "znak" hory
    drekkanaSign(p.longitude),
    navamsaSign(p.longitude),
    dwadasamsaSign(p.longitude),
    saptamsaSign(p.longitude),
  ];
  for (const znak of wargi) {
    if (mt && mt.sign === znak) { suma += 45; continue; }
    if (GRAHAS[id].ownSigns.includes(znak)) { suma += 30; continue; }
    const wladca = RASIS[znak].lord;
    suma += PUNKTY_PRZYJAZNI[pieciorakaPrzyjazn(chart, id, wladca)];
  }
  // D30 (trimsamsza) — bez znaku, władca segmentu bezpośrednio z tabeli pięciu grah
  const wladcaD30 = trimsamszaWladca(p.longitude);
  suma += wladcaD30 === id ? 30 : PUNKTY_PRZYJAZNI[pieciorakaPrzyjazn(chart, id, wladcaD30)];
  return suma;
}

/** Uczcza Bala — odległość od punktu upadku / 3 (180°→60 wirup = 1 rupa przy dokładnej egzaltacji, 0 przy dokładnym upadku). */
function uczczaBala(chart: VedicChart, id: PlanetId): number {
  const deb = GRAHAS[id].debilitation;
  if (!deb) return 30; // nie powinno wystąpić — filtrowane wyżej do 7 grah klasycznych, które zawsze mają debilitation
  const punktUpadku = deb.sign * 30 + deb.degree;
  const lon = chart.planets[id].longitude;
  return odlegloscKolowa(lon, punktUpadku) / 3;
}

const KENDRY = [1, 4, 7, 10];
const PANAPARY = [2, 5, 8, 11];

/** Kendradi Bala — 60/30/15 wg typu domu (od lagny). */
function kendradiBala(chart: VedicChart, id: PlanetId): number | null {
  if (!chart.angles) return null;
  const dom = chart.planets[id].house;
  if (KENDRY.includes(dom)) return 60;
  if (PANAPARY.includes(dom)) return 30;
  return 15;
}

const MASKULINE: PlanetId[] = ["sun", "mars", "jupiter"];
const FEMININE: PlanetId[] = ["moon", "venus"];

/**
 * Odźajugmaraśjamsza Bala — 15+15 za stanie w „swoim" znaku (nieparzysty/
 * parzysty) w D1 i D9. Męskie (Słońce, Mars, Jowisz) i TRAKTOWANE JAK MĘSKIE
 * dla tej reguły neutralne (Merkury, Saturn) chcą znaku nieparzystego;
 * żeńskie (Księżyc, Wenus) chcą parzystego.
 */
function odzajugmaBala(chart: VedicChart, id: PlanetId): number {
  const signD1 = chart.planets[id].sign;
  const signD9 = navamsaSign(chart.planets[id].longitude);
  const chceNieparzysty = !FEMININE.includes(id); // wszystko poza Księżycem/Wenus chce nieparzystego
  const pasujeD1 = (signD1 % 2 === 0) === chceNieparzysty; // 0-based parzysty indeks = 1., 3., 5. znak = "nieparzysty" w BPHS
  const pasujeD9 = (signD9 % 2 === 0) === chceNieparzysty;
  return (pasujeD1 ? 15 : 0) + (pasujeD9 ? 15 : 0);
}

/** Drekkana Bala — 15 wirup, jeśli planeta stoi w „swojej" 1/3 znaku wg płci (męskie 0–10°, żeńskie 10–20°, nijakie/Merkury-Saturn 20–30°). */
function drekkanaBala(chart: VedicChart, id: PlanetId): number {
  const d = chart.planets[id].degreeInSign;
  const trzecia = d < 10 ? "meska" : d < 20 ? "zenska" : "nijaka";
  const plec = MASKULINE.includes(id) ? "meska" : FEMININE.includes(id) ? "zenska" : "nijaka";
  return trzecia === plec ? 15 : 0;
}

export interface SthanaBala {
  uczcza: number; saptawargadza: number; odzajugma: number; kendradi: number; drekkana: number;
  razem: number;
}

/** Sthana Bala — suma pięciu podskładników (maks. 30+315(uwaga: tu z D30 razem 7 warg)+30+60+15). */
export function sthanaBala(chart: VedicChart, id: PlanetId): SthanaBala | null {
  const kendradi = kendradiBala(chart, id);
  if (kendradi === null) return null;
  const uczcza = uczczaBala(chart, id);
  const saptawargadza = saptawargadzaBala(chart, id);
  const odzajugma = odzajugmaBala(chart, id);
  const drekkana = drekkanaBala(chart, id);
  return { uczcza, saptawargadza, odzajugma, kendradi, drekkana, razem: uczcza + saptawargadza + odzajugma + kendradi + drekkana };
}

/* ══════════════════ CZESZTA BALA (siła ruchu) — uproszczona ══════════════════ */

/** Średnia dobowa prędkość (°/dzień) — stałe, niesporne wartości astronomiczne (360°/okres orbitalny). */
const SREDNIA_PREDKOSC: Partial<Record<PlanetId, number>> = {
  mercury: 4.0923, venus: 1.6021, mars: 0.5240, jupiter: 0.08308, saturn: 0.03346,
};

/**
 * Czeszta Bala — UPROSZCZONA (patrz nagłówek pliku): ciągła krzywa zamiast
 * ośmiu nazwanych stanów. Retrogradacja = maksimum potwierdzone wszędzie
 * (60 wirup). W ruchu prostym: im bardziej prędkość odbiega (w dowolną
 * stronę) od własnej średniej planety, tym wyższa wartość — z minimum przy
 * prędkości dokładnie średniej (potwierdzony punkt: Sama = 7,5 wirupy).
 * Słońce i Księżyc mają w BPHS zamienniki (Ajana/Paksza Bala, część Kala
 * Bali) — tu nieliczone, stąd null.
 */
export function czesztaBala(chart: VedicChart, id: PlanetId): number | null {
  const srednia = SREDNIA_PREDKOSC[id];
  if (!srednia) return null; // sun, moon, rahu, ketu
  const predkosc = chart.planets[id].speed;
  if (predkosc < 0) return 60; // Wakra — retrogradacja
  const stosunek = predkosc / srednia;
  if (stosunek < 0.05) return 15; // niemal stacjonarna
  const odchylenie = Math.abs(stosunek - 1);
  return Math.min(45, 7.5 + odchylenie * 30);
}

/* ══════════════════ DRIK BALA (siła aspektu) — uproszczona ══════════════════ */

/** Siła aspektu wg odległości kątowej (0–180°) — interpolacja liniowa między potwierdzonymi punktami klasycznej tabeli. */
function silaAspektu(separacja: number): number {
  const t = separacja > 180 ? 360 - separacja : separacja;
  const kotwice: [number, number][] = [[0, 0], [30, 0], [60, 15], [90, 45], [120, 30], [150, 0], [180, 60]];
  for (let i = 1; i < kotwice.length; i++) {
    const [x0, y0] = kotwice[i - 1];
    const [x1, y1] = kotwice[i];
    if (t <= x1) return y0 + (y1 - y0) * (t - x0) / (x1 - x0);
  }
  return 0;
}

/** Charakter dobroczynny/złośliwy do Drik Bali — wg źródła tylko Jowisz/Wenus (+), Słońce/Mars/Saturn (−), Księżyc wg jasnej/ciemnej połowy; Merkury/węzły nie liczone. */
function charakterDlaDrik(chart: VedicChart, id: PlanetId): 1 | -1 | 0 {
  if (id === "jupiter" || id === "venus") return 1;
  if (id === "sun" || id === "mars" || id === "saturn") return -1;
  if (id === "moon") {
    const elong = norm360(chart.planets.moon.longitude - chart.planets.sun.longitude);
    return elong < 180 ? 1 : -1;
  }
  return 0;
}

/** Drik Bala — suma aspektów innych grah, ważona dobroczynnością/złośliwością aspektującego. */
export function drikBala(chart: VedicChart, id: PlanetId): number {
  const lonP = chart.planets[id].longitude;
  let suma = 0;
  for (const inny of GRAHY_SZADBALI) {
    if (inny === id) continue;
    const znak = charakterDlaDrik(chart, inny);
    if (znak === 0) continue;
    const separacja = norm360(lonP - chart.planets[inny].longitude);
    suma += znak * silaAspektu(separacja);
  }
  return suma;
}

/* ══════════════════ KALA BALA (siła czasowa) — częściowa: Paksza + Nathonnata ══════════════════ */

/** Dobroczynność do Paksza Bali — Merkury i Księżyc liczone jako dobroczynne (inna lista niż w Drik Bali celowo — różne konwencje różnych składników, obie potwierdzone niezależnie). */
const KALA_DOBROCZYNNE: PlanetId[] = ["moon", "mercury", "jupiter", "venus"];

/**
 * Paksza Bala — z odległości kątowej Księżyc-Słońce, złożonej wokół pełni
 * (180°): folded = elongacja, jeśli ≤180°, inaczej 360°−elongacja. Dobro-
 * czyńcy dostają folded/3 (maks. 60 przy pełni), źli 60 minus to samo.
 */
export function pakszaBala(chart: VedicChart, id: PlanetId): number {
  const elongRaw = norm360(chart.planets.moon.longitude - chart.planets.sun.longitude);
  const folded = elongRaw > 180 ? 360 - elongRaw : elongRaw;
  const dlaDobroczyncy = folded / 3;
  return KALA_DOBROCZYNNE.includes(id) ? dlaDobroczyncy : 60 - dlaDobroczyncy;
}

const DZIENNE: PlanetId[] = ["sun", "jupiter", "venus"];
const NOCNE: PlanetId[] = ["moon", "mars", "saturn"];

/**
 * Nathonnata Bala — dzienne grahy (Słońce, Jowisz, Wenus) szczytują w
 * południe, nocne (Księżyc, Mars, Saturn) o północy; Merkury zawsze 60.
 * Na granicy wschód/zachód WSZYSTKIE (poza Merkurym) mają 30 — potwierdzony
 * punkt. Między granicą a szczytem/dołkiem — interpolacja liniowa (brak
 * potwierdzonej dokładnej krzywej trygonometrycznej w dostępnych źródłach,
 * patrz nagłówek pliku).
 */
export function nathonnataBala(chart: VedicChart, id: PlanetId): number | null {
  if (id === "mercury") return 60;
  const dzienna = DZIENNE.includes(id);
  const nocna = NOCNE.includes(id);
  if (!dzienna && !nocna) return null; // rahu/ketu — filtrowane wyżej, nie powinno wystąpić
  const wz = wschodyZachody(chart.birth.date, chart.birth.latitude, chart.birth.longitude);
  if (!wz) return null; // koło podbiegunowe — brak wschodu/zachodu
  const t = chart.birth.date.getTime();

  let dt: number; // 0 = w środku „własnej" pory (dzień dla dziennych, noc dla nocnych), 1 = na granicy wschód/zachód
  if (wz.urodzenieZaDnia) {
    const srodekDnia = (wz.wschodPrzed.getTime() + wz.zachodPo.getTime()) / 2;
    const polDnia = (wz.zachodPo.getTime() - wz.wschodPrzed.getTime()) / 2;
    dt = Math.min(1, Math.abs(t - srodekDnia) / polDnia);
    return dzienna ? 60 - dt * 30 : dt * 30;
  }
  const srodekNocy = (wz.zachodPrzed.getTime() + wz.wschodPo.getTime()) / 2;
  const polNocy = (wz.wschodPo.getTime() - wz.zachodPrzed.getTime()) / 2;
  dt = Math.min(1, Math.abs(t - srodekNocy) / polNocy);
  return nocna ? 60 - dt * 30 : dt * 30;
}

const TRIBHAGA_DZIEN: PlanetId[] = ["mercury", "sun", "saturn"];
const TRIBHAGA_NOC: PlanetId[] = ["moon", "venus", "mars"];

/**
 * Tribhaga Bala — dzień i noc podzielone na 3 równe części. Merkury/Słońce/
 * Saturn władają kolejnymi trzeciami dnia, Księżyc/Wenus/Mars — nocy;
 * Jowisz ma zawsze 60. Reguła binarna: 60 dla władcy aktualnej trzeciej,
 * 0 dla reszty (potwierdzone wprost, bez interpolacji).
 */
export function tribhagaBala(chart: VedicChart, id: PlanetId): number | null {
  if (id === "jupiter") return 60;
  const wz = wschodyZachody(chart.birth.date, chart.birth.latitude, chart.birth.longitude);
  if (!wz) return null;
  const t = chart.birth.date.getTime();
  let wladca: PlanetId;
  if (wz.urodzenieZaDnia) {
    const dlugoscDnia = wz.zachodPo.getTime() - wz.wschodPrzed.getTime();
    const idx = Math.min(2, Math.floor(((t - wz.wschodPrzed.getTime()) / dlugoscDnia) * 3));
    wladca = TRIBHAGA_DZIEN[idx];
  } else {
    const dlugoscNocy = wz.wschodPo.getTime() - wz.zachodPrzed.getTime();
    const idx = Math.min(2, Math.floor(((t - wz.zachodPrzed.getTime()) / dlugoscNocy) * 3));
    wladca = TRIBHAGA_NOC[idx];
  }
  return id === wladca ? 60 : 0;
}

/** Władcy 7 dni tygodnia — indeks 0 = niedziela, jak JS Date.getUTCDay(). */
const WLADCY_DNI: PlanetId[] = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];
/** Kolejność chaldejska godzin planetarnych. */
const CHALDEJSKA: PlanetId[] = ["sun", "venus", "mercury", "moon", "saturn", "jupiter", "mars"];

/**
 * Władca dnia tygodnia liczony z LOKALNEGO CZASU ŚREDNIEGO wschodu Słońca
 * (długość geograficzna/15h przesunięcia od UTC) — doba wedyjska zaczyna
 * się o wschodzie, nie o północy w strefie cywilnej, więc świadomie NIE
 * używamy tu strefy administracyjnej (inaczej niż nigdzie indziej w tym
 * pliku nie ma dostępu do lokalnej daty kalendarzowej z formularza).
 */
function wladcaDnia(wschod: Date, dlugoscGeogr: number): PlanetId {
  const lokalny = new Date(wschod.getTime() + (dlugoscGeogr / 15) * 3600000);
  return WLADCY_DNI[lokalny.getUTCDay()];
}

/** Dina Bala — władca dnia tygodnia (od wschodu poprzedzającego urodzenie) dostaje 45. */
export function dinaBala(chart: VedicChart, id: PlanetId): number | null {
  const wz = wschodyZachody(chart.birth.date, chart.birth.latitude, chart.birth.longitude);
  if (!wz) return null;
  return id === wladcaDnia(wz.wschodPrzed, chart.birth.longitude) ? 45 : 0;
}

/**
 * Hora Bala — godzina planetarna: dzień i noc dzielone na 12 nierównych
 * części każda (czas trwania dnia/nocy ÷ 12), pierwsza godzina dnia należy
 * do władcy dnia tygodnia, kolejne cyklicznie wg kolejności chaldejskiej.
 * Władca aktualnej godziny w chwili urodzenia dostaje 60.
 */
export function horaBala(chart: VedicChart, id: PlanetId): number | null {
  const wz = wschodyZachody(chart.birth.date, chart.birth.latitude, chart.birth.longitude);
  if (!wz) return null;
  const t = chart.birth.date.getTime();
  const dinaWladca = wladcaDnia(wz.wschodPrzed, chart.birth.longitude);
  let n: number;
  if (wz.urodzenieZaDnia) {
    const dlugoscDnia = wz.zachodPo.getTime() - wz.wschodPrzed.getTime();
    n = Math.min(11, Math.floor(((t - wz.wschodPrzed.getTime()) / dlugoscDnia) * 12));
  } else {
    const dlugoscNocy = wz.wschodPo.getTime() - wz.zachodPrzed.getTime();
    n = 12 + Math.min(11, Math.floor(((t - wz.zachodPrzed.getTime()) / dlugoscNocy) * 12));
  }
  const startIdx = CHALDEJSKA.indexOf(dinaWladca);
  const wladcaGodziny = CHALDEJSKA[(startIdx + n) % 7];
  return id === wladcaGodziny ? 60 : 0;
}

const OBLIQUITY = 23.45; // 23°27' — nachylenie ekliptyki, w praktyce ~stałe w skali ludzkiego życia
/** Maksimum przy deklinacji −23,45° (blisko 0° Koziorożca) — reszta (poza Merkurym) ma maksimum przy +23,45° (Rak). */
const GRUPA_KOZIOROZEC: PlanetId[] = ["moon", "saturn"];

/**
 * Ajana Bala — z deklinacji (Kranti) planety. Trzy grupy: Słońce/Mars/
 * Jowisz/Wenus mają maksimum (60) przy deklinacji +23,45° (Rak), zero przy
 * −23,45° (Koziorożec); Księżyc/Saturn odwrotnie; Merkury ma maksimum przy
 * OBU skrajnościach (|deklinacja|). Przy równonocy (deklinacja 0) każda
 * planeta ma 30 — potwierdzone wprost, niezależnie od grupy.
 */
export function ajanaBala(chart: VedicChart, id: PlanetId): number {
  const p = chart.planets[id];
  const tropikalna = norm360(p.longitude + chart.ayanamsa);
  const { dec } = eclipticToEquatorial(tropikalna, p.latitude, chart.birth.date);
  const kranti = GRUPA_KOZIOROZEC.includes(id) ? -dec : id === "mercury" ? Math.abs(dec) : dec;
  return 60 * (OBLIQUITY + kranti) / (2 * OBLIQUITY);
}

/**
 * Władca dnia tygodnia (ta sama tabela i lokalny czas średni co Dina Bala),
 * na który przypada podana chwila w podanym miejscu — pomocnicza funkcja
 * dzieląca Warszę/Masę Balę o tę samą logikę.
 */
function wladcaOkresu(chwila: Date, lat: number, lon: number): PlanetId | null {
  const wz = wschodyZachody(chwila, lat, lon);
  if (!wz) return null;
  return wladcaDnia(wz.wschodPrzed, lon);
}

/**
 * Warsza Bala — władca roku (patrz nagłówek pliku po wybraną konwencję)
 * dostaje 15 wirup, reszta 0. Szuka Meszy Sankranti (Słońce wchodzi w
 * syderycznego Barana) w oknie do 370 dni przed urodzeniem — dłużej niż
 * jeden rok tropikalny, więc trafienie jest zawsze dokładnie jedno.
 */
export function warszaBala(chart: VedicChart, id: PlanetId): number | null {
  const targetTropikalny = norm360(ayanamsa(chart.birth.date)); // syderyczne 0° Barana = tropikalnie tyle, ile wynosi ayanamsa
  const sankranti = sankrantiPrzed(targetTropikalny, chart.birth.date, 370);
  if (!sankranti) return null;
  const wladca = wladcaOkresu(sankranti, chart.birth.latitude, chart.birth.longitude);
  return wladca === null ? null : id === wladca ? 15 : 0;
}

/**
 * Masa Bala — władca miesiąca (patrz nagłówek pliku) dostaje 30 wirup,
 * reszta 0. Szuka sankranti wejścia Słońca w znak, w którym stoi ono w
 * chwili urodzenia, w oknie do 40 dni przed urodzeniem — dłużej niż
 * najdłuższy możliwy syderyczny miesiąc słoneczny (~32 dni), więc trafienie
 * jest zawsze dokładnie jedno.
 */
export function masaBala(chart: VedicChart, id: PlanetId): number | null {
  const poczatekZnaku = chart.planets.sun.sign * 30;
  const targetTropikalny = norm360(poczatekZnaku + ayanamsa(chart.birth.date));
  const sankranti = sankrantiPrzed(targetTropikalny, chart.birth.date, 40);
  if (!sankranti) return null;
  const wladca = wladcaOkresu(sankranti, chart.birth.latitude, chart.birth.longitude);
  return wladca === null ? null : id === wladca ? 30 : 0;
}

/** Suma wszystkiego OPRÓCZ Juddha Bali — potrzebna osobno, żeby Juddha (poniżej) mogła porównać dwóch przeciwników bez rekurencji. */
function sumaBezJuddhy(chart: VedicChart, id: PlanetId) {
  const naisargika = NAISARGIKA_BALA[id];
  const dig = digBala(chart, id);
  const sthana = sthanaBala(chart, id);
  const czeszta = czesztaBala(chart, id);
  const drik = drikBala(chart, id);
  const paksza = pakszaBala(chart, id);
  const nathonnata = nathonnataBala(chart, id);
  const tribhaga = tribhagaBala(chart, id);
  const dina = dinaBala(chart, id);
  const hora = horaBala(chart, id);
  const warsza = warszaBala(chart, id);
  const masa = masaBala(chart, id);
  const ajana = ajanaBala(chart, id);
  const razem = naisargika + (dig ?? 0) + (sthana?.razem ?? 0) + (czeszta ?? 0) + drik + paksza
    + (nathonnata ?? 0) + (tribhaga ?? 0) + (dina ?? 0) + (hora ?? 0) + (warsza ?? 0) + (masa ?? 0) + ajana;
  return { naisargika, dig, sthana, czeszta, drik, paksza, nathonnata, tribhaga, dina, hora, warsza, masa, ajana, razem };
}

/** Pięć grah gwiezdnych mogących wejść w Graha Juddhę — Słońce/Księżyc/węzły nie walczą. */
const GRAHY_WOJUJACE: PlanetId[] = ["mars", "mercury", "jupiter", "venus", "saturn"];

/**
 * Zwycięzca pary — JEDNA, spójna decyzja niezależna od tego, z czyjej
 * perspektywy pytamy (inaczej Wenus i jej przeciwnik mogliby „wygrać"
 * jednocześnie, licząc każdy od siebie). Wenus wygrywa będąc bardziej
 * POŁUDNIOWA (Paulisa); reszta — bardziej północna.
 */
function zwyciezcaWojny(a: PlanetId, latA: number, b: PlanetId, latB: number): PlanetId {
  if (a === "venus") return latA < latB ? a : b;
  if (b === "venus") return latB < latA ? b : a;
  return latA > latB ? a : b;
}

/**
 * Juddha Bala (wojna planet) — gdy dwie z pięciu grah gwiezdnych stoją w
 * odległości do 1° od siebie, „wygrywa" ta o większej szerokości
 * ekliptycznej PÓŁNOCNEJ (Wenus odwrotnie — wygrywa będąc na południe od
 * przeciwnika). Dokładna kwota wymienianych wirup jest w dostępnych
 * źródłach SPORNA (różne teksty podają różne wzory, część wymaga średnicy
 * kątowej planety, której tu nie liczymy) — świadomie przyjęta konwencja:
 * połowa różnicy dotychczas policzonej Szadbali (bez samej Juddhy) między
 * dwoma przeciwnikami, dodana zwycięzcy i odjęta pokonanemu. Reguła
 * zwycięstwa jest potwierdzona wprost, kwota — nie; stąd zaokrąglona,
 * umiarkowana wersja zamiast zgadywania dokładnego mnożnika.
 */
export function juddhaBala(chart: VedicChart, id: PlanetId): number {
  if (!GRAHY_WOJUJACE.includes(id)) return 0;
  const lonA = chart.planets[id].longitude;
  for (const przeciwnik of GRAHY_WOJUJACE) {
    if (przeciwnik === id) continue;
    const lonB = chart.planets[przeciwnik].longitude;
    const odleglosc = Math.min(Math.abs(lonA - lonB), 360 - Math.abs(lonA - lonB));
    if (odleglosc > 1) continue;

    const zwyciezca = zwyciezcaWojny(id, chart.planets[id].latitude, przeciwnik, chart.planets[przeciwnik].latitude);

    const razemA = sumaBezJuddhy(chart, id).razem;
    const razemB = sumaBezJuddhy(chart, przeciwnik).razem;
    const polowaRoznicy = Math.abs(razemA - razemB) / 2;
    return zwyciezca === id ? polowaRoznicy : -polowaRoznicy;
  }
  return 0;
}

/* ══════════════════ SUMA ══════════════════ */

export interface WynikSzadbali {
  naisargika: number;
  dig: number | null;
  sthana: SthanaBala | null;
  czeszta: number | null;
  drik: number;
  paksza: number;
  nathonnata: number | null;
  tribhaga: number | null;
  dina: number | null;
  hora: number | null;
  warsza: number | null;
  masa: number | null;
  ajana: number;
  juddha: number;
  /** Suma wszystkich policzonych składników — Kala Bala to tu pełny zestaw: Paksza+Nathonnata+Tribhaga+Dina+Hora+Warsza+Masa+Ajana. */
  razemWirupy: number;
  razemRupy: number;
  wymaganeRupy: number;
}

export function szadbala(chart: VedicChart, id: PlanetId): WynikSzadbali | null {
  if (!GRAHY_SZADBALI.includes(id)) return null;
  const baza = sumaBezJuddhy(chart, id);
  const juddha = juddhaBala(chart, id);
  const razemWirupy = baza.razem + juddha;
  return {
    ...baza, juddha,
    razemWirupy, razemRupy: razemWirupy / 60, wymaganeRupy: WYMAGANE_RUPY[id],
  };
}
