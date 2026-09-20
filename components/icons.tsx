/**
 * System ikon liniowych 9 DOM — zasady z brandbooka:
 * geometria i prostota, jednolita grubość linii (1.6), zaokrąglone zakończenia.
 * Kolor przez currentColor — dziedziczy z kontekstu (złoto na granacie, granat na jasnym).
 */

type P = { size?: number; className?: string };

function Base({ size = 48, className, children }: P & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      {children}
    </svg>
  );
}

/** Mapa Życia — pionowa oś czasu z punktami. */
export function IconMapaZycia(p: P) {
  return (
    <Base {...p}>
      <path d="M24 6 v36" />
      <circle cx="24" cy="12" r="3" />
      <circle cx="24" cy="24" r="4.5" />
      <circle cx="24" cy="37" r="3" />
      <path d="M27 12 h8 M27.5 24 h9 M27 37 h8" opacity="0.6" />
      <path d="M24 24 l-1.6 -1.6 M24 24 l1.6 1.6" />
    </Base>
  );
}

/** Ścieżka / dharma — góra z gwiazdą (ilustracja „DHARMA" z brandbooka). */
export function IconSciezka(p: P) {
  return (
    <Base {...p}>
      <path d="M8 40 L22 16 L28 26 L34 18 L44 40" />
      <path d="M8 40 h36" opacity="0.6" />
      <path d="M22 10 l1.2 2.6 2.8 0.4 -2 2 0.5 2.8 -2.5 -1.3 -2.5 1.3 0.5 -2.8 -2 -2 2.8 -0.4 Z" />
      <path d="M14 34 l4 -6 M32 30 l4 6" opacity="0.4" />
    </Base>
  );
}

/** Kompas dnia. */
export function IconDzis(p: P) {
  return (
    <Base {...p}>
      <circle cx="24" cy="24" r="17" />
      <circle cx="24" cy="24" r="12.5" opacity="0.4" strokeDasharray="2 4" />
      <path d="M24 7 v4 M24 37 v4 M7 24 h4 M37 24 h4" />
      <path d="M29 19 l-3.4 8.5 -5.6 1.5 3.4 -8.5 Z" />
      <circle cx="24" cy="24" r="1.4" fill="currentColor" stroke="none" />
    </Base>
  );
}

/** Kosmogram / dna duszy — koncentryczne kręgi z diamentem. */
export function IconKosmogram(p: P) {
  return (
    <Base {...p}>
      <circle cx="24" cy="24" r="17" />
      <circle cx="24" cy="24" r="11" opacity="0.5" />
      <path d="M24 13 l7.8 11 -7.8 11 -7.8 -11 Z" />
      <circle cx="24" cy="24" r="2" />
      <path d="M24 7 v3 M24 38 v3 M7 24 h3 M38 24 h3" opacity="0.6" />
    </Base>
  );
}

/** Relacje — dwa przecinające się okręgi z iskrą. */
export function IconRelacje(p: P) {
  return (
    <Base {...p}>
      <circle cx="18" cy="24" r="11" />
      <circle cx="30" cy="24" r="11" />
      <path d="M24 19.5 l1.4 3.1 3.1 1.4 -3.1 1.4 -1.4 3.1 -1.4 -3.1 -3.1 -1.4 3.1 -1.4 Z" />
    </Base>
  );
}

/** Styl południowoindyjski — stała siatka 4×4 (kontrast z diamentem północnoindyjskim). */
export function IconStylPoludniowy(p: P) {
  return (
    <Base {...p}>
      <rect x="9" y="9" width="30" height="30" rx="4" />
      <path d="M19 9 v10 M29 9 v10 M19 29 v10 M29 29 v10 M9 19 h10 M29 19 h10 M9 29 h10 M29 29 h10" opacity="0.55" />
    </Base>
  );
}

/** Numerologia — siatka Lo Shu 3×3. */
export function IconNumerologia(p: P) {
  return (
    <Base {...p}>
      <rect x="9" y="9" width="30" height="30" rx="3" />
      <path d="M19 9 v30 M29 9 v30 M9 19 h30 M9 29 h30" opacity="0.5" />
      <circle cx="24" cy="24" r="2.6" />
      <circle cx="14" cy="14" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="34" cy="34" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="34" cy="14" r="1.3" fill="currentColor" stroke="none" opacity="0.5" />
      <circle cx="14" cy="34" r="1.3" fill="currentColor" stroke="none" opacity="0.5" />
    </Base>
  );
}

