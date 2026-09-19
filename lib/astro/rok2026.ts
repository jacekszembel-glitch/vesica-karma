import { gochara, sadeSati, type TransitInfo, type SadeSati } from "./transits";
import { allPlanets, planetPosition } from "./ephemeris";
import { activeChain, vimshottari, type DashaPeriod } from "./dasha";
import { reduce } from "./numerology";
import { RASIS, GRAHAS, type PlanetId } from "./constants";

/**
 * HOROSKOP 2026 — wyliczenia bramki kampanijnej.
 *
 * ZASADA (z BRAMKI-TEMATYCZNE.md): żadnego „horoskopu dla Twojego znaku"
 * w prasowym ujęciu. U nas zodiak jest syderyczny, więc znak wyszedłby inny
 * niż w gazecie i wyglądałoby to na błąd. Wszystko liczymy z DATY URODZENIA:
 * rok osobisty, okresy planetarne przecinające 2026, tranzyty wolnych planet
 * od Księżyca urodzeniowego i Sade Sati.
 *
 * Motyw roku: 2+0+2+6 = 10 → 1. Wibracja jedynki otwiera dziewięcioletni cykl.
 */

export const WIBRACJA_ROKU = reduce(2 + 0 + 2 + 6, false); // = 1

/** Rok osobisty w 2026 i jego opis. */
export const ROK_OSOBISTY_2026: Record<number, { haslo: string; opis: string; rada: string }> = {
  1: { haslo: "nowy początek", opis: "Twój rok osobisty pokrywa się z wibracją roku — podwójna jedynka. Wszystko, co zaczniesz w 2026, ma wyjątkową siłę rozpędu i długie konsekwencje.", rada: "Zacznij tę jedną rzecz, którą odkładasz od lat. To jest ten rok." },
  2: { haslo: "cierpliwość i sojusze", opis: "Po roku startów przychodzi rok dojrzewania. Sprawy rozwijają się przez relacje i współpracę, nie przez forsowanie.", rada: "Inwestuj w ludzi. Partnerstwa zawarte teraz będą procentować latami." },
  3: { haslo: "ekspresja i widoczność", opis: "Rok twórczy i towarzyski — to, co pokażesz światu, znajdzie odbiorców. Słowa mają w tym roku dodatkową nośność.", rada: "Publikuj, występuj, pokazuj. Nie czekaj na „gotowość” — ona przychodzi w trakcie." },
  4: { haslo: "fundamenty i praca", opis: "Rok budowania podstaw: dom, finanse, zdrowie, struktury. Mniej fajerwerków, więcej trwałych efektów.", rada: "Uporządkuj jedną dużą sferę — dokumenty, budżet albo ciało. Wróci z nawiązką." },
  5: { haslo: "zmiana i ruch", opis: "Rok podróży, przeprowadzek i zwrotów akcji. Sztywne plany będą się sypać — elastyczne będą kwitły.", rada: "Nie trzymaj się kurczowo. Najlepsze drzwi tego roku jeszcze nie są widoczne." },
  6: { haslo: "dom i odpowiedzialność", opis: "Rok rodziny, związków i troski. Sprawy domowe wychodzą na pierwszy plan — czasem jako radość, czasem jako obowiązek.", rada: "Zadbaj o bliskich, ale wyznacz granice. Opieka bez granic kończy się wyczerpaniem." },
  7: { haslo: "głębia i nauka", opis: "Rok wewnętrzny: analiza, nauka, duchowość. Świat zewnętrzny może zwolnić — to nie kara, tylko zaproszenie do środka.", rada: "Zaplanuj naukę albo praktykę, która wymaga ciszy. Wielkie decyzje odłóż na przyszły rok." },
  8: { haslo: "żniwa i siła", opis: "Rok materialnych efektów: finanse, awanse, uznanie — albo rachunki za zaniedbania. Ósemka oddaje to, co włożone.", rada: "Graj o duże stawki, ale uczciwie. W tym roku wszystko jest widoczne." },
  9: { haslo: "domknięcie cyklu", opis: "Ostatni rok dziewięcioletniego cyklu — czas kończenia, oddawania i robienia miejsca. Nowe zacznie się w 2027.", rada: "Zamknij z klasą, co się wypaliło. Nie zaczynaj wielkich rzeczy na siłę — jeszcze chwila." },
};

