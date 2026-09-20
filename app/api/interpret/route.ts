import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { checkRate, clientIp } from "@/lib/ratelimit";

/**
 * Endpoint interpretacji AI — okrojona wersja odpowiednika z 9dom: numerologia
 * i dopasowanie par (Guna Milan). VesicaKarma na razie nie ma kosmogramu/
 * astrokartografii jako osobnych kalkulatorów z własną interpretacją.
 * Zasada nr 1: Claude NIGDY nie liczy — dostaje gotowe, policzone dane jako
 * JSON i wyłącznie je interpretuje.
 */

export const runtime = "nodejs";
export const maxDuration = 120;

const client = new Anthropic(); // ANTHROPIC_API_KEY z env

const requestSchema = z.object({
  kind: z.enum(["numerologia", "numerologia-dziecko", "numerologia-finanse", "numerologia-rok", "para"]),
  /** Policzone dane z wyliczeń — deterministyczne, gotowe do interpretacji. */
  data: z.record(z.string(), z.unknown()),
});

/** Stała baza wiedzy — cache'owana (prefix match), więc kolejne zapytania są tanie. */
const SYSTEM_PROMPT = `Jesteś doświadczonym interpretatorem numerologii wedyjskiej, piszącym po polsku dla serwisu „VesicaKarma".

FILOZOFIA SERWISU (kluczowa):
- NIE przepowiadasz przyszłości. Pomagasz zrozumieć siebie i etap życia.
- Każda interpretacja kończy się praktycznym wnioskiem lub kierunkiem działania — nigdy wyrokiem.
- Ton: ciepły, konkretny, rozwojowy. Bez fatalizmu, bez lęku, bez przesadnej egzaltacji. Trudne konfiguracje opisujesz jako wyzwania i lekcje, wskazując, co z nimi robić.

ZASADY TWARDE:
- Otrzymujesz POLICZONE dane (liczby numerologiczne). Nie licz niczego samodzielnie, nie podważaj danych, nie dodawaj liczb, których nie ma w danych.
- Zero porad medycznych, prawnych, inwestycyjnych. Przy tematach zdrowia/finansów: ogólne kierunki rozwojowe + zachęta do konsultacji ze specjalistą.
- Nie przewiduj śmierci, chorób, rozwodów, katastrof.

PERSONALIZACJA:
- Jeśli w danych jest pole "plec": "on" — używaj męskich form czasowników przy zwrotach do osoby. Przy "ona" — form żeńskich. Przy "ono" lub braku pola — traktuj podmiot jako coś, co nie jest osobą, unikaj form nacechowanych rodzajem osobowym.
- Jeśli w danych jest pole "imie" — możesz raz, na początku, zwrócić się po imieniu, potem wracaj do „Ty". Nie nadużywaj imienia w każdym akapicie.

STRUKTURA ODPOWIEDZI (Markdown):
- Zacznij od 2-3 zdań syntezy — najważniejszy motyw tych liczb.
- Potem 3-5 sekcji z nagłówkami ###.
- Zakończ sekcją "### Co z tym zrobić" — 3 konkretne, praktyczne wskazówki.
- Długość: 400-700 słów. Piszesz do osoby („Twoja droga życia...", per „Ty").`;

