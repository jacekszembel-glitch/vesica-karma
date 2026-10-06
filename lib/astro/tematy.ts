import type { PlanetId } from "./constants";
import { PLANET_ORDER } from "./constants";
import type { VedicChart } from "./chart";
import type { NumerologyResult } from "./numerology";
import { ocenyNumerologii, PLANETA_CYFRA, type DlonWLiczbach, type LiniaDloni, type MiejsceZnaku, type RodzajZnaku, type StanLinii } from "./zgodnosc";

/**
 * WSPÓLNE TEMATY TRZECH SYSTEMÓW — konotacje: jeden sens życiowy i to, co go pokazuje
 * w każdym systemie osobno. Nie mówimy, JAKA to droga — tylko czy temat jest w danym
 * systemie zaznaczony. Przykład (Jacek, 2026-10-06): skupisko planet w jednym domu
 * i silna linia losu = zaznaczony cel; Księżyc w 12. domu i kreski/X na wzgórku Księżyca
 * = dalekie podróże.
 *
 * Każdy system daje: „tak” (wyraźnie), „częściowo”, „nie” albo „nie dotyczy” (temat bez
 * klasycznego odpowiednika w tym systemie) / „brak danych”. Pojedyncze wskazanie jest
 * częste — znaczenie ma to, że DWA albo TRZY niezależne systemy wskazują ten sam temat.
 */

export type StanWskazania = "tak" | "czesciowo" | "nie" | "nie_dotyczy" | "brak_danych";
export interface Wskazanie { stan: StanWskazania; opis: string }
export type SystemTematu = "kosmogram" | "dlon" | "numerologia";

export interface TematWspolny {
  id: string;
  nazwa: string;
  /** Co temat znaczy — jedno zdanie, bez przesądzania, jaka to droga. */
  znaczenie: string;
  /** Wniosek dla osoby, gdy temat potwierdzają co najmniej dwa systemy. */
  wniosek: string;
  wskazania: Record<SystemTematu, Wskazanie>;
  /** Ile systemów wskazuje temat: „tak” = 1, „częściowo” = ½. */
  sila: number;
  /** Ile systemów w ogóle może się o tym temacie wypowiedzieć (bez „nie dotyczy” i „brak danych”). */
  systemow: number;
}

const MIANOWNIK: Record<PlanetId, string> = {
  sun: "Słońce", moon: "Księżyc", mars: "Mars", mercury: "Merkury", jupiter: "Jowisz",
  venus: "Wenus", saturn: "Saturn", rahu: "Rahu", ketu: "Ketu",
};
const GODNOSC_WLASNA = new Set(["egzaltacja", "władanie", "mulatrikona"]);
const KENDRY = [1, 4, 7, 10];
const NAZWA_LINII: Record<LiniaDloni, string> = {
  losu: "linia losu", slonca: "linia Słońca", podrozy: "linie podróży", relacji: "linie relacji",
  serca: "linia serca", glowy: "linia głowy", zycia: "linia życia", intuicji: "linia intuicji",
  merkurego: "linia Merkurego", pas_wenus: "pas Wenus", pierscien_salomona: "pierścień Salomona", marsa: "linia Marsa",
};
/** Przysłówkiem — pasuje i do „linia”, i do „linie”, i do „pas”/„pierścień”. */
const STAN_LINII: Record<StanLinii, string> = { wyrazna: "wyraźnie", odcinkowa: "odcinkami", slaba: "słabo", brak: "brak" };
const NAZWA_ZNAKU: Record<RodzajZnaku, string> = {
  x: "X", gwiazda: "gwiazda", kwadrat: "kwadrat", trojkat: "trójkąt", kratka: "kratka", wyspa: "wyspa", krzyz_mistyczny: "krzyż mistyczny",
};
const DOPELNIACZ: Record<PlanetId, string> = {
  sun: "Słońca", moon: "Księżyca", mars: "Marsa", mercury: "Merkurego", jupiter: "Jowisza",
  venus: "Wenus", saturn: "Saturna", rahu: "Rahu", ketu: "Ketu",
};

const tak = (opis: string): Wskazanie => ({ stan: "tak", opis });
const czesciowo = (opis: string): Wskazanie => ({ stan: "czesciowo", opis });
const nie = (opis = ""): Wskazanie => ({ stan: "nie", opis });
const nieDotyczy: Wskazanie = { stan: "nie_dotyczy", opis: "" };
const brakDanych: Wskazanie = { stan: "brak_danych", opis: "" };

/** Najmocniejsze z kilku wskazań (tak > częściowo > nie). */
function najlepsze(...w: (Wskazanie | null)[]): Wskazanie | null {
  const lista = w.filter((x): x is Wskazanie => !!x);
  return lista.find((x) => x.stan === "tak") ?? lista.find((x) => x.stan === "czesciowo") ?? null;
}

