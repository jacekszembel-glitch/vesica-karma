import type { Metadata } from "next";
import KoloKarmy from "@/components/KoloKarmy";
import Starfield from "@/components/Starfield";

/** Metadane trasy — strona jest komponentem klienckim i nie może ich eksportować. */
export const metadata: Metadata = {
  title: "Kosmogram wedyjski online — mapa D1 i nawamsza D9",
  description: "Darmowy kosmogram wedyjski (Jyotish): lagna, 9 grah w domach, nakszatry, okresy Vimshottari i nawamsza D9. Ayanamsa Lahiri.",
  alternates: { canonical: "/kosmogram" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="container" style={{ paddingTop: 36 }}>
        <div style={{ position: "relative", maxWidth: 1000, margin: "0 auto", overflow: "hidden" }}>
          <Starfield count={50} centerX={47.3} centerY={49.7} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <KoloKarmy ukonczone={new Set(["astrologia"])} />
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
