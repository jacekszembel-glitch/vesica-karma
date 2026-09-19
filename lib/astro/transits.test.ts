import { describe, it, expect } from "vitest";
import { sadeSati, gochara } from "./transits";

describe("Sade Sati", () => {
  /**
   * REGRESJA: koniec fazy liczony jako PIERWSZE przekroczenie granicy znaku
   * dawał datę o 9 miesięcy za wczesną, bo Saturn wraca do znaku retrogradnie.
   * Saturn opuszcza Ryby 2027-06-03, wraca 2027-10-21, wychodzi 2028-02-24.
   */
  it("koniec fazy uwzględnia retrogradny powrót Saturna do znaku", () => {
    const ksiezycWRybach = 11 * 30 + 15;
    const s = sadeSati(ksiezycWRybach, new Date("2026-08-07T00:00:00Z"));
    expect(s.phase).toBe("szczyt (1. dom)");
    expect(s.active).toBe(true);
    const koniec = s.phaseEnd!.toISOString().slice(0, 10);
    expect(koniec).toBe("2028-02-24");
    // najczęstszy błąd: zatrzymanie się na pierwszym wyjściu ze znaku
    expect(koniec).not.toBe("2027-06-03");
  });

  it("poza domami 12/1/2 Sade Sati nie jest aktywne, ale start/koniec biezacego domu i tak sa liczone", () => {
    // Księżyc w Baranie (0) — Saturn w Rybach (11) wypada w 12. domu od Barana,
    // więc do testu „braku” bierzemy Księżyc w Raku (3): Saturn w 9. domu.
    const s = sadeSati(3 * 30 + 10, new Date("2026-08-07T00:00:00Z"));
    expect(s.active).toBe(false);
    expect(s.phase).toBe("brak");
    // "brak" fazy nie znaczy braku dat — to samo pytanie ("od kiedy do kiedy Saturn
    // jest w tym domu") ma sens niezaleznie od tego, czy dom akurat jest nazwana faza
    expect(s.phaseStart).toBeInstanceOf(Date);
    expect(s.phaseEnd).toBeInstanceOf(Date);
    expect(s.phaseStart!.getTime()).toBeLessThan(new Date("2026-08-07T00:00:00Z").getTime());
    expect(s.phaseEnd!.getTime()).toBeGreaterThan(new Date("2026-08-07T00:00:00Z").getTime());
    // poza aktywna Sade Sati powinnismy tez dostac zgrubne oszacowanie najblizszego okna
    expect(s.poprzedniaSadeSatiKoniec).toBeInstanceOf(Date);
    expect(s.nastepnaSadeSatiStart).toBeInstanceOf(Date);
    expect(s.nastepnaSadeSatiStart!.getTime()).toBeGreaterThan(new Date("2026-08-07T00:00:00Z").getTime());
  });

  it("gochara liczy domy od Księżyca urodzeniowego, nie od ascendentu", () => {
    const g = gochara(0, new Date("2026-08-07T00:00:00Z"));
    expect(g.length).toBeGreaterThan(0);
    for (const t of g) {
      expect(t.house).toBeGreaterThanOrEqual(1);
      expect(t.house).toBeLessThanOrEqual(12);
    }
  });
});
