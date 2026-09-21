/**
 * Półksiężyc + gwiazdy — nowa treść pętli Astrologii w Kole Karmy (Faza 1
 * reskinu). Proste liniowe SVG w stylu reszty ikon brandu, pozycjonowane
 * w tym samym układzie procentowym (IMG_W×IMG_H) co pozostałe warstwy
 * KoloKarmy.tsx — box podany w tej samej przestrzeni co HOTSPOTY[].gap.
 */
const IMG_W = 1260, IMG_H = 761;

/** Współrzędne zmierzone bezpośrednio z pikseli referencji projektowej
 *  (public/brand/astonomia.jpg — dedykowany, czystszy kadr niż poprzedni
 *  — analiza plam jasności / connected components, przeliczone proporcjonalnie
 *  x/szerokość, y/wysokość do lokalnego układu viewBox 0-100/0-60). */
const GWIAZDY = [
  { x: 58.8, y: 34.7, s: 7.5 },
  { x: 28.8, y: 33.6, s: 6.0 },
  { x: 51.1, y: 27.4, s: 4.8 },
  { x: 73.3, y: 32.1, s: 4.4 },
  { x: 50.5, y: 43.4, s: 3.8 },
  { x: 65.4, y: 39.8, s: 2.9 },
  { x: 45.5, y: 18.5, s: 2.9 },
  { x: 36.0, y: 40.6, s: 2.9 },
  { x: 79.3, y: 41.1, s: 2.9 },
  { x: 57.1, y: 19.6, s: 2.9 },
  { x: 22.4, y: 40.0, s: 2.9 },
  { x: 67.1, y: 24.0, s: 2.8 },
  { x: 34.2, y: 23.8, s: 2.8 },
];

function Iskra({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <path
      d={`M ${x} ${y - s} L ${x + s * 0.28} ${y - s * 0.28} L ${x + s} ${y} L ${x + s * 0.28} ${y + s * 0.28} L ${x} ${y + s} L ${x - s * 0.28} ${y + s * 0.28} L ${x - s} ${y} L ${x - s * 0.28} ${y - s * 0.28} Z`}
      fill="currentColor"
    />
  );
}

export default function MoonStars({ box, zlote = false }: {
  box: readonly [number, number, number, number]; zlote?: boolean;
}) {
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
      {/* półksiężyc — środek i rozmiar zmierzone tak samo jak gwiazdy,
          kształt (koło minus przesunięte koło) dobrany do tych proporcji */}
      <mask id="ks-mask">
        <rect x="0" y="0" width="100" height="60" fill="black" />
        <circle cx="41.2" cy="32.3" r="7.5" fill="white" />
        <circle cx="43.85" cy="30.4" r="5.88" fill="black" />
      </mask>
      <circle cx="41.2" cy="32.3" r="7.5" fill="currentColor" mask="url(#ks-mask)" />
      {GWIAZDY.map((g, i) => <Iskra key={i} {...g} />)}
    </svg>
  );
}
