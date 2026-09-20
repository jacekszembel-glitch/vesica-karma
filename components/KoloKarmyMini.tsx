import MoonStars from "./MoonStars";
import { SEGMENT_GAPY, type SystemKarmy } from "@/lib/koloKarmyGeometria";

/**
 * Wariant nagłówkowy Koła Karmy — statyczny „breadcrumb" postępu na
 * podstronach (Panel, Chiromancja, Astrologia, Numerologia), bez hover-
 * hotspotów/linków KoloKarmy.tsx. Te same warstwy assetów (taupe baza +
 * złote wypełnienie per ukończony system), tylko mniejszy i nieklikalny.
 */
export default function KoloKarmyMini({ ukonczone = new Set<SystemKarmy>(), maxWidth = 260 }: {
  ukonczone?: Set<SystemKarmy>;
  maxWidth?: number;
}) {
  return (
    <div aria-hidden="true" style={{ position: "relative", width: "100%", maxWidth, margin: "0 auto" }}>
      <img src="/brand/kolo-karmy-taupe.png" alt="" style={{ display: "block", width: "100%", height: "auto" }} />
      {(["astrologia", "hiromancja", "numerologia"] as const).filter((id) => ukonczone.has(id)).map((id) => (
        <img key={id} src={`/brand/fill-${id}-gold.png`} alt=""
          style={{
            position: "absolute", left: 0, top: 0, width: "100%", height: "100%",
            filter: "drop-shadow(0 0 10px rgba(230, 196, 138, 0.5))",
          }} />
      ))}
      <MoonStars box={SEGMENT_GAPY.astrologia} zlote={ukonczone.has("astrologia")} />
    </div>
  );
}
