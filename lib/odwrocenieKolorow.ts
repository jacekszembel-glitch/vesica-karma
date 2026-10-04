/**
 * Fala złota — nagroda po ukończeniu wszystkich sekcji Koła Karmy. Kliknięcie
 * środka Koła (gwiazdki) wypuszcza z niego złote światło, które rozchodzi się
 * kołem o miękkiej krawędzi po całej stronie i przechodzi dalej — po fali
 * strona zostaje w swoich zwykłych kolorach (wcześniejsze trwałe odwrócenie
 * fiolet ↔ złoto wycofane 2026-10-04 na prośbę użytkownika).
 */

/** Dawny klucz trwałego odwrócenia — czyszczony, żeby nikt nie został w złotym trybie. */
const KLUCZ_ODWROCENIA = "vk_odwrocone";

/** Skrypt do <head>. Na localhost: ?reset w adresie czyści postęp Koła (testy od zera). */
export const SKRYPT_ODWROCENIA =
  `try{var h=location.hostname;if((h==="localhost"||h==="127.0.0.1")&&/[?&]reset(=|&|$)/.test(location.search)){Object.keys(localStorage).filter(function(k){return k.indexOf("vk_")===0}).forEach(function(k){localStorage.removeItem(k)});history.replaceState(null,"",location.pathname)}}catch(e){}` +
  `try{localStorage.removeItem("${KLUCZ_ODWROCENIA}")}catch(e){}`;

/** Złota fala z punktu (x, y) w pikselach okna; kończy się, gdy przejdzie przez cały ekran. */
export function falaZlota(x: number, y: number): Promise<void> {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();
  return new Promise((koniec) => {
    const fala = document.createElement("div");
    fala.className = "vk-fala-zlota";
    fala.setAttribute("aria-hidden", "true");
    fala.style.setProperty("--fala-x", `${x}px`);
    fala.style.setProperty("--fala-y", `${y}px`);
    document.body.appendChild(fala);
    const zakoncz = () => { fala.remove(); koniec(); };
    fala.addEventListener("animationend", zakoncz, { once: true });
    setTimeout(zakoncz, 3500); // zabezpieczenie, gdyby animationend nie przyszło
  });
}
