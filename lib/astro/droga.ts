import type { PlanetId } from "./constants";
import { PLANET_ORDER, RASIS } from "./constants";
import type { VedicChart } from "./chart";
import { jogakaraka, karakiCzarowe } from "./karaki";
import { activeChain, vimshottari } from "./dasha";
import type { DlonWLiczbach } from "./zgodnosc";
import { KOLUMNY_RAK, type SpojnoscRak, type WierszRak } from "./spojnosc";

/**
 * TWOJA DROGA — czym się charakteryzuje (tabela 5 w Twojej Karmie). Każda cecha jest policzona
 * z danych i ma podane źródło; tam, gdzie da się to sprawdzić drugim systemem (żywioł: kosmogram
 * i typ dłoni), pokazujemy, czy się zgadzają. Nic tu nie jest dopisane „do klimatu”.
 */

export interface CechaDrogi {
  id: string;
  cecha: string;
  /** Krótko, jednym zdaniem — co wychodzi. */
  wynik: string;
  /** Rozwinięcie — co to znaczy w praktyce. */
  opis?: string;
  /** Skąd to wiemy. */
  zrodla: string;
  /** Zgodność z drugim systemem, gdy da się ją sprawdzić: true = zgadza się, false = nie, null = nie sprawdzano. */
  potwierdzone?: boolean | null;
}

const MIANOWNIK: Record<PlanetId, string> = {
  sun: "Słońce", moon: "Księżyc", mars: "Mars", mercury: "Merkury", jupiter: "Jowisz",
  venus: "Wenus", saturn: "Saturn", rahu: "Rahu", ketu: "Ketu",
};

/** Klasyczne dziedziny domów. */
const DOM: Record<number, string> = {
  1: "Ty — ciało, osobowość, własny start", 2: "pieniądze, rodzina, mowa", 3: "wysiłek, odwaga, komunikacja, własne ręce",
  4: "dom, korzenie, spokój serca", 5: "twórczość, dzieci, nauka, radość", 6: "codzienna praca, służba, zdrowie, pokonywanie trudności",
  7: "związek, partnerzy, współpraca", 8: "przemiany, ukryta wiedza, wspólne zasoby", 9: "sens, nauczyciele, wiara, dalekie podróże",
  10: "kariera, działanie w świecie, dobre imię", 11: "zyski, przyjaciele, spełnienie marzeń", 12: "odosobnienie, zagranica, duchowość, odpuszczanie",
};

const ZYWIOL: Record<string, { nazwa: string; sposob: string }> = {
  ogien: { nazwa: "ogień", sposob: "działaniem i inicjatywą — najpierw robisz, potem analizujesz" },
  ziemia: { nazwa: "ziemia", sposob: "konkretem i budowaniem — liczy się to, co trwałe i namacalne" },
  powietrze: { nazwa: "powietrze", sposob: "myślą i kontaktem — rozmowa, idee, wymiana" },
  woda: { nazwa: "woda", sposob: "uczuciem i intuicją — czujesz, zanim zrozumiesz" },
};
const ZYWIOL_ZNAKU: Record<string, string> = { "ogień": "ogien", ziemia: "ziemia", powietrze: "powietrze", woda: "woda" };

const RYTM: Record<string, { nazwa: string; opis: string }> = {
  kardynalny: { nazwa: "zaczynanie", opis: "najlepiej Ci, gdy coś inicjujesz i nadajesz kierunek; rutyna męczy" },
  "stały": { nazwa: "trwanie", opis: "Twoją siłą jest wytrwałość — utrzymujesz i doprowadzasz do końca" },
  zmienny: { nazwa: "przemiana", opis: "dostosowujesz się, łączysz ludzi i sprawy, dobrze znosisz zmiany" },
};

/** Czego dusza uczy się przez planetę-atmakarakę (Dżajmini) — krótko. */
const LEKCJA_AK: Record<PlanetId, string> = {
  sun: "pokory — blask ma płynąć z autentyczności, nie z potrzeby uznania",
  moon: "współodczuwania — troski o innych i o siebie, bez tłumienia emocji",
  mars: "kierowania siły ku ochronie, nie walce — cierpliwości",
  mercury: "prawdomówności — słowo i rozum w służbie prawdy",
  jupiter: "dzielenia się mądrością bez wywyższania się",
  venus: "kochania bez zawłaszczania — umiaru w przyjemnościach",
  saturn: "wytrwałości i dźwigania ciężaru razem z innymi",
  rahu: "rozpoznawania złudzeń — pragnienia, które nie prowadzą donikąd",
  ketu: "odpuszczania — oderwania od tego, co już niepotrzebne",
};

/** Do jakich zajęć ciągnie planeta — klasyczne znaczenia (amatjakaraka = powołanie). */
const ZAJECIA: Record<PlanetId, string> = {
  sun: "kierowanie, administracja, odpowiedzialność za innych",
  moon: "praca z ludźmi, opieka, gościnność, kontakt z publicznością",
  mars: "działanie, technika, inżynieria, sport, ratownictwo",
  mercury: "słowo, handel, nauka, pisanie, liczby",
  jupiter: "nauczanie, doradztwo, prawo, praca duchowa",
  venus: "sztuka, piękno, projektowanie, relacje z ludźmi",
  saturn: "praca systematyczna, struktury, organizacja, rzemiosło",
  rahu: "nowe technologie, zagranica, rzeczy nietypowe i nowatorskie",
  ketu: "badanie, praca w skupieniu, uzdrawianie, duchowość",
};

