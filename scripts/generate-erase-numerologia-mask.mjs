/**
 * Jednorazowy skrypt — generuje public/brand/erase-numerologia-mask.png,
 * używaną przez scripts/recolor-kolo-karmy.mjs (NUMERY_MASKA) do wycięcia
 * starych cyfr "375"/"1" z bazowych obrazków.
 *
 * Dwie ślepe uliczki po drodze, zanim to zadziałało:
 *  1) icon-numerologia.png NIE jest pixel-aligned z kolo-karmy.png (osobno
 *     wyeksportowany asset) — maska z jego kształtu dawała tylko częściowe
 *     wycięcie ("duchy" starych cyfr w tle).
 *  2) Maska zbudowana z surowego bufora pikseli (Buffer.alloc + raw→PNG)
 *     nie działa z blendem "dest-out" w sharp (powód nieznany — wygląda
 *     identycznie po stronie wizualnej, composite z "over" pokazuje ją
 *     poprawnie, ale "dest-out" nic nie usuwa). Maska wyrenderowana z SVG
 *     (nawet trywialny <rect>) działa bezbłędnie — stąd tu run-length
 *     encoding zajętej siatki na <rect> per wiersz, zamiast surowego bufora.
 *
 * Uruchamiane lokalnie: `node scripts/generate-erase-numerologia-mask.mjs`.
 */
import sharp from "sharp";
import path from "path";

const dir = path.resolve("public/brand");
const IMG_W = 1260, IMG_H = 761;
const box = [715, 400, 870, 550];
const [x0, y0, x1, y1] = box;
const boxW = x1 - x0, boxH = y1 - y0;

// 1) measure real digit pixels directly from kolo-karmy.png (NOT from
//    icon-numerologia.png — confirmed not pixel-aligned)
const full = sharp(path.join(dir, "kolo-karmy.png")).ensureAlpha();
const { data, info } = await full.clone().extract({ left: x0, top: y0, width: boxW, height: boxH }).raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

const visited = new Uint8Array(width * height);
const blobs = [];
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = y * width + x;
    if (visited[idx]) continue;
    const i = idx * channels;
    if (data[i + 3] <= 20) { visited[idx] = 1; continue; }
    const stack = [[x, y]];
    visited[idx] = 1;
    const pixels = [];
    let touchesEdge = false;
    while (stack.length) {
      const [cx, cy] = stack.pop();
      pixels.push([cx, cy]);
      if (cx === 0 || cy === 0 || cx === width - 1 || cy === height - 1) touchesEdge = true;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const nidx = ny * width + nx;
        if (visited[nidx]) continue;
        const ni = nidx * channels;
        if (data[ni + 3] <= 20) { visited[nidx] = 1; continue; }
        visited[nidx] = 1;
        stack.push([nx, ny]);
      }
    }
    blobs.push({ pixels, touchesEdge });
  }
}
const digitPixels = blobs.filter((b) => !b.touchesEdge).flatMap((b) => b.pixels);
console.log("digit pixel count:", digitPixels.length);

// 2) mark occupied grid (native canvas space), dilated by a simple pixel-grid
//    grow (iteratively expand into 4-neighbors N times) — pure boolean grid
//    math, no image buffers involved, so no premultiplication/profile risk.
const occ = new Uint8Array(IMG_W * IMG_H);
for (const [px, py] of digitPixels) {
  const nx = x0 + px, ny = y0 + py;
  occ[ny * IMG_W + nx] = 1;
}
const DILATE_STEPS = 8;
for (let step = 0; step < DILATE_STEPS; step++) {
  const next = Uint8Array.from(occ);
  for (let y = 0; y < IMG_H; y++) {
    for (let x = 0; x < IMG_W; x++) {
      const idx = y * IMG_W + x;
      if (occ[idx]) continue;
      if ((x > 0 && occ[idx - 1]) || (x < IMG_W - 1 && occ[idx + 1]) ||
          (y > 0 && occ[idx - IMG_W]) || (y < IMG_H - 1 && occ[idx + IMG_W])) {
        next[idx] = 1;
      }
    }
  }
  occ.set(next);
}

// 3) run-length encode each row into SVG <rect> elements — proven to work
//    with dest-out (unlike a hand-built raw-buffer PNG, for reasons not
//    fully understood — SVG-rasterized masks work reliably, raw ones don't).
let rects = "";
for (let y = 0; y < IMG_H; y++) {
  let runStart = -1;
  for (let x = 0; x <= IMG_W; x++) {
    const on = x < IMG_W && occ[y * IMG_W + x];
    if (on && runStart === -1) runStart = x;
    if (!on && runStart !== -1) {
      rects += `<rect x="${runStart}" y="${y}" width="${x - runStart}" height="1" fill="#fff"/>`;
      runStart = -1;
    }
  }
}
const svg = `<svg width="${IMG_W}" height="${IMG_H}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
const maskPng = await sharp(Buffer.from(svg)).blur(1.5).png().toBuffer();
await sharp(maskPng).toFile(path.join(dir, "erase-numerologia-mask.png"));
console.log("erase-numerologia-mask.png written (SVG rect method)");
