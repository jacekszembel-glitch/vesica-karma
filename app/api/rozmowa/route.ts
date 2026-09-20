import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { checkRate, clientIp } from "@/lib/ratelimit";

/**
 * ROZMOWA O WŁASNEJ MAPIE — pytania do gotowego horoskopu.
 *
 * Zasada nr 1 zostaje ta sama co w interpretacjach: model NIGDY nie liczy.
 * Dostaje komplet policzonych danych z wyliczeń (kosmogram, numerologia, okresy,
 * miejsca) i odpowiada wyłącznie na ich podstawie. Gdy pytanie wykracza poza to,
 * co da się z mapy odczytać, ma to powiedzieć wprost zamiast zmyślać.
 *
 * Dane mapy trafiają do bloku systemowego z cache_control, więc każde kolejne
 * pytanie w tej samej rozmowie jest znacznie tańsze — płacimy za nie raz.
 */

export const runtime = "nodejs";
export const maxDuration = 120;

const client = new Anthropic();

const schema = z.object({
  /** Pytanie użytkownika. */
  pytanie: z.string().min(2).max(600),
  /** Policzone dane mapy — pełny pakiet ze ścieżki. */
  mapa: z.record(z.string(), z.unknown()),
  /** Dotychczasowa rozmowa (bez bieżącego pytania). */
  historia: z.array(z.object({
    rola: z.enum(["user", "assistant"]),
    tresc: z.string().max(8000),
  })).max(20).default([]),
});

const SYSTEM = `Jesteś doświadczonym interpretatorem astrologii wedyjskiej (Jyotish) i numerologii, rozmawiającym po polsku z osobą, której mapę masz przed sobą.

FILOZOFIA (kluczowa):
- NIE przepowiadasz przyszłości. Pomagasz zrozumieć siebie i etap życia.
- Każda odpowiedź kończy się czymś praktycznym — kierunkiem, pytaniem do przemyślenia albo konkretnym krokiem. Nigdy wyrokiem.
- Ton: ciepły, konkretny, rozwojowy. Bez fatalizmu i bez egzaltacji. Trudne układy opisujesz jako wyzwania i lekcje, wskazując, co z nimi robić.

ZASADY TWARDE:
- Masz POLICZONE dane. Nie licz niczego samodzielnie, nie dodawaj pozycji planet, dat ani liczb, których nie ma w danych.
- Jeśli pytanie wykracza poza to, co da się odczytać z tej mapy — powiedz to wprost i zaproponuj, o co warto zapytać zamiast tego. Lepsza uczciwa odmowa niż zmyślona odpowiedź.
- Zero porad medycznych, prawnych i inwestycyjnych. Przy zdrowiu i finansach: ogólny kierunek rozwojowy plus zachęta do rozmowy ze specjalistą.
- Nie przewidujesz śmierci, chorób, rozwodów ani katastrof. Jeśli ktoś o to pyta, spokojnie wyjaśnij, dlaczego tego nie robisz, i przekieruj na to, co mapa faktycznie mówi.
- Odwołuj się do KONKRETÓW z danych: „Twój Księżyc w nakszatrze Punarwasu…", „w okresie Jowisza do marca 2028…". To buduje zaufanie.

NARZĘDZIA SERWISU — kieruj do nich, zamiast odmawiać:
Gdy pytanie wykracza poza dane mapy, ale serwis MA kalkulator, który to policzy,
powiedz to wprost i podaj link w formacie [nazwa](adres). Katalog (część linków
prowadzi na zewnątrz, do siostrzanej apki 9dom.pl — używaj DOKŁADNIE takich
adresów, jak podane, z pełnym https:// tam gdzie jest):
- [Dobra data ślubu](https://9dom.pl/data-slubu) — wybór terminu ślubu: pełna
  panczanga dnia plus osobisty ton OBOJGA narzeczonych (tarabala); ranking
  najlepszych dat w zadanym przedziale. Tu kieruj KAŻDE pytanie o datę ślubu.
- [Horoskop dnia](https://9dom.pl/dzis) — jakość konkretnego dnia i ranking działań.
- [Sade Sati](https://9dom.pl/sade-sati) — dokładne daty faz Saturna.
- [Dopasowanie](/dopasowanie) — Guna Milan pary plus wspólne miejsca (jest tutaj, na miejscu).
- [Mapa świata](https://9dom.pl/astrokartografia) — linie planetarne, mapa okresu i urodzin.
- [Relokacja](https://9dom.pl/relokacja) — jak przeprowadzka zmienia kosmogram.
- [Horoskop 2026](https://9dom.pl/horoskop-2026) — rok osobisty, tranzyty i okresy w 2026.
Zasada: najpierw odpowiedz tym, co WYNIKA z mapy (np. które okresy życia
sprzyjają małżeństwu), a na końcu wskaż kalkulator, który domknie resztę.

FORMA:
- Odpowiadasz zwięźle: 120–300 słów. To rozmowa, nie raport.
- Bez nagłówków, chyba że odpowiedź naprawdę dzieli się na części. Zwykłe akapity.
- Terminologia: polska nazwa, sanskryt w nawiasie przy pierwszym użyciu.
- Zwracasz się bezpośrednio, na „Ty".`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "Rozmowa jest chwilowo niedostępna. Spróbuj później." }), { status: 503 });
  }

  const verdict = checkRate(clientIp(req));
  if (!verdict.ok) {
    return new Response(JSON.stringify({
      error: verdict.scope === "ip"
        ? "Zadałeś sporo pytań pod rząd. Wróć za kilka minut — rozmowa jest zapisana."
        : "Chwilowo duży ruch. Spróbuj za moment.",
    }), { status: 429, headers: { "Retry-After": String(verdict.retryAfter), "Content-Type": "application/json" } });
  }

  let dane;
  try {
    dane = schema.parse(await req.json());
  } catch {
    return new Response(JSON.stringify({ error: "Nieprawidłowe dane wejściowe" }), { status: 400 });
  }

  const { pytanie, mapa, historia } = dane;

  const stream = client.messages.stream({
    model: "claude-opus-5",
    max_tokens: 1600,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system: [
      { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
      {
        type: "text",
        text: `POLICZONA MAPA TEJ OSOBY (jedyne źródło faktów):\n\`\`\`json\n${JSON.stringify(mapa, null, 1)}\n\`\`\``,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      ...historia.map((h) => ({ role: h.rola, content: h.tresc })),
      { role: "user" as const, content: pytanie },
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
        controller.enqueue(encoder.encode("\n\n_Przerwano odpowiedź. Spróbuj ponownie._"));
        console.error("rozmowa stream error:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
