/**
 * Półksiężyc + gwiazdy — nowa treść pętli Astrologii w Kole Karmy (Faza 1
 * reskinu). Proste liniowe SVG w stylu reszty ikon brandu, pozycjonowane
 * w tym samym układzie procentowym (IMG_W×IMG_H) co pozostałe warstwy
 * KoloKarmy.tsx — box podany w tej samej przestrzeni co HOTSPOTY[].gap.
 */
const IMG_W = 1260, IMG_H = 761;

const GWIAZDY = [
  { x: 62, y: 10, s: 5.5 },
  { x: 86, y: 18, s: 4 },
  { x: 57, y: 45, s: 7 },
  { x: 36, y: 53, s: 4 },
  { x: 16, y: 45, s: 3 },
  { x: 80, y: 45, s: 3.5 },
  { x: 94, y: 50, s: 3 },
  { x: 50, y: 5, s: 3 },
  { x: 74, y: 57, s: 3 },
  { x: 8, y: 17, s: 2.8 },
  { x: 96, y: 31, s: 3.2 },
  { x: 70, y: 30, s: 2.5 },
];

function Iskra({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <path
      d={`M ${x} ${y - s} L ${x + s * 0.28} ${y - s * 0.28} L ${x + s} ${y} L ${x + s * 0.28} ${y + s * 0.28} L ${x} ${y + s} L ${x - s * 0.28} ${y + s * 0.28} L ${x - s} ${y} L ${x - s * 0.28} ${y - s * 0.28} Z`}
      fill="currentColor"
    />
  );
}

export default function MoonStars({ box, zlote = false, puls = false }: {
  box: readonly [number, number, number, number]; zlote?: boolean; puls?: boolean;
}) {
  const [x0, y0, x1, y1] = box;
  return (
    <svg
      viewBox="0 0 100 60"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className={`kk-ikona-puls${puls ? " kk-ikona-puls-aktywna" : ""}`}
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
      {/* półksiężyc — duży, dominujący, po lewej stronie kompozycji; koło
          z odjętym przesuniętym kołem (maska) */}
      <mask id="ks-mask">
        <rect x="0" y="0" width="100" height="60" fill="black" />
        <circle cx="32" cy="30" r="19" fill="white" />
        <circle cx="39" cy="25" r="15.5" fill="black" />
      </mask>
      <circle cx="32" cy="30" r="19" fill="currentColor" mask="url(#ks-mask)" />
      {GWIAZDY.map((g, i) => <Iskra key={i} {...g} />)}
    </svg>
  );
}
