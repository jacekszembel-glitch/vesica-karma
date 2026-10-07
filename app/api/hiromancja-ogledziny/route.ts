import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { checkRate, clientIp } from "@/lib/ratelimit";
import { dloniSchema, blokiReki, ogledziny } from "@/lib/hiromancjaAI";
import { folderKalibracji, zapiszTekst, zapiszZdjecia } from "@/lib/kalibracja";

/**
 * KROK 1 CHIROMANCJI — „co AI widzi”: oględziny każdego zbliżenia osobno, a potem jedno
 * zestawienie wszystkich znaków i linii obu rąk jako lista (bez interpretacji). Osoba
 * sprawdza tę listę ze swoją dłonią, usuwa pomyłki, dopisuje brakujące — i dopiero z tą
 * listą idzie krok 2 (/api/hiromancja, pełny odczyt).
 * PRYWATNOŚĆ jak w /api/hiromancja: zdjęcia tylko w treści zapytania, nigdy w logach.
 */

export const runtime = "nodejs";
export const maxDuration = 300;

const client = new Anthropic();

const requestSchema = z.object({ wiodaca: dloniSchema, bierna: dloniSchema });

/** Wymuszony format odpowiedzi (structured outputs) — AI nie może odpowiedzieć prozą zamiast listy. */
const SCHEMAT_INWENTARZA = {
  type: "object",
  additionalProperties: false,
  required: ["znaki", "linie"],
  properties: {
    znaki: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["reka", "wzgorek", "znak", "pewnosc", "gdzie"],
        properties: {
          reka: { type: "string", enum: ["wiodaca", "bierna"] },
          wzgorek: { type: "string", enum: ["jowisz", "saturn", "slonce", "merkury", "wenus", "ksiezyc", "mars", "rahu", "ketu", "czworobok"] },
          znak: { type: "string", enum: ["x", "gwiazda", "kwadrat", "trojkat", "kratka", "wyspa", "kreski", "kreski_drobne", "krzyz_mistyczny"] },
          pewnosc: { type: "string", enum: ["wyrazny", "delikatny"] },
          gdzie: { type: "string" },
        },
      },
    },
    linie: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["reka", "linia", "stan", "gdzie"],
        properties: {
          reka: { type: "string", enum: ["wiodaca", "bierna"] },
          linia: { type: "string", enum: ["zycia", "glowy", "serca", "losu", "slonca", "merkurego", "intuicji", "podrozy", "relacji", "pas_wenus", "pierscien_salomona", "marsa"] },
          stan: { type: "string", enum: ["wyrazna", "odcinkowa", "slaba"] },
          gdzie: { type: "string" },
        },
      },
    },
  },
};

