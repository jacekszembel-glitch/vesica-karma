import { defineRouting } from "next-intl/routing";

/**
 * Polski to jedyny język od startu serwisu — zostaje BEZ prefiksu w adresie
 * (localePrefix: "as-needed"), żeby żaden istniejący adres/SEO się nie zmienił.
 * Angielski (pierwszy dodatkowy język) dostaje prefiks /en/...
 * (ten sam wzorzec co w czas-duszy — patrz jego i18n/routing.ts).
 */
export const routing = defineRouting({
  locales: ["pl", "en"],
  defaultLocale: "pl",
  localePrefix: "as-needed",
});
