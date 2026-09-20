import type { Metadata } from "next";
import KoloKarmyMini from "@/components/KoloKarmyMini";
import { UKONCZONE_DEMO } from "@/lib/koloKarmyGeometria";

/** Metadane trasy — strona jest komponentem klienckim i nie może ich eksportować. */
export const metadata: Metadata = {
  title: "Numerologia wedyjska — droga życia, mulank i portret liczbowy",
  description: "Pełny profil w indyjskiej numerologii wedyjskiej: droga życia, mulank, bhagyank, planeta władająca, siatka Lo Shu i rok osobisty.",
  alternates: { canonical: "/numerologia" },
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
