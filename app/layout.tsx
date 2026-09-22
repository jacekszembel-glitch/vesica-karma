import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

/**
 * Layout — fonty i zmienne CSS w duchu 9dom, ale własna (fioletowa) paleta
 * i własny minimalny nagłówek (SiteHeader: wordmark + hamburger).
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const BAZA = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vesicakarma.com";

export const metadata: Metadata = {
  metadataBase: new URL(BAZA),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "VesicaKarma",
    locale: "pl_PL",
  },
  title: {
    default: "VesicaKarma — Astrologia, Chiromancja i Numerologia w jednym Kole Karmy",
    template: "%s | VesicaKarma",
  },
  description:
    "Trzy systemy odczytu — astrologia wedyjska, chiromancja i numerologia — połączone w jeden całościowy system wokół Koła Karmy.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <footer style={{ background: "var(--navy)", marginTop: 90, padding: "40px 0" }}>
          <div className="container">
            <p style={{ fontSize: "0.78rem", textAlign: "center", color: "#6e8292" }}>
              © {new Date().getFullYear()} VesicaKarma — narzędzie rozwojowe i edukacyjne,
              nie zastępuje porady medycznej, prawnej ani finansowej. Niczego nie przepowiadamy —
              wskazujemy drogę.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
