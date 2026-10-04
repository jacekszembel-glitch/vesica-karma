import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Outfit } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import SiteHeader from "@/components/SiteHeader";
import { SKRYPT_ODWROCENIA } from "@/lib/odwrocenieKolorow";
import "./globals.css";

/**
 * Layout — fonty i zmienne CSS w duchu 9dom, ale własna (fioletowa) paleta
 * i własny minimalny nagłówek (SiteHeader: wordmark + hamburger).
 */
/** Jedna czcionka całej strony: Outfit — geometryczna, bez szeryfów, okrągłe litery
 *  powtarzają okręgi Koła Vesica (zastąpiła Cormorant Garamond w nagłówkach i Inter
 *  w treści). Zmienna oś grubości. */
const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-outfit",
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
    // suppressHydrationWarning: atrybut data-odwrocone ustawia skrypt przed hydratacją
    <html lang={locale} className={outfit.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SKRYPT_ODWROCENIA }} />
      </head>
      <body>
        {/* filtr odwrócenia kolorów (lib/odwrocenieKolorow.ts): c' = (fiolet + złoto) − c */}
        <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
          <filter id="vk-odwroc" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix"
              values="-1 0 0 0 0.9922  0 -1 0 0 0.8275  0 0 -1 0 0.6980  0 0 0 1 0" />
          </filter>
        </svg>
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
