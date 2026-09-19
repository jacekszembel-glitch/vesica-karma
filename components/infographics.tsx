/**
 * Seria infografik 9 DOM — sceny liniowe wg brandbooka:
 * cienka złota linia (#E6C48A) + akcenty turkusu (#7FD0D8) na granacie.
 * Każda scena = samodzielna ilustracja modułu (viewBox 320×200).
 */

type S = { width?: number | string; className?: string };

function Scene({ children, width = "100%", className, label }: S & { children: React.ReactNode; label: string }) {
  return (
    <span className="scene-shine" style={{ display: "block", width }}>
      <svg viewBox="0 0 320 200" width="100%" className={className} fill="none"
        role="img" aria-label={label}
        strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </span>
  );
}

const G = "#e6c48a";   // złoto piaskowe
const T = "#7fd0d8";   // turkus jasny
const GD = "rgba(230,196,138,0.35)";
const TD = "rgba(127,208,216,0.3)";

/** ŚCIEŻKA — góra dharmy ze szlakiem poziomów i gwiazdą szczytu. */
export function SceneSciezka(p: S) {
  return (
    /* Siedem rozchodzących się łuków — kolejne poziomy odsłaniane od środka
       na zewnątrz. Poprzednia wersja (szczyt góry z gwiazdą nad wierzchołkiem)
       czytała się jako choinka. */
    <Scene {...p} label="Ścieżka — siedem odsłanianych poziomów">
      {/* podstawa — horyzont, od którego wszystko się otwiera */}
      <path d="M28 168 h264" stroke={GD} strokeWidth="1.2" />

      {/* poziomy 1-7 jako półkola o rosnącym promieniu */}
      {[22, 40, 58, 76, 94, 112, 130].map((r, i) => {
        const ostatni = i === 6;
        return (
          <path
            key={r}
            d={`M ${160 - r} 168 A ${r} ${r} 0 0 1 ${160 + r} 168`}
            stroke={ostatni ? G : T}
            strokeWidth={ostatni ? 1.7 : 1.2}
            strokeDasharray={i >= 4 ? "3 6" : undefined}
            opacity={ostatni ? 1 : 0.35 + i * 0.1}
          />
        );
      })}

      {/* promień przecinający łuki — droga w górę, z węzłem na każdym poziomie */}
      <path d="M160 168 v-146" stroke={GD} strokeWidth="1" strokeDasharray="2 6" />
      {[146, 128, 110, 92, 74, 56, 38].map((y, i) => (
        <circle
          key={y}
          cx="160" cy={y}
          r={i === 6 ? 4.6 : 2.6}
          stroke={i === 6 ? G : T}
          strokeWidth="1.4"
          fill={i === 6 ? "rgba(230,196,138,0.22)" : "#0d1b2a"}
        />
      ))}

      {/* numery poziomów przy dwóch skrajnych — czytelny kierunek */}
      <text x="150" y="150" fill={T} fontSize="8" opacity="0.7">1</text>
      <text x="150" y="42" fill={G} fontSize="8">7</text>

      {/* wschodzące słońce po prawej — dokąd to prowadzi */}
      <path d="M232 168 a26 26 0 0 1 52 0" stroke={GD} strokeWidth="1.2" />
      <path d="M258 128 v-9 M234 138 l-6 -6 M282 138 l6 -6" stroke={GD} strokeWidth="1" />
    </Scene>
  );
}

/** MAPA ŻYCIA — pionowa oś czasu z latami i planetami. */
export function SceneMapaZycia(p: S) {
  return (
    <Scene {...p} label="Mapa Życia — oś czasu">
      <path d="M160 16 v168" stroke={G} strokeWidth="1.6" />
      {/* węzły epok */}
      {[
        [40, "☽", 1], [76, "♄", 0], [112, "♃", 1], [148, "☉", 0],
      ].map(([y, sym, side], i) => (
        <g key={i}>
          <circle cx="160" cy={y as number} r={i === 2 ? 7 : 4.5} stroke={i === 2 ? G : T} strokeWidth="1.4"
            fill={i === 2 ? "rgba(230,196,138,0.15)" : "none"} />
          <path d={`M${side ? 167 : 153} ${y} h${side ? 34 : -34}`} stroke={side ? GD : TD} strokeWidth="1" />
          <text x={side ? 210 : 110} y={(y as number) + 4} fill={i === 2 ? G : T} fontSize="12"
            textAnchor="middle" stroke="none">{sym}</text>
        </g>
      ))}
      <text x="160" y="196" fill={GD} fontSize="9" textAnchor="middle" stroke="none" letterSpacing="3">TERAZ ▲</text>
      {/* orbity w tle */}
      <circle cx="160" cy="94" r="74" stroke={TD} strokeWidth="0.8" strokeDasharray="1 6" />
      <circle cx="160" cy="94" r="52" stroke={GD} strokeWidth="0.8" strokeDasharray="1 5" />
    </Scene>
  );
}

