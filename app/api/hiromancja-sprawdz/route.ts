import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { checkRate, clientIp } from "@/lib/ratelimit";

/**
 * SPRAWDZENIE ZDJĘCIA — szybki, tani wstępny krok przed pełnym odczytem
 * (app/api/hiromancja/route.ts): czy w ogóle widać dłoń, czy jest ostra,
 * czy mieści się w kadrze w całości, czy linie są przynajmniej częściowo
 * widoczne. NIE strumieniowe (jak pełny odczyt) — to krótka, jednorazowa
 * odpowiedź, więc zwykłe `messages.create`, bez ReadableStream.
 *
 * Osobny endpoint (nie parametr trybu w /api/hiromancja) — inny kształt
 * odpowiedzi (krótki werdykt, nie długi markdown) i inny cel (bramka przed
 * kosztownym pełnym odczytem, nie sama interpretacja). Współdzieli budżet
 * `checkRate` z resztą hiromancji — to świadomy kompromis v1 (patrz
 * hiromancja/route.ts).
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new Anthropic();

const requestSchema = z.object({
  imageBase64: z.string().min(100).max(2_000_000),
  imageMediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

const SYSTEM_PROMPT_SPRAWDZENIE = `Sprawdzasz TYLKO jakość zdjęcia dłoni pod kątem technicznym — NIE interpretujesz dłoni, nie mówisz nic o charakterze czy przyszłości.

Oceń cztery rzeczy:
1. Czy na zdjęciu w ogóle widać dłoń (wewnętrzną stronę, palce w dół lub w górę)?
2. Czy cała dłoń mieści się w kadrze (nie ucięte palce ani nadgarstek)?
3. Czy zdjęcie jest wystarczająco ostre, żeby dało się cokolwiek ocenić?
4. Czy widać przynajmniej częściowo linie na skórze dłoni (nie tylko sylwetkę)?

Odpowiedz WYŁĄCZNIE w tym formacie, bez niczego dodatkowego:
OCENA: OK albo PROBLEM
KOMENTARZ: jedno krótkie zdanie po polsku — jeśli PROBLEM, co dokładnie poprawić (np. "Nadgarstek jest ucięty, zrób zdjęcie z większej odległości"); jeśli OK, zostaw puste.`;

function sparsuj(tekst: string): { ok: boolean; komentarz: string | null } {
  const ocena = /OCENA:\s*(OK|PROBLEM)/i.exec(tekst)?.[1]?.toUpperCase();
  const komentarz = /KOMENTARZ:\s*(.*)/i.exec(tekst)?.[1]?.trim() || null;
  return { ok: ocena !== "PROBLEM", komentarz: ocena === "PROBLEM" ? komentarz : null };
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "Sprawdzanie zdjęć jest chwilowo niedostępne." }), { status: 503 });
  }

  const verdict = checkRate(clientIp(req));
  if (!verdict.ok) {
    return new Response(JSON.stringify({ error: "Zbyt wiele zapytań. Spróbuj za chwilę." }), {
      status: 429,
      headers: { "Retry-After": String(verdict.retryAfter), "Content-Type": "application/json" },
    });
  }

  let parsed;
  try {
    parsed = requestSchema.parse(await req.json());
  } catch {
    return new Response(JSON.stringify({ error: "Nieprawidłowe dane wejściowe" }), { status: 400 });
  }

  try {
    const msg = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 150,
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      system: SYSTEM_PROMPT_SPRAWDZENIE,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: parsed.imageMediaType, data: parsed.imageBase64 } },
            { type: "text", text: "Oceń to zdjęcie wg podanego formatu." },
          ],
        },
      ],
    });
    const tekst = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    return new Response(JSON.stringify(sparsuj(tekst)), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("hiromancja-sprawdz error:", err); // NIGDY nie logować `parsed` — zawiera zdjęcie
    // awaria sprawdzenia nie ma blokować użytkownika — po prostu nie pokazujemy werdyktu
    return new Response(JSON.stringify({ ok: true, komentarz: null }), { headers: { "Content-Type": "application/json" } });
  }
}
