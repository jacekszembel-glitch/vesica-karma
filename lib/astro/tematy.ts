import type { PlanetId } from "./constants";
import { PLANET_ORDER, RASIS } from "./constants";
import type { VedicChart } from "./chart";
import type { NumerologyResult } from "./numerology";
import { dziedzinyTalentu, type DziedzinaTalentu } from "./dziedzinyTalentu";
import { ROZKLADY_TALENTU } from "./srednieTalentu";
import { procentNizej, SREDNIE_BILANSU } from "./srednieBilansu";
import { ocenaFinansowa } from "./finanseWedyjskie";
import { jogakaraka } from "./karaki";
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
export interface Wskazanie {
  stan: StanWskazania;
  opis: string;
  /** Siła wskazania w tym systemie — do wyboru najważniejszego tematu każdego systemu
   *  (suma wszystkich spełnionych warunków tematu, nie tylko najlepszego). */
  moc?: number;
  /** Wszystkie spełnione warunki tematu w tym systemie (opis = najmocniejszy z nich). */
  dowody?: string[];
}
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

const tak = (opis: string, moc = 2): Wskazanie => ({ stan: "tak", opis, moc });
const czesciowo = (opis: string, moc = 1): Wskazanie => ({ stan: "czesciowo", opis, moc });
const nie = (opis = ""): Wskazanie => ({ stan: "nie", opis });
const brakDanych: Wskazanie = { stan: "brak_danych", opis: "" };

/** Najmocniejsze z kilku wskazań (tak > częściowo > nie); siła = suma wszystkich spełnionych. */
function najlepsze(...w: (Wskazanie | null)[]): Wskazanie | null {
  const lista = w.filter((x): x is Wskazanie => !!x);
  const najl = lista.find((x) => x.stan === "tak") ?? lista.find((x) => x.stan === "czesciowo");
  if (!najl) return null;
  return {
    ...najl,
    moc: lista.reduce((s, x) => s + (x.moc ?? 0), 0),
    dowody: lista.flatMap((x) => x.dowody ?? [x.opis]),
  };
}

/** Dłoń jednej ręki: wiodąca = planety i linie z głównego bloku, bierna = blok „bierna” (starsze odczyty go nie mają). */
export function dlonReki(dlon: DlonWLiczbach | null, reka: "wiodaca" | "bierna"): DlonWLiczbach | null {
  if (!dlon) return null;
  const tej = <T extends { reka: string }>(l?: T[]) => (l ?? []).filter((z) => z.reka === reka);
  return reka === "wiodaca"
    ? { ...dlon, znaki: tej(dlon.znaki), wlasne: tej(dlon.wlasne), bierna: undefined }
    : { planety: dlon.bierna?.planety ?? {}, linie: dlon.bierna?.linie ?? {}, zywiol: dlon.zywiol, zrodlo: dlon.zrodlo, znaki: tej(dlon.znaki), wlasne: tej(dlon.wlasne) };
}

/**
 * opcje.varga — wykres dzielony (np. D9): bez talentów i bez finansów z zakładki Finanse,
 * bo ich rozkłady „na tle 20 000 horoskopów” policzono dla mapy głównej; finanse z D9 = planety w 2. i 11. domu.
 */
