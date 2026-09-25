import type { VedicChart } from "./chart";
import { RASIS, PLANET_ORDER, type PlanetId } from "./constants";
import { SILA_GODNOSCI } from "./domInterpretacja";

/**
 * CHARA DASZA (Dżajmini) — system oparty na ZNAKACH, nie na planetach jak
 * Wimszottari. Odpowiada na inne pytanie niż Wimszottari: nie "jaka energia
 * planetarna działa teraz", ale "który obszar życia (reprezentowany przez
 * znak) jest teraz areną wydarzeń" — naturalne uzupełnienie systemu
 * Dżajminiego, który ta strona już mocno wykorzystuje (Atmakaraka, 8 Karak
 * Czarowych, Karakamsza), ale do tej pory liczyła czas wyłącznie Wimszottari
 * (system Paraśariego).
 *
 * Metoda: wariant K.N. Rao — najpowszechniej używany we współczesnym
 * oprogramowaniu jyotish. Rao świadomie usunął klasyczną poprawkę +1/-1 roku
 * za egzaltację/upadek władcy znaku (starsze szkoły ją stosują — to jeden
 * z niewielu punktów, w których tradycje Dżajminiego faktycznie się różnią,
 * więc różne programy mogą dać nieco inne lata niż tutaj).
 *
 * Zasady:
 * 1. Kolejność 12 mahadaszy w życiu zaczyna się od znaku Lagny. Jeśli Lagna
 *    jest znakiem NIEPARZYSTYM (Baran/Bliźnięta/Lew/Waga/Strzelec/Wodnik),
 *    kolejność biegnie ZGODNIE z zodiakiem; jeśli PARZYSTYM — PRZECIWNIE.
 * 2. Długość (w latach) KAŻDEGO znaku liczona jest NIEZALEŻNIE, wg WŁASNEJ
 *    parzystości tego znaku (nie parzystości Lagny!): liczymy znaki od niego
 *    do znaku, w którym stoi jego władca, w kierunku wyznaczonym przez tę
 *    parzystość. Jeśli władca stoi we własnym znaku — 12 lat. W przeciwnym
 *    razie: tyle lat, ile znaków trzeba minąć, żeby do niego dotrzeć (1-11).
 * 3. Skorpion (współwładcy: Mars i Ketu) oraz Wodnik (Saturn i Rahu): jeśli
 *    jeden ze współwładców stoi w tym właśnie znaku — ignorujemy go, liczymy
 *    od DRUGIEGO. Jeśli obaj tam stoją — 12 lat. Jeśli żaden — używamy
 *    silniejszego wg godności.
 * 4. Antardaszy (podokresów) w obrębie mahadaszy znaku R jest 12, równych
 *    (mahadasza/12), w TEJ SAMEJ kolejności/kierunku co przy liczeniu
 *    długości samego R (nie kierunku całej sekwencji z punktu 1), zaczynając
 *    od R.
 */

export interface CharaOkres {
  sign: number;
  start: Date;
  end: Date;
  lata: number;
}

export interface CharaDasza {
  mahadaszy: CharaOkres[];
}

/** Skorpion i Wodnik mają w Dżajminim dwóch współwładców. */
const WSPOLWLADCY: Partial<Record<number, [PlanetId, PlanetId]>> = {
  7: ["mars", "ketu"], // Skorpion
  10: ["saturn", "rahu"], // Wodnik
};

/** Znak "nieparzysty" w klasycznym (1-indeksowanym) liczeniu — Baran to 1., więc index 0. */
function znakNieparzysty(sign: number): boolean {
  return sign % 2 === 0;
}

export function wladcaDlaCharaDaszy(chart: VedicChart, sign: number): PlanetId {
  const dual = WSPOLWLADCY[sign];
  if (!dual) return RASIS[sign].lord;
  const [a, b] = dual;
  const aTu = chart.planets[a].sign === sign;
  const bTu = chart.planets[b].sign === sign;
  if (aTu && bTu) return a; // obaj u siebie — i tak wyjdzie 12 lat
  if (aTu) return b;
  if (bTu) return a;
  const silaA = SILA_GODNOSCI[chart.planets[a].dignity];
  const silaB = SILA_GODNOSCI[chart.planets[b].dignity];
  return silaA >= silaB ? a : b;
}

