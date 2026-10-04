/**
 * Odwrócenie kolorów strony — nagroda po ukończeniu wszystkich sekcji Koła Karmy.
 * Kliknięcie środka Koła wylewa złoto na całą stronę: fiolet ↔ złoto.
 *
 * Działa jednym filtrem SVG na <html> (#vk-odwroc w layout.tsx), który dla każdego
 * kanału liczy c' = (fiolet + złoto) − c — dokładnie zamienia #170f28 z #e6c48a,
 * także w grafikach Koła. Turkusowy tekst w tym trybie dostaje złoty kolor przed
 * filtrem (globals.css), więc po filtrze jest ciemnofioletowy na złotym tle.
 * Fala: View Transitions API — nowy widok odsłania się kołem o miękkiej krawędzi
 * ze środka Koła. Bez wsparcia przeglądarki albo przy ograniczeniu ruchu: od razu.
 */

export const KLUCZ_ODWROCENIA = "vk_odwrocone";
export const ATRYBUT_ODWROCENIA = "data-odwrocone";

/** Skrypt do <head> — ustawia tryb przed pierwszym malowaniem (bez mignięcia fioletu). */
export const SKRYPT_ODWROCENIA =
  `try{if(localStorage.getItem("${KLUCZ_ODWROCENIA}")==="1")document.documentElement.setAttribute("${ATRYBUT_ODWROCENIA}","")}catch(e){}`;

export function czyOdwrocone(): boolean {
  return typeof document !== "undefined" && document.documentElement.hasAttribute(ATRYBUT_ODWROCENIA);
}

/** Przełącza kolory falą ze punktu (x, y) w pikselach okna; kończy się po animacji. */
export async function przelaczKolory(x: number, y: number): Promise<void> {
  const html = document.documentElement;
  const nowy = !czyOdwrocone();
  const zmien = () => {
    html.toggleAttribute(ATRYBUT_ODWROCENIA, nowy);
    try { localStorage.setItem(KLUCZ_ODWROCENIA, nowy ? "1" : "0"); } catch { /* tryb prywatny */ }
  };
  const bezRuchu = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  if (!doc.startViewTransition || bezRuchu) { zmien(); return; }
  html.style.setProperty("--fala-x", `${x}px`);
  html.style.setProperty("--fala-y", `${y}px`);
  html.classList.add("vk-fala");
  try {
    await doc.startViewTransition(zmien).finished;
  } finally {
    html.classList.remove("vk-fala");
  }
}
