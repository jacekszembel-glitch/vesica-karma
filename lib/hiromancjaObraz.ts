/**
 * OBRÓBKA ZDJĘCIA DŁONI w przeglądarce — nic z tego nie trafia na dysk ani do bazy.
 *
 * Dlaczego tak: cała dłoń pomniejszona do jednego obrazka gubi to, co w chiromancji
 * najciekawsze — drobne linie, wyspy, krzyżyki, kreski pod palcami. Dlatego AI dostaje:
 *  - całe zdjęcie w rozdzielczości, którą ogląda bez dodatkowego pomniejszania (1568 px),
 *  - ZBLIŻENIA stref dłoni wycięte z ORYGINAŁU (pełna ostrość telefonu): górna część dłoni
 *    (wzgórki pod palcami, linia serca), dolna (linia życia, Wenus, Księżyc, nadgarstek)
 *    i palce. Ramki stref wskazuje szybkie sprawdzenie zdjęcia (/api/hiromancja-sprawdz);
 *    zanim przyjdą (albo gdy się nie uda) — siatka 2×2 środka zdjęcia.
 *
 * Do tego natychmiastowa, lokalna ocena ostrości i jasności (bez AI), żeby od razu
 * podpowiedzieć ponowne zdjęcie.
 */

/** Długość dłuższego boku, przy której AI ogląda obraz bez własnego pomniejszania. */
const BOK_GLOWNY = 1568;
/** Oryginał do wycinania stref i wskazanych miejsc trzymamy jako zdekodowany obraz (ImageBitmap),
 *  NIE jako płótno — iPhone nie tworzy płótna większego niż ~16 mln pikseli, a zdjęcie z telefonu
 *  ma 12–48 mln. Z ImageBitmap wycinamy fragmenty bez kopiowania całości. */
export type ZrodloObrazu = ImageBitmap;
/** Wycinki: do 1568 px — tyle AI ogląda bez własnego pomniejszania. */
const BOK_STREFY = 1568;

export interface Strefa {
  /** Co pokazuje wycinek — trafia do AI jako podpis obrazu. */
  opis: string;
  base64: string;
}

/** Ramka w ułamkach szerokości/wysokości zdjęcia (0–1): [x0, y0, x1, y1]. */
export type Ramka = [number, number, number, number];
export interface RamkiDloni {
  dlon: Ramka | null;
  palce: Ramka | null;
}

export interface OcenaLokalna {
  /** Wariancja laplasjanu (ostrość) — im wyżej, tym ostrzej. */
  ostrosc: number;
  /** Średnia jasność 0–255. */
  jasnosc: number;
  problem: string | null;
}

function doCanvas(zrodlo: CanvasImageSource, sw: number, sh: number, maksBok: number, wyc?: { x: number; y: number; w: number; h: number }) {
  const w0 = wyc?.w ?? sw, h0 = wyc?.h ?? sh;
  const skala = Math.min(1, maksBok / Math.max(w0, h0));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w0 * skala));
  c.height = Math.max(1, Math.round(h0 * skala));
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Brak kontekstu canvas");
  ctx.imageSmoothingQuality = "high";
  if (wyc) ctx.drawImage(zrodlo, wyc.x, wyc.y, wyc.w, wyc.h, 0, 0, c.width, c.height);
  else ctx.drawImage(zrodlo, 0, 0, c.width, c.height);
  return c;
}

const base64Z = (c: HTMLCanvasElement, jakosc: number) => c.toDataURL("image/jpeg", jakosc).split(",")[1] ?? "";

