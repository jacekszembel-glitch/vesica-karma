"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { VedicChart } from "@/lib/astro/chart";
import { GRAHAS } from "@/lib/astro/constants";
import { TYPY_WYDARZEN, type TypWydarzenia } from "@/lib/astro/rektyfikacja";
import { walidujWydarzenie, przygotujProbke, podsumuj, type WynikZdarzenia, type PodsumowanieSystemu, type Wydarzenie } from "@/lib/astro/walidacja";

/** Drugi system walidacji — ocena jednego zdarzenia: trafienie, szansa przypadku i krótki opis. */
export interface DrugiSystem {
  nazwa: string;
  ocen: (w: Wydarzenie, dniProbki: Date[]) => { trafienie: boolean; pPrzypadku: number; opis: string };
}

/**
 * WALIDACJA — "Sprawdź na swoim życiu". Astrologia wedyjska zawsze; opcjonalny
 * drugi system (vesica-karma: numerologia — rok osobisty) przez prop `drugiSystem`,
 * dzięki czemu ten sam plik komponentu działa w 9dom i w vesica-karma.
 * Użytkownik dopisuje daty ważnych zdarzeń; każde porównujemy z innymi dniami
 * jego życia (lib/astro/walidacja.ts), a podsumowanie — z tym, co dałby
 * przypadek. Zdarzenia zostają w localStorage tej przeglądarki (pod kluczem
 * osoby) — rodzic montuje komponent z key={kluczZapisu}, więc zmiana osoby
 * wczytuje jej własną listę.
 */

interface Zapis { data: string; typ: TypWydarzenia }

const MIN_ZDARZEN = 3;

function wczytaj(klucz: string): Zapis[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(klucz) ?? "[]");
    return Array.isArray(v) ? v.filter((z) => typeof z?.data === "string" && TYPY_WYDARZEN.includes(z?.typ)) : [];
  } catch { return []; }
}
function zapisz(klucz: string, lista: Zapis[]) {
  try { localStorage.setItem(klucz, JSON.stringify(lista)); } catch { /* prywatne okno / brak miejsca — lista zostaje w pamięci */ }
}
const naDate = (iso: string) => { const [r, m, d] = iso.split("-").map(Number); return new Date(Date.UTC(r, m - 1, d, 12)); };

