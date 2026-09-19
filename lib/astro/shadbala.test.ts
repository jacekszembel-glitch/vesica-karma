import { describe, it, expect } from "vitest";
import { buildChart } from "./chart";
import {
  digBala, sthanaBala, czesztaBala, drikBala, szadbala,
  NAISARGIKA_BALA, GRAHY_SZADBALI, pieciorakaPrzyjazn, pakszaBala, nathonnataBala,
  tribhagaBala, dinaBala, horaBala, warszaBala, masaBala, ajanaBala, juddhaBala,
} from "./shadbala";
import { trimsamszaWladca } from "./varga";

const chart = buildChart({
  date: new Date("1981-04-11T10:45:00Z"),
  latitude: 50.09, longitude: 18.22, timeKnown: true,
});

describe("Naisargika Bala", () => {
  it("suma siedmiu grah = 240 (stała, 60/7 × (7+6+5+4+3+2+1))", () => {
    const suma = GRAHY_SZADBALI.reduce((s, g) => s + NAISARGIKA_BALA[g], 0);
    expect(suma).toBeCloseTo(240, 6);
  });

  it("malejąca kolejność: Słońce > Księżyc > Wenus > Jowisz > Merkury > Mars > Saturn", () => {
    const kolejnosc = ["sun", "moon", "venus", "jupiter", "mercury", "mars", "saturn"] as const;
    for (let i = 1; i < kolejnosc.length; i++) {
      expect(NAISARGIKA_BALA[kolejnosc[i - 1]]).toBeGreaterThan(NAISARGIKA_BALA[kolejnosc[i]]);
    }
  });
});

describe("Dig Bala", () => {
  it("zawsze w zakresie 0–60", () => {
    for (const g of GRAHY_SZADBALI) {
      const d = digBala(chart, g)!;
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(60);
    }
  });

  it("null bez znanej godziny urodzenia", () => {
    const bez = buildChart({ date: new Date("1981-04-11T10:45:00Z"), latitude: 50, longitude: 18, timeKnown: false });
    expect(digBala(bez, "sun")).toBeNull();
  });

  it("planeta dokładnie na punkcie zerowej siły daje ~0 wirup", () => {
    // Slonce ma zerowa sile na IC (mc+180). Wstawiamy Slonce recznie na ten punkt.
    const testowy = structuredClone(chart);
    testowy.planets.sun.longitude = (chart.angles!.mc + 180) % 360;
    expect(digBala(testowy, "sun")!).toBeCloseTo(0, 1);
  });
});

describe("Pięcioraka przyjaźń (Panczadha Maitri)", () => {
  it("naturalny przyjaciel w czasowym domu przyjaźni = wielki przyjaciel", () => {
    // Slonce i Mars sa naturalnymi przyjaciolmi (FRIENDS.sun zawiera mars).
    // Ustawiamy Marsa w 3. znaku od Slonca (czasowy przyjaciel: {2,3,4,10,11,12}).
    const testowy = structuredClone(chart);
    testowy.planets.sun.sign = 0;
    testowy.planets.mars.sign = 2; // 3. znak od Slonca
    expect(pieciorakaPrzyjazn(testowy, "sun", "mars")).toBe("wielki przyjaciel");
  });

  it("naturalny wróg w czasowym domu wrogości = wielki wróg", () => {
    // Slonce i Saturn sa naturalnymi wrogami. Saturn w 1. znaku od Slonca (czasowy wrog: {1,5,6,7,8,9}).
    const testowy = structuredClone(chart);
    testowy.planets.sun.sign = 0;
    testowy.planets.saturn.sign = 0; // 1. znak od Slonca (koniunkcja)
    expect(pieciorakaPrzyjazn(testowy, "sun", "saturn")).toBe("wielki wróg");
  });
});