/** Ostrość i jasność na pomniejszonej (1024 px) kopii w skali szarości. */
function ocenLokalnie(zrodlo: ZrodloObrazu | HTMLCanvasElement): OcenaLokalna {
  const c = doCanvas(zrodlo, zrodlo.width, zrodlo.height, 1024);
  const { width: w, height: h } = c;
  const px = c.getContext("2d")!.getImageData(0, 0, w, h).data;
  const szare = new Float32Array(w * h);
  let suma = 0;
  for (let i = 0; i < w * h; i++) {
    const v = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    szare[i] = v;
    suma += v;
  }
  const jasnosc = suma / (w * h);
  // laplasjan tylko w środkowej części kadru — tam jest dłoń, tło bywa celowo rozmyte
  let n = 0, s = 0, s2 = 0;
  for (let y = Math.floor(h * 0.2); y < Math.floor(h * 0.8); y++) {
    for (let x = Math.floor(w * 0.2); x < Math.floor(w * 0.8); x++) {
      const i = y * w + x;
      const l = 4 * szare[i] - szare[i - 1] - szare[i + 1] - szare[i - w] - szare[i + w];
      s += l; s2 += l * l; n++;
    }
  }
  const ostrosc = n ? s2 / n - (s / n) ** 2 : 0;
  const problem =
    jasnosc < 55 ? "Zdjęcie jest bardzo ciemne — zrób je przy oknie albo z lampą z boku."
      : jasnosc > 215 ? "Zdjęcie jest prześwietlone — linie giną w jasnym świetle. Odsuń się od lampy albo wyłącz flesz."
        : ostrosc < 12 ? "Zdjęcie wygląda na nieostre — przytrzymaj telefon stabilnie i stuknij w dłoń na ekranie, żeby ustawić ostrość."
          : null;
  return { ostrosc, jasnosc, problem };
}

export interface ZdjecieDloni {
  dataUrl: string;
  base64: string;
  mediaType: "image/jpeg";
  /** Zbliżenia stref (siatka albo strefy z ramek). */
  strefy: Strefa[];
  lokalnie: OcenaLokalna;
  /** Oryginał w pamięci — tylko do ponownego wycięcia stref, nigdy nie wysyłany w całości. */
  zrodlo: ZrodloObrazu;
}

export async function przygotujZdjecie(file: File): Promise<ZdjecieDloni> {
  const zrodlo = await createImageBitmap(file);
  const glowny = doCanvas(zrodlo, zrodlo.width, zrodlo.height, BOK_GLOWNY);
  const dataUrl = glowny.toDataURL("image/jpeg", 0.86);
  return {
    dataUrl,
    base64: dataUrl.split(",")[1] ?? "",
    mediaType: "image/jpeg",
    strefy: wytnijStrefy(zrodlo, null),
    lokalnie: ocenLokalnie(zrodlo),
    zrodlo,
  };
}

const ogranicz = (v: number) => Math.min(1, Math.max(0, v));

function wytnij(zrodlo: ZrodloObrazu, r: Ramka, opis: string, jakosc = 0.83): Strefa {
  const W = zrodlo.width, H = zrodlo.height;
  const x0 = ogranicz(r[0]) * W, y0 = ogranicz(r[1]) * H, x1 = ogranicz(r[2]) * W, y1 = ogranicz(r[3]) * H;
  const c = doCanvas(zrodlo, W, H, BOK_STREFY, { x: x0, y: y0, w: Math.max(8, x1 - x0), h: Math.max(8, y1 - y0) });
  return { opis, base64: base64Z(c, jakosc) };
}

/** Poszerza ramkę o margines (ułamek jej rozmiaru) — ramki z AI są przybliżone. */
function poszerz(r: Ramka, m: number): Ramka {
  const w = r[2] - r[0], h = r[3] - r[1];
  return [r[0] - w * m, r[1] - h * m, r[2] + w * m, r[3] + h * m];
}

/**
 * Wycinki stref. Z ramkami: górna i dolna połowa dłoni (z zakładką) + palce.
 * Bez ramek: siatka 2×2 środkowej części kadru, też z zakładką.
 */
/** Podpis zbliżenia środka dłoni — po nim doOdczytu() rozpoznaje tę strefę i wysyła ją zawsze. */
export const OPIS_SRODKA = "ZBLIŻENIE — środek dłoni (pełna rozdzielczość): tu linia głowy, linia losu i linia Merkurego (a także linia życia) przecinają się i mogą zamykać TRÓJKĄT — sprawdź, czy trzy linie tworzą zamknięty trójkątny kształt, także gdy któraś jest słaba albo z odcinków; po stronie kciuka od linii losu — czy linie losu, życia i głowy zamykają wydłużony kształt ŁODZI; czworobok, krzyż mistyczny, równina Marsa (Rahu)";

