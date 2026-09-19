import type { Metadata } from "next";

/** Metadane trasy — strona jest komponentem klienckim i nie może ich eksportować. */
export const metadata: Metadata = {
  title: "Chiromancja — typ dłoni i odczyt linii",
  description: "Klasyczna zachodnia typologia dłoni (Ziemia/Powietrze/Ogień/Woda) liczona geometrycznie z Twojego zdjęcia, plus AI-owy odczyt widocznych linii serca, głowy, życia i losu.",
  alternates: { canonical: "/hiromancja" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
