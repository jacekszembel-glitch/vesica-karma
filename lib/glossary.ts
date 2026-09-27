/**
 * Słownik pojęć — jedno źródło prawdy dla podpowiedzi w całym serwisie.
 *
 * Zasada: użytkownik NIGDY nie ma trafić na termin, którego nie rozumie,
 * bez możliwości sprawdzenia go na miejscu. Każdy opis pisany prostym
 * polskim — bez tłumaczenia żargonu innym żargonem.
 */

export interface Term {
  /** Nagłówek dymka — nazwa polska lub spolszczona. */
  title: string;
  /** Oryginalna nazwa sanskrycka, jeśli inna niż tytuł. */
  sanskrit?: string;
  /** Wyjaśnienie: czym to jest i co z tego wynika dla użytkownika. */
  text: string;
}

export const GLOSSARY: Record<string, Term> = {
  // ── Czas ──────────────────────────────────────────────
  mahadasza: {
    title: "Wielki okres życia",
    sanskrit: "mahadaśa",
    text: "Wieloletni rozdział życia — od 6 do 20 lat — którym „rządzi” jedna planeta. Nadaje ton całej dekadzie: jakie tematy wracają, czego życie od Ciebie wtedy chce. Każdy człowiek przechodzi je w tej samej kolejności, ale zaczyna w innym miejscu cyklu — zależnie od pozycji Księżyca przy urodzeniu.",
  },
  antardasza: {
    title: "Podokres",
    sanskrit: "antardaśa",
    text: "Krótszy etap wewnątrz wielkiego okresu — zwykle od kilku miesięcy do 3 lat. Wielki okres mówi, o czym jest ten rozdział życia; podokres mówi, co dzieje się w nim teraz. Dwie planety działają jednocześnie: gospodarz rozdziału i gość, który akurat przyszedł.",
  },
  pratjantardasza: {
    title: "Etap",
    sanskrit: "pratjantardaśa",
    text: "Najkrótszy poziom podziału czasu — tygodnie do kilku miesięcy. Przydaje się przy wyborze konkretnego terminu, nie przy planowaniu życia.",
  },
  dasza: {
    title: "Okres planetarny",
    sanskrit: "daśa",
    text: "System dzielenia życia na rozdziały, z których każdy jest pod opieką innej planety. Cały cykl trwa 120 lat i liczy się go od tego, gdzie stał Księżyc w chwili Twoich urodzin.",
  },
  vimshottari: {
    title: "Vimśottari",
    text: "Najczęściej używany w Indiach system okresów planetarnych. Nazwa znaczy „sto dwadzieścia” — tyle lat trwa pełny cykl dziewięciu wielkich okresów.",
  },

  // ── Mapa i domy ───────────────────────────────────────
  lagna: {
    title: "Znak wschodzący",
    sanskrit: "lagna, ascendent",
    text: "Znak, który wschodził nad horyzontem dokładnie w chwili i miejscu Twoich narodzin. Zmienia się co około dwie godziny, więc to on najbardziej odróżnia mapy dwóch osób urodzonych tego samego dnia. Opisuje, jak wchodzisz w świat i jak widzą Cię inni.",
  },
  dom: {
    title: "Dom",
    sanskrit: "bhawa",
    text: "Jeden z dwunastu obszarów życia — praca, dom, relacje, pieniądze, zdrowie i tak dalej. Planeta stojąca w danym domu wnosi swój charakter w tę część życia.",
  },
  graha: {
    title: "9 grah",
    sanskrit: "graha",
    text: "Dziewięć „chwytających” punktów nieba, które liczy astrologia wedyjska: Słońce, Księżyc, Mars, Merkury, Jowisz, Wenus, Saturn oraz dwa punkty węzłów Księżyca — Rahu i Ketu. Każda ma swój charakter i „chwyta” inny obszar życia, zależnie od tego, w jakim znaku i domu stoi w Twojej mapie.",
  },
  nakszatra: {
    title: "Nakszatra",
    text: "Dwadzieścia siedem odcinków nieba, przez które przechodzi Księżyc w ciągu miesiąca — dawniej mówiono „domy Księżyca”. Każdy ma swoje bóstwo, symbol i charakter. Nakszatra Twojego Księżyca to najbardziej osobisty punkt całej mapy: opisuje, z czego jesteś zrobiony wewnątrz.",
  },
  pada: {
    title: "Ćwiartka",
    sanskrit: "pada",
    text: "Każda nakszatra dzieli się na cztery części. Ćwiartka doprecyzowuje odcień: ta sama nakszatra w innej ćwiartce działa nieco inaczej.",
  },

  // ── Vargi ─────────────────────────────────────────────
  nawamsza: {
    title: "Nawamsza (D9)",
    text: "Druga mapa, liczona przez podzielenie każdego znaku na dziewięć części. Astrolodzy indyjscy czytają ją zaraz po głównej: pokazuje wewnętrzną siłę planet i temat związków. Planeta słaba w mapie głównej, ale mocna tutaj, i tak się w końcu obroni.",
  },
  dasamsza: {
    title: "Daśamsza (D10)",
    text: "Mapa podzielona na dziesięć części, czytana pod kątem pracy i pozycji zawodowej. Mówi nie tyle „kim jesteś”, ile „jak działasz w świecie zawodowym i co Cię tam niesie”.",
  },
  hora: {
    title: "Hora (D2)",
    text: "Najprostsza z map podziałowych — dzieli każdy znak tylko na dwie połowy, hora Słońca i hora Księżyca. Nie pokazuje pełnego wykresu 12 znaków jak reszta varg, tylko odpowiada na jedno pytanie: czy dana planeta działa bardziej w trybie aktywnego zdobywania (Słońce), czy gromadzenia i oszczędzania (Księżyc). Używana przy temacie majątku.",
  },
  indulagna: {
    title: "Indu Lagna",
    text: "Klasyczny „ascendent bogactwa” (BPHS) — punkt liczony z Kali (wartości liczbowych) władców 9. domu od lagny i od Księżyca, zliczony w znakach od Księżyca. Dobroczyńcy w tym znaku lub aspektujący go wzmacniają dobrobyt; złoczyńcy go osłabiają.",
  },
  drekkana: {
    title: "Drekkana (D3)",
    text: "Mapa podzielona na trzy części na znak, czytana pod kątem rodzeństwa, odwagi i własnego wysiłku — tego, co robisz z inicjatywy, a nie z przymusu.",
  },
  czaturthamsza: {
    title: "Czaturthamsza (D4)",
    text: "Mapa podzielona na cztery części na znak, czytana pod kątem domu, majątku nieruchomego i wewnętrznego poczucia szczęścia — tego, co daje Ci grunt pod nogami.",
  },
  saptamsza: {
    title: "Saptamsza (D7)",
    text: "Mapa podzielona na siedem części na znak, czytana pod kątem dzieci i potomności — tego, co po Tobie zostaje i co tworzysz na przyszłość.",
  },
  dwadasamsza: {
    title: "Dwadaśamsza (D12)",
    text: "Mapa podzielona na dwanaście części na znak, czytana pod kątem rodziców — tego, co odziedziczyłeś/aś, zanim zacząłeś/aś budować cokolwiek sam(a).",
  },
  szodasamsza: {
    title: "Szodaśamsza (D16)",
    text: "Mapa podzielona na szesnaście części na znak (bywa zwana Kalamsza), czytana pod kątem pojazdów, komfortu materialnego i ogólnego szczęścia lub jego braku — codziennych przyjemności i utrapień, nie wielkich tematów życia.",
  },
  wimszamsza: {
    title: "Wimszamsza (D20)",
    text: "Mapa podzielona na dwadzieścia części na znak, czytana pod kątem duchowej praktyki, kultu i wrażliwości duchowej — tego, jak i czy szukasz czegoś poza codziennością, niezależnie od wyznawanej tradycji.",
  },
  czaturwimszamsza: {
    title: "Czaturwimszamsza (D24)",
    text: "Mapa podzielona na dwadzieścia cztery części na znak, czytana pod kątem nauki i wiedzy. Bywa nazywana Siddhamszą, bo tradycyjnie wiąże się też z siddhi (duchowymi osiągnięciami/mocami) — jako efektem ubocznym nauki i dyscypliny, nie jako główny temat.",
  },
  szasztiamsza: {
    title: "Szasztiamsza (D60)",
    text: "Najdrobniejszy klasyczny podział — mapa podzielona na sześćdziesiąt części na znak (po 0,5°). Czytana jako ślad poprzednich wcieleń i najgłębsza warstwa karmy, poza świadomą kontrolą — dlatego wiąże się z Atmakaraką i Profilem Duszy bardziej niż inne wargi.",
  },
  asztakawarga: {
    title: "Asztakawarga",
    text: "Osobny system punktowy — nie ocenia planet wprost, tylko liczy, ile z ośmiu źródeł (siedem grah i lagna) wskazuje dany znak jako sprzyjający. Znak z wysoką liczbą punktów (bindu) to ogólnie mocniejszy grunt: okresy i tranzyty przechodzące przezeń działają pewniej, z mniejszym oporem, niezależnie od tego, co inaczej mówi o nim reszta mapy.",
  },
  szadbala: {
    title: "Szadbala",
    text: "Klasyczna, liczbowa sześcioraka siła planet — łączy siłę pozycyjną, kierunkową, czasową, ruchu, naturalną i aspektu w jedną liczbę (w rupach). Wysoka Szadbala oznacza planetę zdolną w pełni zrealizować to, co obiecuje w mapie; niska — że temat tej planety realizuje się z opóźnieniem albo częściowo, nawet jeśli inne wskaźniki wyglądają dobrze.",
  },
  vargottama: {
    title: "Vargottama",
    text: "Planeta, która w mapie głównej i w nawamszy (D9) stoi w tym samym znaku. To sygnał wyjątkowej spójności — taka planeta działa zgodnie ze sobą na zewnątrz i wewnątrz, więc uchodzi za szczególnie mocną i wiarygodną w mapie. Ważne: vargottama wzmacnia to, co planeta i tak reprezentuje — dlatego kolor odznaki podąża za jej godnością: zielony, gdy wzmacnia coś dobrego (egzaltacja, władanie, przyjazny znak), czerwony, gdy wzmacnia trudność (upadek, wrogi znak), złoty przy godności neutralnej.",
  },

  jogakaraka: {
    title: "Jogakaraka",
    text: "Planeta, która dla Twojego znaku wschodzącego włada jednocześnie domem narożnym (kendrą) i domem szczęścia (trikoną). Jej okresy uchodzą za znakomite niezależnie od natury planety — Saturn, zwykle surowy, dla lagny Byka i Wagi staje się największym sprzymierzeńcem. Lista jest stała: Saturn (Byk, Waga), Mars (Rak, Lew), Wenus (Koziorożec, Wodnik).",
  },
  atmakaraka: {
    title: "Atmakaraka",
    sanskrit: "atmakaraka",
    text: "W systemie Dżajminiego: planeta o najwyższym stopniu w znaku — wskaźnik duszy, głównego tematu i celu tego życia. Za nią idzie siedem kolejnych karak, od kariery (amatjakaraka) po partnera (darakaraka). U nas schemat ośmiu karak z Rahu, którego stopień liczy się odwrotnie, bo węzeł porusza się wstecz.",
  },
  karaki: {
    title: "Karaki czarowe",
    text: "Osiem ról przyznawanych planetom według stopnia przebytego w znaku — od duszy (atmakaraka, najwyższy stopień) po partnera (darakaraka, najniższy). To oddzielny system odczytu (Dżajmini), uzupełniający klasyczne domy.",
  },
  jogiklasyczne: {
    title: "Jogi klasyczne",
    sanskrit: "yoga",
    text: "Powtarzalne, nazwane układy planet i domów, które klasyczna astrologia wedyjska łączy z konkretnym talentem lub rodzajem szczęścia — np. „władca kendry połączony z władcą trikony” zawsze czyta się jako Radźa jogę, niezależnie od tego, u kogo występuje. Pokazujemy tylko te jogi, które faktycznie wykryliśmy w Twojej mapie — nie generyczną listę.",
  },

  // ── Purusharthy — cztery cele życia ────────────────────
  dharma: {
    title: "Dharma",
    sanskrit: "dharma",
    text: "Pierwszy z czterech klasycznych celów życia (purusharth): sens, powołanie, droga i obowiązek — po co tu jesteś i według jakich zasad działasz. W kosmogramie odpowiadają jej domy 1, 5 i 9 (tożsamość, twórczość i wiara, szczęście i nauczyciele).",
  },
  artha: {
    title: "Artha",
    sanskrit: "artha",
    text: "Drugi z czterech celów życia: środki do życia — praca, pieniądze, status, materialne zabezpieczenie. W kosmogramie odpowiadają jej domy 2, 6 i 10 (zasoby, codzienna praca i zdrowie, kariera).",
  },
  kama: {
    title: "Kama",
    sanskrit: "kama",
    text: "Trzeci z czterech celów życia: pragnienia, przyjemność i więzi — to, czego chcesz doświadczyć i z kim. W kosmogramie odpowiadają jej domy 3, 7 i 11 (inicjatywa i bliscy, partnerstwo, przyjaźnie i zyski).",
  },
  moksza: {
    title: "Moksza",
    sanskrit: "mokṣa",
    text: "Czwarty, ostatni z czterech celów życia: wolność i głębia — wyzwolenie z automatycznych wzorców, duchowość, to, co wykracza poza codzienne zdobywanie. W kosmogramie odpowiadają jej domy 4, 8 i 12 (wewnętrzny spokój, kryzysy i przemiana, odpuszczanie).",
  },

  // ── Stany planet ──────────────────────────────────────
  egzaltacja: {
    title: "Egzaltacja",
    sanskrit: "uććha",
    text: "Znak, w którym planeta działa najpełniej — jakby była u siebie w najlepszej formie. Jej cechy widać wyraźnie i raczej od dobrej strony.",
  },
  upadek: {
    title: "Upadek",
    sanskrit: "nićća",
    text: "Znak przeciwny do egzaltacji — planeta działa tu z trudem, nie wprost. Nie jest to wyrok: bardzo często oznacza obszar, w którym człowiek dojrzewa najbardziej, tylko dłużej to trwa.",
  },
  mulatrikona: {
    title: "Mulatrikona",
    text: "Wycinek znaku, w którym planeta działa najsilniej — mocniej nawet niż zwykłe „u siebie”. Każda planeta ma tylko jeden taki odcinek, na przykład Słońce w Lwie do 20. stopnia. Planeta stojąca w nim jest w mapie wyjątkowo skuteczna.",
  },
  wladanie: {
    title: "Planeta u siebie",
    sanskrit: "swaksetra",
    text: "Planeta stoi w znaku, którym sama włada — jak gospodarz we własnym domu. Działa swobodnie i przewidywalnie, bez oglądania się na innych.",
  },
  znak_przyjazny: {
    title: "Znak przyjaciela",
    text: "Planeta jest gościem w znaku, którym włada jej naturalny przyjaciel. Nie jest u siebie, ale ma wsparcie — działa spokojnie i bez oporu.",
  },
  znak_wrogi: {
    title: "Znak wroga",
    text: "Planeta stoi w znaku, którym włada planeta jej niechętna. To nie wyrok — raczej obszar, gdzie trzeba się bardziej starać i gdzie sprawy idą pod prąd, zanim zaskoczą.",
  },
  znak_neutralny: {
    title: "Znak neutralny",
    text: "Ani wsparcia, ani przeszkód ze strony władcy znaku. Planeta działa po prostu po swojemu.",
  },
  spalenie: {
    title: "Spalenie",
    sanskrit: "astangata",
    text: "Planeta stojąca zbyt blisko Słońca — jak gwiazda niewidoczna w świetle dnia. Jej działanie schodzi do wewnątrz: mniej widać je na zewnątrz, bardziej czuć w środku.",
  },
  retrogradacja: {
    title: "Ruch wsteczny",
    text: "Złudzenie optyczne: z Ziemi wygląda, jakby planeta cofała się po niebie. W interpretacji oznacza temat, który wraca — coś, do czego trzeba podejść drugi raz, zwykle głębiej niż za pierwszym.",
  },

  // ── Panczanga ─────────────────────────────────────────
  panczanga: {
    title: "Panczanga",
    text: "Indyjski kalendarz dnia, złożony z pięciu elementów: tithi, vara, nakszatra, joga i karana. Razem opisują, do czego dany dzień się nadaje.",
  },
  tithi: {
    title: "Dzień księżycowy",
    sanskrit: "tithi",
    text: "Odcinek drogi Księżyca od Słońca — trzydzieści takich odcinków składa się na miesiąc księżycowy. Mówi, czy energia dnia rośnie (po nowiu), czy opada (po pełni).",
  },
  vara: {
    title: "Dzień tygodnia",
    sanskrit: "vara",
    text: "Każdym dniem tygodnia włada inna planeta — poniedziałek Księżyc, wtorek Mars i tak dalej. To najstarszy i najprostszy wskaźnik: do czego ten dzień naturalnie ciągnie.",
  },
  joga: {
    title: "Joga dnia",
    text: "Wskaźnik liczony ze wspólnego położenia Słońca i Księżyca — dwadzieścia siedem możliwości. Jedne sprzyjają spełnianiu zamiarów, inne każą raczej poczekać.",
  },
  karana: {
    title: "Pół dnia księżycowego",
    sanskrit: "karana",
    text: "Połowa tithi. Warto znać jedną: Bhadra (Viszti) uchodzi za czas, w którym lepiej nie zaczynać ważnych spraw.",
  },
  tarabala: {
    title: "Siła gwiazdy dnia",
    sanskrit: "tarabala",
    text: "Osobisty wskaźnik: porównuje nakszatrę dzisiejszego Księżyca z nakszatrą Twojego Księżyca urodzeniowego. Ten sam dzień bywa dobry dla jednej osoby, a nijaki dla drugiej — właśnie przez to.",
  },
  czandrabala: {
    title: "Siła Księżyca",
    sanskrit: "ćandrabala",
    text: "Sprawdza, w którym domu — licząc od Twojego Księżyca urodzeniowego — stoi dziś Księżyc. Niektóre pozycje sprzyjają działaniu, inne raczej odpoczynkowi.",
  },
  muhurta: {
    title: "Wybór momentu",
    sanskrit: "muhurta",
    text: "Sztuka dobierania dobrej chwili na konkretne działanie — podpisanie umowy, podróż, start projektu. Nie chodzi o wróżenie, tylko o płynięcie z prądem zamiast pod prąd.",
  },

  // ── Tranzyty ──────────────────────────────────────────
  gochara: {
    title: "Tranzyty",
    sanskrit: "goćara",
    text: "Gdzie planety są dziś na niebie, w odniesieniu do Twojego Księżyca urodzeniowego. Mapa urodzeniowa to Twój stały układ; tranzyty to pogoda, która nad nim przechodzi.",
  },
  sadesati: {
    title: "Sade Sati",
    text: "Około siedmioipółletni przemarsz Saturna przez trzy znaki wokół Twojego Księżyca urodzeniowego. Ma opinię trudnego, ale rzetelnie: to czas porządkowania, dojrzewania i odcinania tego, co przestało pasować. Zdarza się dwa–trzy razy w życiu.",
  },
  dhaija: {
    title: "Dhaija",
    text: "Krótszy, około dwuipółletni przejazd Saturna przez czwarty lub ósmy dom od Twojego Księżyca. Podobny charakter co Sade Sati, tylko łagodniejszy i krótszy.",
  },

  // ── Dopasowanie ───────────────────────────────────────
  gunamilan: {
    title: "Dopasowanie ośmiu kryteriów",
    sanskrit: "guna milan, asztakuta",
    text: "Tradycyjne porównanie dwóch map przez osiem kryteriów, razem 36 punktów. W Indiach używane przy zaręczynach. Wynik czytamy jako mapę pracy nad związkiem, nie jako wyrok — niski wynik nie przekreśla pary, wysoki niczego nie gwarantuje.",
  },
  kuta: {
    title: "Kryterium dopasowania",
    sanskrit: "kuta",
    text: "Jeden z ośmiu wymiarów porównania — na przykład zgodność temperamentów, wspólnych celów albo bliskości fizycznej. Każdy ma inną wagę punktową.",
  },
  dosza: {
    title: "Zastrzeżenie",
    sanskrit: "dosza",
    text: "Klasyczne ostrzeżenie w porównaniu map — sygnał, że jakiś obszar wymaga świadomej uwagi. Tradycja zna też sposoby jego łagodzenia; nigdy nie traktujemy tego jako przeszkody nie do przejścia.",
  },

  // ── Astrokartografia ──────────────────────────────────
  zasieg: {
    title: "Zasięg oddziaływania",
    text: "Linia na mapie to nie granica — działa też w pasie wokół siebie. Jim Lewis, twórca astrokartografii, przyjmował ok. 1125 km (700 mil) po obu stronach jako granicę odczuwalnego wpływu, a najmocniej działa pas do jakichś 250 km. Nowsze obserwacje wskazują raczej na tę węższą wartość. Praktycznie: nie musisz mieszkać na linii, żeby ją czuć, ale im bliżej, tym wyraźniej.",
  },
  liniaplanetarna: {
    title: "Linia planetarna",
    text: "Miejsca na Ziemi, w których dana planeta stała w wyróżnionym punkcie nieba dokładnie w chwili Twoich narodzin — nad głową, pod stopami albo na horyzoncie. Mieszkając blisko takiej linii, mocniej czujesz temat tej planety w codziennym życiu.",
  },
  mcic: {
    title: "MC i IC",
    text: "MC (górowanie) to miejsca, gdzie planeta była najwyżej na niebie — wzmacnia karierę, widoczność, to, z czym Cię ludzie kojarzą. IC (dołowanie) to strona przeciwna — dom, korzenie, życie wewnętrzne.",
  },
  ascdsc: {
    title: "ASC i DSC",
    text: "ASC (wschód) to miejsca, gdzie planeta właśnie wschodziła — dotyczy Ciebie samego: ciała, energii, nowych początków. DSC (zachód) to druga strona — relacje, partnerstwo, współpraca.",
  },

  // ── Konwencje ─────────────────────────────────────────
  syderyczny: {
    title: "Zodiak syderyczny",
    text: "Liczenie znaków według rzeczywistego położenia gwiazd na niebie — tak robi astrologia indyjska. Horoskopy prasowe używają innego układu, przesuniętego o prawie cały znak. Dlatego Twój znak może tu wyjść inny i nie jest to pomyłka.",
  },
  ayanamsa: {
    title: "Ayanamsa",
    text: "Różnica między zodiakiem gwiazdowym a zachodnim — dziś około 24 stopni i powoli rosnąca. Używamy wartości Lahiri, standardu urzędowego w Indiach.",
  },
  wholesign: {
    title: "Domy „cały znak”",
    text: "Najstarszy sposób dzielenia mapy: jeden znak to jeden dom, bez reszty. Programy zachodnie tną domy pod innym kątem, przez co część planet wypada u nich w sąsiednim obszarze życia.",
  },
  rahuketu: {
    title: "Rahu i Ketu",
    text: "Dwa punkty, w których droga Księżyca przecina drogę Słońca — tam zdarzają się zaćmienia. Nie są ciałami niebieskimi, ale w tradycji indyjskiej traktuje się je jak planety. Opisują to, co Cię ciągnie do przodu (Rahu) i co już masz przerobione (Ketu).",
  },

  // ── Numerologia ───────────────────────────────────────
  drogazycia: {
    title: "Liczba drogi życia",
    text: "Sumujemy wszystkie cyfry pełnej daty urodzenia (rok, miesiąc, dzień) i redukujemy do jednej cyfry — np. 11.04.1981 → 1+1+0+4+1+9+8+1 = 25 → 2+5 = 7. W systemach zachodnich liczby mistrzowskie 11, 22 i 33 zatrzymują się na tym etapie i nie są redukowane dalej. To najważniejsza liczba w numerologii — główny kierunek i temat całego życia.",
  },
  liczbaurodzenia: {
    title: "Liczba urodzenia · Mulank",
    sanskrit: "mulank",
    text: "Liczymy tylko z dnia miesiąca, w którym się urodziłaś/eś — np. urodzeni 23. dnia: 2+3 = 5. Pokazuje wrodzony temperament, to, jak naturalnie działasz na co dzień. W wedyjskim (mulank) zawsze redukujemy do 1–9, bo każdej cyfrze przypisana jest planeta; w systemach zachodnich dni 11 i 22 zostają jako liczby mistrzowskie.",
  },
  liczbaprzeznaczenia: {
    title: "Liczba przeznaczenia · Bhagyank",
    sanskrit: "bhagyank",
    text: "Ta sama suma cyfr co przy liczbie drogi życia (cała data urodzenia), ale redukowana do końca, bez wyjątków dla liczb mistrzowskich. Opisuje szerszy los i okoliczności, które będą się powtarzać niezależnie od Twoich wyborów.",
  },
  rokosobisty: {
    title: "Rok osobisty",
    text: "Zredukowany dzień urodzenia + zredukowany miesiąc urodzenia + bieżący rok, zsumowane i zredukowane do jednej cyfry. Zmienia się co roku (zwykle w okolicy urodzin) i pokazuje ogólny „klimat” najbliższych 12 miesięcy — czy to czas na start, żniwa, odpoczynek czy zamykanie spraw.",
  },
  numekspresja: {
    title: "Liczba ekspresji",
    text: "Suma wartości liczbowych wszystkich liter imienia i nazwiska (każda litera ma przypisaną wartość w wybranym systemie — pitagorejskim lub chaldejskim), zredukowana do jednej cyfry. Opisuje naturalne talenty i sposób, w jaki wyrażasz siebie na zewnątrz.",
  },
  numdusza: {
    title: "Liczba duszy",
    sanskrit: "soul urge",
    text: "Suma wartości samych samogłosek (a, e, i, o, u, y) w imieniu i nazwisku. Pokazuje wewnętrzne pragnienia — czego naprawdę chcesz, niezależnie od tego, co pokazujesz innym.",
  },
  numosobowosc: {
    title: "Liczba osobowości",
    text: "Suma wartości samych spółgłosek w imieniu i nazwisku — czyli to, co zostaje z ekspresji po odjęciu samogłosek (duszy). Opisuje pierwsze wrażenie: jak widzą Cię inni, zanim Cię poznają bliżej.",
  },
  relacjamulankbhagyank: {
    title: "Mulank ↔ Bhagyank",
    text: "Klasyczna numerologia wedyjska nie sumuje Mulanka i Bhagyanka w trzecią liczbę — porównuje planety, którym podlegają, przez naturalną przyjaźń (ta sama zasada co graha maitri w kosmogramie). Wynik: czy Twoja natura i Twoja droga życia naturalnie się wspierają, czy wymagają świadomego godzenia.",
  },
  loshu: {
    title: "Siatka Lo Shu",
    text: "Stary chiński magiczny kwadrat 3×3 użyty jako mapa daty urodzenia: liczymy, ile razy każda cyfra 1–9 pojawia się w zapisie dnia, miesiąca i roku urodzenia. Puste pola pokazują cechy, których w dacie brakuje — nie ich brak w Tobie, tylko obszary, które trzeba budować świadomie, a nie z automatu.",
  },

  // ── Karma (most między systemami) ──────────────────────
  karma: {
    title: "Karma",
    text: "Przy narodzinach spełnione są trzy warunki — czas, miejsce i rodzina (ciało, imię i nazwisko) — z których każdy karmi inny system odczytu: czas i miejsce astrologię, czas i imię numerologię, ciało chiromancję. Gdy niezależne systemy wskazują to samo, to mocniejszy sygnał niż jeden system osobno. Tu łączymy dwa, które w pełni działają — numerologię i astrologię; chiromancja to trzeci filar, jeszcze nie zbudowany.",
  },
  hiromancja: {
    title: "Chiromancja",
    text: "Wróżenie z dłoni — tu z DWÓCH dłoni naraz, tak jak w astrologii wedyjskiej czyta się D1 obok D9: dłoń dominująca (ta, którą piszesz) pokazuje przejawione życie i świadome wybory, dłoń bierna — wrodzony potencjał i talenty. Strona dzieli się na dwie osobne części: geometryczny typ dłoni (Ziemia/Powietrze/Ogień/Woda), liczony deterministycznie z punktów, które sam/sama wskażesz na zdjęciu, oraz AI-owy, jakościowy odczyt widocznych linii serca, głowy, życia i losu — subiektywna obserwacja, nie pomiar.",
  },
  potwierdzeniekarmy: {
    title: "Potwierdzenie / napięcie",
    text: "Czy planeta, którą numerologia wskazała jako Twój temat (Mulank albo Bhagyank), jest w Twojej mapie astrologicznej silna i dobrze osadzona (potwierdzenie), słaba i obciążona (napięcie), czy ani jedno, ani drugie (neutralne). To odczytanie tej samej oceny astrologicznej, która stoi za Predyspozycjami i Rankingiem Grah — nie nowy, osobny rachunek.",
  },
};

/** Bezpieczne pobranie hasła. */
export function term(key: string): Term | null {
  return GLOSSARY[key] ?? null;
}
