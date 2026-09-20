import { reduce } from "@/lib/astro/numerology";

/**
 * Godziny lustrzane — dane i treści dla stron programmatic SEO.
 * Treść składana deterministycznie ze słowników — każda strona unikalna.
 */

export interface MirrorHour {
  slug: string;        // "21-21"
  display: string;     // "21:21"
  type: "lustrzana" | "odwrócona";
  sum: number;         // suma cyfr
  number: number;      // liczba po redukcji (z mistrzowskimi)
}

function digitsSum(s: string): number {
  return s.replace(/\D/g, "").split("").reduce((a, d) => a + Number(d), 0);
}

function makeHour(hh: number, mm: number, type: MirrorHour["type"]): MirrorHour {
  const display = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  const sum = digitsSum(display);
  return {
    slug: display.replace(":", "-"),
    display,
    type,
    sum,
    number: sum === 0 ? 0 : reduce(sum),
  };
}

/** 24 godziny lustrzane (HH:HH) + 13 odwróconych (HH:odwrotność). */
export const MIRROR_HOURS: MirrorHour[] = [
  ...Array.from({ length: 24 }, (_, h) => makeHour(h, h, "lustrzana")),
  ...[
    [1, 10], [2, 20], [3, 30], [4, 40], [5, 50],
    [10, 1], [12, 21], [13, 31], [14, 41], [15, 51],
    [20, 2], [21, 12], [23, 32],
  ].map(([h, m]) => makeHour(h, m, "odwrócona")),
];

export function hourBySlug(slug: string): MirrorHour | undefined {
  return MIRROR_HOURS.find((h) => h.slug === slug);
}

/** Znaczenia liczb 0-9 + mistrzowskie. */
const NUMBER_MEANING: Record<number, { temat: string; przeslanie: string; planeta: string }> = {
  0: { temat: "nieskończoność i nowy cykl", przeslanie: "stare zamyka się po to, by mogło zacząć się nowe — nie trzymaj kurczowo tego, co odchodzi", planeta: "przestrzeń (akaśa)" },
  1: { temat: "początek i inicjatywa", przeslanie: "to moment na pierwszy krok — przestań czekać na idealne warunki", planeta: "Słońce" },
  2: { temat: "równowaga i relacje", przeslanie: "odpowiedź przyjdzie przez drugiego człowieka — słuchaj uważniej, niż mówisz", planeta: "Księżyc" },
  3: { temat: "ekspresja i radość", przeslanie: "powiedz to, co nosisz w sobie — słowa mają teraz moc tworzenia", planeta: "Jowisz" },
  4: { temat: "fundament i porządek", przeslanie: "zbuduj strukturę: plan, rytm, porządek — reszta przyjdzie sama", planeta: "Rahu" },
  5: { temat: "zmiana i wolność", przeslanie: "coś chce się w Twoim życiu przewietrzyć — nie opieraj się zmianie", planeta: "Merkury" },
  6: { temat: "miłość i opieka", przeslanie: "dom i bliscy potrzebują teraz Twojej uwagi — tam jest dziś Twoje miejsce", planeta: "Wenus" },
  7: { temat: "głębia i zaufanie", przeslanie: "odpowiedź jest w ciszy, nie w działaniu — zrób miejsce na refleksję", planeta: "Ketu" },
  8: { temat: "siła i odpowiedzialność", przeslanie: "czas dojrzałych decyzji — weź odpowiedzialność, a otrzymasz autorytet", planeta: "Saturn" },
  9: { temat: "domknięcie i mądrość", przeslanie: "kończy się pewien rozdział — pożegnaj go z wdzięcznością, nie żalem", planeta: "Mars" },
  11: { temat: "intuicja mistrzowska", przeslanie: "to znak przebudzenia — Twoja intuicja mówi teraz głośniej niż logika, zaufaj jej", planeta: "Księżyc (wibracja wyższa)" },
  22: { temat: "wielki budowniczy", przeslanie: "masz teraz siłę zamieniania marzeń w konkret — myśl na wielką skalę, działaj krok po kroku", planeta: "Rahu (wibracja wyższa)" },
};

const TYPE_INTRO: Record<MirrorHour["type"], string> = {
  lustrzana: "to klasyczna godzina lustrzana — te same cyfry po obu stronach dwukropka. W numerologii taki moment odczytuje się jako „zatrzymaj się: coś chce zostać zauważone”.",
  odwrócona: "to godzina lustrzana odwrócona — minuty są odbiciem godziny. Tradycyjnie odczytuje się ją jako znak domykania: coś się odwraca, wraca albo prosi o zakończenie.",
};

export interface HourContent {
  meaning: { temat: string; przeslanie: string; planeta: string };
  intro: string;
  loveText: string;
  actionText: string;
}

export function hourContent(h: MirrorHour): HourContent {
  // 11:11 i 22:22 to klasyczne "liczby mistrzowskie" (angel numbers) przez sam
  // POWTARZAJĄCY SIĘ wzorzec cyfr — nie przez sumę cyfr całego zapisu (h.sum),
  // która dla żadnej godziny HH:MM nigdy nie wynosi 11 ani 22 (maks. to 19),
  // więc dawny warunek nigdy się nie spełniał i 11:11 pokazywało treść liczby 4.
  const godzinaLustrzana = h.type === "lustrzana" ? Number(h.display.slice(0, 2)) : null;
  const num = godzinaLustrzana === 11 || godzinaLustrzana === 22 ? godzinaLustrzana : h.number;
  const meaning = NUMBER_MEANING[num] ?? NUMBER_MEANING[h.number];
  const loveByNumber: Record<number, string> = {
    0: "W miłości: czysta karta. Jeśli coś się skończyło — miało się skończyć.",
    1: "W miłości: wykonaj pierwszy ruch. Ta osoba czeka na Twój sygnał.",
    2: "W miłości: czas na rozmowę, nie na dumę. Delikatność otwiera dziś drzwi.",
    3: "W miłości: flirt, lekkość, wspólny śmiech — związek potrzebuje zabawy.",
    4: "W miłości: stabilność to też romantyzm. Dotrzymane słowo znaczy więcej niż kwiaty.",
    5: "W miłości: wyrwijcie się z rutyny — nowa sceneria ożywi uczucia.",
    6: "W miłości: to godzina opiekunów. Zadbaj — i pozwól zadbać o siebie.",
    7: "W miłości: nie wszystko trzeba nazwać. Bliskość rośnie dziś w ciszy.",
    8: "W miłości: poważna rozmowa o przyszłości ma dziś dobrą gwiazdę.",
    9: "W miłości: wybacz — sobie albo komuś. To uwalnia miejsce na nowe.",
    11: "W miłości: spotkanie, które wydaje się przypadkowe, może nie być przypadkiem.",
    22: "W miłości: budujecie coś trwałego — nie porównujcie swojego tempa z innymi.",
  };
  return {
    meaning,
    intro: TYPE_INTRO[h.type],
    loveText: loveByNumber[num] ?? loveByNumber[h.number],
    actionText: meaning.przeslanie,
  };
}
