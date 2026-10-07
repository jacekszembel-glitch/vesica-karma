import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { katalogDlaAI } from "./hiromancjaKsztalty";

/**
 * Wspólne dla /api/hiromancja-ogledziny (krok 1: co AI widzi) i /api/hiromancja (krok 2: odczyt):
 * schemat zdjęć jednej ręki oraz OGLĘDZINY — każde zbliżenie (wycinek, osobne ujęcie, wskazane
 * miejsce) idzie do AI OSOBNO z jednym zadaniem: wypisać znaki i linie, bez interpretacji. Model
 * skupiony na jednym fragmencie widzi znacznie więcej drobnych przecięć niż przy całym odczycie.
 * Tylko po stronie serwera (klient Anthropic przychodzi z trasy).
 */

export const dloniSchema = z.object({
  /** Surowy base64, bez prefiksu "data:image/...;base64,". */
  imageBase64: z.string().min(100).max(2_000_000),
  imageMediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  /** Typ dłoni policzony w przeglądarce z ręcznej kalibracji (opcjonalnie) — kontekst, nie do przeliczenia. */
  geometria: z.object({
    typ: z.enum(["ziemia", "powietrze", "ogien", "woda"]),
    stosunekDloni: z.number(),
    stosunekPalca: z.number(),
  }).optional(),
  /** Zbliżenia stref dłoni wycięte z oryginału w przeglądarce (lib/hiromancjaObraz.ts). */
  strefy: z.array(z.object({
    opis: z.string().max(1500),
    imageBase64: z.string().min(100).max(1_500_000),
  })).max(14).optional(),
});
export type DloniWejscie = z.infer<typeof dloniSchema>;

export type Blok = Anthropic.Messages.ContentBlockParam;

/** Całe zdjęcie ręki + jej zbliżenia, podpisane — w kolejności z przeglądarki. */
export function blokiReki(reka: "WIODĄCA" | "BIERNA", d: DloniWejscie): Blok[] {
  return [
    { type: "text", text: reka === "WIODĄCA" ? "RĘKA WIODĄCA (aktywna — ta, którą osoba pisze) — całe zdjęcie:" : "RĘKA BIERNA (pasywna) — całe zdjęcie:" },
    { type: "image", source: { type: "base64", media_type: d.imageMediaType, data: d.imageBase64 } },
    ...(d.strefy ?? []).flatMap((s): Blok[] => [
      { type: "text", text: `RĘKA ${reka} — ${s.opis}:` },
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: s.imageBase64 } },
    ]),
  ];
}

const SYSTEM_OGLEDZIN = `Jesteś okiem doświadczonego chiromanty z lupą. Dostajesz JEDEN obraz: zbliżenie fragmentu dłoni (podpis mówi, co pokazuje). Twoje jedyne zadanie: wypisać znaki i linie, które są na tym obrazie. Nic nie interpretujesz.

Jak patrzysz:
- Przejdź obraz systematycznie, fragment po fragmencie (góra, środek, dół; od lewej do prawej). Patrz na bruzdy — wyraźne linie odróżniające się od drobnej faktury skóry.
- Każde miejsce, w którym dwie bruzdy się przecinają, to X (krzyż) — także gdy przecięcie nie jest idealnie na środku i gdy ramiona są nierówne. Trzy lub więcej bruzd przecinających się w jednym punkcie to gwiazda. Trzy bruzdy zamykające trójkątny kształt to trójkąt; cztery zamykające czworokąt — kwadrat; kilka równoległych przeciętych kilkoma poprzecznymi — kratka; linia rozdzielająca się na chwilę i schodząca z powrotem — wyspa.
- Dłuższe bruzdy opisz jako linie: kierunek (pionowa/pozioma/ukośna), skąd dokąd, czy ciągła czy z odcinków.
- TRÓJKĄTY Z LINII GŁÓWNYCH: sprawdź, czy dłuższe linie przecinają się tak, że trzy z nich zamykają trójkąt — szczególnie w środku dłoni: linia głowy (pozioma/ukośna) + linia losu (pionowa przez środek) + linia Merkurego (ukośna od dołu ku małemu palcowi), albo linia życia + linia głowy + linia Merkurego. Taki trójkąt jest znakiem także wtedy, gdy jeden bok tworzy linia słaba albo złożona z wielu krótkich kresek. Wpisz go osobno: „trójkąt z linii … — środek dłoni”.
- ZNAK ŁODZI: wydłużony, zamknięty kształt jak łódź utworzony przez linie — zwykle po stronie kciuka od linii losu, między linią losu a łukiem linii życia, z linią głowy u góry i domknięciem u dołu. Wpisz go osobno: „łódź z linii … — domknięta / otwarta u dołu”.
- Miejsce podaj względem dłoni (np. „pod palcem wskazującym, tuż nad końcem linii serca”, „na krawędzi dłoni, w dolnej części”), korzystając z podpisu obrazu.

KSZTAŁTY Z UKŁADU LINII — REGUŁA: przy każdym obrazie sprawdź CAŁY katalog tradycyjnych kształtów chiromancji (zachodniej i indyjskiej). Kształt tworzy się z kilku linii naraz — dlatego oprócz pojedynczych bruzd patrz, co linie razem zamykają, w co się układają i czym się kończą. U różnych ludzi pojawiają się różne kształty — niczego nie pomijaj; fragment kształtu też wpisz (z „delikatny”). Katalog:
${katalogDlaAI()}
Każdy znaleziony kształt wpisz osobno: „kształt: [nazwa z katalogu] — [z których linii / dokładne miejsce] — [wyraźny / delikatny]”.

Format odpowiedzi — sama lista, każda pozycja w osobnej linii:
- [znak albo linia] — [dokładne miejsce] — [wyraźny / delikatny]
Wypisz tylko to, co jest. Bez wstępu, bez podsumowania, bez „nie widać”.`;

/** Oględziny wszystkich zbliżeń jednej ręki, równolegle. Zwraca teksty „RĘKA … — opis:\n- …”. */
export async function ogledziny(client: Anthropic, reka: string, strefy: DloniWejscie["strefy"]): Promise<string[]> {
  const wyniki = await Promise.all((strefy ?? []).map(async (s) => {
    try {
      const msg = await client.messages.create({
        model: "claude-opus-5",
        max_tokens: 6000,
        thinking: { type: "adaptive" },
        output_config: { effort: "medium" },
        system: SYSTEM_OGLEDZIN,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: `RĘKA ${reka} — ${s.opis}` },
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: s.imageBase64 } },
          ],
        }],
      });
      const tekst = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
      return tekst ? `RĘKA ${reka} — ${s.opis}:\n${tekst}` : null;
    } catch (err) {
      console.error("hiromancja ogledziny error:", err); // bez danych — zawierają zdjęcie
      return null;
    }
  }));
  return wyniki.filter((w): w is string => !!w);
}
