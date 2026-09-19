/**
 * Znaczenia liczb 1–9 oraz mistrzowskich — wspólny słownik dla bramek
 * numerologicznych (/numerologia-imienia, /imie/[imie], /liczby-anielskie).
 *
 * Jeden plik zamiast trzech rozproszonych tablic: te same opisy wszędzie,
 * więc żadna strona nie powie o „siódemce" czego innego niż sąsiednia.
 */

export interface ZnaczenieLiczby {
  /** Hasło — dwa, trzy słowa. */
  haslo: string;
  /** Planeta władająca w numerologii wedyjskiej. */
  planeta: string;
  /** Pełny opis charakteru. */
  opis: string;
  /** Jak wibracja działa w imieniu (ekspresja). */
  wImieniu: string;
}

export const ZNACZENIA: Record<number, ZnaczenieLiczby> = {
  1: {
    haslo: "inicjatywa i przywództwo",
    planeta: "Słońce",
    opis: "Energia początku: samodzielność, odwaga, potrzeba wytyczania własnej drogi. Jedynka nie czeka na pozwolenie.",
    wImieniu: "Imię o wibracji 1 popycha do wychodzenia przed szereg i brania odpowiedzialności. Wyzwanie: słuchać innych, zanim się zdecyduje.",
  },
  2: {
    haslo: "współpraca i wyczucie",
    planeta: "Księżyc",
    opis: "Energia dopełnienia: dyplomacja, empatia, zmysł szczegółu. Dwójka widzi obie strony każdej sprawy.",
    wImieniu: "Imię o wibracji 2 sprzyja partnerstwu i pracy zespołowej. Wyzwanie: nie rozpuszczać się w cudzych oczekiwaniach.",
  },
  3: {
    haslo: "ekspresja i radość",
    planeta: "Jowisz",
    opis: "Energia twórcza: słowo, obraz, towarzyskość, optymizm. Trójka musi się wyrażać, inaczej więdnie.",
    wImieniu: "Imię o wibracji 3 daje lekkość słowa i naturalny urok. Wyzwanie: doprowadzać zaczęte do końca.",
  },
  4: {
    haslo: "fundament i praca",
    planeta: "Rahu",
    opis: "Energia budowania: systematyczność, rzetelność, cierpliwość do szczegółów. Czwórka stawia rzeczy, które stoją latami.",
    wImieniu: "Imię o wibracji 4 wzmacnia wytrwałość i wiarygodność. Wyzwanie: nie mylić stabilności ze sztywnością.",
  },
  5: {
    haslo: "zmiana i wolność",
    planeta: "Merkury",
    opis: "Energia ruchu: ciekawość, podróże, handel, szybkie myślenie. Piątka potrzebuje zmiany jak powietrza.",
    wImieniu: "Imię o wibracji 5 przyciąga różnorodne doświadczenia i kontakty. Wyzwanie: odróżniać wolność od ucieczki.",
  },
  6: {
    haslo: "troska i harmonia",
    planeta: "Wenus",
    opis: "Energia opieki: dom, rodzina, piękno, odpowiedzialność za bliskich. Szóstka tworzy miejsca, do których chce się wracać.",
    wImieniu: "Imię o wibracji 6 sprzyja roli opiekuna i gospodarza. Wyzwanie: dawać bez wystawiania rachunku.",
  },
  7: {
    haslo: "głębia i poznanie",
    planeta: "Ketu",
    opis: "Energia wnętrza: analiza, intuicja, potrzeba sensu i ciszy. Siódemka szuka tego, co pod powierzchnią.",
    wImieniu: "Imię o wibracji 7 ciągnie ku wiedzy i samotnym poszukiwaniom. Wyzwanie: dzielić się tym, co się odkryło.",
  },
  8: {
    haslo: "siła i zasoby",
    planeta: "Saturn",
    opis: "Energia materii: ambicja, zarządzanie, długie gry o duże stawki. Ósemka rozumie, jak działa władza i pieniądz.",
    wImieniu: "Imię o wibracji 8 wzmacnia skuteczność i autorytet. Wyzwanie: mierzyć sukces nie tylko wynikiem.",
  },
  9: {
    haslo: "służba i domknięcie",
    planeta: "Mars",
    opis: "Energia pełni cyklu: idealizm, współczucie, działanie dla czegoś większego. Dziewiątka kończy to, co inni zaczęli.",
    wImieniu: "Imię o wibracji 9 daje szerokie serce i odwagę walki o innych. Wyzwanie: nie brać całego świata na własne barki.",
  },
  11: {
    haslo: "natchnienie (mistrzowska)",
    planeta: "Księżyc (wyższa oktawa)",
    opis: "Podwyższona dwójka: intuicja na granicy jasnowidzenia, wrażliwość, misja. Działa jak antena — dużo odbiera i dużo ją to kosztuje.",
    wImieniu: "Imię o wibracji 11 daje przeczucia i wpływ na ludzi, ale wymaga uziemienia — inaczej spala nerwy.",
  },
  22: {
    haslo: "wielki budowniczy (mistrzowska)",
    planeta: "Rahu (wyższa oktawa)",
    opis: "Podwyższona czwórka: zdolność stawiania rzeczy wielkich i trwałych — mostów, firm, instytucji. Wizja plus wykonanie.",
    wImieniu: "Imię o wibracji 22 pozwala materializować duże zamierzenia. Wyzwanie: nie zejść do zwykłej czwórki ze strachu przed skalą.",
  },
  33: {
    haslo: "nauczyciel serca (mistrzowska)",
    planeta: "Jowisz (wyższa oktawa)",
    opis: "Podwyższona szóstka: opieka podniesiona do służby, uzdrawianie przez obecność. Rzadka i wymagająca wibracja.",
    wImieniu: "Imię o wibracji 33 predysponuje do prowadzenia i uczenia innych. Wyzwanie: najpierw zaopiekować się sobą.",
  },
};

/** Bezpieczne pobranie — liczby spoza słownika redukujemy. */
export function znaczenie(n: number): ZnaczenieLiczby {
  if (ZNACZENIA[n]) return ZNACZENIA[n];
  let x = n;
  while (x > 9) x = String(x).split("").reduce((s, d) => s + Number(d), 0);
  return ZNACZENIA[x];
}
