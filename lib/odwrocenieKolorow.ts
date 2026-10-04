/**
 * Odwrócenie kolorów strony — nagroda po ukończeniu wszystkich sekcji Koła Karmy.
 * Kliknięcie środka Koła wylewa złoto na całą stronę: fiolet ↔ złoto.
 *
 * Działa jednym filtrem SVG na <html> (#vk-odwroc w layout.tsx), który dla każdego
 * kanału liczy c' = (fiolet + złoto) − c — dokładnie zamienia #170f28 z #e6c48a,
 * także w grafikach Koła. Turkusowy tekst w tym trybie dostaje złoty kolor przed
 * filtrem (globals.css), więc po filtrze jest ciemnofioletowy na złotym tle.
 * Fala: View Transitions API — złoty widok zalewa stronę kołem o ostrej krawędzi
 * od gwiazdki w środku Koła na zewnątrz. Po ukończeniu wszystkich sekcji strona
 * zostaje złota na stałe (bez powrotu do fioletu). Bez wsparcia przeglądarki albo
 * przy ograniczeniu ruchu: od razu.
 */

export const KLUCZ_ODWROCENIA = "vk_odwrocone";
export const ATRYBUT_ODWROCENIA = "data-odwrocone";

/** Skrypt do <head> — ustawia tryb przed pierwszym malowaniem (bez mignięcia fioletu).
 *  Na localhost dodatkowo: ?reset w adresie czyści postęp (do testów od zera). */
export const SKRYPT_ODWROCENIA =
  // tylko na localhost: adres z ?reset czyści cały postęp Koła (vk_*) — test „od pierwszego kroku”
  `try{var h=location.hostname;if((h==="localhost"||h==="127.0.0.1")&&/[?&]reset(=|&|$)/.test(location.search)){Object.keys(localStorage).filter(function(k){return k.indexOf("vk_")===0}).forEach(function(k){localStorage.removeItem(k)});history.replaceState(null,"",location.pathname)}}catch(e){}`+
  `try{if(localStorage.getItem("${KLUCZ_ODWROCENIA}")==="1")document.documentElement.setAttribute("${ATRYBUT_ODWROCENIA}","")}catch(e){}`;

export function czyOdwrocone(): boolean {
  return typeof document !== "undefined" && document.documentElement.hasAttribute(ATRYBUT_ODWROCENIA);
}

/** Zalewa stronę złotem falą z punktu (x, y) w pikselach okna; kończy się po animacji.
 *  Gdy strona już jest złota — nic nie robi (złoto zostaje na stałe). */
export async function zalejZlotem(x: number, y: number): Promise<void> {
  const html = document.documentElement;
  if (czyOdwrocone()) return;
  const zmien = () => {
    html.setAttribute(ATRYBUT_ODWROCENIA, "");
    try { localStorage.setItem(KLUCZ_ODWROCENIA, "1"); } catch { /* tryb prywatny */ }
  };
  const bezRuchu = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  if (!doc.startViewTransition || bezRuchu) { zmien(); return; }
  html.style.setProperty("--fala-x", `${x}px`);
  html.style.setProperty("--fala-y", `${y}px`);
  // 1) fala: złoto wychodzi z gwiazdki i odwraca WSZYSTKIE kolory, także samo Koło
  //    (klasa vk-fala wyłącza na ten czas ciemny medalion Koła — patrz globals.css)
  html.classList.add("vk-fala");
  try {
    await doc.startViewTransition(zmien).finished;
  } finally {
    // 2) zaraz po fali Koło płynnie wraca do swojego wyglądu (ciemny medalion, złote ikony)
    html.classList.add("vk-fala-powrot");
    try {
      await doc.startViewTransition(() => html.classList.remove("vk-fala")).finished;
    } finally {
      html.classList.remove("vk-fala", "vk-fala-powrot");
    }
  }
}
