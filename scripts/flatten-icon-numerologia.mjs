/**
 * Jednorazowy skrypt — icon-numerologia.png miał cztery cyfry (7, 5, 3, 1)
 * w czterech RÓŻNYCH odcieniach złota (od jasnego 7 po szarawo-fioletową 1),
 * widoczne szczególnie na taupe (gdzie tint()+modulate() tylko pogłębiał
 * różnicę). Ten skrypt spłaszcza wszystkie cyfry do jednego, płaskiego
 * koloru — kształt (alfa/antyaliasing) zostaje nietknięty, zmienia się
 * tylko wypełnienie. icon-numerologia-taupe.png powstaje z tego pliku przez
 * tauped() w recolor-kolo-karmy.mjs, więc wystarczy przegenerować ten jeden
 * plik źródłowy i odpalić recolor-kolo-karmy.mjs ponownie.
 *
 * Kolor musi dokładnie zgadzać się z realnym złotem pierścieni w
 * kolo-karmy.png (recolor-source-to-gold.mjs przeskalował je do --sand,
 * #e6c48a = 230,196,138) — inaczej po tauped() cyfry wychodzą innym
 * odcieniem taupe niż same pierścienie.
 *
 * Uruchamiane lokalnie: `node scripts/flatten-icon-numerologia.mjs`.
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "..", "public", "brand");
const src = path.join(dir, "icon-numerologia.png");

const ZLOTO = { r: 0xe6, g: 0xc4, b: 0x8a }; // --sand, ten sam ton co pierścienie po recolor-source-to-gold.mjs

const original = await sharp(src).ensureAlpha().toBuffer();
const { width, height } = await sharp(original).metadata();
const flatColor = await sharp({
  create: { width, height, channels: 4, background: { ...ZLOTO, alpha: 1 } },
}).png().toBuffer();

await sharp(flatColor)
  .composite([{ input: original, blend: "dest-in" }])
  .toFile(path.join(dir, "icon-numerologia.png"));

console.log("icon-numerologia.png spłaszczony do jednego koloru (#e6c48a)");
