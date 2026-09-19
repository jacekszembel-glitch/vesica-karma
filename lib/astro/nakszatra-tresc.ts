import { NAKSHATRAS, GRAHAS, RASIS, VIMSHOTTARI_YEARS } from "./constants";
import { NAKSHATRA_SPAN, PADA_SPAN } from "./nakshatra";
import { navamsaSign } from "./varga";
import { normalizePlace } from "@/lib/geo";

/**
 * Treści opisowe 27 nakszatr — warstwa interpretacyjna nad danymi klasycznymi.
 *
 * Wszystko, co da się POLICZYĆ (zakres stopni, pady, znaki nawamszy, władca,
 * lata w cyklu Vimshottari, zgodność yoni/gana/nadi), liczą wyliczenia — patrz
 * `opisNakszatry()` niżej. Tutaj jest wyłącznie to, czego policzyć się nie da:
 * mocne strony, cień i kierunki życiowe, wyprowadzone z bóstwa, symbolu,
 * ganu i władcy zapisanych w `constants.ts`.
 *
 * DO PRZEGLĄDU PRZEZ JACKA — to podstawa do rozbudowy, nie ostatnie słowo.
 */

export interface TrescNakszatry {
  /** Jedno zdanie oddające sedno — używane też w opisie strony. */
  sedno: string;
  mocneStrony: string[];
  cien: string[];
  /** Naturalne kierunki i zajęcia. */
  kierunki: string;
  /** Jak ta nakszatra działa w bliskich relacjach. */
  relacje: string;
}

