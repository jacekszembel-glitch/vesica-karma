import { GRAHAS, PLANET_ORDER, type PlanetId } from "./constants";
import type { VedicChart } from "./chart";
import { aspektuje } from "./sila";
import { domZnaku } from "./yogas";
import { poziomWzmocnienia } from "./domInterpretacja";
import { diffAngle } from "./math";

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

export interface WrazliwoscDuchowa {
  punkty: number;
  poziom: PoziomWrazliwosci;
  czynniki: string[];
  odcien: OdcienDuchowy | null;
}

/** Waga obecności planety w domu 8/9/12 wg JEJ WŁASNEJ godności — nie flat +1 za samą obecność. */
function wagaObecnosci(chart: VedicChart, id: PlanetId): { waga: number; etykieta: string } {
  const poziom = poziomWzmocnienia(chart.planets[id].dignity);
  if (poziom === "dobre") return { waga: 1.5, etykieta: `${GRAHAS[id].pl} (mocna)` };
  if (poziom === "zle") return { waga: 0.6, etykieta: `${GRAHAS[id].pl} (słaba — temat obecny, ale trudniej dostępny)` };
  return { waga: 1, etykieta: GRAHAS[id].pl };
}

export function wrazliwoscDuchowa(chart: VedicChart): WrazliwoscDuchowa {
  const czynniki: string[] = [];
  let punkty = 0;
  const grupy: Record<OdcienDuchowy, number> = { intuicja: 0, tajemnica: 0, wiara: 0, podswiadomosc: 0 };

  const ketuPoziom = poziomWzmocnienia(chart.planets.ketu.dignity);
  if (ketuPoziom === "dobre") {
    punkty += 2; grupy.intuicja += 2;
    czynniki.push("Ketu — karaka intuicji i tematów niematerialnych — silnie ustawiony w Twojej mapie");
  } else if (ketuPoziom === "neutralne") {
    punkty += 1; grupy.intuicja += 1;
    czynniki.push("Ketu w neutralnej kondycji");
  } else {
    punkty += 0.5; grupy.intuicja += 0.5;
    czynniki.push("Ketu w słabej kondycji — temat wciąż obecny, ale dostęp do niego bywa bardziej burzliwy");
  }

  if (chart.angles) {
    const lagnaSign = chart.angles.lagnaSign;

    const dom8 = PLANET_ORDER.filter((id) => domZnaku(lagnaSign, chart.planets[id].sign) === 8);
    if (dom8.length > 0) {
      const wazone = dom8.map((id) => wagaObecnosci(chart, id));
      const suma = wazone.reduce((s, w) => s + w.waga, 0);
      punkty += suma; grupy.tajemnica += suma;
      czynniki.push(`${wazone.map((w) => w.etykieta).join(" i ")} w 8. domu — dom tajemnicy i transformacji`);
    }
    const dom9 = PLANET_ORDER.filter((id) => domZnaku(lagnaSign, chart.planets[id].sign) === 9);
    if (dom9.length > 0) {
      const wazone = dom9.map((id) => wagaObecnosci(chart, id));
      const suma = wazone.reduce((s, w) => s + w.waga, 0);
      punkty += suma; grupy.wiara += suma;
      czynniki.push(`${wazone.map((w) => w.etykieta).join(" i ")} w 9. domu — dom dharmy, guru i wiary`);
    }
    const dom12 = PLANET_ORDER.filter((id) => domZnaku(lagnaSign, chart.planets[id].sign) === 12);
    if (dom12.length > 0) {
      const wazone = dom12.map((id) => wagaObecnosci(chart, id));
      const suma = wazone.reduce((s, w) => s + w.waga, 0);
      punkty += suma; grupy.podswiadomosc += suma;
      czynniki.push(`${wazone.map((w) => w.etykieta).join(" i ")} w 12. domu — dom duchowości i podświadomości`);
    }
  }

  // koniunkcja Ksiezyc-Ketu liczona kątowo (nie "ten sam znak") — łapie tez ciasne
  // złączenia na granicy dwóch znaków, których stary test "ten sam znak" by przeoczył
  const rozstep = Math.abs(diffAngle(chart.planets.moon.longitude, chart.planets.ketu.longitude));
  if (rozstep <= 10) {
    punkty += 2.5; grupy.intuicja += 2.5;
    czynniki.push(`Księżyc w ścisłej koniunkcji z Ketu (${rozstep.toFixed(1)}°) — wyraźnie wyostrzona intuicja, silna wrażliwość na to, co niematerialne`);
  } else if (rozstep <= 30) {
    punkty += 1.2; grupy.intuicja += 1.2;
    czynniki.push(`Księżyc i Ketu w tym samym znaku, szerszy rozstęp (${rozstep.toFixed(1)}°) — wrażliwość obecna, ale mniej ścisła`);
  }

  // aspekty NA Ketu — nie tylko Jowisz: kazda z trzech planet o klasycznym pelnym
  // aspekcie koloruje mistyke inaczej (dobroczynca kontra dwaj naturalni malefiki)
  if (aspektuje(chart, "jupiter", chart.planets.ketu.sign)) {
    punkty += 1.2; grupy.intuicja += 1.2;
    czynniki.push("Jowisz aspektuje Ketu — mądrość splata się tu z tematami mistycznymi, dostęp raczej łagodny");
  }
  if (aspektuje(chart, "saturn", chart.planets.ketu.sign)) {
    punkty += 0.8; grupy.intuicja += 0.8;
    czynniki.push("Saturn aspektuje Ketu — pogłębia temat, ale dostęp bywa cięższy, wymaga czasu i dyscypliny");
  }
  if (aspektuje(chart, "mars", chart.planets.ketu.sign)) {
    punkty += 0.8; grupy.intuicja += 0.8;
    czynniki.push("Mars aspektuje Ketu — intensyfikuje temat, dostęp bywa nagły, niespokojny lub impulsywny");
  }

  const poziom: PoziomWrazliwosci = punkty >= 5 ? "wyraźna" : punkty >= 2 ? "umiarkowana" : "subtelna";
  const [topGrupa, topWynik] = (Object.entries(grupy) as [OdcienDuchowy, number][])
    .sort((a, b) => b[1] - a[1])[0];
  const odcien = topWynik > 0 ? topGrupa : null;
  return { punkty: Math.round(punkty * 100) / 100, poziom, czynniki, odcien };
}