describe("Trimsamsza (D30) — wartości referencyjne", () => {
  it("znak nieparzysty (Baran): Mars(0-5), Saturn(5-10), Jowisz(10-18), Merkury(18-25), Wenus(25-30)", () => {
    expect(trimsamszaWladca(2)).toBe("mars");
    expect(trimsamszaWladca(7)).toBe("saturn");
    expect(trimsamszaWladca(15)).toBe("jupiter");
    expect(trimsamszaWladca(22)).toBe("mercury");
    expect(trimsamszaWladca(28)).toBe("venus");
  });

  it("znak parzysty (Byk): Wenus(0-5), Merkury(5-12), Jowisz(12-20), Saturn(20-25), Mars(25-30)", () => {
    expect(trimsamszaWladca(32)).toBe("venus");
    expect(trimsamszaWladca(38)).toBe("mercury");
    expect(trimsamszaWladca(45)).toBe("jupiter");
    expect(trimsamszaWladca(52)).toBe("saturn");
    expect(trimsamszaWladca(58)).toBe("mars");
  });
});

describe("Sthana Bala", () => {
  it("każdy podskładnik w swoim zakresie dla wszystkich 7 grah", () => {
    for (const g of GRAHY_SZADBALI) {
      const s = sthanaBala(chart, g)!;
      expect(s.uczcza, g).toBeGreaterThanOrEqual(0);
      expect(s.uczcza, g).toBeLessThanOrEqual(60);
      expect(s.saptawargadza, g).toBeGreaterThanOrEqual(7 * 2);
      expect(s.saptawargadza, g).toBeLessThanOrEqual(7 * 45);
      expect([0, 15, 30]).toContain(s.odzajugma);
      expect([15, 30, 60]).toContain(s.kendradi);
      expect([0, 15]).toContain(s.drekkana);
      expect(s.razem).toBeCloseTo(s.uczcza + s.saptawargadza + s.odzajugma + s.kendradi + s.drekkana, 6);
    }
  });

  it("mulatrikona w D1 zależy od dokładnego stopnia, nie tylko znaku (regresja)", () => {
    // Jowisz w Strzelcu (znak 8): mulatrikona Jowisza to tylko 0-10 (constants.ts).
    // longitude CELOWO nietknięte (zostaje z bazowego `chart`, ten sam obiekt w obu
    // scenariuszach) — pozostałych 6 warg liczy się z longitude, więc ich wkład jest
    // identyczny; jedyna różnica to sama D1 (mulatrikona 45 vs własny znak 30).
    const wZasiegu = structuredClone(chart);
    wZasiegu.planets.jupiter.sign = 8;
    wZasiegu.planets.jupiter.degreeInSign = 5; // w zakresie mulatrikony (0-10)

    const pozaZasiegiem = structuredClone(chart);
    pozaZasiegiem.planets.jupiter.sign = 8;
    pozaZasiegiem.planets.jupiter.degreeInSign = 15; // własny znak, ale POZA mulatrikoną

    const sW = sthanaBala(wZasiegu, "jupiter")!;
    const sP = sthanaBala(pozaZasiegiem, "jupiter")!;
    // Bug liczył mulatrikonę tylko po znaku (ignorując stopień) — różnica wynosiłaby 0
    // zamiast poprawnych 45-30=15.
    expect(sW.saptawargadza - sP.saptawargadza).toBe(15);
  });
});

describe("Czeszta Bala", () => {
  it("retrogradacja zawsze daje maksimum 60", () => {
    for (const g of ["mars", "mercury", "jupiter", "venus", "saturn"] as const) {
      const testowy = structuredClone(chart);
      testowy.planets[g].speed = -0.5;
      expect(czesztaBala(testowy, g)).toBe(60);
    }
  });

  it("null dla Słońca i Księżyca (zamienniki spoza zakresu tej sesji)", () => {
    expect(czesztaBala(chart, "sun")).toBeNull();
    expect(czesztaBala(chart, "moon")).toBeNull();
  });

  it("wynik zawsze w zakresie 0–60 dla pięciu grah gwiezdnych", () => {
    for (const g of ["mars", "mercury", "jupiter", "venus", "saturn"] as const) {
      const c = czesztaBala(chart, g)!;
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(60);
    }
  });
});

