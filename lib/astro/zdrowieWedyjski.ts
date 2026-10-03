import type { PlanetId } from "./constants";
import type { VedicChart } from "./chart";
import { navamsaChart } from "./varga";
import { poziomWzmocnienia } from "./domInterpretacja";
import { aspektuje, type OcenaWladcyZWagami } from "./sila";
import { wladcaDomu, type CzynnikDomeny } from "./finanseUczucia";
import type { AstroLocale } from "./i18nAstro";

/**
 * ZDROWIE WEDYJSKI — dedykowany silnik, tym samym wzorcem co finanseWedyjskie.ts.
 * Nowa karta (nie zamiana istniejącej) —
 * zdrowie to jeden z trzech najczęściej szukanych tematów u astrologów (obok
 * miłości i kariery), a appka dotąd nie miała tu żadnych wyliczeń.
 *
 * WAŻNE OGRANICZENIE UCZCIWOŚCI: to NIE jest diagnoza medyczna i nie ma nią
 * być. Astrologia wedyjska pokazuje klasyczne SKŁONNOŚCI i TEMATY wymagające
 * uważności — nie konkretne choroby, nie zastępuje lekarza. Ten sam ton co
 * zastrzeżenie "nie porada inwestycyjna" przy Finansach, tu jeszcze mocniej
 * podkreślony ze względu na wagę tematu.
 *
 * Pytamy wyłącznie o to, co Jyotish klasycznie łączy ze zdrowiem:
 *  - władca lagny (Tanu bhava) — samo ciało, ogólna witalność,
 *  - władca 6. domu (Ripu) — klasyczny dom chorób, codziennych dolegliwości,
 *    odporności,
 *  - władca 8. domu (Randhra) — przewlekłe/ukryte tematy zdrowotne, kryzysy,
 *  - naturalni karakowie: Słońce (siła życiowa, witalność) i Księżyc (umysł,
 *    stabilność emocjonalna, która klasycznie wpływa na resztę ciała),
 *  - potwierdzenie w D9 (ogólna trwałość, jak wszędzie, lżejsza waga),
 *  - aspekty malefików (Mars, Saturn) na te punkty — dodatkowe obciążenie,
 *    nie diagnoza.
 *
 * Świadomie BEZ Szasztamszy (D6) — klasycznej, dedykowanej vargi zdrowia.
 * Appka jej dotąd nie implementuje, a reguła podziału (start znaku różny
 * dla parzystych/nieparzystych) wymaga weryfikacji ze źródłem, zanim
 * dopiszemy ją jako kolejną wargę. Do rozważenia jako kolejny krok.
 */

