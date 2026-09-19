/** Pomocnicze funkcje kątowe i czasowe. Wszystko w stopniach, o ile nie napisano inaczej. */

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

/** Normalizuje kąt do przedziału [0, 360). */
export function norm360(deg: number): number {
  const x = deg % 360;
  return x < 0 ? x + 360 : x;
}

/** Normalizuje różnicę kątów do przedziału (-180, 180]. */
export function diffAngle(a: number, b: number): number {
  let d = norm360(a - b);
  if (d > 180) d -= 360;
  return d;
}

export const sin = (d: number) => Math.sin(d * DEG);
export const cos = (d: number) => Math.cos(d * DEG);
export const tan = (d: number) => Math.tan(d * DEG);
export const atan2d = (y: number, x: number) => Math.atan2(y, x) * RAD;

/** Julian Day dla podanej daty UTC. */
export function julianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/** Wieki juliańskie od J2000.0 (JD 2451545.0). */
export function julianCenturies(date: Date): number {
  return (julianDay(date) - 2451545.0) / 36525;
}

/**
 * Średnie nachylenie ekliptyki (IAU 1980 / Laskar) w stopniach.
 * Dokładność lepsza niż 0,01" w zakresie ±1000 lat od J2000.
 */
export function obliquity(date: Date): number {
  const T = julianCenturies(date);
  const seconds =
    84381.448 - 46.815 * T - 0.00059 * T * T + 0.001813 * T * T * T;
  return seconds / 3600;
}

/** Rozbija długość ekliptyczną na stopnie/minuty/sekundy w obrębie znaku. */
export function toDMS(deg: number): { d: number; m: number; s: number } {
  const a = Math.abs(deg);
  const d = Math.floor(a);
  const mFloat = (a - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  if (s === 60) return { d, m: m + 1, s: 0 };
  return { d, m, s };
}

/** Formatuje długość w obrębie znaku jako 12°34'56". */
export function formatDMS(degInSign: number): string {
  const { d, m, s } = toDMS(degInSign);
  return `${d}°${String(m).padStart(2, "0")}'${String(s).padStart(2, "0")}"`;
}
