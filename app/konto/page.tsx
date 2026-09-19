import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

/**
 * Placeholder — dowód, że logowanie działa niezależnie od 9dom (osobny
 * Supabase = osobne konto). Pełny "Mój Panel" VesicaKarma projektujemy
 * osobno, nie kopiujemy panelu 9dom.
 */
export default async function KontoPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/logowanie?next=/konto");

  return (
    <div className="container section" style={{ maxWidth: 480, textAlign: "center" }}>
      <h1 style={{ marginBottom: 8 }}>Zalogowano</h1>
      <p className="section-sub">{user.email}</p>
      <div style={{ marginTop: 24 }}>
        <SignOutButton />
      </div>
    </div>
  );
}
