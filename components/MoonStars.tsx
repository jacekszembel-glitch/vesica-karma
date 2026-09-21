/**
 * Półksiężyc + gwiazdy — nowa treść pętli Astrologii w Kole Karmy (Faza 1
 * reskinu). Proste liniowe SVG w stylu reszty ikon brandu, pozycjonowane
 * w tym samym układzie procentowym (IMG_W×IMG_H) co pozostałe warstwy
 * KoloKarmy.tsx — box podany w tej samej przestrzeni co HOTSPOTY[].gap.
 */
const IMG_W = 1260, IMG_H = 761;

/** Współrzędne zmierzone bezpośrednio z pikseli referencji projektowej
 *  (public/brand/nowa- kolo-karmy.jpg — analiza plam jasności / connected
 *  components, nie „na oko"), przeliczone do lokalnego układu viewBox
 *  przez SEGMENT_GAPY.astrologia. Metoda pomiaru: patrz git history tego
 *  pliku (skrypt scripts/_measure_stars.mjs, usunięty po użyciu). */
const GWIAZDY = [
  { x: 62.6, y: 34.8, s: 7.5 },
  { x: 16.6, y: 33.3, s: 5.9 },
  { x: 54.0, y: 21.3, s: 4.3 },
  { x: 83.7, y: 30.9, s: 3.9 },
  { x: 50.7, y: 49.7, s: 2.6 },
  { x: 27.3, y: 16.7, s: 2.1 },
  { x: 60.5, y: 9.6, s: 2.0 },
  { x: 43.6, y: 8.2, s: 1.8 },
  { x: 74.5, y: 17.0, s: 1.6 },
  { x: 30.3, y: 44.7, s: 1.8 },
  { x: 72.4, y: 43.3, s: 1.8 },
  { x: 10.1, y: 43.7, s: 1.6 },
  { x: 92.0, y: 45.4, s: 1.8 },
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
      {/* półksiężyc — środek i rozmiar zmierzone tak samo jak gwiazdy
          (bbox 26×35 w przestrzeni referencji), kształt (koło minus
          przesunięte koło) dobrany do tych proporcji */}
      <mask id="ks-mask">
        <rect x="0" y="0" width="100" height="60" fill="black" />
        <circle cx="37.4" cy="31.2" r="13" fill="white" />
        <circle cx="42" cy="27.9" r="10.2" fill="black" />
      </mask>
      <circle cx="37.4" cy="31.2" r="13" fill="currentColor" mask="url(#ks-mask)" />
      {GWIAZDY.map((g, i) => <Iskra key={i} {...g} />)}
    </svg>
  );
}