function ocenaZdrowotnaPlanety(chart: VedicChart, id: PlanetId, locale: AstroLocale = "pl"): OcenaWladcyZWagami {
  const czynniki: string[] = [];
  const wagi: number[] = [];
  // Każdy czynnik jest dopisywany zaraz po zmianie `punkty` — waga to przyrost od poprzedniego czynnika.
  let dotychczas = 0;
  const dopisz = (tekst: string) => { czynniki.push(tekst); wagi.push(Math.round((punkty - dotychczas) * 100) / 100); dotychczas = punkty; };
  const dodaj = (pl: string, en: string) => dopisz(locale === "en" ? en : pl);
  let punkty = 0;
  const p = chart.planets[id];

  // 1) godnosc w D1
  const poziomD1 = poziomWzmocnienia(p.dignity);
  if (poziomD1 === "dobre") {
    punkty += 1;
    dodaj(
      `${p.dignity === "egzaltacja" ? "egzaltacja" : p.dignity === "mulatrikona" ? "mulatrikona" : p.dignity === "władanie" ? "we własnym znaku" : "w znaku przyjaciela"} w D1 — naturalna odporność w tym temacie`,
      `${p.dignity === "egzaltacja" ? "exalted" : p.dignity === "mulatrikona" ? "mulatrikona" : p.dignity === "władanie" ? "in its own sign" : "in a friend's sign"} in D1 — natural resilience in this theme`,
    );
  } else if (poziomD1 === "zle") {
    punkty -= 0.75;
    dodaj(
      p.dignity === "upadek" ? "w upadku w D1 — temat wymaga większej uważności" : "w znaku wroga w D1 — temat wymaga większej uważności",
      p.dignity === "upadek" ? "debilitated in D1 — this theme needs more attention" : "in an enemy's sign in D1 — this theme needs more attention",
    );
  }

  // 2) spalenie
  if (p.combust) {
    punkty -= 0.5;
    dodaj("spalona — blisko Słońca, temat łatwiej przeoczyć, dopóki się nie nasili", "combust — close to the Sun, this theme is easy to overlook until it intensifies");
  }

  // 3) potwierdzenie w D9 (ogolna trwalosc, lzejsza waga)
  const d9 = navamsaChart(chart);
  if (d9) {
    const poziomD9 = poziomWzmocnienia(d9.planets[id].dignity);
    if (poziomD9 === "dobre") {
      punkty += 0.4;
      dodaj("potwierdzone w nawamszy (D9) — dodatkowa trwałość", "confirmed in the navamsa (D9) — extra durability");
    } else if (poziomD9 === "zle") {
      punkty -= 0.3;
      dodaj("niepotwierdzone w nawamszy (D9) — mniej stabilne, niż wygląda na pierwszy rzut oka", "not confirmed in the navamsa (D9) — less stable than it looks at first glance");
    }
  }

  // 4) aspekty malefikow — dodatkowe obciazenie, NIE diagnoza konkretnej choroby
  if (aspektuje(chart, "saturn", p.sign)) {
    punkty -= 0.4;
    dodaj("aspekt Saturna — dodatkowe obciążenie, temat wymaga cierpliwości i regularności, nie ignorowania", "Saturn's aspect — extra burden, this theme needs patience and regularity, not ignoring it");
  }
  if (aspektuje(chart, "mars", p.sign)) {
    punkty -= 0.4;
    dodaj("aspekt Marsa — dodatkowe obciążenie, temat bywa nagły/ostry zamiast powolnego", "Mars's aspect — extra burden, this theme tends to be sudden/sharp rather than gradual");
  }
  if (aspektuje(chart, "jupiter", p.sign)) {
    punkty += 0.5;
    dodaj("aspekt Jowisza — naturalna ochrona, łatwiejsza regeneracja w tym temacie", "Jupiter's aspect — natural protection, easier recovery in this theme");
  }

  const ton = punkty >= 0.5 ? "wspierający" : punkty <= -0.75 ? "wymagający" : "mieszany";
  const plus = wagi.filter((w) => w > 0).reduce((a, b) => a + b, 0);
  const minus = -wagi.filter((w) => w < 0).reduce((a, b) => a + b, 0);
  return { punkty: Math.round(punkty * 100) / 100, ton, czynniki, wagi, plus: Math.round(plus * 100) / 100, minus: Math.round(minus * 100) / 100 };
}

export interface OcenaZdrowotna {
  planety: CzynnikDomeny[];
}

const KROKI_EN: { dom?: 1 | 6 | 8; planeta?: PlanetId; rola: string }[] = [
  { dom: 1, rola: "lord of the ascendant (Tanu bhava) — the body itself, general vitality" },
  { dom: 6, rola: "lord of the 6th house (Ripu) — house of illness, everyday ailments and immunity" },
  { dom: 8, rola: "lord of the 8th house (Randhra) — chronic/hidden themes, health crises" },
  { planeta: "sun", rola: "natural karaka of life force and vitality" },
  { planeta: "moon", rola: "natural karaka of the mind — its stability classically affects the rest of the body" },
];

