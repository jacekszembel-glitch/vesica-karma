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

async function tauped(input) {
  return sharp(input).tint({ r: 0x8d, g: 0x81, b: 0x75 }).modulate({ brightness: 0.82 });
}

async function main() {
  await tauped(basePath).then((s) => s.toFile(path.join(dir, "kolo-karmy-taupe.png")));

  // icon-<id>.png (nakładki do pulsowania na hover, KoloKarmy.tsx
  // PIKTOGRAMY_PULSUJACE) leżą ZAWSZE w DOM, nie tylko na hover — w spoczynku
  // były niewidoczne, bo pokrywały się piksel w piksel ze złotym tłem. Odkąd
  // tło jest taupe, potrzebują własnej taupe wersji na domyślny stan.
  for (const id of Object.keys(RINGS)) {
    const iconPath = path.join(dir, `icon-${id}.png`);
    await tauped(iconPath).then((s) => s.toFile(path.join(dir, `icon-${id}-taupe.png`)));
  }

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
    ...Object.keys(RINGS).map((s) => `icon-${s}-taupe.png`),
    ...Object.keys(RINGS).map((s) => `fill-${s}-gold.png`),
  ].join(", "));
}

main();
