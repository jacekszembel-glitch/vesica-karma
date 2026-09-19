import { createBrowserClient } from "@supabase/ssr";

/** Klient Supabase dla przeglądarki (komponenty klienckie). */
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