export function rokOsobisty2026(isoDate: string): number {
  const [, m, d] = isoDate.split("-").map(Number);
  return reduce(reduce(d, false) + reduce(m, false) + reduce(2026, false), false);
}

export interface TranzytRoku {
  id: PlanetId;
  /** Kolejne odcinki: znak + dom od Księżyca + przybliżone miesiące. */
  odcinki: { znak: number; dom: number; favorable: boolean; odMies: number; doMies: number }[];
}

/**
 * Tranzyty wolnych planet w 2026 od Księżyca urodzeniowego.
 * Próbkujemy początek każdego miesiąca — Jowisz, Saturn i węzły nie zmieniają
 * znaku częściej, więc to wystarcza do map miesięcznych.
 */
export function tranzyty2026(moonLon: number): TranzytRoku[] {
  const planety: PlanetId[] = ["jupiter", "saturn", "rahu", "ketu"];
  const natalSign = Math.floor(((moonLon % 360) + 360) % 360 / 30);
  const wyniki: TranzytRoku[] = planety.map((id) => ({ id, odcinki: [] }));

  for (let mies = 1; mies <= 12; mies++) {
    const d = new Date(Date.UTC(2026, mies - 1, 1, 12));
    const p = allPlanets(d);
    for (const w of wyniki) {
      const znak = Math.floor(p[w.id].longitude / 30);
      const dom = ((znak - natalSign + 12) % 12) + 1;
      const ost = w.odcinki[w.odcinki.length - 1];
      if (ost && ost.znak === znak) {
        ost.doMies = mies;
      } else {
        w.odcinki.push({ znak, dom, favorable: false, odMies: mies, doMies: mies });
      }
    }
  }

  // ocena sprzyjania z gochary (te same reguły co w panelu)
  for (const w of wyniki) {
    for (const o of w.odcinki) {
      const g = gochara(moonLon, new Date(Date.UTC(2026, o.odMies - 1, 2)));
      o.favorable = g.find((t) => t.id === w.id)?.favorable ?? false;
    }
  }
  return wyniki;
}

const DAY_MS = 86400000;

export interface OkresRetrogradacji {
  id: PlanetId;
  /** Początek widoczny w 2026 — może być 1 stycznia, jeśli retrogradacja zaczęła się wcześniej. */
  od: Date;
  /** Koniec widoczny w 2026 — może być 31 grudnia, jeśli retrogradacja kończy się później. */
  do: Date;
  /** Retrogradacja zaczęła się PRZED 2026 — widzimy tylko końcówkę. */
  zaczetaWczesniej: boolean;
  /** Retrogradacja kończy się PO 2026 — widzimy tylko początek. */
  koncowkaPozniej: boolean;
}

function dodajJesliW2026(wyniki: OkresRetrogradacji[], id: PlanetId, od: Date, koniec: Date) {
  const rokPoczatek = Date.UTC(2026, 0, 1);
  const rokKoniec = Date.UTC(2027, 0, 1);
  if (koniec.getTime() <= rokPoczatek || od.getTime() >= rokKoniec) return; // poza 2026 całkowicie
  wyniki.push({
    id,
    od: od.getTime() < rokPoczatek ? new Date(rokPoczatek) : od,
    do: koniec.getTime() > rokKoniec ? new Date(rokKoniec) : koniec,
    zaczetaWczesniej: od.getTime() < rokPoczatek,
    koncowkaPozniej: koniec.getTime() > rokKoniec,
  });
}

/**
 * Okresy retrogradacji Merkurego, Wenus, Marsa, Jowisza i Saturna w 2026 —
 * jedyny NIEspersonalizowany, ogólny fakt kalendarzowy w tym pliku (nie
 * zależy od danych urodzeniowych, tylko od samego roku). Słońce/Księżyc
 * nigdy nie retrogradują (pominięte); Rahu/Ketu są z definicji ZAWSZE
 * retrogradne — pojęcie "okresu retrogradacji" ich nie dotyczy.
 *
 * Metoda: codzienny skan prędkości (planetPosition().speed z ephemeris.ts,
 * już liczonej różnicą centralną) od 2025-12-01 do 2027-02-01 — zapas,
 * żeby złapać okresy przecinające granicę roku — przycięty do części
 * widocznej w 2026. Dokładność co do dnia w zupełności wystarcza dla
 * kalendarza (nie potrzeba precyzji co do godziny).
 */