/** Miejsca mocy — pinezka z kręgami (ilustracja „MIEJSCA MOCY"). */
export function IconMiejsca(p: P) {
  return (
    <Base {...p}>
      <path d="M24 8 c6.5 0 11.5 5 11.5 11.2 C 35.5 27 24 40 24 40 C 24 40 12.5 27 12.5 19.2 C 12.5 13 17.5 8 24 8 Z" />
      <circle cx="24" cy="19" r="4" />
      <path d="M10 42 c4 -2.5 9 -4 14 -4 s10 1.5 14 4" opacity="0.5" />
    </Base>
  );
}

/** Czas / dasze — spirala. */
export function IconCzas(p: P) {
  return (
    <Base {...p}>
      <path d="M24 24
               m0 -1.5 a1.5 1.5 0 1 1 -1.5 1.5
               a3.5 3.5 0 1 0 3.5 -3.5
               a6.5 6.5 0 1 0 6.5 6.5
               a10 10 0 1 0 -10 10
               a14 14 0 1 0 -14 -14" />
      <circle cx="24" cy="24" r="1" fill="currentColor" stroke="none" />
    </Base>
  );
}

/** Godzina lustrzana — zegar z odbiciem. */
export function IconGodziny(p: P) {
  return (
    <Base {...p}>
      <circle cx="24" cy="24" r="16" />
      <path d="M24 8 v3 M24 37 v3 M8 24 h3 M37 24 h3" opacity="0.5" />
      <path d="M18 18 v9 h6" />
      <path d="M30 18 v9 h-6" opacity="0.45" />
    </Base>
  );
}

/** Raport / synteza — dokument z gwiazdą. */
export function IconRaport(p: P) {
  return (
    <Base {...p}>
      <rect x="12" y="7" width="24" height="34" rx="3" />
      <path d="M17 15 h14 M17 21 h14 M17 27 h8" opacity="0.5" />
      <path d="M29 30 l1.3 2.8 2.8 1.3 -2.8 1.3 -1.3 2.8 -1.3 -2.8 -2.8 -1.3 2.8 -1.3 Z" />
    </Base>
  );
}

/* ═══ ikony szybkich pytań (panel) — ta sama zasada linii ═══ */

/** Interesy i umowy — uścisk dłoni jako dwa splecione łuki nad pieczęcią. */
export function IconUmowa(p: P) {
  return (
    <Base {...p}>
      <path d="M8 20 l8 -5 8 5" />
      <path d="M40 20 l-8 -5 -8 5" />
      <path d="M16 20 c4 5 6 7 8 7 s4 -2 8 -7" />
      <circle cx="24" cy="34" r="6" />
      <path d="M24 31 v6 M21.5 34 h5" opacity="0.6" />
    </Base>
  );
}

/** Pieniądze — moneta z osią wartości. */
export function IconPieniadze(p: P) {
  return (
    <Base {...p}>
      <circle cx="24" cy="24" r="15" />
      <circle cx="24" cy="24" r="10.5" opacity="0.4" strokeDasharray="2 4" />
      <path d="M24 14 v20" />
      <path d="M20 19 h6.5 a3.5 3.5 0 0 1 0 7 h-5 a3.5 3.5 0 0 0 0 7 H28" />
    </Base>
  );
}

/** Start projektu — strzała wzlotu z iskrą. */
export function IconStart(p: P) {
  return (
    <Base {...p}>
      <path d="M10 38 C 16 24, 26 14, 40 10 C 36 24, 26 34, 12 40 Z" />
      <circle cx="27" cy="21" r="3.4" />
      <path d="M14 34 l-4 6 6 -4" opacity="0.6" />
      <path d="M38 30 l1.2 2.6 2.6 1.2 -2.6 1.2 -1.2 2.6 -1.2 -2.6 -2.6 -1.2 2.6 -1.2 Z" opacity="0.7" />
    </Base>
  );
}

/** Trudna rozmowa — dwie wagi w równowadze. */
export function IconWaga(p: P) {
  return (
    <Base {...p}>
      <path d="M24 9 v30 M16 39 h16" />
      <path d="M10 17 h28" />
      <circle cx="24" cy="13.5" r="2.4" />
      <path d="M10 17 l-5 9 a5.5 5.5 0 0 0 10 0 Z" />
      <path d="M38 17 l-5 9 a5.5 5.5 0 0 0 10 0 Z" />
    </Base>
  );
}