/** KOMPAS DNIA — róża wiatrów z pięcioma jakościami dnia. */
export function SceneDzis(p: S) {
  return (
    <Scene {...p} label="Kompas dnia">
      <circle cx="160" cy="100" r="72" stroke={G} strokeWidth="1.5" />
      <circle cx="160" cy="100" r="56" stroke={GD} strokeWidth="1" strokeDasharray="2 5" />
      <circle cx="160" cy="100" r="30" stroke={TD} strokeWidth="1" />
      {/* promienie */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45 * Math.PI) / 180;
        const long = i % 2 === 0;
        return (
          <path key={i}
            d={`M${(160 + (long ? 62 : 66) * Math.sin(a)).toFixed(1)} ${(100 - (long ? 62 : 66) * Math.cos(a)).toFixed(1)}
               L${(160 + 72 * Math.sin(a)).toFixed(1)} ${(100 - 72 * Math.cos(a)).toFixed(1)}`}
            stroke={G} strokeWidth={long ? 1.5 : 1} />
        );
      })}
      {/* igła */}
      <path d="M178 74 L166 106 L146 114 L158 82 Z" stroke={T} strokeWidth="1.5" fill="rgba(127,208,216,0.12)" />
      <circle cx="162" cy="98" r="3" stroke={G} strokeWidth="1.4" fill="#0d1b2a" />
      {/* księżyc i słońce po bokach */}
      <path d="M52 60 a14 14 0 1 0 10 24 a11 11 0 0 1 -10 -24" stroke={T} strokeWidth="1.3" />
      <circle cx="272" cy="58" r="11" stroke={G} strokeWidth="1.3" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45 * Math.PI) / 180;
        return <path key={i} d={`M${(272 + 15 * Math.cos(a)).toFixed(1)} ${(58 + 15 * Math.sin(a)).toFixed(1)} l${(4 * Math.cos(a)).toFixed(1)} ${(4 * Math.sin(a)).toFixed(1)}`} stroke={GD} strokeWidth="1" />;
      })}
    </Scene>
  );
}

/** RELACJE — dwa kosmogramy zachodzące na siebie, iskra pośrodku. */
export function SceneRelacje(p: S) {
  return (
    <Scene {...p} label="Relacje — dwie mapy">
      <circle cx="118" cy="100" r="62" stroke={G} strokeWidth="1.5" />
      <circle cx="202" cy="100" r="62" stroke={T} strokeWidth="1.5" />
      <circle cx="118" cy="100" r="46" stroke={GD} strokeWidth="0.9" strokeDasharray="2 5" />
      <circle cx="202" cy="100" r="46" stroke={TD} strokeWidth="0.9" strokeDasharray="2 5" />
      {/* mini-diamenty (kosmogramy) */}
      <path d="M118 72 l20 28 -20 28 -20 -28 Z" stroke={GD} strokeWidth="1" />
      <path d="M202 72 l20 28 -20 28 -20 -28 Z" stroke={TD} strokeWidth="1" />
      {/* część wspólna — płomień/iskra */}
      <path d="M160 84 c6 8 10 12 10 19 a10 10 0 0 1 -20 0 c0 -7 4 -11 10 -19 Z" stroke={G} strokeWidth="1.5" fill="rgba(230,196,138,0.12)" />
      <circle cx="160" cy="104" r="3" fill={G} stroke="none" />
      {/* symbole */}
      <text x="86" y="105" fill={G} fontSize="13" stroke="none" textAnchor="middle">☾</text>
      <text x="234" y="105" fill={T} fontSize="13" stroke="none" textAnchor="middle">☾</text>
      <path d="M118 170 h84" stroke={GD} strokeWidth="1" strokeDasharray="1 5" />
    </Scene>
  );
}

