/**
 * Jednorazowy skrypt (Faza 1 reskinu VesicaKarma) — generuje z istniejącego
 * public/brand/kolo-karmy.png dwa nowe zestawy assetów:
 *   1) kolo-karmy-taupe.png — cała grafika odbarwiona do stonowanego taupe
 *      (nowy domyślny stan „nieukończony"), przez sharp .tint().
 *   2) fill-<id>-gold.png (dla astrologia/hiromancja/numerologia) — oryginalne
 *      (złote) piksele kolo-karmy.png przycięte maską = bounding box płatka
 *      (te same współrzędne `gap`, co już używane w KoloKarmy.tsx do hover-
 *      hitboxów — HOTSPOTY[i].gap), z rozmytymi (feather) krawędziami, żeby
 *      przejście do taupe było miękkie, nie ostrą krechą.
 *
 *      UWAGA: NIE używamy tu glow-<id>.png — te maski są flood-fillem
 *      WNĘTRZA płatka (do miękkiej poświaty na hover, zatrzymują się PRZED
 *      złotą linią pierścienia), więc nałożone na oryginalne kolo-karmy.png
 *      dają nieomal pustkę (nie pokrywają się ze złotymi pikselami pierścienia).
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

/** Te same współrzędne co HOTSPOTY[].gap w components/KoloKarmy.tsx. */
const GAPY = {
  astrologia: [428, 85, 765, 254],
  hiromancja: [325, 300, 559, 605],
  numerologia: [633, 301, 867, 606],
};
const FEATHER = 26;

async function tauped(input) {
  return sharp(input).tint({ r: 0x8d, g: 0x81, b: 0x75 }).modulate({ brightness: 0.82 });
}

async function main() {
  await tauped(basePath).then((s) => s.toFile(path.join(dir, "kolo-karmy-taupe.png")));

  // icon-<id>.png (nakładki do pulsowania na hover, KoloKarmy.tsx
  // PIKTOGRAMY_PULSUJACE) leżą ZAWSZE w DOM, nie tylko na hover — w spoczynku
  // były niewidoczne, bo pokrywały się piksel w piksel ze złotym tłem. Odkąd
  // tło jest taupe, potrzebują własnej taupe wersji na domyślny stan.
  for (const id of Object.keys(GAPY)) {
    const iconPath = path.join(dir, `icon-${id}.png`);
    await tauped(iconPath).then((s) => s.toFile(path.join(dir, `icon-${id}-taupe.png`)));
  }

  for (const [id, [x0, y0, x1, y1]] of Object.entries(GAPY)) {
    const svg = `<svg width="${IMG_W}" height="${IMG_H}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="20" fill="#fff"/>
    </svg>`;
    const mask = await sharp(Buffer.from(svg)).blur(FEATHER).png().toBuffer();
    await sharp(basePath)
      .composite([{ input: mask, blend: "dest-in" }])
      .toFile(path.join(dir, `fill-${id}-gold.png`));
  }

  console.log("Gotowe:", [
    "kolo-karmy-taupe.png",
    ...Object.keys(GAPY).map((s) => `icon-${s}-taupe.png`),
    ...Object.keys(GAPY).map((s) => `fill-${s}-gold.png`),
  ].join(", "));
}

main();