export function wytnijStrefy(zrodlo: ZrodloObrazu, ramki: RamkiDloni | null): Strefa[] {
  const d = ramki?.dlon;
  if (d && d[2] - d[0] > 0.1 && d[3] - d[1] > 0.1) {
    const p = poszerz(d, 0.08);
    const h = p[3] - p[1];
    // dłoń może być sfotografowana palcami w górę albo w dół — „górę” wyznacza położenie palców
    const palceWyzej = !ramki?.palce || (ramki.palce[1] + ramki.palce[3]) / 2 < (d[1] + d[3]) / 2;
    const przyPalcach: Ramka = palceWyzej ? [p[0], p[1], p[2], p[1] + h * 0.58] : [p[0], p[3] - h * 0.58, p[2], p[3]];
    const przyNadgarstku: Ramka = palceWyzej ? [p[0], p[1] + h * 0.42, p[2], p[3] + h * 0.1] : [p[0], p[1] - h * 0.1, p[2], p[1] + h * 0.58];
    const strefy = [
      wytnij(zrodlo, przyPalcach, "ZBLIŻENIE — część dłoni przy palcach: wzgórki pod palcami (Jowisz, Saturn, Słońce, Merkury), linia serca, początek linii głowy, kreski pod palcami, ewentualny pierścień Salomona i pas Wenus"),
      wytnij(zrodlo, przyNadgarstku, "ZBLIŻENIE — część dłoni przy nadgarstku: linia życia i jej koniec, wzgórek Wenus (nasada kciuka), wzgórek Księżyca (krawędź dłoni), początek linii losu, bransoletki na nadgarstku"),
      wytnij(zrodlo, palceWyzej ? [p[0] + (p[2] - p[0]) * 0.12, p[1] + h * 0.28, p[2] - (p[2] - p[0]) * 0.12, p[1] + h * 0.78]
        : [p[0] + (p[2] - p[0]) * 0.12, p[1] + h * 0.22, p[2] - (p[2] - p[0]) * 0.12, p[1] + h * 0.72], OPIS_SRODKA, 0.86),
    ];
    if (ramki?.palce && ramki.palce[2] - ramki.palce[0] > 0.05) {
      strefy.push(wytnij(zrodlo, poszerz(ramki.palce, 0.06), "ZBLIŻENIE — palce: długości względem siebie (wskazujący vs serdeczny), człony, czubki, kciuk, paznokcie"));
    }
    return strefy;
  }
  const nazwy = ["lewa górna", "prawa górna", "lewa dolna", "prawa dolna"];
  return [wytnij(zrodlo, [0.24, 0.26, 0.76, 0.78], OPIS_SRODKA, 0.86), ...[0, 1, 2, 3].map((i) => {
    const kol = i % 2, rzad = Math.floor(i / 2);
    const x0 = 0.06 + kol * 0.4, y0 = 0.06 + rzad * 0.4;
    return wytnij(zrodlo, [x0, y0, x0 + 0.48, y0 + 0.48], `ZBLIŻENIE — ${nazwy[i]} ćwiartka zdjęcia (pełna rozdzielczość, do drobnych linii i znaków)`, 0.8);
  })];
}

/* ---------- sesja zdjęć: dodatkowe ujęcia i wskazane miejsca ---------- */

export type TypUjecia = "gora" | "dol" | "zgieta" | "krawedz" | "grzbiet";