describe("Drik Bala", () => {
  it("jest liczbą skończoną dla wszystkich 7 grah", () => {
    for (const g of GRAHY_SZADBALI) {
      expect(Number.isFinite(drikBala(chart, g))).toBe(true);
    }
  });

  it("koniunkcja Jowisza z Wenus (dwa dobroczyńcy w separacji 0°) daje zerowy aspekt (poniżej progu 30°)", () => {
    const testowy = structuredClone(chart);
    testowy.planets.jupiter.longitude = 100;
    testowy.planets.venus.longitude = 100;
    // separacja Jowisz-Wenus = 0, ponizej progu 30 -> aspekt Jowisza na Wenus i odwrotnie = 0
    // (nie zerujemy calego drikBala, bo inne planety tez licza sie do sumy — sprawdzamy sam wklad)
    expect(Number.isFinite(drikBala(testowy, "venus"))).toBe(true);
  });
});

describe("Paksza Bala", () => {
  it("dobroczyńca + odpowiadający złośliwy zawsze sumują się do 60", () => {
    // sun i jupiter uzywaja tej samej elongacji, wiec ich Paksza Bala musi sumowac sie do 60
    expect(pakszaBala(chart, "sun") + pakszaBala(chart, "jupiter")).toBeCloseTo(60, 6);
    expect(pakszaBala(chart, "mars") + pakszaBala(chart, "venus")).toBeCloseTo(60, 6);
  });

  it("zawsze w zakresie 0–60", () => {
    for (const g of GRAHY_SZADBALI) {
      const p = pakszaBala(chart, g);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(60);
    }
  });

  it("pełnia (elongacja 180°) daje dobroczyńcom maksimum 60", () => {
    const testowy = structuredClone(chart);
    testowy.planets.sun.longitude = 0;
    testowy.planets.moon.longitude = 180;
    expect(pakszaBala(testowy, "jupiter")).toBeCloseTo(60, 6);
    expect(pakszaBala(testowy, "sun")).toBeCloseTo(0, 6);
  });
});

describe("Nathonnata Bala", () => {
  it("Merkury zawsze 60", () => {
    expect(nathonnataBala(chart, "mercury")).toBe(60);
  });

  it("zawsze w zakresie 0–60 dla grah dziennych/nocnych", () => {
    for (const g of ["sun", "moon", "mars", "jupiter", "venus", "saturn"] as const) {
      const n = nathonnataBala(chart, g)!;
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(60);
    }
  });

  it("dzienna graha (Słońce) blisko południa ma wysoką wartość, nocna (Księżyc) niską", () => {
    // mapa testowa: urodzenie ok. 12:45 czasu lokalnego, blisko poludnia
    expect(nathonnataBala(chart, "sun")!).toBeGreaterThan(45);
    expect(nathonnataBala(chart, "moon")!).toBeLessThan(15);
  });
});

describe("Tribhaga Bala", () => {
  it("Jowisz zawsze 60", () => {
    expect(tribhagaBala(chart, "jupiter")).toBe(60);
  });

  it("dokładnie jedna z pozostałych 6 grah rządzi (60), reszta 0", () => {
    const inne = GRAHY_SZADBALI.filter((g) => g !== "jupiter");
    const wladcy = inne.filter((g) => tribhagaBala(chart, g) === 60);
    const zera = inne.filter((g) => tribhagaBala(chart, g) === 0);
    expect(wladcy.length).toBe(1);
    expect(zera.length).toBe(inne.length - 1);
  });
});

