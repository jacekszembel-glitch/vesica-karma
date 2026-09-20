import type { Metadata } from "next";

/** Metadane trasy — strona jest komponentem klienckim i nie może ich eksportować. */
export const metadata: Metadata = {
  title: "Numerologia wedyjska — droga życia, mulank i portret liczbowy",
  description: "Pełny profil w indyjskiej numerologii wedyjskiej: droga życia, mulank, bhagyank, planeta władająca, siatka Lo Shu i rok osobisty.",
  alternates: { canonical: "/numerologia" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
