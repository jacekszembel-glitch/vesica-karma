import { norm360, formatDMS } from "./math";
import { RASIS, PLANET_ORDER, type PlanetId } from "./constants";
import { dignityOf, signRelacja, type VedicChart, type ChartPlanet } from "./chart";

/**
 * Vargi — wykresy podziałowe (divisional charts).
 * D9 (nawamsza) — małżeństwo, dharma, „owoc" mapy; sprawdzenie siły planet.
 * D10 (daśamsza) — kariera i działanie w świecie.
 */

/** Znak nawamszy (D9): zodiak dzielony na 108 części po 3°20'. */
export function navamsaSign(siderealLongitude: number): number {
  return Math.floor(norm360(siderealLongitude) / (10 / 3)) % 12;
}

/**
 * Znak daśamszy (D10): każdy znak dzielony na 10 części po 3°.
 * Znaki nieparzyste (0,2,4…): licząc od tego samego znaku;
 * parzyste (1,3,5…): licząc od 9. znaku od niego.
 */
export function dashamsaSign(siderealLongitude: number): number {
  const lon = norm360(siderealLongitude);
  const sign = Math.floor(lon / 30);
  const part = Math.floor((lon - sign * 30) / 3);
  const start = sign % 2 === 0 ? sign : (sign + 8) % 12;
  return (start + part) % 12;
}

/**
 * Znak drekkany (D3): każdy znak dzielony na 3 części po 10° — rodzeństwo, odwaga.
 * BPHS: 1. część (0–10°) → ten sam znak; 2. część (10–20°) → 5. znak od niego;
 * 3. część (20–30°) → 9. znak od niego (schemat trikonalny, ten sam co w D9-podobnych podziałach).
 */
export function drekkanaSign(siderealLongitude: number): number {
  const lon = norm360(siderealLongitude);
  const sign = Math.floor(lon / 30);
  const part = Math.floor((lon - sign * 30) / 10); // 0,1,2
  return (sign + part * 4) % 12;
}

/**
 * Znak czaturthamszy (D4): każdy znak dzielony na 4 części po 7°30' — dom, majątek, szczęście.
 * BPHS: schemat kendrowy — 1. część → ten sam znak, 2. → 4. znak od niego,
 * 3. → 7. znak od niego, 4. → 10. znak od niego.
 */
export function chaturthamsaSign(siderealLongitude: number): number {
  const lon = norm360(siderealLongitude);
  const sign = Math.floor(lon / 30);
  const part = Math.floor((lon - sign * 30) / 7.5); // 0,1,2,3
  return (sign + part * 3) % 12;
}

/**
 * Znak saptamszy (D7): każdy znak dzielony na 7 części po 30/7° — dzieci, potomność.
 * BPHS: w znakach nieparzystych (Baran, Bliźnięta, Lew, Waga, Strzelec, Wodnik —
 * indeksy 0,2,4,6,8,10) liczenie zaczyna się od tego samego znaku; w znakach
 * parzystych — od 7. znaku od niego. Kolejne części to kolejne znaki od startu.
 */
export function saptamsaSign(siderealLongitude: number): number {
  const lon = norm360(siderealLongitude);
  const sign = Math.floor(lon / 30);
  const part = Math.floor((lon - sign * 30) / (30 / 7)); // 0..6
  const start = sign % 2 === 0 ? sign : (sign + 6) % 12;
  return (start + part) % 12;
}

/**
 * Znak dwadaśamszy (D12): każdy znak dzielony na 12 części po 2°30' — rodzice.
 * BPHS: liczenie zawsze zaczyna się od tego samego znaku (bez rozróżnienia
 * nieparzysty/parzysty, inaczej niż w D7) i biegnie kolejnymi znakami.
 */
export function dwadasamsaSign(siderealLongitude: number): number {
  const lon = norm360(siderealLongitude);
  const sign = Math.floor(lon / 30);
  const part = Math.floor((lon - sign * 30) / 2.5); // 0..11
  return (sign + part) % 12;
}

