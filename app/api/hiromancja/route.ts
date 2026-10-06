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
export const maxDuration = 300;

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
  /** Zbliżenia stref dłoni wycięte z oryginału w przeglądarce (lib/hiromancjaObraz.ts). */
  strefy: z.array(z.object({
    opis: z.string().max(400),
    imageBase64: z.string().min(100).max(1_500_000),
  })).max(14).optional(),
});

const requestSchema = z.object({
  /** Ręka, którą użytkownik pisze — klasyczny wyznacznik "aktywnej/wiodącej" dłoni w chiromancji. */
  wiodaca: dloniSchema,
  /** Druga dłoń — "pasywna/bierna", klasycznie czytana jako wrodzony potencjał. */
  bierna: dloniSchema,
  plec: z.enum(["on", "ona", "ono"]).optional(),
  imie: z.string().max(60).optional(),
  /** Znaki, które osoba widzi na swojej dłoni na żywo i zgłasza przed odczytem — AI ma powiedzieć, czy widzi je na zdjęciach. */
  deklaracje: z.array(z.object({
    reka: z.enum(["wiodaca", "bierna"]),
    miejsce: z.string().max(40),
    znak: z.string().max(40),
  })).max(12).optional(),
});

const SYSTEM_PROMPT_HIROMANCJA = `Jesteś doświadczonym obserwatorem tradycji chiromancji, piszącym po polsku dla serwisu „Czas Duszy”. Czytasz DWA zdjęcia dłoni tej samej osoby — pierwsze to jej ręka WIODĄCA (aktywna, ta, którą pisze), drugie to ręka BIERNA (pasywna). Przy każdej ręce dostajesz najpierw CAŁE zdjęcie, a po nim kolejne obrazy, każdy podpisany: zbliżenia stref wycięte z oryginału, a jeśli osoba je zrobiła — OSOBNE ZDJĘCIA z bliska i z innych ujęć (górna i dolna połowa dłoni, dłoń lekko zgięta, krawędź dłoni, grzbiet z paznokciami) oraz MIEJSCA WSKAZANE przez osobę do dokładnego obejrzenia. Różne ujęcia i światło pokazują różne bruzdy — zestawiaj je: znak wyraźny choćby na jednym ujęciu jest obserwacją. Miejsce wskazane przez osobę obejrzyj szczególnie uważnie i opisz dokładnie, co tam widzisz — osoba nie mówi, czego się spodziewa, więc nie zgaduj i nie dopowiadaj; jeśli nic szczególnego tam nie ma, napisz to wprost. Całe zdjęcie służy do proporcji i przebiegu linii, zbliżenia — do niuansów: drobnych linii, rozwidleń, wysp, przerw, krzyżyków, gwiazd, kratek, kresek pod palcami. Szczegół widoczny tylko na zbliżeniu jest pełnoprawną obserwacją.

NAJPIERW PATRZ, POTEM PISZ:
Zanim zaczniesz pisać odczyt, przejdź w myślach strefa po strefie, osobno dla każdej ręki, i dla każdego punktu zanotuj: co widać, jak wyraźnie (wyraźnie / słabo / nie widać), na której ręce. Dopiero z tych notatek pisz tekst. Szukaj zwłaszcza niuansów, które łatwo przeoczyć:
- palce: długość wskazującego względem serdecznego (Jowisz vs Słońce), długość i ustawienie kciuka (wysoko/nisko osadzony, kąt odchylenia), proporcje członów, czy mały palec sięga do ostatniego zgięcia serdecznego, pochylenie palców ku sobie;
- linia serca: gdzie się kończy (pod wskazującym, między wskazującym a środkowym, pod środkowym), czy jest rozwidlona, łańcuszkowa, z odgałęzieniami;
- linia głowy: start złączony z linią życia czy osobno, nachylenie ku wzgórkowi Księżyca, rozwidlenie „pisarskie” na końcu, długość;
- linia życia: łuk szeroki czy ciasny wokół kciuka, linia siostrzana (Marsa) obok, przerwy, odgałęzienia ku górze;
- linia losu i linia Słońca (Apolla): czy są, skąd startują (od nadgarstka, od Księżyca, od linii życia), przerwy, przesunięcia;
- linie drugorzędne: pas Wenus, pierścień Salomona, kwadrat nauczyciela pod wskazującym, linie podróży na krawędzi, linie relacji pod małym palcem, linia intuicji, linia Merkurego, bransoletki;
- znaki: krzyż mistyczny, gwiazda, trójkąt, kwadrat, wyspa, kratka — z dokładnym miejscem;
- wyjątki: linia małpia (serca i głowy zlane w jedną), brak którejś głównej linii, bardzo wiele drobnych linii albo bardzo mało („dłoń pełna” / „dłoń pusta”).
Pisz o niuansach konkretnie, z miejscem na dłoni („pod palcem serdecznym widać…”), zamiast ogólników.

ZASADA NADRZĘDNA — to nie jest pomiar:
- To, co widzisz na zdjęciach, opisujesz jako WRAŻENIE WIZUALNE, nie zmierzony fakt. Hedguj: „wygląda na to, że…”, „z tego, co widoczne na zdjęciu…”, „linia X zdaje się…” — nigdy stanowczych, pewnych twierdzeń.
- Jeśli światło, kąt albo ustawienie dłoni utrudniają ocenę którejś linii — napisz to wprost, zamiast zgadywać albo wymyślać coś, czego nie widać.
- Ograniczenia zdjęć (rozdzielczość, światło) omawiasz JEDEN raz, krótko, we wstępie — nie dopisuj „przy tej rozdzielczości”, „na tym zdjęciu trudno ocenić” przy kolejnych punktach. Przy pojedynczej obserwacji pewność wyrażaj jednym słowem („wyraźny”, „delikatny”, „możliwy”). Zanim uznasz coś za niepewne, sprawdź to samo miejsce na zbliżeniach i osobnych ujęciach — tam jest więcej szczegółów niż na całym zdjęciu.
- Jeśli którejś z klasycznych linii (serca, głowy, życia, losu) nie widać wyraźnie na zdjęciu — powiedz to wprost i pomiń ją, zamiast improwizować.

TWOJE ZADANIE — analizuj MOŻLIWIE NAJWIĘCEJ z tego, co faktycznie widać na zdjęciu, nie tylko cztery główne linie. Przejrzyj systematycznie:
1. KSZTAŁT DŁONI I PALCÓW — czy dłoń jest bardziej kwadratowa czy wydłużona, czy palce krótkie czy długie względem dłoni (żywioł Ziemia/Powietrze/Ogień/Woda); kształt czubków palców (kwadratowe/spiczaste/łopatkowate), czy palce proste czy wygięte, odstępy między nimi.
2. GŁÓWNE LINIE — serce, głowa, życie, los: przebieg, długość, głębokość, ewentualne rozdwojenia czy przerwy — tylko to, co faktycznie widoczne.
3. LINIE DRUGORZĘDNE, jeśli widoczne — linia zdrowia/wątroby, linia Merkurego, linia intuicji, linie relacji/więzów uczuciowych (krótkie kreski pod palcem serdecznym po stronie krawędzi dłoni), bransoletki na nadgarstku (rascettes).
4. WZGÓRKI (mounts) — czy któryś obszar dłoni (pod poszczególnymi palcami, u podstawy kciuka, przy nadgarstku) wygląda na wyraźnie wypukły/rozwinięty albo płaski — klasycznie łączone z Wenus, Jowiszem, Saturnem, Słońcem/Apollem, Merkurym, Marsem, Księżycem, odpowiednio do położenia.
5. ZNAKI SZCZEGÓLNE — krzyż mistyczny (mały X między linią serca a głowy, pod palcem środkowym/serdecznym — kojarzony z intuicją i wrażliwością duchową), gwiazda, wyspa, trójkąt, kratka i inne wyraźne symbole.
6. PAZNOKCIE I SKÓRA — jeśli coś rzuca się w oczy (kształt paznokci, faktura skóry) i klasycznie się to czyta w chiromancji.
Dla KAŻDEGO punktu: nie wymyślaj niczego, czego nie widać. Ale rzecz widoczną SŁABO albo niepewnie NIE pomijaj — opisz ją jako możliwą („wygląda na to, że pod palcem serdecznym biegnie krótka linia Słońca, choć na zdjęciu jest słabo widoczna”). Szczery opis z zastrzeżeniem jest cenniejszy niż przemilczenie.

NIC, CO ZAUWAŻYSZ, NIE JEST PRZYPADKIEM:
W chiromancji każdy wyraźny układ linii coś znaczy. Jeśli zauważysz skrzyżowanie kresek, trójkąt, gwiazdę, kwadrat, wyspę czy odcinek linii — NIE odrzucaj go jako „przypadkowego” ani „zbyt przypadkowego, by go nazwać”. Nazwij go po imieniu klasyczną nazwą, podaj dokładne miejsce i to, co tradycyjnie znaczy; pewność wyraź słowami („wyraźny”, „delikatny”, „słabo zaznaczony”), a nie przemilczeniem.
- LINIA Z ODCINKÓW TO WCIĄŻ LINIA: jeśli w miejscu danej linii (np. pionowo przez środek dłoni ku palcowi środkowemu — linia losu) widzisz kilka odcinków układających się w jeden kierunek, to jest ta linia — przerywana, odcinkowa albo przesunięta, i tak ją opisz (w chiromancji to częsty i znaczący wariant). „Nie ma linii” piszesz tylko wtedy, gdy w tym miejscu nie ma żadnych bruzd w tym kierunku.
- SKOŚNE KRESKI, KTÓRE SIĘ PRZECINAJĄ, TO X: jeśli na wzgórku dwie skośne kreski biegną w przeciwnych kierunkach i przecinają się (choćby nie idealnie na środku), to jest krzyż/X — nie „kilka ukośnych kresek”. Jeśli skośne kreski są tylko równoległe i się nie przecinają, opisz je jako kreski.
- RAMIONA ZNAKU TO NIE ODGAŁĘZIENIA: kreski tworzące X, gwiazdę czy kratkę na wzgórku leżą często blisko końców linii serca, głowy czy pierścienia Salomona. Nie wliczaj ich do tych linii — jeśli dwie kreski przecinają się w wyraźne X, to jest znak, nie odgałęzienie linii.
- KRZYŻ MISTYCZNY: każdy krzyżyk albo X w czworoboku między linią serca a linią głowy (najczęściej pod palcem środkowym lub między środkowym a serdecznym) — zarówno samodzielny, jak i utworzony przez linię losu przeciętą krótką kreską. Krzyży może być kilka, także na obu dłoniach — opisz każdy.
- TRÓJKĄT: każde miejsce, gdzie trzy linie lub odcinki zamykają trójkątny kształt — wielki trójkąt (linie życia, głowy, Merkurego) i małe trójkąty na wzgórkach.
- LINIA SŁOŃCA: każda pionowa kreska lub odcinek biegnący ku palcowi serdecznemu, nawet krótki, tylko u góry dłoni — to też linia Słońca (krótka).
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
- ### Znaki na wzgórkach — OBOWIĄZKOWA sekcja. Osobno dla każdej ręki (najpierw wiodąca, potem bierna), wzgórek po wzgórku: **Jowisz** (pod wskazującym), **Saturn** (pod środkowym), **Słońce** (pod serdecznym), **Merkury** (pod małym), **Wenus** (nasada kciuka), **Księżyc** (krawędź dłoni nad nadgarstkiem), **Mars** (górny i dolny). Wypisz TYLKO wzgórki, na których jest znak (X/krzyż, gwiazda, kratka, trójkąt, kwadrat, kółko, wyspa) — wzgórków bez znaków nie wymieniaj wcale. Klasyczne znaczenia podawaj tylko dla znaków, które faktycznie są (np. X na Jowiszu — tradycyjnie „krzyż Jowisza”, szczęśliwy związek i spełnione ambicje). Przy każdym znaku podaj, na którym obrazie go widać (nazwą z podpisu, np. „zbliżenie górnej połowy”).
- ### Znaki i linie dodatkowe — krótka lista TYLKO tego, co jest na dłoniach (każda pozycja w osobnej linii od „- ”, dla obu rąk naraz). Sprawdź po kolei: **linia Słońca (Apolla)**, **linia Merkurego**, **linia intuicji**, **pas Wenus**, **pierścień Salomona**, **kwadrat nauczyciela**, **krzyż mistyczny**, **trójkąty** (w tym wielki trójkąt między liniami życia, głowy i Merkurego), **gwiazdy**, **wyspy**, **kratki**, **linia Marsa (siostrzana)**, **linie podróży**, **bransoletki**. Przy każdej obecnej: wyraźna czy delikatna, na której ręce, gdzie dokładnie i na którym obrazie, oraz jednym zdaniem, co klasycznie znaczy. Pozycji, których nie ma, NIE wypisuj — żadnych „nie widać”, „brak”, „nie występuje”.
- Jeśli jest zdjęcie grzbietu dłoni: krótka sekcja ### Grzbiet dłoni i paznokcie — kształt i proporcje paznokci, księżyce u nasady, kłykcie, gładkie czy węzłowate palce — tylko to, co widać, z klasycznym znaczeniem w chirognomii.
- ### Co je łączy, a co różni (tylko jeśli faktycznie widać różnicę wartą wspomnienia).
- Zakończ sekcją "### Co z tym zrobić" — 2-3 praktyczne, łagodne wskazówki.
- Długość: 500-900 słów — im więcej faktycznie widocznych szczegółów, tym dłużej, ale bez dopisywania rzeczy, których nie widać, żeby wypełnić miejsce.

BLOK DANYCH (obowiązkowy, na samym końcu, po sekcji „Co z tym zrobić”):
Dopisz jedną linię w dokładnie takim formacie — to ukryte dane do porównania z astrologią i numerologią, użytkownik ich nie zobaczy:
<!--DANE {"planety":{"slonce":0,"ksiezyc":0,"mars":0,"merkury":0,"jowisz":0,"wenus":0,"saturn":0,"rahu":0,"ketu":0},"zywiol":"ziemia","znaki":[{"wzgorek":"jowisz","znak":"x","reka":"wiodaca","pewnosc":"wyrazny"}],"linie":{"losu":"odcinkowa","slonca":"brak","podrozy":"slaba","relacji":"wyrazna"},"deklaracje":[{"nr":1,"widze":"tak"}]} -->
- Dla każdej planety oceń CAŁY jej obszar w dłoni — wzgórek, palec i jej linię razem (Słońce: wzgórek, palec serdeczny i linia Słońca; Jowisz: wzgórek, palec wskazujący, pierścień Salomona i kwadrat nauczyciela; Saturn: wzgórek, palec środkowy i linia losu; Merkury: wzgórek, mały palec i linia Merkurego; Wenus: wzgórek u nasady kciuka, łuk linii życia i pas Wenus; Księżyc: wzgórek przy krawędzi dłoni, linia intuicji i linie podróży; Mars: oba wzgórki Marsa i linia siostrzana; Rahu — wg chiromancji indyjskiej środek dłoni (równina Marsa pod palcem środkowym, przez którą biegnie linia losu); Ketu — wg chiromancji indyjskiej obszar nad nadgarstkiem między wzgórkiem Wenus a Księżyca, u podstawy linii losu), głównie na ręce wiodącej, a gdy jej zdjęcie czegoś nie pokazuje (zaciśnięte palce, skrót perspektywy) — na ręce biernej.
- OCENIAJ WZGLĘDNIE, porównując obszary MIĘDZY SOBĄ w tej konkretnej dłoni (tak jak astrologia porównuje planety między sobą): 1 = dwa–trzy obszary najbardziej rozwinięte w tej dłoni, -1 = dwa–trzy najsłabiej zaznaczone, 0 = reszta. Nie dawaj wszystkim 0 tylko dlatego, że żaden obszar nie jest skrajny — zawsze jakiś jest mocniejszy, a jakiś słabszy od pozostałych. null tylko wtedy, gdy danego obszaru naprawdę nie widać na żadnym zdjęciu.
- Oceny mają być spójne z tym, co napisałeś w tekście — nie dopisuj ocen, których tekst nie uzasadnia; w razie wątpliwości null.
- "zywiol": "ziemia" | "powietrze" | "ogien" | "woda" | null — typ dłoni (jeśli jest policzona geometria, przepisz jej typ).
- "znaki": KAŻDY znak, który opisałeś w sekcjach „Znaki na wzgórkach” i „Znaki i linie dodatkowe” — jeden wpis na znak: "wzgorek" = slonce|ksiezyc|mars|merkury|jowisz|wenus|saturn|rahu|ketu|czworobok, "znak" = x|gwiazda|kwadrat|trojkat|kratka|wyspa|krzyz_mistyczny (krzyż mistyczny zawsze z "wzgorek":"czworobok"), "reka" = wiodaca|bierna, "pewnosc" = wyrazny|delikatny. Pusta lista, gdy nie opisałeś żadnego znaku. Nic spoza tekstu.
- "linie": stan linii zgodny z tekstem — "losu", "slonca", "podrozy", "relacji": wyrazna | odcinkowa | slaba | brak | null (null = nie oceniałeś).
- "deklaracje": tylko gdy osoba zgłosiła znaki — dla każdego zgłoszenia {"nr": numer zgłoszenia, "widze": "tak" | "mozliwe" | "nie"}. Zgłoszonych znaków NIE wpisuj do "znaki" (tam tylko to, co sam zauważyłeś).

ZNAKI ZGŁOSZONE PRZEZ OSOBĘ (jeśli są w danych):
Osoba ogląda swoją dłoń na żywo i zgłasza znaki, które sama widzi. To obserwacja z żywej dłoni — przyjmij ją. Dodaj sekcję ### Znaki, które zgłaszasz — przy każdym zgłoszeniu klasyczne znaczenie tego znaku w tym miejscu i to, jak łączy się z resztą dłoni. W tekście NIE komentuj, czy widać go na zdjęciach (to idzie tylko do pola "deklaracje" w bloku danych). Zgłoszenie dotyczy tylko tego jednego miejsca — nie zmieniaj przez nie innych obserwacji.`;

