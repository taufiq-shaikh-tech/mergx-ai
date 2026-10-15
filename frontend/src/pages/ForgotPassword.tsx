import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../services/supabase";
import { Button } from "../components/common/Button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your account email address.");
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        trimmed,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        throw resetError;
      }

      setMessage(
        "Password reset instructions have been sent. Check your inbox to continue."
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send password recovery email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
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
          to="/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "var(--text-secondary)",
            fontSize: 13,
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to sign in</span>
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
              Reset your password
            </h1>

            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Enter the email associated with your MergeX AI account and we'll send you a recovery link.
            </p>
          </div>

          {message && (
            <div
              style={{
                padding: "12px 14px",
                marginBottom: 20,
                background: "var(--success-subtle)",
                border: "1px solid var(--success-border)",
                color: "var(--success)",
                borderRadius: "var(--radius-sm)",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCircle2 size={16} />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "12px 14px",
                marginBottom: 20,
                background: "var(--danger-subtle)",
                border: "1px solid var(--danger-border)",
                color: "var(--danger)",
                borderRadius: "var(--radius-sm)",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label
                htmlFor="forgot-email"
                style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}
              >
                Account Email Address
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0 12px",
                }}
              >
                <Mail size={16} color="var(--text-muted)" style={{ marginRight: 8 }} />
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  style={{
                    background: "none",
                    border: "none",
                    outline: "none",
                    color: "var(--text-primary)",
                    padding: "11px 0",
                    width: "100%",
                    fontSize: 13,
                  }}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={<ArrowRight size={16} />}
              style={{ marginTop: 8 }}
            >
              Send Recovery Instructions
            </Button>
          </form>

          <div
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              color: "var(--text-muted)",
              fontSize: 11,
            }}
          >
            <ShieldCheck size={14} color="var(--accent)" />
            <span>Secured by Supabase Authentication</span>
          </div>
        </div>
      </div>
    </main>
  );
}
