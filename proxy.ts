import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

/** Usuwa ewentualny prefiks języka (np. "/en") z początku ścieżki — polski
 *  (domyślny, localePrefix: "as-needed") nie ma prefiksu w adresie, więc
 *  sprawdzenia oparte na ścieżce (ochrona /konto) muszą działać tak samo
 *  niezależnie od języka odwiedzającego. */
function bezPrefiksuJezyka(pathname: string): string {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1) || "/";
    }
  }
  return pathname;
}

/**
 * Proxy (Next.js 16 — jeden taki plik zamiast middleware.ts, patrz
 * node_modules/next/dist/docs/.../proxy.md) — dwie odpowiedzialnosci:
 *  1) i18n (next-intl) — wykrycie/normalizacja jezyka dla stron pod
 *     app/[locale]/. /api i /auth NIE sa pod [locale] (to route handlery,
 *     nie strony) — next-intl w ogole ich nie dotyka, inaczej rewrite'owalby
 *     np. /api/interpret na /pl/api/interpret (404, znaleziony bug w czas-duszy).
 *     Z tego samego powodu pomijamy KAZDA sciezke z kropka w ostatnim
 *     segmencie (pliki statyczne z public/, np. /brand/logo.png) — bez tego
 *     next-intl rewrite'owalby je na /pl/brand/logo.png, ktorego nie ma
 *     (public/ nie jest zagniezdzone pod [locale]). Znaleziony REALNY bug:
 *     przez cala sesje i18n obrazy z public/brand/ wychodzily 404 na kazdej
 *     stronie, dopoki tego nie dodano.
 *  2) odswiezanie sesji Supabase + ochrona /konto (istniejaca logika,
 *     zachowanie bez zmian poza uwzglednieniem prefiksu jezyka w sciezce).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const wygladaJakPlik = /\.[^/]+$/.test(pathname);
  const pomijaJezyk = pathname.startsWith("/api/") || pathname === "/api" || pathname.startsWith("/auth/") || wygladaJakPlik;
  const i18nResponse = pomijaJezyk ? NextResponse.next({ request }) : handleI18nRouting(request);

  if (i18nResponse.headers.get("location")) return i18nResponse;

  let response = i18nResponse;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anon) {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (all) => {
          for (const { name, value } of all) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          i18nResponse.headers.forEach((value, key) => {
            if (key.toLowerCase() === "set-cookie") response.headers.append(key, value);
            else response.headers.set(key, value);
          });
          for (const { name, value, options } of all) response.cookies.set(name, value, options);
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    const path = bezPrefiksuJezyka(pathname);

    if (!user && path.startsWith("/konto")) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/logowanie";
      redirect.searchParams.set("next", path);
      response = NextResponse.redirect(redirect);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
