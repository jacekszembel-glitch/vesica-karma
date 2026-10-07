"use client";

import type { LiniaDloni, MiejsceZnaku } from "@/lib/astro/zgodnosc";
import type { DodatekRysunku } from "./HiromancjaInwentarz";

/**
 * ILUSTRACJA DŁONI — wnętrze dłoni z wzgórkami i liniami; w przewodniku świeci to miejsce
 * albo ta linia, o którą akurat pytamy. Rysunek to PRAWA dłoń od wnętrza (mały palec po lewej,
 * kciuk po prawej) — lewą odbijamy w poziomie, podpisy zostają nieodwrócone.
 * Mars ma dwa wzgórki (górny przy krawędzi, dolny przy kciuku) — oba świecą jako „Mars”.
 * Rahu i Ketu według chiromancji indyjskiej: Rahu w środku dłoni, Ketu nad nadgarstkiem.
 */

const W = 300;

/**
 * Zarys prawej dłoni od wnętrza (viewBox 300×400) — jedna ciągła linia: krawędź dłoni od nadgarstka,
 * cztery zwężające się palce z zaokrąglonymi opuszkami i fałdami między nimi, kciuk wyrastający
 * nisko, z kłębu Wenus, i powrót do nadgarstka.
 */
const ZARYS = [
  "M 92 350",
  "C 80 330 70 306 68 280", "C 66 238 69 202 76 180", // krawędź dłoni (wzgórek Księżyca)
  "C 73 160 70 132 70 114", "C 70 99 80 92 89 93", "C 98 94 102 103 102 114", "L 103 149", // mały palec
  "C 104 154 106 154 107 149", // fałd
  "L 108 66", "C 108 51 118 44 126 44", "C 136 44 142 52 142 66", "L 143 141", // serdeczny
  "C 144 146 146 146 147 141",
  "L 148 46", "C 148 33 157 26 166 26", "C 175 26 183 33 183 46", "L 184 141", // środkowy
  "C 185 146 188 146 189 141",
  "L 192 75", "C 193 63 201 56 209 57", "C 218 58 225 66 224 78", "L 224 158", // wskazujący
  "C 225 178 229 194 236 203", // fałd między wskazującym a kciukiem
  "C 248 190 260 174 270 162", "C 278 152 292 154 294 167", "C 296 180 288 196 280 210", // kciuk
  "C 268 236 256 264 248 290", "C 242 312 234 332 224 350", // kłąb kciuka (Wenus) do nadgarstka
  "C 182 357 132 357 92 350 Z",
].join(" ");
/** Zgięcia stawów palców i kciuka. */
const STAWY = [
  "M 74 120 L 100 118", "M 73 137 L 101 135",
  "M 109 82 L 141 82", "M 109 112 L 142 112",
  "M 149 70 L 182 70", "M 149 105 L 183 105",
  "M 193 92 L 224 92", "M 192 120 L 224 120",
  "M 262 186 L 282 202",
];

/** Linie (prawa dłoń). */
const LINIE: Record<LiniaDloni, string> = {
  serca: "M 70 194 C 108 186 150 184 182 160",
  glowy: "M 222 198 C 182 208 132 224 84 258",
  zycia: "M 222 200 C 182 232 168 290 182 346",
  losu: "M 146 346 C 147 290 152 232 160 170",
  slonca: "M 134 300 C 129 252 126 212 124 176",
  merkurego: "M 152 338 C 128 284 106 230 92 184",
  intuicji: "M 100 330 C 74 296 76 234 96 200",
  podrozy: "M 70 294 L 90 291 M 73 310 L 91 308",
  relacji: "M 70 178 L 88 176 M 71 172 L 85 171",
  pas_wenus: "M 104 162 C 126 178 160 176 178 154",
  pierscien_salomona: "M 182 158 C 192 174 210 174 218 160",
  marsa: "M 210 218 C 188 246 182 288 192 334",
};
const LINIE_STALE: LiniaDloni[] = ["serca", "glowy", "zycia", "losu"];