/** Główna funkcja — dedykowana ocena zdrowotna. Świadomie NIE nazwana "diagnoza" ani podobnie. */
export function ocenaZdrowotna(chart: VedicChart, locale: AstroLocale = "pl"): OcenaZdrowotna {
  const role = new Map<PlanetId, string[]>();
  if (locale === "en") {
    const DOM_PLANETA: Record<1 | 6 | 8, PlanetId | null> = {
      1: wladcaDomu(chart, 1), 6: wladcaDomu(chart, 6), 8: wladcaDomu(chart, 8),
    };
    for (const { dom, planeta, rola } of KROKI_EN) {
      const id = dom ? DOM_PLANETA[dom] : (planeta ?? null);
      if (!id) continue;
      const obecne = role.get(id) ?? [];
      obecne.push(rola);
      role.set(id, obecne);
    }
  } else {
    const KROKI: { planeta: PlanetId | null; rola: string }[] = [
      { planeta: wladcaDomu(chart, 1), rola: "władca lagny (Tanu bhava) — samo ciało, ogólna witalność" },
      { planeta: wladcaDomu(chart, 6), rola: "władca 6. domu (Ripu) — dom chorób, codziennych dolegliwości i odporności" },
      { planeta: wladcaDomu(chart, 8), rola: "władca 8. domu (Randhra) — tematy przewlekłe/ukryte, kryzysy zdrowotne" },
      { planeta: "sun", rola: "naturalny karaka siły życiowej i witalności" },
      { planeta: "moon", rola: "naturalny karaka umysłu — jego stabilność klasycznie wpływa na resztę ciała" },
    ];
    for (const { planeta, rola } of KROKI) {
      if (!planeta) continue;
      const obecne = role.get(planeta) ?? [];
      obecne.push(rola);
      role.set(planeta, obecne);
    }
  }

  const planety: CzynnikDomeny[] = Array.from(role.entries())
    .map(([planeta, role]) => ({
      planeta, role,
      ocena: ocenaZdrowotnaPlanety(chart, planeta, locale),
      dignity: chart.planets[planeta].dignity,
    }))
    .sort((a, b) => b.ocena.punkty - a.ocena.punkty);

  return { planety };
}

/** Co kondycja danej planety znaczy konkretnie dla tematu zdrowia — do dymka/rozwinięcia. Świadomie opisowo, bez diagnoz. */
export const ZDROWIE_OPIS: Record<PlanetId, string> = {
  sun: "Witalność i siła życiowa są u Ciebie związane z widocznością i poczuciem sensu — regenerujesz się lepiej, gdy masz poczucie sprawczości i uznania. Serce i kręgosłup to klasyczne obszary uważności przypisane Słońcu.",
  moon: "Stabilność emocjonalna przekłada się wprost na resztę ciała — nastrój i sen są tu kluczowe. Klasycznie Księżyc łączy się z układem pokarmowym i płynami w ciele.",
  mars: "Energia i regeneracja są szybkie, ale bywają gwałtowne — skłonność do urazów przy pochopnym działaniu. Klasycznie Mars łączy się z krwią, mięśniami i gorączkami.",
  mercury: "Układ nerwowy i sposób przetwarzania informacji są tu kluczowe — przeciążenie umysłowe odbija się szybciej niż u innych na ciele.",
  jupiter: "Naturalnie dobra odporność i zdolność regeneracji — Jowisz klasycznie chroni, choć bywa też związany ze skłonnością do nadmiaru (waga, wątroba).",
  venus: "Komfort i przyjemność są ważne dla równowagi — zaniedbanie tego tematu odbija się na samopoczuciu. Klasycznie Wenus łączy się z nerkami i układem rozrodczym.",
  saturn: "Regeneracja jest powolna, ale trwała — organizm lepiej znosi przewlekłe, systematyczne obciążenia niż nagłe zmiany. Klasycznie Saturn łączy się z kośćmi, stawami i skórą.",
  rahu: "Tematy zdrowotne bywają nietypowe, trudne do jednoznacznego zdiagnozowania na pierwszy rzut oka — warto nie ignorować niejasnych sygnałów.",
  ketu: "Tematy zdrowotne bywają subtelne, łatwe do zignorowania, dopóki się nie nasilą — Ketu klasycznie łączy się z układem odpornościowym i tematami trudnymi do zlokalizowania.",
};

