import MoonStars from "./MoonStars";
import { SEGMENT_GAPY, type SystemKarmy } from "@/lib/koloKarmyGeometria";

/**
 * Wariant nagłówkowy Koła Karmy — statyczny „breadcrumb" postępu na
 * podstronach (Panel, Chiromancja, Astrologia, Numerologia), bez hover-
 * hotspotów/linków KoloKarmy.tsx. Te same warstwy assetów (taupe baza +
 * złote wypełnienie per ukończony system), tylko mniejszy i nieklikalny.
 */
export default function KoloKarmyMini({ ukonczone = new Set<SystemKarmy>(), zwiazki = false, maxWidth = 260 }: {
  ukonczone?: Set<SystemKarmy>;
  /** Czy sekcja Związki jest ukończona (krąg w rogu złoty zamiast szarego). */
  zwiazki?: boolean;
  maxWidth?: number;
}) {
  // Jak w KoloKarmy.tsx: przy komplecie (3/3) wracamy do oryginalnej, w pełni
  // złotej grafiki — łącznie z zewnętrznym pierścieniem Karmy i Związkami.
  const wszystkoZlote = ukonczone.size >= 3;

  return (
    <div aria-hidden="true" className={wszystkoZlote ? "kk-komplet" : undefined} style={{ position: "relative", isolation: "isolate", width: "100%", maxWidth, margin: "0 auto" }}>
      {/* poświata kompletu — okrąg pod zewnętrznym pierścieniem Karmy (nie obejmuje Związków) */}
      {wszystkoZlote && <span aria-hidden="true" className="kk-luna" style={{
        left: `${((596 - 351) / 1260) * 100}%`, top: `${((378 - 351) / 761) * 100}%`,
        width: `${(702 / 1260) * 100}%`, height: `${(702 / 761) * 100}%`,
      }} />}
      <img src={wszystkoZlote ? "/brand/kolo-karmy-gold-clean.png" : "/brand/kolo-karmy-taupe.png"} alt=""
        style={{ display: "block", width: "100%", height: "auto" }} />
      {!wszystkoZlote && (["astrologia", "hiromancja", "numerologia"] as const).filter((id) => ukonczone.has(id)).map((id) => (
        <img key={id} src={`/brand/fill-${id}-gold.png`} alt=""
          style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }} />
      ))}
      <MoonStars box={SEGMENT_GAPY.astrologia} zlote={ukonczone.has("astrologia")} />
      {/* środek Koła — zawsze zgaszony (jak w KoloKarmy.tsx) */}
      <img src="/brand/fill-panel-taupe.png" alt=""
        style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }} />
      {/* Związki — szare, dopóki sekcja Związki nie jest ukończona (jak w KoloKarmy.tsx) */}
      <img src={zwiazki ? "/brand/fill-zwiazki-gold.png" : "/brand/fill-zwiazki-taupe.png"} alt=""
        style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }} />
    </div>
  );
}