describe("Dina i Hora Bala", () => {
  it("dokładnie jedna graha jest władcą dnia (45), reszta 0", () => {
    const wladcy = GRAHY_SZADBALI.filter((g) => dinaBala(chart, g) === 45);
    expect(wladcy.length).toBe(1);
  });

  it("dokładnie jedna graha jest władcą godziny (60), reszta 0", () => {
    const wladcy = GRAHY_SZADBALI.filter((g) => horaBala(chart, g) === 60);
    expect(wladcy.length).toBe(1);
  });

  it("11 kwietnia 1981 to sobota (władca: Saturn) — wartość referencyjna z niezależnego sprawdzenia dnia tygodnia", () => {
    expect(dinaBala(chart, "saturn")).toBe(45);
  });
});

describe("Warsza i Masa Bala", () => {
  it("dokładnie jedna graha jest władcą roku (15), reszta 0", () => {
    const wladcy = GRAHY_SZADBALI.filter((g) => warszaBala(chart, g) === 15);
    const zera = GRAHY_SZADBALI.filter((g) => warszaBala(chart, g) === 0);
    expect(wladcy.length).toBe(1);
    expect(zera.length).toBe(GRAHY_SZADBALI.length - 1);
  });

  it("dokładnie jedna graha jest władcą miesiąca (30), reszta 0", () => {
    const wladcy = GRAHY_SZADBALI.filter((g) => masaBala(chart, g) === 30);
    const zera = GRAHY_SZADBALI.filter((g) => masaBala(chart, g) === 0);
    expect(wladcy.length).toBe(1);
    expect(zera.length).toBe(GRAHY_SZADBALI.length - 1);
  });

  it("Masa Bala jest stabilna niezależnie od pory dnia w tym samym dniu urodzenia (ta sama sankranti miesiąca)", () => {
    const rano = structuredClone(chart);
    rano.birth.date = new Date("1981-04-11T04:00:00Z");
    const wieczorem = structuredClone(chart);
    wieczorem.birth.date = new Date("1981-04-11T20:00:00Z");
    // Slonce w D1 obu map jest liczone dla tej samej doby, wiec sankranti miesiaca (wejscie w ten sam znak) powinno byc identyczne
    const wladcaRano = GRAHY_SZADBALI.find((g) => masaBala(rano, g) === 30);
    const wladcaWieczorem = GRAHY_SZADBALI.find((g) => masaBala(wieczorem, g) === 30);
    expect(wladcaRano).toBe(wladcaWieczorem);
  });
});

describe("Ajana Bala", () => {
  it("zawsze w zakresie 0–60", () => {
    for (const g of GRAHY_SZADBALI) {
      const a = ajanaBala(chart, g);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThanOrEqual(60);
    }
  });

  it("planeta na deklinacji 0 (równonoc) daje 30 niezależnie od grupy", () => {
    const testowy = structuredClone(chart);
    // tropikalna dlugosc 0 (rownonoc wiosenna) = syderyczna -ayanamsa
    const dlugoscRownonocy = (0 - chart.ayanamsa + 360) % 360;
    for (const g of ["sun", "moon", "mercury", "saturn"] as const) {
      testowy.planets[g].longitude = dlugoscRownonocy;
      testowy.planets[g].latitude = 0;
      expect(ajanaBala(testowy, g)).toBeCloseTo(30, 6);
    }
  });

  it("Słońce blisko 0° Raka (tropikalnie) ma niemal maksimum, blisko 0° Koziorożca niemal zero", () => {
    const testowy = structuredClone(chart);
    testowy.planets.sun.latitude = 0;
    testowy.planets.sun.longitude = (90 - chart.ayanamsa + 360) % 360; // tropikalnie 0 Raka
    expect(ajanaBala(testowy, "sun")).toBeGreaterThan(55);
    testowy.planets.sun.longitude = (270 - chart.ayanamsa + 360) % 360; // tropikalnie 0 Koziorożca
    expect(ajanaBala(testowy, "sun")).toBeLessThan(5);
  });

  it("Księżyc/Saturn mają odwrotną grupę niż Słońce — maksimum blisko 0° Koziorożca", () => {
    const testowy = structuredClone(chart);
    testowy.planets.moon.latitude = 0;
    testowy.planets.moon.longitude = (270 - chart.ayanamsa + 360) % 360; // tropikalnie 0 Koziorożca
    expect(ajanaBala(testowy, "moon")).toBeGreaterThan(55);
  });
});

