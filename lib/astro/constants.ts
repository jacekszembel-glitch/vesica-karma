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
  /** Angielska nazwa — na razie uzywana tylko tam, gdzie strona jest juz
   *  w pelni przetlumaczona (next-intl, locale "en"); wiekszosc kalkulatorow
   *  dalej czyta `.pl` wprost, patrz project_i18n_angielski_plan.md w pamieci. */
  en: string;
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
    id: "sun", sanskrit: "Surya", pl: "Słońce", en: "Sun", symbol: "☉", color: "#D4A43C",
    ownSigns: [4], exaltation: { sign: 0, degree: 10 }, debilitation: { sign: 6, degree: 10 },
    mulatrikona: { sign: 4, from: 0, to: 20 },
    nature: -1,
  },
  moon: {
    id: "moon", sanskrit: "Chandra", pl: "Księżyc", en: "Moon", symbol: "☾", color: "#4FB3BF",
    ownSigns: [3], exaltation: { sign: 1, degree: 3 }, debilitation: { sign: 7, degree: 3 },
    mulatrikona: { sign: 1, from: 4, to: 30 },
    nature: 0, combustionOrb: 12,
  },
  mars: {
    id: "mars", sanskrit: "Mangala", pl: "Mars", en: "Mars", symbol: "♂", color: "#C96A4A",
    ownSigns: [0, 7], exaltation: { sign: 9, degree: 28 }, debilitation: { sign: 3, degree: 28 },
    mulatrikona: { sign: 0, from: 0, to: 12 },
    nature: -1, combustionOrb: 17,
  },
  mercury: {
    id: "mercury", sanskrit: "Budha", pl: "Merkury", en: "Mercury", symbol: "☿", color: "#4C9B7F",
    ownSigns: [2, 5], exaltation: { sign: 5, degree: 15 }, debilitation: { sign: 11, degree: 15 },
    mulatrikona: { sign: 5, from: 16, to: 20 },
    nature: 0, combustionOrb: 14,
  },
  jupiter: {
    id: "jupiter", sanskrit: "Guru", pl: "Jowisz", en: "Jupiter", symbol: "♃", color: "#B98A2E",
    ownSigns: [8, 11], exaltation: { sign: 3, degree: 5 }, debilitation: { sign: 9, degree: 5 },
    mulatrikona: { sign: 8, from: 0, to: 10 },
    nature: 1, combustionOrb: 11,
  },
  venus: {
    id: "venus", sanskrit: "Shukra", pl: "Wenus", en: "Venus", symbol: "♀", color: "#B07A9E",
    ownSigns: [1, 6], exaltation: { sign: 11, degree: 27 }, debilitation: { sign: 5, degree: 27 },
    mulatrikona: { sign: 6, from: 0, to: 15 },
    nature: 1, combustionOrb: 10,
  },
  saturn: {
    id: "saturn", sanskrit: "Shani", pl: "Saturn", en: "Saturn", symbol: "♄", color: "#5E7A96",
    ownSigns: [9, 10], exaltation: { sign: 6, degree: 20 }, debilitation: { sign: 0, degree: 20 },
    mulatrikona: { sign: 10, from: 0, to: 20 },
    nature: -1, combustionOrb: 15,
  },
  rahu: {
    id: "rahu", sanskrit: "Rahu", pl: "Rahu", en: "Rahu", symbol: "☊", color: "#7A6FA8",
    ownSigns: [], exaltation: { sign: 1, degree: 20 }, debilitation: { sign: 7, degree: 20 },
    nature: -1,
  },
  ketu: {
    id: "ketu", sanskrit: "Ketu", pl: "Ketu", en: "Ketu", symbol: "☋", color: "#9A8560",
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
  /** Angielska nazwa — patrz komentarz przy Graha.en. */
  en: string;
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
  { index: 0, sanskrit: "Mesza", pl: "Baran", en: "Aries", symbol: "♈︎", lord: "mars", element: "ogień", quality: "kardynalny" },
  { index: 1, sanskrit: "Wriszabha", pl: "Byk", en: "Taurus", symbol: "♉︎", lord: "venus", element: "ziemia", quality: "stały" },
  { index: 2, sanskrit: "Mithuna", pl: "Bliźnięta", en: "Gemini", symbol: "♊︎", lord: "mercury", element: "powietrze", quality: "zmienny" },
  { index: 3, sanskrit: "Karka", pl: "Rak", en: "Cancer", symbol: "♋︎", lord: "moon", element: "woda", quality: "kardynalny" },
  { index: 4, sanskrit: "Simha", pl: "Lew", en: "Leo", symbol: "♌︎", lord: "sun", element: "ogień", quality: "stały" },
  { index: 5, sanskrit: "Kanja", pl: "Panna", en: "Virgo", symbol: "♍︎", lord: "mercury", element: "ziemia", quality: "zmienny" },
  { index: 6, sanskrit: "Tula", pl: "Waga", en: "Libra", symbol: "♎︎", lord: "venus", element: "powietrze", quality: "kardynalny" },
  { index: 7, sanskrit: "Wriszczika", pl: "Skorpion", en: "Scorpio", symbol: "♏︎", lord: "mars", element: "woda", quality: "stały" },
  { index: 8, sanskrit: "Dhanu", pl: "Strzelec", en: "Sagittarius", symbol: "♐︎", lord: "jupiter", element: "ogień", quality: "zmienny" },
  { index: 9, sanskrit: "Makara", pl: "Koziorożec", en: "Capricorn", symbol: "♑︎", lord: "saturn", element: "ziemia", quality: "kardynalny" },
  { index: 10, sanskrit: "Kumbha", pl: "Wodnik", en: "Aquarius", symbol: "♒︎", lord: "saturn", element: "powietrze", quality: "stały" },
  { index: 11, sanskrit: "Mina", pl: "Ryby", en: "Pisces", symbol: "♓︎", lord: "jupiter", element: "woda", quality: "zmienny" },
];

