/**
 * Jednorazowy skrypt (Faza 1 reskinu VesicaKarma) — generuje z istniejącego
 * public/brand/kolo-karmy.png dwa nowe zestawy assetów:
 *   1) kolo-karmy-taupe.png — cała grafika odbarwiona do stonowanego taupe
 *      (nowy domyślny stan „nieukończony"), przez sharp .tint().
 *   2) fill-<id>-gold.png (dla astrologia/hiromancja/numerologia) — oryginalne
 *      (złote) piksele kolo-karmy.png przycięte maską w kształcie PIERŚCIENIA
 *      (annulus: środek + promień zewn./wewn.), nie prostokąta — geometria
 *      RINGS zmierzona bezpośrednio z prawdziwych referencji projektowych
 *      (public/brand/nowe-kolo-karmy-podswietlenie*.jpg), patrz metoda niżej.
 *
 *      Wcześniejsza wersja używała bounding-boxa płatka (HOTSPOTY[].gap) —
 *      dawało to nierówny, "narożnikowy" efekt zamiast czystego pierścienia.
 *      Też NIE używamy glow-<id>.png — te maski są flood-fillem WNĘTRZA
 *      płatka (do miękkiej poświaty na hover, zatrzymują się PRZED złotą
 *      linią), więc nałożone na oryginał dają nieomal pustkę.
 *
 *      Metoda pomiaru (patrz git history tego pliku dla dokładnych skryptów
 *      _measure_*.mjs, usuniętych po użyciu): w referencyjnym zrzucie ze
 *      znanym kontenerem znaleziono piksele jasnozłote (próg jasności+barwy),
 *      dopasowano bbox pierścienia (kwadrat = okrąg), przeliczono skalę
 *      i offset względem bbox całego kwiatu w kolo-karmy.png (linia bazowa:
 *      CX=596,CY=378,R_OUTER=350 → bbox 700×700), a promień zewn./wewn.
 *      pierścienia zmierzono skanem radialnym pod 8 kątami.
 *
 * Uruchamiane lokalnie: `node scripts/recolor-kolo-karmy.mjs`. Wynikowe PNG
 * commitowane do public/brand/ — skrypt nie jest częścią builda/runtime.
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "..", "public", "brand");
const basePath = path.join(dir, "kolo-karmy.png");

const IMG_W = 1260, IMG_H = 761;

/** Geometria pętli w przestrzeni kolo-karmy.png (1260×761), zmierzona z
 *  referencji projektowych — środek + promień zewnętrzny/wewnętrzny pasa. */
const RINGS = {
  astrologia: { cx: 599, cy: 255, rOuter: 204, rInner: 166 },
  hiromancja: { cx: 495, cy: 439, rOuter: 204, rInner: 166 },
  numerologia: { cx: 701, cy: 439, rOuter: 204, rInner: 166 },
};

/** Stary kompas (piktogram Astrologii, wypalony w kolo-karmy.png) — wycinany
 *  do przezroczystości, żeby zastąpić go MoonStars.tsx (gwiazdy+księżyc).
 *  Sam dorysowany kompas był niewidoczny (nakładałem gwiazdy OBOK niego,
 *  nigdy go nie usuwając), więc w praktyce nic się nie zmieniało. Krąg
 *  mieści się w całości wewnątrz wewnętrznego promienia pierścienia
 *  Astrologii (odległość środek-środek ~85 < rInner 170), więc nie dotyka
 *  złotej linii pierścienia. Promień domierzony wizualnie z icon-astrologia.png
 *  (kompas prawie wypełnia swój kwadrat 150×150, z małym zapasem od pierścienia
 *  w rogu). */
const KOMPAS_DZIURA = { cx: 600, cy: 166, r: 78, feather: 6 };

/** Klin dokładnie nad trójkątem — dokładnie zmierzony w kolo-karmy.png:
 *  długi, wąski, PRZEKĄTNY kształt od ostrego czubka (~597,308) do miejsca,
 *  gdzie zlewa się z szerokim pasem Astrologii nad nim (~655,272). Kółko nie
 *  pasuje do tak wydłużonego kształtu (albo za mało kryje na końcach, albo
 *  za dużo w środku) — stąd elipsa obrócona pod kątem tej samej przekątnej.
 *  Ten obszar wizualnie należy do pętli Astrologii/Numerologii, która w tym
 *  miejscu przechodzi NAD Chiromancją, ale jest zbyt jasno/niejednoznacznie
 *  oświetlony, żeby płynna maska jasności sama go wygasiła do czystej
 *  szarości. Twarde (potem rozmyte na brzegu) wycięcie — tylko dla pętli,
 *  do której NIE należy (obecnie: hiromancja). Zgłoszone przez użytkownika
 *  zdjęciami z zaznaczeniem. */
