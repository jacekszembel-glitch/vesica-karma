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

function Kafelek({ id, label, href, gotowe }: { id: SystemKarmy; label: string; href: string; gotowe: boolean }) {
  return (
    <Link href={href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textDecoration: "none" }}>
      <span style={{
        width: 92, height: 92, borderRadius: "50%",
        display: "grid", placeItems: "center",
        border: `2px solid ${gotowe ? "var(--gold)" : "var(--taupe)"}`,
        boxShadow: gotowe ? "0 0 18px rgba(230, 196, 138, 0.45)" : "none",
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}>
        <img src={`/brand/icon-${id}${gotowe ? "" : "-taupe"}.png`} alt="" style={{ width: 46, height: 46 }} />
      </span>
      <span style={{ color: "var(--text)", fontSize: "0.95rem" }}>{label}</span>
      <span className="eyebrow" style={{ color: gotowe ? "var(--gold)" : "var(--muted)", fontSize: "0.68rem" }}>
        {gotowe ? "Ukończone" : "Nie ukończone"}
      </span>
    </Link>
  );
}

export default function Page() {
  const brakujace = SYSTEMY.filter((s) => !UKONCZONE_DEMO.has(s.id));

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
  );
}
