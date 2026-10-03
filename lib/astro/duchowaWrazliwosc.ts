import { GRAHAS, PLANET_ORDER, type PlanetId } from "./constants";
import type { VedicChart } from "./chart";
import { aspektuje } from "./sila";
import { domZnaku } from "./yogas";
import { poziomWzmocnienia } from "./domInterpretacja";
import { diffAngle } from "./math";
import { grahaNazwa, type AstroLocale } from "./i18nAstro";

/**
 * WRAŻLIWOŚĆ DUCHOWA — świadomie NIE "zdolności paranormalne/radiestezyjne"
 * (o to prosił użytkownik, ale w BPHS nie ma reguł na tak specyficzne,
 * współczesne kategorie — nie zgadujemy). Zamiast tego uczciwszy,
 * klasycznie umocowany temat: naturalne wyczulenie na to, co niematerialne
 * (intuicja, atmosfera, podświadomość). Cztery klasyczne źródła:
 *  - kondycja Ketu — klasyczny karaka intuicji, mistyki, siddhi i moksy,
 *  - planety w 8. domu (tajemnica, to, co skryte), 9. domu (dharma, guru,
 *    wiara — klasyczny "dom religii") i 12. domu (duchowość, podświadomość,
 *    moksza) — trzy klasyczne domy tego tematu,
 *  - koniunkcja Księżyc-Ketu — emocjonalna wrażliwość spleciona z Ketu,
 *  - aspekty na Ketu (Jowisz/Saturn/Mars) — co dokładnie kolorują mistykę.
 *
 * KAŻDY z tych czterech punktów liczy teraz KONFIGURACJĘ (stan/godność
 * zaangażowanych planet, realny stopień koniunkcji), nie tylko SUROWĄ
 * OBECNOŚĆ — to samo rozróżnienie "ile vs jak łatwo", co w Predyspozycjach/
 * Finansach. Wcześniej domy 8/9/12 tylko LICZYŁY planety bez
 * względu na ich stan (trzy słabe planety = trzy silne), a koniunkcja
 * Księżyc-Ketu sprawdzała jedynie "ten sam znak" (do 29° rozstępu, i mogła
 * PRZEOCZYĆ ciasną koniunkcję na granicy znaków — np. Księżyc 29,9° Barana,
 * Ketu 0,1° Byka to praktycznie złączenie, ale różne znaki).
 *
 * Świadomie NIE twierdzimy, że to zweryfikowana "moc" — to skłonność/temat
 * w mapie, jak wszystko inne w tym serwisie.
 */

export type PoziomWrazliwosci = "wyraźna" | "umiarkowana" | "subtelna";

/**
 * Który odcień tematu dominuje w TEJ mapie — nie osobno zmierzona, zweryfikowana
 * zdolność (patrz nagłówek pliku), tylko wskazanie, który z czterech klasycznych
 * składników (Ketu / dom 8 / dom 9 / dom 12) waży tu najwięcej. Użytkownik pytał
 * o rozróżnienie intuicji, podświadomości, radiestezji itp. — cztery osobne
 * paski dawałyby złudzenie czterech niezależnie potwierdzonych zdolności, choć
 * w praktyce są silnie skorelowane (te same domy/Ketu). To bezpieczniejszy
 * kompromis: jeden wynik, ale opis mówiący, w którą stronę się przechyla.
 */
export type OdcienDuchowy = "intuicja" | "tajemnica" | "wiara" | "podswiadomosc";

export const OPIS_ODCIENIA: Record<OdcienDuchowy, string> = {
  intuicja: "bliżej intuicji i wyczuwania nastrojów innych ludzi",
  tajemnica: "bliżej tajemnicy, transformacji i tego, co ukryte",
  wiara: "bliżej wiary, dharmy i relacji z nauczycielami duchowymi",
  podswiadomosc: "bliżej duchowości i pracy z własną podświadomością",
};

const OPIS_ODCIENIA_EN: Record<OdcienDuchowy, string> = {
  intuicja: "closer to intuition and sensing other people's moods",
  tajemnica: "closer to mystery, transformation and what's hidden",
  wiara: "closer to faith, dharma and relationships with spiritual teachers",
  podswiadomosc: "closer to spirituality and working with one's own subconscious",
};

