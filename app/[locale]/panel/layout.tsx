import type { Metadata } from "next";
import KoloKarmy from "@/components/KoloKarmy";
import Starfield from "@/components/Starfield";

export const metadata: Metadata = {
  title: "Twoja Karma",
  description: "Postęp trzech systemów Koła Karmy — chiromancji, astrologii i numerologii — i Twoje zapisane odczyty.",
  alternates: { canonical: "/panel" },
};

/** To samo duże Koło Karmy w tym samym miejscu co w Astrologii, Numerologii i Chiromancji —
 *  po złotej fali z gwiazdki przejście tutaj jest płynne: Koło zostaje na swoim miejscu,
 *  bez podmiany na mniejsze. Postęp kręgów Koło czyta samo (usePostepKarmy). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="container" style={{ paddingTop: 36 }}>
        <div className="kolo-karmy-wrap" style={{ position: "relative", margin: "0 auto" }}>
          <Starfield count={50} centerX={47.3} centerY={49.7} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <KoloKarmy ukonczone={new Set()} />
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
