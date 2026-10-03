"use client";

import { Fragment, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { GRAHAS, type PlanetId } from "@/lib/astro/constants";
import type { OcenaWladcyZWagami } from "@/lib/astro/sila";
import { percentylSily } from "@/lib/astro/percentyleDomen";
import { grahaNazwa, type AstroLocale } from "@/lib/astro/i18nAstro";
import { SREDNIE_BILANSU, procentNizej, type DziedzinaBilansu, type RozkladBilansu } from "@/lib/astro/srednieBilansu";

/**
 * OŚ DOMENY — wspólny układ Predyspozycji, Finansów i Zdrowia: jeden wiersz
 * na planetę, w lewo tarcie (suma czynników hamujących), w prawo potencjał
 * (suma wspierających), a w kolumnie Bilans — ich różnica w punktach.
 *
 * Dlaczego bilans w punktach, a nie różnica percentyli: percentyle obu stron
 * leżą na DWÓCH różnych skalach (potencjał i tarcie mają inne rozkłady), więc
 * ich odejmowanie nic nie znaczy. Bilans to prawdziwa suma wag czynników,
 * a to, czy jest duży czy mały, mówi jego percentyl na skali |bilansu| tej
 * samej dziedziny (percentyleDomen.ts, 20 000 map).
 *
 * Punkt odniesienia "czy to dużo": średni bilans TEJ SAMEJ planety u innych
 * ludzi i odsetek osób z niższym bilansem (srednieBilansu.ts). Planety mają
 * różne naturalne poziomy — przeciętny Jowisz ma ok. +3,0, przeciętny Rahu
 * ok. −0,6 — więc porównanie ze wszystkimi planetami naraz wprowadzałoby w błąd.
 *
 * Kolory zweryfikowane walidatorem palety na tle karty (potencjał #36a377,
 * tarcie #e0654f); kolor nigdy nie jest jedynym nośnikiem — kierunek,
 * liczby i słowny opis bilansu mówią to samo.
 */

const POTENCJAL = "#36a377";
const TARCIE = "#e0654f";

/** Wiersz osi — domyślnie planeta; Dziedziny talentu podają własne id (I). */
export interface WierszOsi<I extends string = PlanetId> {
  id: I;
  ocena: OcenaWladcyZWagami;
  /** Rola planety w dziedzinie (np. "władca 2. domu …") — Finanse/Zdrowie. */
  role?: string[];
}

type SilaBilansu = "rownowaga" | "lekka" | "wyrazna" | "silna";
const silaBilansu = (p: number): SilaBilansu => (p < 25 ? "rownowaga" : p < 60 ? "lekka" : p < 85 ? "wyrazna" : "silna");

/** Temat "na co uważać" pokazujemy, gdy tarcie jest wyraźne (górna połowa populacji) albo przeważa. */
const PROG_TARCIA = 50;

const fmt = (x: number) => x.toFixed(2).replace(/\.?0+$/, "").replace(".", ",");

interface Props<I extends string> {
  /** Z którą grupą porównujemy bilans (średnia tej samej planety w tej dziedzinie)
   *  — dla wierszy-planet. Wiersze innego rodzaju podają `rozklad`. */
  dziedzina?: DziedzinaBilansu;
  /** Rozkład bilansu dla wiersza (średnia + tabela) — zastępuje SREDNIE_BILANSU. */
  rozklad?: (id: I) => RozkladBilansu | undefined;
  eyebrow: string;
  wstep: React.ReactNode;
  wiersze: WierszOsi<I>[];
  skale: { potencjal: number[]; tarcie: number[]; bilans: number[] };
  /** Linia pod paskami: temat predyspozycji albo rola planety w dziedzinie. */
  podpis: (w: WierszOsi<I>) => string;
  /** Krótka nazwa strony wsparcia do syntezy. */
  krotko: (w: WierszOsi<I>) => string;
  opis: (id: I) => string;
  /** "Na co uważać" — pomijane, gdy brak (np. Dziedziny talentu). */
  uwagaTemat?: (id: I) => string;
  uwagaOpis?: (id: I) => string;
  /** Dodatkowa treść w rozwinięciu (np. kierunki zawodowe). */
  dodatek?: (id: I) => React.ReactNode;
  /** Nazwa i symbol wiersza — domyślnie planeta z GRAHAS. */
  nazwa?: (id: I) => string;
  symbol?: (id: I) => { znak: string; kolor: string } | null;
  /** Przestrzeń nazw z własnymi wersjami tekstów mówiących o "planetach"
   *  (jakCzytac, podpowiedz, podpowiedzSrednia, syntezaBrakWsparcia, syntezaBrakTarcia). */
  teksty?: string;
  /** Kolejność wg porównania z innymi ludźmi (odsetek osób z niższym bilansem)
   *  zamiast surowego bilansu — gdy wiersze mają różną liczbę wskaźników. */
  wgPorownania?: boolean;
  /** Własna kolejność (większe wyżej) — np. siła związku planety z karierą. */
  kolejnosc?: (id: I) => number;
}

export default function OsDomeny<I extends string = PlanetId>({
  dziedzina, rozklad: rozkladWiersza, eyebrow, wstep, wiersze: wejscie, skale, podpis, krotko, opis, uwagaTemat, uwagaOpis, dodatek,
  nazwa: nazwaWiersza, symbol: symbolWiersza, teksty, wgPorownania, kolejnosc,
}: Props<I>) {
  const t = useTranslations("OsDomeny");
  const tw = useTranslations(teksty ?? "OsDomeny");
  const locale = useLocale() as AstroLocale;
  const [rozwiniety, setRozwiniety] = useState<I | null>(null);
  const [najechany, setNajechany] = useState<I | null>(null);
  const nazwaId = (id: I) => (nazwaWiersza ? nazwaWiersza(id) : grahaNazwa(GRAHAS[id as unknown as PlanetId], locale));
  const symbolId = (id: I) => (symbolWiersza ? symbolWiersza(id)
    : { znak: GRAHAS[id as unknown as PlanetId].symbol, kolor: GRAHAS[id as unknown as PlanetId].color });

  const wiersze = useMemo(() => wejscie.map((w) => {
    const bilansPct = Math.round(percentylSily(w.ocena.punkty, skale.bilans));
    const rozklad = rozkladWiersza ? rozkladWiersza(w.id) : dziedzina ? SREDNIE_BILANSU[dziedzina][w.id as unknown as PlanetId] : undefined;
    return {
      ...w,
      srednia: rozklad?.srednia ?? null,
      procentNizej: rozklad ? Math.round(procentNizej(w.ocena.punkty, rozklad)) : null,
      potencjal: Math.round(percentylSily(w.ocena.plus, skale.potencjal)),
      tarcie: Math.round(percentylSily(w.ocena.minus, skale.tarcie)),
      bilansPct,
      sila: silaBilansu(bilansPct),
    };
  }).sort((a, b) => (kolejnosc ? kolejnosc(b.id) - kolejnosc(a.id) : 0)
    || (wgPorownania ? (b.procentNizej ?? 0) - (a.procentNizej ?? 0) : 0) || b.ocena.punkty - a.ocena.punkty),
  [wejscie, skale, dziedzina, rozkladWiersza, wgPorownania, kolejnosc]);

  type W = (typeof wiersze)[number];
  const opisBilansu = (w: W) => w.sila === "rownowaga"
    ? t("bilans.rownowaga")
    : t(`bilans.${w.ocena.punkty > 0 ? "wsparcie" : "tarcie"}.${w.sila}`);
  const zeZnakiem = (x: number) => `${x > 0 ? "+" : x < 0 ? "−" : "±"}${fmt(Math.abs(x))}`;
  const znakBilansu = (w: W) => zeZnakiem(w.ocena.punkty);

  // wgPorownania: wyróżniamy to, co wypada wyraźnie ponad / poniżej innych ludzi
  // (górne i dolne 35%), nie sam znak bilansu — w dziedzinach prawie każdy bilans jest dodatni
  const wspieraja = wgPorownania
    ? wiersze.filter((w) => (w.procentNizej ?? 0) >= 65).slice(0, 3)
    : wiersze.filter((w) => w.ocena.punkty > 0 && w.sila !== "rownowaga").slice(0, 3);
  const trudne = wgPorownania
    ? wiersze.filter((w) => w.procentNizej !== null && w.procentNizej < 35).slice(-2).reverse()
    : [...wiersze].filter((w) => w.ocena.punkty < 0 && w.sila !== "rownowaga").sort((a, b) => a.ocena.punkty - b.ocena.punkty).slice(0, 3);
  const lista = (ws: W[], co: "potencjal" | "tarcie") => ws.map((w) => {
    const temat = co === "potencjal" ? krotko(w) : uwagaTemat?.(w.id).split(",")[0];
    return temat && temat !== nazwaId(w.id) ? `${nazwaId(w.id)} (${temat})` : nazwaId(w.id);
  }).join(", ");

  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: 6, textAlign: "left" }}>{eyebrow}</p>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 8, lineHeight: 1.55 }}>{wstep}</p>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 16, lineHeight: 1.55 }}>{tw("jakCzytac")}</p>

      <div className="pdx-predyspozycji-legenda" aria-hidden="true">
        <span><span className="pdx-kropka" style={{ background: TARCIE }} /> ← {t("legendaTarcie")}</span>
        <span>{t("legendaPotencjal")} → <span className="pdx-kropka" style={{ background: POTENCJAL }} /></span>
        <span className="pdx-legenda-bilans">{t("legendaBilansSrednia")}</span>
      </div>

      <div role="list" className="pdx-predyspozycji">
        {wiersze.map((w) => {
          const sym = symbolId(w.id);
          const nazwa = nazwaId(w.id);
          const rozw = rozwiniety === w.id;
          const aktywny = najechany === w.id || rozw;
          const pokazUwage = !!uwagaTemat && (w.tarcie >= PROG_TARCIA || w.ocena.minus > w.ocena.plus);
          const plusy = w.ocena.czynniki.map((c, i) => ({ c, w: w.ocena.wagi[i] })).filter((x) => x.w > 0).sort((a, b) => b.w - a.w);
          const minusy = w.ocena.czynniki.map((c, i) => ({ c, w: w.ocena.wagi[i] })).filter((x) => x.w < 0).sort((a, b) => a.w - b.w);
          const podpowiedz = tw("podpowiedz", {
            potencjal: w.potencjal, plus: fmt(w.ocena.plus), tarcie: w.tarcie, minus: fmt(w.ocena.minus),
            bilans: znakBilansu(w), bilansPct: w.bilansPct, opis: opisBilansu(w),
          }) + (w.srednia !== null && w.procentNizej !== null
            ? ` ${tw("podpowiedzSrednia", { planeta: nazwa, srednia: zeZnakiem(w.srednia), procent: w.procentNizej })}`
            : "");
          return (
            <Fragment key={w.id}>
              <div role="listitem" className={`pdx-wiersz${aktywny ? " pdx-wiersz-aktywny" : ""}`}>
                <button
                  type="button" className="pdx-przycisk" aria-expanded={rozw}
                  aria-label={`${nazwa}: ${podpowiedz}`} title={podpowiedz}
                  onClick={() => setRozwiniety(rozw ? null : w.id)}
                  onMouseEnter={() => setNajechany(w.id)} onMouseLeave={() => setNajechany(null)}
                  onFocus={() => setNajechany(w.id)} onBlur={() => setNajechany(null)}
                >
                  <span className="pdx-nazwa">
                    {sym && <><span style={{ color: sym.kolor }} aria-hidden="true">{sym.znak}</span> </>}{nazwa}
                  </span>
                  <span className="pdx-liczba pdx-liczba-lewa" aria-hidden="true">{w.tarcie > 0 ? w.tarcie : "–"}</span>
                  <span className="pdx-tor pdx-tor-lewy" aria-hidden="true">
                    <span className="pdx-pasek" style={{ width: `${w.tarcie}%`, background: TARCIE, borderRadius: "4px 0 0 4px" }} />
                  </span>
                  <span className="pdx-os" aria-hidden="true" />
                  <span className="pdx-tor pdx-tor-prawy" aria-hidden="true">
                    <span className="pdx-pasek" style={{ width: `${w.potencjal}%`, background: POTENCJAL, borderRadius: "0 4px 4px 0" }} />
                  </span>
                  <span className="pdx-liczba pdx-liczba-prawa" aria-hidden="true">{w.potencjal > 0 ? w.potencjal : "–"}</span>
                  <span className="pdx-bilans">
                    <span className={`pdx-bilans-wartosc pdx-bilans-${w.ocena.punkty > 0 ? "plus" : w.ocena.punkty < 0 ? "minus" : "zero"}`}>{znakBilansu(w)}</span>
                    {w.srednia !== null && w.procentNizej !== null ? (
                      <>
                        <span className="pdx-bilans-opis">{t("srednia", { srednia: zeZnakiem(w.srednia) })}</span>
                        <span className="pdx-bilans-opis pdx-bilans-porownanie">{t("wyzejNiz", { procent: w.procentNizej })}</span>
                      </>
                    ) : <span className="pdx-bilans-opis">{opisBilansu(w)}</span>}
                  </span>
                  <span className="pdx-tematy">
                    {podpis(w)}
                    {pokazUwage && <span className="pdx-uwaga"> · {t("uwazaj")} {uwagaTemat!(w.id)}</span>}
                  </span>
                </button>
              </div>

              {rozw && (
                <div className="pdx-szczegoly">
                  <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 10, textAlign: "left" }}>{podpowiedz}</p>
                  <div className="pdx-czynniki">
                    <div>
                      <p className="eyebrow" style={{ color: "var(--sand)", marginBottom: 6, textAlign: "left" }}>{t("coWspiera")}</p>
                      {plusy.length ? plusy.map((x, i) => (
                        <p key={i} className="pdx-czynnik"><span className="pdx-waga" style={{ borderColor: POTENCJAL }}>+{fmt(x.w)}</span> {x.c}</p>
                      )) : <p className="muted pdx-czynnik">{t("brak")}</p>}
                    </div>
                    <div>
                      <p className="eyebrow" style={{ color: "var(--sand)", marginBottom: 6, textAlign: "left" }}>{t("coHamuje")}</p>
                      {minusy.length ? minusy.map((x, i) => (
                        <p key={i} className="pdx-czynnik"><span className="pdx-waga" style={{ borderColor: TARCIE }}>−{fmt(-x.w)}</span> {x.c}</p>
                      )) : <p className="muted pdx-czynnik">{t("brak")}</p>}
                    </div>
                  </div>
                  {w.role && w.role.length > 0 && (
                    <p className="muted" style={{ fontSize: "0.8rem", lineHeight: 1.55, marginTop: 12 }}>
                      <span style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.68rem" }}>{t("rola")}</span>{" "}
                      {w.role.join(" · ")}
                    </p>
                  )}
                  <p style={{ fontSize: "0.86rem", lineHeight: 1.6, marginTop: 12 }}>
                    <strong>{krotko(w)}</strong> — {opis(w.id)}
                  </p>
                  {pokazUwage && uwagaOpis && (
                    <p style={{ fontSize: "0.86rem", lineHeight: 1.6, marginTop: 8 }}>
                      <strong>{t("uwazaj")} {uwagaTemat!(w.id)}</strong> — {uwagaOpis(w.id)}
                    </p>
                  )}
                  {dodatek?.(w.id)}
                </div>
              )}
            </Fragment>
          );
        })}
      </div>

      <div style={{ border: "1px solid var(--line-gold)", background: "rgba(230,196,138,0.06)", borderRadius: 12, padding: "14px 18px", marginTop: 18 }}>
        <p className="eyebrow" style={{ color: "var(--sand)", marginBottom: 6, textAlign: "left" }}>{t("synteza")}</p>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
          {wspieraja.length ? tw("syntezaWspieraja", { lista: lista(wspieraja, "potencjal") }) : tw("syntezaBrakWsparcia")}{" "}
          {trudne.length ? tw("syntezaTarcie", { lista: lista(trudne, "tarcie") }) : tw("syntezaBrakTarcia")}
        </p>
      </div>
    </div>
  );
}
