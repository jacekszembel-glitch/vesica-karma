/**
 * USTAWIENIA WYLICZEŃ — wybór ayanamsy i rodzaju węzła Księżyca.
 *
 * Domyślnie Lahiri + węzeł średni (standard urzędowy w Indiach i najczęstszy
 * w oprogramowaniu). Wybór zapisuje się w przeglądarce i obowiązuje w całym
 * serwisie — kosmogram, panczanga, dopasowanie itd. liczą się tym samym.
 * Po stronie serwera (i w testach) zawsze obowiązują wartości domyślne.
 */

export type SystemAyanamsy = "lahiri" | "raman" | "kp";
export type RodzajWezla = "sredni" | "prawdziwy";

export interface UstawieniaWyliczen {
  ayanamsa: SystemAyanamsy;
  wezel: RodzajWezla;
}

export const DOMYSLNE: UstawieniaWyliczen = { ayanamsa: "lahiri", wezel: "sredni" };

const KLUCZ = "9dom_ustawienia_wyliczen";

let biezace: UstawieniaWyliczen | null = null;
const sluchacze = new Set<() => void>();

function wczytaj(): UstawieniaWyliczen {
  if (typeof window === "undefined") return DOMYSLNE;
  try {
    const raw = localStorage.getItem(KLUCZ);
    if (!raw) return DOMYSLNE;
    const u = JSON.parse(raw) as Partial<UstawieniaWyliczen>;
    return {
      ayanamsa: u.ayanamsa === "raman" || u.ayanamsa === "kp" ? u.ayanamsa : "lahiri",
      wezel: u.wezel === "prawdziwy" ? "prawdziwy" : "sredni",
    };
  } catch {
    return DOMYSLNE;
  }
}

export function ustawienia(): UstawieniaWyliczen {
  if (typeof window === "undefined") return biezace ?? DOMYSLNE;
  if (!biezace) biezace = wczytaj();
  return biezace;
}

export function zmienUstawienia(zmiana: Partial<UstawieniaWyliczen>) {
  biezace = { ...ustawienia(), ...zmiana };
  if (typeof window !== "undefined") {
    try { localStorage.setItem(KLUCZ, JSON.stringify(biezace)); } catch { /* tryb prywatny */ }
  }
  sluchacze.forEach((f) => f());
}

/** Tylko do testów: ustawia wartości bez dotykania przeglądarki. */
export function ustawDoTestow(u: UstawieniaWyliczen | null) {
  biezace = u;
}

export function subskrybujUstawienia(f: () => void): () => void {
  sluchacze.add(f);
  return () => { sluchacze.delete(f); };
}