export const TRESCI: Record<number, TrescNakszatry> = {
  0: {
    sedno: "Pierwsza iskra — ta, która rusza, zanim inni skończą się zastanawiać.",
    mocneStrony: ["błyskawiczne działanie i odwaga w rozpoczynaniu", "naturalny zmysł uzdrawiania i pierwszej pomocy", "energia, która zaraża innych i wyrywa ich z bezruchu"],
    cien: ["niecierpliwość — porzucanie rzeczy tuż przed metą", "działanie zanim obraz sytuacji będzie pełny"],
    kierunki: "medycyna i ratownictwo, sport, wszystko, co wymaga szybkiej reakcji, oraz zakładanie rzeczy od zera.",
    relacje: "Wchodzisz w relacje szybko i szczerze. Trudniej Ci wytrwać w monotonii niż w kryzysie — związek z Tobą potrzebuje ruchu, nie rutyny.",
  },
  1: {
    sedno: "Strażnik progu — ten, kto wytrzymuje intensywność, przed którą inni uciekają.",
    mocneStrony: ["ogromna wytrzymałość psychiczna", "zdolność przeprowadzania siebie i innych przez trudne przejścia", "jasne poczucie granic i tego, co się należy"],
    cien: ["skłonność do skrajności — wszystko albo nic", "zazdrość i trudność z odpuszczaniem"],
    kierunki: "położnictwo i opieka okołoporodowa, praca z kryzysem, prawo, wszystko, co dotyczy początków i końców.",
    relacje: "Kochasz mocno i zaborczo. Twoja siła w związku ujawnia się wtedy, gdy jest ciężko — codzienność bywa dla Ciebie trudniejsza niż dramat.",
  },
  2: {
    sedno: "Ostrze — to, co oddziela prawdę od tego, co tylko wygląda na prawdę.",
    mocneStrony: ["bezbłędny zmysł oceny i wychwytywania fałszu", "odwaga mówienia rzeczy niewygodnych", "zdolność oczyszczania sytuacji, które inni zamiatają pod dywan"],
    cien: ["ostrość języka raniąca bez potrzeby", "niecierpliwość wobec ludzi wolniejszych albo mniej zdecydowanych"],
    kierunki: "krytyka i redakcja, audyt, chirurgia, wojsko, kuchnia — wszędzie tam, gdzie liczy się precyzyjne cięcie.",
    relacje: "Jesteś lojalny i wymagający. Partner musi unieść Twoją szczerość — za to wie, na czym stoi.",
  },
  3: {
    sedno: "Wzrost — to, co zapuszcza korzenie i owocuje, jeśli dostanie czas.",
    mocneStrony: ["zmysł piękna i umiejętność tworzenia rzeczy trwałych", "cierpliwość w budowaniu", "magnetyzm, który przyciąga ludzi i zasoby"],
    cien: ["przywiązanie do rzeczy i osób ponad miarę", "opór przed zmianą, gdy jest już wygodnie"],
    kierunki: "sztuka, moda, rolnictwo, gastronomia, nieruchomości — wszystko, co rośnie i dojrzewa.",
    relacje: "Dajesz poczucie bezpieczeństwa i domu. Uważaj tylko, by troska nie zamieniła się w posiadanie.",
  },
  4: {
    sedno: "Tropiciel — ten, kto szuka dalej, także wtedy, gdy już znalazł.",
    mocneStrony: ["ciekawość i lekkość w zmienianiu perspektywy", "wyczulenie na to, czego nie widać na pierwszy rzut oka", "talent do zbierania i łączenia informacji"],
    cien: ["chroniczny niedosyt — to, co osiągnięte, szybko przestaje wystarczać", "rozproszenie między zbyt wieloma tropami"],
    kierunki: "badania, dziennikarstwo, podróże, handel, wszystko, co polega na szukaniu.",
    relacje: "Potrzebujesz w związku przestrzeni i rozmowy. Nuda jest dla Ciebie groźniejsza niż konflikt.",
  },
  5: {
    sedno: "Burza, która oczyszcza — przełom przychodzący przez to, co trudne.",
    mocneStrony: ["ostry, analityczny umysł", "zdolność funkcjonowania w chaosie, gdy inni się sypią", "prawdziwa empatia wobec cierpienia, bo znasz je od środka"],
    cien: ["skłonność do burzenia także tego, co warto było zostawić", "wewnętrzne napięcie trudne do rozładowania"],
    kierunki: "informatyka i analiza danych, psychologia kryzysu, zarządzanie awariami, nauki ścisłe.",
    relacje: "Bywasz intensywny i wymagający. Związek z Tobą przechodzi burze, ale po nich robi się czyściej.",
  },
  6: {
    sedno: "Powrót światła — zdolność zaczynania od nowa bez goryczy.",
    mocneStrony: ["umiejętność podnoszenia się po stracie", "łatwość wybaczania", "dawanie innym poczucia, że są u siebie"],
    cien: ["powtarzanie tego samego cyklu, zamiast wyciągnięcia wniosku", "rozdrobnienie między zbyt wiele miejsc i osób"],
    kierunki: "nauczanie, opieka, gościnność, doradztwo — zawody, w których się kogoś odbudowuje.",
    relacje: "Wybaczasz i wracasz. To piękne, ale sprawdzaj, czy wracasz do czegoś, co się zmieniło.",
  },
  7: {
    sedno: "Karmienie — nakszatra uznawana w tradycji za najbardziej sprzyjającą.",
    mocneStrony: ["naturalna troskliwość bez wyrachowania", "stabilność, na której inni się opierają", "zmysł tego, czego komuś naprawdę potrzeba"],
    cien: ["zaniedbywanie siebie w trosce o innych", "przywiązanie do bezpieczeństwa kosztem rozwoju"],
    kierunki: "opieka zdrowotna, żywienie, nauczanie, praca społeczna, duchowość.",
    relacje: "Jesteś oparciem. Pamiętaj, żeby też prosić — dawanie w jedną stronę wyczerpuje.",
  },
  8: {
    sedno: "Zwinięty wąż — hipnotyczna głębia, która leczy albo zatruwa.",
    mocneStrony: ["przenikliwość i czytanie ludzi", "strategiczne myślenie o krok dalej", "zdolność uzdrawiania tego, co ukryte"],
    cien: ["manipulacja, gdy prościej byłoby powiedzieć wprost", "podejrzliwość zatruwająca dobre relacje"],
    kierunki: "psychoterapia, farmacja, negocjacje, śledztwa, praca z uzależnieniami.",
    relacje: "Wiążesz się głęboko i widzisz więcej, niż partner mówi. Używaj tego, żeby rozumieć, nie żeby sterować.",
  },
  9: {
    sedno: "Tron — godność i ciężar tego, co odziedziczone.",
    mocneStrony: ["naturalny autorytet i szacunek do tradycji", "poczucie odpowiedzialności za rodzinę i wspólnotę", "zdolność reprezentowania czegoś większego niż siebie"],
    cien: ["duma zamykająca na krytykę", "życie oczekiwaniami przodków zamiast własnymi"],
    kierunki: "zarządzanie, polityka, historia, prawo, prowadzenie rodzinnej firmy.",
    relacje: "Wnosisz lojalność i poczucie rodu. Uważaj, by wymagać od bliskich mniej, niż wymagasz od siebie.",
  },
  10: {
    sedno: "Hamak — prawo do przyjemności i odpoczynku bez poczucia winy.",
    mocneStrony: ["twórczość i zmysł estetyczny", "ciepło towarzyskie, które rozluźnia innych", "umiejętność cieszenia się życiem"],
    cien: ["wygodnictwo i odkładanie tego, co wymagające", "uwodzenie dla samego uwodzenia"],
    kierunki: "sztuka, rozrywka, moda, gastronomia, wszystko związane z przyjemnością i formą.",
    relacje: "Jesteś czuły i romantyczny. Trwałość przychodzi wtedy, gdy zostajesz także w dniach mniej przyjemnych.",
  },
  11: {
    sedno: "Umowa — słowo, które się dotrzymuje.",
    mocneStrony: ["niezawodność i dotrzymywanie zobowiązań", "hojność bez rachunku", "zdolność budowania trwałych przyjaźni i spółek"],
    cien: ["sztywność, gdy sytuacja wymaga renegocjacji", "branie na siebie zobowiązań ponad siły"],
    kierunki: "prawo umów, doradztwo, organizacje, zawody oparte na zaufaniu i długiej współpracy.",
    relacje: "Dajesz stabilność i uczciwość. Twoja miłość wyraża się w dotrzymanym słowie, nie w wielkich gestach.",
  },
  12: {
    sedno: "Dłoń — to, co potrafisz zrobić własnymi rękami.",
    mocneStrony: ["precyzja i zręczność", "sprawczość — pomysł zamieniasz w rzecz", "wyczucie szczegółu, którego inni nie widzą"],
    cien: ["nadmierna kontrola i poprawianie w nieskończoność", "kombinowanie, gdy prościej byłoby zapytać"],
    kierunki: "rzemiosło, chirurgia, fizjoterapia, rękodzieło, programowanie, każda praca precyzyjna.",
    relacje: "Okazujesz uczucie przez to, co robisz, nie przez to, co mówisz. Warto czasem powiedzieć.",
  },
  13: {
    sedno: "Perła — forma dopracowana tak, że sama w sobie jest wartością.",
    mocneStrony: ["wyczucie formy, proporcji i kompozycji", "umiejętność nadawania rzeczom blasku", "widzenie całości projektu przed jego powstaniem"],
    cien: ["przywiązanie do wyglądu ponad treść", "próżność i wrażliwość na ocenę"],
    kierunki: "architektura, wzornictwo, jubilerstwo, fotografia, reżyseria.",
    relacje: "Przyciągasz i chcesz być podziwiany. Głębia przychodzi, gdy pozwolisz się zobaczyć bez oprawy.",
  },
  14: {
    sedno: "Młody pęd na wietrze — samodzielność, która gnie się, ale nie łamie.",
    mocneStrony: ["niezależność i umiejętność radzenia sobie samemu", "elastyczność w zmiennych warunkach", "zmysł wymiany, handlu i negocjacji"],
    cien: ["niezdecydowanie przy zbyt wielu możliwościach", "unikanie zobowiązań w imię wolności"],
    kierunki: "handel, przedsiębiorczość, transport, dyplomacja, wolne zawody.",
    relacje: "Potrzebujesz swobody i partnera, który nie odbiera jej jako oddalenia. Wracasz — o ile nikt Cię nie trzyma.",
  },
  15: {
    sedno: "Łuk triumfalny — determinacja, która dochodzi do celu.",
    mocneStrony: ["wytrwałość w dążeniu mimo przeszkód", "zdolność mobilizowania siebie i innych", "jasność co do tego, czego się chce"],
    cien: ["rozdarcie między dwoma celami naraz", "niecierpliwość i ocenianie ludzi przez pryzmat wyników"],
    kierunki: "sprzedaż, polityka, sport wyczynowy, zarządzanie projektami, badania wymagające uporu.",
    relacje: "Angażujesz się mocno, ale bywasz zajęty czymś jeszcze. Wybierz świadomie, komu dajesz pierwszeństwo.",
  },
  16: {
    sedno: "Lotos — przyjaźń, która przechodzi przez wszystko.",
    mocneStrony: ["wierność i oddanie", "umiejętność pracy w grupie bez rywalizacji", "zdolność zaczynania od nowa w obcym miejscu"],
    cien: ["poświęcanie się dla ludzi, którzy tego nie odwzajemniają", "tłumienie własnych potrzeb dla zgody"],
    kierunki: "praca zespołowa, organizacje międzynarodowe, badania, duchowość, wszystko, co wymaga długiej lojalności.",
    relacje: "Twoja przyjaźń jest głębsza niż większość związków. Wymagaj wzajemności — masz do niej prawo.",
  },
  17: {
    sedno: "Starszeństwo — siła, która chroni i za to płaci.",
    mocneStrony: ["odpowiedzialność i gotowość osłaniania innych", "ukryta siła ujawniająca się w trudnych chwilach", "kompetencja budząca zaufanie"],
    cien: ["samotność wynikająca z niebrania pomocy", "kontrola i uraza, gdy poświęcenie nie jest zauważane"],
    kierunki: "zarządzanie kryzysowe, służby, medycyna, wszystko, gdzie ktoś musi wziąć odpowiedzialność.",
    relacje: "Bierzesz na siebie więcej, niż trzeba. Pozwól partnerowi też Cię czasem osłonić.",
  },
  18: {
    sedno: "Korzeń — dotarcie do dna sprawy, choćby trzeba było rozebrać wszystko.",
    mocneStrony: ["bezkompromisowe poszukiwanie prawdy", "odwaga rozbierania tego, co nie działa", "głębia dochodzenia do sedna"],
    cien: ["burzenie bez planu odbudowy", "trudne, przełomowe momenty w życiu, które wymagają czasu na odzyskanie równowagi"],
    kierunki: "badania podstawowe, filozofia, psychoterapia głębi, śledztwa, medycyna alternatywna.",
    relacje: "Nie zadowala Cię powierzchowność. Związek z Tobą schodzi głęboko — i nie każdy tego chce.",
  },
  19: {
    sedno: "Wachlarz — perswazja, której trudno się oprzeć.",
    mocneStrony: ["siła przekonywania i wpływu", "niezłomność — nie poddajesz się, gdy inni już odpuścili", "zdolność oczyszczania atmosfery wokół siebie"],
    cien: ["upór przechodzący w zaciekłość", "przekonanie o własnej racji zamykające na argumenty"],
    kierunki: "wystąpienia publiczne, prawo, marketing, nauczanie, praca z wodą i uzdrawianiem.",
    relacje: "Wnosisz zaangażowanie i wsparcie. Uważaj, by przekonywanie nie zamieniło się w narzucanie.",
  },
  20: {
    sedno: "Trwałe zwycięstwo — to, co wygrane uczciwie, zostaje.",
    mocneStrony: ["etyka i konsekwencja", "wytrwałość dająca efekty w długim horyzoncie", "naturalny autorytet oparty na kompetencji"],
    cien: ["sztywność zasad tam, gdzie potrzeba elastyczności", "powolność w startach — długo się rozpędzasz"],
    kierunki: "administracja, prawo, nauka, organizacje, wszystko, co buduje się latami.",
    relacje: "Jesteś partnerem na długo. Twoim wyzwaniem jest okazywanie uczuć, nie ich trwałość.",
  },
  21: {
    sedno: "Ucho — mądrość, która bierze się ze słuchania.",
    mocneStrony: ["umiejętność słuchania i wyciągania wniosków", "zdolność przekazywania wiedzy dalej", "wyczucie tradycji i tego, co warto zachować"],
    cien: ["nadmierne przejmowanie się opinią innych", "gromadzenie wiedzy zamiast jej używania"],
    kierunki: "nauczanie, dziennikarstwo, muzyka, terapia, tłumaczenia, praca z tekstem i mową.",
    relacje: "Słuchasz naprawdę — to rzadkie i cenne. Mów też o sobie, bo inaczej zostajesz nieznany.",
  },
  22: {
    sedno: "Bęben — rytm, który porywa grupę.",
    mocneStrony: ["poczucie rytmu i czasu", "zdolność jednoczenia ludzi wokół wspólnego działania", "energia i zaradność w gromadzeniu zasobów"],
    cien: ["stawianie tempa ponad relacje", "trudność z zatrzymaniem się i odpoczynkiem"],
    kierunki: "muzyka, sport zespołowy, wojsko, finanse, organizacja wydarzeń.",
    relacje: "Wnosisz energię i sprawczość. Zwolnij czasem do tempa partnera — nie każdy biegnie tak szybko.",
  },
  23: {
    sedno: "Krąg — uzdrawianie, które przychodzi z samotnego badania.",
    mocneStrony: ["niezależność myślenia i odwaga w kwestionowaniu przyjętych prawd", "zdolność leczenia tego, na co inni nie mają metody", "wytrzymałość w samotności"],
    cien: ["izolacja przechodząca w odcięcie", "trzymanie ludzi na dystans z zasady, nie z potrzeby"],
    kierunki: "badania naukowe, medycyna niekonwencjonalna, astrologia, technologia, praca wymagająca skupienia.",
    relacje: "Potrzebujesz samotności i partnera, który to rozumie. Bliskość przychodzi u Ciebie powoli, ale trwa.",
  },
  24: {
    sedno: "Ogień ascezy — widzenie poza to, co uznane za możliwe.",
    mocneStrony: ["wizjonerstwo i odwaga radykalnej zmiany", "intensywność, która porusza innych", "gotowość rezygnacji z wygody dla czegoś większego"],
    cien: ["skrajność i niepokój trudny do ukojenia", "brak cierpliwości do zwykłego życia"],
    kierunki: "duchowość, badania graniczne, sztuka awangardowa, mistyka, praca z umieraniem i przemianą.",
    relacje: "Kochasz intensywnie i niecodziennie. Potrzebujesz partnera, który nie przestraszy się Twojej głębi.",
  },
  25: {
    sedno: "Głębia — spokój kogoś, kto już nie musi udowadniać.",
    mocneStrony: ["cierpliwość i wewnętrzny spokój", "wsparcie dawane po cichu, bez rozgłosu", "mądrość dojrzewająca z czasem"],
    cien: ["bierność i odkładanie decyzji", "wycofanie, gdy trzeba się upomnieć o swoje"],
    kierunki: "psychoterapia, duchowość, badania, praca charytatywna, zawody wymagające cierpliwości.",
    relacje: "Jesteś bezpiecznym portem. Twoim wyzwaniem jest mówić, czego sam potrzebujesz.",
  },
  26: {
    sedno: "Ryba — domknięcie cyklu i opieka nad tymi, którzy są w drodze.",
    mocneStrony: ["współczucie bez oceniania", "umiejętność żegnania i domykania spraw", "opiekuńczość wobec słabszych i zagubionych"],
    cien: ["rozmycie granic — branie na siebie cudzych spraw", "trudność z rozpoczynaniem, łatwość z kończeniem"],
    kierunki: "opieka, hospicja, transport i podróże, praca ze zwierzętami, sztuka, duchowość.",
    relacje: "Dajesz akceptację i łagodność. Naucz się odmawiać — bez tego Twoja dobroć Cię wyczerpie.",
  },
};

