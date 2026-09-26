import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Numerologia partnerska — kalkulator dopasowania",
  description:
    "Darmowy kalkulator numerologii partnerskiej: wpisz dwie daty urodzenia i sprawdź zgodność dróg życia. Bez rejestracji.",
  keywords: [
    "numerologia partnerska", "kalkulator miłości", "dopasowanie numerologiczne",
    "zgodność dat urodzenia", "droga życia partnerzy", "kalkulator par",
  ],
  alternates: { canonical: "/numerologia-partnerska" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
