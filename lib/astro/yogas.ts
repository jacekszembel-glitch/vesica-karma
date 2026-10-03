import { GRAHAS, RASIS, PLANET_ORDER, type PlanetId } from "./constants";
import type { VedicChart } from "./chart";
import { aspektuje, neechaBhanga, domOrdinal } from "./sila";
import { isVargottama } from "./varga";
import { grahaNazwa, rasiNazwa, type AstroLocale } from "./i18nAstro";

/**
 * JOGI KLASYCZNE — programowe wykrywanie kombinacji planet uznawanych
 * tradycyjnie za wskaźniki talentu i szczęścia (nie dosza/afflicted —
 * to osobny, mniej "pozytywny" temat, świadomie tu pominięty).
 *
 * Wymaga znanej lagny (chart.angles) — wszystkie jogi poza Gadźakesari
 * liczą się od domów, których bez godziny urodzenia nie ma.
 *
 * Źródła klasyczne: BPHS, Phaladeepika — te same, na których opiera się
 * już istniejące wyliczenia ocenaWladcy (sila.ts) i neechaBhanga.
 */

export type KategoriaJogi =
  | "mahapurusza" | "saraswati" | "gajakesari" | "budha-aditja"
  | "radza" | "dhana" | "pomyslnosc" | "neeczabhanga" | "wiprita-radza" | "luminarze";

export interface Yoga {
  id: string;
  kategoria: KategoriaJogi;
  /** Nazwa sanskrycka jogi. */
  nazwa: string;
  /** Co daje — po polsku, jednym zdaniem. */
  znaczenie: string;
  /** Dlaczego jest obecna w TEJ mapie — konkretne uzasadnienie. */
  uzasadnienie: string;
  planety: PlanetId[];
  /** Domy do podświetlenia na kole — 1–12. */
  domy: number[];
}

/** Etykiety kategorii — współdzielone przez wszystkie miejsca, które listują jogi (diagram, mapa czasu). */
export const ETYKIETA_KATEGORII: Record<KategoriaJogi, string> = {
  mahapurusza: "Mahapurusza — wielka osobowość",
  saraswati: "Saraswati — wiedza i sztuka",
  gajakesari: "Gadźakesari — mądrość",
  "budha-aditja": "Budha-Aditja — intelekt",
  radza: "Radźa — władza i status",
  dhana: "Dhana — bogactwo",
  pomyslnosc: "Lakszmi i Amala — pomyślność i dobre imię",
  neeczabhanga: "Neeczabhanga — zniesiony upadek",
  "wiprita-radza": "Wiprita Radźa — wzrost po trudnościach",
  luminarze: "Księżyc i Słońce — wsparcie otoczenia",
};

const ETYKIETA_KATEGORII_EN: Record<KategoriaJogi, string> = {
  mahapurusza: "Mahapurusha — great personality",
  saraswati: "Saraswati — learning and the arts",
  gajakesari: "Gajakesari — wisdom",
  "budha-aditja": "Budha-Aditya — intellect",
  radza: "Raja — power and status",
  dhana: "Dhana — wealth",
  pomyslnosc: "Lakshmi and Amala — fortune and a good name",
  neeczabhanga: "Neechabhanga — cancelled debilitation",
  "wiprita-radza": "Vipreet Raja — growth after difficulty",
  luminarze: "Moon and Sun — support from others",
};

/** Wersja ETYKIETA_KATEGORII zalezna od jezyka — patrz i18nAstro.ts dla wzorca. */
export function etykietaKategoriiNazwa(kat: KategoriaJogi, locale: AstroLocale): string {
  return locale === "en" ? ETYKIETA_KATEGORII_EN[kat] : ETYKIETA_KATEGORII[kat];
}

/** Stała kolejność kategorii — od najbardziej osobistej do sytuacyjnej. */
export const KOLEJNOSC_KATEGORII: KategoriaJogi[] = [
  "mahapurusza", "saraswati", "gajakesari", "budha-aditja", "radza", "dhana", "pomyslnosc", "neeczabhanga", "wiprita-radza", "luminarze",
];

const KENDRY = [1, 4, 7, 10];
const TRIKONY = [1, 5, 9];
const DUSTHANY = [6, 8, 12];

