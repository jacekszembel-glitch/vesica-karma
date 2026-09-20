import { VEDIC_PLANETS, mulankBhagyankRelacja, type NumerologyResult } from "@/lib/astro/numerology";
import { OPIS_RELACJI_MULANK_BHAGYANK } from "@/lib/astro/numerologia-tresc";
import Term from "@/components/Term";

/**
 * MULANK ↔ BHAGYANK — klasyczna wedyjska numerologia NIE sumuje tych dwóch
 * liczb w trzecią (sprawdzone: nie ma takiej tradycji, ani zachodniej, ani
 * indyjskiej, dla sumy 5-6 liczb naraz). Zamiast tego porównuje ich planety
 * przez naturalną przyjaźń (Parashara) — ta sama logika co graha maitri
 * w kosmogramie (patrz mulankBhagyankRelacja w numerology.ts).
 */

const KOLOR: Record<string, string> = {
  "wielki przyjaciel": "var(--success)",
  "przyjaciel": "var(--success)",
  "neutralny": "var(--sand)",
  "wróg": "var(--warn)",
  "wielki wróg": "var(--warn)",
};
const BADGE_KLASA: Record<string, string> = {
  "wielki przyjaciel": "badge badge-good",
  "przyjaciel": "badge badge-good",
  "neutralny": "badge",
  "wróg": "badge badge-warn",
  "wielki wróg": "badge badge-warn",
};

export default function RelacjaMulankBhagyank({ numerology }: { numerology: NumerologyResult }) {
  const mulank = numerology.birthdayRoot;
  const bhagyank = numerology.destiny;
  const relacja = mulankBhagyankRelacja(mulank, bhagyank);
  const kolor = KOLOR[relacja];

  return (
    <div className="card" style={{ borderTop: `2px solid ${kolor}` }}>
      <p className="eyebrow" style={{ marginBottom: 6 }}>
        <Term k="relacjamulankbhagyank">Mulank ↔ Bhagyank</Term>
      </p>
      <p className="muted" style={{ fontSize: "0.84rem", marginBottom: 16, lineHeight: 1.55 }}>
        Tradycja wedyjska nie sumuje tych dwóch liczb w trzecią — porównuje ich planety przez
        naturalną przyjaźń (ta sama zasada co w kosmogramie). To pokazuje, czy Twoja natura
        (Mulank) i Twoja droga życia (Bhagyank) ciągną w tę samą stronę.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ textAlign: "center" }}>
          <p className="muted" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Mulank</p>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", color: "var(--primary-soft)" }}>{mulank}</p>
          <p className="muted" style={{ fontSize: "0.72rem" }}>{VEDIC_PLANETS[mulank]}</p>
        </div>
        <span style={{ color: kolor, fontSize: "1.3rem" }}>↔</span>
        <div style={{ textAlign: "center" }}>
          <p className="muted" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>Bhagyank</p>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", color: "var(--primary-soft)" }}>{bhagyank}</p>
          <p className="muted" style={{ fontSize: "0.72rem" }}>{VEDIC_PLANETS[bhagyank]}</p>
        </div>
        <span className={BADGE_KLASA[relacja]} style={{ marginLeft: "auto" }}>
          {relacja}
        </span>
      </div>

      <p style={{ fontSize: "0.88rem", lineHeight: 1.6 }}>
        {mulank === bhagyank
          ? `Mulank i Bhagyank to ta sama planeta (${VEDIC_PLANETS[mulank]}) — ${OPIS_RELACJI_MULANK_BHAGYANK[relacja]}`
          : OPIS_RELACJI_MULANK_BHAGYANK[relacja].charAt(0).toUpperCase() + OPIS_RELACJI_MULANK_BHAGYANK[relacja].slice(1)}
      </p>
    </div>
  );
}
