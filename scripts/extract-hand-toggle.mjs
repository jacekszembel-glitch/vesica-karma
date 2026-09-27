/**
 * Jednorazowy skrypt — wycina PRAWDZIWE piksele przelacznika Lewa/Prawa
 * z public/brand/chiromanca-2.jpg (dwusegmentowa pigulka pod "Ktora reka
 * piszesz?"), zamiast odtwarzac go plaskimi kolorami CSS.
 *
 * Zrodlo pokazuje TYLKO jeden stan (Prawa aktywna, zlota; Lewa nieaktywna,
 * taupe) — to zapisujemy 1:1 jako toggle-prawa-aktywna.png. Dla drugiego
 * stanu (Lewa aktywna) nie ma osobnego zrodlowego zrzutu, wiec zamiast
 * zgadywac uklad od zera: bierzemy te same, realne piksele polowek
 * (ksztalt pigulki, czcionka, odstepy — bez zmian) i podmieniamy TYLKO
 * kolor wypelnienia (taupe<->zloto) tam, gdzie piksel jest blisko
 * jednego z dwoch znanych, dokladnie zmierzonych kolorow wypelnienia —
 * tekst (ciemnogranatowy, daleko od obu kolorow wypelnienia) zostaje
 * nietkniety. To rekolorowanie prawdziwego wyciecia, nie rysowanie od nowa.
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "..", "public", "brand");
const src = path.join(dir, "chiromanca-2.jpg");

// Dokladne granice pigulki, znalezione profilem gestosci jasnych pikseli
// (wiersze 24-47 wzgledem crop top=295 => pigulka), potem kolumnowo w tym
// przedziale wierszy (patrz notatka w konwersacji — nie zgadywane na oko).
const PILL = { left: 258, top: 319, width: 327, height: 24 };
const MID = Math.round(PILL.width / 2); // granica Lewa/Prawa w polowie pigulki

const TAUPE = { r: 140, g: 127, b: 111 };
const GOLD = { r: 253, g: 232, b: 149 };
const TOLERANCJA = 40; // odleglosc euklidesowa w RGB — dosc waska, zeby nie zlapac tekstu

function dist(r, g, b, c) {
  return Math.sqrt((r - c.r) ** 2 + (g - c.g) ** 2 + (b - c.b) ** 2);
}

const { data, info } = await sharp(src).extract(PILL).raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

// Narzedzie do mockupow zostawilo w zrodle cienka niebieska linie-prowadnice
// (nie czesc realnego projektu — ten sam artefakt widoczny na wszystkich
// zrzutach chiromancja-*.jpg). Usuwamy ja, kopiujac czysty piksel z wiersza
// nizej, zamiast zgadywac kolor wypelnienia w tym miejscu.
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * channels;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (b > 150 && b > r + 40 && b > g + 40 && y + 1 < height) {
      const below = ((y + 1) * width + x) * channels;
      data[i] = data[below]; data[i + 1] = data[below + 1]; data[i + 2] = data[below + 2];
    }
  }
}

// Stan 1: dokladnie to, co jest w zrodle (Prawa=zlota, Lewa=taupe) — zero zmian.
await sharp(data, { raw: { width, height, channels } })
  .png()
  .toFile(path.join(dir, "toggle-prawa-aktywna.png"));

// Stan 2: te same piksele, ale z podmienionym kolorem wypelnienia w kazdej polowce.
const swapped = Buffer.from(data);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * channels;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (x < MID) {
      // lewa polowka: taupe -> zloto
      if (dist(r, g, b, TAUPE) < TOLERANCJA) {
        swapped[i] = GOLD.r; swapped[i + 1] = GOLD.g; swapped[i + 2] = GOLD.b;
      }
    } else {
      // prawa polowka: zloto -> taupe
      if (dist(r, g, b, GOLD) < TOLERANCJA) {
        swapped[i] = TAUPE.r; swapped[i + 1] = TAUPE.g; swapped[i + 2] = TAUPE.b;
      }
    }
  }
}

await sharp(swapped, { raw: { width, height, channels } })
  .png()
  .toFile(path.join(dir, "toggle-lewa-aktywna.png"));

console.log("toggle-prawa-aktywna.png / toggle-lewa-aktywna.png zapisane", { width, height, MID });
