/**
 * Treści interpretacyjne numerologii — warstwa nad tym, co policzą wyliczenia
 * (`numerology()` w numerology.ts). Klasyczne archetypy pitagorejskie dla
 * cyfr 1–9 i liczb mistrzowskich 11/22/33, używane w kilku miejscach
 * (Siatka Lo Shu, Predyspozycje), więc żyją tu jedną wspólną kopią.
 */

import type { NumerologyResult, PoziomRelacjiPlanet } from "./numerology";

/** Bez kropki na końcu, żeby dało się doklejać dalszy ciąg zdania. */
export const ZNACZENIE_CYFRY: Record<number, string> = {
  1: "lider i inicjator — samodzielność, odwaga zaczynania od nowa",
  2: "dyplomata i partner — wrażliwość, współpraca, cierpliwość",
  3: "twórca i komunikator — ekspresja, radość, towarzyskość",
  4: "budowniczy — porządek, dyscyplina, solidne fundamenty",
  5: "wolny duch — zmiana, ciekawość świata, wszechstronność",
  6: "opiekun — odpowiedzialność, rodzina, harmonia, służba innym",
  7: "poszukiwacz i analityk — refleksja, duchowość, potrzeba samotności",
  8: "realizator — ambicja, sprawy materialne, naturalny autorytet",
  9: "humanista — empatia, zamykanie spraw, dawanie z siebie",
  11: "liczba mistrzowska — wzmocniona intuicja i natchnienie (podszyte dwójką)",
  22: "liczba mistrzowska — budowniczy na wielką skalę, wizje wcielane w konkret (podszyte czwórką)",
  33: "liczba mistrzowska — bezwarunkowa służba i nauczanie (podszyte szóstką), rzadka, zwykle dojrzewa później w życiu",
};

/** Redukuje liczbę do pojedynczej cyfry (bez zatrzymywania na liczbach mistrzowskich) — używane tylko do dopasowania do słownika/pozycji, nie do wyświetlania. */
export function cyfraDocelowa(n: number): number {
  while (n > 9) n = String(n).split("").reduce((s, d) => s + Number(d), 0);
  return n;
}

/**
 * Siedem liczb osobistych, którymi wzmacnia się (albo nie) każda cyfra 1–9 —
 * w tym trzy z pełnego imienia i nazwiska (Ekspresja, Dusza, Osobowość).
 * Wspólna baza dla Predyspozycji i „Na co uważać" w numerologii — całościowe
 * ujęcie, nie tylko surowe cyfry z daty urodzenia.
 */
export function liczbyOsobiste(n: NumerologyResult): { etykieta: string; wartosc: number }[] {
  const lista: { etykieta: string; wartosc: number | null }[] = [
    { etykieta: "Droga życia", wartosc: n.lifePath },
    { etykieta: "Mulank", wartosc: n.birthday },
    { etykieta: "Bhagyank", wartosc: n.destiny },
    { etykieta: "Rok osobisty", wartosc: n.personalYear },
    { etykieta: "Ekspresja", wartosc: n.expression },
    { etykieta: "Dusza", wartosc: n.soulUrge },
    { etykieta: "Osobowość", wartosc: n.personality },
  ];
  return lista
    .filter((x): x is { etykieta: string; wartosc: number } => x.wartosc !== null)
    .map((x) => ({ etykieta: x.etykieta, wartosc: cyfraDocelowa(x.wartosc) }));
}

export interface WagaCyfry {
  cyfra: number;
  /** Ile razy cyfra występuje w samej dacie urodzenia (siatka Lo Shu). */
  zDaty: number;
  /** Które liczby osobiste (w tym z imienia i nazwiska) redukują się do tej cyfry. */
  zLiczbOsobistych: string[];
  /** zDaty + liczba trafień wśród liczb osobistych — łączna waga cyfry. */
  razem: number;
}

/** Opis relacji Mulank↔Bhagyank wg poziomu przyjaźni ich planet (patrz mulankBhagyankRelacja w numerology.ts). */
export const OPIS_RELACJI_MULANK_BHAGYANK: Record<PoziomRelacjiPlanet, string> = {
  "wielki przyjaciel": "natura i droga życia ciągną w tę samą stronę. To, kim jesteś z natury (Mulank), naturalnie wspiera to, dokąd zmierzasz (Bhagyank) — rzadko czujesz wewnętrzny konflikt między tym, kim jesteś, a tym, co masz osiągnąć.",
  "przyjaciel": "natura i droga życia w większości się wspierają. Nie ma tu napięcia, choć nie jest to też pełna jedność — czasem trzeba świadomie dopasować jedno do drugiego.",
  "neutralny": "natura i droga życia nie przeszkadzają sobie, ale też się nie wzmacniają automatycznie. To, kim jesteś, i to, dokąd zmierzasz, żyją obok siebie — połączenie ich wymaga świadomego wysiłku, nie przychodzi samo.",
  "wróg": "natura i droga życia częściowo ciągną w różne strony. To, kim jesteś, i to, co masz osiągnąć, czasem się ze sobą kłócą — świadoma praca nad zgraniem jednego z drugim popłaca bardziej niż zwykle.",
  "wielki wróg": "natura i droga życia wyraźnie ciągną w przeciwne strony. Trwałe napięcie między tym, kim jesteś, a tym, co masz osiągnąć — nie wyrok, ale temat, który wraca przez całe życie i wymaga świadomego godzenia.",
};

/** Łączna waga każdej cyfry 1–9: data urodzenia + wszystkie liczby osobiste. */
export function wagiCyfr(n: NumerologyResult): WagaCyfry[] {
  const osobiste = liczbyOsobiste(n);
  const wynik: WagaCyfry[] = [];
  for (let cyfra = 1; cyfra <= 9; cyfra++) {
    const zLiczbOsobistych = osobiste.filter((o) => o.wartosc === cyfra).map((o) => o.etykieta);
    const zDaty = n.loShuGrid[cyfra] ?? 0;
    wynik.push({ cyfra, zDaty, zLiczbOsobistych, razem: zDaty + zLiczbOsobistych.length });
  }
  return wynik;
}