/** Wersja OPIS_ODCIENIA zalezna od jezyka. */
export function opisOdcieniaNazwa(odcien: OdcienDuchowy, locale: AstroLocale): string {
  return locale === "en" ? OPIS_ODCIENIA_EN[odcien] : OPIS_ODCIENIA[odcien];
}

const POZIOM_NAZWA_EN: Record<PoziomWrazliwosci, string> = {
  "wyraźna": "distinct", "umiarkowana": "moderate", "subtelna": "subtle",
};

/** Etykieta poziomu wrazliwosci — WARTOSC zostaje po polsku (kluczowana logika
 *  gdzie indziej), ta funkcja tlumaczy TYLKO wyswietlana etykiete. */
export function poziomWrazliwosciNazwa(poziom: PoziomWrazliwosci, locale: AstroLocale): string {
  return locale === "en" ? POZIOM_NAZWA_EN[poziom] : poziom;
}

export interface WrazliwoscDuchowa {
  punkty: number;
  poziom: PoziomWrazliwosci;
  czynniki: string[];
  odcien: OdcienDuchowy | null;
}

/** Waga obecności planety w domu 8/9/12 wg JEJ WŁASNEJ godności — nie flat +1 za samą obecność. */
function wagaObecnosci(chart: VedicChart, id: PlanetId, locale: AstroLocale): { waga: number; etykieta: string } {
  const poziom = poziomWzmocnienia(chart.planets[id].dignity);
  const nazwa = grahaNazwa(GRAHAS[id], locale);
  if (poziom === "dobre") return { waga: 1.5, etykieta: locale === "en" ? `${nazwa} (strong)` : `${nazwa} (mocna)` };
  if (poziom === "zle") return { waga: 0.6, etykieta: locale === "en" ? `${nazwa} (weak — theme present but harder to access)` : `${nazwa} (słaba — temat obecny, ale trudniej dostępny)` };
  return { waga: 1, etykieta: nazwa };
}

