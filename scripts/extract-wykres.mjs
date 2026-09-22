/**
 * Jednorazowy skrypt — wykres.jpg (schemat "Narodziny -> Czas/Miejsce/Ciało
 * -> Numerologia/Astrologia/Chiromancja -> Mahadasze/Karma/Astrokartografia
 * -> Kiedy? Gdzie? Co dalej?") ma białe linie/tekst na ciemnogranatowym tle.
 * Wycina biały rysunek do PNG z przezroczystością i przetania na --sand
 * (230,196,138), tak samo jak reszta złotych elementów strony.
 *
 * Uruchamiane lokalnie: `node scripts/extract-wykres.mjs`.
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "..", "public", "brand");
const src = path.join(dir, "wykres.jpg");

const ZLOTO = { r: 0xe6, g: 0xc4, b: 0x8a }; // --sand

const img = sharp(src).ensureAlpha();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

const out = Buffer.alloc(width * height * 4);
for (let i = 0; i < width * height; i++) {
  const si = i * channels;
  const r = data[si], g = data[si + 1], b = data[si + 2];
  // jasność jako alfa (białe linie/tekst -> nieprzezroczyste, ciemne tło -> przezroczyste)
  const lum = (r + g + b) / 3;
  const alpha = Math.max(0, Math.min(255, Math.round((lum - 60) * 1.8)));
  const oi = i * 4;
  out[oi] = ZLOTO.r; out[oi + 1] = ZLOTO.g; out[oi + 2] = ZLOTO.b; out[oi + 3] = alpha;
}

await sharp(out, { raw: { width, height, channels: 4 } })
  .png()
  .toFile(path.join(dir, "wykres-vesica-karma.png"));

console.log("wykres-vesica-karma.png zapisany");