/** Kolejność = priorytet przy limicie wielkości zapytania. */
export const UJECIA: { typ: TypUjecia; nazwa: string; instrukcja: string; zalecane: boolean; opisDlaAI: string }[] = [
  {
    typ: "gora", nazwa: "Zbliżenie górnej połowy", zalecane: true,
    instrukcja: "Telefon 10–15 cm nad dłonią, w kadrze od nasady palców do środka dłoni. Stuknij w środek dłoni, żeby złapać ostrość.",
    opisDlaAI: "OSOBNE ZDJĘCIE z bliska — górna połowa dłoni: wzgórki pod palcami (Jowisz, Saturn, Słońce, Merkury), linia serca, czworobok między linią serca a głowy",
  },
  {
    typ: "dol", nazwa: "Zbliżenie dolnej połowy", zalecane: true,
    instrukcja: "Telefon 10–15 cm nad dłonią, w kadrze od środka dłoni do nadgarstka, z nasadą kciuka i krawędzią dłoni.",
    opisDlaAI: "OSOBNE ZDJĘCIE z bliska — dolna połowa dłoni: linia życia, wzgórek Wenus, wzgórek Księżyca, początek linii losu, bransoletki",
  },
  {
    typ: "zgieta", nazwa: "Dłoń lekko zgięta", zalecane: true,
    instrukcja: "Lekko zegnij dłoń, jak przy obejmowaniu dużej piłki — linie się pogłębiają i drobne znaki wychodzą wyraźniej. Zdjęcie z góry.",
    opisDlaAI: "OSOBNE ZDJĘCIE — dłoń lekko zgięta (linie pogłębione, drobne znaki wyraźniejsze)",
  },
  {
    typ: "krawedz", nazwa: "Krawędź dłoni z boku", zalecane: false,
    instrukcja: "Dłoń bokiem, od strony małego palca — tak, żeby było widać krawędź pod małym palcem.",
    opisDlaAI: "OSOBNE ZDJĘCIE — krawędź dłoni od strony małego palca (linie relacji, wzgórek Księżyca z boku)",
  },
  {
    typ: "grzbiet", nazwa: "Grzbiet dłoni z paznokciami", zalecane: false,
    instrukcja: "Dłoń wierzchem do góry, palce rozsunięte, paznokcie w kadrze.",
    opisDlaAI: "OSOBNE ZDJĘCIE — grzbiet dłoni z paznokciami (kształt paznokci, kłykcie, palce)",
  },
];

export interface Ujecie {
  typ: TypUjecia;
  dataUrl: string;
  base64: string;
  lokalnie: OcenaLokalna;
}

const BOK_UJECIA = 1568;

export async function przygotujUjecie(file: File, typ: TypUjecia): Promise<Ujecie> {
  // dodatkowe ujęcie nie potrzebuje oryginału po przygotowaniu — zwalniamy pamięć od razu
  const bitmap = await createImageBitmap(file);
  const c = doCanvas(bitmap, bitmap.width, bitmap.height, BOK_UJECIA);
  bitmap.close?.();
  const dataUrl = c.toDataURL("image/jpeg", 0.8);
  return { typ, dataUrl, base64: dataUrl.split(",")[1] ?? "", lokalnie: ocenLokalnie(c) };
}

/** Miejsce wskazane stuknięciem — punkt w ułamkach (0–1) obrazu. */
export interface Miejsce { x: number; y: number }

/** Kwadratowy wycinek wokół wskazanego miejsca, z oryginału w pełnej rozdzielczości. */
export function wytnijMiejsce(zrodlo: ZrodloObrazu, m: Miejsce, nr: number): Strefa {
  // ok. 1/5 krótszego boku — z oryginału 4000×3000 to ~600 px samego miejsca, bez pomniejszania
  const bok = 0.2 * Math.min(zrodlo.width, zrodlo.height);
  const fx = bok / zrodlo.width, fy = bok / zrodlo.height;
  const r: Ramka = [m.x - fx / 2, m.y - fy / 2, m.x + fx / 2, m.y + fy / 2];
  return wytnij(zrodlo, r, `MIEJSCE WSKAZANE PRZEZ OSOBĘ nr ${nr} — duże zbliżenie z oryginału; osoba prosi o dokładne obejrzenie tego miejsca i nie mówi, czego się spodziewa`, 0.86);
}
