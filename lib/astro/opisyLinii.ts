import type { BodyId } from "./bodies";
import type { AstroLocale } from "./i18nAstro";

/**
 * Znaczenie KONKRETNEGO połączenia planeta × kąt na mapie świata — np. co
 * dokładnie znaczy Wenus na MC, a co Wenus na ASC. Zastępuje ogólny szablon
 * (RAMA_KATA w astrocarto.ts), który zostaje tylko jako zapas.
 *
 *  MC  — kariera, status, to, z czego jesteś znany/a publicznie
 *  IC  — dom, rodzina, korzenie, życie prywatne
 *  ASC — Ty sam/a: ciało, samopoczucie, pierwsze wrażenie
 *  DSC — inni: partnerzy, wspólnicy, ludzie, których przyciągasz
 */
type Kat = "mc" | "ic" | "asc" | "dsc";
type Para = [pl: string, en: string];

const OPISY: Partial<Record<BodyId, Record<Kat, Para>>> = {
  sun: {
    mc: [
      "Słońce na MC to jedna z najsilniejszych linii kariery: tu najłatwiej zostać zauważonym/ą, objąć prowadzenie i zbudować pozycję. Ludzie widzą w Tobie autorytet — dobre miejsce na awans, własną markę i działalność publiczną, ale też na presję bycia stale ocenianym/ą.",
      "The Sun on the MC is one of the strongest career lines: here it's easiest to be noticed, take the lead and build a position. People see you as an authority — a good place for promotion, your own brand and public work, but also for the pressure of being constantly judged.",
    ],
    ic: [
      "Słońce na IC kieruje Twoją energię do wewnątrz — do domu, rodziny i korzeni. Tu odzyskujesz siły i poczucie, kim jesteś; dobre miejsce na własny dom i spokojne życie rodzinne, słabsze na karierę publiczną. Mogą wracać sprawy związane z ojcem.",
      "The Sun on the IC turns your energy inward — toward home, family and roots. Here you recharge and remember who you are; a good place for your own home and calm family life, weaker for a public career. Matters related to your father may resurface.",
    ],
    asc: [
      "Słońce na ASC wzmacnia Twoją obecność: czujesz się tu pewniej, masz więcej energii i ludzie od razu odbierają Cię jako kogoś silnego. Świetne na nowy start i odbudowę wiary w siebie; uważaj tylko, by pewność nie przeszła w egocentryzm.",
      "The Sun on the ASC strengthens your presence: you feel more confident here, have more energy, and people immediately see you as someone strong. Great for a fresh start and rebuilding self-belief; just watch that confidence doesn't turn into self-centeredness.",
    ],
    dsc: [
      "Słońce na DSC przyciąga silnych, wyrazistych ludzi — partnerów, wspólników, osoby z pozycją. Związki i współprace są tu ważne i widoczne, ale łatwo o walkę o to, kto prowadzi. Dobre na partnerstwo z kimś wpływowym.",
      "The Sun on the DSC attracts strong, distinctive people — partners, associates, people with status. Relationships and collaborations matter and are visible here, but a struggle over who leads comes easily. Good for partnering with someone influential.",
    ],
  },
  moon: {
    mc: [
      "Księżyc na MC sprawia, że ludzie Cię lubią i ufają Ci publicznie — praca z ludźmi, opieka, gastronomia, handel czy media idą tu dobrze. Kariera bywa jednak zmienna jak fazy Księżyca, a nastroje mają wpływ na Twoją reputację.",
      "The Moon on the MC makes people like and trust you publicly — work with people, care, hospitality, retail or media goes well here. Your career can be as changeable as the lunar phases, though, and your moods affect your reputation.",
    ],
    ic: [
      "Księżyc na IC to klasyczna linia „domu”: tu łatwo poczuć się bezpiecznie, zapuścić korzenie i założyć rodzinę. Jedno z najlepszych miejsc na zamieszkanie i odpoczynek; mocniej odczuwasz tu też więź z matką i przeszłością.",
      "The Moon on the IC is the classic \"home\" line: here it's easy to feel safe, put down roots and start a family. One of the best places to live and rest; you also feel your bond with your mother and the past more strongly here.",
    ],
    asc: [
      "Księżyc na ASC czyni Cię tu wrażliwszym/ą, cieplejszym/ą i bardziej intuicyjnym/ą — ludzie szybko się do Ciebie przywiązują. Dobre na regenerację i zdrowie emocjonalne, ale emocje są bliżej powierzchni i łatwiej o huśtawki nastrojów.",
      "The Moon on the ASC makes you more sensitive, warmer and more intuitive here — people quickly grow attached to you. Good for recovery and emotional health, but emotions sit closer to the surface and mood swings come more easily.",
    ],
    dsc: [
      "Księżyc na DSC przyciąga ludzi opiekuńczych i bliskie, rodzinne relacje. Łatwiej tu o związek oparty na czułości i poczuciu bezpieczeństwa; uważaj na zależność emocjonalną i branie odpowiedzialności za cudze uczucia.",
      "The Moon on the DSC attracts caring people and close, family-like relationships. A relationship built on tenderness and security comes more easily here; watch out for emotional dependence and taking responsibility for other people's feelings.",
    ],
  },
  mars: {
    mc: [
      "Mars na MC daje ogromny napęd zawodowy: odwagę, ambicję i siłę przebicia. Dobre na przedsiębiorczość, sport, zawody techniczne i wszędzie tam, gdzie trzeba walczyć o wynik; ryzyko konfliktów z przełożonymi i opinii osoby „trudnej”.",
      "Mars on the MC gives a huge professional drive: courage, ambition and assertiveness. Good for entrepreneurship, sport, technical professions and anywhere you have to fight for results; there's a risk of conflict with superiors and a reputation for being \"difficult\".",
    ],
    ic: [
      "Mars na IC wnosi napięcie do domu: łatwiej o kłótnie w rodzinie, remonty i niepokój w miejscu, które powinno dawać odpoczynek. Dobre na budowę czy remont domu, gorsze na spokojne życie rodzinne.",
      "Mars on the IC brings tension into the home: arguments in the family, renovations and restlessness come more easily in the place that should give rest. Good for building or renovating a house, worse for a calm family life.",
    ],
    asc: [
      "Mars na ASC dodaje energii, odwagi i siły fizycznej — działasz tu szybciej i śmielej, dobrze idzie sport i nowe przedsięwzięcia. Ludzie odbierają Cię jako kogoś bezpośredniego, czasem zbyt ostrego; większa skłonność do pośpiechu, gorączki i urazów.",
      "Mars on the ASC adds energy, courage and physical strength — you act faster and more boldly here, and sport and new ventures go well. People see you as direct, sometimes too sharp; there's a greater tendency to rush, to fevers and to injuries.",
    ],
    dsc: [
      "Mars na DSC przyciąga ludzi silnych, namiętnych, ale też konfliktowych — w relacjach jest dużo energii i iskier. Dobre na rywalizację i współpracę z kimś dynamicznym; łatwo o spory, a nawet otwartych przeciwników i sprawy sądowe.",
      "Mars on the DSC attracts strong, passionate but also confrontational people — relationships have a lot of energy and sparks. Good for competition and working with someone dynamic; disputes come easily, even open opponents and legal battles.",
    ],
  },
  mercury: {
    mc: [
      "Merkury na MC wynosi Twoje słowo i umysł na widok publiczny: dobre miejsce na karierę w mediach, edukacji, handlu, IT, pisaniu i wszędzie, gdzie liczy się komunikacja. Wiele kontaktów zawodowych, ale też ryzyko rozproszenia na zbyt wiele projektów.",
      "Mercury on the MC brings your words and mind into public view: a good place for a career in media, education, trade, IT, writing and anywhere communication matters. Many professional contacts, but also a risk of spreading yourself over too many projects.",
    ],
    ic: [
      "Merkury na IC sprawia, że dom staje się miejscem myślenia i pracy — dobre na pracę zdalną, naukę i pisanie w zaciszu. W rodzinie dużo rozmów, ale też niepokoju i ciągłego ruchu; trudniej o głęboki odpoczynek.",
      "Mercury on the IC turns your home into a place for thinking and working — good for remote work, study and writing in quiet. Lots of conversation in the family, but also restlessness and constant movement; deep rest is harder.",
    ],
    asc: [
      "Merkury na ASC wyostrza umysł i język: jesteś tu bystrzejszy/a, bardziej rozmowny/a i ciekawy/a świata, ludzie odbierają Cię jako kogoś inteligentnego. Świetne na naukę, języki i kontakty; uważaj na nerwowość i nadmiar bodźców.",
      "Mercury on the ASC sharpens your mind and tongue: you're quicker, more talkative and more curious here, and people see you as intelligent. Great for learning, languages and networking; watch out for nervousness and overstimulation.",
    ],
    dsc: [
      "Merkury na DSC przyciąga ludzi bystrych, rozmownych i młodszych — partnerów do rozmowy, wspólników w interesach, pośredników. Dobre na umowy i negocjacje; relacje bywają jednak bardziej intelektualne niż głębokie.",
      "Mercury on the DSC attracts bright, talkative and younger people — conversation partners, business associates, intermediaries. Good for contracts and negotiations; relationships can be more intellectual than deep, though.",
    ],
  },
  jupiter: {
    mc: [
      "Jowisz na MC to jedna z najszczęśliwszych linii kariery: uznanie, awanse, opieka mentorów i dobra reputacja przychodzą tu łatwiej. Szczególnie dobre na nauczanie, prawo, finanse, doradztwo i duchowość; uważaj tylko, by nie obiecywać za dużo.",
      "Jupiter on the MC is one of the luckiest career lines: recognition, promotions, mentors' support and a good reputation come more easily here. Especially good for teaching, law, finance, consulting and spirituality; just be careful not to promise too much.",
    ],
    ic: [
      "Jowisz na IC błogosławi dom i rodzinę: przestronne mieszkanie, ciepła atmosfera, opieka bliskich i poczucie dostatku. Jedno z najlepszych miejsc na zamieszkanie, założenie rodziny i spokojną starość.",
      "Jupiter on the IC blesses home and family: a spacious home, a warm atmosphere, the care of loved ones and a sense of abundance. One of the best places to live, start a family and grow old in peace.",
    ],
    asc: [
      "Jowisz na ASC sprawia, że czujesz się tu lepiej, pogodniej i bardziej ufnie wobec życia — ludzie odbierają Cię jako kogoś życzliwego i godnego zaufania. Dobre na nowy start, zdrowie i rozwój osobisty; jedyny cień to skłonność do przesady i tycia.",
      "Jupiter on the ASC makes you feel better, more cheerful and more trusting of life here — people see you as kind and trustworthy. Good for a fresh start, health and personal growth; the only shadow is a tendency to excess and weight gain.",
    ],
    dsc: [
      "Jowisz na DSC przyciąga mądrych, hojnych i życzliwych ludzi — dobrych partnerów, wspólników i nauczycieli. Jedna z najlepszych linii na małżeństwo i udane współprace; korzyści przychodzą tu przez innych.",
      "Jupiter on the DSC attracts wise, generous and kind people — good partners, associates and teachers. One of the best lines for marriage and successful collaborations; benefits come to you through others here.",
    ],
  },
  venus: {
    mc: [
      "Wenus na MC sprawia, że Twoją zawodową wizytówką stają się wdzięk, smak i umiejętność zjednywania ludzi. Świetne miejsce na karierę w sztuce, modzie, urodzie, designie, dyplomacji czy pracy z klientem; łatwo tu też o sympatię przełożonych, a czasem o romans w pracy.",
      "Venus on the MC makes charm, taste and the ability to win people over your professional calling card. A great place for a career in art, fashion, beauty, design, diplomacy or client work; it's also easy to win your superiors' favor here — and sometimes a workplace romance.",
    ],
    ic: [
      "Wenus na IC czyni dom piękniejszym i spokojniejszym: harmonia w rodzinie, przytulne mieszkanie, przyjemność z przebywania u siebie. Bardzo dobre miejsce na wspólne życie z partnerem i urządzanie domu.",
      "Venus on the IC makes home more beautiful and peaceful: harmony in the family, a cozy home, pleasure in being in your own space. A very good place to live together with a partner and make a home.",
    ],
    asc: [
      "Wenus na ASC sprawia, że wyglądasz i czujesz się tu atrakcyjniej, a ludzie od pierwszego wrażenia odbierają Cię ciepło i z sympatią. Łatwiej o flirt, romans i przyjemności; uważaj na pobłażanie sobie i życie dla wygody.",
      "Venus on the ASC makes you look and feel more attractive here, and people take to you warmly from the first impression. Flirting, romance and pleasure come more easily; watch out for self-indulgence and living for comfort.",
    ],
    dsc: [
      "Wenus na DSC to klasyczna linia miłości i małżeństwa: tu najłatwiej spotkać partnera, a relacje są harmonijne i pełne czułości. Dobre też na wspólników w interesach i współpracę opartą na zaufaniu.",
      "Venus on the DSC is the classic line of love and marriage: here it's easiest to meet a partner, and relationships are harmonious and tender. Also good for business partners and collaboration built on trust.",
    ],
  },
  saturn: {
    mc: [
      "Saturn na MC to linia ciężkiej, ale trwałej kariery: sukces przychodzi tu powoli, przez obowiązki, wytrwałość i odpowiedzialność. Dobre na zbudowanie solidnej pozycji na lata; trudne, jeśli oczekujesz szybkich efektów — możliwe przeszkody ze strony przełożonych i poczucie presji.",
      "Saturn on the MC is a line of hard but lasting career: success comes slowly here, through duty, perseverance and responsibility. Good for building a solid position for years; hard if you expect quick results — obstacles from superiors and a sense of pressure are possible.",
    ],
    ic: [
      "Saturn na IC obciąża dom i rodzinę: obowiązki wobec bliskich, chłodniejsza atmosfera, trudniej poczuć się u siebie. Może dawać stabilną, trwałą bazę, ale rzadko radość i lekkość — mniej korzystne na zamieszkanie.",
      "Saturn on the IC weighs on home and family: duties toward loved ones, a colder atmosphere, it's harder to feel at home. It can give a stable, lasting base, but rarely joy and lightness — less favorable for living.",
    ],
    asc: [
      "Saturn na ASC sprawia, że czujesz się tu poważniej, ciężej i bardziej odpowiedzialnie — ludzie odbierają Cię jako kogoś dojrzałego, ale zdystansowanego. Dobre na skupienie, dyscyplinę i pracę nad sobą; mniej energii, więcej zmęczenia i ryzyko przygnębienia.",
      "Saturn on the ASC makes you feel more serious, heavier and more responsible here — people see you as mature but distant. Good for focus, discipline and inner work; less energy, more fatigue and a risk of low mood.",
    ],
    dsc: [
      "Saturn na DSC przyciąga ludzi starszych, poważnych i wymagających — relacje są tu trwałe, ale chłodne lub obciążone obowiązkiem. Dobre na zobowiązania i umowy długoterminowe; trudniej o lekkość w związku, możliwe opóźnienia w znalezieniu partnera.",
      "Saturn on the DSC attracts older, serious and demanding people — relationships here are lasting but cool or weighed down by duty. Good for commitments and long-term contracts; lightness in a relationship is harder, and finding a partner may be delayed.",
    ],
  },
  rahu: {
    mc: [
      "Rahu na MC rozpala ambicję i daje szansę na szybki, nietypowy awans — często w technologii, mediach, polityce czy pracy z zagranicą. Sukces może być spektakularny, ale niestabilny; ryzyko skandali, nieczystych gier i poczucia, że wciąż jest za mało.",
      "Rahu on the MC ignites ambition and offers a chance of fast, unusual advancement — often in technology, media, politics or work with foreign countries. Success can be spectacular but unstable; there's a risk of scandal, unfair play and a feeling that it's never enough.",
    ],
    ic: [
      "Rahu na IC daje niepokój w domu: trudno tu zapuścić korzenie, dom bywa nietypowy albo „obcy”, a sprawy rodzinne zaskakujące. Może sprzyjać życiu na emigracji, ale rzadko daje poczucie spokoju i przynależności.",
      "Rahu on the IC brings restlessness at home: it's hard to put down roots here, the home tends to be unusual or \"foreign\", and family matters surprising. It can favor life as an emigrant, but rarely gives a sense of peace and belonging.",
    ],
    asc: [
      "Rahu na ASC sprawia, że wyróżniasz się tu i przyciągasz uwagę — jesteś odważniejszy/a, bardziej nietypowy/a, gotowy/a na eksperymenty. Dobre na zmianę wizerunku i wyjście poza schematy; uważaj na niepokój, zagubienie w roli i złudzenia co do siebie.",
      "Rahu on the ASC makes you stand out and draw attention here — you're bolder, more unconventional, ready to experiment. Good for changing your image and going beyond patterns; watch out for restlessness, losing yourself in a role and illusions about yourself.",
    ],
    dsc: [
      "Rahu na DSC przyciąga ludzi niezwykłych, z innych kultur lub środowisk — relacje są fascynujące, ale nieprzewidywalne. Możliwe nietypowe związki i wspólnicy; uważaj na manipulację, oszustwa i relacje oparte na obsesji.",
      "Rahu on the DSC attracts unusual people from other cultures or backgrounds — relationships are fascinating but unpredictable. Unconventional relationships and partners are possible; watch out for manipulation, deception and relationships built on obsession.",
    ],
  },
  ketu: {
    mc: [
      "Ketu na MC osłabia zainteresowanie karierą i statusem — tu łatwo poczuć, że praca nie daje sensu, albo nagle zmienić ścieżkę. Dobre na pracę duchową, badawczą lub uzdrawiającą; słabsze na budowanie pozycji i rozgłosu.",
      "Ketu on the MC weakens your interest in career and status — here it's easy to feel that work gives no meaning, or to change paths suddenly. Good for spiritual, research or healing work; weaker for building position and fame.",
    ],
    ic: [
      "Ketu na IC sprzyja odosobnieniu i życiu wewnętrznemu: dom staje się miejscem ciszy i medytacji. Dobre na duchowe odosobnienie; trudniej tu o poczucie rodzinnego ciepła i przynależności.",
      "Ketu on the IC favors solitude and inner life: home becomes a place of silence and meditation. Good for spiritual retreat; a sense of family warmth and belonging is harder here.",
    ],
    asc: [
      "Ketu na ASC czyni Cię tu bardziej wycofanym/ą, intuicyjnym/ą i zwróconym/ą do wewnątrz — mniej zależy Ci na tym, jak Cię widzą. Dobre na praktykę duchową i odcięcie się od zgiełku; możliwe poczucie zagubienia i spadek energii.",
      "Ketu on the ASC makes you more withdrawn, intuitive and inward-turned here — you care less about how others see you. Good for spiritual practice and getting away from the noise; a sense of being lost and lower energy are possible.",
    ],
    dsc: [
      "Ketu na DSC sprawia, że relacje są tu karmiczne i często krótkotrwałe — przyciągasz ludzi, z którymi coś domykasz. Dobre na kończenie starych spraw i duchowe spotkania; trudniej o trwały związek i zaangażowanego partnera.",
      "Ketu on the DSC makes relationships here karmic and often short-lived — you attract people with whom you're closing something. Good for finishing old business and spiritual encounters; a lasting relationship and committed partner are harder.",
    ],
  },
  uranus: {
    mc: [
      "Uran na MC przynosi nagłe zwroty w karierze: niespodziewane okazje, zmiany zawodu, praca w nowych technologiach, nauce czy na własny rachunek. Ekscytujące i oryginalne, ale niestabilne — trudno tu o spokojny, przewidywalny etat.",
      "Uranus on the MC brings sudden turns in your career: unexpected opportunities, career changes, work in new technologies, science or as a freelancer. Exciting and original, but unstable — a calm, predictable job is hard here.",
    ],
    ic: [
      "Uran na IC wnosi do domu niepokój i zmiany: częste przeprowadzki, nietypowy styl życia, trudność z osiedleniem się. Dobre na krótki pobyt dla przewietrzenia głowy, gorsze na stały dom.",
      "Uranus on the IC brings restlessness and change to the home: frequent moves, an unusual lifestyle, difficulty settling down. Good for a short stay to clear your head, worse for a permanent home.",
    ],
    asc: [
      "Uran na ASC budzi w Tobie buntownika i wolnego ducha — czujesz się tu inny/a, oryginalny/a, gotowy/a zerwać ze schematami. Dobre na przełom i odnalezienie siebie; męczące na dłuższą metę przez napięcie nerwowe i nieprzewidywalność.",
      "Uranus on the ASC awakens the rebel and free spirit in you — you feel different, original, ready to break patterns here. Good for a breakthrough and finding yourself; exhausting in the long run due to nervous tension and unpredictability.",
    ],
    dsc: [
      "Uran na DSC przyciąga ludzi niezwykłych i niezależnych, a relacje zaczynają się i kończą nagle. Ekscytujące znajomości, ale trudno o stabilny związek — dobre dla tych, którzy cenią wolność bardziej niż bezpieczeństwo.",
      "Uranus on the DSC attracts unusual, independent people, and relationships begin and end suddenly. Exciting connections, but a stable relationship is hard — good for those who value freedom more than security.",
    ],
  },
  neptune: {
    mc: [
      "Neptun na MC sprzyja powołaniu artystycznemu, duchowemu lub pomocowemu — muzyka, film, sztuka, terapia, praca charytatywna. Wizerunek bywa tu jednak mglisty: łatwo o niejasne cele zawodowe, rozczarowania i bycie wykorzystanym/ą.",
      "Neptune on the MC favors an artistic, spiritual or helping calling — music, film, art, therapy, charity work. Your image can be blurry here, though: unclear career goals, disappointments and being taken advantage of come easily.",
    ],
    ic: [
      "Neptun na IC czyni dom miejscem marzeń, duchowości i wrażliwości — dobre na odosobnienie, medytację i twórczą pracę w domu. Cień: mgliste sprawy rodzinne, kłopoty z nieruchomościami, wilgocią czy wodą, ucieczka od rzeczywistości.",
      "Neptune on the IC makes the home a place of dreams, spirituality and sensitivity — good for retreat, meditation and creative work at home. Shadow: murky family matters, problems with property, damp or water, escape from reality.",
    ],
    asc: [
      "Neptun na ASC wyostrza intuicję, wrażliwość i wyobraźnię — czujesz się tu bardziej natchniony/a i otwarty/a duchowo, a ludzie widzą w Tobie coś magnetycznego. Uważaj jednak na zagubienie, utratę granic, podatność na wpływy i używki.",
      "Neptune on the ASC sharpens intuition, sensitivity and imagination — you feel more inspired and spiritually open here, and people see something magnetic in you. But watch out for confusion, loss of boundaries, susceptibility to influence and substances.",
    ],
    dsc: [
      "Neptun na DSC przyciąga relacje romantyczne, duchowe i pełne idealizacji — łatwo tu o miłość jak z marzeń, ale też o rozczarowanie, gdy mgła opadnie. Uważaj na partnerów i wspólników, którzy nie są tym, za kogo się podają.",
      "Neptune on the DSC attracts romantic, spiritual and idealized relationships — dream-like love comes easily here, but so does disappointment when the fog lifts. Watch out for partners and associates who aren't who they claim to be.",
    ],
  },
  pluto: {
    mc: [
      "Pluton na MC daje dążenie do władzy i wpływu: kariera może tu przejść głęboką przemianę, a Ty zyskać ogromną siłę oddziaływania. To jednak linia walki — konflikty o władzę, intrygi, wzloty i upadki reputacji.",
      "Pluto on the MC brings a drive for power and influence: your career can undergo deep transformation here, and you can gain enormous impact. But it's a line of struggle — power conflicts, intrigue, rises and falls in reputation.",
    ],
    ic: [
      "Pluton na IC porusza najgłębsze warstwy: sprawy rodzinne, dziedzictwo, stare rany. Dobre na terapię i rozliczenie z przeszłością, ale trudne na spokojny dom — możliwe kryzysy w rodzinie i intensywna atmosfera.",
      "Pluto on the IC stirs the deepest layers: family matters, inheritance, old wounds. Good for therapy and coming to terms with the past, but hard for a peaceful home — family crises and an intense atmosphere are possible.",
    ],
    asc: [
      "Pluton na ASC czyni Cię tu intensywnym/ą i magnetycznym/ą — przechodzisz osobistą przemianę, często przez kryzys. Ludzie odbierają Cię jako silnego/ą, czasem onieśmielającego/ą; dobre na głęboką pracę nad sobą, męczące do zwykłego życia.",
      "Pluto on the ASC makes you intense and magnetic here — you go through a personal transformation, often via crisis. People see you as powerful, sometimes intimidating; good for deep inner work, exhausting for everyday life.",
    ],
    dsc: [
      "Pluton na DSC przyciąga relacje intensywne, namiętne i przemieniające — ale też zaborcze. Łatwo tu o związki pełne kontroli, zazdrości i walki o władzę; możliwi silni przeciwnicy lub wspólnicy, z którymi trudno się rozstać.",
      "Pluto on the DSC attracts intense, passionate and transformative relationships — but also possessive ones. Relationships full of control, jealousy and power struggles come easily here; strong opponents or associates who are hard to part with are possible.",
    ],
  },
};

/** Opis połączenia planeta × kąt; null, gdy brak (wtedy ogólny szablon). */
export function opisLinii(planet: BodyId, angle: Kat, locale: AstroLocale): string | null {
  const para = OPISY[planet]?.[angle];
  return para ? para[locale === "en" ? 1 : 0] : null;
}
