import { RASIS, type PlanetId } from "./constants";
import type { VedicChart } from "./chart";
import { signRelacja } from "./chart";
import { gunaMilan, type GunaMilanResult } from "./gunamilan";

/**
 * RELACJE RODZINNE — świadomie DWA różne sposoby wyliczeń, nie jeden dla wszystkich par.
 *
 * Guna Milan (Ashtakoota) jest klasycznie systemem zgodności MAŁŻEŃSKIEJ —
 * kuty jak Bhakoot (wspólne życie/finanse) czy Nadi (potomstwo/zdrowie
 * wspólnego życia) są sensowne tylko między partnerami. Stosowanie go do pary
 * rodzic-dziecko czy rodzeństwo dawałoby liczby, które udają precyzję, jakiej
 * nie mają w tym kontekście.
 *
 * Dla par NIE-partnerskich liczymy więc coś świadomie prostszego i uczciwie
 * nazwanego: przyjaźń władców znaków Księżyca (ta sama tabela naturalnej
 * przyjaźni planet co reszta wyliczeń — signRelacja w chart.ts) + zgodność
 * gany nakszatry Księżyca. Skala 0–10, nie 0–36 — żeby nikt nie mylił tego
 * z Ashtakoota.
 */

export type Relacja = "ja" | "partner" | "dziecko" | "rodzic" | "rodzenstwo" | "inny";

export const ETYKIETA_RELACJI: Record<Relacja, string> = {
  ja: "Ja", partner: "Partner/ka", dziecko: "Dziecko", rodzic: "Rodzic",
  rodzenstwo: "Rodzeństwo", inny: "Inna bliska osoba",
};

/** Czy tę parę liczyć pełnym Guna Milan (obie strony partnerskie, albo "ja"+"partner"). */
export function czyParaPartnerska(relA: Relacja, relB: Relacja): boolean {
  const partnerska = (a: Relacja, b: Relacja) => a === "partner" && (b === "partner" || b === "ja");
  return partnerska(relA, relB) || partnerska(relB, relA);
}

export interface WynikPokrewienstwa {
  typ: "partnerska" | "ogolna";
  gunaMilan?: GunaMilanResult;
  /** Tylko dla typu "ogolna": 0–10, wyżej = łatwiejsze porozumienie. */
  punkty?: number;
  /** Krótkie podsumowanie w jednym zdaniu — jak `verdict` w Guna Milan, ale dla obu typów. */
  werdykt: string;
  /** Jawne uzasadnienie po polsku, KAŻDY punkt z praktycznym "co to znaczy" — jak wszędzie w tych wyliczeniach. */
  opis: string[];
}

const GANA_PL: Record<string, string> = { deva: "boska (deva)", manuszja: "ludzka (manuszja)", rakszasa: "demoniczna (rakszasa)" };

/** Znormalizowana siła relacji 0..1 — do sortowania i do diagramu (kolor/grubość krawędzi). */
export function sila01(w: WynikPokrewienstwa): number {
  return w.typ === "partnerska" ? w.gunaMilan!.total / 36 : w.punkty! / 10;
}

function werdyktOgolny(punkty: number): string {
  if (punkty >= 8) return "wyjątkowo naturalne porozumienie";
  if (punkty >= 6.5) return "dobra baza wzajemnego zrozumienia";
  if (punkty >= 4.5) return "przeciętna zgodność — bywa różnie, bywa dobrze";
  if (punkty >= 2.5) return "widoczne tarcie, warto świadomie pracować nad akceptacją różnic";
  return "trudna kombinacja temperamentów — dużo pracy nad wzajemnym zrozumieniem";
}

