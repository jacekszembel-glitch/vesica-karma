import { describe, it, expect } from "vitest";
import { ocenDzienSlubu, najlepszeTerminy, kalendarzTerminow, ksiezycUrodzeniowy, NAK_SLUBNE, NAK_ODRADZANE } from "./slub";

const moonA = ksiezycUrodzeniowy(new Date("1990-06-15T10:00:00Z"));
const moonB = ksiezycUrodzeniowy(new Date("1992-03-20T14:30:00Z"));

describe("Wybór daty ślubu", () => {
  it("ocena mieści się w skali i ma werdykt", () => {
    const d = ocenDzienSlubu(new Date("2027-06-12"), moonA, moonB);
    expect(d.ocena).toBeGreaterThanOrEqual(3);
    expect(d.ocena).toBeLessThanOrEqual(97);
    expect(["wyjątkowy", "bardzo dobry", "dobry", "przeciętny", "odradzany"]).toContain(d.werdykt);
    expect(d.czynniki.length).toBeGreaterThan(3);
  });

  it("karana Bhadra zawsze obniża ocenę tego samego dnia", () => {
    // szukamy dnia z Bhadrą w najbliższym miesiącu
    let zBhadra: Date | null = null;
    for (let i = 0; i < 40; i++) {
      const d = new Date(2027, 0, 1 + i);
      if (ocenDzienSlubu(d).panczanga.karana.isBhadra) { zBhadra = d; break; }
    }
    expect(zBhadra).not.toBeNull();
    const wynik = ocenDzienSlubu(zBhadra!);
    expect(wynik.czynniki.some((c) => c.tekst.includes("Bhadra") && c.znak === -1)).toBe(true);
  });

  it("uwzględnienie obojga narzeczonych zmienia ocenę", () => {
    const dzien = new Date("2027-06-12");
    const bezNikogo = ocenDzienSlubu(dzien).ocena;
    const zParą = ocenDzienSlubu(dzien, moonA, moonB).ocena;
    // tarabala i czandrabala obojga muszą wpłynąć na wynik
    expect(zParą).not.toBe(bezNikogo);
  });

  it("ranking jest posortowany malejąco i nie przekracza limitu", () => {
    const t = najlepszeTerminy(new Date("2027-05-01"), new Date("2027-08-31"), moonA, moonB, 10);
    expect(t.length).toBe(10);
    for (let i = 1; i < t.length; i++) {
      expect(t[i].ocena).toBeLessThanOrEqual(t[i - 1].ocena);
    }
  });

  it("wtorek i sobota sa punktowane gorzej niz czwartek", () => {
    // Porownujemy TEN SAM dzien panczangi nie da sie, wiec sprawdzamy sam czynnik:
    // kazdy wtorek i kazda sobota musza miec ujemny czynnik od dnia tygodnia.
    for (let i = 0; i < 30; i++) {
      const d = new Date(2027, 5, 1 + i);
      const w = ocenDzienSlubu(d, moonA, moonB);
      const czynnikDnia = w.czynniki.find((c) => c.tekst.includes("dzien") || c.tekst.includes("dzień"));
      if (d.getDay() === 2 || d.getDay() === 6) {
        expect(czynnikDnia?.znak, d.toDateString()).toBe(-1);
      } else if ([1, 3, 4, 5].includes(d.getDay())) {
        expect(czynnikDnia?.znak, d.toDateString()).toBe(1);
      }
    }
  });

  it("kalendarz zwraca dni w kolejności i pokrywa cały przedział", () => {
    const k = kalendarzTerminow(new Date("2027-06-01"), new Date("2027-06-30"), moonA, moonB);
    expect(k.length).toBe(30);
    for (let i = 1; i < k.length; i++) {
      expect(k[i].data.getTime()).toBeGreaterThan(k[i - 1].data.getTime());
    }
  });

  it("listy nakszatr ślubnych i odradzanych nie zachodzą na siebie", () => {
    for (const i of NAK_SLUBNE) expect(NAK_ODRADZANE.has(i), String(i)).toBe(false);
    for (const i of [...NAK_SLUBNE, ...NAK_ODRADZANE]) {
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(27);
    }
  });
});
