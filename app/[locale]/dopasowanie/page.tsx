"use client";

import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import Interpretation from "@/components/Interpretation";
import ParyNav from "@/components/ParyNav";
import { gunaMilan, type GunaMilanResult } from "@/lib/astro/gunamilan";
import { allPlanets } from "@/lib/astro/ephemeris";
import { NAKSHATRAS, RASIS } from "@/lib/astro/constants";
import PlacePicker from "@/components/PlacePicker";
import { PLACES, type Place } from "@/lib/geo";
import { SceneRelacje } from "@/components/infographics";
import Konwencje from "@/components/Konwencje";
import { coupleplaces, scorePoint, type CouplePlace } from "@/lib/astro/geoscore";
import { astrocartography, type PlanetLines } from "@/lib/astro/astrocarto";
import DateInput from "@/components/DateInput";

interface PersonInput {
  name: string;
  date: string;
  time: string;
  timeKnown: boolean;
  place: Place;
}

const empty = (): PersonInput => ({ name: "", date: "1990-06-15", time: "12:00", timeKnown: true, place: PLACES[0] });

function PersonForm({ label, value, onChange }: {
  label: string; value: PersonInput; onChange: (v: PersonInput) => void;
}) {
  return (
    <div className="card" style={{ display: "grid", gap: 14 }}>
      <p className="eyebrow">{label}</p>
      <div>
        <label>Imię (opcjonalnie)</label>
        <input type="text" value={value.name} placeholder="np. Ania"
          onChange={(e) => onChange({ ...value, name: e.target.value })} />
      </div>
      <div className="bf-row">
        <DateInput value={value.date} onChange={(v) => onChange({ ...value, date: v })} required />
        <div>
          <label>Godzina</label>
          <input type="time" value={value.time} disabled={!value.timeKnown}
            style={{ opacity: value.timeKnown ? 1 : 0.4 }}
            onChange={(e) => onChange({ ...value, time: e.target.value })} />
        </div>
      </div>
      <label style={{ display: "flex", gap: 8, alignItems: "center", textTransform: "none", cursor: "pointer", fontSize: "0.9rem", color: "var(--muted)" }}>
        <input type="checkbox" style={{ width: "auto" }} checked={!value.timeKnown}
          onChange={(e) => onChange({ ...value, timeKnown: !e.target.checked })} />
        nie znam godziny
      </label>
      <PlacePicker value={value.place} onChange={(place) => onChange({ ...value, place })} />
    </div>
  );
}

function moonLongitude(p: PersonInput): number {
  return allPlanets(utcOf(p)).moon.longitude;
}

/** Chwila urodzenia w UTC — potrzebna także do linii astrokartograficznych. */
function utcOf(p: PersonInput): Date {
  const local = DateTime.fromISO(`${p.date}T${p.timeKnown ? p.time : "12:00"}`, { zone: p.place.tz });
  return local.toUTC().toJSDate();
}

