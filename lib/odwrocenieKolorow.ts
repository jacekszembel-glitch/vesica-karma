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
  // tylko na localhost: ?komplet — od zera, ale z trzema ukończonymi sekcjami (test fali złota)
  `try{var h2=location.hostname;if((h2==="localhost"||h2==="127.0.0.1")&&/[?&]komplet(=|&|$)/.test(location.search)){Object.keys(localStorage).filter(function(k){return k.indexOf("vk_")===0}).forEach(function(k){localStorage.removeItem(k)});localStorage.setItem("vk_systemy_karmy",'["astrologia","hiromancja","numerologia"]');history.replaceState(null,"",location.pathname)}}catch(e){}`+
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
  // nieregularny kształt „rozlanego mleka”: wielokąt wokół gwiazdki, promień w każdym
  // kierunku to fala (--fala-r) razy współczynnik z nałożonych sinusów — za każdym razem
  // trochę inne łaty, wypustki i zatoczki. Reguła wstrzykiwana do <style>, bo --fala-r
  // animuje się na samym pseudo-elemencie przejścia.
  const fazy = [Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3];
  const punkty: string[] = [];
  for (let i = 0; i < 72; i++) {
    const kat = (i / 72) * Math.PI * 2;
    const k = 1 + 0.16 * Math.sin(3 * kat + fazy[0]) + 0.1 * Math.sin(5 * kat + fazy[1]) + 0.06 * Math.sin(9 * kat + fazy[2]);
    const dx = (Math.cos(kat) * k).toFixed(3), dy = (Math.sin(kat) * k).toFixed(3);
    punkty.push(`calc(${x}px + var(--fala-r) * ${dx}) calc(${y}px + var(--fala-r) * ${dy})`);
  }
  let styl = document.getElementById("vk-fala-ksztalt");
  if (!styl) { styl = document.createElement("style"); styl.id = "vk-fala-ksztalt"; document.head.appendChild(styl); }
  styl.textContent = `html.vk-fala::view-transition-new(root){clip-path:polygon(${punkty.join(",")})}`;
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