export function retrogradacje2026(): OkresRetrogradacji[] {
  const planety: PlanetId[] = ["mercury", "venus", "mars", "jupiter", "saturn"];
  const skanOd = new Date(Date.UTC(2025, 11, 1));
  const skanDo = new Date(Date.UTC(2027, 1, 1));
  const dni = Math.round((skanDo.getTime() - skanOd.getTime()) / DAY_MS);

  const wyniki: OkresRetrogradacji[] = [];
  for (const id of planety) {
    let retroOd: Date | null = null;
    for (let d = 0; d <= dni; d++) {
      const data = new Date(skanOd.getTime() + d * DAY_MS);
      const retro = planetPosition(id, data).speed < 0;
      if (retro && !retroOd) {
        retroOd = data;
      } else if (!retro && retroOd) {
        dodajJesliW2026(wyniki, id, retroOd, data);
        retroOd = null;
      }
    }
    if (retroOd) dodajJesliW2026(wyniki, id, retroOd, skanDo);
  }
  return wyniki.sort((a, b) => a.od.getTime() - b.od.getTime());
}

export interface OkresyW2026 {
  /** Łańcuch aktywny 1 stycznia. */
  start: DashaPeriod[];
  /** Zmiany podokresu w trakcie roku. */
  zmiany: { data: Date; lord: PlanetId; level: number }[];
}

/** Okresy planetarne przecinające 2026. */
export function okresy2026(moonLon: number, birthUtc: Date): OkresyW2026 {
  const dashas = vimshottari(moonLon, birthUtc, 2);
  const start = activeChain(dashas, new Date(Date.UTC(2026, 0, 1)));
  const zmiany: OkresyW2026["zmiany"] = [];
  for (const md of dashas) {
    for (const ad of md.sub ?? []) {
      const t = ad.start.getTime();
      if (t > Date.UTC(2026, 0, 1) && t < Date.UTC(2027, 0, 1)) {
        zmiany.push({ data: ad.start, lord: ad.lord, level: 2 });
      }
    }
    if (md.start.getTime() > Date.UTC(2026, 0, 1) && md.start.getTime() < Date.UTC(2027, 0, 1)) {
      zmiany.push({ data: md.start, lord: md.lord, level: 1 });
    }
  }
  zmiany.sort((a, b) => a.data.getTime() - b.data.getTime());
  return { start, zmiany };
}

/** Pakiet dla interpretacji. */
export function horoskop2026DlaAI(
  isoDate: string, moonLon: number, birthUtc: Date,
) {
  const ro = rokOsobisty2026(isoDate);
  const okresy = okresy2026(moonLon, birthUtc);
  const tranzyty = tranzyty2026(moonLon);
  const ss = sadeSati(moonLon, new Date(Date.UTC(2026, 5, 15)));
  const mies = (n: number) => ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"][n - 1];

  return {
    pytanie: "Jaki będzie mój rok 2026 i jak go najlepiej wykorzystać?",
    wibracjaRoku: `${WIBRACJA_ROKU} — początek nowego dziewięcioletniego cyklu`,
    rokOsobisty: { liczba: ro, ...ROK_OSOBISTY_2026[ro] },
    okresPlanetarny: {
      naPoczatkuRoku: okresy.start.map((d) => ({
        poziom: d.level === 1 ? "wielki okres" : "podokres",
        wladca: GRAHAS[d.lord].pl,
        do: d.end.toISOString().slice(0, 10),
      })),
      zmianyWTrakcie: okresy.zmiany.map((z) => ({
        od: z.data.toISOString().slice(0, 10),
        nowy: `${z.level === 1 ? "WIELKI OKRES" : "podokres"}: ${GRAHAS[z.lord].pl}`,
      })),
    },
    tranzyty2026: tranzyty.map((t) => ({
      planeta: GRAHAS[t.id].pl,
      odcinki: t.odcinki.map((o) => ({
        znak: RASIS[o.znak].pl,
        domOdKsiezyca: o.dom,
        miesiace: `${mies(o.odMies)}–${mies(o.doMies)}`,
        ocena: o.favorable ? "sprzyjający" : "wymagający",
      })),
    })),
    sadeSati: ss.phase === "brak" ? "nie trwa w 2026" : {
      faza: ss.phase,
      opis: ss.opis,
      koniecFazy: ss.phaseEnd?.toISOString().slice(0, 10) ?? null,
    },
  };
}

export type { TransitInfo, SadeSati };
