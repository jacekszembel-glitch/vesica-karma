/**
 * Jednorazowy skrypt (Faza 1 reskinu VesicaKarma) — generuje z istniejącego
 * public/brand/kolo-karmy.png dwa nowe zestawy assetów:
 *   1) kolo-karmy-taupe.png — cała grafika odbarwiona do stonowanego taupe
 *      (nowy domyślny stan „nieukończony"), przez sharp .tint().
 *   2) fill-<id>-gold.png (dla astrologia/hiromancja/numerologia) — oryginalne
 *      (złote) piksele kolo-karmy.png przycięte maską w kształcie PIERŚCIENIA
 *      (annulus: środek + promień zewn./wewn.), nie prostokąta — geometria
 *      RINGS zmierzona bezpośrednio z prawdziwych referencji projektowych
 *      (public/brand/nowe-kolo-karmy-podswietlenie*.jpg), patrz metoda niżej.
 *
 *      Wcześniejsza wersja używała bounding-boxa płatka (HOTSPOTY[].gap) —
 *      dawało to nierówny, "narożnikowy" efekt zamiast czystego pierścienia.
 *      Też NIE używamy glow-<id>.png — te maski są flood-fillem WNĘTRZA
 *      płatka (do miękkiej poświaty na hover, zatrzymują się PRZED złotą
 *      linią), więc nałożone na oryginał dają nieomal pustkę.
 *
 *      Metoda pomiaru (patrz git history tego pliku dla dokładnych skryptów
 *      _measure_*.mjs, usuniętych po użyciu): w referencyjnym zrzucie ze
 *      znanym kontenerem znaleziono piksele jasnozłote (próg jasności+barwy),
 *      dopasowano bbox pierścienia (kwadrat = okrąg), przeliczono skalę
 *      i offset względem bbox całego kwiatu w kolo-karmy.png (linia bazowa:
 *      CX=596,CY=378,R_OUTER=350 → bbox 700×700), a promień zewn./wewn.
 *      pierścienia zmierzono skanem radialnym pod 8 kątami.
 *
 * Uruchamiane lokalnie: `node scripts/recolor-kolo-karmy.mjs`. Wynikowe PNG
 * commitowane do public/brand/ — skrypt nie jest częścią builda/runtime.
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "..", "public", "brand");
const basePath = path.join(dir, "kolo-karmy.png");

const IMG_W = 1260, IMG_H = 761;

/** Geometria pętli w przestrzeni kolo-karmy.png (1260×761), zmierzona z
 *  referencji projektowych — środek + promień zewnętrzny/wewnętrzny pasa. */
const RINGS = {
  astrologia: { cx: 599, cy: 255, rOuter: 208, rInner: 170 },
  hiromancja: { cx: 495, cy: 439, rOuter: 208, rInner: 170 },
  numerologia: { cx: 701, cy: 439, rOuter: 208, rInner: 170 },
};
const FEATHER = 4;

/** Stary kompas (piktogram Astrologii, wypalony w kolo-karmy.png) — wycinany
 *  do przezroczystości, żeby zastąpić go MoonStars.tsx (gwiazdy+księżyc).
 *  Sam dorysowany kompas był niewidoczny (nakładałem gwiazdy OBOK niego,
 *  nigdy go nie usuwając), więc w praktyce nic się nie zmieniało. Krąg
 *  mieści się w całości wewnątrz wewnętrznego promienia pierścienia
 *  Astrologii (odległość środek-środek ~85 < rInner 170), więc nie dotyka
 *  złotej linii pierścienia. Promień domierzony wizualnie z icon-astrologia.png
 *  (kompas prawie wypełnia swój kwadrat 150×150, z małym zapasem od pierścienia
 *  w rogu). */
const KOMPAS_DZIURA = { cx: 600, cy: 166, r: 78, feather: 6 };

/** Stara dłoń (piktogram Chiromancji) — wycinana tym samym sposobem co
 *  kompas, ale maską o dokładnym kształcie dłoni (nie okręgiem — dłoń nie
 *  jest okrągła), zapisaną raz jako erase-hiromancja-mask.png. Ta maska to
 *  największa spójna plama pikseli ze STAREGO icon-hiromancja.png (przed
 *  podmianą na nową dłoń z public/brand/dlon.jpg) — odrzuca małe fragmenty
 *  złotego pierścienia w rogach kadru, które inaczej zostałyby błędnie
 *  wycięte razem z dłonią. Metoda: patrz git history tego pliku
 *  (scripts/_extract_hand_mask.mjs, usunięty po użyciu). */
const DLON_MASKA = path.join(dir, "erase-hiromancja-mask.png");

/** Stare cyfry „375"/„1" (piktogram Numerologii) — WAŻNE: icon-numerologia.png
 *  okazał się NIE być pixel-aligned ze swoim odpowiednikiem w kolo-karmy.png
 *  (osobno wyeksportowany asset, inna skala/pozycja) — próba budowy maski
 *  z jego kształtu (jak przy dłoni) dawała tylko częściowe wycięcie
 *  ("duchy" starych cyfr). Próbna elipsa obejmująca cały obszar była za
 *  duża i ucinała kawałek sąsiedniego pierścienia. Ostateczna wersja:
 *  dokładny kształt cyfr zmierzony BEZPOŚREDNIO z kolo-karmy.png (blob-y
 *  nie dotykające krawędzi pudełka [715,400,870,550] — odrzuca fragmenty
 *  pierścienia w rogach), z poprawną dylatacją: blur tworzy miękką otoczkę
 *  wokół KAŻDEGO kształtu niezależnie od jego grubości (cienkie kreski typu
 *  "1" też dostają otoczkę), próg zamienia otoczkę z powrotem w twardy,
 *  powiększony kształt — bez tego cienkie kreski zostawały nietknięte. */
