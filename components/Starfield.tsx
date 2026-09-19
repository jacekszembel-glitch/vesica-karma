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

export default function Starfield({ count = 90, mandala = true, centerX = 50, centerY = 50 }: {
  count?: number; mandala?: boolean;
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
    }));
  }, [count]);

  return (
    <>
      <div className="starfield" aria-hidden="true">
        {stars.map((s) => (
          <span key={s.id} className="star" style={{
            left: `${s.left}%`, top: `${s.top}%`,
            width: `${s.size}px`, height: `${s.size}px`,
            ["--tw" as string]: `${s.tw}s`,
            ["--td" as string]: `${s.td}s`,
            ["--o1" as string]: s.o1,
            ["--o2" as string]: s.o2,
          }} />
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
          {/* lotos — 12 płatków między pierścieniami (zamiast jantry) */}
          {Array.from({ length: 12 }, (_, i) => {
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