/**
 * Hora (D2): każdy znak dzielony na 2 połowy po 15° — gromadzenie majątku.
 * BPHS (system Paraśary — inny niż hora dżajminiańska): w znakach nieparzystych
 * 1. połowa → hora Słońca (Lew), 2. połowa → hora Księżyca (Rak); w znakach
 * parzystych odwrotnie. W przeciwieństwie do reszty varg D2 NIE daje pełnego
 * podziału na 12 znaków — każda planeta trafia tylko do jednej z dwóch hor,
 * więc nie ma sensu jako pełny wykres kołowy (wszystkie planety w 1-2 znakach).
 * Zwracamy więc bezpośrednio władcę hory, nie znak.
 */
export function horaLord(siderealLongitude: number): "sun" | "moon" {
  const lon = norm360(siderealLongitude);
  const sign = Math.floor(lon / 30);
  const half = Math.floor((lon - sign * 30) / 15); // 0,1
  const nieparzysty = sign % 2 === 0; // BPHS "nieparzysty" = 1., 3., 5. znak… = indeks parzysty
  if (nieparzysty) return half === 0 ? "sun" : "moon";
  return half === 0 ? "moon" : "sun";
}

/**
 * Trimsamsza (D30): każdy znak dzielony na 5 NIERÓWNYCH części, każda pod
 * władaniem innej z pięciu grah klasycznych (bez Słońca/Księżyca) — używana
 * do oceny obciążeń/afflictions, nie jako pełny wykres znakowy. BPHS:
 * w znakach nieparzystych kolejność i szerokości to Mars(0–5°), Saturn(5–10°),
 * Jowisz(10–18°), Merkury(18–25°), Wenus(25–30°); w znakach parzystych cała
 * sekwencja (władca+szerokość) jest lustrzana: Wenus(0–5°), Merkury(5–12°),
 * Jowisz(12–20°), Saturn(20–25°), Mars(25–30°).
 */
export function trimsamszaWladca(siderealLongitude: number): PlanetId {
  const lon = norm360(siderealLongitude);
  const sign = Math.floor(lon / 30);
  const d = lon - sign * 30;
  const nieparzysty = sign % 2 === 0;
  const progi: [number, PlanetId][] = nieparzysty
    ? [[5, "mars"], [10, "saturn"], [18, "jupiter"], [25, "mercury"], [30, "venus"]]
    : [[5, "venus"], [12, "mercury"], [20, "jupiter"], [25, "saturn"], [30, "mars"]];
  for (const [granica, wladca] of progi) if (d < granica) return wladca;
  return progi[progi.length - 1][1];
}

/** Start liczenia D16/D20 zależy od trójki (modalności) znaku — chara/sthira/dwiswabhawa
 *  koduje się jako sign%3 (0=Baran/Rak/Waga/Koziorożec, 1=Byk/Lew/Skorpion/Wodnik,
 *  2=Bliźnięta/Panna/Strzelec/Ryby — trójki liczone co 3 znak, więc modulo działa wprost). */
const MODALNOSC_START_D16: [number, number, number] = [0, 4, 8]; // chara→Baran, sthira→Lew, dwiswabhawa→Strzelec
const MODALNOSC_START_D20: [number, number, number] = [0, 8, 4]; // chara→Baran, sthira→Strzelec, dwiswabhawa→Lew

/**
 * Znak szodaśamszy (D16): każdy znak dzielony na 16 części po 1°52'30" —
 * pojazdy, komfort i ogólne szczęście/nieszczęście (bywa zwana Kalamsza).
 * BPHS: start liczenia zależy od trójki znaku — chara (kardynalne) od
 * Barana, sthira (stałe) od Lwa, dwiswabhawa (zmienne) od Strzelca.
 */
export function shodasamsaSign(siderealLongitude: number): number {
  const lon = norm360(siderealLongitude);
  const sign = Math.floor(lon / 30);
  const part = Math.floor((lon - sign * 30) / (30 / 16)); // 0..15
  const start = MODALNOSC_START_D16[sign % 3];
  return (start + part) % 12;
}

