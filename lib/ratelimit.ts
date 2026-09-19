/**
 * Prosty licznik zapytań chroniący płatny endpoint AI przed nadużyciem.
 *
 * Trzyma stan w pamięci instancji — na Vercelu oznacza to, że przy wielu
 * równoległych instancjach limit bywa hojniejszy niż nominalny. To świadomy
 * kompromis: zatrzymuje pętlę „ktoś wali w endpoint z konsoli”, nie wymaga
 * migracji ani zewnętrznej usługi. Twardy limit rozliczeniowy ustawiamy
 * dodatkowo po stronie Anthropic (spend limit na kluczu).
 */

type Bucket = { count: number; resetAt: number };

const perIp = new Map<string, Bucket>();
const global: Bucket = { count: 0, resetAt: 0 };

/** Ile interpretacji na jeden adres IP w oknie. */
const IP_LIMIT = 8;
const IP_WINDOW_MS = 10 * 60 * 1000;

/** Bezpiecznik globalny — sufit dla całego serwisu na dobę. */
const GLOBAL_LIMIT = 400;
const GLOBAL_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Sprzątanie wygasłych wpisów, żeby mapa nie rosła w nieskończoność. */
function sweep(now: number) {
  if (perIp.size < 500) return;
  for (const [k, b] of perIp) if (b.resetAt <= now) perIp.delete(k);
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "nieznany";
}

export type RateVerdict = { ok: true } | { ok: false; retryAfter: number; scope: "ip" | "global" };

export function checkRate(ip: string, now = Date.now()): RateVerdict {
  sweep(now);

  if (global.resetAt <= now) { global.count = 0; global.resetAt = now + GLOBAL_WINDOW_MS; }
  if (global.count >= GLOBAL_LIMIT) {
    return { ok: false, retryAfter: Math.ceil((global.resetAt - now) / 1000), scope: "global" };
  }

  const b = perIp.get(ip);
  if (!b || b.resetAt <= now) {
    perIp.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
    global.count++;
    return { ok: true };
  }
  if (b.count >= IP_LIMIT) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000), scope: "ip" };
  }

  b.count++;
  global.count++;
  return { ok: true };
}
