import type { Metadata } from "next";

/** Metadane trasy — strona jest komponentem klienckim i nie może ich eksportować. */
export const metadata: Metadata = {
  title: "Kosmogram wedyjski online — mapa D1 i nawamsza D9",
  description: "Darmowy kosmogram wedyjski (Jyotish): lagna, 9 grah w domach, nakszatry, okresy Vimshottari i nawamsza D9. Ayanamsa Lahiri.",
  alternates: { canonical: "/kosmogram" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