const ZDROWIE_OPIS_EN: Record<PlanetId, string> = {
  sun: "Your vitality and life force are tied to visibility and a sense of purpose — you recover better when you feel effective and recognized. The heart and spine are classic areas of attention assigned to the Sun.",
  moon: "Emotional stability translates directly into the rest of the body — mood and sleep are key here. Classically the Moon is linked to the digestive system and fluids in the body.",
  mars: "Energy and recovery are fast, but can be sudden — a tendency toward injury with hasty action. Classically Mars is linked to blood, muscles and fevers.",
  mercury: "The nervous system and the way you process information are key here — mental overload shows up in the body faster than for others.",
  jupiter: "Naturally good immunity and recovery ability — Jupiter classically protects, though it can also be linked to a tendency to excess (weight, liver).",
  venus: "Comfort and pleasure matter for your balance — neglecting this theme shows up in wellbeing. Classically Venus is linked to the kidneys and reproductive system.",
  saturn: "Recovery is slow but lasting — the body tolerates chronic, systematic strain better than sudden change. Classically Saturn is linked to bones, joints and skin.",
  rahu: "Health themes can be unusual, hard to pin down clearly at first glance — worth not ignoring unclear signals.",
  ketu: "Health themes can be subtle, easy to ignore until they intensify — Ketu classically links to the immune system and themes that are hard to locate.",
};

/** Wersja ZDROWIE_OPIS zalezna od jezyka. */
export function zdrowieOpisNazwa(id: PlanetId, locale: AstroLocale): string {
  return locale === "en" ? ZDROWIE_OPIS_EN[id] : ZDROWIE_OPIS[id];
}

/** Krótkie etykiety ostrzegawcze — koniec rankingu zdrowotnego z tarciem (do NaCoUwazacDomeny). Opisowo, bez diagnoz. */
export const ZDROWIE_UWAGA: Record<PlanetId, string> = {
  sun: "spadek witalności przy braku uznania/widoczności",
  moon: "wahania nastroju odbijające się na reszcie ciała",
  mars: "ryzyko urazów przy pochopnym, impulsywnym działaniu",
  mercury: "przeciążenie nerwowe, trudność z wyciszeniem umysłu",
  jupiter: "skłonność do nadmiaru, brak umiaru",
  venus: "zaniedbywanie komfortu i przyjemności na rzecz obowiązków",
  saturn: "przewlekłe napięcie, ignorowanie sygnałów aż do nasilenia",
  rahu: "niejasne, trudne do zdiagnozowania tematy",
  ketu: "ignorowanie subtelnych sygnałów, dopóki się nie nasilą",
};

const ZDROWIE_UWAGA_EN: Record<PlanetId, string> = {
  sun: "drop in vitality when recognition/visibility is lacking",
  moon: "mood swings showing up in the rest of the body",
  mars: "risk of injury from hasty, impulsive action",
  mercury: "nervous overload, difficulty quieting the mind",
  jupiter: "tendency to excess, lack of moderation",
  venus: "neglecting comfort and pleasure for the sake of obligations",
  saturn: "chronic tension, ignoring signals until they intensify",
  rahu: "unclear, hard-to-diagnose themes",
  ketu: "ignoring subtle signals until they intensify",
};

/** Wersja ZDROWIE_UWAGA zalezna od jezyka. */
export function zdrowieUwagaNazwa(id: PlanetId, locale: AstroLocale): string {
  return locale === "en" ? ZDROWIE_UWAGA_EN[id] : ZDROWIE_UWAGA[id];
}

