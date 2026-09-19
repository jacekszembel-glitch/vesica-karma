"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

const BLEDY: Record<string, string> = {
  przegladarka:
    "Link logujący trzeba otworzyć w tej samej przeglądarce, w której podano e-mail. Najprościej: wyślij link jeszcze raz i wpisz 6-cyfrowy kod z wiadomości poniżej.",
  wygasl:
    "Ten link wygasł albo został już użyty (czasem „klika” go automat pocztowy). Wyślij nowy i wpisz 6-cyfrowy kod z wiadomości.",
};

function LoginInner() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const params = useSearchParams();
  const router = useRouter();
  const next = params.get("next") ?? "/konto";
  const linkBlad = params.get("blad");

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 6) return;
    setOtpBusy(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.verifyOtp({ email, token: otp.trim(), type: "email" });
    setOtpBusy(false);
    if (error) {
      setError(
        `Kod nieprawidłowy albo wygasł. Uwaga: liczy się kod z NAJNOWSZEJ wiadomości — każde ponowne wysłanie unieważnia poprzedni. (${error.message})`,
      );
    } else {
      router.push(next);
      router.refresh();
    }
  }

  return (
    <div className="container section" style={{ maxWidth: 480 }}>
      <div className="ornament">☾</div>
      <h1 style={{ textAlign: "center", marginBottom: 10 }}>Wejdź do swojej mapy</h1>
      <p className="section-sub" style={{ marginBottom: 28 }}>
        Bez hasła — wyślemy Ci e-mail z linkiem i 6-cyfrowym kodem.
      </p>

      {linkBlad && BLEDY[linkBlad] && !sent && (
        <div className="card" style={{ marginBottom: 18, borderColor: "rgba(224,138,99,0.4)" }}>
          <p style={{ fontSize: "0.92rem", color: "var(--warn)" }}>⚠ {BLEDY[linkBlad]}</p>
        </div>
      )}

      {sent ? (
        <div style={{ display: "grid", gap: 18 }}>
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ fontSize: "2rem", marginBottom: 10 }}>✉️</p>
            <h3 style={{ marginBottom: 8 }}>Sprawdź skrzynkę</h3>
            <p className="muted" style={{ fontSize: "0.95rem" }}>
              Wysłaliśmy wiadomość na <strong>{email}</strong>.
              Kliknij link <em>na tym urządzeniu</em> — albo przepisz kod poniżej
              (działa wszędzie, np. gdy czytasz pocztę na telefonie).
            </p>
          </div>

          <form onSubmit={verifyCode} className="card" style={{ display: "grid", gap: 14 }}>
            <div>
              <label htmlFor="otp">Kod z wiadomości</label>
              <input id="otp" inputMode="numeric" autoComplete="one-time-code"
                placeholder="123456" value={otp} maxLength={8}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.4em", fontVariantNumeric: "tabular-nums" }} />
            </div>
            {error && <p style={{ color: "var(--warn)", fontSize: "0.9rem" }}>{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={otpBusy || otp.length < 6}>
              {otpBusy ? "Sprawdzam…" : "Zaloguj kodem"}
            </button>
            <button type="button" className="btn btn-ghost" style={{ padding: "10px 22px", fontSize: "0.88rem" }}
              onClick={() => { setSent(false); setOtp(""); setError(null); }}>
              Wyślij jeszcze raz / zmień e-mail
            </button>
          </form>
        </div>
      ) : (
        <form onSubmit={sendLink} className="card" style={{ display: "grid", gap: 16 }}>
          <div>
            <label htmlFor="login-email">Adres e-mail</label>
            <input id="login-email" type="email" required placeholder="ty@przyklad.pl"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p style={{ color: "var(--warn)", fontSize: "0.9rem" }}>{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Wysyłam…" : "Wyślij link i kod"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <hr className="gold-rule" style={{ flex: 1 }} /><span className="muted" style={{ fontSize: "0.8rem" }}>albo</span><hr className="gold-rule" style={{ flex: 1 }} />
          </div>
          <button type="button" className="btn btn-ghost" onClick={async () => {
            const supabase = supabaseBrowser();
            const { error: e } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
            });
            // bez tego provider wyłączony w Supabase kończył się cichym niczym
            if (e) setError(
              /not enabled|disabled/i.test(e.message)
                ? "Logowanie Google jest chwilowo niedostępne — skorzystaj z linku i kodu e-mail powyżej."
                : e.message,
            );
          }}>
            Kontynuuj z Google
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
