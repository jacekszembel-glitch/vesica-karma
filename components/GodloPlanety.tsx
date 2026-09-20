import { GRAHAS, type PlanetId } from "@/lib/astro/constants";

/**
 * GODŁO PLANETY — z planszy brandbooka „PLANETY — JĘZYK SYMBOLI":
 * symbol grahy w ozdobnej okrągłej otoczce w kolorze planety, z pierścieniem
 * orbitalnych kropek. Pod spodem opcjonalnie nazwa polska i sanskrycka.
 */

export default function GodloPlanety({ id, size = 72, podpis = false }: {
  id: PlanetId;
  size?: number;
  podpis?: boolean;
}) {
  const g = GRAHAS[id];
  // 8 kropek orbitalnych — stały rytm, jak na planszy
  const kropki = Array.from({ length: 8 }, (_, i) => {
    const kat = (i / 8) * Math.PI * 2 - Math.PI / 2;
    return { x: 50 + Math.cos(kat) * 40, y: 50 + Math.sin(kat) * 40 };
  });

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`${g.pl} (${g.sanskrit})`}>
        <defs>
          <radialGradient id={`gp-tlo-${id}`} cx="0.5" cy="0.42" r="0.7">
            <stop offset="0" stopColor="#14283a" />
            <stop offset="1" stopColor="#0a1521" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="47" fill={`url(#gp-tlo-${id})`} />
        <circle cx="50" cy="50" r="47" fill="none" stroke={g.color} strokeWidth="1.2" opacity="0.9" />
        <circle cx="50" cy="50" r="33" fill="none" stroke={g.color} strokeWidth="0.5" opacity="0.35" />
        {kropki.map((k, i) => (
          <circle key={i} cx={k.x} cy={k.y} r="1.1" fill={g.color} opacity="0.55" />
        ))}
        {/* poświata pod symbolem */}
        <circle cx="50" cy="50" r="16" fill={g.color} opacity="0.1" />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
          fontSize="30" fill={g.color} fontFamily="var(--font-serif)">
          {g.symbol}
        </text>
      </svg>
      {podpis && (
        <span style={{ textAlign: "center", lineHeight: 1.3 }}>
          <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "var(--text)" }}>
            {g.pl}
          </span>
          <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: "0.66rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)" }}>
            {g.sanskrit}
          </span>
        </span>
      )}
    </span>
  );
}