/** Nakszatra — 27 domów księżycowych po 13°20'. */
export interface Nakshatra {
  index: number;
  sanskrit: string;
  pl: string;
  /** Władca w cyklu Vimshottari. */
  lord: PlanetId;
  deity: string;
  /** Angielska nazwa bóstwa — standardowa transliteracja (patrz komentarz przy Graha.en). */
  deityEn: string;
  symbol: string;
  symbolEn: string;
  /** Gana — temperament: boski / ludzki / demoniczny. */
  gana: "deva" | "manuszja" | "rakszasa";
  /** Krótki opis motywu przewodniego (baza dla interpretacji). */
  motyw: string;
  motywEn: string;
}

export const NAKSHATRAS: Nakshatra[] = [
  { index: 0, sanskrit: "Ashwini", pl: "Aświni", lord: "ketu", deity: "Aświnowie", deityEn: "the Ashwins", symbol: "głowa konia", symbolEn: "horse's head", gana: "deva", motyw: "szybki start, inicjatywa, uzdrawianie, niecierpliwość", motywEn: "quick start, initiative, healing, impatience" },
  { index: 1, sanskrit: "Bharani", pl: "Bharani", lord: "venus", deity: "Jama", deityEn: "Yama", symbol: "joni", symbolEn: "yoni", gana: "manuszja", motyw: "transformacja, granice, intensywność, odpowiedzialność za cykl", motywEn: "transformation, boundaries, intensity, responsibility for the cycle" },
  { index: 2, sanskrit: "Krittika", pl: "Krittika", lord: "sun", deity: "Agni", deityEn: "Agni", symbol: "ostrze", symbolEn: "blade", gana: "rakszasa", motyw: "oczyszczający ogień, ostra ocena, przecinanie iluzji", motywEn: "purifying fire, sharp judgment, cutting through illusion" },
  { index: 3, sanskrit: "Rohini", pl: "Rohini", lord: "moon", deity: "Brahma", deityEn: "Brahma", symbol: "wóz", symbolEn: "cart", gana: "manuszja", motyw: "wzrost, piękno, materializacja, przywiązanie", motywEn: "growth, beauty, manifestation, attachment" },
  { index: 4, sanskrit: "Mrigashira", pl: "Mrigaśira", lord: "mars", deity: "Soma", deityEn: "Soma", symbol: "głowa jelenia", symbolEn: "deer's head", gana: "deva", motyw: "poszukiwanie, ciekawość, niedosyt, wieczny tropiciel", motywEn: "searching, curiosity, restlessness, the eternal seeker" },
  { index: 5, sanskrit: "Ardra", pl: "Ardra", lord: "rahu", deity: "Rudra", deityEn: "Rudra", symbol: "łza", symbolEn: "teardrop", gana: "manuszja", motyw: "burza oczyszczająca, przełom przez kryzys, ostry umysł", motywEn: "cleansing storm, breakthrough through crisis, a sharp mind" },
  { index: 6, sanskrit: "Punarvasu", pl: "Punarwasu", lord: "jupiter", deity: "Aditi", deityEn: "Aditi", symbol: "kołczan", symbolEn: "quiver", gana: "deva", motyw: "powrót światła, odnowa, wybaczanie, dom wewnętrzny", motywEn: "return of light, renewal, forgiveness, an inner home" },
  { index: 7, sanskrit: "Pushya", pl: "Puszja", lord: "saturn", deity: "Brihaspati", deityEn: "Brihaspati", symbol: "wymię krowy", symbolEn: "cow's udder", gana: "deva", motyw: "odżywianie, opieka, najbardziej sprzyjająca nakszatra", motywEn: "nourishment, care, the most auspicious nakshatra" },
  { index: 8, sanskrit: "Ashlesha", pl: "Aślesza", lord: "mercury", deity: "Nagowie", deityEn: "the Nagas", symbol: "zwinięty wąż", symbolEn: "coiled serpent", gana: "rakszasa", motyw: "hipnotyczna głębia, strategia, uzdrawianie i jad", motywEn: "hypnotic depth, strategy, healing and venom" },
  { index: 9, sanskrit: "Magha", pl: "Magha", lord: "ketu", deity: "Pitrisowie", deityEn: "the Pitrs (ancestors)", symbol: "tron", symbolEn: "throne", gana: "rakszasa", motyw: "przodkowie, władza dziedziczona, godność, dziedzictwo", motywEn: "ancestors, inherited power, dignity, legacy" },
  { index: 10, sanskrit: "Purva Phalguni", pl: "Purwa Phalguni", lord: "venus", deity: "Bhaga", deityEn: "Bhaga", symbol: "hamak", symbolEn: "hammock", gana: "manuszja", motyw: "przyjemność, twórczość, odpoczynek, uwodzenie", motywEn: "pleasure, creativity, rest, seduction" },
  { index: 11, sanskrit: "Uttara Phalguni", pl: "Uttara Phalguni", lord: "sun", deity: "Arjaman", deityEn: "Aryaman", symbol: "łoże", symbolEn: "bed", gana: "manuszja", motyw: "kontrakt, przyjaźń, zobowiązanie, stabilna hojność", motywEn: "contract, friendship, commitment, steady generosity" },
  { index: 12, sanskrit: "Hasta", pl: "Hasta", lord: "moon", deity: "Sawitar", deityEn: "Savitar", symbol: "dłoń", symbolEn: "hand", gana: "deva", motyw: "rzemiosło, precyzja, sprawczość rąk, zręczność", motywEn: "craft, precision, the power of hands, skill" },
  { index: 13, sanskrit: "Chitra", pl: "Czitra", lord: "mars", deity: "Twasztar", deityEn: "Tvashtar", symbol: "perła", symbolEn: "pearl", gana: "rakszasa", motyw: "projektowanie formy, blask, architektura, estetyka", motywEn: "shaping form, brilliance, architecture, aesthetics" },
  { index: 14, sanskrit: "Swati", pl: "Swati", lord: "rahu", deity: "Waju", deityEn: "Vayu", symbol: "młody pęd na wietrze", symbolEn: "young shoot in the wind", gana: "deva", motyw: "niezależność, elastyczność, handel, ruch", motywEn: "independence, flexibility, trade, movement" },
  { index: 15, sanskrit: "Vishakha", pl: "Wiśakha", lord: "jupiter", deity: "Indragni", deityEn: "Indra-Agni", symbol: "łuk triumfalny", symbolEn: "triumphal arch", gana: "rakszasa", motyw: "determinacja do celu, ambicja, dwoistość dążeń", motywEn: "determination toward a goal, ambition, duality of pursuits" },
  { index: 16, sanskrit: "Anuradha", pl: "Anuradha", lord: "saturn", deity: "Mitra", deityEn: "Mitra", symbol: "kwiat lotosu", symbolEn: "lotus flower", gana: "deva", motyw: "przyjaźń, oddanie, praca w grupie, wierność", motywEn: "friendship, devotion, teamwork, loyalty" },
  { index: 17, sanskrit: "Jyeshtha", pl: "Dżjesztha", lord: "mercury", deity: "Indra", deityEn: "Indra", symbol: "amulet", symbolEn: "amulet", gana: "rakszasa", motyw: "starszeństwo, ochrona, ukryta siła, ciężar odpowiedzialności", motywEn: "seniority, protection, hidden strength, the weight of responsibility" },
  { index: 18, sanskrit: "Mula", pl: "Mula", lord: "ketu", deity: "Nirriti", deityEn: "Nirriti", symbol: "korzeń", symbolEn: "root", gana: "rakszasa", motyw: "dotarcie do korzenia, dekonstrukcja, poszukiwanie prawdy", motywEn: "getting to the root, deconstruction, the search for truth" },
  { index: 19, sanskrit: "Purva Ashadha", pl: "Purwa Aszadha", lord: "venus", deity: "Apas", deityEn: "Apas", symbol: "wachlarz", symbolEn: "fan", gana: "manuszja", motyw: "niezwyciężoność, perswazja, oczyszczenie wodą", motywEn: "invincibility, persuasion, purification by water" },
  { index: 20, sanskrit: "Uttara Ashadha", pl: "Uttara Aszadha", lord: "sun", deity: "Wiśwedewowie", deityEn: "the Vishvedevas", symbol: "kieł słonia", symbolEn: "elephant's tusk", gana: "manuszja", motyw: "trwałe zwycięstwo, etyka, wytrwałość, autorytet", motywEn: "lasting victory, ethics, perseverance, authority" },
  { index: 21, sanskrit: "Shravana", pl: "Śrawana", lord: "moon", deity: "Wisznu", deityEn: "Vishnu", symbol: "ucho", symbolEn: "ear", gana: "deva", motyw: "słuchanie, nauka, przekaz tradycji, mądrość zebrana", motywEn: "listening, learning, passing on tradition, gathered wisdom" },
  { index: 22, sanskrit: "Dhanishta", pl: "Dhaniszta", lord: "mars", deity: "Wasu", deityEn: "the Vasus", symbol: "bęben", symbolEn: "drum", gana: "rakszasa", motyw: "rytm, obfitość, muzyka, grupowa energia", motywEn: "rhythm, abundance, music, group energy" },
  { index: 23, sanskrit: "Shatabhisha", pl: "Śatabhisza", lord: "rahu", deity: "Waruna", deityEn: "Varuna", symbol: "krąg", symbolEn: "circle", gana: "rakszasa", motyw: "uzdrawianie, samotność, tajemnica, niezależne badanie", motywEn: "healing, solitude, mystery, independent research" },
  { index: 24, sanskrit: "Purva Bhadrapada", pl: "Purwa Bhadrapada", lord: "jupiter", deity: "Adża Ekapad", deityEn: "Aja Ekapada", symbol: "przód mar", symbolEn: "front legs of a funeral cot", gana: "manuszja", motyw: "ogień ascezy, radykalna zmiana, wizja poza światem", motywEn: "the fire of asceticism, radical change, a vision beyond this world" },
  { index: 25, sanskrit: "Uttara Bhadrapada", pl: "Uttara Bhadrapada", lord: "saturn", deity: "Ahir Budhnja", deityEn: "Ahirbudhnya", symbol: "tył mar", symbolEn: "back legs of a funeral cot", gana: "manuszja", motyw: "głębia, spokój mędrca, ukryte wsparcie, cierpliwość", motywEn: "depth, a sage's calm, hidden support, patience" },
  { index: 26, sanskrit: "Revati", pl: "Rewati", lord: "mercury", deity: "Puszan", deityEn: "Pushan", symbol: "ryba", symbolEn: "fish", gana: "deva", motyw: "domknięcie cyklu, opieka nad drogą, współczucie, przejście", motywEn: "closing the cycle, guarding the path, compassion, transition" },
];