export function wrazliwoscDuchowa(chart: VedicChart, locale: AstroLocale = "pl"): WrazliwoscDuchowa {
  const czynniki: string[] = [];
  const dodaj = (pl: string, en: string) => czynniki.push(locale === "en" ? en : pl);
  let punkty = 0;
  const grupy: Record<OdcienDuchowy, number> = { intuicja: 0, tajemnica: 0, wiara: 0, podswiadomosc: 0 };

  const ketuPoziom = poziomWzmocnienia(chart.planets.ketu.dignity);
  if (ketuPoziom === "dobre") {
    punkty += 2; grupy.intuicja += 2;
    dodaj("Ketu — karaka intuicji i tematów niematerialnych — silnie ustawiony w Twojej mapie", "Ketu — karaka of intuition and immaterial themes — strongly placed in your chart");
  } else if (ketuPoziom === "neutralne") {
    punkty += 1; grupy.intuicja += 1;
    dodaj("Ketu w neutralnej kondycji", "Ketu in neutral condition");
  } else {
    punkty += 0.5; grupy.intuicja += 0.5;
    dodaj("Ketu w słabej kondycji — temat wciąż obecny, ale dostęp do niego bywa bardziej burzliwy", "Ketu in weak condition — the theme is still present, but access to it tends to be more turbulent");
  }

  if (chart.angles) {
    const lagnaSign = chart.angles.lagnaSign;

    const dom8 = PLANET_ORDER.filter((id) => domZnaku(lagnaSign, chart.planets[id].sign) === 8);
    if (dom8.length > 0) {
      const wazone = dom8.map((id) => wagaObecnosci(chart, id, locale));
      const suma = wazone.reduce((s, w) => s + w.waga, 0);
      punkty += suma; grupy.tajemnica += suma;
      const lista = wazone.map((w) => w.etykieta).join(locale === "en" ? " and " : " i ");
      dodaj(`${lista} w 8. domu — dom tajemnicy i transformacji`, `${lista} in the 8th house — the house of mystery and transformation`);
    }
    const dom9 = PLANET_ORDER.filter((id) => domZnaku(lagnaSign, chart.planets[id].sign) === 9);
    if (dom9.length > 0) {
      const wazone = dom9.map((id) => wagaObecnosci(chart, id, locale));
      const suma = wazone.reduce((s, w) => s + w.waga, 0);
      punkty += suma; grupy.wiara += suma;
      const lista = wazone.map((w) => w.etykieta).join(locale === "en" ? " and " : " i ");
      dodaj(`${lista} w 9. domu — dom dharmy, guru i wiary`, `${lista} in the 9th house — the house of dharma, guru and faith`);
    }
    const dom12 = PLANET_ORDER.filter((id) => domZnaku(lagnaSign, chart.planets[id].sign) === 12);
    if (dom12.length > 0) {
      const wazone = dom12.map((id) => wagaObecnosci(chart, id, locale));
      const suma = wazone.reduce((s, w) => s + w.waga, 0);
      punkty += suma; grupy.podswiadomosc += suma;
      const lista = wazone.map((w) => w.etykieta).join(locale === "en" ? " and " : " i ");
      dodaj(`${lista} w 12. domu — dom duchowości i podświadomości`, `${lista} in the 12th house — the house of spirituality and the subconscious`);
    }
  }

  // koniunkcja Ksiezyc-Ketu liczona kątowo (nie "ten sam znak") — łapie tez ciasne
  // złączenia na granicy dwóch znaków, których stary test "ten sam znak" by przeoczył
  const rozstep = Math.abs(diffAngle(chart.planets.moon.longitude, chart.planets.ketu.longitude));
  if (rozstep <= 10) {
    punkty += 2.5; grupy.intuicja += 2.5;
    dodaj(
      `Księżyc w ścisłej koniunkcji z Ketu (${rozstep.toFixed(1)}°) — wyraźnie wyostrzona intuicja, silna wrażliwość na to, co niematerialne`,
      `Moon in a tight conjunction with Ketu (${rozstep.toFixed(1)}°) — clearly sharpened intuition, strong sensitivity to the immaterial`,
    );
  } else if (rozstep <= 30) {
    punkty += 1.2; grupy.intuicja += 1.2;
    dodaj(
      `Księżyc i Ketu w tym samym znaku, szerszy rozstęp (${rozstep.toFixed(1)}°) — wrażliwość obecna, ale mniej ścisła`,
      `Moon and Ketu in the same sign, a wider orb (${rozstep.toFixed(1)}°) — the sensitivity is present, but less tight`,
    );
  }

  // aspekty NA Ketu — nie tylko Jowisz: kazda z trzech planet o klasycznym pelnym
  // aspekcie koloruje mistyke inaczej (dobroczynca kontra dwaj naturalni malefiki)
  if (aspektuje(chart, "jupiter", chart.planets.ketu.sign)) {
    punkty += 1.2; grupy.intuicja += 1.2;
    dodaj("Jowisz aspektuje Ketu — mądrość splata się tu z tematami mistycznymi, dostęp raczej łagodny", "Jupiter aspects Ketu — wisdom intertwines here with mystical themes, access tends to be gentle");
  }
  if (aspektuje(chart, "saturn", chart.planets.ketu.sign)) {
    punkty += 0.8; grupy.intuicja += 0.8;
    dodaj("Saturn aspektuje Ketu — pogłębia temat, ale dostęp bywa cięższy, wymaga czasu i dyscypliny", "Saturn aspects Ketu — deepens the theme, but access tends to be heavier, requiring time and discipline");
  }
  if (aspektuje(chart, "mars", chart.planets.ketu.sign)) {
    punkty += 0.8; grupy.intuicja += 0.8;
    dodaj("Mars aspektuje Ketu — intensyfikuje temat, dostęp bywa nagły, niespokojny lub impulsywny", "Mars aspects Ketu — intensifies the theme, access tends to be sudden, restless or impulsive");
  }

  const poziom: PoziomWrazliwosci = punkty >= 5 ? "wyraźna" : punkty >= 2 ? "umiarkowana" : "subtelna";
  const [topGrupa, topWynik] = (Object.entries(grupy) as [OdcienDuchowy, number][])
    .sort((a, b) => b[1] - a[1])[0];
  const odcien = topWynik > 0 ? topGrupa : null;
  return { punkty: Math.round(punkty * 100) / 100, poziom, czynniki, odcien };
}
