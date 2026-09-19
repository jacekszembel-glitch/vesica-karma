/**
 * Dane bazowe astrologii wedyjskiej (Jyotish).
 * Wszystkie długości w stopniach, 0 = początek Barana syderycznego (Meszy).
 */

export type PlanetId =
  | "sun" | "moon" | "mars" | "mercury" | "jupiter"
  | "venus" | "saturn" | "rahu" | "ketu";

/** Graha — 9 ciał klasycznej astrologii wedyjskiej. */
export interface Graha {
  id: PlanetId;
  sanskrit: string;
  pl: string;
  symbol: string;
  /** Kolor na wykresie i mapie astrokartograficznej. */
  color: string;
  /** Znaki, w których planeta jest we władaniu (0 = Mesza). */
  ownSigns: number[];
  /** Znak egzaltacji i stopień szczytu egzaltacji. */
  exaltation?: { sign: number; degree: number };
  /** Znak upadku (debilitacji). */
  debilitation?: { sign: number; degree: number };
  /**
   * Mulatrikona — „korzeń trójkąta": wycinek znaku, w którym planeta działa
   * najsilniej, mocniej niż w zwykłym władaniu. Zakres stopni w obrębie znaku.
   */
  mulatrikona?: { sign: number; from: number; to: number };
  /** Naturalna dobroczynność: 1 = benefik, -1 = malefik, 0 = zmienny. */
  nature: 1 | 0 | -1;
  /** Odległość od Słońca (w stopniach), poniżej której planeta jest spalona. */
  combustionOrb?: number;
}

export const GRAHAS: Record<PlanetId, Graha> = {
  sun: {
    id: "sun", sanskrit: "Surya", pl: "Słońce", symbol: "☉", color: "#D4A43C",
    ownSigns: [4], exaltation: { sign: 0, degree: 10 }, debilitation: { sign: 6, degree: 10 },
    mulatrikona: { sign: 4, from: 0, to: 20 },
    nature: -1,
  },
  moon: {
    id: "moon", sanskrit: "Chandra", pl: "Księżyc", symbol: "☾", color: "#4FB3BF",
    ownSigns: [3], exaltation: { sign: 1, degree: 3 }, debilitation: { sign: 7, degree: 3 },
    mulatrikona: { sign: 1, from: 4, to: 30 },
    nature: 0, combustionOrb: 12,
  },
  mars: {
    id: "mars", sanskrit: "Mangala", pl: "Mars", symbol: "♂", color: "#C96A4A",
    ownSigns: [0, 7], exaltation: { sign: 9, degree: 28 }, debilitation: { sign: 3, degree: 28 },
    mulatrikona: { sign: 0, from: 0, to: 12 },
    nature: -1, combustionOrb: 17,
  },
  mercury: {
    id: "mercury", sanskrit: "Budha", pl: "Merkury", symbol: "☿", color: "#4C9B7F",
    ownSigns: [2, 5], exaltation: { sign: 5, degree: 15 }, debilitation: { sign: 11, degree: 15 },
    mulatrikona: { sign: 5, from: 16, to: 20 },
    nature: 0, combustionOrb: 14,
  },
  jupiter: {
    id: "jupiter", sanskrit: "Guru", pl: "Jowisz", symbol: "♃", color: "#B98A2E",
    ownSigns: [8, 11], exaltation: { sign: 3, degree: 5 }, debilitation: { sign: 9, degree: 5 },
    mulatrikona: { sign: 8, from: 0, to: 10 },
    nature: 1, combustionOrb: 11,
  },
  venus: {
    id: "venus", sanskrit: "Shukra", pl: "Wenus", symbol: "♀", color: "#B07A9E",
    ownSigns: [1, 6], exaltation: { sign: 11, degree: 27 }, debilitation: { sign: 5, degree: 27 },
    mulatrikona: { sign: 6, from: 0, to: 15 },
    nature: 1, combustionOrb: 10,
  },
  saturn: {
    id: "saturn", sanskrit: "Shani", pl: "Saturn", symbol: "♄", color: "#5E7A96",
    ownSigns: [9, 10], exaltation: { sign: 6, degree: 20 }, debilitation: { sign: 0, degree: 20 },
    mulatrikona: { sign: 10, from: 0, to: 20 },
    nature: -1, combustionOrb: 15,
  },
  rahu: {
    id: "rahu", sanskrit: "Rahu", pl: "Rahu", symbol: "☊", color: "#7A6FA8",
    ownSigns: [], exaltation: { sign: 1, degree: 20 }, debilitation: { sign: 7, degree: 20 },
    nature: -1,
  },
  ketu: {
    id: "ketu", sanskrit: "Ketu", pl: "Ketu", symbol: "☋", color: "#9A8560",
    ownSigns: [], exaltation: { sign: 7, degree: 20 }, debilitation: { sign: 1, degree: 20 },
    nature: -1,
  },
};

