import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../services/supabase";
import { Button } from "../components/common/Button";

export default function VerifyEmail() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function resendVerification() {
    setMessage("");
    setError("");

    const normalizedEmail = email.trim();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
      });

      if (resendError) {
        throw resendError;
      }

      setMessage(
        "Verification email resent. Please check your inbox and spam folder."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to resend the verification email."
      );
    } finally {
      setLoading(false);
    }
  }

  async function checkVerification() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!data.user) {
        setError(
          "No active session found. Please click the verification link in your email and sign in."
        );
        return;
      }

      if (!data.user.email_confirmed_at) {
        setError(
          "Your email is not verified yet. Please open the link in your inbox."
        );
        return;
      }

      setMessage("Email verified successfully! Opening workspace...");

      window.setTimeout(() => {
        navigate("/app");
      }, 1000);
    } catch {
      setError(
        "Could not check verification status. Please sign in after verifying your email."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="auth-page"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
      }}
    >
      <div className="auth-background-glow auth-glow-one" />
      <div className="auth-background-glow auth-glow-two" />

      <div style={{ width: "100%", maxWidth: 440, zIndex: 1 }}>
        <Link
          to="/"
          style={{
            display: "block",
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          <img
            src="/mergex-mark.png"
            alt="MergeX AI"
            style={{ width: 160, objectFit: "contain" }}
          />
        </Link>

        <div className="mx-card" style={{ padding: 32 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div
              style={{
                width: 52,
                height: 52,
                margin: "0 auto 16px",
                display: "grid",
                placeItems: "center",
                borderRadius: "var(--radius-md)",
                background: "var(--accent-subtle)",
                border: "1px solid var(--accent-border)",
                color: "var(--accent)",
              }}
            >
              <Mail size={24} />
            </div>

            <h1
              className="display-font"
              style={{
                margin: "0 0 8px",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              Verify your email
            </h1>

            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Check your inbox for the verification link sent by MergeX AI.
              Once confirmed, your account will be activated.
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="verification-email"
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Email Address
            </label>

            <input
              id="verification-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mx-input"
            />
          </div>

          {error && (
            <div
              role="alert"
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                padding: "12px 14px",
                marginBottom: 16,
                borderRadius: "var(--radius-sm)",
                background: "var(--danger-subtle)",
                border: "1px solid var(--danger-border)",
                color: "var(--danger)",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div
              role="status"
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                padding: "12px 14px",
                marginBottom: 16,
                borderRadius: "var(--radius-sm)",
                background: "var(--success-subtle)",
                border: "1px solid var(--success-border)",
                color: "var(--success)",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{message}</span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Button
              type="button"
              variant="primary"
              onClick={resendVerification}
              loading={loading}
              icon={<RefreshCw size={15} />}
              style={{ width: "100%" }}
            >
              Resend Verification Email
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={checkVerification}
              loading={loading}
              icon={<ShieldCheck size={15} />}
              style={{ width: "100%" }}
            >
              I've Verified My Email
            </Button>
          </div>

          <div
            style={{
              height: 1,
              background: "var(--border)",
              margin: "24px 0",
            }}
          />

          <Link
            to="/login"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              color: "var(--text-secondary)",
              fontSize: 13,
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to sign in</span>
          </Link>
        </div>

        <div
          style={{
            marginTop: 20,
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 11,
          }}
        >
          MergeX AI · Secure Developer Identity
        </div>
      </div>
    </div>
  );
}