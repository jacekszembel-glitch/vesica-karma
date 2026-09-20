/**
 * Limity tekstów, które trafiają do wyników wyszukiwania.
 *
 * Google ucina tytuł ok. 60 znaków, opis ok. 155. To nie jest twardy
 * limit techniczny — liczy się szerokość w pikselach — ale przekroczenie
 * oznacza wielokropek zamiast końcówki zdania.
 *
 * Uwaga na szablon w `app/layout.tsx`: `template: "%s | 9 Dom"` dokleja
 * 8 znaków do KAŻDEGO tytułu podstrony. Tytuł liczony bez tego sufiksu
 * to tytuł, którego nikt nigdy nie zobaczy.
 */

export const TYTUL_MAX = 60;
export const OPIS_MAX = 155;
export const SUFIKS_TYTULU = " | 9 Dom";

/** Ile znaków zostaje na tytuł podstrony po doklejeniu szablonu. */
export const TYTUL_MAX_PODSTRONY = TYTUL_MAX - SUFIKS_TYTULU.length;

/**
 * Skraca opis do limitu, ucinając na granicy słowa i dokładając wielokropek.
 *
 * Powód: opisy składane ze zmiennej treści (sedno nakszatry, przekaz liczby)
 * były cięte przez `slice(0, 140)` w środku wyrazu — w wynikach Google
 * kończyły się urwanym „Je" albo „inac". Ucięcie na spacji kosztuje kilka
 * znaków i wygląda jak zdanie, a nie jak awaria.
 */
export function skrocOpis(tekst: string, limit = OPIS_MAX): string {
  const czysty = tekst.replace(/\s+/g, " ").trim();
  if (czysty.length <= limit) return czysty;

  // −1 na wielokropek (…, jeden znak)
  const ciety = czysty.slice(0, limit - 1);
  const spacja = ciety.lastIndexOf(" ");
  const podstawa = spacja > limit * 0.6 ? ciety.slice(0, spacja) : ciety;
  return podstawa.replace(/[\s,;:.–—-]+$/, "") + "…";
}