const KLIN_NAD_TROJKATEM = { cx: 642, cy: 305, rx: 58, ry: 26, obrotDeg: -32 };

/** Drugi, osobny wyciek — wyzej i bardziej w lewo niz KLIN_NAD_TROJKATEM, na
 *  tym samym skrzyzowaniu (Astrologia nad Chiromancja). Zgloszony zrzutem
 *  ekranu: na szarym pierscieniu Astrologii byl widoczny zlocisty, ostry
 *  klin — maska jasnosci nie wygaszala go w pelni, a byl STOPIONY (ta sama
 *  spojna plama pikseli co reszta petli Chiromancji), wiec `odrzucMalePlamki`
 *  nie mogla go usunac wg rozmiaru bez ucinania prawdziwego luku pierscienia.
 *  Namierzone connected-component scanem pieciu tysiecy pikseli w fill-
 *  hiromancja-gold.png, potem elipsa dopasowana iteracyjnie do zniknięcia. */
const KLIN_GORNY_LEWY = { cx: 592, cy: 278, rx: 55, ry: 42, obrotDeg: -35 };

/** Stara dłoń (piktogram Chiromancji) — wycinana tym samym sposobem co
 *  kompas, ale maską o dokładnym kształcie dłoni (nie okręgiem — dłoń nie
 *  jest okrągła), zapisaną raz jako erase-hiromancja-mask.png. Ta maska to
 *  największa spójna plama pikseli ze STAREGO icon-hiromancja.png (przed
 *  podmianą na nową dłoń z public/brand/dlon.jpg) — odrzuca małe fragmenty
 *  złotego pierścienia w rogach kadru, które inaczej zostałyby błędnie
 *  wycięte razem z dłonią. Metoda: patrz git history tego pliku
 *  (scripts/_extract_hand_mask.mjs, usunięty po użyciu). */
const DLON_MASKA = path.join(dir, "erase-hiromancja-mask.png");

/** Stare cyfry „375"/„1" (piktogram Numerologii) — WAŻNE: icon-numerologia.png
 *  okazał się NIE być pixel-aligned ze swoim odpowiednikiem w kolo-karmy.png
 *  (osobno wyeksportowany asset, inna skala/pozycja) — próba budowy maski
 *  z jego kształtu (jak przy dłoni) dawała tylko częściowe wycięcie
 *  ("duchy" starych cyfr). Próbna elipsa obejmująca cały obszar była za
 *  duża i ucinała kawałek sąsiedniego pierścienia. Ostateczna wersja:
 *  dokładny kształt cyfr zmierzony BEZPOŚREDNIO z kolo-karmy.png (blob-y
 *  nie dotykające krawędzi pudełka [715,400,870,550] — odrzuca fragmenty
 *  pierścienia w rogach), z poprawną dylatacją: blur tworzy miękką otoczkę
 *  wokół KAŻDEGO kształtu niezależnie od jego grubości (cienkie kreski typu
 *  "1" też dostają otoczkę), próg zamienia otoczkę z powrotem w twardy,
 *  powiększony kształt — bez tego cienkie kreski zostawały nietknięte. */
const NUMERY_MASKA = path.join(dir, "erase-numerologia-mask.png");

/** Ikony "wspólnych danych" (dom/klepsydra/gwiazda w trójkącie/postać) mają
 *  zostać złote ZAWSZE, niezależnie od stanu pierścieni — potwierdzone
 *  porównaniem z plikami referencyjnymi (nie należą do żadnego z trzech
 *  systemów z osobna). Maska: scripts/generate-shared-icons-mask.mjs. */
const SHARED_ICONS_MASKA = path.join(dir, "shared-icons-mask.png");

async function tauped(input) {
  return sharp(input).tint({ r: 0x47, g: 0x41, b: 0x3b }).modulate({ brightness: 0.41 });
}

/** Przywraca oryginalne (złote) piksele kolo-karmy.png na wierzchu
 *  odbarwionego `input`, dokładnie w miejscach wskazanych przez
 *  SHARED_ICONS_MASKA (dest-in na kopii oryginału, potem zwykłe "over"). */
