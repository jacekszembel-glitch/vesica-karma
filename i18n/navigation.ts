import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Zamienniki next/link i next/navigation świadome języka — Link automatycznie
 * dokleja /en tam, gdzie trzeba, a usePathname() zawsze zwraca ścieżkę BEZ
 * prefiksu jezyka. UWAGA: server-side `redirect` stąd wymaga {href, locale},
 * nie jest drop-in zamiennikiem next/navigation's redirect(string) — dla
 * samego redirect() w server components zostaw next/navigation.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
