/**
 * Jednorazowy skrypt — kolo-karmy.png (a więc CAŁY pierścień i wypalone w
 * nim ikony: dom/klepsydra/trójkąt-gwiazda/postać) miał jaśniejszy, bardziej
 * "żółty" odcień złota (~251,231,153) niż reszta strony (--sand: #e6c48a =
 * 230,196,138 — używany m.in. przez icon-hiromancja.png, czyli dłoń).
 * Użytkownik zgłosił zdjęciem: pierścień ma wyglądać "złoto" jak dłoń, nie
 * "żółto".
 *
 * sharp .tint() PRÓBOWANY najpierw — odrzucony: zachowuje oryginalną
 * (bardzo wysoką, ~212) jasność piksela i tylko dokłada barwę, więc na tak
 * jasnym pikselu wychodzi wyblakły, prawie biały kolor, nie złoto.
 *
 * Zamiast tego: proste przeskalowanie każdego kanału przez stały
 * współczynnik (peak oryginału -> peak --sand). Cień na skrzyżowaniach
 * pętli (ciemniejsze piksele) skaluje się proporcjonalnie razem z resztą,
 * więc zostaje cieniem w tym samym, nowym tonie — nie jest spłaszczany.
 *
 * kolo-karmy.png jest źródłem dla WSZYSTKICH innych assetów (taupe,
 * gold-clean, fill-<id>-gold, icon-*-taupe) — po tym skrypcie trzeba
 * odpalić ponownie recolor-kolo-karmy.mjs.
 *
 * Uruchamiane lokalnie: `node scripts/recolor-source-to-gold.mjs`.
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "..", "public", "brand");
const src = path.join(dir, "kolo-karmy.png");

// Zmierzony szczyt jasności pierścienia w kolo-karmy.png -> ten sam ton co
// dłoń (icon-hiromancja.png, --sand #e6c48a).
const OD = { r: 251, g: 231, b: 153 };
const DO = { r: 230, g: 196, b: 138 };
const wsp = { r: DO.r / OD.r, g: DO.g / OD.g, b: DO.b / OD.b };

const img = sharp(src).ensureAlpha();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
for (let i = 0; i < width * height; i++) {
  const o = i * channels;
  data[o] = Math.min(255, Math.round(data[o] * wsp.r));
  data[o + 1] = Math.min(255, Math.round(data[o + 1] * wsp.g));
  data[o + 2] = Math.min(255, Math.round(data[o + 2] * wsp.b));
}
await sharp(data, { raw: { width, height, channels } }).png().toFile(src);

console.log("kolo-karmy.png przeskalowany do tonu --sand (#e6c48a)");