export default function DopasowaniePage() {
  const [a, setA] = useState<PersonInput>(empty());
  const [b, setB] = useState<PersonInput>({ ...empty(), date: "1992-03-20" });
  const [result, setResult] = useState<{ gm: GunaMilanResult; moonA: number; moonB: number } | null>(null);
  const [miejsca, setMiejsca] = useState<{ best: CouplePlace[]; hard: CouplePlace[] } | null>(null);
  const [linie, setLinie] = useState<{ a: PlanetLines[]; b: PlanetLines[] } | null>(null);
  const [sprawdzaneMiejsce, setSprawdzaneMiejsce] = useState<Place | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const moonA = moonLongitude(a);
    const moonB = moonLongitude(b);
    setResult({ gm: gunaMilan(moonA, moonB), moonA, moonB });
    // MAPA PARY — miejsca dobre dla obojga; linie liczymy dla obu chwil urodzenia
    const linesA = astrocartography(utcOf(a));
    const linesB = astrocartography(utcOf(b));
    setLinie({ a: linesA, b: linesB });
    setMiejsca(coupleplaces(linesA, linesB));
    setSprawdzaneMiejsce(null);
  }

  const aiData = useMemo(() => {
    if (!result) return null;
    const { gm } = result;
    return {
      osobaA: {
        imie: a.name || "Osoba 1",
        znakKsiezyca: RASIS[gm.moonA.sign].pl,
        nakszatra: NAKSHATRAS[gm.moonA.nakshatra].pl,
        motywNakszatry: NAKSHATRAS[gm.moonA.nakshatra].motyw,
      },
      osobaB: {
        imie: b.name || "Osoba 2",
        znakKsiezyca: RASIS[gm.moonB.sign].pl,
        nakszatra: NAKSHATRAS[gm.moonB.nakshatra].pl,
        motywNakszatry: NAKSHATRAS[gm.moonB.nakshatra].motyw,
      },
      wynik: {
        punkty: gm.total, max: 36, werdykt: gm.verdict,
        kuty: gm.kutas.map((k) => ({ nazwa: k.name, punkty: k.points, max: k.max, obszar: k.opis })),
        doshas: gm.doshas,
      },
    };
  }, [result, a.name, b.name]);

  const pct = result ? Math.round((result.gm.total / 36) * 100) : 0;

  return (
    <div className="container section">
      <div className="fade-up" style={{ maxWidth: 340, margin: "0 auto 10px" }}><SceneRelacje /></div>
      <h1 style={{ textAlign: "center" }}>Dopasowanie partnerskie</h1>
      <p className="section-sub">
        Guna Milan (Ashtakoota) — klasyczna wedyjska analiza zgodności dwojga ludzi.
        Osiem wymiarów, 36 punktów, zero wróżenia: konkretna mapa mocnych stron i wyzwań związku.
      </p>

      <ParyNav />

      <form onSubmit={handleSubmit} style={{ maxWidth: 880, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 20 }}>
          <PersonForm label="Osoba 1" value={a} onChange={setA} />
          <PersonForm label="Osoba 2" value={b} onChange={setB} />
        </div>
        <div style={{ textAlign: "center", marginTop: 22 }}>
          <button type="submit" className="btn btn-primary">Policz dopasowanie</button>
        </div>
      </form>

      {result && (
        <div className="fade-up" style={{ marginTop: 44, maxWidth: 880, margin: "44px auto 0", display: "grid", gap: 24 }}>
          {/* wynik główny */}
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{
              width: 150, height: 150, margin: "0 auto 14px", borderRadius: "50%",
              background: `conic-gradient(var(--primary) ${pct * 3.6}deg, var(--surface-2) 0deg)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: 118, height: 118, borderRadius: "50%", background: "var(--surface)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                border: "1px solid var(--line-soft)",
              }}>
                <span style={{ fontFamily: "var(--font-serif)", fontSize: "2.2rem", color: "var(--primary-soft)" }}>
                  {result.gm.total}
                </span>
                <span className="muted" style={{ fontSize: "0.8rem" }}>/ 36</span>
              </div>
            </div>
            <h2 style={{ fontSize: "1.6rem", marginBottom: 6 }}>
              Dopasowanie: <span className="gradient-text" style={{ fontStyle: "italic" }}>{result.gm.verdict}</span>
            </h2>
            <p className="muted" style={{ fontSize: "0.92rem" }}>
              {a.name || "Osoba 1"}: {NAKSHATRAS[result.gm.moonA.nakshatra].pl} ({RASIS[result.gm.moonA.sign].pl})
              &nbsp;·&nbsp;
              {b.name || "Osoba 2"}: {NAKSHATRAS[result.gm.moonB.nakshatra].pl} ({RASIS[result.gm.moonB.sign].pl})
            </p>
          </div>

          {/* kuty */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Osiem wymiarów zgodności</h3>
            <div style={{ display: "grid", gap: 12 }}>
              {result.gm.kutas.map((k) => (
                <div key={k.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                    <span><strong>{k.name}</strong> <span className="muted" style={{ fontSize: "0.82rem" }}>— {k.opis}</span></span>
                    <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--primary-soft)", fontWeight: 700 }}>
                      {k.points}/{k.max}
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden", margin: "5px 0 3px" }}>
                    <div style={{
                      width: `${(k.points / k.max) * 100}%`, height: "100%",
                      background: k.points / k.max >= 0.6 ? "var(--success)" : k.points / k.max >= 0.3 ? "var(--primary)" : "var(--warn)",
                      opacity: 0.75,
                    }} />
                  </div>
                  <p className="muted" style={{ fontSize: "0.82rem" }}>{k.komentarz}</p>
                </div>
              ))}
            </div>
            {result.gm.doshas.length > 0 && (
              <div style={{ marginTop: 18, padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(179,85,42,0.35)", background: "rgba(179,85,42,0.05)" }}>
                {result.gm.doshas.map((d, i) => (
                  <p key={i} style={{ fontSize: "0.85rem", color: "var(--warn)" }}>⚠ {d}</p>
                ))}
              </div>
            )}
          </div>

          {/* ═══ MAPA PARY — miejsca dobre dla obojga ═══ */}
          {miejsca && linie && (() => {
            /* Skala: normalizujemy do najmocniejszego wyniku w zestawie, żeby paski
               były porównywalne między sobą, a nie zależne od przypadkowej wartości. */
            const wszystkie = [...miejsca.best, ...miejsca.hard];
            const maks = Math.max(0.5, ...wszystkie.map((m) => Math.max(Math.abs(m.scoreA), Math.abs(m.scoreB))));
            const imieA = a.name?.trim() || "Osoba 1";
            const imieB = b.name?.trim() || "Osoba 2";

            const slowo = (v: number) =>
              v > 0.45 ? "mocno wspiera" : v > 0.12 ? "wspiera"
              : v > -0.12 ? "neutralne" : v > -0.45 ? "wymaga uwagi" : "trudne";

            const werdykt = (v: number) =>
              v > 0.4 ? { t: "dobre dla obojga", k: "var(--success)" }
              : v > 0.15 ? { t: "sprzyjające", k: "var(--teal-soft)" }
              : v > 0 ? { t: "lekko sprzyjające", k: "var(--muted)" }
              : { t: "wymagające", k: "var(--warn)" };

            const Pasek = ({ imie, v }: { imie: string; v: number }) => {
              const proc = Math.min(100, (Math.abs(v) / maks) * 100);
              const dodatni = v >= 0;
              return (
                <div className="para-pasek">
                  <span className="para-imie">{imie}</span>
                  <span className="para-tor" title={v.toFixed(2)}>
                    <span className="para-srodek" />
                    <span
                      className={dodatni ? "para-wypelnienie para-plus" : "para-wypelnienie para-minus"}
                      style={{ width: `${proc / 2}%` }}
                    />
                  </span>
                  <span className="para-slowo" style={{ color: dodatni ? "var(--teal-soft)" : "var(--warn)" }}>
                    {slowo(v)}
                  </span>
                </div>
              );
            };

            return (
              <div className="card" id="miejsca-pary" style={{ scrollMarginTop: 90 }}>
                <p className="eyebrow" style={{ marginBottom: 6 }}>Gdzie Wam razem sprzyja</p>
                <p className="muted" style={{ fontSize: "0.86rem", marginBottom: 18, lineHeight: 1.6 }}>
                  Każde miejsce oceniamy osobno dla Was dwojga. Wynik wspólny ciągniemy
                  w stronę <strong>gorszego</strong> z dwóch — miejsce świetne dla jednej osoby,
                  a trudne dla drugiej, nie jest dobrym miejscem dla pary.
                </p>

                <div style={{ margin: "18px 0 22px", paddingBottom: 20, borderBottom: "1px solid var(--line-soft)" }}>
                  <p className="eyebrow" style={{ marginBottom: 10 }}>Sprawdź inną miejscowość</p>
                  <PlacePicker
                    label="Miejscowość"
                    value={sprawdzaneMiejsce ?? { name: "", lat: 0, lon: 0, tz: "UTC" }}
                    onChange={setSprawdzaneMiejsce}
                  />

                  {sprawdzaneMiejsce && (() => {
                    const sa = scorePoint(linie.a, sprawdzaneMiejsce.lat, sprawdzaneMiejsce.lon);
                    const sb = scorePoint(linie.b, sprawdzaneMiejsce.lat, sprawdzaneMiejsce.lon);
                    const wspolny = (2 * Math.min(sa, sb) + Math.max(sa, sb)) / 3;
                    const w = werdykt(wspolny);
                    return (
                      <div className="para-miejsce" style={{ marginTop: 16 }}>
                        <div className="para-tytul">
                          <strong>{sprawdzaneMiejsce.name}</strong>
                          <span className="para-werdykt" style={{ color: w.k, borderColor: w.k }}>{w.t}</span>
                        </div>
                        <Pasek imie={imieA} v={sa} />
                        <Pasek imie={imieB} v={sb} />
                      </div>
                    );
                  })()}
                </div>

                {miejsca.best.length > 0 && (
                  <div className="para-lista">
                    {miejsca.best.map((m) => {
                      const w = werdykt(m.scoreShared);
                      return (
                        <div key={m.place.name} className="para-miejsce">
                          <div className="para-tytul">
                            <strong>{m.place.name}</strong>
                            <span className="para-werdykt" style={{ color: w.k, borderColor: w.k }}>{w.t}</span>
                          </div>
                          <Pasek imie={imieA} v={m.scoreA} />
                          <Pasek imie={imieB} v={m.scoreB} />
                        </div>
                      );
                    })}
                  </div>
                )}

                {miejsca.hard.length > 0 && (
                  <>
                    <p className="eyebrow" style={{ margin: "22px 0 10px" }}>Miejsca wymagające dla pary</p>
                    <div className="para-lista">
                      {miejsca.hard.map((m) => (
                        <div key={m.place.name} className="para-miejsce para-miejsce-trudne">
                          <div className="para-tytul">
                            <strong>{m.place.name}</strong>
                            <span className="para-werdykt" style={{ color: "var(--warn)", borderColor: "var(--warn)" }}>
                              wymagające
                            </span>
                          </div>
                          <Pasek imie={imieA} v={m.scoreA} />
                          <Pasek imie={imieB} v={m.scoreB} />
                        </div>
                      ))}
                    </div>
                    <p className="muted" style={{ fontSize: "0.79rem", marginTop: 14, lineHeight: 1.55 }}>
                      To nie znaczy „nie jedźcie tam”. Trudniejsze miejsce po prostu mocniej
                      uwypukla tematy, nad którymi i tak pracujecie.
                    </p>
                  </>
                )}
              </div>
            );
          })()}

          <Interpretation kind="para" data={aiData} />
        </div>
      )}
      <Konwencje />
    </div>
  );
}