async function przywrocWspolneIkony(input) {
  const oryginalneWMasce = await sharp(basePath)
    .composite([{ input: SHARED_ICONS_MASKA, blend: "dest-in" }])
    .png()
    .toBuffer();
  return sharp(await input.toBuffer()).composite([{ input: oryginalneWMasce, blend: "over" }]);
}

/** Wypełnienie (flood fill, 8-spójność) od zalążka na pętli Chiromancji —
 *  zbiera WSZYSTKIE piksele realnie połączone z nią w oryginalnym pliku
 *  (cały "kwiat" + pierścień Karmy, bo w prawdziwej grafice się stykają),
 *  zatrzymując się dokładnie tam, gdzie plik jest naprawdę przezroczysty.
 *  Efekt: prawdziwa, ostra granica każdej przerwy w grafice, bez zgadywania
 *  współrzędnych okręgiem. Używana jako dodatkowe AND do masek pierścieni —
 *  koło Karmy (wykluczenie) i tak odcina sam "kwiat" od Karmy tam, gdzie
 *  w pliku nie ma między nimi realnej przerwy. */
async function wypelnijKwiat(imgPath, width, height, seed = [306, 439]) {
  const { data } = await sharp(imgPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const channels = 4;
  const alphaAt = (x, y) => data[(y * width + x) * channels + 3];
  // domyślny zalążek: lewy kraniec pętli Chiromancji (170..208 od cx=495,cy=439)
  const visited = new Uint8Array(width * height);
  const stack = [seed];
  visited[seed[1] * width + seed[0]] = 1;
  const out = Buffer.alloc(width * height * 4);
  while (stack.length) {
    const [x, y] = stack.pop();
    const idx = y * width + x;
    out[idx * 4] = 255; out[idx * 4 + 1] = 255; out[idx * 4 + 2] = 255; out[idx * 4 + 3] = 255;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const nidx = ny * width + nx;
      if (visited[nidx]) continue;
      visited[nidx] = 1;
      if (alphaAt(nx, ny) < 40) continue;
      stack.push([nx, ny]);
    }
  }
  return sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

/** Maska "własnej, oświetlonej powierzchni" pętli — PŁYNNA (nie progowa):
 *  przezroczystość każdego piksela jest wprost proporcjonalna do jego
 *  prawdziwej jasności w kolo-karmy.png (pełne światło ~212 -> 100%
 *  widoczne; zmierzony cień przeplotu, ~111-144 w zależności od miejsca
 *  -> płynnie w stronę 0%). Dzięki temu tam, gdzie w prawdziwej grafice
 *  SĄSIEDNIA pętla (albo Karma) przechodzi NAD, złote wypełnienie samo
 *  gaśnie w naturalny gradient (zamiast twardo znikać), odsłaniając pod
 *  spodem bazowy (taupe) render tej sąsiedniej pętli — dokładnie tak, jak
 *  wygląda cień na szarych pierścieniach, bo to TEN SAM realny gradient
 *  z pliku, tylko przeniesiony na kanał alfa zamiast progowany na 0/1.
 *  Wcześniejsza wersja z twardym progiem (195) dawała ostrą, "obciętą"
 *  krawędź zamiast naturalnego cienia. Poniżej ciemno (~120) = w pełni
 *  przezroczyste, powyżej jasno (~205) = w pełni widoczne, między — liniowa
 *  rampa (to samo, co robi realny cień w oryginale). */
async function maskaJasnosci(imgPath, width, height, ciemno = 120, jasno = 205) {
  const { data } = await sharp(imgPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const channels = 4;
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    const lum = (data[o] + data[o + 1] + data[o + 2]) / 3;
    const a = Math.max(0, Math.min(255, Math.round(((lum - ciemno) / (jasno - ciemno)) * 255)));
    out[o] = 255; out[o + 1] = 255; out[o + 2] = 255; out[o + 3] = a;
  }
  return sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

/** Po przycięciu do własnego okręgu + spójnej plamy + jasności pierścień
 *  jest już podzielony na kilka NIEZALEŻNYCH, prawidłowych łuków (każde
 *  przecięcie z sąsiednią pętlą robi przerwę) — to normalne i wszystkie
 *  trzeba zostawić. Czasem zostaje jednak dodatkowo mała, ODIZOLOWANA
 *  plamka (np. diament dokładnie w punkcie, gdzie schodzą się wszystkie
 *  trzy pętle — jaśniejsza niż próg maski jasności, ale odcięta cieniami
 *  z OBU stron od najbliższego łuku). Taka plamka jest o rząd wielkości
 *  mniejsza niż jakikolwiek prawdziwy odcinek pierścienia, więc filtr wg
 *  rozmiaru (nie "tylko największa") bezpiecznie usuwa tylko ją.
 *  WAŻNE: maska jasności jest teraz płynna (gradient, nie 0/1) — łączność
 *  liczona jest od progu "jest tu w ogóle jakiś ślad" (alfa > 10), ale
 *  zachowywane piksele zostają z ORYGINALNĄ (płynną) wartością alfa, nie
 *  spłaszczone do 255 — inaczej zniknąłby naturalny gradient cienia. */
async function odrzucMalePlamki(maskBuffer, width, height, minRozmiar = 3000) {
  const { data } = await sharp(maskBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const channels = 4;
  const alphaAt = (x, y) => data[(y * width + x) * channels + 3];
  const visited = new Uint8Array(width * height);
  const keep = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx] || alphaAt(x, y) <= 10) continue;
      const stack = [[x, y]];
      visited[idx] = 1;
      const pixels = [idx];
      while (stack.length) {
        const [cx2, cy2] = stack.pop();
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
          const nx = cx2 + dx, ny = cy2 + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const nidx = ny * width + nx;
          if (visited[nidx] || alphaAt(nx, ny) <= 10) continue;
          visited[nidx] = 1;
          pixels.push(nidx);
          stack.push([nx, ny]);
        }
      }
      if (pixels.length >= minRozmiar) keep.push(...pixels);
    }
  }
  const out = Buffer.alloc(width * height * 4);
  for (const idx of keep) {
    out[idx * 4] = 255; out[idx * 4 + 1] = 255; out[idx * 4 + 2] = 255; out[idx * 4 + 3] = data[idx * 4 + 3];
  }
  return sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