export const PLANET_ORDER: PlanetId[] = [
  "sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu",
];

/** Znaki zodiaku syderycznego (rasi). Indeks 0 = Mesza / Baran. */
export interface Rasi {
  index: number;
  sanskrit: string;
  pl: string;
  symbol: string;
  lord: PlanetId;
  element: "ogień" | "ziemia" | "powietrze" | "woda";
  quality: "kardynalny" | "stały" | "zmienny";
}

/** Miejscownik znaków — „Księżyc w Byku". Indeks jak RASIS. */
export const RASI_LOC: string[] = [
  "Baranie", "Byku", "Bliźniętach", "Raku", "Lwie", "Pannie",
  "Wadze", "Skorpionie", "Strzelcu", "Koziorożcu", "Wodniku", "Rybach",
];

/**
 * U+FE0E (selektor prezentacji tekstowej) po każdym symbolu — bez niego
 * Windows rysuje znaki zodiaku przez Segoe UI Emoji: kolorowa ikonka
 * w kwadratowej ramce zamiast zwykłego, jednolitego glifu (tak jak symbole
 * grah, które tej właściwości emoji nie mają i renderują się poprawnie).
 */
export const RASIS: Rasi[] = [
  { index: 0, sanskrit: "Mesza", pl: "Baran", symbol: "♈︎", lord: "mars", element: "ogień", quality: "kardynalny" },
  { index: 1, sanskrit: "Wriszabha", pl: "Byk", symbol: "♉︎", lord: "venus", element: "ziemia", quality: "stały" },
  { index: 2, sanskrit: "Mithuna", pl: "Bliźnięta", symbol: "♊︎", lord: "mercury", element: "powietrze", quality: "zmienny" },
  { index: 3, sanskrit: "Karka", pl: "Rak", symbol: "♋︎", lord: "moon", element: "woda", quality: "kardynalny" },
  { index: 4, sanskrit: "Simha", pl: "Lew", symbol: "♌︎", lord: "sun", element: "ogień", quality: "stały" },
  { index: 5, sanskrit: "Kanja", pl: "Panna", symbol: "♍︎", lord: "mercury", element: "ziemia", quality: "zmienny" },
  { index: 6, sanskrit: "Tula", pl: "Waga", symbol: "♎︎", lord: "venus", element: "powietrze", quality: "kardynalny" },
  { index: 7, sanskrit: "Wriszczika", pl: "Skorpion", symbol: "♏︎", lord: "mars", element: "woda", quality: "stały" },
  { index: 8, sanskrit: "Dhanu", pl: "Strzelec", symbol: "♐︎", lord: "jupiter", element: "ogień", quality: "zmienny" },
  { index: 9, sanskrit: "Makara", pl: "Koziorożec", symbol: "♑︎", lord: "saturn", element: "ziemia", quality: "kardynalny" },
  { index: 10, sanskrit: "Kumbha", pl: "Wodnik", symbol: "♒︎", lord: "saturn", element: "powietrze", quality: "stały" },
  { index: 11, sanskrit: "Mina", pl: "Ryby", symbol: "♓︎", lord: "jupiter", element: "woda", quality: "zmienny" },
];

/** Nakszatra — 27 domów księżycowych po 13°20'. */
export interface Nakshatra {
  index: number;
  sanskrit: string;
  pl: string;
  /** Władca w cyklu Vimshottari. */
  lord: PlanetId;
  deity: string;
  symbol: string;
  /** Gana — temperament: boski / ludzki / demoniczny. */
  gana: "deva" | "manuszja" | "rakszasa";
  /** Krótki opis motywu przewodniego (baza dla interpretacji). */
  motyw: string;
}

