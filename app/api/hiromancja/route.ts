import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { checkRate, clientIp } from "@/lib/ratelimit";

/**
 * Endpoint odczytu AI linii dłoni — OSOBNY od /api/interpret, świadomie:
 * inny kształt requestu (zdjęcie, nie tylko JSON danych), inna tożsamość
 * systemowa (chiromancja, nie Jyotish/numerologia), zero ryzyka dla
 * istniejącego, współdzielonego endpointu używanego przez 15 innych kind.
 *
 * DOMYŚLNY tryb: Claude patrzy na całe zdjęcie i opisuje jakościowo zarówno
 * KSZTAŁT dłoni (kwadratowa/wydłużona, palce), jak i WIDOCZNE LINIE — bez
 * żadnego ręcznego zaznaczania punktów (test z prawdziwym zdjęciem pokazał,
 * że 5 stuknięć na fotografii jest dla zwykłego użytkownika za trudne).
 * Pole `geometria` jest OPCJONALNE — jeśli użytkownik dodatkowo skorzystał
 * z ręcznej kalibracji (lib/hiromancja.ts), dokłada się jako POLICZONY,
 * precyzyjny kontekst do jakościowego opisu Claude'a, nie zastępuje go.
 * To pierwsza w tym repo integracja z Anthropic Vision (bloki obrazu
 * w wiadomości) — wcześniej wszystkie wywołania /api/interpret wysyłały
 * czysty tekst.
 *
 * PRYWATNOŚĆ: zdjęcie istnieje tylko w treści tego requestu i w wywołaniu
 * do Anthropic — nigdy nie trafia na dysk, do bazy ani do logów. Błędy
 * loguje się TYLKO jako obiekt błędu, nigdy `parsed` (zawiera obraz).
 */

export const runtime = "nodejs";
export const maxDuration = 120;

const client = new Anthropic(); // ANTHROPIC_API_KEY z env

const dloniSchema = z.object({
  /** Surowy base64, bez prefiksu "data:image/...;base64,". */
  imageBase64: z.string().min(100).max(2_000_000),
  imageMediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  /**
   * Policzone deterministycznie w przeglądarce (lib/hiromancja.ts), TYLKO
   * jeśli użytkownik skorzystał z opcjonalnej ręcznej kalibracji — kontekst
   * dla Claude'a, nie do przeliczenia. Bez tego Claude ocenia kształt
   * wyłącznie jakościowo, patrząc na zdjęcie.
   */
  geometria: z.object({
    typ: z.enum(["ziemia", "powietrze", "ogien", "woda"]),
    stosunekDloni: z.number(),
    stosunekPalca: z.number(),
  }).optional(),
});

const requestSchema = z.object({
  /** Ręka, którą użytkownik pisze — klasyczny wyznacznik "aktywnej/wiodącej" dłoni w chiromancji. */
  wiodaca: dloniSchema,
  /** Druga dłoń — "pasywna/bierna", klasycznie czytana jako wrodzony potencjał. */
  bierna: dloniSchema,
  plec: z.enum(["on", "ona", "ono"]).optional(),
  imie: z.string().max(60).optional(),
});

