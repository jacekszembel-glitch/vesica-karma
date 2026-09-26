"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabaseBrowser } from "@/lib/supabase/client";

function LoginInner() {
  const t = useTranslations("Login");
  const BLEDY: Record<string, string> = {
    przegladarka: t("errors.przegladarka"),
    wygasl: t("errors.wygasl"),
  };
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
      setError(t("otpInvalid", { message: error.message }));
    } else {
      router.push(next);
      router.refresh();
    }
  }

  return (
    <div className="container section" style={{ maxWidth: 480 }}>
      <div className="ornament">☾</div>
      <h1 style={{ textAlign: "center", marginBottom: 10 }}>{t("title")}</h1>
      <p className="section-sub" style={{ marginBottom: 28 }}>{t("subtitle")}</p>

      {linkBlad && BLEDY[linkBlad] && !sent && (
        <div className="card" style={{ marginBottom: 18, borderColor: "rgba(224,138,99,0.4)" }}>
          <p style={{ fontSize: "0.92rem", color: "var(--warn)" }}>⚠ {BLEDY[linkBlad]}</p>
        </div>
      )}

      {sent ? (
        <div style={{ display: "grid", gap: 18 }}>
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ fontSize: "2rem", marginBottom: 10 }}>✉️</p>
            <h3 style={{ marginBottom: 8 }}>{t("sentTitle")}</h3>
            <p className="muted" style={{ fontSize: "0.95rem" }}>
              {t.rich("sentDesc", {
                email: () => <strong>{email}</strong>,
                em: (chunks) => <em>{chunks}</em>,
              })}
            </p>
          </div>

          <form onSubmit={verifyCode} className="card" style={{ display: "grid", gap: 14 }}>
            <div>
              <label htmlFor="otp">{t("otpLabel")}</label>
              <input id="otp" inputMode="numeric" autoComplete="one-time-code"
                placeholder="123456" value={otp} maxLength={8}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.4em", fontVariantNumeric: "tabular-nums" }} />
            </div>
            {error && <p style={{ color: "var(--warn)", fontSize: "0.9rem" }}>{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={otpBusy || otp.length < 6}>
              {otpBusy ? t("otpChecking") : t("otpSubmit")}
            </button>
            <button type="button" className="btn btn-ghost" style={{ padding: "10px 22px", fontSize: "0.88rem" }}
              onClick={() => { setSent(false); setOtp(""); setError(null); }}>
              {t("resend")}
            </button>
          </form>
        </div>
      ) : (
        <form onSubmit={sendLink} className="card" style={{ display: "grid", gap: 16 }}>
          <div>
            <label htmlFor="login-email">{t("emailLabel")}</label>
            <input id="login-email" type="email" required placeholder={t("emailPlaceholder")}
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p style={{ color: "var(--warn)", fontSize: "0.9rem" }}>{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? t("sending") : t("sendSubmit")}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <hr className="gold-rule" style={{ flex: 1 }} /><span className="muted" style={{ fontSize: "0.8rem" }}>{t("or")}</span><hr className="gold-rule" style={{ flex: 1 }} />
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
                ? t("googleDisabled")
                : e.message,
            );
          }}>
            {t("google")}
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