/** Wzgórki (prawa dłoń). */
const PUNKTY: { id: MiejsceZnaku; x: number; y: number; podpis: string; podpisDy?: number }[] = [
  { id: "jupiter", x: 198, y: 170, podpis: "Jowisz", podpisDy: -15 },
  { id: "saturn", x: 161, y: 166, podpis: "Saturn", podpisDy: -15 },
  { id: "sun", x: 124, y: 168, podpis: "Słońce", podpisDy: -15 },
  { id: "mercury", x: 90, y: 176, podpis: "Merkury", podpisDy: -15 },
  { id: "mars", x: 84, y: 232, podpis: "Mars" },
  { id: "mars", x: 206, y: 222, podpis: "Mars" },
  { id: "czworobok", x: 146, y: 208, podpis: "czworobok" },
  { id: "rahu", x: 140, y: 262, podpis: "Rahu" },
  { id: "moon", x: 94, y: 298, podpis: "Księżyc" },
  { id: "venus", x: 200, y: 294, podpis: "Wenus" },
  { id: "ketu", x: 142, y: 322, podpis: "Ketu" },
];

/** Rozwidlenie końca linii życia — odnoga w stronę wzgórka Księżyca. */
const ROZWIDLENIE_ZYCIA = "M 175 314 C 166 326 158 336 150 346";
/** Rozwidlenie końca linii głowy („pióro pisarza”) — odnoga w dół. */
const ROZWIDLENIE_GLOWY = "M 114 238 C 104 250 96 262 90 280";
/** Możliwe końce linii serca: pod Saturnem, między palcami, pod Jowiszem, przy krawędzi dłoni. */
const KONCE_SERCA: { x: number; y: number; podpis: string; dy: number }[] = [
  { x: 160, y: 180, podpis: "Saturn", dy: 17 }, { x: 182, y: 160, podpis: "między", dy: -9 },
  { x: 204, y: 174, podpis: "Jowisz", dy: 17 }, { x: 224, y: 184, podpis: "krawędź", dy: -10 },
];
const SERCE_DALEJ = "M 182 160 C 196 168 212 174 224 184";
/** Możliwe końce linii losu: na linii głowy, między głową a sercem, na linii serca, pod Saturnem; odnoga do Jowisza. */
const KONCE_LOSU: { y: number; x: number; podpis: string }[] = [
  { x: 152, y: 221, podpis: "na linii głowy" }, { x: 155, y: 198, podpis: "między" },
  { x: 158, y: 175, podpis: "na linii serca" }, { x: 162, y: 150, podpis: "pod środkowym" },
];
const LOS_JOWISZ = "M 156 198 C 166 186 182 178 198 172";
/** Możliwe początki linii Słońca (koniec zawsze pod palcem serdecznym). */
const STARTY_SLONCA: { x: number; y: number; podpis: string }[] = [
  { x: 125, y: 182, podpis: "tylko na wzgórku" }, { x: 128, y: 232, podpis: "od linii głowy" },
  { x: 134, y: 290, podpis: "od środka" }, { x: 138, y: 342, podpis: "od dołu" },
];
const SLONCE_DOL = "M 134 300 C 135 314 136 328 138 342";
/** Rozwidlenia krótkiej linii Słońca na wzgórku: górne (pod palcem) i dolne (nad linią serca). */
const SLONCE_NA_WZGORKU = "M 125 178 L 124 168";
const SLONCE_WIDELEC_GORA = "M 124 168 L 117 153 M 124 168 L 131 153";
const SLONCE_WIDELEC_DOL = "M 125 178 L 118 187 M 125 178 L 132 187";
const SLONCE_KSIEZYC = "M 100 300 C 112 294 124 292 133 290";
/** Przedłużenie linii losu aż pod palec środkowy (wzgórek Saturna). */
const LOS_SATURN = "M 160 170 C 161 162 162 156 162 150";
/** Warianty przebiegu końca linii głowy: prosta i mocno opadająca. */
const GLOWA_PROSTA = "M 150 214 C 120 220 96 224 74 226";
const GLOWA_OPADA = "M 150 218 C 126 236 108 262 98 300";

