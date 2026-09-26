import type { Metadata } from "next";

/** Metadane trasy — strona jest komponentem klienckim i nie może ich eksportować. */
export const metadata: Metadata = {
  title: "Dopasowanie partnerskie Guna Milan — 36 punktów",
  description: "Klasyczna wedyjska analiza zgodności pary: osiem kut, 36 punktów, doszy z wyjaśnieniami oraz miejsca na świecie sprzyjające Wam obojgu.",
  alternates: { canonical: "/dopasowanie" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
