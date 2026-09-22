/**
 * Wycina prawdziwy kształt księżyca+gwiazd z public/brand/astonomia.jpg
 * (dedykowany plik referencyjny) jako obraz rastrowy z przezroczystością —
 * NIE jako narysowane przez Claude kształty SVG (to było odrzucone: user
 * chce dokładnie to, co jest w pliku, nie przybliżenie). Ten sam wzorzec
 * co public/brand/icon-hiromancja.png z dlon.jpg.
 *
 * Generuje moonstars-gold.png i moonstars-taupe.png (tint jak reszta
 * assetów stanu ukończenia), wstawiane jako zwykły <img> w MoonStars.tsx
 * zamiast rysowanego SVG.
 */
import sharp from "sharp";
import path from "path";

const dir = path.resolve("public/brand");
const srcPath = path.join(dir, "astonomia.jpg");

const img = sharp(srcPath);
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

function isBright(x, y) {
  const i = (y * width + x) * channels;
  const r = data[i], g = data[i + 1], b = data[i + 2];
  return (r + g + b) / 3 > 140 && (r - b) > 40 && g > 110;
}

// connected components; keep only blobs that DON'T touch the crop edges —
// those are the ring/house/hourglass icon fragments bleeding in at the
// borders, the moon+stars sit safely in the interior.
const visited = new Uint8Array(width * height);
const blobs = [];
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = y * width + x;
    if (visited[idx] || !isBright(x, y)) { visited[idx] = 1; continue; }
    const stack = [[x, y]];
    visited[idx] = 1;
    const pixels = [];
    let touchesEdge = false;
    while (stack.length) {
      const [cx, cy] = stack.pop();
      pixels.push([cx, cy]);
      if (cx <= 1 || cy <= 1 || cx >= width - 2 || cy >= height - 2) touchesEdge = true;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const nidx = ny * width + nx;
        if (visited[nidx] || !isBright(nx, ny)) { if (nx >= 0 && nx < width && ny >= 0 && ny < height) visited[nidx] = 1; continue; }
        visited[nidx] = 1;
        stack.push([nx, ny]);
      }
    }
    blobs.push({ pixels, touchesEdge });
  }
}
const keepPixels = blobs.filter((b) => !b.touchesEdge && b.pixels.length > 3).flatMap((b) => b.pixels);
console.log("kept pixel count:", keepPixels.length, "from", blobs.length, "blobs");

let minX = width, minY = height, maxX = 0, maxY = 0;
for (const [x, y] of keepPixels) {
  if (x < minX) minX = x; if (x > maxX) maxX = x;
  if (y < minY) minY = y; if (y > maxY) maxY = y;
}
console.log("content bbox:", minX, minY, maxX, maxY);

// build clean RGBA buffer with original colors preserved, przeskalowane do
// tego samego złota co reszta koła (recolor-source-to-gold.mjs) — zdjęcie
// referencyjne miało jaśniejszy, bardziej żółty ton (~255,238,151) niż
// --sand (230,196,138); user zgłosił, że gwiazdy/księżyc zostały żółte
// mimo przetonowania pierścienia.
const OD = { r: 255, g: 238, b: 151 };
const DO = { r: 230, g: 196, b: 138 };
const wsp = { r: DO.r / OD.r, g: DO.g / OD.g, b: DO.b / OD.b };
const clean = Buffer.alloc(width * height * 4);
for (const [x, y] of keepPixels) {
  const si = (y * width + x) * channels;
  const di = (y * width + x) * 4;
  clean[di] = Math.min(255, Math.round(data[si] * wsp.r));
  clean[di + 1] = Math.min(255, Math.round(data[si + 1] * wsp.g));
  clean[di + 2] = Math.min(255, Math.round(data[si + 2] * wsp.b));
  clean[di + 3] = 255;
}
// slight blur+threshold to smooth jpeg-jagged edges into clean anti-aliasing
const cleanPng = await sharp(clean, { raw: { width, height, channels: 4 } })
  .blur(0.6)
  .png()
  .toBuffer();

const cropW = maxX - minX, cropH = maxY - minY;
const cropped = await sharp(cleanPng).extract({ left: minX, top: minY, width: cropW, height: cropH }).png().toBuffer();

// fit into the astrologia box space (native 337x169, same proportions as
// SEGMENT_GAPY.astrologia = [428,85,765,254]) with a little padding
const BOX_W = 337, BOX_H = 169, PAD = 6;
const fitW = BOX_W - PAD * 2, fitH = BOX_H - PAD * 2;
const scale = Math.min(fitW / cropW, fitH / cropH);
const outW = Math.round(cropW * scale), outH = Math.round(cropH * scale);
const resized = await sharp(cropped).resize({ width: outW, height: outH }).png().toBuffer();
const left = Math.round((BOX_W - outW) / 2);
const top = Math.round((BOX_H - outH) / 2);

const goldAsset = await sharp({ create: { width: BOX_W, height: BOX_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: resized, left, top }])
  .png()
  .toBuffer();
await sharp(goldAsset).toFile(path.join(dir, "moonstars-gold.png"));

const taupeAsset = await sharp(goldAsset).tint({ r: 0x47, g: 0x41, b: 0x3b }).modulate({ brightness: 0.41 }).png().toBuffer();
await sharp(taupeAsset).toFile(path.join(dir, "moonstars-taupe.png"));

console.log("written moonstars-gold.png + moonstars-taupe.png", { outW, outH, left, top });