/** Znak n-tego domu licząc od lagny (1 = lagna). */
function znakDomu(lagnaSign: number, n: number): number {
  return (lagnaSign + n - 1) % 12;
}

/** Władca n-tego domu licząc od lagny. */
function domLordu(lagnaSign: number, n: number): PlanetId {
  return RASIS[znakDomu(lagnaSign, n)].lord;
}

/** Numer domu (1–12), w którym stoi dany znak, licząc od lagny. Współdzielone z komponentami diagramu. */
export function domZnaku(lagnaSign: number, sign: number): number {
  return ((sign - lagnaSign + 12) % 12) + 1;
}

/** Dwie planety są połączone: koniunkcja (ten sam znak) albo wzajemny aspekt pełny. */
function polaczenie(chart: VedicChart, a: PlanetId, b: PlanetId): "koniunkcji" | "aspekcie" | null {
  if (a === b) return null;
  if (chart.planets[a].sign === chart.planets[b].sign) return "koniunkcji";
  if (aspektuje(chart, a, chart.planets[b].sign) || aspektuje(chart, b, chart.planets[a].sign)) return "aspekcie";
  return null;
}

const MAHAPURUSZA: { planeta: PlanetId; nazwa: string; nazwaEn: string; efekt: string; efektEn: string }[] = [
  { planeta: "mars", nazwa: "Ruczaka jogi", nazwaEn: "Ruchaka yoga", efekt: "wojownicza odwaga, przywództwo, sława zdobyta czynem", efektEn: "warrior courage, leadership, fame earned through action" },
  { planeta: "mercury", nazwa: "Bhadra jogi", nazwaEn: "Bhadra yoga", efekt: "błyskotliwość umysłu, elokwencja, zasoby z wiedzy", efektEn: "brilliance of mind, eloquence, resources gained from knowledge" },
  { planeta: "jupiter", nazwa: "Hansa jogi", nazwaEn: "Hamsa yoga", efekt: "mądrość, prawość, szacunek otoczenia", efektEn: "wisdom, righteousness, respect from others" },
  { planeta: "venus", nazwa: "Malawja jogi", nazwaEn: "Malavya yoga", efekt: "urok, dary artystyczne, dostatek i piękno wokół siebie", efektEn: "charm, artistic gifts, abundance and beauty around oneself" },
  { planeta: "saturn", nazwa: "Śasza jogi", nazwaEn: "Shasha yoga", efekt: "autorytet budowany wytrwałością, przywództwo mas, długowieczna sprawczość", efektEn: "authority built through persistence, leadership of the masses, long-lasting effectiveness" },
];

const VIPRITA_NAZWA: Record<number, { pl: string; en: string }> = {
  6: { pl: "Harsza", en: "Harsha" }, 8: { pl: "Sarala", en: "Sarala" }, 12: { pl: "Wimala", en: "Vimala" },
};

const RELACJA_NAZWA: Record<"koniunkcji" | "aspekcie", string> = { koniunkcji: "conjunction", aspekcie: "aspect" };

/** Wszystkie wykryte jogi w tej konkretnej mapie. Wymaga chart.angles.
 *  `locale` — jezyk nazwy/znaczenia/uzasadnienia (domyslnie "pl", patrz
 *  komentarz przy ocenaWladcy() w sila.ts o tym samym parametrze). */