/**
 * Bhawy — 12 domów, ich znaczenia (karakatwa). Pełniejsza lista klasycznych
 * znaczeń (BPHS) niż samo hasło z kafla — to samo `obszar` jest używane
 * wszędzie tam, gdzie dom trzeba opisać, więc rozbudowa działa od razu
 * w całym serwisie, nie tylko w kosmogramie.
 */
export const BHAVAS: { index: number; sanskrit: string; pl: string; en: string; obszar: string; obszarEn: string }[] = [
  { index: 0, sanskrit: "Tanu", pl: "1. dom", en: "1st house", obszar: "ciało, osobowość, wygląd, witalność, sposób wchodzenia w świat, pierwsze wrażenie", obszarEn: "body, personality, appearance, vitality, the way you enter the world, first impressions" },
  { index: 1, sanskrit: "Dhana", pl: "2. dom", en: "2nd house", obszar: "zasoby, majątek zgromadzony, rodzina pochodzenia, mowa, jedzenie, twarz, wartości", obszarEn: "resources, accumulated wealth, family of origin, speech, food, the face, values" },
  { index: 2, sanskrit: "Sahaja", pl: "3. dom", en: "3rd house", obszar: "odwaga, komunikacja, rodzeństwo, umiejętności i zręczność rąk, krótkie podróże, własny wysiłek, hobby", obszarEn: "courage, communication, siblings, skills and hand dexterity, short trips, personal effort, hobbies" },
  { index: 3, sanskrit: "Sukha", pl: "4. dom", en: "4th house", obszar: "dom, matka, spokój wewnętrzny, fundament, edukacja podstawowa, nieruchomości i pojazdy, poczucie bezpieczeństwa", obszarEn: "home, mother, inner peace, foundation, basic education, property and vehicles, sense of security" },
  { index: 4, sanskrit: "Putra", pl: "5. dom", en: "5th house", obszar: "twórczość, dzieci, inteligencja, zasługi z przeszłości (purwa punja), romans, spekulacja, praktyka duchowa", obszarEn: "creativity, children, intelligence, merit from the past (purva punya), romance, speculation, spiritual practice" },
  { index: 5, sanskrit: "Ripu", pl: "6. dom", en: "6th house", obszar: "praca codzienna, przeszkody, zdrowie i choroby, służba, rywale i wrogowie, długi, spory", obszarEn: "daily work, obstacles, health and illness, service, rivals and enemies, debts, disputes" },
  { index: 6, sanskrit: "Yuvati", pl: "7. dom", en: "7th house", obszar: "partnerstwo, małżeństwo, umowy, wspólnicy biznesowi, druga strona, otwarci przeciwnicy, relacje publiczne", obszarEn: "partnership, marriage, contracts, business partners, the other side, open opponents, public relations" },
  { index: 7, sanskrit: "Randhra", pl: "8. dom", en: "8th house", obszar: "transformacja, kryzysy, wspólne zasoby, głębia okultystyczna, długowieczność, spadki, nagłe wydarzenia", obszarEn: "transformation, crises, shared resources, occult depth, longevity, inheritance, sudden events" },
  { index: 8, sanskrit: "Dharma", pl: "9. dom", en: "9th house", obszar: "sens, nauczyciele, dalekie podróże, wiara, ojciec, szczęście i fortuna, wyższa edukacja, etyka", obszarEn: "meaning, teachers, long journeys, faith, father, luck and fortune, higher education, ethics" },
  { index: 9, sanskrit: "Karma", pl: "10. dom", en: "10th house", obszar: "działanie w świecie, kariera, status, powołanie, autorytet, reputacja publiczna, władza", obszarEn: "action in the world, career, status, calling, authority, public reputation, power" },
  { index: 10, sanskrit: "Labha", pl: "11. dom", en: "11th house", obszar: "zyski, dochody, sieć kontaktów, cele, spełnianie pragnień, starsze rodzeństwo, społeczność", obszarEn: "gains, income, network of contacts, goals, fulfillment of desires, older siblings, community" },
  { index: 11, sanskrit: "Vyaya", pl: "12. dom", en: "12th house", obszar: "strata i wyzwolenie, zagranica, sen, wycofanie, duchowość i moksza, wydatki, izolacja", obszarEn: "loss and liberation, foreign lands, sleep, withdrawal, spirituality and moksha, expenses, isolation" },
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
