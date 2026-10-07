import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import type { DloniWejscie } from "./hiromancjaAI";

/**
 * KALIBRACJA AI CHIROMANCJI — tylko `next dev` (localhost). Zapisuje do .kalibracja/ (poza gitem)
 * zdjęcia, które przyszły do serwera, i to, co odpowiedziało AI, żeby porównać obserwacje
 * z prawdziwą dłonią i poprawiać polecenia. Na produkcji nic się nie zapisuje — tam zdjęcia
 * nigdy nie opuszczają treści zapytania.
 */

export const KALIBRACJA = process.env.NODE_ENV === "development";

/** Nowy folder na jedno wywołanie, np. .kalibracja/2026-10-08_14-03-22_ogledziny. */
export function folderKalibracji(rodzaj: string): string | null {
  if (!KALIBRACJA) return null;
  const t = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const nazwa = `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}_${p(t.getHours())}-${p(t.getMinutes())}-${p(t.getSeconds())}_${rodzaj}`;
  const folder = join(process.cwd(), ".kalibracja", nazwa);
  try { mkdirSync(folder, { recursive: true }); return folder; } catch { return null; }
}

const rozszerzenie = (typ: string) => (typ === "image/png" ? "png" : typ === "image/webp" ? "webp" : "jpg");

/** Całe zdjęcie ręki i jej zbliżenia (z podpisami w opisy.txt). */
export function zapiszZdjecia(folder: string | null, reka: "wiodaca" | "bierna", d: DloniWejscie): void {
  if (!folder) return;
  try {
    writeFileSync(join(folder, `${reka}_cala.${rozszerzenie(d.imageMediaType)}`), Buffer.from(d.imageBase64, "base64"));
    const opisy: string[] = [];
    (d.strefy ?? []).forEach((s, i) => {
      const plik = `${reka}_${String(i + 1).padStart(2, "0")}.jpg`;
      writeFileSync(join(folder, plik), Buffer.from(s.imageBase64, "base64"));
      opisy.push(`${plik}: ${s.opis}`);
    });
    if (opisy.length) writeFileSync(join(folder, `${reka}_opisy.txt`), opisy.join("\n"), "utf8");
  } catch (e) {
    console.error("kalibracja: nie zapisano zdjęć", (e as Error).message);
  }
}

export function zapiszTekst(folder: string | null, plik: string, tresc: string): void {
  if (!folder) return;
  try { writeFileSync(join(folder, plik), tresc, "utf8"); } catch { /* tylko dev — bez znaczenia dla odpowiedzi */ }
}
