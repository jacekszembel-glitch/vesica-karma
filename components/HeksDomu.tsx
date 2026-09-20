import { BHAVAS } from "@/lib/astro/constants";

/**
 * HEKSAGON DOMU — z planszy brandbooka „DOMY — OBSZARY ŻYCIA":
 * sześciokątny kafel z numerem domu, nazwą sanskrycką i tematem.
 * Kendry (1/4/7/10) i trikony (5/9) dostają złotą obwódkę — to domy
 * uznawane klasycznie za filary mapy; reszta turkusową.
 */

const KENDRY_I_TRIKONY = new Set([1, 4, 5, 7, 9, 10]);

export default function HeksDomu({ dom, size = 108, aktywny = false }: {
  /** Numer domu 1–12. */
  dom: number;
  size?: number;
  /** Wyróżnienie (np. dom, w którym stoi omawiana planeta). */
  aktywny?: boolean;
}) {
  const b = BHAVAS[dom - 1];
  const filar = KENDRY_I_TRIKONY.has(dom);
  const kolor = filar ? "#c39a3b" : "rgba(127, 208, 216, 0.55)";

  // sześciokąt spiczasty do góry, wpisany w 100×100
  const punkty = Array.from({ length: 6 }, (_, i) => {
    const kat = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return `${(50 + Math.cos(kat) * 46).toFixed(1)},${(50 + Math.sin(kat) * 46).toFixed(1)}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img"
      aria-label={`${b.pl} (${b.sanskrit}) — ${b.obszar}`}>
      <polygon points={punkty}
        fill={aktywny ? "rgba(230,196,138,0.1)" : "rgba(20,40,58,0.85)"}
        stroke={kolor} strokeWidth={aktywny ? 1.8 : 1.1} />
      <text x="50" y="36" textAnchor="middle" fontSize="22"
        fontFamily="var(--font-serif)" fill={filar ? "#e6c48a" : "#7fd0d8"}>
        {dom}
      </text>
      <text x="50" y="53" textAnchor="middle" fontSize="8.5"
        fontFamily="var(--font-sans)" letterSpacing="0.12em"
        fill="#93a6b3" style={{ textTransform: "uppercase" }}>
        {b.sanskrit.toUpperCase()}
      </text>
      {/* temat w dwóch krótkich liniach */}
      {(() => {
        const slowa = b.obszar.split(", ")[0].split(" ");
        const pol = Math.ceil(slowa.length / 2);
        const l1 = slowa.slice(0, pol).join(" ");
        const l2 = slowa.slice(pol).join(" ");
        return (
          <>
            <text x="50" y="66" textAnchor="middle" fontSize="7" fontFamily="var(--font-sans)" fill="#e8eef2" opacity="0.85">{l1}</text>
            {l2 && <text x="50" y="75" textAnchor="middle" fontSize="7" fontFamily="var(--font-sans)" fill="#e8eef2" opacity="0.85">{l2}</text>}
          </>
        );
      })()}
    </svg>
  );
}
