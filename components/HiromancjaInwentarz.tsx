"use client";

import { useState } from "react";
import ZnakiWlasne from "./ZnakiWlasne";
import IlustracjaDloni from "./IlustracjaDloni";
import { PieczecOdslaniania } from "./Interpretation";
import {
  MIEJSCA_ZNAKOW, NAZWY_LINII, RODZAJE_ZNAKOW_NAZWY, miejsceZKlucza,
  type LiniaDloni, type MiejsceZnaku, type RodzajZnaku, type ZnakWlasny,
} from "@/lib/astro/zgodnosc";

/**
 * KROK 1 — „Co AI widzi na Twoich dłoniach”: sama lista znaków i linii (bez interpretacji)
 * z /api/hiromancja-ogledziny. Osoba porównuje ją ze swoją dłonią: usuwa to, czego nie ma,
 * dopisuje brakujące (ZnakiWlasne) i klika „Dalej” — wtedy rusza pełny odczyt z tą listą.
 */

type Reka = "wiodaca" | "bierna";
interface ZnakInw { reka: Reka; miejsce: MiejsceZnaku; znak: RodzajZnaku; pewnosc: "wyrazny" | "delikatny"; gdzie: string }
interface LiniaInw { reka: Reka; linia: LiniaDloni; stan: "wyrazna" | "odcinkowa" | "slaba"; gdzie: string }

export interface InwentarzPotwierdzony {
  /** Pozycje jako tekst — tak trafiają do pełnego odczytu. */
  znaki: string[];
  linie: string[];
  ogledzinyTekst: string;
}

interface DaneReki { imageBase64: string; imageMediaType: string; strefy?: { opis: string; imageBase64: string }[] }

const STAN: Record<LiniaInw["stan"], string> = { wyrazna: "wyraźna", odcinkowa: "odcinkami", slaba: "słaba" };
const nazwaMiejsca = (m: MiejsceZnaku) => MIEJSCA_ZNAKOW.find((x) => x.id === m)?.nazwa ?? m;
const nazwaZnaku = (z: RodzajZnaku) => RODZAJE_ZNAKOW_NAZWY.find((x) => x.id === z)?.nazwa ?? z;

function zOdpowiedzi(znaki: unknown[], linie: unknown[]): { znaki: ZnakInw[]; linie: LiniaInw[] } {
  const reka = (r: unknown): Reka => (r === "bierna" ? "bierna" : "wiodaca");
  const zn = znaki.flatMap((x) => {
    const z = x as Record<string, string>;
    const miejsce = miejsceZKlucza(String(z.wzgorek));
    const znak = RODZAJE_ZNAKOW_NAZWY.find((r) => r.id === z.znak)?.id;
    return miejsce && znak ? [{ reka: reka(z.reka), miejsce, znak, pewnosc: z.pewnosc === "delikatny" ? "delikatny" as const : "wyrazny" as const, gdzie: String(z.gdzie ?? "") }] : [];
  });
  const li = linie.flatMap((x) => {
    const l = x as Record<string, string>;
    const linia = l.linia as LiniaDloni;
    const stan = l.stan === "odcinkowa" || l.stan === "slaba" ? l.stan : "wyrazna";
    return NAZWY_LINII[linia] ? [{ reka: reka(l.reka), linia, stan: stan as LiniaInw["stan"], gdzie: String(l.gdzie ?? "") }] : [];
  });
  return { znaki: zn, linie: li };
}

