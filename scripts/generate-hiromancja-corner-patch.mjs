/**
 * Łatka na jeden róg pierścienia Chiromancji (bbox [260,300,440,480] w
 * kolo-karmy.png), gdzie prawdziwy kształt pierścienia ma ostry zakręt
 * (nie gładki łuk) — geometryczne przybliżenie okręgiem w recolor-kolo-
 * karmy.mjs go tam nie odwzorowuje, dając widoczny (przy dużym zbliżeniu)
 * niedopasowany fade. Ta łatka to PRAWDZIWE piksele z kolo-karmy.png w tym
 * miejscu (z pominięciem obszaru dłoni — erase-hiromancja-mask.png),
 * dokładana na wierzch fill-hiromancja-gold.png. Miękkie przejście widoczne
 * w prawym górnym rogu łatki JEST w oryginalnym pliku (nie mój błąd) —
 * użyte tu wprost, bez prób "wyostrzenia".
 */
import sharp from "sharp";
import path from "path";

const dir = path.resolve("public/brand");
const IMG_W = 1260, IMG_H = 761;
const box = [260, 300, 440, 480];
const [x0, y0, x1, y1] = box;
const w = x1 - x0, h = y1 - y0;

const full = sharp(path.join(dir, "kolo-karmy.png")).ensureAlpha();
const { data, info } = await full.clone().extract({ left: x0, top: y0, width: w, height: h }).raw().toBuffer({ resolveWithObject: true });
const { channels } = info;

const handMask = sharp(path.join(dir, "erase-hiromancja-mask.png"));
const { data: hdata, info: hinfo } = await handMask.extract({ left: x0, top: y0, width: w, height: h }).raw().toBuffer({ resolveWithObject: true });
const hch = hinfo.channels;

const local = Buffer.alloc(w * h * 4);
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * channels;
    const hi = (y * w + x) * hch;
    const alpha = data[i + 3];
    const handAlpha = hch >= 4 ? hdata[hi + 3] : 0;
    if (alpha > 20 && handAlpha < 20) {
      const oi = (y * w + x) * 4;
      local[oi] = data[i]; local[oi + 1] = data[i + 1]; local[oi + 2] = data[i + 2]; local[oi + 3] = data[i + 3];
    }
  }
}

const patchNative = Buffer.alloc(IMG_W * IMG_H * 4);
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const li = (y * w + x) * 4;
    if (local[li + 3] === 0) continue;
    const ni = ((y0 + y) * IMG_W + (x0 + x)) * 4;
    patchNative[ni] = local[li]; patchNative[ni + 1] = local[li + 1];
    patchNative[ni + 2] = local[li + 2]; patchNative[ni + 3] = local[li + 3];
  }
}
await sharp(patchNative, { raw: { width: IMG_W, height: IMG_H, channels: 4 } })
  .png()
  .toFile(path.join(dir, "patch-hiromancja-corner.png"));
console.log("patch-hiromancja-corner.png written");