/** Podróż — kompasowa strzała nad łukiem drogi. */
export function IconPodroz(p: P) {
  return (
    <Base {...p}>
      <circle cx="24" cy="21" r="13" />
      <path d="M30 15 l-4.4 10.4 -7.6 2 4.4 -10.4 Z" />
      <circle cx="24" cy="21" r="1.4" fill="currentColor" stroke="none" />
      <path d="M8 40 c6 -3 26 -3 32 0" opacity="0.55" strokeDasharray="3 4" />
    </Base>
  );
}

/** Zdrowie — liść w kręgu regeneracji. */
export function IconZdrowie(p: P) {
  return (
    <Base {...p}>
      <circle cx="24" cy="24" r="15" strokeDasharray="2 5" opacity="0.45" />
      <path d="M24 35 C 14 30, 14 17, 24 12 C 34 17, 34 30, 24 35 Z" />
      <path d="M24 12 v23" opacity="0.6" />
      <path d="M24 22 l-5 -3 M24 27 l5 -3" opacity="0.5" />
    </Base>
  );
}

/** Nauka — otwarta księga z gwiazdą wiedzy. */
export function IconNauka(p: P) {
  return (
    <Base {...p}>
      <path d="M24 16 C 20 12, 13 11, 8 12 v22 c5 -1 12 0 16 4 4 -4 11 -5 16 -4 V12 c-5 -1 -12 0 -16 4 Z" />
      <path d="M24 16 v26" opacity="0.6" />
      <path d="M24 6 l1.3 2.9 2.9 1.3 -2.9 1.3 -1.3 2.9 -1.3 -2.9 -2.9 -1.3 2.9 -1.3 Z" opacity="0.8" />
    </Base>
  );
}

/** Duży zakup — dom z fundamentem. */
export function IconDom(p: P) {
  return (
    <Base {...p}>
      <path d="M8 23 L24 10 L40 23" />
      <path d="M12 21 v18 h24 V21" />
      <path d="M20 39 v-9 h8 v9" />
      <path d="M7 43 h34" opacity="0.5" />
    </Base>
  );
}

/** Odpoczynek — sierp Księżyca z gwiazdą. */
export function IconOdpoczynek(p: P) {
  return (
    <Base {...p}>
      <path d="M30 10 a16 16 0 1 0 8 26 a13 13 0 0 1 -8 -26 Z" />
      <path d="M35 12 l1.1 2.5 2.5 1.1 -2.5 1.1 -1.1 2.5 -1.1 -2.5 -2.5 -1.1 2.5 -1.1 Z" opacity="0.8" />
    </Base>
  );
}

/** Mój panel — pierścień kokpitu z iskrą wyniku. */
export function IconPanel(p: P) {
  return (
    <Base {...p}>
      <circle cx="24" cy="24" r="15" />
      <path d="M24 9 v4 M39 24 h-4 M24 39 v-4 M9 24 h4" opacity="0.6" />
      <path d="M24 24 l6 -8" />
      <circle cx="24" cy="24" r="2.2" fill="currentColor" stroke="none" />
      <path d="M17 31 a9.5 9.5 0 0 1 0 -14" opacity="0.5" />
    </Base>
  );
}

/** Dla par — dwa przecinające się okręgi (jak kafel RELACJE z brandbooka). */
export function IconPara(p: P) {
  return (
    <Base {...p}>
      <circle cx="18.5" cy="24" r="10.5" />
      <circle cx="29.5" cy="24" r="10.5" />
      <path d="M24 19.5 a10.5 10.5 0 0 1 0 9" opacity="0.6" />
      <circle cx="24" cy="24" r="1.6" fill="currentColor" stroke="none" />
    </Base>
  );
}

/** Rodzina — trzy okręgi różnej wielkości w jednym klastrze (dwoje dorosłych + dziecko). */
export function IconRodzina(p: P) {
  return (
    <Base {...p}>
      <circle cx="16.5" cy="21" r="8" />
      <circle cx="31.5" cy="21" r="8" />
      <circle cx="24" cy="34" r="5.5" opacity="0.7" />
      <circle cx="16.5" cy="21" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="31.5" cy="21" r="1.4" fill="currentColor" stroke="none" />
    </Base>
  );
}