/** DNA DUSZY — kosmogram: romb w kwadracie z planetami. */
export function SceneKosmogram(p: S) {
  return (
    <Scene {...p} label="Kosmogram">
      <rect x="90" y="30" width="140" height="140" rx="4" stroke={G} strokeWidth="1.5" />
      <path d="M90 30 L230 170 M230 30 L90 170" stroke={GD} strokeWidth="1" />
      <path d="M160 30 L230 100 L160 170 L90 100 Z" stroke={G} strokeWidth="1.2" />
      <circle cx="160" cy="100" r="5" stroke={T} strokeWidth="1.3" />
      {/* planety w domach swojej mocy (digbala): ♃ w 1 (góra), ☾ w 4 (lewo), ♄ w 7 (dół), ☉ w 10 (prawo) */}
      {["♃", "☾", "♄", "☉"].map((s, i) => {
        const pos = [[160, 62], [122, 100], [160, 140], [198, 100]][i];
        return <text key={i} x={pos[0]} y={pos[1] + 4} fill={i % 2 ? T : G} fontSize="13" stroke="none" textAnchor="middle">{s}</text>;
      })}
      {/* orbity zewnętrzne */}
      <circle cx="160" cy="100" r="92" stroke={TD} strokeWidth="0.8" strokeDasharray="1 6" />
      <circle cx="48" cy="100" r="2" fill={T} stroke="none" />
      <circle cx="272" cy="100" r="2" fill={G} stroke="none" />
    </Scene>
  );
}

/** LICZBY — siatka Lo Shu z cyframi i konstelacją. */
export function SceneNumerologia(p: S) {
  return (
    <Scene {...p} label="Numerologia — Lo Shu">
      <rect x="100" y="40" width="120" height="120" rx="6" stroke={G} strokeWidth="1.5" />
      <path d="M140 40 v120 M180 40 v120 M100 80 h120 M100 120 h120" stroke={GD} strokeWidth="1" />
      {[4, 9, 2, 3, 5, 7, 8, 1, 6].map((n, i) => {
        const cx = 120 + (i % 3) * 40;
        const cy = 64 + Math.floor(i / 3) * 40;
        const main = n === 5;
        return (
          <text key={i} x={cx} y={cy + 5} fill={main ? G : TD} fontSize={main ? 17 : 12}
            fontFamily="var(--font-serif)" fontStyle="italic" stroke="none" textAnchor="middle">{n}</text>
        );
      })}
      <circle cx="160" cy="100" r="15" stroke={T} strokeWidth="1" strokeDasharray="2 4" />
      {/* konstelacja łącząca 1-5-9 */}
      <path d="M160 144 L160 100 L200 64" stroke={T} strokeWidth="1" strokeDasharray="1 5" />
      <path d="M60 100 h24 M236 100 h24" stroke={GD} strokeWidth="1" strokeDasharray="1 5" />
      <circle cx="56" cy="100" r="2.4" stroke={G} strokeWidth="1.2" />
      <circle cx="264" cy="100" r="2.4" stroke={T} strokeWidth="1.2" />
    </Scene>
  );
}

/** MIEJSCA MOCY — siatka globu, pinezka i linie planetarne. */
export function SceneMiejsca(p: S) {
  return (
    <Scene {...p} label="Miejsca mocy — mapa">
      {/* siatka globu */}
      <ellipse cx="160" cy="100" rx="118" ry="76" stroke={G} strokeWidth="1.4" />
      <ellipse cx="160" cy="100" rx="118" ry="30" stroke={GD} strokeWidth="0.9" />
      <ellipse cx="160" cy="100" rx="60" ry="76" stroke={GD} strokeWidth="0.9" />
      <path d="M42 100 h236 M160 24 v152" stroke={GD} strokeWidth="0.9" />
      {/* linie planetarne */}
      <path d="M104 26 C 116 70, 100 130, 82 172" stroke={T} strokeWidth="1.4" />
      <path d="M212 26 v148" stroke={G} strokeWidth="1.4" />
      {/* pinezka */}
      <path d="M160 62 c11 0 19 8 19 18 c0 13 -19 32 -19 32 c0 0 -19 -19 -19 -32 c0 -10 8 -18 19 -18 Z"
        stroke={G} strokeWidth="1.5" fill="rgba(230,196,138,0.1)" />
      <circle cx="160" cy="80" r="6" stroke={T} strokeWidth="1.4" />
      <ellipse cx="160" cy="120" rx="13" ry="4" stroke={TD} strokeWidth="1" />
    </Scene>
  );
}