export const NAKSHATRAS: Nakshatra[] = [
  { index: 0, sanskrit: "Ashwini", pl: "Aświni", lord: "ketu", deity: "Aświnowie", symbol: "głowa konia", gana: "deva", motyw: "szybki start, inicjatywa, uzdrawianie, niecierpliwość" },
  { index: 1, sanskrit: "Bharani", pl: "Bharani", lord: "venus", deity: "Jama", symbol: "joni", gana: "manuszja", motyw: "transformacja, granice, intensywność, odpowiedzialność za cykl" },
  { index: 2, sanskrit: "Krittika", pl: "Krittika", lord: "sun", deity: "Agni", symbol: "ostrze", gana: "rakszasa", motyw: "oczyszczający ogień, ostra ocena, przecinanie iluzji" },
  { index: 3, sanskrit: "Rohini", pl: "Rohini", lord: "moon", deity: "Brahma", symbol: "wóz", gana: "manuszja", motyw: "wzrost, piękno, materializacja, przywiązanie" },
  { index: 4, sanskrit: "Mrigashira", pl: "Mrigaśira", lord: "mars", deity: "Soma", symbol: "głowa jelenia", gana: "deva", motyw: "poszukiwanie, ciekawość, niedosyt, wieczny tropiciel" },
  { index: 5, sanskrit: "Ardra", pl: "Ardra", lord: "rahu", deity: "Rudra", symbol: "łza", gana: "manuszja", motyw: "burza oczyszczająca, przełom przez kryzys, ostry umysł" },
  { index: 6, sanskrit: "Punarvasu", pl: "Punarwasu", lord: "jupiter", deity: "Aditi", symbol: "kołczan", gana: "deva", motyw: "powrót światła, odnowa, wybaczanie, dom wewnętrzny" },
  { index: 7, sanskrit: "Pushya", pl: "Puszja", lord: "saturn", deity: "Brihaspati", symbol: "wymię krowy", gana: "deva", motyw: "odżywianie, opieka, najbardziej sprzyjająca nakszatra" },
  { index: 8, sanskrit: "Ashlesha", pl: "Aślesza", lord: "mercury", deity: "Nagowie", symbol: "zwinięty wąż", gana: "rakszasa", motyw: "hipnotyczna głębia, strategia, uzdrawianie i jad" },
  { index: 9, sanskrit: "Magha", pl: "Magha", lord: "ketu", deity: "Pitrisowie", symbol: "tron", gana: "rakszasa", motyw: "przodkowie, władza dziedziczona, godność, dziedzictwo" },
  { index: 10, sanskrit: "Purva Phalguni", pl: "Purwa Phalguni", lord: "venus", deity: "Bhaga", symbol: "hamak", gana: "manuszja", motyw: "przyjemność, twórczość, odpoczynek, uwodzenie" },
  { index: 11, sanskrit: "Uttara Phalguni", pl: "Uttara Phalguni", lord: "sun", deity: "Arjaman", symbol: "łoże", gana: "manuszja", motyw: "kontrakt, przyjaźń, zobowiązanie, stabilna hojność" },
  { index: 12, sanskrit: "Hasta", pl: "Hasta", lord: "moon", deity: "Sawitar", symbol: "dłoń", gana: "deva", motyw: "rzemiosło, precyzja, sprawczość rąk, zręczność" },
  { index: 13, sanskrit: "Chitra", pl: "Czitra", lord: "mars", deity: "Twasztar", symbol: "perła", gana: "rakszasa", motyw: "projektowanie formy, blask, architektura, estetyka" },
  { index: 14, sanskrit: "Swati", pl: "Swati", lord: "rahu", deity: "Waju", symbol: "młody pęd na wietrze", gana: "deva", motyw: "niezależność, elastyczność, handel, ruch" },
  { index: 15, sanskrit: "Vishakha", pl: "Wiśakha", lord: "jupiter", deity: "Indragni", symbol: "łuk triumfalny", gana: "rakszasa", motyw: "determinacja do celu, ambicja, dwoistość dążeń" },
  { index: 16, sanskrit: "Anuradha", pl: "Anuradha", lord: "saturn", deity: "Mitra", symbol: "kwiat lotosu", gana: "deva", motyw: "przyjaźń, oddanie, praca w grupie, wierność" },
  { index: 17, sanskrit: "Jyeshtha", pl: "Dżjesztha", lord: "mercury", deity: "Indra", symbol: "amulet", gana: "rakszasa", motyw: "starszeństwo, ochrona, ukryta siła, ciężar odpowiedzialności" },
  { index: 18, sanskrit: "Mula", pl: "Mula", lord: "ketu", deity: "Nirriti", symbol: "korzeń", gana: "rakszasa", motyw: "dotarcie do korzenia, dekonstrukcja, poszukiwanie prawdy" },
  { index: 19, sanskrit: "Purva Ashadha", pl: "Purwa Aszadha", lord: "venus", deity: "Apas", symbol: "wachlarz", gana: "manuszja", motyw: "niezwyciężoność, perswazja, oczyszczenie wodą" },
  { index: 20, sanskrit: "Uttara Ashadha", pl: "Uttara Aszadha", lord: "sun", deity: "Wiśwedewowie", symbol: "kieł słonia", gana: "manuszja", motyw: "trwałe zwycięstwo, etyka, wytrwałość, autorytet" },
  { index: 21, sanskrit: "Shravana", pl: "Śrawana", lord: "moon", deity: "Wisznu", symbol: "ucho", gana: "deva", motyw: "słuchanie, nauka, przekaz tradycji, mądrość zebrana" },
  { index: 22, sanskrit: "Dhanishta", pl: "Dhaniszta", lord: "mars", deity: "Wasu", symbol: "bęben", gana: "rakszasa", motyw: "rytm, obfitość, muzyka, grupowa energia" },
  { index: 23, sanskrit: "Shatabhisha", pl: "Śatabhisza", lord: "rahu", deity: "Waruna", symbol: "krąg", gana: "rakszasa", motyw: "uzdrawianie, samotność, tajemnica, niezależne badanie" },
  { index: 24, sanskrit: "Purva Bhadrapada", pl: "Purwa Bhadrapada", lord: "jupiter", deity: "Adża Ekapad", symbol: "przód mar", gana: "manuszja", motyw: "ogień ascezy, radykalna zmiana, wizja poza światem" },
  { index: 25, sanskrit: "Uttara Bhadrapada", pl: "Uttara Bhadrapada", lord: "saturn", deity: "Ahir Budhnja", symbol: "tył mar", gana: "manuszja", motyw: "głębia, spokój mędrca, ukryte wsparcie, cierpliwość" },
  { index: 26, sanskrit: "Revati", pl: "Rewati", lord: "mercury", deity: "Puszan", symbol: "ryba", gana: "deva", motyw: "domknięcie cyklu, opieka nad drogą, współczucie, przejście" },
];

