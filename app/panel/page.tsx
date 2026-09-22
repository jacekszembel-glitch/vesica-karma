import Link from "next/link";
import KoloKarmyMini from "@/components/KoloKarmyMini";
import { UKONCZONE_DEMO, type SystemKarmy } from "@/lib/koloKarmyGeometria";

/**
 * Mój Panel — status trzech systemów (Chiromancja/Astrologia/Numerologia)
 * jako kafelki, wzorowane na mockupach. Faza 1 reskinu: stan „ukończone"
 * na sztywno (przykładowy), nie prawdziwe śledzenie zapisanych danych —
 * to osobna, późniejsza faza (patrz plan reskinu w repo czas-duszy).
 */
const SYSTEMY: { id: SystemKarmy; label: string; href: string }[] = [
  { id: "hiromancja", label: "Chiromancja", href: "/hiromancja" },
  { id: "astrologia", label: "Astrologia", href: "/kosmogram" },
  { id: "numerologia", label: "Numerologia", href: "/numerologia" },
];

/** Astrologia nie ma już icon-astrologia.png (kompas wycięty, zastąpiony
 *  gwiazdami+księżycem w KoloKarmy/KoloKarmyMini) — ten sam motyw, tylko
 *  skalowany do kwadratowego kafelka. */
function IkonaAstrologiiKafelek({ gotowe }: { gotowe: boolean }) {
  return (
    <svg viewBox="0 0 46 46" width="46" height="46" aria-hidden="true"
      style={{ color: gotowe ? "var(--sand)" : "var(--taupe)" }}>
      <mask id="kafelek-ks-mask">
        <rect x="0" y="0" width="46" height="46" fill="black" />
        <circle cx="23" cy="23" r="10" fill="white" />
        <circle cx="27" cy="19" r="8.5" fill="black" />
      </mask>
      <circle cx="23" cy="23" r="10" fill="currentColor" mask="url(#kafelek-ks-mask)" />
      {[[36, 12, 3], [8, 30, 2.6], [34, 34, 2]].map(([x, y, s], i) => (
        <path key={i} fill="currentColor"
          d={`M ${x} ${y - s} L ${x + s * 0.28} ${y - s * 0.28} L ${x + s} ${y} L ${x + s * 0.28} ${y + s * 0.28} L ${x} ${y + s} L ${x - s * 0.28} ${y + s * 0.28} L ${x - s} ${y} L ${x - s * 0.28} ${y - s * 0.28} Z`} />
      ))}
    </svg>
  );
}

function Kafelek({ id, label, href, gotowe }: { id: SystemKarmy; label: string; href: string; gotowe: boolean }) {
  return (
    <Link href={href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textDecoration: "none" }}>
      <span style={{
        width: 92, height: 92, borderRadius: "50%",
        display: "grid", placeItems: "center",
        border: `2px solid ${gotowe ? "var(--gold)" : "var(--taupe)"}`,
        transition: "border-color 0.3s",
      }}>
        {id === "astrologia"
          ? <IkonaAstrologiiKafelek gotowe={gotowe} />
          : <img src={`/brand/icon-${id}${gotowe ? "" : "-taupe"}.png`} alt="" style={{ width: 46, height: 46 }} />}
      </span>
      <span style={{ color: "var(--text)", fontSize: "0.95rem" }}>{label}</span>
      <span className="eyebrow" style={{ color: gotowe ? "var(--gold)" : "var(--muted)", fontSize: "0.68rem" }}>
        {gotowe ? "Ukończone" : "Nie ukończone"}
      </span>
    </Link>
  );
}

/** Strzałka od podpowiedzi do pierwszego nieukończonego kafelka — narysowana
 *  pod pozycję lewego (pierwszego) kafelka w rzędzie, tak jak w referencji.
 *  Faza 1: układ na sztywno pod demo-stan (Chiromancja zawsze pierwsza). */
function StrzalkaDoKafelka() {
  return (
    <svg width="70" height="110" viewBox="0 0 70 110" aria-hidden="true"
      style={{ position: "absolute", left: -10, top: -96, overflow: "visible" }}>
      <defs>
        <marker id="grot" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--sand)" />
        </marker>
      </defs>
      <path d="M 58 105 C 15 105, 8 55, 28 8" fill="none" stroke="var(--sand)" strokeWidth="2" markerEnd="url(#grot)" />
    </svg>
  );
}

export default function Page() {
  const brakujace = SYSTEMY.filter((s) => !UKONCZONE_DEMO.has(s.id));
  const strzalkaPasuje = brakujace.length > 0 && brakujace[0].id === SYSTEMY[0].id;

  return (
    <div className="container section" style={{ maxWidth: 640, textAlign: "center" }}>
      <KoloKarmyMini ukonczone={UKONCZONE_DEMO} />

      <h1 style={{ margin: "28px 0 18px" }}>Mój panel</h1>
      <div className="ornament" style={{ marginBottom: 32 }} />

      <div style={{ display: "flex", justifyContent: "center", gap: 36, flexWrap: "wrap" }}>
        {SYSTEMY.map((s) => (
          <Kafelek key={s.id} {...s} gotowe={UKONCZONE_DEMO.has(s.id)} />
        ))}
      </div>

      <div className="ornament" style={{ margin: "36px 0 20px" }} />

      <div style={{ position: "relative", display: "inline-block" }}>
        {strzalkaPasuje && <StrzalkaDoKafelka />}
        {brakujace.length > 0 ? (
          <p style={{ color: "var(--sand)", fontFamily: "var(--font-serif)", fontSize: "1.2rem" }}>
            Już prawie gotowe! Jeszcze tylko {brakujace.map((s) => s.label).join(" i ")}{" "}
            i zaczynamy analizę!
          </p>
        ) : (
          <p style={{ color: "var(--sand)", fontFamily: "var(--font-serif)", fontSize: "1.2rem" }}>
            Wszystkie trzy systemy gotowe — czas na pełną analizę Twojego Koła Karmy.
          </p>
        )}
      </div>

      <div className="ornament" style={{ margin: "36px 0 20px" }} />

      <div style={{ textAlign: "left" }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>Vesica Karma</p>
        <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.75 }}>
          Jest zestawieniem trzech systemów, które każdy w inny sposób opisuje każdego z nas
          od samego urodzenia. Każdy z nas, aby mógł przyjść na ten świat, musiał spełnić trzy
          warunki: miejsce, czas oraz ciało. Te trzy bezwzględne warunki mają swoje odpowiedniki
          w astrologii, numerologii i chiromancji — pierwsza metoda opisuje za pomocą miejsca,
          daty i godziny, druga metoda używa daty oraz imienia i nazwiska, trzecia zaś korzysta
          z samego ciała, na którym zapisana jest — tak samo jak w gwiazdach — nasza karma.
          Musimy ją tylko odnaleźć i korzystać z jej dobrodziejstw.
        </p>
        <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.75, marginTop: 16 }}>
          Cały system został zaprojektowany na znaku Vesica Piscis — potrójmy wymiar istnienia:
          symbolizuje spójność trzech przenikających się stref — ciała, umysłu i duszy; czasu
          (przeszłości, teraźniejszości i przyszłości).
        </p>
      </div>
    </div>
  );
}
