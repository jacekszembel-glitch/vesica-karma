import { GRAHAS, RASIS } from "@/lib/astro/constants";
import { formatDMS } from "@/lib/astro/math";
import { opisDomu, kondycjaWskaznik } from "@/lib/astro/domInterpretacja";
import type { VedicChart } from "@/lib/astro/chart";

/**
 * Rozszerzony opis wybranego domu — pod wykresem, nie w dymku. Zostaje
 * widoczny dopóki użytkownik nie kliknie inne pole (albo to samo, żeby
 * zamknąć) — dymek przy wykresie w tym czasie też zostaje przypięty.
 */
export default function OpisDomuPanel({ chart, house, onZamknij, compareChart }: {
  chart: VedicChart; house: number; onZamknij: () => void;
  /** D9 (nawamsza) do porównania siły planet — patrz opisDomu(). Opcjonalne. */
  compareChart?: VedicChart;
}) {
  const opis = opisDomu(chart, house, compareChart);
  if (!opis) return null;

  return (
    <div style={{
      marginTop: 18, padding: "16px 18px", borderRadius: 12,
      background: "rgba(230,196,138,0.05)", border: "1px solid var(--line-gold)",
      position: "relative", textAlign: "left",
    }}>
      <button type="button" aria-label="Zamknij" onClick={onZamknij}
        style={{
          position: "absolute", top: 12, right: 12, width: 24, height: 24, borderRadius: "50%",
          background: "transparent", border: "1px solid var(--line-soft)", color: "var(--muted)",
          fontSize: "0.85rem", lineHeight: 1, cursor: "pointer",
        }}>×</button>
      <p style={{ margin: "0 0 4px", fontFamily: "var(--font-serif)", fontSize: "1.15rem", paddingRight: 30, color: "var(--sand)" }}>
        {opis.numer}. dom — {opis.nazwa} <span style={{ fontSize: "0.78rem", color: "#8ba0b0" }}>({opis.sanskryt})</span>
      </p>
      <p className="muted" style={{ margin: "0 0 10px", fontSize: "0.86rem", lineHeight: 1.6 }}>{opis.obszar}</p>
      <p style={{ margin: "0 0 12px", fontSize: "0.88rem" }}>
        <span style={{ color: "var(--teal-soft)" }}>{RASIS[opis.znak].symbol}</span>{" "}
        <strong>{RASIS[opis.znak].pl}</strong>{" "}
        <span className="muted" style={{ fontSize: "0.8rem" }}>
          · władca {GRAHAS[opis.wladcaZnaku].symbol} {GRAHAS[opis.wladcaZnaku].pl}
        </span>
      </p>
      {opis.planetyWDomu.length > 0 && (
        <div style={{ margin: "0 0 14px", display: "grid", gap: 6 }}>
          {opis.planetyWDomu.map((p) => {
            const k = kondycjaWskaznik(p.dignity);
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.84rem" }}>
                <span style={{ width: 92, flexShrink: 0 }}>
                  <span style={{ color: GRAHAS[p.id].color }}>{GRAHAS[p.id].symbol}</span> {GRAHAS[p.id].pl}
                </span>
                <span className="muted" style={{ width: 74, flexShrink: 0, fontSize: "0.78rem" }}>{formatDMS(p.degreeInSign)}</span>
                <span style={{ flex: 1, minWidth: 40, maxWidth: 110, height: 7, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                  <span style={{
                    display: "block", width: `${k.procent}%`, height: "100%", borderRadius: 4,
                    background: k.kolor, transition: "width 0.4s var(--ease-out)",
                  }} />
                </span>
                <span style={{ color: k.kolor, fontSize: "0.78rem", fontWeight: 600, flexShrink: 0 }}>{k.etykieta}</span>
              </div>
            );
          })}
        </div>
      )}
      <p style={{ margin: "0 0 8px", fontSize: "0.8rem", color: "var(--teal-soft)", letterSpacing: "0.03em" }}>CO TO ZNACZY</p>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.88rem", lineHeight: 1.65, color: "#dde5ea", display: "grid", gap: 8 }}>
        {opis.wnioski.map((w, i) => <li key={i}>{w}</li>)}
      </ul>
    </div>
  );
}
