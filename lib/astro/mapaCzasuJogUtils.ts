import { GRAHAS, type PlanetId } from "./constants";

/**
 * Pomocnicze funkcje współdzielone przez Mapę Czasu Jog i Mapę Czasu Dosz —
 * jedna kopia, żeby nazewnictwo i skala mocy nie rozjechały się między widokami.
 */

/** Narzędnik („z kim") dla każdej planety — GRAHAS.pl trzyma mianownik, a tu trzeba przypadka po „z". */
export const Z_PLANETA: Record<PlanetId, string> = {
  sun: "ze Słońcem", moon: "z Księżycem", mars: "z Marsem", mercury: "z Merkurym",
  jupiter: "z Jowiszem", venus: "z Wenus", saturn: "z Saturnem", rahu: "z Rahu", ketu: "z Ketu",
};

/** Nazwa jogi/doszy + (dla dwuplanetowych) z kim ją tworzy. Strukturalny typ — pasuje do Yoga i Dosza. */
export function nazwaZPara(j: { nazwa: string; planety: PlanetId[] }): string {
  if (j.planety.length < 2) return j.nazwa;
  const [a, b] = j.planety;
  return `${j.nazwa} (${GRAHAS[a].pl} ${Z_PLANETA[b]})`;
}

/** Siła punktowa (ocenaWladcy) → opacity odcinka. Skala w praktyce mieści się w ok. [-2, +4]. */
export function opacityMocy(punkty: number): number {
  const t = Math.max(0, Math.min(1, (punkty + 2) / 6));
  return 0.5 + t * 0.5;
}

export function opisMocy(punkty: number): string {
  if (punkty >= 1) return "silnie odczuwalna";
  if (punkty >= 0) return "wyraźnie obecna";
  if (punkty >= -0.75) return "umiarkowana";
  return "działa z tarciem";
}

/** Rok kalendarzowy odpowiadający danemu wiekowi — te same 365,25 dnia, co reszta wyliczeń daszy. */
export function rokDlaWieku(birth: Date, age: number): number {
  return new Date(birth.getTime() + age * 365.25 * 86400000).getFullYear();
}
