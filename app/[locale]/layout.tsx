import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
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
    default: "VesicaKarma — Astrologia, Hiromancja i Numerologia w jednym Kole Karmy",
    template: "%s | VesicaKarma",
  },
  description:
    "Trzy systemy odczytu — astrologia wedyjska, hiromancja i numerologia — połączone w jeden całościowy system wokół Koła Karmy.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations("Footer");

  return (
    <html lang={locale} className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SiteHeader />
          <main>{children}</main>
          <footer style={{ background: "var(--navy)", marginTop: 90, padding: "40px 0" }}>
            <div className="container">
              <p style={{ fontSize: "0.78rem", textAlign: "center", color: "#6e8292" }}>
                {t("stopka", { rok: new Date().getFullYear() })}
              </p>
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