/**
 * Znak wimszamszy (D20): każdy znak dzielony na 20 części po 1°30' —
 * duchowa praktyka, kult, wrażliwość duchowa. BPHS: start liczenia wg
 * trójki znaku — chara od Barana, sthira (stałe) od Strzelca, dwiswabhawa
 * (zmienne) od Lwa (inna kolejność startów niż w D16, choć te same trójki).
 */
export function vimsamsaSign(siderealLongitude: number): number {
  const lon = norm360(siderealLongitude);
  const sign = Math.floor(lon / 30);
  const part = Math.floor((lon - sign * 30) / 1.5); // 0..19
  const start = MODALNOSC_START_D20[sign % 3];
  return (start + part) % 12;
}

/**
 * Znak czaturwimszamszy (D24): każdy znak dzielony na 24 części po 1°15' —
 * nauka, wiedza; nazywana też Siddhamsza, bo bywa czytana też pod kątem
 * siddhi (duchowych osiągnięć/mocy) jako efektu ubocznego nauki, nie jako
 * główny temat wargi. BPHS: znaki nieparzyste liczone od Lwa, parzyste od Raka.
 */
export function chaturvimsamsaSign(siderealLongitude: number): number {
  const lon = norm360(siderealLongitude);
  const sign = Math.floor(lon / 30);
  const part = Math.floor((lon - sign * 30) / 1.25); // 0..23
  const nieparzysty = sign % 2 === 0; // BPHS "nieparzysty" = 1., 3., 5. znak… = indeks parzysty
  const start = nieparzysty ? 4 : 3; // Lew dla nieparzystych, Rak dla parzystych
  return (start + part) % 12;
}

/**
 * Znak szasztiamszy (D60): każdy znak dzielony na 60 części po 0,5° —
 * najdrobniejsza klasyczna warga, klasycznie czytana jako ślad poprzednich
 * wcieleń i najgłębsza warstwa karmy (stąd powiązanie z Atmakaraką/Profilem
 * Duszy). Znaki nieparzyste: liczenie zaczyna się od tego samego znaku;
 * parzyste: od 7. znaku od niego — dokładnie ten sam schemat co D7/D10,
 * tylko na 60 (nie 7 czy 10) części, więc pełny obrót przez 12 znaków
 * powtarza się 5 razy. Formuła zweryfikowana na przykładach z Jagannatha
 * Hora (0°15' Baran → 1. część → Baran; 0°45' Baran → 2. część → Byk;
 * 1. część Byka [parzysty] → Skorpion). Dokładna derywacja D60 bywa sporna
 * między źródłami (część tekstów przypisuje częściom też odrębne nazwy/
 * bóstwa decydujące o dobro-/złoczynności, nie tylko znak) — świadomie
 * przyjęta konwencja to najszerzej cytowany, spójny z resztą warg wzór.
 */
export function shashtiamsaSign(siderealLongitude: number): number {
  const lon = norm360(siderealLongitude);
  const sign = Math.floor(lon / 30);
  const part = Math.floor((lon - sign * 30) / 0.5); // 0..59
  const nieparzysty = sign % 2 === 0; // BPHS "nieparzysty" = 1., 3., 5. znak… = indeks parzysty
  const start = nieparzysty ? sign : (sign + 6) % 12;
  return (start + part) % 12;
}

/**
 * Vargottama — planeta w tym samym znaku w D1 i D9 (wzmocniona).
 */
export function isVargottama(siderealLongitude: number): boolean {
  return Math.floor(norm360(siderealLongitude) / 30) === navamsaSign(siderealLongitude);
}

/**
 * Buduje kosmogram dowolnej vargi z mapy głównej — wspólny wzorzec dla
 * wszystkich podziałów o pełnych 12 znakach (nie dla D2, patrz horaLord).
 * Chwila i miejsce zostają te same — zmienia się sposób odczytu: `signFn`
 * mówi, do którego znaku trafia dana długość w tym konkretnym podziale;
 * `span` to szerokość jednej części (w stopniach), potrzebna do przeskalowania
 * stopnia WEWNĄTRZ podziału na 30° (w wykresach podziałowych stopień w znaku
 * nie ma tego samego znaczenia co w D1 — bez przeskalowania wykres sugerowałby
 * fałszywą precyzję). Lagna liczona z tego samego signFn na ascendencie, domy
 * odmierzane od niej tak jak w D1. Nakszatra zostaje z mapy głównej — jest
 * własnością rzeczywistej długości ekliptycznej, więc pozostaje prawdziwa.
 */