export function wykryteJogi(chart: VedicChart, locale: AstroLocale = "pl"): Yoga[] {
  const jogi: Yoga[] = [];
  const en = locale === "en";
  const nazwaG = (id: PlanetId) => grahaNazwa(GRAHAS[id], locale);
  const dom = (d: number) => (en ? domOrdinal(d, "en") : `${d}.`);

  // ── Gadźakesari — jedyna, która nie wymaga lagny (liczy się od Księżyca) ──
  const domOdKsiezyca = ((chart.planets.jupiter.sign - chart.planets.moon.sign + 12) % 12) + 1;
  if (KENDRY.includes(domOdKsiezyca)) {
    jogi.push({
      id: "gajakesari",
      kategoria: "gajakesari",
      nazwa: en ? "Gajakesari yoga" : "Gadźakesari jogi",
      znaczenie: en ? "wisdom, a good reputation, calm and respect in others' eyes" : "mądrość, dobra reputacja, spokój i szacunek w oczach innych",
      uzasadnienie: en
        ? `Jupiter stands in a kendra (house ${dom(domOdKsiezyca)}) counted from the Moon.`
        : `Jowisz stoi w kendrze (${dom(domOdKsiezyca)} dom) licząc od Księżyca.`,
      planety: ["jupiter", "moon"],
      domy: chart.angles
        ? [domZnaku(chart.angles.lagnaSign, chart.planets.jupiter.sign), domZnaku(chart.angles.lagnaSign, chart.planets.moon.sign)]
        : [],
    });
  }

  // ── Budha-Aditja — Słońce i Merkury razem ──
  if (chart.planets.sun.sign === chart.planets.mercury.sign) {
    const domSlonca = chart.angles ? domZnaku(chart.angles.lagnaSign, chart.planets.sun.sign) : null;
    jogi.push({
      id: "budha-aditja",
      kategoria: "budha-aditja",
      nazwa: en ? "Budha-Aditya yoga" : "Budha-Aditja jogi",
      znaczenie: en ? "sharp intellect, communication skills, clarity of thought" : "bystry intelekt, zdolności komunikacyjne, jasność myślenia",
      uzasadnienie: en
        ? `The Sun and Mercury together in ${rasiNazwa(RASIS[chart.planets.sun.sign], "en")}${domSlonca ? ` (house ${dom(domSlonca)})` : ""}.`
        : `Słońce i Merkury razem w ${RASIS[chart.planets.sun.sign].pl}${domSlonca ? ` (${dom(domSlonca)} dom)` : ""}.`,
      planety: ["sun", "mercury"],
      domy: domSlonca ? [domSlonca] : [],
    });
  }

  // ── Jogi Księżyca i Słońca — liczone od świateł, nie od lagny, więc działają
  //    też bez godziny urodzenia. Pokazujemy tylko PEŁNE wersje (Adhi z co
  //    najmniej dwoma dobroczyńcami, Durudhura i Ubhajaczari — planety po OBU
  //    stronach): jednostronne Sunapha/Anapha i Weśi/Waśi ma większość map
  //    (Merkury i Wenus prawie zawsze stoją przy Słońcu), więc nic by nie mówiły. ──
  const domL = (sign: number) => (chart.angles ? [domZnaku(chart.angles.lagnaSign, sign)] : []);
  const odZnaku = (id: PlanetId, sign: number) => ((chart.planets[id].sign - sign + 12) % 12) + 1;
  const PIATKA: PlanetId[] = ["mars", "mercury", "jupiter", "venus", "saturn"];
  {
    const ks = chart.planets.moon.sign;
    const wAdhi = (["mercury", "jupiter", "venus"] as PlanetId[]).filter((id) => [6, 7, 8].includes(odZnaku(id, ks)));
    if (wAdhi.length >= 2) {
      jogi.push({
        id: "adhi",
        kategoria: "luminarze",
        nazwa: en ? "Adhi yoga" : "Adhi jogi",
        znaczenie: en ? "people and circumstances tend to support you — a position of trust, leadership through others" : "ludzie i okoliczności zwykle Cię wspierają — pozycja zaufania, prowadzenie innych",
        uzasadnienie: en
          ? `${wAdhi.map(nazwaG).join(" and ")} stand in houses 6–8 counted from the Moon.`
          : `${wAdhi.map(nazwaG).join(" i ")} stoją w 6.–8. domu licząc od Księżyca.`,
        planety: ["moon", ...wAdhi],
        domy: wAdhi.flatMap((id) => domL(chart.planets[id].sign)),
      });
    }
    const po2 = PIATKA.filter((id) => odZnaku(id, ks) === 2);
    const po12 = PIATKA.filter((id) => odZnaku(id, ks) === 12);
    if (po2.length && po12.length) {
      jogi.push({
        id: "durudhura",
        kategoria: "luminarze",
        nazwa: en ? "Durudhura yoga" : "Durudhura jogi",
        znaczenie: en ? "emotional stability and resources on both sides — generosity, comfort, support from family" : "stabilność emocjonalna i zasoby z obu stron — hojność, wygoda, wsparcie bliskich",
        uzasadnienie: en
          ? `The Moon is surrounded: ${po2.map(nazwaG).join(", ")} in the 2nd and ${po12.map(nazwaG).join(", ")} in the 12th house from it.`
          : `Księżyc jest otoczony: ${po2.map(nazwaG).join(", ")} w 2. i ${po12.map(nazwaG).join(", ")} w 12. domu od niego.`,
        planety: ["moon", ...po2, ...po12],
        domy: [ks, ...[...po2, ...po12].map((id) => chart.planets[id].sign)].flatMap(domL),
      });
    }
  }
  {
    const sl = chart.planets.sun.sign;
    const po2 = PIATKA.filter((id) => odZnaku(id, sl) === 2);
    const po12 = PIATKA.filter((id) => odZnaku(id, sl) === 12);
    if (po2.length && po12.length) {
      jogi.push({
        id: "ubhajaczari",
        kategoria: "luminarze",
        nazwa: en ? "Ubhayachari yoga" : "Ubhajaczari jogi",
        znaczenie: en ? "a balanced, capable character — eloquence, steady effort and a respected position" : "zrównoważony, zdolny charakter — elokwencja, wytrwałość i szanowana pozycja",
        uzasadnienie: en
          ? `The Sun is surrounded: ${po2.map(nazwaG).join(", ")} in the 2nd and ${po12.map(nazwaG).join(", ")} in the 12th house from it.`
          : `Słońce jest otoczone: ${po2.map(nazwaG).join(", ")} w 2. i ${po12.map(nazwaG).join(", ")} w 12. domu od niego.`,
        planety: ["sun", ...po2, ...po12],
        domy: [sl, ...[...po2, ...po12].map((id) => chart.planets[id].sign)].flatMap(domL),
      });
    }
  }

  if (!chart.angles) return dopiszVargottame(chart, jogi, locale); // reszta wymaga znanej lagny i domów
  const lagnaSign = chart.angles.lagnaSign;
  /** Dom (1–12) planety liczony z jej znaku i AKTUALNEJ lagny — nie z ewentualnie
   *  nieaktualnego pola .house (przydatne też przy testach z podmienioną lagną). */
  const domPlanety = (id: PlanetId) => domZnaku(lagnaSign, chart.planets[id].sign);

  // ── Pancza Mahapurusza — pięć jog wielkiej osobowości ──
  for (const m of MAHAPURUSZA) {
    const p = chart.planets[m.planeta];
    const naWlasciwejGodnosci = p.dignity === "władanie" || p.dignity === "egzaltacja";
    const domM = domPlanety(m.planeta);
    if (naWlasciwejGodnosci && KENDRY.includes(domM)) {
      jogi.push({
        id: `mahapurusza-${m.planeta}`,
        kategoria: "mahapurusza",
        nazwa: en ? m.nazwaEn : m.nazwa,
        znaczenie: en ? m.efektEn : m.efekt,
        uzasadnienie: en
          ? `${nazwaG(m.planeta)} ${p.dignity === "egzaltacja" ? "exalted" : "in its own sign"} in a kendra (house ${dom(domM)}).`
          : `${nazwaG(m.planeta)} ${p.dignity === "egzaltacja" ? "w egzaltacji" : "we władaniu"} w kendrze (${dom(domM)} dom).`,
        planety: [m.planeta],
        domy: [domM],
      });
    }
  }

  // ── Radźa jogi — władca kendry połączony z władcą trikony ──
  const parRadza = new Set<string>();
  for (const k of [4, 7, 10]) {
    for (const t of TRIKONY) {
      const lk = domLordu(lagnaSign, k);
      const lt = domLordu(lagnaSign, t);
      if (lk === lt) continue;
      const klucz = [lk, lt].sort().join("-");
      if (parRadza.has(klucz)) continue;
      const relacja = polaczenie(chart, lk, lt);
      if (relacja) {
        parRadza.add(klucz);
        jogi.push({
          id: `radza-${klucz}`,
          kategoria: "radza",
          nazwa: en ? "Raja yoga" : "Radźa jogi",
          znaczenie: en ? "a union of power and success — status, recognition, effective action" : "połączenie władzy i powodzenia — status, uznanie, skuteczność działania",
          uzasadnienie: en
            ? `The lord of house ${dom(k)} (${nazwaG(lk)}) and the lord of house ${dom(t)} (${nazwaG(lt)}) in ${RELACJA_NAZWA[relacja]}.`
            : `Władca ${dom(k)} domu (${nazwaG(lk)}) i władca ${dom(t)} domu (${nazwaG(lt)}) w ${relacja}.`,
          planety: [lk, lt],
          domy: [domPlanety(lk), domPlanety(lt), k, t],
        });
      }
    }
  }

  // ── Dhana jogi — jogi bogactwa: 2+11, 5+9, 9+11 oraz Jowisz w 1/2/11 ──
  const parDhana = new Set<string>();
  const KOMBINACJE_DHANA: [number, number][] = [[2, 11], [5, 9], [9, 11]];
  for (const [a, b] of KOMBINACJE_DHANA) {
    const la = domLordu(lagnaSign, a);
    const lb = domLordu(lagnaSign, b);
    if (la === lb) continue;
    const klucz = [la, lb].sort().join("-");
    if (parDhana.has(klucz)) continue;
    const relacja = polaczenie(chart, la, lb);
    if (relacja) {
      parDhana.add(klucz);
      jogi.push({
        id: `dhana-${klucz}`,
        kategoria: "dhana",
        nazwa: en ? "Dhana yoga" : "Dhana jogi",
        znaczenie: en ? "a natural magnet for material resources, the ability to accumulate" : "naturalny magnes na zasoby materialne, zdolność do gromadzenia",
        uzasadnienie: en
          ? `The lord of house ${dom(a)} (${nazwaG(la)}) and the lord of house ${dom(b)} (${nazwaG(lb)}) in ${RELACJA_NAZWA[relacja]}.`
          : `Władca ${dom(a)} domu (${nazwaG(la)}) i władca ${dom(b)} domu (${nazwaG(lb)}) w ${relacja}.`,
        planety: [la, lb],
        domy: [domPlanety(la), domPlanety(lb), a, b],
      });
    }
  }
  {
    const domJowisza = domPlanety("jupiter");
    if ([1, 2, 11].includes(domJowisza)) {
      jogi.push({
        id: "dhana-jowisz",
        kategoria: "dhana",
        nazwa: en ? "Dhana yoga" : "Dhana jogi",
        znaczenie: en ? "a natural benefic strengthens resources and a sense of abundance" : "naturalny dobroczyńca wzmacnia zasoby i poczucie obfitości",
        uzasadnienie: en ? `Jupiter stands in house ${dom(domJowisza)}.` : `Jowisz stoi w ${dom(domJowisza)} domu.`,
        planety: ["jupiter"],
        domy: [domJowisza],
      });
    }
  }

  // ── Saraswati jogi — Jowisz, Wenus i Merkury w kendrach, trikonach lub
  //    2. domu, a Jowisz silny (Phaladeepika 6) — klasyczna joga nauki i sztuk ──
  const GODNOSC_OPIS: Partial<Record<string, [string, string]>> = {
    egzaltacja: ["w egzaltacji", "exalted"], "władanie": ["we władaniu", "in its own sign"],
    mulatrikona: ["w mulatrikonie", "in mulatrikona"], przyjazny: ["w przyjaznym znaku", "in a friendly sign"],
  };
  {
    const trzy: PlanetId[] = ["jupiter", "venus", "mercury"];
    const godnoscJow = GODNOSC_OPIS[chart.planets.jupiter.dignity];
    if (godnoscJow && trzy.every((id) => [1, 2, 4, 5, 7, 9, 10].includes(domPlanety(id)))) {
      const lista = trzy.map((id) => (en ? `${nazwaG(id)} in the ${dom(domPlanety(id))} house` : `${nazwaG(id)} w ${dom(domPlanety(id))} domu`)).join(", ");
      jogi.push({
        id: "saraswati",
        kategoria: "saraswati",
        nazwa: en ? "Saraswati yoga" : "Saraswati jogi",
        znaczenie: en
          ? "a gift for learning, words and the arts — music, poetry, knowledge that others want to listen to"
          : "dar nauki, słowa i sztuki — muzyka, poezja, wiedza, której inni chcą słuchać",
        uzasadnienie: en
          ? `Jupiter, Venus and Mercury all in kendras, trikonas or the 2nd house (${lista}), and Jupiter is ${godnoscJow[1]}.`
          : `Jowisz, Wenus i Merkury w kendrach, trikonach lub 2. domu (${lista}), a Jowisz ${godnoscJow[0]}.`,
        planety: trzy,
        domy: trzy.map(domPlanety),
      });
    }
  }

  // ── Amala jogi — w 10. domu od lagny albo od Księżyca stoją wyłącznie
  //    naturalni dobroczyńcy (Jowisz, Wenus, Merkury) — dobre imię i trwała reputacja ──
  {
    const DOBROCZYNCY: PlanetId[] = ["jupiter", "venus", "mercury"];
    const ZLOCZYNCY: PlanetId[] = ["sun", "mars", "saturn", "rahu", "ketu"];
    for (const [odLagny, baza] of [[true, lagnaSign], [false, chart.planets.moon.sign]] as const) {
      const znak10 = (baza + 9) % 12;
      const w10 = PLANET_ORDER.filter((id) => chart.planets[id].sign === znak10);
      const dobre = w10.filter((id) => DOBROCZYNCY.includes(id));
      if (!dobre.length || w10.some((id) => ZLOCZYNCY.includes(id))) continue;
      const kto = dobre.map(nazwaG).join(en ? " and " : " i ");
      jogi.push({
        id: "amala",
        kategoria: "pomyslnosc",
        nazwa: en ? "Amala yoga" : "Amala jogi",
        znaczenie: en ? "a clean, lasting reputation — you are remembered for what you do well" : "czyste, trwałe dobre imię — zapamiętują Cię z tego, co robisz dobrze",
        uzasadnienie: en
          ? `Only natural benefics (${kto}) stand in the 10th house counted from the ${odLagny ? "lagna" : "Moon"}.`
          : `W 10. domu licząc od ${odLagny ? "lagny" : "Księżyca"} stoją wyłącznie naturalni dobroczyńcy (${kto}).`,
        planety: dobre,
        domy: [domZnaku(lagnaSign, znak10)],
      });
      break;
    }
  }

  // ── Lakszmi jogi — władca 9. domu silny (władanie, egzaltacja, mulatrikona)
  //    w kendrze lub trikonie, a władca lagny nie jest osłabiony (BPHS 41) ──
  {
    const l9 = domLordu(lagnaSign, 9), l1 = domLordu(lagnaSign, 1);
    const godnosc9 = chart.planets[l9].dignity;
    const silny9 = godnosc9 === "władanie" || godnosc9 === "egzaltacja" || godnosc9 === "mulatrikona";
    const dom9 = domPlanety(l9), dom1 = domPlanety(l1);
    if (silny9 && [...KENDRY, ...TRIKONY].includes(dom9) && !DUSTHANY.includes(dom1) && chart.planets[l1].dignity !== "upadek") {
      jogi.push({
        id: "lakszmi",
        kategoria: "pomyslnosc",
        nazwa: en ? "Lakshmi yoga" : "Lakszmi jogi",
        znaczenie: en ? "fortune that comes with dharma — prosperity, grace and good luck in what you undertake" : "pomyślność idąca za dharmą — dostatek, wdzięk i szczęście w tym, co podejmujesz",
        uzasadnienie: en
          ? `The lord of the 9th house (${nazwaG(l9)}) is ${GODNOSC_OPIS[godnosc9]![1]} in the ${dom(dom9)} house, and the lagna lord (${nazwaG(l1)}) is not weakened.`
          : `Władca 9. domu (${nazwaG(l9)}) ${GODNOSC_OPIS[godnosc9]![0]} w ${dom(dom9)} domu, a władca lagny (${nazwaG(l1)}) nie jest osłabiony.`,
        planety: l1 === l9 ? [l9] : [l9, l1],
        domy: [dom9, 9],
      });
    }
  }

  // ── Neeczabhanga Radźa jogi — zniesiony upadek, dowolna planeta ──
  for (const id of ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"] as PlanetId[]) {
    const p = chart.planets[id];
    if (p.dignity !== "upadek") continue;
    const powod = neechaBhanga(chart, id, locale);
    if (powod) {
      jogi.push({
        id: `neeczabhanga-${id}`,
        kategoria: "neeczabhanga",
        nazwa: en ? "Neechabhanga Raja yoga" : "Neeczabhanga Radźa jogi",
        znaczenie: en ? "weakness forged into strength — an apparent lack becomes an unusual asset" : "słabość przekuta w siłę — pozorny brak staje się nietypowym atutem",
        uzasadnienie: en
          ? `${nazwaG(id)} is debilitated, but ${powod} — the debilitation is cancelled.`
          : `${nazwaG(id)} w upadku, ale ${powod} — upadek zniesiony.`,
        planety: [id],
        domy: [domPlanety(id)],
      });
    }
  }

  // ── Wiprita Radźa jogi — władca dusthany w innej dusthanie ──
  for (const wlasny of DUSTHANY) {
    const lord = domLordu(lagnaSign, wlasny);
    const domTeraz = domPlanety(lord);
    if (DUSTHANY.includes(domTeraz) && domTeraz !== wlasny) {
      jogi.push({
        id: `wiprita-${wlasny}`,
        kategoria: "wiprita-radza",
        nazwa: en ? `${VIPRITA_NAZWA[wlasny].en} yoga` : `${VIPRITA_NAZWA[wlasny].pl} jogi`,
        znaczenie: en ? "sudden growth after a period of difficulty — a strength that only reveals itself after struggle" : "nagły wzrost po okresie trudności — siła, która ujawnia się dopiero po zmaganiu",
        uzasadnienie: en
          ? `The lord of house ${dom(wlasny)} (${nazwaG(lord)}) stands in house ${dom(domTeraz)}.`
          : `Władca ${dom(wlasny)} domu (${nazwaG(lord)}) stoi w ${dom(domTeraz)} domu.`,
        planety: [lord],
        domy: [wlasny, domTeraz],
      });
    }
  }

  return dopiszVargottame(chart, jogi, locale);
}