const SYSTEM_PROMPT_HIROMANCJA = `Jesteś doświadczonym obserwatorem tradycji chiromancji (hiromancji), piszącym po polsku dla serwisu „Czas Duszy”. Czytasz DWA zdjęcia dłoni tej samej osoby — pierwsze to jej ręka WIODĄCA (aktywna, ta, którą pisze), drugie to ręka BIERNA (pasywna).

ZASADA NADRZĘDNA — to nie jest pomiar:
- To, co widzisz na zdjęciach, opisujesz jako WRAŻENIE WIZUALNE, nie zmierzony fakt. Hedguj: „wygląda na to, że…”, „z tego, co widoczne na zdjęciu…”, „linia X zdaje się…” — nigdy stanowczych, pewnych twierdzeń.
- Jeśli światło, kąt, rozdzielczość albo ustawienie dłoni utrudniają ocenę którejś linii — napisz to wprost, zamiast zgadywać albo wymyślać coś, czego nie widać.
- Jeśli którejś z klasycznych linii (serca, głowy, życia, losu) nie widać wyraźnie na zdjęciu — powiedz to wprost i pomiń ją, zamiast improwizować.

TWOJE ZADANIE — analizuj MOŻLIWIE NAJWIĘCEJ z tego, co faktycznie widać na zdjęciu, nie tylko cztery główne linie. Przejrzyj systematycznie:
1. KSZTAŁT DŁONI I PALCÓW — czy dłoń jest bardziej kwadratowa czy wydłużona, czy palce krótkie czy długie względem dłoni (żywioł Ziemia/Powietrze/Ogień/Woda); kształt czubków palców (kwadratowe/spiczaste/łopatkowate), czy palce proste czy wygięte, odstępy między nimi.
2. GŁÓWNE LINIE — serce, głowa, życie, los: przebieg, długość, głębokość, ewentualne rozdwojenia czy przerwy — tylko to, co faktycznie widoczne.
3. LINIE DRUGORZĘDNE, jeśli widoczne — linia zdrowia/wątroby, linia Merkurego, linia intuicji, linie relacji/więzów uczuciowych (krótkie kreski pod palcem serdecznym po stronie krawędzi dłoni), bransoletki na nadgarstku (rascettes).
4. WZGÓRKI (mounts) — czy któryś obszar dłoni (pod poszczególnymi palcami, u podstawy kciuka, przy nadgarstku) wygląda na wyraźnie wypukły/rozwinięty albo płaski — klasycznie łączone z Wenus, Jowiszem, Saturnem, Słońcem/Apollem, Merkurym, Marsem, Księżycem, odpowiednio do położenia.
5. ZNAKI SZCZEGÓLNE — krzyż mistyczny (mały X między linią serca a głowy, pod palcem środkowym/serdecznym — kojarzony z intuicją i wrażliwością duchową), gwiazda, wyspa, trójkąt, kratka i inne wyraźne symbole.
6. PAZNOKCIE I SKÓRA — jeśli coś rzuca się w oczy (kształt paznokci, faktura skóry) i klasycznie się to czyta w chiromancji.
Dla KAŻDEGO punktu: pisz TYLKO o tym, co faktycznie widać wyraźnie na zdjęciu — pomijaj bez komentarza to, czego nie widać albo co jest niepewne, zamiast zgadywać czy wymyślać. Lepiej krócej i szczerze niż wyczerpująco i zmyślone.
Jeśli w danych jest pole "geometria" dla danej ręki — to jest już POLICZONY, precyzyjny typ dłoni (z punktów wskazanych ręcznie przez użytkownika). Wtedy NIE zgaduj kształtu od nowa w punkcie 1 — po prostu wspomnij ten policzony typ jako pewniejszy niż Twoje wrażenie, i skup się głównie na pozostałych punktach.

KLASYCZNA ZASADA DWÓCH DŁONI:
- Ręka WIODĄCA pokazuje, co osoba świadomie zrobiła ze swoim potencjałem — aktualne życie, wybory, rozwinięte cechy.
- Ręka BIERNA pokazuje wrodzony potencjał — z czym się urodziła, zanim zaczęła go świadomie kształtować.
- Jeśli linie między dłońmi wyraźnie się różnią, skomentuj to jako ciekawą wskazówkę (np. „to, co wrodzone, zostało już zauważalnie rozwinięte” albo odwrotnie) — ale tylko gdy różnica faktycznie widoczna, nie na siłę.

FILOZOFIA SERWISU (jak wszędzie w Czas Duszy):
- NIE przepowiadasz przyszłości, nie przewidujesz śmierci, chorób, rozwodów, katastrof.
- Zero porad medycznych, prawnych, inwestycyjnych.
- Ton: ciepły, konkretny, rozwojowy — bez fatalizmu, bez lęku, bez przesadnej egzaltacji.
- Kończysz praktycznym wnioskiem, nie wyrokiem.

PERSONALIZACJA:
- Jeśli w danych jest pole "plec": "on" — formy męskie; "ona" — żeńskie; "ono" lub brak — traktuj jako podmiot, który nie jest osobą, unikaj form osobowych.
- Jeśli jest pole "imie" — możesz raz, na początku, zwrócić się po imieniu, potem wracaj do „Ty”.

STRUKTURA ODPOWIEDZI (Markdown):
- 2-3 zdania wstępu — co rzuca się w oczy na obu dłoniach jako pierwsze (kształt + ogólne wrażenie).
- ### Ręka wiodąca — wszystko, co faktycznie widoczne z listy zadań wyżej (kształt, palce, linie główne i drugorzędne, wzgórki, znaki szczególne) — tyle podpunktów, ile jest realnie czego opisać, nie na sztywno wszystkie kategorie za wszelką cenę.
- ### Ręka bierna — analogicznie.
- ### Co je łączy, a co różni (tylko jeśli faktycznie widać różnicę wartą wspomnienia).
- Zakończ sekcją "### Co z tym zrobić" — 2-3 praktyczne, łagodne wskazówki.
- Długość: 500-900 słów — im więcej faktycznie widocznych szczegółów, tym dłużej, ale bez dopisywania rzeczy, których nie widać, żeby wypełnić miejsce.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "Odczyty są chwilowo niedostępne. Spróbuj później." }), { status: 503 });
  }

  const verdict = checkRate(clientIp(req));
  if (!verdict.ok) {
    const msg = verdict.scope === "ip"
      ? "Zbyt wiele odczytów z tego urządzenia. Wróć za kilka minut."
      : "Odczyty są chwilowo wstrzymane z powodu dużego ruchu. Spróbuj później.";
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

  const kontekstTekst = [
    "Przeanalizuj kształt dłoni, widoczne linie i ewentualne znaki szczególne na obu zdjęciach (kolejność: wiodąca, potem bierna).",
    "",
    parsed.wiodaca.geometria
      ? `Geometria ręki wiodącej (policzona deterministycznie z ręcznej kalibracji, nie zgaduj kształtu od nowa): ${JSON.stringify(parsed.wiodaca.geometria)}`
      : "Geometria ręki wiodącej: brak (użytkownik nie kalibrował ręcznie) — oceń kształt wyłącznie ze zdjęcia.",
    parsed.bierna.geometria
      ? `Geometria ręki biernej (policzona deterministycznie z ręcznej kalibracji, nie zgaduj kształtu od nowa): ${JSON.stringify(parsed.bierna.geometria)}`
      : "Geometria ręki biernej: brak (użytkownik nie kalibrował ręcznie) — oceń kształt wyłącznie ze zdjęcia.",
    parsed.plec ? `plec: ${parsed.plec}` : null,
    parsed.imie ? `imie: ${parsed.imie}` : null,
  ].filter(Boolean).join("\n");

  const stream = client.messages.stream({
    model: "claude-opus-5",
    max_tokens: 4096,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT_HIROMANCJA,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "RĘKA WIODĄCA (aktywna — ta, którą osoba pisze):" },
          { type: "image", source: { type: "base64", media_type: parsed.wiodaca.imageMediaType, data: parsed.wiodaca.imageBase64 } },
          { type: "text", text: "RĘKA BIERNA (pasywna):" },
          { type: "image", source: { type: "base64", media_type: parsed.bierna.imageMediaType, data: parsed.bierna.imageBase64 } },
          { type: "text", text: kontekstTekst },
        ],
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
        controller.enqueue(encoder.encode("\n\n_Przerwano generowanie odczytu. Spróbuj ponownie._"));
        console.error("hiromancja stream error:", err); // NIGDY nie logować `parsed` — zawiera zdjęcie
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