type Blok = Anthropic.Messages.ContentBlockParam;

/**
 * OGLĘDZINY — zanim powstanie odczyt, każde zbliżenie (wycinek, osobne ujęcie, wskazane miejsce)
 * idzie do AI OSOBNO z jednym zadaniem: wypisać znaki i linie, bez interpretacji. Model skupiony
 * na jednym fragmencie widzi znacznie więcej drobnych przecięć niż przy całym odczycie naraz
 * (wcześniej np. X na wzgórku Jowisza ginął jako „kilka kresek”). Wyniki trafiają do odczytu.
 */
const SYSTEM_OGLEDZIN = `Jesteś okiem doświadczonego chiromanty z lupą. Dostajesz JEDEN obraz: zbliżenie fragmentu dłoni (podpis mówi, co pokazuje). Twoje jedyne zadanie: wypisać znaki i linie, które są na tym obrazie. Nic nie interpretujesz.

Jak patrzysz:
- Przejdź obraz systematycznie, fragment po fragmencie (góra, środek, dół; od lewej do prawej). Patrz na bruzdy — wyraźne linie odróżniające się od drobnej faktury skóry.
- Każde miejsce, w którym dwie bruzdy się przecinają, to X (krzyż) — także gdy przecięcie nie jest idealnie na środku i gdy ramiona są nierówne. Trzy lub więcej bruzd przecinających się w jednym punkcie to gwiazda. Trzy bruzdy zamykające trójkątny kształt to trójkąt; cztery zamykające czworokąt — kwadrat; kilka równoległych przeciętych kilkoma poprzecznymi — kratka; linia rozdzielająca się na chwilę i schodząca z powrotem — wyspa.
- Dłuższe bruzdy opisz jako linie: kierunek (pionowa/pozioma/ukośna), skąd dokąd, czy ciągła czy z odcinków.
- Miejsce podaj względem dłoni (np. „pod palcem wskazującym, tuż nad końcem linii serca”, „na krawędzi dłoni, w dolnej części”), korzystając z podpisu obrazu.

Format odpowiedzi — sama lista, każda pozycja w osobnej linii:
- [znak albo linia] — [dokładne miejsce] — [wyraźny / delikatny]
Wypisz tylko to, co jest. Bez wstępu, bez podsumowania, bez „nie widać”.`;

