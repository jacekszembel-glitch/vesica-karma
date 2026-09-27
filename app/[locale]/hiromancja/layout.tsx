import type { Metadata } from "next";
import KoloKarmy from "@/components/KoloKarmy";
import Starfield from "@/components/Starfield";

/** Metadane trasy — strona jest komponentem klienckim i nie może ich eksportować. */
export const metadata: Metadata = {
  title: "Chiromancja — typ dłoni i odczyt linii",
  description: "Klasyczna zachodnia typologia dłoni (Ziemia/Powietrze/Ogień/Woda) liczona geometrycznie z Twojego zdjęcia, plus AI-owy odczyt widocznych linii serca, głowy, życia i losu.",
  alternates: { canonical: "/hiromancja" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="container" style={{ paddingTop: 36 }}>
        <div className="kolo-karmy-wrap" style={{ position: "relative", margin: "0 auto", overflow: "hidden" }}>
          <Starfield count={50} centerX={47.3} centerY={49.7} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <KoloKarmy ukonczone={new Set(["hiromancja"])} />
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