const NUMERY_MASKA = path.join(dir, "erase-numerologia-mask.png");

/** Ikony "wspólnych danych" (dom/klepsydra/gwiazda w trójkącie/postać) mają
 *  zostać złote ZAWSZE, niezależnie od stanu pierścieni — potwierdzone
 *  porównaniem z plikami referencyjnymi (nie należą do żadnego z trzech
 *  systemów z osobna). Maska: scripts/generate-shared-icons-mask.mjs. */
const SHARED_ICONS_MASKA = path.join(dir, "shared-icons-mask.png");

async function tauped(input) {
  return sharp(input).tint({ r: 0x8d, g: 0x81, b: 0x75 }).modulate({ brightness: 0.82 });
}

/** Przywraca oryginalne (złote) piksele kolo-karmy.png na wierzchu
 *  odbarwionego `input`, dokładnie w miejscach wskazanych przez
 *  SHARED_ICONS_MASKA (dest-in na kopii oryginału, potem zwykłe "over"). */
async function przywrocWspolneIkony(input) {
  const oryginalneWMasce = await sharp(basePath)
    .composite([{ input: SHARED_ICONS_MASKA, blend: "dest-in" }])
    .png()
    .toBuffer();
  return sharp(await input.toBuffer()).composite([{ input: oryginalneWMasce, blend: "over" }]);
}

async function wytnijMaska(input, maskPathOrBuffer) {
  return sharp(await input.toBuffer()).composite([{ input: maskPathOrBuffer, blend: "dest-out" }]);
}

async function wytnijKompas(input) {
  const { cx, cy, r, feather } = KOMPAS_DZIURA;
  const svg = `<svg width="${IMG_W}" height="${IMG_H}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/>
  </svg>`;
  const mask = await sharp(Buffer.from(svg)).blur(feather).png().toBuffer();
  return wytnijMaska(input, mask);
}

async function wytnijDlon(input) {
  return wytnijMaska(input, DLON_MASKA);
}

async function wytnijNumery(input) {
  return wytnijMaska(input, NUMERY_MASKA);
}

async function main() {
  await przywrocWspolneIkony(await wytnijNumery(await wytnijDlon(await wytnijKompas(await tauped(basePath))))).then((s) => s.toFile(path.join(dir, "kolo-karmy-taupe.png")));
  await wytnijNumery(await wytnijDlon(await wytnijKompas(sharp(basePath)))).then((s) => s.toFile(path.join(dir, "kolo-karmy-gold-clean.png")));

  // icon-<id>.png (nakładki do pulsowania na hover, KoloKarmy.tsx
  // PIKTOGRAMY_PULSUJACE) leżą ZAWSZE w DOM, nie tylko na hover — w spoczynku
  // były niewidoczne, bo pokrywały się piksel w piksel ze złotym tłem. Odkąd
  // tło jest taupe, potrzebują własnej taupe wersji na domyślny stan.
  // Astrologia pominięta — kompas usunięty, zastąpiony przez MoonStars.tsx.
  for (const id of Object.keys(RINGS).filter((s) => s !== "astrologia")) {
    const iconPath = path.join(dir, `icon-${id}.png`);
    await tauped(iconPath).then((s) => s.toFile(path.join(dir, `icon-${id}-taupe.png`)));
  }

  // UWAGA: próba "naprawy" plecionki na skrzyżowaniach (wycinanie z maski
  // obszarów nachodzących na inne pierścienie) została COFNIĘTA — dwa
  // pasma o zbliżonym promieniu, krzyżujące się pod płytkim kątem, dają
  // DŁUGI łuk nakładania się, nie mały punkt, więc wycięcie całego pasma
  // robiło duże dziury w pierścieniu zamiast małej, niepozornej plecionki
  // z referencji (public/brand/chiromancja-1.jpg — tam pierścień systemu
  // jest CIĄGŁY). Prosty, pełny pierścień (jak tutaj) jest bliższy
  // referencji niż wersja z dziurami.
  for (const [id, { cx, cy, rOuter, rInner }] of Object.entries(RINGS)) {
    const strokeW = rOuter - rInner;
    const r = (rOuter + rInner) / 2;
    const svg = `<svg width="${IMG_W}" height="${IMG_H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#fff" stroke-width="${strokeW}"/>
    </svg>`;
    const mask = await sharp(Buffer.from(svg)).blur(FEATHER).png().toBuffer();
    await sharp(basePath)
      .composite([{ input: mask, blend: "dest-in" }])
      .toFile(path.join(dir, `fill-${id}-gold.png`));
  }

  console.log("Gotowe:", [
    "kolo-karmy-taupe.png",
    "kolo-karmy-gold-clean.png",
    ...Object.keys(RINGS).filter((s) => s !== "astrologia").map((s) => `icon-${s}-taupe.png`),
    ...Object.keys(RINGS).map((s) => `fill-${s}-gold.png`),
  ].join(", "));
}

main();
