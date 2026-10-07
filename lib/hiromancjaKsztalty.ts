/**
 * KATALOG TRADYCYJNYCH KSZTAŁTÓW Z LINII — chiromancja zachodnia i indyjska (Samudrika Śastra).
 * Reguła: AI przy każdych oględzinach i przy każdym odczycie sprawdza CAŁY ten katalog — kształty
 * tworzą się z układu kilku linii naraz i łatwo je przeoczyć, oglądając linie osobno. Ten sam katalog
 * pokazuje przewodnik (osoba zaznacza, co ma). Znaczenia to klasyczne odczytania, nie wyrocznia.
 *
 * Kształty z osobnymi pytaniami w przewodniku (krzyż mistyczny, ryba, trójkąty, łódź) też tu są —
 * AI ma ich szukać zawsze; przewodnik nie pyta o nie drugi raz (OSOBNE_PYTANIA).
 */

export interface KsztaltLinii {
  id: string;
  nazwa: string;
  /** Jak wygląda / z czego powstaje — dla AI i dla osoby. */
  wyglad: string;
  /** Klasyczne znaczenie — krótko. */
  znaczenie: string;
}

export const KSZTALTY: KsztaltLinii[] = [
  // --- z linii głównych ---
  { id: "trojkat_pieniedzy", nazwa: "trójkąt pieniędzy", wyglad: "linia głowy, linia losu i linia Merkurego zamykają trójkąt w środku dłoni (bok może być słaby albo z kresek)", znaczenie: "dobrobyt i sukces dzięki własnej pracy i umysłowi" },
  { id: "wielki_trojkat", nazwa: "wielki trójkąt", wyglad: "linia życia, linia głowy i linia Merkurego zamykają duży trójkąt na środku dłoni", znaczenie: "szerokie horyzonty, hojność, szczęście w życiu" },
  { id: "lodz", nazwa: "łódź", wyglad: "wydłużony zamknięty kształt z linii losu, łuku linii życia i linii głowy, po stronie kciuka, domknięty u dołu", znaczenie: "dalekie podróże, sprawy z zagranicą, dobrobyt z dalekich stron" },
  { id: "czworobok", nazwa: "czworobok (szeroki albo wąski)", wyglad: "pole między linią serca a linią głowy — zwróć uwagę, czy szerokie i równe, czy wąskie albo zwężone na jednym końcu", znaczenie: "szeroki: otwartość, tolerancja; wąski: ostrożność, skupienie na sobie" },
  { id: "krzyz_mistyczny", nazwa: "krzyż mistyczny", wyglad: "wyraźny krzyżyk w czworoboku między linią serca a głowy, często utworzony przez linię losu", znaczenie: "intuicja, zainteresowanie duchowością i tym, co ukryte" },
  { id: "litera_m", nazwa: "litera M", wyglad: "linie życia, głowy, serca i losu układają się w wyraźną literę M na środku dłoni", znaczenie: "intuicja, przedsiębiorczość, zdolność prowadzenia innych" },
  { id: "linia_malpia", nazwa: "linia małpia (zlana)", wyglad: "linia serca i linia głowy zlane w jedną poziomą bruzdę przez całą dłoń", znaczenie: "skrajna intensywność — uczucia i rozum działają jak jedno, wielka koncentracja" },
  { id: "linia_sydney", nazwa: "linia Sydney", wyglad: "linia głowy biegnie prosto przez całą szerokość dłoni aż do jej krawędzi", znaczenie: "silny, uparty umysł, skłonność do skrajności w myśleniu" },
  { id: "pierscien_salomona", nazwa: "pierścień Salomona", wyglad: "łuk wokół nasady palca wskazującego, na wzgórku Jowisza", znaczenie: "mądrość, znajomość ludzi, dar doradzania i nauczania" },
  { id: "pierscien_saturna", nazwa: "pierścień Saturna", wyglad: "łuk wokół nasady palca środkowego, na wzgórku Saturna", znaczenie: "samotność, trudność w zaufaniu, potrzeba dyscypliny" },
  { id: "pierscien_slonca", nazwa: "pierścień Słońca", wyglad: "łuk wokół nasady palca serdecznego", znaczenie: "trudności w pokazaniu swojego talentu światu" },
  { id: "pas_wenus", nazwa: "pas Wenus", wyglad: "półkolisty łuk nad linią serca, od przerwy między wskazującym a środkowym do przerwy między serdecznym a małym", znaczenie: "wrażliwość, silne emocje, artystyczna natura" },
  { id: "kwadrat_nauczyciela", nazwa: "kwadrat nauczyciela", wyglad: "mały kwadrat na wzgórku Jowisza, pod palcem wskazującym", znaczenie: "dar uczenia i przekazywania wiedzy" },
  { id: "trojzab", nazwa: "trójząb", wyglad: "linia (najczęściej Słońca, czasem losu albo serca) kończy się trzema odnogami jak trójząb", znaczenie: "wyjątkowe powodzenie i uznanie w dziedzinie tej linii" },
  { id: "lancuch", nazwa: "łańcuszek", wyglad: "odcinek linii złożony z drobnych pętelek jak ogniwa łańcucha", znaczenie: "w tym okresie lub obszarze — rozproszenie sił, napięcie, niestałość" },
  { id: "kolo", nazwa: "koło", wyglad: "mały zamknięty okrąg na wzgórku albo na linii", znaczenie: "na wzgórku Słońca — sława; gdzie indziej — przeszkoda, z której trudno wyjść" },
  { id: "bransoletka_luk", nazwa: "pierwsza bransoletka łukiem", wyglad: "najwyższa linia na nadgarstku wygina się łukiem w górę, w stronę dłoni", znaczenie: "klasycznie: zwracać uwagę na zdrowie i siły" },
  { id: "linie_wplywu", nazwa: "linie wpływu", wyglad: "linie biegnące z wzgórka Wenus albo Księżyca równolegle do linii losu lub ją przecinające", znaczenie: "ważni ludzie, którzy wpływają na drogę życia" },
  // --- znaki indyjskie (Samudrika Śastra) ---
  { id: "ryba", nazwa: "ryba (matsja)", wyglad: "wydłużony kształt z dwóch łuków jak rybie ciało, z otwartym ogonem; najczęściej nad nadgarstkiem, na wzgórku Księżyca albo Wenus", znaczenie: "szczęście, dobrobyt, zasługa duchowa" },
  { id: "trisul", nazwa: "trójząb Śiwy (triśula)", wyglad: "kształt trójzębu na wzgórku Jowisza albo pod palcem wskazującym", znaczenie: "władza, ochrona, rozwój duchowy" },
  { id: "muszla", nazwa: "muszla (śankha)", wyglad: "spiralny kształt jak muszla, zwykle na wzgórku albo przy kciuku", znaczenie: "dobre imię, szczęście w nauce i duchowości" },
  { id: "lotos", nazwa: "lotos (kamala)", wyglad: "kształt kwiatu z kilku łuków jak płatki", znaczenie: "czystość, wysoka pozycja, szczęście" },
  { id: "flaga", nazwa: "flaga (dhwadża)", wyglad: "pionowa kreska z małym trójkątem albo prostokątem u góry jak chorągiewka", znaczenie: "sukces, zwycięstwo, uznanie" },
  { id: "swiatynia", nazwa: "świątynia (mandir)", wyglad: "kształt jak dach albo kopuła świątyni — trójkąt nad czworokątem", znaczenie: "pobożność, szacunek, spokój w starszym wieku" },
  { id: "dzban", nazwa: "dzban (kalaśa)", wyglad: "kształt naczynia z szyjką", znaczenie: "dostatek, pomyślność, dobre uczynki" },
  { id: "parasol", nazwa: "parasol (ćhatra)", wyglad: "łuk jak czasza parasola z pionową kreską pod spodem", znaczenie: "ochrona, opieka nad innymi, wysoka pozycja" },
  { id: "luk", nazwa: "łuk (dhanuś)", wyglad: "wygięta linia z cięciwą jak łuk do strzelania", znaczenie: "odwaga, osiąganie celów" },
  { id: "drzewo", nazwa: "drzewo (wrikśa)", wyglad: "linia rozgałęziająca się w górę jak gałęzie drzewa", znaczenie: "rozwój, płodność, rosnące zasoby" },
  { id: "zboze", nazwa: "ziarno jęczmienia (jawa)", wyglad: "mała wyspa w kształcie ziarna, najczęściej na kciuku w zgięciu stawu", znaczenie: "dobrobyt, wiedza, szczęście w życiu" },
];

/** Kształty, o które przewodnik pyta osobno — w ogólnym pytaniu o kształty ich nie powtarzamy. */
export const OSOBNE_PYTANIA = new Set(["trojkat_pieniedzy", "wielki_trojkat", "lodz", "krzyz_mistyczny", "ryba"]);

export const ID_KSZTALTOW = KSZTALTY.map((k) => k.id);

/** Katalog jako tekst do poleceń dla AI. */
export function katalogDlaAI(): string {
  return KSZTALTY.map((k) => `- ${k.id} — ${k.nazwa}: ${k.wyglad}`).join("\n");
}