// ── tabele zgodności (te same, których używa Guna Milan) ──
const NADI = [0,1,2,2,1,0,0,1,2,2,1,0,0,1,2,2,1,0,0,1,2,2,1,0,0,1,2];
const YONI = [0,1,2,3,3,4,5,2,5,6,6,7,8,9,8,9,10,10,4,11,12,11,13,0,13,7,1];
const YONI_WROGIE: [number, number][] = [[0,8],[1,13],[2,11],[3,12],[4,10],[5,6],[7,9]];

/** Adres strony nakszatry — bez polskich znaków. */
export function slugNakszatry(index: number): string {
  return normalizePlace(NAKSHATRAS[index].pl).replace(/\s+/g, "-");
}

export function nakszatraZeSlug(slug: string): number | null {
  const i = NAKSHATRAS.findIndex((n) => slugNakszatry(n.index) === slug);
  return i >= 0 ? i : null;
}

export interface OpisNakszatry {
  nak: (typeof NAKSHATRAS)[number];
  tresc: TrescNakszatry;
  /** Zakres stopni w zodiaku syderycznym. */
  odStopni: number;
  doStopni: number;
  /** Znak, w którym leży początek nakszatry. */
  znakStart: number;
  /** Cztery pady: zakres stopni + znak nawamszy. */
  pady: { nr: number; od: number; do: number; nawamsza: number }[];
  /** Lata władcy w cyklu Vimshottari. */
  lataWladcy: number;
  gana: string;
  yoni: string;
  /** Nakszatry o zgodnej energii życiowej (inna nadi) i przyjaznym zwierzęciu. */
  wspolgra: number[];
  /** Nakszatry z tą samą nadi albo wrogim yoni — wymagają świadomej pracy. */
  wymagajace: number[];
}

