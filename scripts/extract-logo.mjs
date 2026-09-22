/**
 * Jednorazowy skrypt — wycina wordmark "vesicakarma.com" z dostarczonego
 * zdjęcia (public/brand/logo vesicakarma.jpg, jednolite ciemne tło + jasny
 * tekst) do PNG z przezroczystością, przycięty ciasno do samego tekstu.
 * Ten sam wzorzec co reszta assetów w public/brand (prawdziwe piksele,
 * nie odrysowywanie fontem) — tło z tła jpg-a nie jest identyczne z
 * --bg strony, więc jako zwykły prostokątny <img> dawałoby widoczną ramkę.
 *
 * Tekst w dostarczonym zdjęciu jest w tym samym jaśniejszym, "żółtym"
 * tonie co pierwotny pierścień (~253,232,147) — przeskalowany tu do
 * --sand (230,196,138), tego samego złota co reszta koła po
 * recolor-source-to-gold.mjs.
 *
 * Uruchamiane lokalnie: `node scripts/extract-logo.mjs`.
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "..", "public", "brand");
const src = path.join(dir, "logo vesicakarma.jpg");

const img = sharp(src).ensureAlpha();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

// Próbka tła z rogu, próg jasności oddziela tekst (dużo jaśniejszy) od tła.
const bg = [data[0], data[1], data[2]];
const OD = { r: 253, g: 232, b: 147 };
const DO = { r: 230, g: 196, b: 138 };
const wsp = { r: DO.r / OD.r, g: DO.g / OD.g, b: DO.b / OD.b };
const out = Buffer.alloc(width * height * 4);
let minX = width, maxX = 0, minY = height, maxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * channels;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const dist = Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2]);
    const alpha = Math.max(0, Math.min(255, Math.round((dist - 20) * 3)));
    const oi = (y * width + x) * 4;
    out[oi] = Math.min(255, Math.round(r * wsp.r));
    out[oi + 1] = Math.min(255, Math.round(g * wsp.g));
    out[oi + 2] = Math.min(255, Math.round(b * wsp.b));
    out[oi + 3] = alpha;
    if (alpha > 20) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
}

const pad = 4;
const box = {
  left: Math.max(0, minX - pad), top: Math.max(0, minY - pad),
  width: Math.min(width, maxX + pad) - Math.max(0, minX - pad),
  height: Math.min(height, maxY + pad) - Math.max(0, minY - pad),
};

await sharp(out, { raw: { width, height, channels: 4 } })
  .extract(box)
  .png()
  .toFile(path.join(dir, "logo-vesicakarma.png"));

console.log("logo-vesicakarma.png zapisany, wymiary:", box.width, "x", box.height);