export function tematyWspolne(chart: VedicChart, num: NumerologyResult, dlon: DlonWLiczbach | null, opcje: { varga?: boolean } = {}): TematWspolny[] {
  /* ---------- kosmogram ---------- */
  const domy = !!chart.angles;
  const w = (d: number) => (domy ? PLANET_ORDER.filter((p) => chart.planets[p].house === d) : []);
  const lista = (ps: PlanetId[]) => ps.map((p) => MIANOWNIK[p]).join(", ");
  const dom = (p: PlanetId) => chart.planets[p].house;
  const silna = (p: PlanetId) => GODNOSC_WLASNA.has(chart.planets[p].dignity);
  const wDomach = (p: PlanetId, d: number[]) => domy && d.includes(dom(p));
  const astro = (f: () => Wskazanie | null): Wskazanie => (domy ? f() ?? nie() : brakDanych);

  // Talenty (te same wyliczenia co zakładka Talenty) na tle 20 000 losowych horoskopów:
  // górne 25% = temat zaznaczony, górne 40% = częściowo. To uczciwsza miara niż samo położenie
  // planety w domu — łapie np. mocnego Jowisza w nauczaniu, który stoi poza kendrą i trikoną.
  const NAZWA_TALENTU: Record<DziedzinaTalentu, string> = {
    muzyka: "muzyka", sztuka: "sztuka", slowo: "słowo", nauczanie: "nauczanie", biznes: "biznes",
    technika: "technika", uzdrawianie: "uzdrawianie", sport: "sport i ruch", przywodztwo: "przywództwo", duchowosc: "duchowość",
  };
  const procentTalentu = new Map<DziedzinaTalentu, number>(
    (dziedzinyTalentu(chart) ?? []).map((w) => [w.id, procentNizej(w.punkty, ROZKLADY_TALENTU[w.id])]),
  );
  const talent = (...ids: DziedzinaTalentu[]): Wskazanie | null => {
    if (opcje.varga) return null;
    const najl = ids.map((id) => ({ id, p: procentTalentu.get(id) ?? 0 })).sort((a, b) => b.p - a.p)[0];
    if (!najl) return null;
    const opis = `talent: ${NAZWA_TALENTU[najl.id]} — wyżej niż u ${Math.round(najl.p)}% osób`;
    return najl.p >= 75 ? tak(opis, najl.p / 25) : najl.p >= 60 ? czesciowo(opis, najl.p / 40) : null;
  };
  // jogakaraka — planeta, która dla tej lagny rządzi jednocześnie kendrą i trikoną (najlepsza w horoskopie)
  const jk = domy ? jogakaraka(chart.angles!.lagnaSign) : null;
  const jogakarakaTo = (p: PlanetId): Wskazanie | null =>
    jk === p ? tak(`${MIANOWNIK[p]} — jogakaraka (władca kendry i trikony)`, 3) : null;

  // Finanse — te same wyliczenia co zakładka Finanse: joga bogactwa (dhana) albo planeta-wskaźnik
  // finansów (władca 2./11. domu, karaka bogactwa…) mocniejsza niż u 75% / 60% osób.
  const finanse = (): Wskazanie | null => {
    if (opcje.varga) {
      const ps = [...w(2), ...w(11)];
      return ps.length >= 2 ? tak(`2. i 11. dom: ${lista(ps)}`) : ps.length === 1 ? czesciowo(`${w(2).length ? "2." : "11."} dom: ${lista(ps)}`) : null;
    }
    const fin = ocenaFinansowa(chart);
    const dhana = fin.dhanaJogi[0];
    const czynniki = fin.planety.map((f) => {
      const r = SREDNIE_BILANSU.finanse[f.planeta];
      return { f, p: r ? procentNizej(f.ocena.punkty, r) : 0 };
    }).sort((a, b) => b.p - a.p);
    const najl = czynniki[0];
    const opisPl = najl ? `${MIANOWNIK[najl.f.planeta]} (${najl.f.role[0]?.split(" — ")[0] ?? "wskaźnik finansów"}) — wyżej niż u ${Math.round(najl.p)}% osób` : "";
    return najlepsze(
      dhana ? tak(`joga bogactwa (${dhana.nazwa})`, 2.5) : null,
      najl && najl.p >= 75 ? tak(opisPl) : najl && najl.p >= 60 ? czesciowo(opisPl) : null,
    );
  };

  // skupisko: dom z co najmniej trzema planetami
  const skupisko = domy
    ? [...Array(12).keys()].map((i) => ({ d: i + 1, ps: w(i + 1) })).sort((a, b) => b.ps.length - a.ps.length)[0]
    : null;

  // skupisko pokazuje DROGĘ, nie tylko siłę: liczba planet, dom (dziedzina życia) i znak (sposób)
  const opisSkupiska = () => skupisko
    ? `skupisko ${skupisko.ps.length} planet w ${skupisko.d}. domu, w znaku ${RASIS[chart.planets[skupisko.ps[0]].sign].pl}: ${lista(skupisko.ps)}`
    : "";

  /* ---------- dłoń ---------- */
  const linie = dlon?.linie ?? {};
  const znaki = [...(dlon?.znaki ?? []), ...(dlon?.wlasne ?? [])];
  const maDane = !!dlon && (Object.keys(linie).length > 0 || znaki.length > 0 || Object.keys(dlon.planety).length > 0);
  // czy któryś ze sprawdzanych wskaźników dłoni w ogóle miał dane — inaczej temat to „brak danych”, nie 0
  let sprawdzono = false;
  const linia = (l: LiniaDloni): Wskazanie | null => {
    const s = linie[l];
    if (s) sprawdzono = true;
    if (s === "wyrazna") return tak(`${NAZWA_LINII[l]} — wyraźnie`);
    if (s === "odcinkowa" || s === "slaba") return czesciowo(`${NAZWA_LINII[l]} — ${STAN_LINII[s]}`);
    return null;
  };
  const znakNa = (m: MiejsceZnaku, rodzaje?: RodzajZnaku[]): Wskazanie | null => {
    if (dlon?.znaki) sprawdzono = true;
    const wszystkie = znaki.filter((x) => x.miejsce === m && (!rodzaje || rodzaje.includes(x.znak)));
    if (!wszystkie.length) return null;
    const z = wszystkie.find((x) => x.pewnosc === "wyrazny") ?? wszystkie[0];
    const gdzie = m === "czworobok" ? "" : ` na wzgórku ${DOPELNIACZ[m as PlanetId]}`;
    const ile = wszystkie.length > 1 ? ` (razem znaków: ${wszystkie.length})` : "";
    const opis = `${NAZWA_ZNAKU[z.znak]}${gdzie}${z.zrodlo === "osoba" ? " (zgłoszony przez Ciebie)" : ""}${ile}`;
    const moc = wszystkie.reduce((s, x) => s + (x.pewnosc === "wyrazny" ? 2 : 1), 0);
    return z.pewnosc === "delikatny" ? czesciowo(opis + ", delikatny", moc) : tak(opis, moc);
  };
  const wzgorek = (p: PlanetId): Wskazanie | null => {
    if (dlon?.planety[p] != null) sprawdzono = true;
    return dlon?.planety[p] === 1 ? tak(`wydatny wzgórek ${DOPELNIACZ[p]}`, 1.5) : null;
  };
  const reka = (f: () => Wskazanie | null): Wskazanie => {
    if (!maDane) return brakDanych;
    sprawdzono = false;
    const w = f();
    return w ?? (sprawdzono ? nie() : brakDanych);
  };

  /* ---------- numerologia ---------- */
  const powody = ocenyNumerologii(num).powody;
  const cyfra = (p: PlanetId): Wskazanie | null => {
    const c = PLANETA_CYFRA[p];
    const r = powody[p];
    const role = [r.mulank && "Mulank", r.bhagyank && "Bhagyank", r.imie && "liczba imienia"].filter(Boolean);
    // Bhagyank (droga życia) waży najwięcej, potem Mulank, potem liczba imienia
    const moc = (r.bhagyank ? 3 : 0) + (r.mulank ? 2.5 : 0) + (r.imie ? 2 : 0) + r.wDacie * 0.5;
    if (role.length) return tak(`${c} (${MIANOWNIK[p]}) — ${role.join(", ")}`, moc);
    if (r.wDacie >= 2) return czesciowo(`${c} (${MIANOWNIK[p]}) ×${r.wDacie} w dacie`, moc);
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
        kosmogram: astro(() => skupisko && skupisko.ps.length >= 3 ? tak(opisSkupiska(), skupisko.ps.length * 2)
          : w(10).length >= 2 ? tak(`10. dom: ${lista(w(10))}`)
            : w(10).length === 1 ? czesciowo(`10. dom: ${lista(w(10))}`) : null),
        dlon: reka(() => linia("losu")),
        numerologia: num.destiny === num.birthdayRoot ? tak(`Bhagyank = Mulank (${num.destiny}) — jeden kierunek`, 3)
          : powody[CYFRA(num.destiny)].imie ? tak(`Bhagyank = liczba imienia (${num.destiny})`, 3) : nie(),
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
          talent("duchowosc"),
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
        kosmogram: astro(() => najlepsze(
          wDomach("sun", [1, 5, 9, 10]) ? tak(`Słońce w ${dom("sun")}. domu`) : null,
          silna("sun") ? tak(`Słońce — ${chart.planets.sun.dignity}`) : null,
          talent("sztuka", "muzyka"),
        )),
        dlon: reka(() => najlepsze(linia("slonca"), znakNa("sun", ["gwiazda", "trojkat"]), wzgorek("sun"))),
        numerologia: liczby("sun"),
      },
    },
    {
      id: "ambicja", nazwa: "Ambicja, przywództwo, nauczanie",
      znaczenie: "Potrzeba prowadzenia innych, rozwoju, autorytetu.",
      wniosek: "Masz w sobie potrzebę prowadzenia i rozwoju. Dobrze odnajdujesz się tam, gdzie można uczyć, doradzać albo brać odpowiedzialność za innych.",
      wskazania: {
        kosmogram: astro(() => najlepsze(
          talent("nauczanie", "przywodztwo"),
          wDomach("jupiter", [...KENDRY, 5, 9]) ? tak(`Jowisz w ${dom("jupiter")}. domu`) : null,
          silna("jupiter") ? tak(`Jowisz — ${chart.planets.jupiter.dignity}`) : null,
        )),
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
          jogakarakaTo("venus"),
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
          talent("slowo", "biznes"),
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
        kosmogram: astro(() => najlepsze(
          jogakarakaTo("mars"),
          wDomach("mars", [...KENDRY, 3, 6, 11]) ? tak(`Mars w ${dom("mars")}. domu`) : null,
          silna("mars") ? tak(`Mars — ${chart.planets.mars.dignity}`) : null,
          talent("sport"),
        )),
        dlon: reka(() => najlepsze(linia("marsa"), wzgorek("mars"), linia("zycia"))),
        numerologia: liczby("mars"),
      },
    },
    {
      id: "praca", nazwa: "Praca, obowiązek, wytrwałość",
      znaczenie: "Rzetelność i wytrwałość — budowanie krok po kroku.",
      wniosek: "Twoją siłą jest wytrwałość. Budujesz krok po kroku — powoli, ale trwale.",
      wskazania: {
        kosmogram: astro(() => najlepsze(
          jogakarakaTo("saturn"),
          wDomach("saturn", [...KENDRY, 6, 11]) ? tak(`Saturn w ${dom("saturn")}. domu`) : null,
          silna("saturn") ? tak(`Saturn — ${chart.planets.saturn.dignity}`) : null,
          talent("technika"),
        )),
        dlon: reka(() => najlepsze(wzgorek("saturn"), znakNa("saturn", ["kwadrat", "trojkat"]))),
        numerologia: liczby("saturn"),
      },
    },
    {
      id: "finanse", nazwa: "Pieniądze, dobrobyt",
      znaczenie: "Zdolność do zarabiania i budowania zasobów — materialne zaplecze życia.",
      wniosek: "Temat pieniędzy i dobrobytu jest u Ciebie wyraźnie zaznaczony. Masz predyspozycje do budowania zasobów — warto z nich świadomie korzystać, zamiast zostawiać je przypadkowi.",
      wskazania: {
        kosmogram: astro(finanse),
        dlon: reka(() => najlepsze(linia("slonca"), linia("merkurego"), znakNa("czworobok", ["trojkat"]), znakNa("mercury", ["trojkat", "gwiazda"]))),
        numerologia: liczby("venus", "saturn"),
      },
    },
    {
      id: "przemiana", nazwa: "Przemiany, kryzysy, odrodzenie",
      znaczenie: "Życie z wyraźnymi zakrętami — przełomy, po których zaczyna się na nowo.",
      wniosek: "Twoje życie ma wyraźne zakręty i przełomy. Kryzysy są u Ciebie początkiem nowego etapu, nie końcem.",
      wskazania: {
        kosmogram: astro(() => w(8).length >= 2 ? tak(`8. dom: ${lista(w(8))}`) : w(8).length === 1 ? czesciowo(`8. dom: ${lista(w(8))}`) : null),
        dlon: reka(() => najlepsze(
          // znakNa z pustą listą rodzajów tylko zaznacza, że znaki tej ręki były sprawdzane
          znakNa("czworobok", []) ?? (znaki.some((z) => z.znak === "wyspa") ? tak("wyspy na liniach") : null),
          znaki.some((z) => z.znak === "kratka") ? czesciowo("kratki na wzgórkach") : null,
        )),
        // 4 = Rahu — w numerologii wedyjskiej liczba nagłych zmian i przewrotów
        numerologia: liczby("rahu"),
      },
    },
  ];

  // Skupisko (3+ planety w jednym domu) wzmacnia też tematy TEGO domu — klasyczne znaczenia domów.
  const DOM_TEMATY: Record<number, string[]> = {
    1: ["energia"], 2: ["finanse"], 3: ["umysl"], 5: ["uznanie"], 6: ["praca"], 7: ["zwiazek"],
    8: ["przemiana"], 9: ["podroze", "duchowosc", "ambicja"], 10: ["praca"], 11: ["finanse"], 12: ["podroze", "duchowosc"],
  };
  if (skupisko && skupisko.ps.length >= 3) {
    for (const t of tematy) {
      if (!(DOM_TEMATY[skupisko.d] ?? []).includes(t.id)) continue;
      const w = t.wskazania.kosmogram;
      const dodatek = tak(opisSkupiska(), skupisko.ps.length);
      t.wskazania.kosmogram = w.stan === "tak" || w.stan === "czesciowo"
        ? { ...w, stan: "tak", moc: (w.moc ?? 0) + (dodatek.moc ?? 0), dowody: [dodatek.opis, ...(w.dowody ?? [w.opis])] }
        : { ...dodatek, dowody: [dodatek.opis] };
    }
  }

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