/** ZNAKI CZASU — zegar z lustrem i spiralą. */
export function SceneGodziny(p: S) {
  return (
    <Scene {...p} label="Godziny lustrzane">
      <circle cx="112" cy="100" r="58" stroke={G} strokeWidth="1.5" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return <path key={i}
          d={`M${(112 + 52 * Math.sin(a)).toFixed(1)} ${(100 - 52 * Math.cos(a)).toFixed(1)}
             L${(112 + 58 * Math.sin(a)).toFixed(1)} ${(100 - 58 * Math.cos(a)).toFixed(1)}`}
          stroke={GD} strokeWidth={i % 3 === 0 ? 1.4 : 0.9} />;
      })}
      <path d="M112 100 V64 M112 100 h24" stroke={G} strokeWidth="1.6" />
      <circle cx="112" cy="100" r="2.6" fill={G} stroke="none" />
      {/* lustro */}
      <path d="M186 40 v120" stroke={TD} strokeWidth="1.2" strokeDasharray="4 4" />
      {/* odbicie — cieńsze, turkusowe */}
      <circle cx="248" cy="100" r="48" stroke={T} strokeWidth="1.1" opacity="0.75" />
      <path d="M248 100 V70 M248 100 h-20" stroke={T} strokeWidth="1.3" opacity="0.75" />
      <text x="248" y="176" fill={TD} fontSize="12" stroke="none" textAnchor="middle" fontVariant="tabular-nums">21:21</text>
      <text x="112" y="176" fill={GD} fontSize="12" stroke="none" textAnchor="middle">12:12</text>
    </Scene>
  );
}