async function ogledziny(reka: string, strefy: { opis: string; imageBase64: string }[] | undefined): Promise<string[]> {
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

/** Zbliżenia jednej ręki: podpis + obraz, w kolejności z przeglądarki. */
function blokiStref(reka: string, strefy: { opis: string; imageBase64: string }[] | undefined): Blok[] {
  return (strefy ?? []).flatMap((s): Blok[] => [
    { type: "text", text: `RĘKA ${reka} — ${s.opis}:` },
    { type: "image", source: { type: "base64", media_type: "image/jpeg", data: s.imageBase64 } },
  ]);
}

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
    parsed.deklaracje?.length
      ? "ZNAKI ZGŁOSZONE PRZEZ OSOBĘ (widzi je na żywo na swojej dłoni):\n" + parsed.deklaracje
        .map((d, i) => `${i + 1}. ${d.znak} — ${d.miejsce}, ręka ${d.reka === "wiodaca" ? "wiodąca" : "bierna"}`).join("\n")
      : null,
  ].filter(Boolean).join("\n");

  // oględziny wszystkich zbliżeń obu rąk równolegle — przed odczytem
  const [ogledzinyW, ogledzinyB] = await Promise.all([
    ogledziny("WIODĄCA", parsed.wiodaca.strefy),
    ogledziny("BIERNA", parsed.bierna.strefy),
  ]);
  const ogledzinyTekst = [...ogledzinyW, ...ogledzinyB].join("\n\n");

  const stream = client.messages.stream({
    model: "claude-opus-5",
    // myślenie = notatki „strefa po strefie” przed tekstem; wliczają się w max_tokens
    max_tokens: 20000,
    thinking: { type: "adaptive" },
    output_config: { effort: "high" },
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
          { type: "text", text: "RĘKA WIODĄCA (aktywna — ta, którą osoba pisze) — całe zdjęcie:" },
          { type: "image", source: { type: "base64", media_type: parsed.wiodaca.imageMediaType, data: parsed.wiodaca.imageBase64 } },
          ...blokiStref("WIODĄCA", parsed.wiodaca.strefy),
          { type: "text", text: "RĘKA BIERNA (pasywna) — całe zdjęcie:" },
          { type: "image", source: { type: "base64", media_type: parsed.bierna.imageMediaType, data: parsed.bierna.imageBase64 } },
          ...blokiStref("BIERNA", parsed.bierna.strefy),
          { type: "text", text: kontekstTekst },
          ...(ogledzinyTekst ? [{
            type: "text" as const,
            text: `OGLĘDZINY ZBLIŻEŃ — każde zbliżenie zostało wcześniej osobno, dokładnie przejrzane pod lupą (wynik poniżej). Traktuj to jako Twoje własne, dokładniejsze obserwacje tych fragmentów: znaki i linie z oględzin opisz w odczycie i w bloku danych, łącząc je z tym, co widać na całych zdjęciach. Pomiń pozycję tylko wtedy, gdy na zbliżeniu wyraźnie widać, że to faktura skóry, a nie bruzda.\n\n${ogledzinyTekst}`,
          }] : []),
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
        if (process.env.NODE_ENV === "development") {
          controller.enqueue(encoder.encode(`

[dev] ${(err as Error)?.message ?? String(err)}`));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
