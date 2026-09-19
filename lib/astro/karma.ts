import type { PlanetId } from "./constants";
import type { VedicChart } from "./chart";
import { ocenaWladcy, type OcenaWladcy } from "./sila";
import { mulankBhagyankRelacja, type NumerologyResult, type PoziomRelacjiPlanet } from "./numerology";
import { wykryteJogiPosortowane } from "./yogas";

/**
 * KARMA — most między numerologią a astrologią, NIE osobny system wróżebny.
 * Koncepcja (Jacek, 2026-09-15): przy narodzinach spełnione są 3 warunki —
 * czas, miejsce, rodzina (ciało + imię) — z których każdy karmi inny system
 * odczytu (numerologia, astrologia, hiromancja). Gdy wszystkie się ze sobą
 * zgadzają, to silniejszy sygnał niż jeden system osobno.
 *
 * Hiromancja NIE jest tu liczona — nie istnieje jeszcze w tej aplikacji
 * (wymaga analizy zdjęcia dłoni, zupełnie inny rodzaj wyliczeń niż reszta
 * serwisu). Poniżej łączymy tylko dwa systemy, które już mamy w pełni:
 *
 *  - numerologia wedyjska (numerology.ts) przypisuje każdej cyfrze 1–9 planetę
 *    (VEDIC_PLANETS) — Mulank i Bhagyank wskazują więc DWIE konkretne planety;
 *  - astrologia (sila.ts, ocenaWladcy — ten sam rachunek co w Predyspozycjach,
 *    Rankingu Grah i Mapie Czasu Jog) już ocenia, jak silna i dobrze
 *    osadzona jest każda planeta w TEJ konkretnej mapie.
 *
 * "Potwierdzenie" to więc nie nowy, osobny rachunek — to odczytanie
 * ISTNIEJĄCEJ oceny astrologicznej dla planety, którą numerologia już
 * wskazała jako ważną. Świadomie NIE sumujemy tego w jedną liczbę "karmy" —
 * to synteza jakościowa (potwierdzone/napięcie/neutralne), nie kolejny
 * wskaźnik liczbowy.
 */

const CYFRA_PLANETA: Record<number, PlanetId> = {
  1: "sun", 2: "moon", 3: "jupiter", 4: "rahu", 5: "mercury",
  6: "venus", 7: "ketu", 8: "saturn", 9: "mars",
};

export type Potwierdzenie = "potwierdzone" | "napiecie" | "neutralne";

export interface OdczytPlanety {
  etykieta: "Mulank" | "Bhagyank";
  cyfra: number;
  planeta: PlanetId;
  ocena: OcenaWladcy;
  potwierdzenie: Potwierdzenie;
}

function potwierdzenieZTonu(ton: OcenaWladcy["ton"]): Potwierdzenie {
  if (ton === "wspierający") return "potwierdzone";
  if (ton === "wymagający") return "napiecie";
  return "neutralne";
}

export interface OdczytKarmy {
  mulank: OdczytPlanety;
  bhagyank: OdczytPlanety;
  relacjaWewnetrzna: PoziomRelacjiPlanet;
  /** Aktualny władca mahadaszy/antardaszy (dasze/jogi = "kiedy") — z chart.currentDasha, może być pusty bez znanej godziny/daty poza zakresem 120 lat. */
  aktualnaMahadasza: PlanetId | null;
  aktualnaAntardasza: PlanetId | null;
}

/**
 * Buduje pełny odczyt karmy: dwie planety numerologii (Mulank, Bhagyank)
 * skonfrontowane z ich oceną w TEJ mapie astrologicznej, plus relacja
 * między nimi samymi (mulankBhagyankRelacja — już liczona przy numerologii)
 * i aktualny władca okresu (do sekcji "kiedy").
 */
export function odczytKarmy(chart: VedicChart, numerologia: NumerologyResult): OdczytKarmy {
  const jogi = wykryteJogiPosortowane(chart);

  function planetaZCyfry(etykieta: "Mulank" | "Bhagyank", cyfra: number): OdczytPlanety {
    const planeta = CYFRA_PLANETA[cyfra];
    const ocena = ocenaWladcy(chart, planeta, jogi);
    return { etykieta, cyfra, planeta, ocena, potwierdzenie: potwierdzenieZTonu(ocena.ton) };
  }

  const mulank = planetaZCyfry("Mulank", numerologia.birthdayRoot);
  const bhagyank = planetaZCyfry("Bhagyank", numerologia.destiny);
  const relacjaWewnetrzna = mulankBhagyankRelacja(numerologia.birthdayRoot, numerologia.destiny);

  return {
    mulank,
    bhagyank,
    relacjaWewnetrzna,
    aktualnaMahadasza: chart.currentDasha[0]?.lord ?? null,
    aktualnaAntardasza: chart.currentDasha[1]?.lord ?? null,
  };
}

/**
 * Zdanie syntezy — łączy trzy sygnały (potwierdzenie Mulanka, potwierdzenie
 * Bhagyanka, relacja wewnętrzna numerologii) w jedno jakościowe podsumowanie.
 * Świadomie NIE liczbowe — to synteza kierunku, nie wynik do porównywania
 * między osobami.
 */
export function syntezaKarmy(k: OdczytKarmy): string {
  const pozytywne = [
    k.mulank.potwierdzenie === "potwierdzone",
    k.bhagyank.potwierdzenie === "potwierdzone",
    k.relacjaWewnetrzna === "przyjaciel" || k.relacjaWewnetrzna === "wielki przyjaciel",
  ].filter(Boolean).length;
  const napiete = [
    k.mulank.potwierdzenie === "napiecie",
    k.bhagyank.potwierdzenie === "napiecie",
    k.relacjaWewnetrzna === "wróg" || k.relacjaWewnetrzna === "wielki wróg",
  ].filter(Boolean).length;

  if (pozytywne >= 2 && napiete === 0) {
    return "Numerologia i astrologia mówią tu w większości jednym głosem — to, co numerologia wskazuje jako Twój temat, astrologia w tej mapie realnie wspiera. Silniejszy sygnał niż każdy z systemów osobno.";
  }
  if (napiete >= 2) {
    return "Systemy się tu rozjeżdżają — to, co numerologia wskazuje jako Twój temat, w tej mapie astrologicznej wymaga więcej świadomej pracy, niż sama numerologia by sugerowała. Nie sprzeczność, tylko sygnał, żeby czytać oba systemy uważnie, nie tylko jeden.";
  }
  return "Obraz mieszany — część sygnałów się potwierdza, część nie. Czytaj oba systemy razem, nie osobno: tam, gdzie się zgadzają, masz pewniejszy grunt; tam, gdzie nie, warto zapytać dlaczego.";
}
