import type { PlanetId } from "./constants";
import type { VedicChart } from "./chart";
import { navamsaChart } from "./varga";
import { poziomWzmocnienia } from "./domInterpretacja";
import { aspektuje, type OcenaWladcy } from "./sila";
import { wladcaDomu, type CzynnikDomeny } from "./finanseUczucia";

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

function ocenaZdrowotnaPlanety(chart: VedicChart, id: PlanetId): OcenaWladcy {
  const czynniki: string[] = [];
  let punkty = 0;
  const p = chart.planets[id];

  // 1) godnosc w D1
  const poziomD1 = poziomWzmocnienia(p.dignity);
  if (poziomD1 === "dobre") {
    punkty += 1;
    czynniki.push(`${p.dignity === "egzaltacja" ? "egzaltacja" : p.dignity === "mulatrikona" ? "mulatrikona" : p.dignity === "władanie" ? "we własnym znaku" : "w znaku przyjaciela"} w D1 — naturalna odporność w tym temacie`);
  } else if (poziomD1 === "zle") {
    punkty -= 0.75;
    czynniki.push(p.dignity === "upadek" ? "w upadku w D1 — temat wymaga większej uważności" : "w znaku wroga w D1 — temat wymaga większej uważności");
  }

  // 2) spalenie
  if (p.combust) {
    punkty -= 0.5;
    czynniki.push("spalona — blisko Słońca, temat łatwiej przeoczyć, dopóki się nie nasili");
  }

  // 3) potwierdzenie w D9 (ogolna trwalosc, lzejsza waga)
  const d9 = navamsaChart(chart);
  if (d9) {
    const poziomD9 = poziomWzmocnienia(d9.planets[id].dignity);
    if (poziomD9 === "dobre") {
      punkty += 0.4;
      czynniki.push("potwierdzone w nawamszy (D9) — dodatkowa trwałość");
    } else if (poziomD9 === "zle") {
      punkty -= 0.3;
      czynniki.push("niepotwierdzone w nawamszy (D9) — mniej stabilne, niż wygląda na pierwszy rzut oka");
    }
  }

  // 4) aspekty malefikow — dodatkowe obciazenie, NIE diagnoza konkretnej choroby
  if (aspektuje(chart, "saturn", p.sign)) {
    punkty -= 0.4;
    czynniki.push("aspekt Saturna — dodatkowe obciążenie, temat wymaga cierpliwości i regularności, nie ignorowania");
  }
  if (aspektuje(chart, "mars", p.sign)) {
    punkty -= 0.4;
    czynniki.push("aspekt Marsa — dodatkowe obciążenie, temat bywa nagły/ostry zamiast powolnego");
  }
  if (aspektuje(chart, "jupiter", p.sign)) {
    punkty += 0.5;
    czynniki.push("aspekt Jowisza — naturalna ochrona, łatwiejsza regeneracja w tym temacie");
  }

  const ton = punkty >= 0.5 ? "wspierający" : punkty <= -0.75 ? "wymagający" : "mieszany";
  return { punkty: Math.round(punkty * 100) / 100, ton, czynniki };
}

export interface OcenaZdrowotna {
  planety: CzynnikDomeny[];
}

/** Główna funkcja — dedykowana ocena zdrowotna. Świadomie NIE nazwana "diagnoza" ani podobnie. */
export function ocenaZdrowotna(chart: VedicChart): OcenaZdrowotna {
  const role = new Map<PlanetId, string[]>();
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

  const planety: CzynnikDomeny[] = Array.from(role.entries())
    .map(([planeta, role]) => ({
      planeta, role,
      ocena: ocenaZdrowotnaPlanety(chart, planeta),
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

export const ZDROWIE_UWAGA_OPIS: Record<PlanetId, string> = {
  sun: "Bez poczucia sprawczości i uznania witalność potrafi wyraźnie spadać. Warto świadomie budować sytuacje, w których jesteś widoczny/a i doceniany/a, nie tylko czekać, aż się zdarzą.",
  moon: "Nastrój potrafi wpływać na ciało szybciej, niż się wydaje — niestabilność emocjonalna łatwo przechodzi w napięcie fizyczne. Warto pilnować rytmu snu i codziennych rutyn uspokajających.",
  mars: "Chęć szybkiego działania bez namysłu zwiększa ryzyko urazów i przeciążeń. Warto dać ciału chwilę na rozgrzewkę i uwagę, zanim ruszy się z pełną energią.",
  mercury: "Ciągła analiza i przeciążenie informacjami odbijają się na układzie nerwowym szybciej niż na innych obszarach. Warto świadomie planować przerwy od bodźców.",
  jupiter: "Naturalny optymizm i dobra kondycja mogą prowadzić do przesady — w jedzeniu, w tempie życia. Warto pilnować umiaru tam, gdzie ciało samo o niego nie upomni się na czas.",
  venus: "Łatwo odkładać własny komfort i przyjemność na później, na rzecz obowiązków wobec innych. Warto pamiętać, że to też jest część zdrowia, nie luksus.",
  saturn: "Napięcie i zmęczenie potrafią narastać po cichu, ignorowane, aż do momentu, gdy trudno je już przeoczyć. Warto reagować na sygnały wcześniej, nie dopiero gdy staną się poważne.",
  rahu: "Tematy zdrowotne bywają tu niejasne i trudne do jednoznacznego uchwycenia. Warto nie bagatelizować niepokojących, nietypowych sygnałów tylko dlatego, że trudno je nazwać.",
  ketu: "Łatwo zignorować subtelny sygnał, uznając go za nieistotny, dopóki się nie nasili. Warto traktować powtarzające się drobne dolegliwości jako informację, nie przypadek.",
};