/**
 * Te same jogi, posortowane wg KOLEJNOSC_KATEGORII (od najbardziej osobistej/
 * znaczącej do sytuacyjnej) zamiast kolejności wykrywania w kodzie — ta ma
 * czysto techniczne pochodzenie (Gadźakesari sprawdzana pierwsza, bo jedyna
 * nie wymaga lagny) i NIE odzwierciedla ważności. Współdzielone przez każde
 * miejsce, które pokazuje "najważniejszą jogę" (Mandala Syntezy) albo
 * porządkuje listę (Talenty) — żeby "pierwsza joga" znaczyła to samo wszędzie.
 */
export function wykryteJogiPosortowane(chart: VedicChart, locale: AstroLocale = "pl"): Yoga[] {
  return [...wykryteJogi(chart, locale)].sort(
    (a, b) => KOLEJNOSC_KATEGORII.indexOf(a.kategoria) - KOLEJNOSC_KATEGORII.indexOf(b.kategoria),
  );
}

/**
 * Vargottama nie jest osobną jogą — to wzmacniacz tego, co planeta i tak
 * robi (ten sam znak w D1 i D9). Ale skoro wynika wprost z ułożenia planet,
 * dopisujemy ją do uzasadnienia KAŻDEJ wykrytej jogi, w której bierze udział
 * planeta vargottama — żadna znana zależność nie ma ginąć po drodze.
 */
function dopiszVargottame(chart: VedicChart, jogi: Yoga[], locale: AstroLocale = "pl"): Yoga[] {
  const en = locale === "en";
  for (const j of jogi) {
    const vargottamowe = j.planety.filter((id) => isVargottama(chart.planets[id].longitude));
    if (vargottamowe.length > 0) {
      const lista = vargottamowe.map((id) => grahaNazwa(GRAHAS[id], locale)).join(en ? " and " : " i ");
      if (en) {
        const czasownik = vargottamowe.length > 1 ? "are" : "is";
        j.uzasadnienie += ` Additionally, ${lista} ${czasownik} vargottama (same sign in D1 and D9) — the effect is clearer and more lasting.`;
      } else {
        const czasownik = vargottamowe.length > 1 ? "są" : "jest";
        j.uzasadnienie += ` Dodatkowo ${lista} ${czasownik} vargottama (ten sam znak w D1 i D9) — efekt wyraźniejszy i trwalszy.`;
      }
    }
  }
  return jogi;
}
