import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import pl from "../messages/pl.json";
import en from "../messages/en.json";

// Statyczne importy (nie dynamiczny `import(`.../${locale}.json`)`) — Turbopack
// potrafi nie rozwiazac poprawnie sciezki budowanej z szablonu string
// (znaleziony bug w czas-duszy: puste komunikaty mimo poprawnego kodu).
const MESSAGES: Record<string, typeof pl> = { pl, en };

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: MESSAGES[locale],
  };
});