export const ZDROWIE_UWAGA_OPIS: Record<PlanetId, string> = {
  sun: "Bez poczucia sprawczości i uznania witalność potrafi wyraźnie spadać. Warto świadomie budować sytuacje, w których jesteś widoczny/a i doceniany/a, nie tylko czekać, aż się zdarzą.",
  moon: "Nastrój potrafi wpływać na ciało szybciej, niż się wydaje — niestabilność emocjonalna łatwo przechodzi w napięcie fizyczne. Warto pilnować rytmu snu i codziennych rutyn uspokajających.",
  mars: "Chęć szybkiego działania bez namysłu zwiększa ryzyko urazów i przeciążeń. Warto dać ciału chwilę na rozgrzewkę i uwagę, zanim ruszy się z pełną energią.",
  mercury: "Ciągła analiza i przeciążenie informacjami odbijają się na układzie nerwowym szybciej niż na innych obszarach. Warto świadomie planować przerwy od bodźców.",
  jupiter: "Optymizm bywa tak duży, że łatwo przeoczyć realne ryzyko — „jakoś to będzie” nie zawsze wystarcza. Warto sprawdzać liczby, nie tylko dobre przeczucie.",
  venus: "Łatwo odkładać własny komfort i przyjemność na później, na rzecz obowiązków wobec innych. Warto pamiętać, że to też jest część zdrowia, nie luksus.",
  saturn: "Napięcie i zmęczenie potrafią narastać po cichu, ignorowane, aż do momentu, gdy trudno je już przeoczyć. Warto reagować na sygnały wcześniej, nie dopiero gdy staną się poważne.",
  rahu: "Tematy zdrowotne bywają tu niejasne i trudne do jednoznacznego uchwycenia. Warto nie bagatelizować niepokojących, nietypowych sygnałów tylko dlatego, że trudno je nazwać.",
  ketu: "Łatwo zignorować subtelny sygnał, uznając go za nieistotny, dopóki się nie nasili. Warto traktować powtarzające się drobne dolegliwości jako informację, nie przypadek.",
};

const ZDROWIE_UWAGA_OPIS_EN: Record<PlanetId, string> = {
  sun: "Without a sense of effectiveness and recognition, vitality can noticeably drop. Worth consciously creating situations where you're seen and appreciated, not just waiting for them to happen.",
  moon: "Mood can affect the body faster than it seems — emotional instability easily turns into physical tension. Worth watching your sleep rhythm and daily calming routines.",
  mars: "The urge to act quickly without thinking increases the risk of injury and overload. Worth giving the body a moment to warm up and pay attention before going at full energy.",
  mercury: "Constant analysis and information overload show up in the nervous system faster than in other areas. Worth consciously planning breaks from stimuli.",
  jupiter: "Optimism and good condition can lead to excess — in food, in the pace of life. Worth watching moderation where the body won't demand it on time by itself.",
  venus: "It's easy to postpone your own comfort and pleasure for the sake of obligations to others. Worth remembering that this too is part of health, not a luxury.",
  saturn: "Tension and fatigue can build up quietly, ignored, until it's hard to overlook. Worth reacting to signals earlier, not only once they become serious.",
  rahu: "Health themes here can be unclear and hard to pin down. Worth not dismissing unsettling, unusual signals just because they're hard to name.",
  ketu: "It's easy to ignore a subtle signal, dismissing it as unimportant, until it intensifies. Worth treating recurring minor ailments as information, not coincidence.",
};

/** Wersja ZDROWIE_UWAGA_OPIS zalezna od jezyka. */
export function zdrowieUwagaOpisNazwa(id: PlanetId, locale: AstroLocale): string {
  return locale === "en" ? ZDROWIE_UWAGA_OPIS_EN[id] : ZDROWIE_UWAGA_OPIS[id];
}
