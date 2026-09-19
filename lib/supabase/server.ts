import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** Klient Supabase dla Server Components / Route Handlers (sesja z cookies). */
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (all) => {
          try {
            for (const { name, value, options } of all) cookieStore.set(name, value, options);
          } catch {
            // wywołanie z Server Component — middleware odświeży sesję
          }
        },
      },
    },
  );
}

/** Klient administracyjny (service_role) — TYLKO po stronie serwera, omija RLS. */
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