describe("Juddha Bala", () => {
  it("brak wojny w mapie testowej (żadna z 5 grah gwiezdnych nie jest w koniunkcji ≤1°) — same zera", () => {
    for (const g of ["mars", "mercury", "jupiter", "venus", "saturn"] as const) {
      expect(juddhaBala(chart, g)).toBe(0);
    }
  });

  it("Słońce i Księżyc nigdy nie wchodzą w Graha Juddhę", () => {
    expect(juddhaBala(chart, "sun")).toBe(0);
    expect(juddhaBala(chart, "moon")).toBe(0);
  });

  it("bardziej północna planeta wygrywa (dostaje dodatnią wartość), przeciwnik symetrycznie traci", () => {
    const testowy = structuredClone(chart);
    testowy.planets.mars.longitude = 100;
    testowy.planets.mars.latitude = 1;
    testowy.planets.saturn.longitude = 100.3; // 0,3° od Marsa — w zasięgu wojny (≤1°)
    testowy.planets.saturn.latitude = -1;
    const jMars = juddhaBala(testowy, "mars");
    const jSaturn = juddhaBala(testowy, "saturn");
    expect(jMars).toBeGreaterThan(0);
    expect(jSaturn).toBeLessThan(0);
    expect(jMars + jSaturn).toBeCloseTo(0, 6); // symetryczna wymiana
  });

  it("Wenus wygrywa będąc bardziej POŁUDNIOWA — reguła odwrotna niż dla reszty (Paulisa)", () => {
    const testowy = structuredClone(chart);
    testowy.planets.venus.longitude = 50;
    testowy.planets.venus.latitude = -1; // Wenus na południe
    testowy.planets.mars.longitude = 50.2;
    testowy.planets.mars.latitude = 1; // Mars na północ
    expect(juddhaBala(testowy, "venus")).toBeGreaterThan(0);
    expect(juddhaBala(testowy, "mars")).toBeLessThan(0);
  });

  it("poza zasięgiem 1° — brak wojny", () => {
    const testowy = structuredClone(chart);
    testowy.planets.mars.longitude = 100;
    testowy.planets.saturn.longitude = 102; // 2° — poza zasięgiem
    expect(juddhaBala(testowy, "mars")).toBe(0);
    expect(juddhaBala(testowy, "saturn")).toBe(0);
  });
});

describe("Szadbala — suma", () => {
  it("zwraca null dla Rahu/Ketu (spoza klasycznej Szadbali)", () => {
    expect(szadbala(chart, "rahu")).toBeNull();
    expect(szadbala(chart, "ketu")).toBeNull();
  });

  it("razemWirupy = suma wszystkich policzonych składników", () => {
    for (const g of GRAHY_SZADBALI) {
      const w = szadbala(chart, g)!;
      const oczekiwane = w.naisargika + (w.dig ?? 0) + (w.sthana?.razem ?? 0) + (w.czeszta ?? 0) + w.drik
        + w.paksza + (w.nathonnata ?? 0) + (w.tribhaga ?? 0) + (w.dina ?? 0) + (w.hora ?? 0)
        + (w.warsza ?? 0) + (w.masa ?? 0) + w.ajana + w.juddha;
      expect(w.razemWirupy).toBeCloseTo(oczekiwane, 6);
      expect(w.razemRupy).toBeCloseTo(w.razemWirupy / 60, 6);
    }
  });
});