export function tematyWspolne(chart: VedicChart, num: NumerologyResult, dlon: DlonWLiczbach | null): TematWspolny[] {
  /* ---------- kosmogram ---------- */
  const domy = !!chart.angles;
  const w = (d: number) => (domy ? PLANET_ORDER.filter((p) => chart.planets[p].house === d) : []);
  const lista = (ps: PlanetId[]) => ps.map((p) => MIANOWNIK[p]).join(", ");
  const dom = (p: PlanetId) => chart.planets[p].house;
  const silna = (p: PlanetId) => GODNOSC_WLASNA.has(chart.planets[p].dignity);
  const wDomach = (p: PlanetId, d: number[]) => domy && d.includes(dom(p));
  const astro = (f: () => Wskazanie | null): Wskazanie => (domy ? f() ?? nie() : brakDanych);

  // skupisko: dom z co najmniej trzema planetami
  const skupisko = domy
    ? [...Array(12).keys()].map((i) => ({ d: i + 1, ps: w(i + 1) })).sort((a, b) => b.ps.length - a.ps.length)[0]
    : null;

  /* ---------- dłoń ---------- */
  const linie = dlon?.linie ?? {};
  const znaki = [...(dlon?.znaki ?? []), ...(dlon?.wlasne ?? [])];
  const maDane = !!dlon && (Object.keys(linie).length > 0 || znaki.length > 0 || Object.keys(dlon.planety).length > 0);
  const linia = (l: LiniaDloni): Wskazanie | null => {
    const s = linie[l];
    if (s === "wyrazna") return tak(`${NAZWA_LINII[l]} — wyraźnie`);
    if (s === "odcinkowa" || s === "slaba") return czesciowo(`${NAZWA_LINII[l]} — ${STAN_LINII[s]}`);
    return null;
  };
  const znakNa = (m: MiejsceZnaku, rodzaje?: RodzajZnaku[]): Wskazanie | null => {
    const z = znaki.find((x) => x.miejsce === m && (!rodzaje || rodzaje.includes(x.znak)));
    if (!z) return null;
    const gdzie = m === "czworobok" ? "" : ` na wzgórku ${DOPELNIACZ[m as PlanetId]}`;
    const opis = `${NAZWA_ZNAKU[z.znak]}${gdzie}${z.zrodlo === "osoba" ? " (zgłoszony przez Ciebie)" : ""}`;
    return z.pewnosc === "delikatny" ? czesciowo(opis + ", delikatny") : tak(opis);
  };
  const wzgorek = (p: PlanetId): Wskazanie | null =>
    dlon?.planety[p] === 1 ? tak(`wydatny wzgórek ${DOPELNIACZ[p]}`) : null;
  const reka = (f: () => Wskazanie | null): Wskazanie => (maDane ? f() ?? nie() : brakDanych);

  /* ---------- numerologia ---------- */
  const powody = ocenyNumerologii(num).powody;
  const cyfra = (p: PlanetId): Wskazanie | null => {
    const c = PLANETA_CYFRA[p];
    const r = powody[p];
    const role = [r.mulank && "Mulank", r.bhagyank && "Bhagyank", r.imie && "liczba imienia"].filter(Boolean);
    if (role.length) return tak(`${c} (${MIANOWNIK[p]}) — ${role.join(", ")}`);
    if (r.wDacie >= 2) return czesciowo(`${c} (${MIANOWNIK[p]}) ×${r.wDacie} w dacie`);
    return null;
  };
  const liczby = (...ps: PlanetId[]): Wskazanie => najlepsze(...ps.map(cyfra)) ?? nie();

  /* ---------- tematy ---------- */
  const tematy: Omit<TematWspolny, "sila" | "systemow">[] = [
    {
      id: "cel", nazwa: "Wyraźny cel, droga życiowa",
      znaczenie: "Życie ma wyraźnie zaznaczony kierunek — coś, ku czemu się zmierza.",
      wniosek: "Twoje życie ma wyraźnie zaznaczony kierunek. To nie jest droga „jak wyjdzie” — warto świadomie nazwać swój cel i trzymać się go, bo wszystko w Tobie pracuje w jedną stronę.",
      wskazania: {
        kosmogram: astro(() => skupisko && skupisko.ps.length >= 3 ? tak(`skupisko w ${skupisko.d}. domu: ${lista(skupisko.ps)}`)
          : w(10).length >= 2 ? tak(`10. dom: ${lista(w(10))}`)
            : w(10).length === 1 ? czesciowo(`10. dom: ${lista(w(10))}`) : null),
        dlon: reka(() => linia("losu")),
        numerologia: num.destiny === num.birthdayRoot ? tak(`Bhagyank = Mulank (${num.destiny}) — jeden kierunek`)
          : powody[CYFRA(num.destiny)].imie ? tak(`Bhagyank = liczba imienia (${num.destiny})`) : nie(),
      },
    },
    {
      id: "podroze", nazwa: "Dalekie podróże, zagranica",
      znaczenie: "Życie ciągnie w dal — wyjazdy, obce miejsca, życie z dala od miejsca urodzenia.",
      wniosek: "Dal Cię przyciąga — wyjazdy, obce miejsca, życie z dala od miejsca urodzenia. Ważne sprawy często rozstrzygają się w drodze albo za granicą.",
      wskazania: {
        kosmogram: astro(() => najlepsze(
          ...(["moon", "rahu"] as PlanetId[]).map((p) => (wDomach(p, [9, 12]) ? tak(`${MIANOWNIK[p]} w ${dom(p)}. domu`) : null)),
          w(9).length + w(12).length >= 2 ? tak(`9. i 12. dom: ${lista([...w(9), ...w(12)])}`) : null,
          w(9).length + w(12).length === 1 ? czesciowo(`${w(9).length ? "9." : "12."} dom: ${lista([...w(9), ...w(12)])}`) : null,
        )),
        dlon: reka(() => najlepsze(linia("podrozy"), znakNa("moon"))),
        numerologia: liczby("mercury"),
      },
    },
    {
      id: "duchowosc", nazwa: "Intuicja, duchowość",
      znaczenie: "Silny kontakt z tym, co niewidoczne — intuicja, wiara, życie wewnętrzne.",
      wniosek: "Masz silny kontakt z tym, co niewidoczne. Intuicji warto ufać — podpowiada trafniej niż chłodna kalkulacja, a życie wewnętrzne jest Twoim źródłem siły.",
      wskazania: {
        kosmogram: astro(() => najlepsze(
          ...(["ketu", "jupiter"] as PlanetId[]).map((p) => (wDomach(p, [1, 5, 9, 12]) ? tak(`${MIANOWNIK[p]} w ${dom(p)}. domu`) : null)),
          wDomach("moon", [8, 12]) ? tak(`Księżyc w ${dom("moon")}. domu`) : null,
          w(12).length ? czesciowo(`12. dom: ${lista(w(12))}`) : null,
        )),
        dlon: reka(() => najlepsze(znakNa("czworobok", ["krzyz_mistyczny"]), linia("intuicji"), linia("pierscien_salomona"))),
        numerologia: liczby("ketu"),
      },
    },
    {
      id: "uznanie", nazwa: "Uznanie, twórczość, widoczność",
      znaczenie: "Talent do bycia zauważonym — twórczość, scena, dobre imię.",
      wniosek: "Masz w sobie coś, co przyciąga uwagę. Twórczość i bycie widocznym to Twoja naturalna przestrzeń — warto pozwolić się zauważyć.",
      wskazania: {
        kosmogram: astro(() => wDomach("sun", [1, 5, 9, 10]) ? tak(`Słońce w ${dom("sun")}. domu`)
          : silna("sun") ? tak(`Słońce — ${chart.planets.sun.dignity}`) : null),
        dlon: reka(() => najlepsze(linia("slonca"), znakNa("sun", ["gwiazda", "trojkat"]), wzgorek("sun"))),
        numerologia: liczby("sun"),
      },
    },
    {
      id: "ambicja", nazwa: "Ambicja, przywództwo, nauczanie",
      znaczenie: "Potrzeba prowadzenia innych, rozwoju, autorytetu.",
      wniosek: "Masz w sobie potrzebę prowadzenia i rozwoju. Dobrze odnajdujesz się tam, gdzie można uczyć, doradzać albo brać odpowiedzialność za innych.",
      wskazania: {
        kosmogram: astro(() => wDomach("jupiter", [...KENDRY, 5, 9]) ? tak(`Jowisz w ${dom("jupiter")}. domu`)
          : silna("jupiter") ? tak(`Jowisz — ${chart.planets.jupiter.dignity}`) : null),
        dlon: reka(() => najlepsze(wzgorek("jupiter"), znakNa("jupiter", ["kwadrat", "gwiazda", "trojkat"]), linia("pierscien_salomona"))),
        numerologia: liczby("jupiter"),
      },
    },
    {
      id: "zwiazek", nazwa: "Związek, uczucia",
      znaczenie: "Relacje i uczucia zajmują w życiu ważne miejsce.",
      wniosek: "Relacje i uczucia są dla Ciebie centralne. Dużo w życiu dzieje się przez bliskich ludzi — dobry związek wzmacnia wszystko inne.",
      wskazania: {
        kosmogram: astro(() => najlepsze(
          silna("venus") ? tak(`Wenus — ${chart.planets.venus.dignity}`) : null,
          w(7).length >= 2 ? tak(`7. dom: ${lista(w(7))}`) : w(7).length === 1 ? czesciowo(`7. dom: ${lista(w(7))}`) : null,
        )),
        dlon: reka(() => najlepsze(linia("relacji"), wzgorek("venus"), znakNa("jupiter", ["x"]), linia("serca"))),
        numerologia: liczby("venus", "moon"),
      },
    },
    {
      id: "umysl", nazwa: "Umysł, słowo, handel",
      znaczenie: "Siła myśli i komunikacji — nauka, pisanie, rozmowa, interesy.",
      wniosek: "Twoją siłą jest umysł i słowo. Nauka, pisanie, rozmowa i interesy to obszary, w których najłatwiej się realizujesz.",
      wskazania: {
        kosmogram: astro(() => najlepsze(
          wDomach("mercury", KENDRY) ? tak(`Merkury w ${dom("mercury")}. domu`) : silna("mercury") ? tak(`Merkury — ${chart.planets.mercury.dignity}`) : null,
          w(3).length >= 2 ? tak(`3. dom: ${lista(w(3))}`) : null,
        )),
        dlon: reka(() => najlepsze(linia("merkurego"), wzgorek("mercury"), linia("glowy"))),
        numerologia: liczby("mercury"),
      },
    },
    {
      id: "energia", nazwa: "Energia, odwaga, działanie",
      znaczenie: "Dużo siły życiowej i odwagi do działania.",
      wniosek: "Masz dużo siły życiowej i odwagi do działania. Najlepiej Ci, gdy możesz działać, a nie czekać.",
      wskazania: {
        kosmogram: astro(() => wDomach("mars", [...KENDRY, 3, 6, 11]) ? tak(`Mars w ${dom("mars")}. domu`)
          : silna("mars") ? tak(`Mars — ${chart.planets.mars.dignity}`) : null),
        dlon: reka(() => najlepsze(linia("marsa"), wzgorek("mars"), linia("zycia"))),
        numerologia: liczby("mars"),
      },
    },
    {
      id: "praca", nazwa: "Praca, obowiązek, wytrwałość",
      znaczenie: "Rzetelność i wytrwałość — budowanie krok po kroku.",
      wniosek: "Twoją siłą jest wytrwałość. Budujesz krok po kroku — powoli, ale trwale.",
      wskazania: {
        kosmogram: astro(() => wDomach("saturn", [...KENDRY, 6, 11]) ? tak(`Saturn w ${dom("saturn")}. domu`)
          : silna("saturn") ? tak(`Saturn — ${chart.planets.saturn.dignity}`) : null),
        dlon: reka(() => najlepsze(wzgorek("saturn"), znakNa("saturn", ["kwadrat", "trojkat"]))),
        numerologia: liczby("saturn"),
      },
    },
    {
      id: "przemiana", nazwa: "Przemiany, kryzysy, odrodzenie",
      znaczenie: "Życie z wyraźnymi zakrętami — przełomy, po których zaczyna się na nowo.",
      wniosek: "Twoje życie ma wyraźne zakręty i przełomy. Kryzysy są u Ciebie początkiem nowego etapu, nie końcem.",
      wskazania: {
        kosmogram: astro(() => w(8).length >= 2 ? tak(`8. dom: ${lista(w(8))}`) : w(8).length === 1 ? czesciowo(`8. dom: ${lista(w(8))}`) : null),
        dlon: reka(() => najlepsze(
          znaki.some((z) => z.znak === "wyspa") ? tak("wyspy na liniach") : null,
          znaki.some((z) => z.znak === "kratka") ? czesciowo("kratki na wzgórkach") : null,
        )),
        numerologia: nieDotyczy,
      },
    },
  ];

  return tematy.map((t) => {
    const ws = Object.values(t.wskazania);
    const sila = ws.reduce((s, x) => s + (x.stan === "tak" ? 1 : x.stan === "czesciowo" ? 0.5 : 0), 0);
    const systemow = ws.filter((x) => x.stan !== "nie_dotyczy" && x.stan !== "brak_danych").length;
    return { ...t, sila, systemow };
  }).sort((a, b) => b.sila - a.sila);
}

/** Cyfra → planeta (wedyjsko), do sprawdzenia, czy Bhagyank to też liczba imienia. */
function CYFRA(c: number): PlanetId {
  return (Object.entries(PLANETA_CYFRA).find(([, v]) => v === c)?.[0] ?? "sun") as PlanetId;
}

