/**
 * Jednorazowy skrypt — wycina DWIE osobne, pojedyncze dlonie z
 * public/brand/icon-hiromancja.png (ktory ma obie dlonie razem, uzywane
 * na Kole Karmy). Kazda dlon dostaje wlasna etykiete skladowej (flood fill,
 * 8-spojnosc) — piksele NALEZACE do drugiej dloni sa zerowane, zeby przy
 * kadrowaniu nie zostal maly, obcy fragment palca w rogu wyciecia.
 *
 * Uzywane do: nowego, okraglego "medalionu" jednej dloni na /hiromancja
 * (wzor: public/brand/chiromancja-3.jpg / chiromancja-4.jpg).
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "..", "public", "brand");
const src = path.join(dir, "icon-hiromancja.png");

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

const label = new Int32Array(width * height).fill(-1);
const comps = [];

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = y * width + x;
    if (label[idx] !== -1) continue;
    const a = data[idx * channels + 3];
    if (a < 50) continue;
    const compId = comps.length;
    let minX = x, maxX = x, minY = y, maxY = y, count = 0;
    const stack = [idx];
    label[idx] = compId;
    while (stack.length) {
      const cur = stack.pop();
      const cx = cur % width, cy = Math.floor(cur / width);
      count++;
      if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
      for (const [nx, ny] of [[cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1],[cx-1,cy-1],[cx+1,cy+1],[cx-1,cy+1],[cx+1,cy-1]]) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const nidx = ny * width + nx;
        if (label[nidx] !== -1) continue;
        const na = data[nidx * channels + 3];
        if (na < 50) continue;
        label[nidx] = compId;
        stack.push(nidx);
      }
    }
    comps.push({ minX, maxX, minY, maxY, count });
  }
}

const big = comps.filter((c) => c.count > 20);
console.log("components:", big);

// Tylko dolna dlon (indeks 1) — juz w orientacji zgodnej ze wzorem
// (chiromancja-3.jpg): kciuk w lewym dolnym rogu, palce ku gorze-w prawo.
// Gorna kladziemy w lustrzane odbicie dla prawej dloni (chiromancja-4.jpg:
// kciuk w prawym dolnym rogu) — anatomicznie poprawne zwierciadlo, zamiast
// osobnej, niepasujacej geometrii drugiej wyciete dloni ze zrodla.
const PAD = 6;
const c = big[1];
const left = Math.max(0, c.minX - PAD);
const top = Math.max(0, c.minY - PAD);
const right = Math.min(width, c.maxX + PAD);
const bottom = Math.min(height, c.maxY + PAD);
const w = right - left, h = bottom - top;

const out = Buffer.alloc(w * h * 4);
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const srcIdx = (top + y) * width + (left + x);
    const oi = (y * w + x) * 4;
    if (label[srcIdx] === 1) {
      const si = srcIdx * channels;
      out[oi] = data[si]; out[oi + 1] = data[si + 1]; out[oi + 2] = data[si + 2]; out[oi + 3] = data[si + 3];
    }
    // else zostaje przezroczyste — usuwa obcy fragment drugiej dloni
  }
}

const rotated = sharp(out, { raw: { width: w, height: h, channels: 4 } })
  .rotate(18, { background: { r: 0, g: 0, b: 0, alpha: 0 } });

await rotated.clone().png().toFile(path.join(dir, "icon-dlon-lewa.png"));
await rotated.clone().flop().png().toFile(path.join(dir, "icon-dlon-prawa.png"));

console.log("icon-dlon-lewa.png / icon-dlon-prawa.png zapisane");