function buildVargaChart(
  chart: VedicChart,
  signFn: (siderealLongitude: number) => number,
  span: number,
): VedicChart | null {
  if (!chart.angles) return null;

  const lagnaVarga = signFn(chart.angles.ascendant);

  const planets = {} as Record<PlanetId, ChartPlanet>;
  for (const id of PLANET_ORDER) {
    const p = chart.planets[id];
    const sign = signFn(p.longitude);
    const wewnatrz = (norm360(p.longitude) % span) / span * 30;
    planets[id] = {
      ...p,
      sign,
      signPl: RASIS[sign].pl,
      degreeInSign: wewnatrz,
      degreeFormatted: formatDMS(wewnatrz),
      house: ((sign - lagnaVarga + 12) % 12) + 1,
      dignity: dignityOf(id, sign, wewnatrz),
      signRelacja: signRelacja(id, sign),
    };
  }

  return {
    ...chart,
    angles: { ...chart.angles, lagnaSign: lagnaVarga },
    planets,
    moonSign: planets.moon.sign,
    sunSign: planets.sun.sign,
  };
}

/** Kosmogram nawamszy (D9) — małżeństwo, dharma, sprawdzenie siły planet. */
export function navamsaChart(chart: VedicChart): VedicChart | null {
  return buildVargaChart(chart, navamsaSign, 10 / 3);
}

/** Kosmogram daśamszy (D10) — kariera i działanie w świecie. */
export function dashamsaChart(chart: VedicChart): VedicChart | null {
  return buildVargaChart(chart, dashamsaSign, 3);
}

/** Kosmogram drekkany (D3) — rodzeństwo, odwaga, własny wysiłek. */
export function drekkanaChart(chart: VedicChart): VedicChart | null {
  return buildVargaChart(chart, drekkanaSign, 10);
}

/** Kosmogram czaturthamszy (D4) — dom, majątek, wewnętrzne szczęście. */
export function chaturthamsaChart(chart: VedicChart): VedicChart | null {
  return buildVargaChart(chart, chaturthamsaSign, 7.5);
}

/** Kosmogram saptamszy (D7) — dzieci, potomność. */
export function saptamsaChart(chart: VedicChart): VedicChart | null {
  return buildVargaChart(chart, saptamsaSign, 30 / 7);
}

/** Kosmogram dwadaśamszy (D12) — rodzice. */
export function dwadasamsaChart(chart: VedicChart): VedicChart | null {
  return buildVargaChart(chart, dwadasamsaSign, 2.5);
}

/** Kosmogram szodaśamszy (D16) — pojazdy, komfort, ogólne szczęście/nieszczęście. */
export function shodasamsaChart(chart: VedicChart): VedicChart | null {
  return buildVargaChart(chart, shodasamsaSign, 30 / 16);
}

/** Kosmogram wimszamszy (D20) — duchowa praktyka, kult, wrażliwość duchowa. */
export function vimsamsaChart(chart: VedicChart): VedicChart | null {
  return buildVargaChart(chart, vimsamsaSign, 1.5);
}

/** Kosmogram czaturwimszamszy (D24) — nauka, wiedza; Siddhamsza (siddhi jako efekt uboczny). */
export function chaturvimsamsaChart(chart: VedicChart): VedicChart | null {
  return buildVargaChart(chart, chaturvimsamsaSign, 1.25);
}

/** Kosmogram szasztiamszy (D60) — poprzednie wcielenia, najgłębsza warstwa karmy. */
export function shashtiamsaChart(chart: VedicChart): VedicChart | null {
  return buildVargaChart(chart, shashtiamsaSign, 0.5);
}
