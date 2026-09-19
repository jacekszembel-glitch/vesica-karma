import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Wymiana kodu z linku logującego / OAuth na sesję. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/konto";
  const supabase = await supabaseServer();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
    // typowe: link otwarty w innej przeglądarce niż ta, w której podano e-mail
    return NextResponse.redirect(
      new URL(`/logowanie?blad=przegladarka&next=${encodeURIComponent(next)}`, url.origin),
    );
  }

  // błędy zwracane przez Supabase (np. link wygasł / zużyty przez skaner poczty)
  const errCode = url.searchParams.get("error_code") ?? url.searchParams.get("error");
  if (errCode) {
    return NextResponse.redirect(
      new URL(`/logowanie?blad=wygasl&next=${encodeURIComponent(next)}`, url.origin),
    );
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