/** Lekki, uczciwie nazwany wskaźnik dla par NIE-partnerskich. */
function pokrewienstwoOgolne(a: VedicChart, b: VedicChart): WynikPokrewienstwa {
  const opis: string[] = [];
  let punkty = 5; // środek skali — neutralny start

  const signA = a.moonSign, signB = b.moonSign;
  const lordA: PlanetId = RASIS[signA].lord;
  const lordB: PlanetId = RASIS[signB].lord;

  if (lordA === lordB) {
    punkty += 3;
    opis.push(`Księżyce obojga rządzone przez tę samą planetę (${lordA}) — myślicie i reagujecie w podobny sposób, `
      + `łatwiej Wam się wzajemnie odgadnąć bez tłumaczenia.`);
  } else {
    const relAB = signRelacja(lordA, signB); // A wobec władcy znaku B
    const relBA = signRelacja(lordB, signA); // B wobec władcy znaku A
    const przyjazneA = relAB === "przyjazny", przyjazneB = relBA === "przyjazny";
    const wrogieA = relAB === "wrogi", wrogieB = relBA === "wrogi";
    if (przyjazneA && przyjazneB) {
      punkty += 2;
      opis.push("Władcy znaków Księżyca są sobie wzajemnie przyjaźni — naturalna życzliwość, wsparcie przychodzi "
        + "bez wysiłku, nawet gdy się w czymś różnicie.");
    } else if (przyjazneA || przyjazneB) {
      punkty += 1;
      opis.push("Częściowa przyjaźń władców znaków Księżyca — życzliwość płynie mocniej w jedną stronę niż w drugą, "
        + "warto o tym pamiętać, żeby wsparcie nie było jednostronne.");
    } else if (wrogieA && wrogieB) {
      punkty -= 2;
      opis.push("Władcy znaków Księżyca są sobie wzajemnie wrodzy — więcej naturalnego tarcia niż zwykle w codziennych "
        + "reakcjach; to nie wyrok, ale warto nie brać nieporozumień personalnie.");
    } else if (wrogieA || wrogieB) {
      punkty -= 1;
      opis.push("Częściowa wrogość władców znaków Księżyca — tarcie jednostronne, jedna strona może czuć się "
        + "mniej rozumiana niż druga.");
    } else {
      opis.push("Władcy znaków Księżyca są sobie neutralni — ani szczególne wsparcie, ani tarcie z tego konkretnego "
        + "źródła; charakter relacji będzie kształtować głównie to, co budujecie na co dzień, nie astrologia.");
    }
  }

  const ganaA = a.moonNakshatra.nakshatra.gana;
  const ganaB = b.moonNakshatra.nakshatra.gana;
  if (ganaA === ganaB) {
    punkty += 2;
    opis.push(`Ta sama gana nakszatry Księżyca (${GANA_PL[ganaA]}) — podobne tempo życia i podobny sposób `
      + `przeżywania emocji, rzadko dziwicie się swoimi reakcjami.`);
  } else if ((ganaA === "deva" && ganaB === "manuszja") || (ganaA === "manuszja" && ganaB === "deva")) {
    punkty += 1;
    opis.push(`Gana ${GANA_PL[ganaA]} i ${GANA_PL[ganaB]} — łagodna różnica temperamentu, wystarczy odrobina `
      + `cierpliwości, żeby się dopasować.`);
  } else if ((ganaA === "deva" && ganaB === "rakszasa") || (ganaA === "rakszasa" && ganaB === "deva")) {
    punkty -= 2;
    opis.push(`Gana ${GANA_PL[ganaA]} i ${GANA_PL[ganaB]} — najbardziej rozbieżna para temperamentów w tej skali; `
      + `jedno z Was działa spokojnie i z namysłem, drugie żywiołowo i intensywnie — to źródło nieporozumień, `
      + `jeśli żadne z Was tego nie nazwie wprost.`);
  } else {
    punkty -= 1;
    opis.push(`Gana ${GANA_PL[ganaA]} i ${GANA_PL[ganaB]} — wyraźna różnica temperamentu, warto świadomie `
      + `zostawiać sobie przestrzeń na różne tempo reagowania.`);
  }

  if (a.angles && b.angles) {
    const relLagny = signRelacja(RASIS[a.angles.lagnaSign].lord, b.angles.lagnaSign);
    if (relLagny === "przyjazny") {
      punkty += 1;
      opis.push("Władcy lagny obojga są sobie przyjaźni — podobny sposób wchodzenia w świat, łatwiej Wam się "
        + "dogadać w codziennych, praktycznych sprawach (plany, tempo dnia, drobne decyzje).");
    } else if (relLagny === "wrogi") {
      punkty -= 1;
      opis.push("Władcy lagny obojga są sobie wrodzy — różne tempo i styl działania na co dzień; to, co dla jednej "
        + "osoby jest naturalne, dla drugiej bywa męczące, warto to nazwać zamiast się frustrować.");
    }
  }

  punkty = Math.max(0, Math.min(10, Math.round(punkty * 10) / 10));
  return { typ: "ogolna", punkty, werdykt: werdyktOgolny(punkty), opis };
}

/**
 * Główna funkcja: wybiera sposób wyliczeń wg relacji zadeklarowanej dla obu osób.
 * @param relA relacja osoby A do właściciela konta (np. "partner", "dziecko")
 * @param relB jak wyżej, dla osoby B
 */
export function pokrewienstwo(a: VedicChart, b: VedicChart, relA: Relacja, relB: Relacja): WynikPokrewienstwa {
  if (czyParaPartnerska(relA, relB)) {
    const gm = gunaMilan(a.planets.moon.longitude, b.planets.moon.longitude);
    const posortowane = [...gm.kutas].sort((x, y) => y.points / y.max - x.points / x.max);
    const najmocniejsza = posortowane[0];
    const najslabsza = posortowane[posortowane.length - 1];
    const opis = [
      `Guna Milan: ${gm.total}/36 — ${gm.verdict}. Ta sama klasyczna analiza co w zakładce Dopasowanie, licząca `
        + `zgodność ośmiu wymiarów (Ashtakoota) z pozycji Księżyca obojga.`,
      `Najmocniejszy wymiar: ${najmocniejsza.name} (${najmocniejsza.points}/${najmocniejsza.max}) — ${najmocniejsza.komentarz}`,
      `Najsłabszy wymiar: ${najslabsza.name} (${najslabsza.points}/${najslabsza.max}) — ${najslabsza.komentarz}`,
      ...gm.doshas,
    ];
    return { typ: "partnerska", gunaMilan: gm, werdykt: gm.verdict, opis };
  }
  return pokrewienstwoOgolne(a, b);
}
