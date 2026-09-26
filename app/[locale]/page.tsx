import KoloKarmy from "@/components/KoloKarmy";
import Starfield from "@/components/Starfield";
import CzymJestVesicaKarma from "@/components/CzymJestVesicaKarma";

/**
 * Strona główna VesicaKarma = samo Koło Karmy, bez sekcji hero nad nim
 * (w 9dom jest to jedna sekcja na stronie; tu jest całą stroną główną —
 * to jest cały produkt, nie dekoracja).
 */
export default function Home() {
  return (
    <section className="section" style={{ position: "relative", overflow: "hidden", paddingTop: 60 }}>
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ position: "relative", maxWidth: 1000, margin: "0 auto" }}>
          <Starfield count={50} centerX={47.3} centerY={49.7} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <KoloKarmy />
          </div>
        </div>
        <CzymJestVesicaKarma />
      </div>
    </section>
  );
}
