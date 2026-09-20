import type { Metadata } from "next";

/** Metadane trasy — strona jest komponentem klienckim i nie może ich eksportować. */
export const metadata: Metadata = {
  title: "Numerologia imienia — ekspresja, dusza i osobowość",
  description: "Trzy liczby ukryte w Twoim imieniu z pełnym rachunkiem litera po literze. Obsługa polskich znaków, systemy pitagorejski i chaldejski.",
  alternates: { canonical: "/numerologia-imienia" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