export default function HiromancjaInwentarz({ wiodaca, bierna, nazwyRak, znakiWlasne, onZnakiWlasne, onDalej }: {
  wiodaca: DaneReki;
  bierna: DaneReki;
  /** Np. { wiodaca: "prawa", bierna: "lewa" } — do nagłówków. */
  nazwyRak: Record<Reka, string>;
  znakiWlasne: ZnakWlasny[];
  onZnakiWlasne: (z: ZnakWlasny[]) => void;
  onDalej: (inw: InwentarzPotwierdzony) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const [wynik, setWynik] = useState<{ znaki: ZnakInw[]; linie: LiniaInw[]; ogledzinyTekst: string } | null>(null);
  // pozycja listy pod kursorem — jej miejsce podświetla się na rysunku dłoni
  const [najechane, setNajechane] = useState<{ reka: Reka; miejsce: MiejsceZnaku } | null>(null);

  async function obejrzyj() {
    setBusy(true); setBlad(null); setWynik(null);
    try {
      const res = await fetch("/api/hiromancja-ogledziny", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wiodaca, bierna }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `Nie udało się obejrzeć dłoni (kod ${res.status}).`);
      setWynik({ ...zOdpowiedzi(j.znaki ?? [], j.linie ?? []), ogledzinyTekst: String(j.ogledzinyTekst ?? "") });
    } catch (e) {
      setBlad((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function dalej() {
    if (!wynik) return;
    const r = (x: Reka) => `ręka ${x === "wiodaca" ? "wiodąca" : "bierna"}`;
    onDalej({
      znaki: wynik.znaki.map((z) => `${nazwaZnaku(z.znak)} — ${nazwaMiejsca(z.miejsce)}, ${r(z.reka)}, ${z.pewnosc === "delikatny" ? "delikatny" : "wyraźny"}${z.gdzie ? ` (${z.gdzie})` : ""}`),
      linie: wynik.linie.map((l) => `${NAZWY_LINII[l.linia]} — ${STAN[l.stan]}, ${r(l.reka)}${l.gdzie ? ` (${l.gdzie})` : ""}`),
      ogledzinyTekst: wynik.ogledzinyTekst,
    });
  }

  if (!wynik) {
    return (
      <div style={{ textAlign: "center" }}>
        <p style={{ maxWidth: 520, margin: "0 auto 18px", lineHeight: 1.6 }}>
          Najpierw AI obejrzy Twoje dłonie i wypisze tylko to, co na nich widzi — znaki i linie, bez
          interpretacji. Sprawdzisz tę listę ze swoją dłonią i poprawisz ją, zanim powstanie odczyt.
        </p>
        {busy ? (
          <PieczecOdslaniania tytul="Oglądam Twoje dłonie…" mysli={["Każde zbliżenie oglądam osobno, pod lupą.", "Szukam znaków na wzgórkach i linii — bez interpretacji.", "Za chwilę zobaczysz listę do sprawdzenia."]} podpis="oględziny trwają około 1–2 minut" />
        ) : (
          <button className="btn btn-primary" onClick={() => void obejrzyj()} style={{ padding: "14px 36px", fontSize: "1rem" }}>
            {blad ? "Spróbuj ponownie" : "Obejrzyj dłonie"}
          </button>
        )}
        {blad && <p style={{ color: "var(--warn)", marginTop: 12 }}>{blad}</p>}
      </div>
    );
  }

  const usunZnak = (i: number) => setWynik({ ...wynik, znaki: wynik.znaki.filter((_, j) => j !== i) });
  const usunLinie = (i: number) => setWynik({ ...wynik, linie: wynik.linie.filter((_, j) => j !== i) });

  return (
    <div className="inw">
      <p className="hs-instrukcja" style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 16px" }}>
        Porównaj listę ze swoją dłonią. Jeśli czegoś na niej nie masz — kliknij „nie mam”. Czego brakuje — dopisz niżej.
      </p>
      <div className="inw-rece">
        {(["wiodaca", "bierna"] as Reka[]).map((reka) => {
          const zn = wynik.znaki.map((z, i) => ({ z, i })).filter(({ z }) => z.reka === reka);
          const li = wynik.linie.map((l, i) => ({ l, i })).filter(({ l }) => l.reka === reka);
          return (
            <div key={reka} className="inw-reka">
              <p className="hs-tytul">{reka === "wiodaca" ? "Ręka wiodąca" : "Ręka bierna"} ({nazwyRak[reka]})</p>
              <div className="inw-reka-uklad">
              <div className="inw-rysunek">
                <IlustracjaDloni lewa={nazwyRak[reka] === "lewa"} szerokosc={170}
                  zaznaczone={zn.map(({ z }) => z.miejsce)}
                  aktywne={najechane?.reka === reka ? najechane.miejsce : null} />
              </div>
              <div className="inw-listy">
              <p className="inw-grupa">Znaki</p>
              {zn.length === 0 ? <p className="hs-instrukcja">AI nie zauważyło znaków na tej ręce.</p> : (
                <ul className="inw-lista">
                  {zn.map(({ z, i }) => (
                    <li key={i} onMouseEnter={() => setNajechane({ reka, miejsce: z.miejsce })} onMouseLeave={() => setNajechane(null)}
                      onClick={() => setNajechane({ reka, miejsce: z.miejsce })}>
                      <span><strong>{nazwaZnaku(z.znak)}</strong> — {nazwaMiejsca(z.miejsce)}{z.pewnosc === "delikatny" ? ", delikatny" : ""}
                        {z.gdzie && <small>{z.gdzie}</small>}</span>
                      <button type="button" className="hs-usun" onClick={() => usunZnak(i)}>nie mam</button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="inw-grupa">Linie</p>
              {li.length === 0 ? <p className="hs-instrukcja">AI nie wypisało linii na tej ręce.</p> : (
                <ul className="inw-lista">
                  {li.map(({ l, i }) => (
                    <li key={i}>
                      <span><strong>{NAZWY_LINII[l.linia]}</strong> — {STAN[l.stan]}{l.gdzie && <small>{l.gdzie}</small>}</span>
                      <button type="button" className="hs-usun" onClick={() => usunLinie(i)}>nie mam</button>
                    </li>
                  ))}
                </ul>
              )}
              </div>
              </div>
            </div>
          );
        })}
      </div>

      <ZnakiWlasne znaki={znakiWlasne} onZmiana={onZnakiWlasne} nazwyRak={nazwyRak} />

      <div style={{ textAlign: "center", marginTop: 26 }}>
        <button className="btn btn-primary" onClick={dalej} style={{ padding: "14px 36px", fontSize: "1rem" }}>
          Dalej — odczytaj dłonie
        </button>
        <p className="hs-instrukcja" style={{ textAlign: "center", marginTop: 8 }}>
          Możesz od razu kliknąć „Dalej” — dopisywanie jest opcjonalne.
        </p>
      </div>
    </div>
  );
}
