/**
 * Jednorazowy skrypt — użytkownik zauważył, że dekoracyjne elementy tła
 * (gwiazdy, konstelacje) na wykres.jpg są stłoczone tylko w czterech rogach,
 * a puste marginesy obok środkowych trzech rzędów schematu (Czas/Miejsce/
 * Ciało -> Numerologia/Chiromancja/Astrologia -> Mahadasze/Karma/
 * Astrokartografia) wyglądają "za wąsko". Zamiast poszerzać wyświetlany
 * obrazek (co psuło układ strony), rozprowadza kopie dwóch prostych,
 * pojedynczych gwiazdek z lewego górnego rogu w te puste marginesy —
 * bez ruszania samego schematu (owale/strzałki/tekst) ani wymiarów płótna.
 *
 * Technika: każdą łatkę wycina jako surowe RGB, liczy alfę z jasności (ta
 * sama formuła co w extract-wykres.mjs — jasne linie nieprzezroczyste,
 * granatowe tło przezroczyste), obraca/skaluje jako PNG z przezroczystością,
 * po czym nakłada na docelowy obraz przez zwykłe blendowanie alfa —
 * bez widocznych prostokątnych krawędzi.
 *
 * Uruchamiane lokalnie: `node scripts/spread-wykres-decorations.mjs`.
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "..", "public", "brand");
const src = path.join(dir, "wykres.jpg");

async function extractPatchRGBA(buf, info, box) {
  const { width, channels } = info;
  const { left, top, width: w, height: h } = box;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = ((top + y) * width + (left + x)) * channels;
      const r = buf[si], g = buf[si + 1], b = buf[si + 2];
      const lum = (r + g + b) / 3;
      const alpha = Math.max(0, Math.min(255, Math.round((lum - 60) * 1.8)));
      const oi = (y * w + x) * 4;
      out[oi] = r; out[oi + 1] = g; out[oi + 2] = b; out[oi + 3] = alpha;
    }
  }
  return { data: out, width: w, height: h };
}

async function main() {
  const img = sharp(src).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const starA = await extractPatchRGBA(data, info, { left: 69, top: 35, width: 33, height: 39 });
  const starB = await extractPatchRGBA(data, info, { left: 231, top: 31, width: 20, height: 20 });

  // (patch, target left/top, obrót w stopniach, skala)
  const placements = [
    { patch: starA, left: 25, top: 330, rotate: 10, scale: 1 },
    { patch: starB, left: 35, top: 470, rotate: -15, scale: 1 },
    { patch: starA, left: 20, top: 610, rotate: 20, scale: 0.85 },
    { patch: starB, left: 40, top: 760, rotate: 5, scale: 1 },
    { patch: starA, left: 830, top: 350, rotate: -10, scale: 1 },
    { patch: starB, left: 835, top: 490, rotate: 15, scale: 1 },
    { patch: starA, left: 815, top: 630, rotate: -25, scale: 0.85 },
    { patch: starB, left: 840, top: 770, rotate: 8, scale: 1 },
  ];

  // Pracujemy na kopii surowego bufora obrazu docelowego (RGBA).
  const out = Buffer.from(data);

  for (const p of placements) {
    const rawPng = await sharp(p.patch.data, {
      raw: { width: p.patch.width, height: p.patch.height, channels: 4 },
    }).png().toBuffer();

    const targetW = Math.round(p.patch.width * p.scale);
    const targetH = Math.round(p.patch.height * p.scale);

    const { data: pdata, info: pinfo } = await sharp(rawPng)
      .resize(targetW, targetH)
      .rotate(p.rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    for (let y = 0; y < pinfo.height; y++) {
      const dy = p.top + y;
      if (dy < 0 || dy >= height) continue;
      for (let x = 0; x < pinfo.width; x++) {
        const dx = p.left + x;
        if (dx < 0 || dx >= width) continue;
        const si = (y * pinfo.width + x) * pinfo.channels;
        const alpha = pdata[si + 3] / 255;
        if (alpha <= 0) continue;
        const di = (dy * width + dx) * channels;
        out[di] = Math.round(pdata[si] * alpha + out[di] * (1 - alpha));
        out[di + 1] = Math.round(pdata[si + 1] * alpha + out[di + 1] * (1 - alpha));
        out[di + 2] = Math.round(pdata[si + 2] * alpha + out[di + 2] * (1 - alpha));
      }
    }
  }

  await sharp(out, { raw: { width, height, channels } })
    .jpeg({ quality: 95 })
    .toFile(src);

  console.log("wykres.jpg zaktualizowany — dekoracje rozprowadzone w marginesach");
}

main();
