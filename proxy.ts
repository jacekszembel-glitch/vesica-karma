import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (Next.js 16 — jeden taki plik zamiast middleware.ts, patrz
 * node_modules/next/dist/docs/.../proxy.md): odświeża sesję Supabase przy
 * każdym żądaniu i chroni /konto (przekierowanie do logowania, gdy brak
 * usera). Wzorzec skopiowany z czas-duszy/proxy.ts, bez trybu „wkrótce" —
 * VesicaKarma nie ma jeszcze blokady premiery.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anon) {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (all) => {
          for (const { name, value } of all) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of all) response.cookies.set(name, value, options);
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    const path = request.nextUrl.pathname;

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