export default function IlustracjaDloni({ lewa = false, zaznaczone = [], aktywne = null, linia = null, dodatek = null, onWybierz, szerokosc = 300 }: {
  /** Lewa dłoń — rysunek w lustrzanym odbiciu. */
  lewa?: boolean;
  /** Miejsca ze znakami — złote kropki. */
  zaznaczone?: MiejsceZnaku[];
  /** Miejsce, o które pytamy — świeci. */
  aktywne?: MiejsceZnaku | null;
  /** Linia, o którą pytamy — świeci. */
  linia?: LiniaDloni | null;
  /** Szczegół linii, o który pytamy (rozwidlenie, długość). */
  dodatek?: DodatekRysunku | null;
  /** Kliknięcie w miejsce na rysunku. */
  onWybierz?: (m: MiejsceZnaku) => void;
  szerokosc?: number;
}) {
  const x = (v: number) => (lewa ? W - v : v);
  const lustro = lewa ? `translate(${W} 0) scale(-1 1)` : undefined;
  return (
    <svg viewBox="20 14 280 348" width={szerokosc} className="ilu-dlon" role="img"
      aria-label={`${lewa ? "Lewa" : "Prawa"} dłoń od wewnątrz — wzgórki i linie`}>
      <defs>
        <filter id="ilu-blask" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>
      <g transform={lustro}>
        <path d={ZARYS} className="ilu-zarys" />
        <g className="ilu-staw">{STAWY.map((d) => <path key={d} d={d} />)}</g>
        {LINIE_STALE.filter((l) => l !== linia).map((l) => <path key={l} d={LINIE[l]} className="ilu-linia" />)}
        {linia && (
          <>
            {/* przy rozwidleniach linii Słońca świeci tylko jej odcinek na wzgórku */}
            <path d={dodatek === "rozwidlenie_slonca" ? SLONCE_NA_WZGORKU : LINIE[linia]} className="ilu-linia-blask" filter="url(#ilu-blask)" />
            <path d={dodatek === "rozwidlenie_slonca" ? SLONCE_NA_WZGORKU : LINIE[linia]} className="ilu-linia-akt" />
          </>
        )}
        {dodatek === "rozwidlenie_zycia" && (
          <>
            <path d={ROZWIDLENIE_ZYCIA} className="ilu-linia-blask" filter="url(#ilu-blask)" />
            <path d={ROZWIDLENIE_ZYCIA} className="ilu-linia-akt" />
            <circle cx={175} cy={314} r={16} className="ilu-obwodka" />
          </>
        )}
        {dodatek === "rozwidlenie_glowy" && (
          <>
            <path d={ROZWIDLENIE_GLOWY} className="ilu-linia-blask" filter="url(#ilu-blask)" />
            <path d={ROZWIDLENIE_GLOWY} className="ilu-linia-akt" />
            <circle cx={114} cy={240} r={16} className="ilu-obwodka" />
          </>
        )}
        {dodatek === "rozwidlenie_slonca" && (
          <>
            <path d={LINIE.serca} className="ilu-linia-kontekst" />
            <path d={SLONCE_WIDELEC_GORA} className="ilu-linia-blask" filter="url(#ilu-blask)" />
            <path d={SLONCE_WIDELEC_GORA} className="ilu-linia-akt ilu-widelec" />
            <path d={SLONCE_WIDELEC_DOL} className="ilu-linia-blask" filter="url(#ilu-blask)" />
            <path d={SLONCE_WIDELEC_DOL} className="ilu-linia-akt ilu-widelec" />
          </>
        )}
        {dodatek === "start_slonca" && (
          <>
            <path d={LINIE.glowy} className="ilu-linia-kontekst" />
            <path d={LINIE.serca} className="ilu-linia-kontekst" />
            <path d={SLONCE_DOL} className="ilu-wariant" />
            <path d={SLONCE_KSIEZYC} className="ilu-wariant" />
            {STARTY_SLONCA.map((k) => <circle key={k.podpis} cx={k.x} cy={k.y} r={4} className="ilu-koniec" />)}
            <circle cx={100} cy={300} r={4} className="ilu-koniec" />
          </>
        )}
        {dodatek === "koniec_losu" && (
          <>
            <path d={LINIE.glowy} className="ilu-linia-kontekst" />
            <path d={LINIE.serca} className="ilu-linia-kontekst" />
            <path d={LOS_JOWISZ} className="ilu-wariant" />
            <path d={LOS_SATURN} className="ilu-wariant" />
            {KONCE_LOSU.map((k) => <circle key={k.podpis} cx={k.x} cy={k.y} r={4} className="ilu-koniec" />)}
            <circle cx={198} cy={172} r={4} className="ilu-koniec" />
          </>
        )}
        {dodatek === "koniec_serca" && (
          <>
            <path d={SERCE_DALEJ} className="ilu-wariant" />
            {KONCE_SERCA.map((k) => <circle key={k.podpis} cx={k.x} cy={k.y} r={4} className="ilu-koniec" />)}
          </>
        )}
        {dodatek === "opadanie_glowy" && (
          <>
            <path d={GLOWA_PROSTA} className="ilu-wariant" />
            <path d={GLOWA_OPADA} className="ilu-wariant" />
          </>
        )}
        {dodatek === "dlugosc_zycia" && (
          <>
            <line x1={160} y1={276} x2={192} y2={276} className="ilu-miara" />
            <line x1={166} y1={346} x2={198} y2={346} className="ilu-miara" />
          </>
        )}
      </g>
      {dodatek === "rozwidlenie_slonca" && (
        <>
          <text x={x(140)} y={156} textAnchor={lewa ? "end" : "start"} className="ilu-podpis ilu-podpis-miara">u góry</text>
          <text x={x(140)} y={190} textAnchor={lewa ? "end" : "start"} className="ilu-podpis ilu-podpis-miara">u dołu</text>
        </>
      )}
      {dodatek === "start_slonca" && (
        <>
          {STARTY_SLONCA.map((k) => (
            <text key={k.podpis} x={x(k.x + 9)} y={k.y + 4} textAnchor={lewa ? "end" : "start"} className="ilu-podpis ilu-podpis-miara">{k.podpis}</text>
          ))}
          <text x={x(96)} y={318} textAnchor="middle" className="ilu-podpis ilu-podpis-miara">od Księżyca</text>
        </>
      )}
      {dodatek === "koniec_losu" && (
        <>
          {KONCE_LOSU.map((k) => (
            <text key={k.podpis} x={x(k.x - 9)} y={k.y + 4} textAnchor={lewa ? "start" : "end"} className="ilu-podpis ilu-podpis-miara">{k.podpis}</text>
          ))}
          <text x={x(206)} y={168} textAnchor={lewa ? "end" : "start"} className="ilu-podpis ilu-podpis-miara">do Jowisza</text>
        </>
      )}
      {dodatek === "koniec_serca" && KONCE_SERCA.map((k) => (
        <text key={k.podpis} x={x(k.x + (k.podpis === "krawędź" ? 10 : 0))} y={k.y + k.dy} textAnchor="middle" className="ilu-podpis ilu-podpis-miara">{k.podpis}</text>
      ))}
      {dodatek === "opadanie_glowy" && (
        <>
          <text x={x(72)} y={214} textAnchor="middle" className="ilu-podpis ilu-podpis-miara">prosta</text>
          <text x={x(64)} y={270} textAnchor="middle" className="ilu-podpis ilu-podpis-miara">lekko</text>
          <text x={x(64)} y={300} textAnchor="middle" className="ilu-podpis ilu-podpis-miara">mocno</text>
        </>
      )}
      {dodatek === "dlugosc_zycia" && (
        <>
          <text x={x(196)} y={280} textAnchor={lewa ? "end" : "start"} className="ilu-podpis ilu-podpis-miara">krótka</text>
          <text x={x(202)} y={350} textAnchor={lewa ? "end" : "start"} className="ilu-podpis ilu-podpis-miara">długa</text>
        </>
      )}
      {PUNKTY.map((p, i) => {
        const jest = zaznaczone.includes(p.id);
        const akt = aktywne === p.id;
        return (
          <g key={i} className={`ilu-punkt${jest ? " ilu-jest" : ""}${akt ? " ilu-aktywny" : ""}${linia && !akt ? " ilu-wygaszony" : ""}`}
            style={{ cursor: onWybierz ? "pointer" : "default" }}
            onClick={onWybierz ? () => onWybierz(p.id) : undefined}>
            {akt && <circle cx={x(p.x)} cy={p.y} r={20} className="ilu-poswiata" filter="url(#ilu-blask)" />}
            <circle cx={x(p.x)} cy={p.y} r={akt ? 14 : 9} className="ilu-kolo" />
            {jest && <circle cx={x(p.x)} cy={p.y} r={4} className="ilu-kropka" />}
            {!(linia && !akt) && <text x={x(p.x)} y={p.y + (p.podpisDy !== undefined ? p.podpisDy - (akt ? 6 : 0) : akt ? 28 : 21)} textAnchor="middle" className="ilu-podpis">{p.podpis}</text>}
          </g>
        );
      })}
    </svg>
  );
}