export default function WalidacjaZdarzen({ chart, kluczZapisu, linkRektyfikacji, drugiSystem }: {
  chart: VedicChart;
  kluczZapisu: string;
  /** Link do rektyfikacji (dostaje przetłumaczony tekst) — pokazywany, gdy wynik jest na poziomie przypadku. */
  linkRektyfikacji?: (tekst: string) => React.ReactNode;
  drugiSystem?: DrugiSystem;
}) {
  const t = useTranslations("Walidacja");
  const locale = useLocale();
  const [lista, setLista] = useState<Zapis[]>(() => wczytaj(kluczZapisu));
  const [data, setData] = useState("");
  const [typ, setTyp] = useState<TypWydarzenia>("slub");
  const [rozwiniety, setRozwiniety] = useState<number | null>(null);

  const dzisIso = new Date().toISOString().slice(0, 10);
  const urodzenieIso = chart.birth.date.toISOString().slice(0, 10);
  const probka = useMemo(() => przygotujProbke(chart), [chart]);
  const wyniki = useMemo(() => [...lista]
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((z) => {
      const wyd = { data: naDate(z.data), typ: z.typ };
      return { z, w: walidujWydarzenie(chart, wyd, probka), d: drugiSystem?.ocen(wyd, probka.daty) ?? null };
    }), [lista, chart, probka, drugiSystem]);
  const astro = useMemo(() => podsumuj(wyniki.map((x) => x.w.trafienie), wyniki.map((x) => x.w.pPrzypadku)), [wyniki]);
  const drugi = useMemo(() => (drugiSystem ? podsumuj(wyniki.map((x) => !!x.d?.trafienie), wyniki.map((x) => x.d?.pPrzypadku ?? 0)) : null), [wyniki, drugiSystem]);

  function zmien(nowa: Zapis[]) { setLista(nowa); zapisz(kluczZapisu, nowa); }
  function dodaj() {
    if (!data || data > dzisIso || data < urodzenieIso) return;
    zmien([...lista, { data, typ }]);
    setData("");
  }
  function usun(z: Zapis) { zmien(lista.filter((x) => x !== z)); setRozwiniety(null); }

  // vesica-karma: tabela planet ma tylko nazwy polskie (strona Karmy jest po polsku)
  const nazwaPl = (id: keyof typeof GRAHAS) => GRAHAS[id].pl;
  const fmtLiczba = (x: number) => x.toFixed(1).replace(".", locale === "pl" ? "," : ".");

  return (
    <details className="card" style={{ marginBottom: 24 }} open>
      <summary style={{ cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--primary-soft)" }}>
        {t("tytul")}
      </summary>
      <p className="muted" style={{ fontSize: "0.86rem", lineHeight: 1.6, margin: "12px 0 8px" }}>{t("wstep")}</p>
      {!chart.angles && <p className="muted" style={{ fontSize: "0.8rem", lineHeight: 1.5, marginBottom: 8 }}>{t("bezGodziny")}</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", margin: "14px 0 18px" }}>
        <label style={{ flex: "1 1 160px", textAlign: "left" }}>
          {t("labelData")}
          <input type="date" value={data} min={urodzenieIso} max={dzisIso} onChange={(e) => setData(e.target.value)} />
        </label>
        <label style={{ flex: "2 1 220px", textAlign: "left" }}>
          {t("labelTyp")}
          <select value={typ} onChange={(e) => setTyp(e.target.value as TypWydarzenia)}>
            {TYPY_WYDARZEN.map((x) => <option key={x} value={x}>{t(`typy.${x}`)}</option>)}
          </select>
        </label>
        <button type="button" className="btn btn-primary" onClick={dodaj} disabled={!data}>{t("dodaj")}</button>
      </div>

      {wyniki.length > 0 && (
        <div role="list" style={{ borderTop: "1px solid var(--line-soft)" }}>
          {wyniki.map(({ z, w, d }, i) => (
            <div key={`${z.data}-${z.typ}-${i}`} role="listitem" style={{ borderBottom: "1px solid var(--line-soft)", padding: "10px 0" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 14px" }}>
                <button type="button" onClick={() => setRozwiniety(rozwiniety === i ? null : i)} aria-expanded={rozwiniety === i}
                  style={{ background: "none", border: 0, color: "inherit", font: "inherit", cursor: "pointer", textAlign: "left", padding: 0, flex: "1 1 220px" }}>
                  <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--muted)", marginRight: 10 }}>{z.data}</span>
                  <strong>{t(`typy.${z.typ}`)}</strong>
                  <span className="muted" style={{ marginLeft: 8, fontSize: "0.8rem" }}>{rozwiniety === i ? "▾" : "▸"}</span>
                </button>
                <ZnacznikAstro w={w} t={t} />
                {d && <span className={d.trafienie ? "badge badge-good" : "badge"}>{d.trafienie ? "✓" : "✗"} {d.opis}</span>}
                <button type="button" className="btn btn-ghost" onClick={() => usun(z)} aria-label={t("usun")}
                  style={{ padding: "2px 10px", fontSize: "0.8rem" }}>×</button>
              </div>
              {rozwiniety === i && (
                <ul className="muted" style={{ fontSize: "0.82rem", lineHeight: 1.6, margin: "8px 0 2px", paddingLeft: 18 }}>
                  {w.okresy.map((o) => {
                    const powody = [
                      ...(o.wlada.length ? [t("powodWlada", { domy: o.wlada.join(", ") })] : []),
                      ...(o.stoiW ? [t("powodStoi", { dom: o.stoiW })] : []),
                      ...(o.karaka ? [t("powodKaraka")] : []),
                    ];
                    return (
                      <li key={o.poziom}>
                        {t(`poziomy.${o.poziom}`)} <strong style={{ color: GRAHAS[o.wladca].color }}>{nazwaPl(o.wladca)}</strong>
                        {" — "}{powody.length ? powody.join("; ") : t("powodBrak")}
                      </li>
                    );
                  })}
                  <li>{w.tranzyt.jowisz || w.tranzyt.saturn
                    ? [w.tranzyt.jowisz && t("tranzytJowisz"), w.tranzyt.saturn && t("tranzytSaturn")].filter(Boolean).join("; ")
                    : t("tranzytBrak")}</li>
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ border: "1px solid var(--line-gold)", background: "rgba(230,196,138,0.06)", borderRadius: 12, padding: "14px 18px", marginTop: 18 }}>
        <p className="eyebrow" style={{ color: "var(--sand)", marginBottom: 6, textAlign: "left" }}>{t("podsumowanieTytul")}</p>
        {wyniki.length < MIN_ZDARZEN ? (
          <p style={{ fontSize: "0.88rem", lineHeight: 1.6 }}>{t("zaMalo", { min: MIN_ZDARZEN, jest: wyniki.length })}</p>
        ) : (
          <>
            <WierszSystemu nazwa={t("systemAstro")} s={astro} t={t} fmt={fmtLiczba} podpowiedzRektyfikacji={linkRektyfikacji?.(t("rektyfikacja"))} />
            {drugiSystem && drugi && <WierszSystemu nazwa={drugiSystem.nazwa} s={drugi} t={t} fmt={fmtLiczba} bezGodziny />}
            {drugiSystem && drugi && lepszy(astro, drugi) !== null && (
              <p style={{ fontSize: "0.88rem", lineHeight: 1.6, marginTop: 6 }}>
                <strong>{t("lepszySystem", { system: lepszy(astro, drugi) === 0 ? t("systemAstro") : drugiSystem.nazwa })}</strong>
              </p>
            )}
          </>
        )}
      </div>
      <p className="muted" style={{ fontSize: "0.78rem", marginTop: 12, lineHeight: 1.5, fontStyle: "italic" }}>{t("prywatnosc")}</p>
    </details>
  );
}

type T = ReturnType<typeof useTranslations>;

/** Który system wypada lepiej na tle przypadku (0 = astrologia, 1 = drugi) — null, gdy żaden nie jest ponad przypadkiem. */
function lepszy(a: PodsumowanieSystemu, b: PodsumowanieSystemu): 0 | 1 | null {
  const ponad = (s: PodsumowanieSystemu) => s.trafienia > s.oczekiwanePrzypadkiem;
  if (!ponad(a) && !ponad(b)) return null;
  if (ponad(a) !== ponad(b)) return ponad(a) ? 0 : 1;
  return a.szansaPrzypadkiem <= b.szansaPrzypadkiem ? 0 : 1;
}

function ZnacznikAstro({ w, t }: { w: WynikZdarzenia; t: T }) {
  return (
    <span className={w.trafienie ? "badge badge-good" : "badge"} title={t("lepszyNiz", { procent: w.procentDni })}>
      {w.trafienie ? "✓" : "✗"} {t("lepszyNiz", { procent: w.procentDni })}
    </span>
  );
}

function WierszSystemu({ nazwa, s, t, fmt, podpowiedzRektyfikacji, bezGodziny }: {
  nazwa: string; s: PodsumowanieSystemu; t: T; fmt: (x: number) => string; podpowiedzRektyfikacji?: React.ReactNode;
  /** System, który nie używa godziny urodzenia (np. numerologia) — bez rady o jej sprawdzeniu. */
  bezGodziny?: boolean;
}) {
  const szansa = Math.round(s.szansaPrzypadkiem * 100);
  const werdykt = s.szansaPrzypadkiem < 0.05 ? "werdyktMocny" : s.trafienia > s.oczekiwanePrzypadkiem && s.szansaPrzypadkiem < 0.25 ? "werdyktLekki" : "werdyktPrzypadek";
  return (
    <div style={{ marginBottom: 6 }}>
      <p style={{ fontSize: "0.92rem", lineHeight: 1.6 }}>
        <strong>{nazwa}:</strong> {s.trafienia > s.oczekiwanePrzypadkiem
          ? t("wynikSystemu", { k: s.trafienia, n: s.wszystkie, oczekiwane: fmt(s.oczekiwanePrzypadkiem), szansa: Math.max(szansa, 1) })
          : t("wynikSystemuSlaby", { k: s.trafienia, n: s.wszystkie, oczekiwane: fmt(s.oczekiwanePrzypadkiem) })}
      </p>
      <p style={{ fontSize: "0.86rem", lineHeight: 1.6 }}>
        {t(werdykt === "werdyktPrzypadek" && bezGodziny ? "werdyktPrzypadekKrotki" : werdykt)}{" "}
        {werdykt === "werdyktPrzypadek" && podpowiedzRektyfikacji}
      </p>
    </div>
  );
}
