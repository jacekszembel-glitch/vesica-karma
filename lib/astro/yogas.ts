import { GRAHAS, RASIS, type PlanetId } from "./constants";
import type { VedicChart } from "./chart";
import { aspektuje, neechaBhanga } from "./sila";
import { isVargottama } from "./varga";

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
  | "mahapurusza" | "gajakesari" | "budha-aditja"
  | "radza" | "dhana" | "neeczabhanga" | "wiprita-radza";

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
  gajakesari: "Gadźakesari — mądrość",
  "budha-aditja": "Budha-Aditja — intelekt",
  radza: "Radźa — władza i status",
  dhana: "Dhana — bogactwo",
  neeczabhanga: "Neeczabhanga — zniesiony upadek",
  "wiprita-radza": "Wiprita Radźa — wzrost po trudnościach",
};

/** Stała kolejność kategorii — od najbardziej osobistej do sytuacyjnej. */
export const KOLEJNOSC_KATEGORII: KategoriaJogi[] = [
  "mahapurusza", "gajakesari", "budha-aditja", "radza", "dhana", "neeczabhanga", "wiprita-radza",
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

const MAHAPURUSZA: { planeta: PlanetId; nazwa: string; efekt: string }[] = [
  { planeta: "mars", nazwa: "Ruczaka jogi", efekt: "wojownicza odwaga, przywództwo, sława zdobyta czynem" },
  { planeta: "mercury", nazwa: "Bhadra jogi", efekt: "błyskotliwość umysłu, elokwencja, zasoby z wiedzy" },
  { planeta: "jupiter", nazwa: "Hansa jogi", efekt: "mądrość, prawość, szacunek otoczenia" },
  { planeta: "venus", nazwa: "Malawja jogi", efekt: "urok, dary artystyczne, dostatek i piękno wokół siebie" },
  { planeta: "saturn", nazwa: "Śasza jogi", efekt: "autorytet budowany wytrwałością, przywództwo mas, długowieczna sprawczość" },
];

const VIPRITA_NAZWA: Record<number, string> = { 6: "Harsza", 8: "Sarala", 12: "Wimala" };

/** Wszystkie wykryte jogi w tej konkretnej mapie. Wymaga chart.angles. */
export function wykryteJogi(chart: VedicChart): Yoga[] {
  const jogi: Yoga[] = [];

  // ── Gadźakesari — jedyna, która nie wymaga lagny (liczy się od Księżyca) ──
  const domOdKsiezyca = ((chart.planets.jupiter.sign - chart.planets.moon.sign + 12) % 12) + 1;
  if (KENDRY.includes(domOdKsiezyca)) {
    jogi.push({
      id: "gajakesari",
      kategoria: "gajakesari",
      nazwa: "Gadźakesari jogi",
      znaczenie: "mądrość, dobra reputacja, spokój i szacunek w oczach innych",
      uzasadnienie: `Jowisz stoi w kendrze (${domOdKsiezyca}. dom) licząc od Księżyca.`,
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
      nazwa: "Budha-Aditja jogi",
      znaczenie: "bystry intelekt, zdolności komunikacyjne, jasność myślenia",
      uzasadnienie: `Słońce i Merkury razem w ${RASIS[chart.planets.sun.sign].pl}${domSlonca ? ` (${domSlonca}. dom)` : ""}.`,
      planety: ["sun", "mercury"],
      domy: domSlonca ? [domSlonca] : [],
    });
  }

  if (!chart.angles) return dopiszVargottame(chart, jogi); // reszta wymaga znanej lagny i domów
  const lagnaSign = chart.angles.lagnaSign;
  /** Dom (1–12) planety liczony z jej znaku i AKTUALNEJ lagny — nie z ewentualnie
   *  nieaktualnego pola .house (przydatne też przy testach z podmienioną lagną). */
  const domPlanety = (id: PlanetId) => domZnaku(lagnaSign, chart.planets[id].sign);

  // ── Pancza Mahapurusza — pięć jog wielkiej osobowości ──
  for (const m of MAHAPURUSZA) {
    const p = chart.planets[m.planeta];
    const naWlasciwejGodnosci = p.dignity === "władanie" || p.dignity === "egzaltacja";
    const dom = domPlanety(m.planeta);
    if (naWlasciwejGodnosci && KENDRY.includes(dom)) {
      jogi.push({
        id: `mahapurusza-${m.planeta}`,
        kategoria: "mahapurusza",
        nazwa: m.nazwa,
        znaczenie: m.efekt,
        uzasadnienie: `${GRAHAS[m.planeta].pl} ${p.dignity === "egzaltacja" ? "w egzaltacji" : "we władaniu"} w kendrze (${dom}. dom).`,
        planety: [m.planeta],
        domy: [dom],
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
          nazwa: "Radźa jogi",
          znaczenie: "połączenie władzy i powodzenia — status, uznanie, skuteczność działania",
          uzasadnienie: `Władca ${k}. domu (${GRAHAS[lk].pl}) i władca ${t}. domu (${GRAHAS[lt].pl}) w ${relacja}.`,
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
        nazwa: "Dhana jogi",
        znaczenie: "naturalny magnes na zasoby materialne, zdolność do gromadzenia",
        uzasadnienie: `Władca ${a}. domu (${GRAHAS[la].pl}) i władca ${b}. domu (${GRAHAS[lb].pl}) w ${relacja}.`,
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
        nazwa: "Dhana jogi",
        znaczenie: "naturalny dobroczyńca wzmacnia zasoby i poczucie obfitości",
        uzasadnienie: `Jowisz stoi w ${domJowisza}. domu.`,
        planety: ["jupiter"],
        domy: [domJowisza],
      });
    }
  }

  // ── Neeczabhanga Radźa jogi — zniesiony upadek, dowolna planeta ──
  for (const id of ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"] as PlanetId[]) {
    const p = chart.planets[id];
    if (p.dignity !== "upadek") continue;
    const powod = neechaBhanga(chart, id);
    if (powod) {
      jogi.push({
        id: `neeczabhanga-${id}`,
        kategoria: "neeczabhanga",
        nazwa: "Neeczabhanga Radźa jogi",
        znaczenie: "słabość przekuta w siłę — pozorny brak staje się nietypowym atutem",
        uzasadnienie: `${GRAHAS[id].pl} w upadku, ale ${powod} — upadek zniesiony.`,
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
        nazwa: `${VIPRITA_NAZWA[wlasny]} jogi`,
        znaczenie: "nagły wzrost po okresie trudności — siła, która ujawnia się dopiero po zmaganiu",
        uzasadnienie: `Władca ${wlasny}. domu (${GRAHAS[lord].pl}) stoi w ${domTeraz}. domu.`,
        planety: [lord],
        domy: [wlasny, domTeraz],
      });
    }
  }

  return dopiszVargottame(chart, jogi);
}

/**
 * Te same jogi, posortowane wg KOLEJNOSC_KATEGORII (od najbardziej osobistej/
 * znaczącej do sytuacyjnej) zamiast kolejności wykrywania w kodzie — ta ma
 * czysto techniczne pochodzenie (Gadźakesari sprawdzana pierwsza, bo jedyna
 * nie wymaga lagny) i NIE odzwierciedla ważności. Współdzielone przez każde
 * miejsce, które pokazuje "najważniejszą jogę" (Mandala Syntezy) albo
 * porządkuje listę (Talenty) — żeby "pierwsza joga" znaczyła to samo wszędzie.
 */
export function wykryteJogiPosortowane(chart: VedicChart): Yoga[] {
  return [...wykryteJogi(chart)].sort(
    (a, b) => KOLEJNOSC_KATEGORII.indexOf(a.kategoria) - KOLEJNOSC_KATEGORII.indexOf(b.kategoria),
  );
}

/**
 * Vargottama nie jest osobną jogą — to wzmacniacz tego, co planeta i tak
 * robi (ten sam znak w D1 i D9). Ale skoro wynika wprost z ułożenia planet,
 * dopisujemy ją do uzasadnienia KAŻDEJ wykrytej jogi, w której bierze udział
 * planeta vargottama — żadna znana zależność nie ma ginąć po drodze.
 */
function dopiszVargottame(chart: VedicChart, jogi: Yoga[]): Yoga[] {
  for (const j of jogi) {
    const vargottamowe = j.planety.filter((id) => isVargottama(chart.planets[id].longitude));
    if (vargottamowe.length > 0) {
      const lista = vargottamowe.map((id) => GRAHAS[id].pl).join(" i ");
      const czasownik = vargottamowe.length > 1 ? "są" : "jest";
      j.uzasadnienie += ` Dodatkowo ${lista} ${czasownik} vargottama (ten sam znak w D1 i D9) — efekt wyraźniejszy i trwalszy.`;
    }
  }
  return jogi;
}