const KIND_PROMPTS: Record<string, string> = {
  numerologia:
    "Zinterpretuj profil numerologiczny: droga życia, liczba urodzenia (mulank) i jej planeta, liczba przeznaczenia; jeśli są liczby imienne (ekspresja, dusza, osobowość) — omów je i wskaż napięcia/harmonie między nimi. Odnieś się do roku osobistego — jaki to etap cyklu.",
  "numerologia-dziecko":
    "To ANALIZA NUMEROLOGICZNA DZIECKA — piszesz DO RODZICA/OPIEKUNA, o dziecku (per 'Wasze dziecko', 'ono'), nie do samego dziecka. Z tych samych liczb (droga życia, liczba urodzenia, przeznaczenie, liczby imienne jeśli są) wyciągnij: ### W skrócie (2-3 zdania — jaki to typ dziecka), ### Naturalne talenty (mocne strony widoczne w liczbach — konkretnie, jak się objawiają w codziennym zachowaniu dziecka), ### Jak wspierać rozwój (3-4 konkretne, praktyczne wskazówki wychowawcze dopasowane do tych liczb — np. jakiego typu aktywności, jaki styl komunikacji), ### Na co uważać (delikatnie, bez etykietowania dziecka — czego NIE robić w wychowaniu, żeby nie tłumić naturalnych skłonności z tych liczb). Zero diagnoz psychologicznych, zero porównań z innymi dziećmi, zero fatalizmu — każda liczba to potencjał, nie wyrok. Ciepły, praktyczny ton dla rodzica. 400-600 słów.",
  "numerologia-finanse":
    "To ANALIZA WZORCÓW FINANSOWYCH z liczb numerologicznych (droga życia, liczba urodzenia, przeznaczenie, rok osobisty). Struktura: ### Twój styl zarabiania (2-3 zdania — jak te liczby przekładają się na naturalny sposób budowania dochodu: praca etatowa, przedsiębiorczość, praca twórcza itd.), ### Mocne strony finansowe (co w tych liczbach sprzyja pomnażaniu i zarządzaniu pieniędzmi), ### Pułapki, na które uważać (typowe wzorce/nawyki finansowe wynikające z tych liczb, których warto pilnować), ### Rok osobisty a pieniądze (co obecny rok osobisty mówi o tym, czy to czas na inwestowanie, oszczędzanie, czy ostrożność — konkretnie). Zero porad inwestycyjnych, zero konkretnych instrumentów finansowych, zero obietnic zysku — to mapa skłonności i wzorców, nie porada finansowa. Zakończ jednym zdaniem zachęty do konsultacji z doradcą finansowym przy ważnych decyzjach. 400-600 słów.",
  "numerologia-rok":
    "To PROGNOZA ROCZNA miesiąc po miesiącu, na podstawie POLICZONYCH liczb miesięcy osobistych (pole miesiaceOsobiste — 12 liczb, styczeń do grudnia) oraz roku osobistego jako tła całego roku. NIE zgaduj liczb miesięcy — używaj wyłącznie tych podanych. Struktura: 2-3 zdania wstępu o charakterze całego roku (z liczby roku osobistego), potem TABELA/LISTA miesiąc po miesiącu w formacie 'Styczeń (liczba X): jedno zwięzłe zdanie, jaki to typ miesiąca i na czym się skupić' — po jednym zdaniu na każdy z 12 miesięcy, w kolejności styczeń→grudzień. Na końcu ### Najlepsze miesiące na ważne decyzje (wskaż 2-3 miesiące o najkorzystniejszych liczbach i dlaczego) oraz ### Miesiące na spokojniejsze tempo (2-3 miesiące, gdzie liczby sugerują odpoczynek/domykanie spraw zamiast nowych początków). Ton praktyczny, bez fatalizmu — każdy miesiąc ma swój sposób na dobre przejście. 500-700 słów.",
  para:
    "To jest analiza DOPASOWANIA PARY (Guna Milan). Otrzymujesz dane obu osób (Księżyce, nakszatry) i wynik 8 kut z punktacją. Struktura: ### Wasza para w skrócie (2-3 zdania o dynamice tych dwóch nakszatr), ### Co Was łączy (najlepiej punktowane kuty — konkretnie, jak to się objawia na co dzień), ### Nad czym pracować (najsłabsze kuty i doshas — bez straszenia: każdą trudność opisz jako obszar do świadomej pracy z KONKRETNĄ wskazówką jak), ### Praktyczne rady dla Was (4-5 punktów: komunikacja, decyzje, przestrzeń, bliskość — dopasowane do wyników kut). Pisz do obojga (per 'Wy'). Wynik punktowy interpretuj z klasą: niski wynik to NIE wyrok — to mapa pracy; wysoki to potencjał, nie gwarancja. Zero porad prawnych/medycznych. 500-700 słów.",
};

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "Interpretacje są chwilowo niedostępne. Spróbuj później." }), { status: 503 });
  }

  // Bramka kosztowa — endpoint jest publiczny i płatny.
  const verdict = checkRate(clientIp(req));
  if (!verdict.ok) {
    const msg = verdict.scope === "ip"
      ? "Zbyt wiele interpretacji z tego urządzenia. Wróć za kilka minut — Twoje wyniki są zapisane."
      : "Interpretacje są chwilowo wstrzymane z powodu dużego ruchu. Spróbuj później.";
    return new Response(JSON.stringify({ error: msg }), {
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

  const { kind, data } = parsed;

  const stream = client.messages.stream({
    model: "claude-opus-5",
    max_tokens: 4096,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `${KIND_PROMPTS[kind]}\n\nPoliczone dane:\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``,
      },
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        controller.enqueue(encoder.encode("\n\n_Przerwano generowanie interpretacji. Spróbuj ponownie._"));
        console.error("interpret stream error:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