const pkt = (r: WierszRak) => KOLUMNY_RAK.reduce((a, k) => a + (r.wartosci[k] ?? 0), 0);
const NAZWA_KOL: Record<string, string> = { d1: "D1", wiodaca: "dłoń wiodąca", d9: "D9", bierna: "dłoń bierna" };
const zrodlaWiersza = (r: WierszRak) =>
  [...KOLUMNY_RAK.filter((k) => (r.wartosci[k] ?? 0) > 0).map((k) => NAZWA_KOL[k]), ...(r.numerologia ? ["liczby"] : [])].join(" · ");

export function twojaDroga(chart: VedicChart, dlon: DlonWLiczbach | null, s: SpojnoscRak, teraz = new Date()): CechaDrogi[] {
  const cechy: CechaDrogi[] = [];
  const domy = !!chart.angles;
  const dom = (p: PlanetId) => chart.planets[p].house;

  // 1. kierunek — najmocniejsze tematy potwierdzone w tabeli 4
  const potw = s.wiersze.filter((r) => r.rodzaj === "zgodne_tak" || r.rodzaj === "wiekszosc_tak")
    .sort((a, b) => pkt(b) / b.n - pkt(a) / a.n || a.szansa - b.szansa);
  if (potw.length) {
    cechy.push({
      id: "kierunek", cecha: "Główny kierunek",
      wynik: potw.slice(0, 2).map((r) => r.temat.nazwa).join(" + "),
      opis: potw[0].temat.wniosek,
      zrodla: `najwyższa spójność w tabeli 4 — ${zrodlaWiersza(potw[0])}`,
    });
  }

  // 2. pole działania — skupisko planet (albo dom władcy ascendentu)
  if (domy) {
    const wDomach = [...Array(12).keys()].map((i) => ({ d: i + 1, ps: PLANET_ORDER.filter((p) => dom(p) === i + 1) }))
      .sort((a, b) => b.ps.length - a.ps.length);
    const top = wDomach[0];
    if (top.ps.length >= 3) {
      cechy.push({
        id: "pole", cecha: "Gdzie się realizujesz",
        wynik: `${top.d}. dom — ${DOM[top.d]}`,
        opis: `Skupisko ${top.ps.length} planet (${top.ps.map((p) => MIANOWNIK[p]).join(", ")}) w znaku ${RASIS[chart.planets[top.ps[0]].sign].pl} — tu idzie najwięcej Twojej energii.`,
        zrodla: "D1 — skupisko planet",
      });
    } else {
      const wladca = RASIS[chart.angles!.lagnaSign].lord;
      cechy.push({
        id: "pole", cecha: "Gdzie się realizujesz",
        wynik: `${dom(wladca)}. dom — ${DOM[dom(wladca)]}`,
        opis: `Władca ascendentu (${MIANOWNIK[wladca]}) stoi w ${dom(wladca)}. domu — tam ciągnie Cię życie.`,
        zrodla: "D1 — władca ascendentu",
      });
    }
  }

  // 3. sposób — żywioł: kosmogram (7 planet + ascendent) i typ dłoni
  const licz: Record<string, number> = { ogien: 0, ziemia: 0, powietrze: 0, woda: 0 };
  for (const p of ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"] as PlanetId[]) licz[ZYWIOL_ZNAKU[RASIS[chart.planets[p].sign].element]]++;
  if (domy) licz[ZYWIOL_ZNAKU[RASIS[chart.angles!.lagnaSign].element]] += 2; // ascendent waży podwójnie
  const zywiolNieba = Object.entries(licz).sort((a, b) => b[1] - a[1])[0][0];
  const zywiolDloni = dlon?.zywiol ?? null;
  cechy.push({
    id: "sposob", cecha: "Jak działasz",
    wynik: `${ZYWIOL[zywiolNieba].nazwa} — ${ZYWIOL[zywiolNieba].sposob}`,
    opis: zywiolDloni
      ? zywiolDloni === zywiolNieba
        ? `Dłoń jest tego samego typu (${ZYWIOL[zywiolDloni].nazwa}) — niebo i dłoń mówią to samo.`
        : `Dłoń jest typu ${ZYWIOL[zywiolDloni].nazwa} — ${ZYWIOL[zywiolDloni].sposob}. Na co dzień może przeważać jedno, w głębi drugie.`
      : undefined,
    zrodla: `D1 — żywioły planet i ascendentu (${Object.entries(licz).map(([k, v]) => `${ZYWIOL[k].nazwa} ${v}`).join(", ")})${zywiolDloni ? " · typ dłoni" : ""}`,
    potwierdzone: zywiolDloni ? zywiolDloni === zywiolNieba : null,
  });

  // 4. rytm — jakości znaków
  const jakosci: Record<string, number> = { kardynalny: 0, "stały": 0, zmienny: 0 };
  for (const p of ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"] as PlanetId[]) jakosci[RASIS[chart.planets[p].sign].quality]++;
  if (domy) jakosci[RASIS[chart.angles!.lagnaSign].quality] += 2;
  const rytm = Object.entries(jakosci).sort((a, b) => b[1] - a[1])[0][0];
  cechy.push({
    id: "rytm", cecha: "Twój rytm",
    wynik: RYTM[rytm].nazwa, opis: RYTM[rytm].opis.replace(/^./, (c) => c.toUpperCase()) + ".",
    zrodla: `D1 — jakości znaków (kardynalne ${jakosci.kardynalny}, stałe ${jakosci["stały"]}, zmienne ${jakosci.zmienny})`,
  });

  // 5. czego uczy się dusza — atmakaraka
  const karaki = karakiCzarowe(chart);
  const ak = karaki[0];
  cechy.push({
    id: "dusza", cecha: "Czego uczy się dusza",
    wynik: LEKCJA_AK[ak.planeta].split(" — ")[0],
    opis: `Atmakaraka to ${MIANOWNIK[ak.planeta]} (najwyższy stopień w znaku): lekcja ${LEKCJA_AK[ak.planeta]}.`,
    zrodla: "D1 — atmakaraka (Dżajmini)",
  });

  // 6. powołanie — amatjakaraka i władca 10. domu
  if (domy) {
    const amk = karaki[1];
    const wladca10 = RASIS[(chart.angles!.lagnaSign + 9) % 12].lord;
    cechy.push({
      id: "powolanie", cecha: "Powołanie i praca",
      wynik: ZAJECIA[amk.planeta],
      opis: `Amatjakaraka (planeta powołania) to ${MIANOWNIK[amk.planeta]}${domy ? ` w ${dom(amk.planeta)}. domu` : ""}. Władca 10. domu (kariera) — ${MIANOWNIK[wladca10]} — stoi w ${dom(wladca10)}. domu: ${DOM[dom(wladca10)]}.`,
      zrodla: "D1 — amatjakaraka i władca 10. domu",
    });
  }

  // 7. siła napędowa — jogakaraka
  const jk = domy ? jogakaraka(chart.angles!.lagnaSign) : null;
  if (jk) {
    cechy.push({
      id: "naped", cecha: "Siła napędowa",
      wynik: `${MIANOWNIK[jk]} w ${dom(jk)}. domu`,
      opis: `${MIANOWNIK[jk]} rządzi u Ciebie jednocześnie kendrą i trikoną — to najkorzystniejsza planeta horoskopu. Gdzie stoi (${DOM[dom(jk)]}), tam rzeczy idą najłatwiej.`,
      zrodla: "D1 — jogakaraka",
    });
  }

  // 8. oś rozwoju — Rahu (dokąd rośniesz) i Ketu (co już masz)
  if (domy) {
    cechy.push({
      id: "os", cecha: "Dokąd rośniesz",
      wynik: `Rahu w ${dom("rahu")}. domu — ${DOM[dom("rahu")]}`,
      opis: `To obszar, który Cię ciągnie i w którym rośniesz w tym życiu. Ketu w ${dom("ketu")}. domu (${DOM[dom("ketu")]}) to to, co już umiesz i z czego możesz czerpać — ale nie warto się w tym zamykać.`,
      zrodla: "D1 — oś węzłów Księżyca",
    });
  }

  // 9. teraz — okres planety (Vimshottari)
  const okresy = vimshottari(chart.planets.moon.longitude, chart.birth.date, 2);
  const lancuch = activeChain(okresy, teraz);
  if (lancuch.length) {
    const md = lancuch[0], ad = lancuch[1];
    const rok = (d: Date) => d.getFullYear();
    cechy.push({
      id: "teraz", cecha: "Teraz",
      wynik: `okres ${MIANOWNIK[md.lord]} (do ${rok(md.end)})${ad ? `, podokres ${MIANOWNIK[ad.lord]} (do ${rok(ad.end)})` : ""}`,
      opis: domy ? `${MIANOWNIK[md.lord]} stoi w ${dom(md.lord)}. domu — w tych latach na pierwszy plan wychodzi: ${DOM[dom(md.lord)]}.` : undefined,
      zrodla: "D1 — okresy planet (Vimshottari)",
    });
  }

  // 10. nie Twoja oś — tematy, o których systemy zgodnie milczą
  const nie = s.wiersze.filter((r) => r.rodzaj === "zgodne_nie" || r.rodzaj === "wiekszosc_nie");
  if (nie.length) {
    cechy.push({
      id: "nie", cecha: "Mniej Twoje",
      wynik: nie.map((r) => r.temat.nazwa).join(" · "),
      opis: `${nie.some((r) => r.rodzaj === "wiekszosc_nie") ? "Wszystkie albo większość systemów" : "Wszystkie systemy"} milczą o tych tematach. To brak sygnału, a nie zakaz — po prostu nie tędy biegnie Twoja główna droga.`,
      zrodla: "tabela 4 — zgodne lub większość na nie",
    });
  }

  return cechy;
}
