import type { Metadata } from "next";
import KoloKarmyMini from "@/components/KoloKarmyMini";
import { UKONCZONE_DEMO } from "@/lib/koloKarmyGeometria";

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
        <KoloKarmyMini ukonczone={UKONCZONE_DEMO} maxWidth={160} />
      </div>
      {children}
    </>
  );
}