/** Kto — sylwetka osoby (dane identyfikujące). */
export function IconOsoba(p: P) {
  return (
    <Base {...p}>
      <circle cx="24" cy="16" r="7" />
      <path d="M10 41 c0 -8.5 6.3 -14 14 -14 s14 5.5 14 14" />
    </Base>
  );
}

/** Mapy — glob z południkiem, równoleżnikiem i punktem miejsca. */
export function IconMapy(p: P) {
  return (
    <Base {...p}>
      <circle cx="24" cy="24" r="15" />
      <path d="M9 24 h30" opacity="0.6" />
      <path d="M24 9 c6 4.5 6 25.5 0 30 M24 9 c-6 4.5 -6 25.5 0 30" opacity="0.6" />
      <circle cx="30" cy="17" r="2.4" />
      <path d="M30 19.4 v4" />
    </Base>
  );
}

/* ═══ ikony rodzajów raportu numerologicznego (kafle /numerologia) ═══
   Wspólna sygnatura: zaokrąglony kwadrat — „komórka cyfry", nawiązanie
   do siatki Lo Shu, materiał WŁASNY numerologii (nie koło, które w reszcie
   serwisu należy do astrologii/orbit). Wewnątrz — promień światła zamiast
   oklepanej gwiazdki, cytujący zasadę marki „światło jako przewodnik". */

const KOMORKA = <rect x="11" y="11" width="26" height="26" rx="8" />;

/** Portret ogólny — pojedyncza iskra/gwiazdka w centrum (rdzeń liczb), z małym satelitą dla równowagi. */
export function IconRaportPortret(p: P) {
  return (
    <Base {...p}>
      {KOMORKA}
      <path d="M24 14.5 l2.9 6.4 6.4 2.9 -6.4 2.9 -2.9 6.4 -2.9 -6.4 -6.4 -2.9 6.4 -2.9 Z" />
      <circle cx="32.5" cy="15" r="1.3" fill="currentColor" stroke="none" opacity="0.5" />
    </Base>
  );
}

/** Dla dziecka — kiełek: łodyżka i dwa listki różnej wielkości nad prostą linią gruntu (bez łuku, żeby nie czytać się jako uśmiech). */
export function IconRaportDziecko(p: P) {
  return (
    <Base {...p}>
      {KOMORKA}
      <path d="M24 32.5 v-9.5" />
      <path d="M24 26 C 18.5 26 15.8 21.6 15.8 17.3 C 21 17.3 24 21 24 26 Z" />
      <path d="M24 23 C 29.7 23 32.2 19 32.2 15 C 27.4 15 24 18.4 24 23 Z" opacity="0.6" />
      <path d="M18.5 32.5 h11" opacity="0.4" />
    </Base>
  );
}

/** Finanse — trzy komórki cyfr rosnące jak słupki (bez monety/strzałki). */
export function IconRaportFinanse(p: P) {
  return (
    <Base {...p}>
      {KOMORKA}
      <rect x="15" y="26.5" width="5" height="6.5" rx="1.3" />
      <rect x="21.5" y="21" width="5" height="12" rx="1.3" opacity="0.85" />
      <rect x="28" y="15" width="5" height="18" rx="1.3" />
    </Base>
  );
}

/** Prognoza roczna — minikalendarz ze spiralą i trzema zaznaczonymi datami. */
export function IconRaportRok(p: P) {
  return (
    <Base {...p}>
      {KOMORKA}
      <rect x="17" y="18" width="14" height="12" rx="1.6" />
      <path d="M17 22.2 h14" />
      <path d="M20.6 15.5 v4.3 M27.4 15.5 v4.3" />
      <circle cx="20.8" cy="26" r="1" fill="currentColor" stroke="none" />
      <circle cx="24" cy="26" r="1" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="27.2" cy="26" r="1" fill="currentColor" stroke="none" opacity="0.6" />
    </Base>
  );
}

/** Horoskop roku — słońce wschodzące nad osią czasu. */
export function IconRok(p: P) {
  return (
    <Base {...p}>
      <path d="M8 32 h32" />
      <path d="M14 32 a10 10 0 0 1 20 0" />
      <path d="M24 14 v-4 M13 18 l-2.8 -2.8 M35 18 l2.8 -2.8" opacity="0.7" />
      <circle cx="17" cy="37" r="1.4" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="24" cy="37" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="31" cy="37" r="1.4" fill="currentColor" stroke="none" opacity="0.7" />
    </Base>
  );
}
