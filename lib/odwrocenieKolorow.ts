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
  // tylko na localhost: ?trojkat-lodz — dopisuje do znaków osoby trójkąt i łódź w środku dłoni na obu rękach
  // (podgląd, jak te znaki zmieniają Twoją Karmę, bez nowego odczytu dłoni); działa razem z ?zlota, więc stoi
  // przed nim — ?zlota czyści adres
  `try{var h6=location.hostname;if((h6==="localhost"||h6==="127.0.0.1")&&/[?&]trojkat-lodz(=|&|$)/.test(location.search)){var zw=JSON.parse(localStorage.getItem("vk_znaki_wlasne")||"[]");[["wiodaca","trojkat","środek dłoni — trójkąt z linii głowy, losu i Merkurego"],["bierna","trojkat","środek dłoni — trójkąt z linii głowy, losu i Merkurego"],["wiodaca","lodz","środek dłoni po stronie kciuka — łódź z linii losu, życia i głowy, niedomknięta u dołu przy nadgarstku"],["bierna","lodz","środek dłoni po stronie kciuka — łódź z linii losu, życia i głowy, domknięta u dołu"]].forEach(function(n){if(!zw.some(function(z){return z.reka===n[0]&&z.znak===n[1]&&z.miejsce==="rahu"}))zw.push({reka:n[0],miejsce:"rahu",znak:n[1],opis:n[2]})});localStorage.setItem("vk_znaki_wlasne",JSON.stringify(zw))}}catch(e){}` +
  // tylko na localhost: adres z ?reset czyści cały postęp Koła (vk_*) — test „od pierwszego kroku”
  `try{var h=location.hostname;if((h==="localhost"||h==="127.0.0.1")&&/[?&]reset(=|&|$)/.test(location.search)){Object.keys(localStorage).filter(function(k){return k.indexOf("vk_")===0}).forEach(function(k){localStorage.removeItem(k)});history.replaceState(null,"",location.pathname)}}catch(e){}`+
  // tylko na localhost: ?komplet — od zera, ale z trzema ukończonymi sekcjami (test fali złota)
  `try{var h2=location.hostname;if((h2==="localhost"||h2==="127.0.0.1")&&/[?&]komplet(=|&|$)/.test(location.search)){Object.keys(localStorage).filter(function(k){return k.indexOf("vk_")===0}).forEach(function(k){localStorage.removeItem(k)});localStorage.setItem("vk_systemy_karmy",'["astrologia","hiromancja","numerologia"]');history.replaceState(null,"",location.pathname)}}catch(e){}`+
  // tylko na localhost: ?zlota — od razu złota Twoja Karma z trzema ukończonymi sekcjami, BEZ kasowania
  // zapisów (odczyt dłoni, dane urodzenia zostają) — podgląd porównania systemów na prawdziwych danych
  `try{var h3=location.hostname;if((h3==="localhost"||h3==="127.0.0.1")&&/[?&]zlota(=|&|$)/.test(location.search)){localStorage.setItem("vk_systemy_karmy",'["astrologia","hiromancja","numerologia"]');localStorage.setItem("${KLUCZ_ODWROCENIA}","1");history.replaceState(null,"",location.pathname)}}catch(e){}`+
  // tylko na localhost: ?etap — ostatni etap: astrologia i numerologia ukończone, chiromancja do
  // zrobienia, bez złota; bez kasowania zapisów (dane urodzenia, odczyty) — test końcówki na prawdziwych danych
  `try{var h4=location.hostname;if((h4==="localhost"||h4==="127.0.0.1")&&/[?&]etap(=|&|$)/.test(location.search)){localStorage.setItem("vk_systemy_karmy",'["astrologia","numerologia"]');localStorage.removeItem("${KLUCZ_ODWROCENIA}");history.replaceState(null,"",location.pathname)}}catch(e){}`+
  // tylko na localhost: ?gwiazdka — moment pulsującej gwiazdki: trzy sekcje ukończone, bez złota,
  // bez kasowania zapisów (dane urodzenia, odczyt dłoni, znaki) — test fali i Twojej Karmy na prawdziwych danych
  `try{var h5=location.hostname;if((h5==="localhost"||h5==="127.0.0.1")&&/[?&]gwiazdka(=|&|$)/.test(location.search)){localStorage.setItem("vk_systemy_karmy",'["astrologia","hiromancja","numerologia"]');localStorage.removeItem("${KLUCZ_ODWROCENIA}");history.replaceState(null,"",location.pathname)}}catch(e){}`+
  `try{if(localStorage.getItem("${KLUCZ_ODWROCENIA}")==="1")document.documentElement.setAttribute("${ATRYBUT_ODWROCENIA}","")}catch(e){}`;

