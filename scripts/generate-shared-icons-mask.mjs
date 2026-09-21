/**
 * Ikony "wspólnych danych" (dom=gdzie, klepsydra=kiedy, trójkąt+gwiazda w
 * środku, postać=kto — DANE_WSPOLNE + Panel w KoloKarmy.tsx) mają zostać
 * ZŁOTE ZAWSZE, niezależnie od stanu pierścieni systemów (potwierdzone
 * porównaniem z plikami referencyjnymi użytkownika — te ikony to dane
 * wspólne dla wszystkich trzech systemów, nie należą do żadnego z osobna).
 *
 * kolo-karmy-taupe.png tintuje CAŁY obraz jednolicie, więc te 4 elementy
 * też wychodziły taupe — błąd. Ten skrypt: izoluje kształt każdej ikony
 * (connected components w jej bounding boxie z KoloKarmy.tsx, odrzuca
 * fragmenty pierścienia dotykające krawędzi kadru — ta sama metoda co
 * dłoń/cyfry), zapisuje maskę SVG-em (niezawodne z dest-in/dest-out,
 * w przeciwieństwie do surowego bufora pikseli), i nakłada ORYGINALNE
 * (złote) piksele z powrotem na kolo-karmy-taupe.png dokładnie w tych
 * miejscach.
 */
import sharp from "sharp";
import path from "path";

const dir = path.resolve("public/brand");
const IMG_W = 1260, IMG_H = 761;

const BOXY = {
  gdzie: [429, 267, 560, 389],
  kiedy: [632, 267, 764, 391],
  panel: [536, 307, 656, 427],
  kto: [529, 452, 663, 571],
};

async function izolujIkone(box) {
  const [x0, y0, x1, y1] = box;
  const w = x1 - x0, h = y1 - y0;
  const full = sharp(path.join(dir, "kolo-karmy.png")).ensureAlpha();
  const { data, info } = await full.clone().extract({ left: x0, top: y0, width: w, height: h }).raw().toBuffer({ resolveWithObject: true });
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
  // keep ALL non-edge blobs (triangle+star = several disconnected pieces:
  // outline, star, maybe hatching) — not just the largest one
  const keep = blobs.filter((b) => !b.touchesEdge && b.pixels.length > 3).flatMap((b) => b.pixels);
  return keep.map(([px, py]) => [x0 + px, y0 + py]);
}

const allPixels = [];
for (const box of Object.values(BOXY)) {
  allPixels.push(...(await izolujIkone(box)));
}
console.log("total icon pixels:", allPixels.length);

const occ = new Uint8Array(IMG_W * IMG_H);
for (const [nx, ny] of allPixels) occ[ny * IMG_W + nx] = 1;
// light dilate (2 steps) to fully cover anti-aliased edges
for (let step = 0; step < 2; step++) {
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
const maskPng = await sharp(Buffer.from(svg)).blur(1).png().toBuffer();
await sharp(maskPng).toFile(path.join(dir, "shared-icons-mask.png"));
console.log("shared-icons-mask.png written");
