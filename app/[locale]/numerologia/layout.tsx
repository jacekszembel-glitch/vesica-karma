import type { Metadata } from "next";
import KoloKarmy from "@/components/KoloKarmy";
import Starfield from "@/components/Starfield";

/** Metadane trasy — strona jest komponentem klienckim i nie może ich eksportować. */
export const metadata: Metadata = {
  title: "Numerologia wedyjska — droga życia, mulank i portret liczbowy",
  description: "Pełny profil w indyjskiej numerologii wedyjskiej: droga życia, mulank, bhagyank, planeta władająca i rok osobisty.",
  alternates: { canonical: "/numerologia" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="container" style={{ paddingTop: 36 }}>
        <div className="kolo-karmy-wrap" style={{ position: "relative", margin: "0 auto" }}>
          <Starfield count={50} centerX={47.3} centerY={49.7} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <KoloKarmy ukonczone={new Set(["numerologia"])} />
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