/** NAKSZATRA — Księżyc pośród 27 gwiazd (pas nakszatr). */
export function SceneNakszatra(p: S) {
  return (
    <Scene {...p} label="Nakszatra — pas Księżyca">
      {/* łuk pasa nakszatr */}
      <path d="M24 140 A 176 176 0 0 1 296 140" stroke={GD} strokeWidth="1.1" />
      <path d="M40 156 A 150 150 0 0 1 280 156" stroke={TD} strokeWidth="0.9" strokeDasharray="1 6" />
      {/* gwiazdy pasa */}
      {Array.from({ length: 9 }, (_, i) => {
        const t = i / 8;
        const a = Math.PI * (1 - t);
        const x = 160 + 136 * Math.cos(a);
        const y = 140 - 76 * Math.sin(a);
        const main = i === 4;
        return main ? null : (
          <path key={i} d={`M${x.toFixed(1)} ${(y - 3).toFixed(1)} l1.6 3 3 0.6 -2.2 2.2 0.5 3.1 -2.9 -1.5 -2.9 1.5 0.5 -3.1 -2.2 -2.2 3 -0.6 Z`}
            stroke={i % 2 ? T : G} strokeWidth="1" opacity="0.8" />
        );
      })}
      {/* Księżyc w centrum pasa */}
      <circle cx="160" cy="64" r="26" stroke={G} strokeWidth="1.5" />
      <path d="M170 44 a22 22 0 1 0 6 32 a17 17 0 0 1 -6 -32" stroke={G} strokeWidth="1.3" />
      {/* pada — cztery kreski pod Księżycem */}
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${146 + i * 10} 104 v6`} stroke={i === 0 ? T : TD} strokeWidth={i === 0 ? 1.6 : 1} />
      ))}
      <path d="M120 180 h80" stroke={GD} strokeWidth="1" strokeDasharray="1 5" />
    </Scene>
  );
}

/** SYNTEZA / RAPORT — zwój z osią, pinezką i sercem-jantrą. */
export function SceneRaport(p: S) {
  return (
    <Scene {...p} label="Raport — synteza">
      <rect x="96" y="28" width="128" height="144" rx="8" stroke={G} strokeWidth="1.5" />
      <path d="M112 52 h96 M112 68 h96 M112 84 h64" stroke={GD} strokeWidth="1" />
      {/* mini oś czasu */}
      <path d="M112 108 h96" stroke={T} strokeWidth="1.2" />
      {[126, 156, 186].map((x, i) => <circle key={i} cx={x} cy="108" r={i === 1 ? 4 : 2.4} stroke={T} strokeWidth="1.2" fill={i === 1 ? "rgba(127,208,216,0.15)" : "none"} />)}
      {/* serce-jantra na dole */}
      <path d="M160 128 c0 -6 -7 -8 -11 -5 c-5 3 -5 10 -1 15 c4 5 12 11 12 17 c0 -6 8 -12 12 -17 c4 -5 4 -12 -1 -15 c-4 -3 -11 -1 -11 5 Z"
        stroke={G} strokeWidth="1.4" />
      <path d="M160 138 l3 4 -3 4 -3 -4 Z" stroke={T} strokeWidth="1.2" />
      {/* promienie wychodzące */}
      <path d="M74 100 h14 M232 100 h14 M84 62 l10 6 M236 138 l-10 -6" stroke={TD} strokeWidth="1" />
    </Scene>
  );
}

/**
 * HIROMANCJA — ten sam motyw dłoni co w SceneKarma, ale PEŁNĄ, nieprzerywaną
 * linią (tam sygnalizowała "jeszcze nie istnieje", tu już istnieje) — plus
 * kilka delikatnych krzywych wewnątrz dłoni sugerujących linie.
 */
export function SceneHiromancja(p: S) {
  return (
    <Scene {...p} label="Chiromancja — typ dłoni i linie">
      <circle cx="160" cy="100" r="70" stroke={GD} strokeWidth="0.9" strokeDasharray="1 6" />
      <path d="M126 138 v-48 M142 138 v-56 M160 138 v-60 M178 138 v-56 M194 130 v-42
        M126 138 c0 -22 15 -34 34 -34 c19 0 34 12 34 34 c0 22 -15 34 -34 34 c-19 0 -34 -12 -34 -34"
        stroke={G} strokeWidth="1.5" fill="none" />
      {/* linie dłoni — sugerowane, nie dosłowne */}
      <path d="M136 116 C 152 110, 168 112, 184 122" stroke={T} strokeWidth="1.1" />
      <path d="M134 128 C 150 124, 170 126, 188 132" stroke={TD} strokeWidth="1" />
      <path d="M148 150 C 150 136, 154 122, 160 110" stroke={TD} strokeWidth="1" />
    </Scene>
  );
}

/**
 * KARMA — trzy źródłowe systemy zbiegające się we wspólnym punkcie (iskra,
 * ten sam motyw co część wspólna w SceneRelacje). Trzeci węzeł (hiromancja)
 * narysowany przerywaną linią — świadomie, bo ten system jeszcze nie
 * istnieje w aplikacji; ikona ma o tym uczciwie mówić, nie udawać kompletu.
 */
export function SceneKarma(p: S) {
  return (
    <Scene {...p} label="Karma — numerologia, astrologia i chiromancja zbiegające się w jeden odczyt">
      <circle cx="76" cy="56" r="27" stroke={G} strokeWidth="1.4" />
      <circle cx="160" cy="38" r="27" stroke={T} strokeWidth="1.4" />
      <circle cx="244" cy="56" r="27" stroke={GD} strokeWidth="1.1" strokeDasharray="2 4" />
      <text x="76" y="62" fill={G} fontSize="17" fontFamily="var(--font-serif)" fontStyle="italic" stroke="none" textAnchor="middle">7</text>
      <text x="160" y="44" fill={T} fontSize="15" stroke="none" textAnchor="middle">☉</text>
      {/* dłoń uproszczona — cztery palce + łuk dłoni, przerywana (nieaktywny system) */}
      <path d="M232 66 v-18 M238 66 v-22 M244 66 v-24 M250 66 v-22 M244 66 c-10 0 -16 6 -16 14 c0 8 7 14 16 14 c9 0 16 -6 16 -14"
        stroke={GD} strokeWidth="1" strokeDasharray="1.5 3" />
      <path d="M84 81 C 100 120, 130 148, 158 162" stroke={GD} strokeWidth="1" />
      <path d="M160 65 V162" stroke={TD} strokeWidth="1" />
      <path d="M236 81 C 220 120, 190 148, 162 162" stroke={GD} strokeWidth="1" strokeDasharray="2 4" />
      <path d="M160 146 c6 8 10 12 10 19 a10 10 0 0 1 -20 0 c0 -7 4 -11 10 -19 Z" stroke={G} strokeWidth="1.5" fill="rgba(230,196,138,0.12)" />
      <circle cx="160" cy="166" r="3" fill={G} stroke="none" />
    </Scene>
  );
}
