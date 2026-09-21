/**
 * Regeneruje public/brand/erase-hiromancja-mask.png tą samą, sprawdzoną
 * metodą co scripts/generate-erase-numerologia-mask.mjs: pomiar kształtu
 * BEZPOŚREDNIO z kolo-karmy.png (nie z icon-hiromancja.png — assety osobno
 * eksportowane nie są pixel-aligned z bazą), dylatacja przez proste
 * rozszerzanie siatki boolean, maska renderowana z SVG (<rect> per wiersz)
 * zamiast surowego bufora pikseli — ten drugi nie działał niezawodnie
 * z blendem "dest-out" w sharp (patrz uwaga przy NUMERY_MASKA w
 * recolor-kolo-karmy.mjs). Pierwsza wersja tej maski (z raw bufora) była
 * niepełna — cienki kontur starej dłoni zostawał widoczny, ukryty tylko
 * dopóki nowa dłoń była większa; po zmniejszeniu nowej dłoni został odsłonięty.
 */
import sharp from "sharp";
import path from "path";

const dir = path.resolve("public/brand");
const IMG_W = 1260, IMG_H = 761;
const box = [340, 385, 490, 555];
const [x0, y0, x1, y1] = box;
const boxW = x1 - x0, boxH = y1 - y0;

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
// keep the largest non-edge-touching blob (the hand), discard tiny ring
// corner fragments
const nonEdge = blobs.filter((b) => !b.touchesEdge);
const hand = nonEdge.sort((a, b) => b.pixels.length - a.pixels.length)[0];
console.log("hand pixel count:", hand.pixels.length, "from", blobs.length, "blobs");

const occ = new Uint8Array(IMG_W * IMG_H);
for (const [px, py] of hand.pixels) {
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
await sharp(maskPng).toFile(path.join(dir, "erase-hiromancja-mask.png"));
console.log("erase-hiromancja-mask.png written (SVG rect method)");
