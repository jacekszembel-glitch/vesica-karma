import { GRAHAS } from "@/lib/astro/constants";
import { nazwaZPara, rokDlaWieku } from "@/lib/astro/mapaCzasuJogUtils";
import type { FazaZycia } from "@/components/MapaCzasuJog";
import type { Dosza } from "@/lib/astro/doshas";

/**
 * Dymek z listą dosz aktywnych w danej mahadaszy — mirror DymekOkresu.tsx
 * (jogi). Zniesione dosze pokazane niżej, wyciszone, z dopiskiem powodu —
 * tak jak Neeczabhanga w jogach pokazuje zniesiony upadek jako fakt.
 */
export default function DymekOkresuDoszy({ birth, faza, dosze }: { birth: Date; faza: FazaZycia; dosze: Dosza[] }) {
  const g = GRAHAS[faza.lord];
  const aktywne = dosze.filter((d) => !d.zniesiona);
  const zniesione = dosze.filter((d) => d.zniesiona);
  return (
    <div style={{
      background: "rgba(16, 34, 49, 0.98)", border: "1px solid var(--line)",
      borderRadius: 10, padding: "10px 14px", width: 260,
      boxShadow: "0 10px 26px rgba(0,0,0,0.5)",
      animation: "fadeUp 0.15s var(--ease-out) both",
      fontSize: "0.8rem", color: "#e8eef2", lineHeight: 1.5,
      pointerEvents: "auto", maxHeight: "min(340px, 70vh)", overflowY: "auto",
    }}>
      <p style={{ margin: "0 0 6px", fontFamily: "var(--font-serif)", fontSize: "0.95rem" }}>
        <span style={{ color: g.color }}>{g.symbol}</span> Mahadasha {g.pl}
        <span className="muted" style={{ fontSize: "0.85rem", display: "block", marginTop: 2 }}>
          {Math.round(faza.fromAge)}–{Math.round(faza.toAge)} lat
          {" · "}{rokDlaWieku(birth, faza.fromAge)}–{rokDlaWieku(birth, faza.toAge)}
          {faza.current && " · teraz"}
        </span>
      </p>
      {dosze.length === 0 ? (
        <p className="muted" style={{ margin: 0, fontSize: "0.76rem" }}>Żadna ze sprawdzanych dosz nie działa w tym okresie.</p>
      ) : (
        <div style={{ display: "grid", gap: 5 }}>
          {aktywne.map((d) => (
            <p key={d.id} style={{ margin: 0 }}>
              <strong>{nazwaZPara(d)}</strong>
              <span className="muted" style={{ display: "block", fontSize: "0.74rem" }}>{d.ryzyko}</span>
              <span style={{ display: "block", fontSize: "0.72rem", color: "var(--sand)", marginTop: 2 }}>
                U Ciebie: {d.uzasadnienie}
              </span>
            </p>
          ))}
          {zniesione.map((d) => (
            <p key={d.id} style={{ margin: 0, opacity: 0.65 }}>
              <strong style={{ textDecoration: "line-through", textDecorationColor: "rgba(255,255,255,0.4)" }}>
                {nazwaZPara(d)}
              </strong>
              <span className="muted" style={{ display: "block", fontSize: "0.72rem", marginTop: 2 }}>
                Zniesiona: {d.powodZniesienia}
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