const YONI_NAZWY = ["koń","słoń","owca","wąż","pies","kot","szczur","krowa","bawół","tygrys","jeleń","małpa","mangusta","lew"];
const GANA_PL = { deva: "boska (deva) — łagodna, nastawiona na współpracę", manuszja: "ludzka (manuszja) — praktyczna, wyważona", rakszasa: "gwałtowna (rakszasa) — intensywna, bezkompromisowa" };

/**
 * Pełny opis nakszatry: dane klasyczne + wszystko, co da się policzyć.
 * Zgodność wyliczamy z tych samych tablic co Guna Milan, więc strona nakszatry
 * i kalkulator dopasowania nie mogą się rozejść.
 */
export function opisNakszatry(index: number): OpisNakszatry {
  const nak = NAKSHATRAS[index];
  const od = index * NAKSHATRA_SPAN;
  const doSt = od + NAKSHATRA_SPAN;

  const pady = [0, 1, 2, 3].map((i) => {
    const padOd = od + i * PADA_SPAN;
    return { nr: i + 1, od: padOd, do: padOd + PADA_SPAN, nawamsza: navamsaSign(padOd + 0.01) };
  });

  const wrogieYoni = new Set<number>();
  for (const [x, y] of YONI_WROGIE) {
    if (x === YONI[index]) wrogieYoni.add(y);
    if (y === YONI[index]) wrogieYoni.add(x);
  }

  const wspolgra: number[] = [];
  const wymagajace: number[] = [];
  for (let i = 0; i < 27; i++) {
    if (i === index) continue;
    const wrogi = wrogieYoni.has(YONI[i]);
    const taSamaNadi = NADI[i] === NADI[index];
    if (!wrogi && !taSamaNadi && YONI[i] === YONI[index]) wspolgra.push(i);
    else if (wrogi || taSamaNadi) wymagajace.push(i);
  }
  // uzupełniamy listę współgrających o zgodne nadi, jeśli tych samych zwierząt jest mało
  if (wspolgra.length < 4) {
    for (let i = 0; i < 27 && wspolgra.length < 6; i++) {
      if (i === index || wspolgra.includes(i)) continue;
      if (NADI[i] !== NADI[index] && !wrogieYoni.has(YONI[i])) wspolgra.push(i);
    }
  }

  return {
    nak,
    tresc: TRESCI[index],
    odStopni: od,
    doStopni: doSt,
    znakStart: Math.floor(od / 30),
    pady,
    lataWladcy: VIMSHOTTARI_YEARS[nak.lord],
    gana: GANA_PL[nak.gana],
    yoni: YONI_NAZWY[YONI[index]],
    wspolgra: wspolgra.slice(0, 6),
    wymagajace: wymagajace.slice(0, 5),
  };
}

export { NAKSHATRAS, GRAHAS, RASIS };