/* ---------- najważniejszy temat według każdego systemu ---------- */

export interface GlosSystemu {
  system: SystemTematu;
  temat: TematWspolny;
  /** Pozostałe systemy, które ten sam temat też wyraźnie wskazują. */
  takze: SystemTematu[];
}

const SYSTEMY_T: SystemTematu[] = ["kosmogram", "dlon", "numerologia"];

/**
 * Każdy system dostaje swój najmocniejszy temat (wg siły wskazań), ale zawsze TRZY RÓŻNE:
 * spośród trzech najmocniejszych tematów każdego systemu wybieramy układ bez powtórzeń
 * o największej łącznej sile (siła liczona względem najmocniejszego tematu danego systemu,
 * bo skale systemów są różne). Gdy dwa systemy mają ten sam najmocniejszy temat, jeden
 * bierze następny — a przy karcie widać, że tamten system też go wskazuje.
 */
export function najwazniejszeTematy(tematy: TematWspolny[]): GlosSystemu[] {
  const moc = (t: TematWspolny, s: SystemTematu) => {
    const w = t.wskazania[s];
    return w.stan === "tak" || w.stan === "czesciowo" ? w.moc ?? (w.stan === "tak" ? 2 : 1) : 0;
  };
  const kandydaci = SYSTEMY_T.map((s) => {
    const lista = tematy.filter((t) => moc(t, s) > 0).sort((a, b) => moc(b, s) - moc(a, s)).slice(0, 4);
    const max = lista[0] ? moc(lista[0], s) : 1;
    return lista.map((t) => ({ t, w: moc(t, s) / max }));
  });
  let najl: { wynik: number; wybor: (TematWspolny | null)[] } = { wynik: -1, wybor: [null, null, null] };
  const opcje = (i: number) => [...kandydaci[i], { t: null as TematWspolny | null, w: 0 }];
  for (const a of opcje(0)) for (const b of opcje(1)) for (const c of opcje(2)) {
    const ids = [a.t?.id, b.t?.id, c.t?.id].filter(Boolean);
    if (new Set(ids).size !== ids.length) continue;
    const wynik = a.w + b.w + c.w;
    if (wynik > najl.wynik) najl = { wynik, wybor: [a.t, b.t, c.t] };
  }
  return SYSTEMY_T.flatMap((s, i) => {
    const t = najl.wybor[i];
    if (!t) return [];
    const takze = SYSTEMY_T.filter((x) => x !== s && t.wskazania[x].stan === "tak");
    return [{ system: s, temat: t, takze }];
  });
}
