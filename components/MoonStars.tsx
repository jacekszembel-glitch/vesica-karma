/**
 * Półksiężyc + gwiazdy — nowa treść pętli Astrologii w Kole Karmy (Faza 1
 * reskinu). Proste liniowe SVG w stylu reszty ikon brandu, pozycjonowane
 * w tym samym układzie procentowym (IMG_W×IMG_H) co pozostałe warstwy
 * KoloKarmy.tsx — box podany w tej samej przestrzeni co HOTSPOTY[].gap.
 */
const IMG_W = 1260, IMG_H = 761;

const GWIAZDY = [
  { x: 60, y: 18, s: 5 },
  { x: 92, y: 44, s: 4 },
  { x: 18, y: 52, s: 4 },
  { x: 78, y: 82, s: 3.5 },
  { x: 32, y: 86, s: 3.5 },
  { x: 8, y: 22, s: 3 },
];

function Iskra({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <path
      d={`M ${x} ${y - s} L ${x + s * 0.28} ${y - s * 0.28} L ${x + s} ${y} L ${x + s * 0.28} ${y + s * 0.28} L ${x} ${y + s} L ${x - s * 0.28} ${y + s * 0.28} L ${x - s} ${y} L ${x - s * 0.28} ${y - s * 0.28} Z`}
      fill="currentColor"
    />
  );
}

export default function MoonStars({ box, zlote = false }: { box: readonly [number, number, number, number]; zlote?: boolean }) {
  const [x0, y0, x1, y1] = box;
  return (
    <svg
      viewBox="0 0 100 60"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{
        position: "absolute",
        left: `${(x0 / IMG_W) * 100}%`,
        top: `${(y0 / IMG_H) * 100}%`,
        width: `${((x1 - x0) / IMG_W) * 100}%`,
        height: `${((y1 - y0) / IMG_H) * 100}%`,
        color: zlote ? "var(--sand)" : "var(--taupe)",
        filter: zlote ? "drop-shadow(0 0 6px rgba(230, 196, 138, 0.65))" : undefined,
        pointerEvents: "none",
      }}
    >
      {GWIAZDY.map((g, i) => <Iskra key={i} {...g} />)}
      {/* półksiężyc — koło z odjętym przesuniętym kołem (maska) */}
      <mask id="ks-mask">
        <rect x="0" y="0" width="100" height="60" fill="black" />
        <circle cx="50" cy="30" r="13" fill="white" />
        <circle cx="56" cy="26" r="11" fill="black" />
      </mask>
      <circle cx="50" cy="30" r="13" fill="currentColor" mask="url(#ks-mask)" />
    </svg>
  );
}
