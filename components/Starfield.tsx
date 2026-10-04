"use client";

import { useMemo } from "react";

/**
 * Migoczące gwiazdy + obracająca się mandala (jantra) w tle hero.
 * Czysty CSS — zero bibliotek. Pozycje deterministyczne (seed), żeby
 * SSR i klient renderowały identycznie.
 */

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Dłoń z linii (Chiromancja) zamiast lotosu — otwarta dłoń z kciukiem w lewo, wpisana w środek
 *  mandali (450, 450), z trzema głównymi liniami: serca, głowy i życia. Ta sama kreska co reszta. */
function sciezkiDloni(): string[] {
  const cx = 450, cy = 480;
  const p = (x: number, y: number) => `${(cx + x).toFixed(1)},${(cy + y).toFixed(1)}`;
  // palce stykają się bokami: [lewa krawędź, prawa krawędź, wierzch y, dół lewej krawędzi]
  const palce: [number, number, number, number][] = [
    [-104, -58, -205, 0], [-58, -10, -250, -45], [-10, 36, -228, -45], [36, 76, -165, -45],
  ];
  const sciezki = palce.map(([l, pr, top, dolL]) => {
    const r = (pr - l) / 2;
    return `M ${p(l, dolL)} L ${p(l, top + r)} A ${r} ${r} 0 0 1 ${p(pr, top + r)} L ${p(pr, -45)}`;
  });
  // zgięcia u nasady palców
  sciezki.push(`M ${p(-58, -45)} Q ${p(-34, -38)} ${p(-10, -45)} Q ${p(13, -38)} ${p(36, -45)} Q ${p(56, -40)} ${p(76, -45)}`);
  // prawa krawędź dłoni (strona małego palca) do nadgarstka
  sciezki.push(`M ${p(76, -45)} C ${p(96, 40)} ${p(98, 140)} ${p(66, 205)} L ${p(60, 262)}`);
  // kciuk: od nasady palca wskazującego w górę i w lewo, czubek, zewnętrzna krawędź w dół do nadgarstka
  sciezki.push(`M ${p(-104, 0)} C ${p(-130, -20)} ${p(-150, -48)} ${p(-160, -62)} A 21 21 0 0 0 ${p(-194, -40)} C ${p(-170, 10)} ${p(-140, 60)} ${p(-118, 100)} C ${p(-104, 150)} ${p(-80, 200)} ${p(-62, 212)} L ${p(-66, 262)}`);
  // linie dłoni: serca, głowy, życia
  sciezki.push(`M ${p(88, 0)} C ${p(40, -22)} ${p(-20, -18)} ${p(-66, -30)}`);
  sciezki.push(`M ${p(-104, 22)} C ${p(-40, 30)} ${p(30, 52)} ${p(80, 82)}`);
  sciezki.push(`M ${p(-100, 16)} C ${p(-36, 80)} ${p(-46, 160)} ${p(-28, 222)}`);
  return sciezki;
}

export default function Starfield({ count = 90, mandala = true, centerX = 50, centerY = 50, motyw = "lotos", cyfry = false }: {
  count?: number; mandala?: boolean;
  /** Środek mandali: lotos (domyślnie) albo dłoń z linii (Chiromancja). */
  motyw?: "lotos" | "dlon";
  /** Zamiast migoczących gwiazdek — malutkie migoczące cyfry 1–9 (Numerologia). */
  cyfry?: boolean;
  /** Środek mandali w % szerokości/wysokości rodzica — domyślnie 50/50 (środek
   *  całego kontenera), ale np. w Kole Karmy sam obrazek ma niesymetryczny
   *  bounding box (dolutek Związków wystaje w prawo), więc środek koła
   *  wypada gdzie indziej niż środek obrazka — wtedy trzeba podać ręcznie. */
  centerX?: number; centerY?: number;
}) {
  const stars = useMemo(() => {
    const rnd = mulberry32(47);
    // toFixed — identyczne stringi w SSR i przeglądarce (hydratacja)
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: (rnd() * 100).toFixed(2),
      top: (rnd() * 100).toFixed(2),
      size: (0.8 + rnd() * 1.8).toFixed(2),
      tw: (2.5 + rnd() * 5).toFixed(2),
      td: (rnd() * 6).toFixed(2),
      o1: (0.05 + rnd() * 0.15).toFixed(3),
      o2: (0.4 + rnd() * 0.5).toFixed(3),
      cyfra: 1 + Math.floor(rnd() * 9),
    }));
  }, [count]);

  return (
    <>
      <div className="starfield" aria-hidden="true">
        {stars.map((s) => (
          <span key={s.id} className={cyfry ? "star star-cyfra" : "star"} style={{
            left: `${s.left}%`, top: `${s.top}%`,
            ...(cyfry
              ? { fontSize: `${(6 + Number(s.size) * 2.2).toFixed(1)}px` }
              : { width: `${s.size}px`, height: `${s.size}px` }),
            ["--tw" as string]: `${s.tw}s`,
            ["--td" as string]: `${s.td}s`,
            ["--o1" as string]: s.o1,
            ["--o2" as string]: s.o2,
          }}>{cyfry ? s.cyfra : null}</span>
        ))}
      </div>

      {/* mandala / jantra */}
      {mandala && (
      <svg className="mandala" width="900" height="900" viewBox="0 0 900 900" fill="none" aria-hidden="true"
        style={{ top: `${centerY}%`, left: `${centerX}%` }}>
        <g stroke="#11a7b6" strokeWidth="1.1">
          <circle cx="450" cy="450" r="430" />
          <circle cx="450" cy="450" r="360" strokeDasharray="2 9" />
          <circle cx="450" cy="450" r="290" />
          <circle cx="450" cy="450" r="180" strokeDasharray="1 7" />
          {/* dłoń z linii (Chiromancja) zamiast lotosu */}
          {motyw === "dlon" && sciezkiDloni().map((d, i) => <path key={`dlon${i}`} d={d} fill="none" />)}
          {/* lotos — 12 płatków między pierścieniami (zamiast jantry) */}
          {motyw === "lotos" && Array.from({ length: 12 }, (_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            const aL = ((i * 30 - 11) * Math.PI) / 180;
            const aR = ((i * 30 + 11) * Math.PI) / 180;
            const p = (r: number, ang: number) =>
              `${(450 + r * Math.cos(ang)).toFixed(2)},${(450 + r * Math.sin(ang)).toFixed(2)}`;
            return (
              <path
                key={`lot${i}`}
                d={`M ${p(184, aL)} Q ${p(252, aL)} ${p(286, a)} Q ${p(252, aR)} ${p(184, aR)}`}
                fill="none"
              />
            );
          })}
          {/* promienie */}
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * 15 * Math.PI) / 180;
            const x1 = (450 + 430 * Math.cos(a)).toFixed(2);
            const y1 = (450 + 430 * Math.sin(a)).toFixed(2);
            const x2 = (450 + 452 * Math.cos(a)).toFixed(2);
            const y2 = (450 + 452 * Math.sin(a)).toFixed(2);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
          {/* symbole planet na orbicie */}
          {["☉", "☾", "♂", "☿", "♃", "♀", "♄", "☊", "☋"].map((s, i) => {
            const a = ((i * 40 - 90) * Math.PI) / 180;
            const x = (450 + 325 * Math.cos(a)).toFixed(2);
            const y = (450 + 325 * Math.sin(a)).toFixed(2);
            return (
              <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                fill="#11a7b6" fontSize="22" stroke="none">{s}</text>
            );
          })}
        </g>
      </svg>
      )}
    </>
  );
}