/** Długość mahadaszy danego znaku, w latach (1-12), metoda K.N. Rao. */
export function dlugoscZnakuCharaDaszy(chart: VedicChart, sign: number): number {
  const lord = wladcaDlaCharaDaszy(chart, sign);
  const lordSign = chart.planets[lord].sign;
  if (lordSign === sign) return 12;
  const naprzod = znakNieparzysty(sign);
  return naprzod ? (lordSign - sign + 12) % 12 : (sign - lordSign + 12) % 12;
}

const ROK_MS = 365.25 * 24 * 60 * 60 * 1000;

/** Pełna sekwencja 12 mahadaszy Chara Daszy od narodzin. */
export function charaDasza(chart: VedicChart): CharaDasza | null {
  if (!chart.angles) return null;
  const lagna = chart.angles.lagnaSign;
  const kierunek = znakNieparzysty(lagna) ? 1 : -1;

  let kursor = chart.birth.date;
  const mahadaszy: CharaOkres[] = [];
  for (let i = 0; i < 12; i++) {
    const sign = ((lagna + i * kierunek) % 12 + 12) % 12;
    const lata = dlugoscZnakuCharaDaszy(chart, sign);
    const start = kursor;
    const end = new Date(start.getTime() + lata * ROK_MS);
    mahadaszy.push({ sign, start, end, lata });
    kursor = end;
  }
  return { mahadaszy };
}

/** Planety fizycznie stojące w danym znaku (D1) — jeden z trzech udokumentowanych
 *  czynników oceny okresu Chara Daszy, obok siły władcy i Rashi Drishti
 *  (patrz niżej): "znak ocenia się przez jego okupantów, jego aspekty i siłę
 *  jego władcy" (klasyczna zasada, nie tylko wariant K.N. Rao). */
export function okupanciZnaku(chart: VedicChart, sign: number): PlanetId[] {
  return PLANET_ORDER.filter((id) => chart.planets[id].sign === sign);
}

const RUCHOME = [0, 3, 6, 9]; // Chara — Baran, Rak, Waga, Koziorożec
const STALE = [1, 4, 7, 10]; // Sthira — Byk, Lew, Skorpion, Wodnik
const PODWOJNE = [2, 5, 8, 11]; // Dvisva — Bliźnięta, Panna, Strzelec, Ryby

/**
 * RASHI DRISHTI — aspekty ZNAKOWE Dżajminiego (nie planetarne graha dristi,
 * które liczy `aspektuje` w sila.ts). Znaki aspektują się wg STAŁEJ reguły
 * geometrycznej, niezależnie od tego, jakie planety w nich stoją:
 * - znak ruchomy (chara) aspektuje wszystkie stałe (sthira) OPRÓCZ sąsiedniego,
 * - znak stały aspektuje wszystkie ruchome OPRÓCZ sąsiedniego,
 * - znak podwójny (dvisva) aspektuje pozostałe trzy podwójne (bez wyjątku).
 * Relacja jest symetryczna: jeśli A aspektuje B, to B aspektuje A.
 */
export function rashiDrishti(sign: number): number[] {
  if (RUCHOME.includes(sign)) {
    const wykluczony = (sign + 1) % 12;
    return STALE.filter((s) => s !== wykluczony);
  }
  if (STALE.includes(sign)) {
    const wykluczony = (sign - 1 + 12) % 12;
    return RUCHOME.filter((s) => s !== wykluczony);
  }
  return PODWOJNE.filter((s) => s !== sign);
}

/** Antardaszy (12 podokresów) w obrębie jednej mahadaszy — ten sam kierunek co przy jej własnej długości. */
export function charaAntardaszy(maha: CharaOkres): CharaOkres[] {
  const naprzod = znakNieparzysty(maha.sign);
  const krok = (maha.end.getTime() - maha.start.getTime()) / 12;
  const wynik: CharaOkres[] = [];
  for (let i = 0; i < 12; i++) {
    const sign = naprzod ? (maha.sign + i) % 12 : ((maha.sign - i) % 12 + 12) % 12;
    const start = new Date(maha.start.getTime() + i * krok);
    const end = new Date(start.getTime() + krok);
    wynik.push({ sign, start, end, lata: maha.lata / 12 });
  }
  return wynik;
}