async function wytnijMaska(input, maskPathOrBuffer) {
  return sharp(await input.toBuffer()).composite([{ input: maskPathOrBuffer, blend: "dest-out" }]);
}

async function wytnijKompas(input) {
  const { cx, cy, r, feather } = KOMPAS_DZIURA;
  const svg = `<svg width="${IMG_W}" height="${IMG_H}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/>
  </svg>`;
  const mask = await sharp(Buffer.from(svg)).blur(feather).png().toBuffer();
  return wytnijMaska(input, mask);
}

async function wytnijDlon(input) {
  return wytnijMaska(input, DLON_MASKA);
}

async function wytnijNumery(input) {
  return wytnijMaska(input, NUMERY_MASKA);
}

async function main() {
  await przywrocWspolneIkony(await wytnijNumery(await wytnijDlon(await wytnijKompas(await tauped(basePath))))).then((s) => s.toFile(path.join(dir, "kolo-karmy-taupe.png")));
  await wytnijNumery(await wytnijDlon(await wytnijKompas(sharp(basePath)))).then((s) => s.toFile(path.join(dir, "kolo-karmy-gold-clean.png")));

  // icon-<id>.png (nakładki do pulsowania na hover, KoloKarmy.tsx
  // PIKTOGRAMY_PULSUJACE) leżą ZAWSZE w DOM, nie tylko na hover — w spoczynku
  // były niewidoczne, bo pokrywały się piksel w piksel ze złotym tłem. Odkąd
  // tło jest taupe, potrzebują własnej taupe wersji na domyślny stan.
  // Astrologia pominięta — kompas usunięty, zastąpiony przez MoonStars.tsx.
  for (const id of Object.keys(RINGS).filter((s) => s !== "astrologia")) {
    const iconPath = path.join(dir, `icon-${id}.png`);
    await tauped(iconPath).then((s) => s.toFile(path.join(dir, `icon-${id}-taupe.png`)));
  }

  // Bez wycinania sąsiednich pętli okręgiem-przybliżeniem (astrologia/
  // numerologia/hiromancja nawzajem, ani zewnętrznego pierścienia Karmy) —
  // maska to kształt WŁASNEGO pierścienia, przycięty do (1) realnej, spójnej
  // plamy pikseli z kolo-karmy.png (wypełnienie od zalążka na pętli,
  // zatrzymujące się dokładnie tam, gdzie plik jest naprawdę przezroczysty)
  // oraz (2) maski jasności — PŁYNNEJ, nie progowej: przezroczystość rośnie
  // wprost z jasnością piksela, więc tam, gdzie w prawdziwej grafice
  // SĄSIEDNIA pętla/Karma przechodzi NAD, złote wypełnienie samo gaśnie w
  // naturalny gradient (jak realny cień w oryginale), zamiast twardo znikać
  // i odsłaniać bazowy (taupe) render tej sąsiedniej pętli po ostrej linii.
  // Obie granice (przezroczystość, jasność) są z realnego pliku — zero
  // zgadywania geometrii; jedyne rozmycie w całym procesie to ten sam
  // gradient, który i tak jest widoczny na szarych pierścieniach.
  const flowerMask = await wypelnijKwiat(basePath, IMG_W, IMG_H);
  const jasnoscMask = await maskaJasnosci(basePath, IMG_W, IMG_H);
  for (const [id, { cx, cy, rOuter, rInner }] of Object.entries(RINGS)) {
    const strokeW = rOuter - rInner;
    const r = (rOuter + rInner) / 2;
    const svg = `<svg width="${IMG_W}" height="${IMG_H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#fff" stroke-width="${strokeW}"/>
    </svg>`;
    const maskOstra = await sharp(Buffer.from(svg)).png().toBuffer();
    const kompozycja = [{ input: flowerMask, blend: "dest-in" }, { input: jasnoscMask, blend: "dest-in" }];
    if (id === "hiromancja") {
      // Miękki brzeg (rozmycie TYLKO tej elipsy) — twardy kształt wyglądał
      // jak sztuczny ubytek na tle naturalnych, gradientowych cieni dookoła.
      // Promień rozmycia dobrany tak, żeby zanikanie było podobnej
      // szerokości co realne cienie przeplotów. Dwa osobne kliny na tym samym
      // skrzyżowaniu (Astrologia nad Chiromancją) — patrz komentarze przy
      // stałych KLIN_NAD_TROJKATEM / KLIN_GORNY_LEWY.
      for (const { cx: kcx, cy: kcy, rx: krx, ry: kry, obrotDeg } of [KLIN_NAD_TROJKATEM, KLIN_GORNY_LEWY]) {
        const wykluczenieKlina = await sharp(Buffer.from(
          `<svg width="${IMG_W}" height="${IMG_H}" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="${kcx}" cy="${kcy}" rx="${krx}" ry="${kry}" fill="#fff"
              transform="rotate(${obrotDeg} ${kcx} ${kcy})"/>
          </svg>`,
        )).blur(14).png().toBuffer();
        kompozycja.push({ input: wykluczenieKlina, blend: "dest-out" });
      }
    }
    const maskPrzycieta = await sharp(maskOstra).composite(kompozycja).png().toBuffer();
    const mask = await odrzucMalePlamki(maskPrzycieta, IMG_W, IMG_H);
    let wynik = sharp(basePath).composite([{ input: mask, blend: "dest-in" }]);

    // Łatka na róg pierścienia Chiromancji (scripts/generate-hiromancja-corner-patch.mjs)
    // celowo pominięta — maska dłoni, z której korzysta, jest nieaktualna
    // względem obecnej grafiki dłoni (dlon.jpg), więc łatka dokładała twardy,
    // prostokątny fragment zamiast subtelnej poprawki rogu (widoczny artefakt).

    await wynik.toFile(path.join(dir, `fill-${id}-gold.png`));
  }

  // fill-zwiazki-gold.png — ikona Związków (dwa zachodzące koła) na hover ma
  // podświetlać się złotem tak samo jak Astrologia/Chiromancja/Numerologia:
  // realny, ostry wycinek własnego kształtu z kolo-karmy.png (ikona jest w
  // pliku odizolowana od reszty kwiatu, więc samo wypełnienie od zalążka
  // wewnątrz jednego z dwóch kółek wystarcza, bez żadnej maski pierścienia).
  const zwiazkiMask = await wypelnijKwiat(basePath, IMG_W, IMG_H, [1012, 610]);
  await sharp(basePath).composite([{ input: zwiazkiMask, blend: "dest-in" }]).toFile(path.join(dir, "fill-zwiazki-gold.png"));

  console.log("Gotowe:", [
    "kolo-karmy-taupe.png",
    "kolo-karmy-gold-clean.png",
    ...Object.keys(RINGS).filter((s) => s !== "astrologia").map((s) => `icon-${s}-taupe.png`),
    ...Object.keys(RINGS).map((s) => `fill-${s}-gold.png`),
    "fill-zwiazki-gold.png",
  ].join(", "));
}

main();
