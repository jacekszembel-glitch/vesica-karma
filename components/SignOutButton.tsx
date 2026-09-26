"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function SignOutButton() {
  const t = useTranslations("Konto");
  const router = useRouter();
  return (
    <button
      className="btn btn-ghost"
      onClick={async () => {
        await supabaseBrowser().auth.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      {t("wyloguj")}
    </button>
  );
}