/**
 * Bhawy — 12 domów, ich znaczenia (karakatwa). Pełniejsza lista klasycznych
 * znaczeń (BPHS) niż samo hasło z kafla — to samo `obszar` jest używane
 * wszędzie tam, gdzie dom trzeba opisać, więc rozbudowa działa od razu
 * w całym serwisie, nie tylko w kosmogramie.
 */
export const BHAVAS: { index: number; sanskrit: string; pl: string; obszar: string }[] = [
  { index: 0, sanskrit: "Tanu", pl: "1. dom", obszar: "ciało, osobowość, wygląd, witalność, sposób wchodzenia w świat, pierwsze wrażenie" },
  { index: 1, sanskrit: "Dhana", pl: "2. dom", obszar: "zasoby, majątek zgromadzony, rodzina pochodzenia, mowa, jedzenie, twarz, wartości" },
  { index: 2, sanskrit: "Sahaja", pl: "3. dom", obszar: "odwaga, komunikacja, rodzeństwo, umiejętności i zręczność rąk, krótkie podróże, własny wysiłek, hobby" },
  { index: 3, sanskrit: "Sukha", pl: "4. dom", obszar: "dom, matka, spokój wewnętrzny, fundament, edukacja podstawowa, nieruchomości i pojazdy, poczucie bezpieczeństwa" },
  { index: 4, sanskrit: "Putra", pl: "5. dom", obszar: "twórczość, dzieci, inteligencja, zasługi z przeszłości (purwa punja), romans, spekulacja, praktyka duchowa" },
  { index: 5, sanskrit: "Ripu", pl: "6. dom", obszar: "praca codzienna, przeszkody, zdrowie i choroby, służba, rywale i wrogowie, długi, spory" },
  { index: 6, sanskrit: "Yuvati", pl: "7. dom", obszar: "partnerstwo, małżeństwo, umowy, wspólnicy biznesowi, druga strona, otwarci przeciwnicy, relacje publiczne" },
  { index: 7, sanskrit: "Randhra", pl: "8. dom", obszar: "transformacja, kryzysy, wspólne zasoby, głębia okultystyczna, długowieczność, spadki, nagłe wydarzenia" },
  { index: 8, sanskrit: "Dharma", pl: "9. dom", obszar: "sens, nauczyciele, dalekie podróże, wiara, ojciec, szczęście i fortuna, wyższa edukacja, etyka" },
  { index: 9, sanskrit: "Karma", pl: "10. dom", obszar: "działanie w świecie, kariera, status, powołanie, autorytet, reputacja publiczna, władza" },
  { index: 10, sanskrit: "Labha", pl: "11. dom", obszar: "zyski, dochody, sieć kontaktów, cele, spełnianie pragnień, starsze rodzeństwo, społeczność" },
  { index: 11, sanskrit: "Vyaya", pl: "12. dom", obszar: "strata i wyzwolenie, zagranica, sen, wycofanie, duchowość i moksza, wydatki, izolacja" },
];

/** Długości okresów Vimshottari w latach (suma 120). */
export const VIMSHOTTARI_YEARS: Record<PlanetId, number> = {
  ketu: 7, venus: 20, sun: 6, moon: 10, mars: 7,
  rahu: 18, jupiter: 16, saturn: 19, mercury: 17,
};

/** Kolejność planet w cyklu Vimshottari. */
export const VIMSHOTTARI_ORDER: PlanetId[] = [
  "ketu", "venus", "sun", "moon", "mars", "rahu", "jupiter", "saturn", "mercury",
];

/** Rok syderyczny używany w Vimshottari (365,25 dnia — konwencja klasyczna). */
export const VIMSHOTTARI_YEAR_DAYS = 365.25;
