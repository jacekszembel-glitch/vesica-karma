import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

/**
 * Layout na start — same fonty i zmienne CSS (--bg/--sand/--gold) co w
 * 9dom (spójna paleta), bez SiteHeader/NightSky/DoGory z tamtego repo —
 * te są zrobione pod strukturę nawigacji 9dom. Nagłówek i stopka
 * VesicaKarma do zaprojektowania osobno, na razie minimalne, żeby dało
 * się nawigować i przetestować logowanie.
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
        <header style={{ padding: "20px 0" }}>
          <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/" style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", color: "var(--sand)", letterSpacing: "0.12em", fontWeight: 700 }}>
              VESICA KARMA
            </Link>
            <nav style={{ display: "flex", gap: 18, fontSize: "0.85rem" }}>
              <Link href="/konto" className="muted">Moje konto</Link>
              <Link href="/logowanie" className="muted">Zaloguj</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer style={{ background: "var(--navy)", marginTop: 90, padding: "40px 0" }}>
          <div className="container">
            <p style={{ fontSize: "0.78rem", textAlign: "center", color: "#6e8292" }}>
              © {new Date().getFullYear()} VesicaKarma — narzędzie rozwojowe i edukacyjne,
              nie zastępuje porady medycznej, prawnej ani finansowej i niczego nie przepowiada.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