/** Klasa na <html>: treść pod Kołem znika przed falą (globals.css). Zdejmuje ją dopiero
 *  strona Twoja Karma po wejściu — jej napisy wtedy łagodnie się pojawiają. */
export const KLASA_ZNIKANIA = "vk-znikaj";

/** Nieregularny kształt „rozlanego mleka”: wielokąt wokół (x, y), promień w każdym kierunku
 *  to --fala-r razy współczynnik z nałożonych sinusów — za każdym razem inne łaty i zatoczki. */
function ksztaltPlamy(x: number, y: number): string {
  const fazy = [Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3];
  const punkty: string[] = [];
  for (let i = 0; i < 72; i++) {
    const kat = (i / 72) * Math.PI * 2;
    const k = 1 + 0.16 * Math.sin(3 * kat + fazy[0]) + 0.1 * Math.sin(5 * kat + fazy[1]) + 0.06 * Math.sin(9 * kat + fazy[2]);
    const dx = (Math.cos(kat) * k).toFixed(3), dy = (Math.sin(kat) * k).toFixed(3);
    punkty.push(`calc(${x}px + var(--fala-r) * ${dx}) calc(${y}px + var(--fala-r) * ${dy})`);
  }
  return `polygon(${punkty.join(",")})`;
}

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
  // 0) najpierw znikają wszystkie napisy pod Kołem — zostaje samo Koło, dopiero potem fala
  html.classList.add(KLASA_ZNIKANIA);
  await new Promise((r) => setTimeout(r, 650));
  // nieregularny kształt „rozlanego mleka”: wielokąt wokół gwiazdki, promień w każdym
  // kierunku to fala (--fala-r) razy współczynnik z nałożonych sinusów — za każdym razem
  // trochę inne łaty, wypustki i zatoczki. Reguła wstrzykiwana do <style>, bo --fala-r
  // animuje się na samym pseudo-elemencie przejścia.
  let styl = document.getElementById("vk-fala-ksztalt");
  if (!styl) { styl = document.createElement("style"); styl.id = "vk-fala-ksztalt"; document.head.appendChild(styl); }
  styl.textContent = `html.vk-fala::view-transition-new(root){clip-path:${ksztaltPlamy(x, y)}}`;
  // 1) fala: złoto wychodzi z gwiazdki i odwraca WSZYSTKIE kolory, także samo Koło
  //    (klasa vk-fala wyłącza na ten czas ciemny medalion Koła — patrz globals.css)
  html.classList.add("vk-fala");
  const przejscie = doc.startViewTransition(zmien);
  // 2) tuż za nią druga plama z gwiazdki — tylko w obrębie Koła — przywraca mu złoto
  //    z negatywu. Nowy widok przejścia jest „na żywo”, więc druga fala to zwykły klon
  //    Koła w wyglądzie medalionu, odsłaniany własną plamą, nałożony na oryginał.
  const druga = new Promise<void>((koniec) => setTimeout(() => {
    const kolo = document.querySelector<HTMLElement>("[data-kolo-karmy]");
    if (!kolo) { koniec(); return; }
    const r = kolo.getBoundingClientRect();
    const klon = kolo.cloneNode(true) as HTMLElement;
    klon.removeAttribute("data-kolo-karmy");
    klon.classList.add("vk-kolo-klon");
    klon.setAttribute("aria-hidden", "true");
    Object.assign(klon.style, {
      position: "absolute", left: `${kolo.offsetLeft}px`, top: `${kolo.offsetTop}px`,
      width: `${kolo.offsetWidth}px`, margin: "0", maxWidth: "none",
    });
    // zasięg do brzegu Koła razem ze Związkami
    klon.style.setProperty("--fala-kolo-r", `${Math.round((r.width * 620) / 1260 / 0.66)}px`);
    klon.style.clipPath = ksztaltPlamy(x - r.left, y - r.top);
    klon.addEventListener("animationend", (e) => { if (e.target === klon) koniec(); });
    setTimeout(koniec, 2500); // zabezpieczenie
    kolo.parentElement?.appendChild(klon);
  }, 280));
  try {
    await Promise.all([przejscie.finished, druga]);
  } finally {
    // oryginał przechodzi w medalion (identyczny z klonem), klon znika — bez mignięcia
    html.classList.remove("vk-fala");
    document.querySelectorAll(".vk-kolo-klon").forEach((k) => k.remove());
  }

}