const SYSTEM_INWENTARZ = `Jesteś okiem doświadczonego chiromanty. Dostajesz zdjęcia obu dłoni jednej osoby (całe zdjęcia i zbliżenia, podpisane) oraz wynik oględzin każdego zbliżenia pod lupą. Twoje jedyne zadanie: sporządzić INWENTARZ — listę znaków i linii, które są na dłoniach. Nic nie interpretujesz, nie opisujesz znaczeń.

Zasady:
- Wypisz wszystko, co widać na zdjęciach albo w oględzinach: znaki na wzgórkach i w czworoboku oraz linie. Rzeczy delikatne też wpisz — z "pewnosc":"delikatny".
- Każde przecięcie dwóch bruzd na wzgórku to X; trzy i więcej w jednym punkcie — gwiazda; krzyżyk w czworoboku między linią serca a głowy (także utworzony przez linię losu) — krzyż mistyczny; trójkąt między linią głowy a linią losu — trójkąt w czworoboku.
- Linia złożona z odcinków w jednym kierunku to ta linia ("stan":"odcinkowa"). Linii, których nie ma, nie wpisuj.
- Nie powtarzaj tego samego znaku dwa razy z różnych zbliżeń tej samej ręki.

Odpowiedz WYŁĄCZNIE jednym obiektem JSON, bez żadnego tekstu przed ani po:
{"znaki":[{"reka":"wiodaca|bierna","wzgorek":"jowisz|saturn|slonce|merkury|wenus|ksiezyc|mars|rahu|ketu|czworobok","znak":"x|gwiazda|kwadrat|trojkat|kratka|wyspa|kreski|kreski_drobne|krzyz_mistyczny","pewnosc":"wyrazny|delikatny","gdzie":"krótko, dokładne miejsce"}],
 "linie":[{"reka":"wiodaca|bierna","linia":"zycia|glowy|serca|losu|slonca|merkurego|intuicji|podrozy|relacji|pas_wenus|pierscien_salomona|marsa","stan":"wyrazna|odcinkowa|slaba","gdzie":"krótko, przebieg"}]}
(rahu = środek dłoni, ketu = nad nadgarstkiem między Wenus a Księżycem — wg chiromancji indyjskiej; "kreski" = pionowa linia na wzgórku, "kreski_drobne" = kilka małych pionowych kresek pod palcem).`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Oględziny są chwilowo niedostępne. Spróbuj później." }, { status: 503 });
  }
  const verdict = checkRate(clientIp(req));
  if (!verdict.ok) {
    return Response.json({ error: "Zbyt wiele zapytań. Wróć za kilka minut." }, {
      status: 429, headers: { "Retry-After": String(verdict.retryAfter) },
    });
  }
  let parsed;
  try {
    parsed = requestSchema.parse(await req.json());
  } catch {
    return Response.json({ error: "Nieprawidłowe dane wejściowe" }, { status: 400 });
  }

  // tylko localhost: zdjęcia i odpowiedzi AI do .kalibracji/ (lib/kalibracja.ts)
  const kal = folderKalibracji("ogledziny");
  zapiszZdjecia(kal, "wiodaca", parsed.wiodaca);
  zapiszZdjecia(kal, "bierna", parsed.bierna);

  try {
    const [w, b] = await Promise.all([
      ogledziny(client, "WIODĄCA", parsed.wiodaca.strefy),
      ogledziny(client, "BIERNA", parsed.bierna.strefy),
    ]);
    const ogledzinyTekst = [...w, ...b].join("\n\n");

    const msg = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high", format: { type: "json_schema", schema: SCHEMAT_INWENTARZA } },
      system: SYSTEM_INWENTARZ,
      messages: [{
        role: "user",
        content: [
          ...blokiReki("WIODĄCA", parsed.wiodaca),
          ...blokiReki("BIERNA", parsed.bierna),
          { type: "text", text: `OGLĘDZINY ZBLIŻEŃ POD LUPĄ:\n\n${ogledzinyTekst || "(brak zbliżeń)"}` },
        ],
      }],
    });
    const tekst = msg.content.filter((x) => x.type === "text").map((x) => x.text).join("");
    let wynik: { znaki?: unknown[]; linie?: unknown[] } = {};
    try {
      wynik = JSON.parse(tekst.slice(tekst.indexOf("{"), tekst.lastIndexOf("}") + 1));
    } catch {
      // np. zdjęcie bez dłoni albo urwana odpowiedź — pusta lista zamiast błędu; osoba może dopisać sama
      console.error("hiromancja-ogledziny: odpowiedź bez JSON, stop_reason =", msg.stop_reason);
    }
    zapiszTekst(kal, "ogledziny_zblizen.txt", ogledzinyTekst);
    zapiszTekst(kal, "lista_ai.json", JSON.stringify(wynik, null, 2));
    return Response.json(
      { znaki: Array.isArray(wynik.znaki) ? wynik.znaki : [], linie: Array.isArray(wynik.linie) ? wynik.linie : [], ogledzinyTekst },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("hiromancja-ogledziny error:", err); // NIGDY nie logować `parsed` — zawiera zdjęcia
    const dev = process.env.NODE_ENV === "development" ? ` [dev] ${(err as Error)?.message ?? String(err)}` : "";
    return Response.json({ error: "Nie udało się obejrzeć dłoni. Spróbuj ponownie." + dev }, { status: 502 });
  }
}
