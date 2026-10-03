import { GRAHAS, PLANET_ORDER, type PlanetId } from "./constants";

/**
 * Wspólny słownik ciał na mapach (astrokartografia, mapa lokalna): dziewięć grah
 * wedyjskich, planety zewnętrzne i cztery kąty.
 *
 * PLANETY ZEWNĘTRZNE (Uran, Neptun, Pluton) — tylko na mapie świata. Astrologia
 * wedyjska ich nie używa (brak władania znakami, egzaltacji, udziału w daszach),
 * więc nie wchodzą do GRAHAS, kosmogramu ani oceny miejsc. Astrokartografia to
 * jednak osobne narzędzie (zachodnie, Jim Lewis), a jej linie liczy się z
 * rektascensji i deklinacji — zodiak nie bierze w tym udziału. Decyzja
 * użytkownika (2026-10-02): przy wyborze miejsca ich położenie jest ważne,
 * a w większości przypadków działają trudno — stąd natura −1.
 */

export type OuterId = "uranus" | "neptune" | "pluto";

/** Cztery kąty kosmogramu — jak planety, mają azymut zależny od miejsca i chwili. */
export type AngleId = "asc" | "desc" | "mc" | "ic";
export type BodyId = PlanetId | OuterId | AngleId;

export interface BodyInfo {
  id: BodyId;
  pl: string;
  /** Angielska nazwa — patrz komentarz przy Graha.en w constants.ts. */
  en: string;
  symbol: string;
  color: string;
  /** Naturalna dobroczynność — używana przy ocenie miejsc. */
  nature: 1 | 0 | -1;
  /** Motyw linii na mapie. */
  motyw: string;
  motywEn: string;
}

export const OUTER_ORDER: OuterId[] = ["uranus", "neptune", "pluto"];

export const OUTERS: Record<OuterId, BodyInfo> = {
  uranus: {
    id: "uranus", pl: "Uran", en: "Uranus", symbol: "♅", color: "#79C7E8", nature: -1,
    motyw: "wolność, przebudzenie, oryginalność, przełomy i nagłe zmiany", motywEn: "freedom, awakening, originality, breakthroughs and sudden change",
  },
  neptune: {
    id: "neptune", pl: "Neptun", en: "Neptune", symbol: "♆", color: "#8AA8E0", nature: -1,
    motyw: "duchowość, intuicja, wyobraźnia, sztuka, współczucie i złudzenia", motywEn: "spirituality, intuition, imagination, art, compassion and illusion",
  },
  pluto: {
    id: "pluto", pl: "Pluton", en: "Pluto", symbol: "♇", color: "#B06A8A", nature: -1,
    motyw: "przemiana, moc, głębia psychiczna, kryzys i odrodzenie", motywEn: "transformation, power, psychological depth, crisis and rebirth",
  },
};

export const ANGLE_ORDER: AngleId[] = ["asc", "desc", "mc", "ic"];

/**
 * Kąty kosmogramu (Ascendent/Descendent/Medium Coeli/Immum Coeli) — tak samo
 * jak astro.com pokazuje je w Local Space obok planet: każdy leży na ekliptyce
 * (szerokość 0°), więc liczy się dokładnie tym samym potokiem co planeta.
 * Kolory świadomie z istniejącej palety marki (gold/teal), sparowane w osie:
 * ASC/DESC (oś horyzontu) — jasny/ciemny złoty, MC/IC (oś południka) — jasny/ciemny turkus.
 */
export const ANGLES: Record<AngleId, BodyInfo> = {
  asc: { id: "asc", pl: "Ascendent", en: "Ascendant", symbol: "AS", color: "#e6c48a", nature: 0, motyw: "jak wchodzisz w nowe sytuacje, pierwsze wrażenie", motywEn: "how you enter new situations, first impressions" },
  desc: { id: "desc", pl: "Descendent", en: "Descendant", symbol: "DS", color: "#c39a3b", nature: 0, motyw: "relacje, partnerstwo, czego szukasz u innych", motywEn: "relationships, partnership, what you look for in others" },
  mc: { id: "mc", pl: "Medium Coeli", en: "Midheaven", symbol: "MC", color: "#7fd0d8", nature: 0, motyw: "kariera, status, publiczny wizerunek", motywEn: "career, status, public image" },
  ic: { id: "ic", pl: "Immum Coeli", en: "Imum Coeli", symbol: "IC", color: "#11a7b6", nature: 0, motyw: "dom, korzenie, prywatne zaplecze", motywEn: "home, roots, private foundation" },
};

const MOTYW_GRAHA: Record<PlanetId, string> = {
  sun: "autorytet, widoczność, siła woli, przywództwo i sens",
  moon: "emocje, dom, poczucie bezpieczeństwa, troska i intuicja",
  mars: "działanie, odwaga, energia, rywalizacja i konflikt",
  mercury: "myślenie, nauka, handel, komunikacja i kontakty",
  jupiter: "rozwój, mądrość, nauczyciele, sens i obfitość",
  venus: "miłość, relacje, piękno, sztuka i dostatek",
  saturn: "dyscyplina, praca, odpowiedzialność, struktura i próba czasu",
  rahu: "ambicja, głód nowego, obczyzna, technologia i ryzyko",
  ketu: "odpuszczanie, duchowość, intuicja, wnętrze i dystans",
};

const MOTYW_GRAHA_EN: Record<PlanetId, string> = {
  sun: "authority, visibility, willpower, leadership and purpose",
  moon: "emotions, home, sense of security, care and intuition",
  mars: "action, courage, energy, competition and conflict",
  mercury: "thinking, learning, trade, communication and contacts",
  jupiter: "growth, wisdom, teachers, meaning and abundance",
  venus: "love, relationships, beauty, art and abundance",
  saturn: "discipline, work, responsibility, structure and the test of time",
  rahu: "ambition, hunger for the new, foreign lands, technology and risk",
  ketu: "letting go, spirituality, intuition, interiority and distance",
};

/** Wspólny słownik ciał — grahy, planety zewnętrzne i kąty. Do mapy i legend. */
export const BODIES: Record<BodyId, BodyInfo> = {
  ...Object.fromEntries(
    PLANET_ORDER.map((id) => [id, {
      id,
      pl: GRAHAS[id].pl,
      en: GRAHAS[id].en,
      symbol: GRAHAS[id].symbol,
      color: GRAHAS[id].color,
      nature: GRAHAS[id].nature,
      motyw: MOTYW_GRAHA[id],
      motywEn: MOTYW_GRAHA_EN[id],
    } satisfies BodyInfo]),
  ) as Record<PlanetId, BodyInfo>,
  ...OUTERS,
  ...ANGLES,
};

/**
 * Kolejność na mapie: dziewięć grah. ŚWIADOMIE bez kątów
 * (ANGLE_ORDER) — BODY_ORDER współdzielą też AstroMap/AstroMapGL/DiagramOdczytu
 * (astrokartografia), które mają WŁASNY, osobny koncept linii kątów (MC/IC/ASC/DSC
 * jako południki/krzywe na globie, nie azymuty z jednego punktu) — dopisanie tu
 * ANGLE_ORDER dawałoby im martwe, niedziałające przyciski. Kto potrzebuje kątów
 * Local Space, dokłada ANGLE_ORDER lokalnie (patrz MapaLokalna.tsx).
 */
export const BODY_ORDER: BodyId[] = [...PLANET_ORDER];

/** Mapa świata (astrokartografia): dziewięć grah, potem planety zewnętrzne. */
export const MAPA_SWIATA_ORDER: BodyId[] = [...PLANET_ORDER, ...OUTER_ORDER];
