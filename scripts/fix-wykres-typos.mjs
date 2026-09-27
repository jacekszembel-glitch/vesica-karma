/**
 * Jednorazowy skrypt — poprawia literowke wpisana bezposrednio jako piksele
 * w public/brand/wykres.jpg: "NARIDZNY" -> "NARODZINY". ("CHIROMANCJA" na
 * diagramie byla od poczatku poprawna — polska nazwa tej praktyki pisze sie
 * przez "ch", nie przez samo "h".) Obraz jest rastrowy (recznie rysowany), wiec zamiast
 * edytowac tekst wprost: wycina stary napis (wypelnia lokalnym tlem
 * zmierzonym tuz obok, w bezpiecznym miejscu wewnatrz elipsy, z dala od jej
 * obwodki), po czym dorysowuje nowy napis przez SVG (font Segoe Print,
 * zblizony do odrecznego stylu reszty diagramu) z textLength dopasowanym do
 * szerokosci wycietego miejsca. Zatka ma dwie warstwy tla — wieksza rozmyta
 * (miekkie przejscie w otoczenie) i mniejsza twarda (dokladnie na sprawdzonym
 * bezpiecznym prostokacie, zeby nigdzie nie przeswitywal stary napis).
 *
 * Widoczny na jpg-u lekki szew wokol zatki znika calkowicie po przejsciu
 * przez extract-wykres.mjs — ono i tak zamienia kazdy ciemny (lum<60) piksel
 * na w pelni przezroczysty, wiec drobne roznice odcienia tla nie maja
 * znaczenia w finalnym, zlotym PNG uzywanym na stronie.
 *
 * Uruchamiane lokalnie: `node scripts/fix-wykres-typos.mjs`, a nastepnie
 * `node scripts/extract-wykres.mjs`, zeby przeliczyc zloty PNG uzywany na
 * stronie.
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "..", "public", "brand");
const src = path.join(dir, "wykres.jpg");

async function avgColor(box) {
  const { data, info } = await sharp(src).extract(box).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let r = 0, g = 0, b = 0, n = width * height;
  for (let i = 0; i < n; i++) {
    const si = i * channels;
    r += data[si]; g += data[si + 1]; b += data[si + 2];
  }
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

// Dwie warstwy zatki: wieksza, rozmyta (na miekkie przejscie w tlo, tam gdzie
// juz na pewno nie ma liter), i mniejsza, twarda (dokladnie na sprawdzonym
// bezpiecznym prostokacie, zeby nigdzie nie prześwitywal stary napis) — obie
// tego samego koloru tla, potem tekst na wierzchu.
function patchSvg({ width, height, pad, bg, text, fontSize, textLength, fill }) {
  const w = width + pad * 2, h = height + pad * 2;
  const softPad = 5;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs>
        <filter id="soften" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <rect x="${pad - softPad}" y="${pad - softPad}" width="${width + softPad * 2}" height="${height + softPad * 2}"
        fill="rgb(${bg.r},${bg.g},${bg.b})" filter="url(#soften)" />
      <rect x="${pad}" y="${pad}" width="${width}" height="${height}"
        fill="rgb(${bg.r},${bg.g},${bg.b})" />
      <text x="${w / 2}" y="${pad + height * 0.82}" text-anchor="middle"
        font-family="Segoe Print" font-weight="bold" font-size="${fontSize}"
        textLength="${textLength}" lengthAdjust="spacingAndGlyphs"
        fill="rgb(${fill.r},${fill.g},${fill.b})">${text}</text>
    </svg>`
  );
}

// left przesuniety z 318 na 277: pierwsza proba centrowala tekst w dowolnie
// dobranym prostokacie, nie w prawdziwym srodku elipsy (zmierzony lewy/prawy
// brzeg elipsy w tej linii tekstu: x=227 i x=616, srodek=421.5) — stad napis
// wychodzil widocznie przesuniety w prawo wzgledem pola. Teraz box ma ten sam
// srodek co elipsa: 277+290/2=422.
const PAD = 14;
const NARIDZNY_BOX = { left: 277, top: 149, width: 290, height: 33 };

const bgNaridzny = await avgColor({ left: 277, top: 138, width: 290, height: 6 });

const patchNaridzny = patchSvg({
  width: NARIDZNY_BOX.width, height: NARIDZNY_BOX.height, pad: PAD, bg: bgNaridzny,
  text: "NARODZINY", fontSize: 34, textLength: NARIDZNY_BOX.width * 0.95,
  fill: { r: 250, g: 248, b: 238 },
});

await sharp(src)
  .composite([
    { input: patchNaridzny, left: NARIDZNY_BOX.left - PAD, top: NARIDZNY_BOX.top - PAD },
  ])
  .jpeg({ quality: 95 })
  .toFile(path.join(dir, "wykres.fixed.jpg"));

console.log("wykres.fixed.jpg zapisany");
