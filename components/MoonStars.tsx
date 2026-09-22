/**
 * Półksiężyc + gwiazdy — treść pętli Astrologii w Kole Karmy. To PRAWDZIWY
 * kształt wycięty z public/brand/astonomia.jpg (dostarczonego pliku
 * referencyjnego), nie odrysowany od nowa jako SVG — ten sam wzorzec co
 * icon-hiromancja.png (z public/brand/dlon.jpg). Assety generowane przez
 * scripts/generate-moonstars-asset.mjs (moonstars-gold.png / -taupe.png).
 */
const IMG_W = 1260, IMG_H = 761;

export default function MoonStars({ box, zlote = false }: {
  box: readonly [number, number, number, number]; zlote?: boolean;
}) {
  const [x0, y0, x1, y1] = box;
  return (
    <img
      src={`/brand/moonstars-${zlote ? "gold" : "taupe"}.png`}
      alt=""
      style={{
        position: "absolute",
        left: `${(x0 / IMG_W) * 100}%`,
        top: `${(y0 / IMG_H) * 100}%`,
        width: `${((x1 - x0) / IMG_W) * 100}%`,
        height: `${((y1 - y0) / IMG_H) * 100}%`,
        pointerEvents: "none",
      }}
    />
  );
}
