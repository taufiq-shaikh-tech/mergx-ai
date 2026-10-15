import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../services/supabase";
import { Button } from "../components/common/Button";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setSuccess(false);

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify both inputs.");
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.updateUser({
        password,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
      setMessage("Your password has been reset successfully.");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reset password. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
  }

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
            transition: "color var(--transition-fast)",
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
              {success ? <CheckCircle2 size={26} /> : <KeyRound size={26} />}
            </div>

            <h1
              className="display-font"
              style={{
                margin: "0 0 8px",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {success ? "Password Updated" : "Choose New Password"}
            </h1>

            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {success
                ? "Your credentials have been securely updated. Redirecting to login..."
                : "Enter a strong password with at least 8 characters."}
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

          {!success && (
            <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label
                  htmlFor="reset-password"
                  style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}
                >
                  New Password
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
                  <LockKeyhole size={16} color="var(--text-muted)" style={{ marginRight: 8 }} />
                  <input
                    id="reset-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
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
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ color: "var(--text-muted)", padding: 4 }}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reset-confirm"
                  style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}
                >
                  Confirm New Password
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
                  <LockKeyhole size={16} color="var(--text-muted)" style={{ marginRight: 8 }} />
                  <input
                    id="reset-confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
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
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{ color: "var(--text-muted)", padding: 4 }}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                icon={<ArrowRight size={16} />}
                style={{ marginTop: 8 }}
              >
                Update Password
              </Button>
            </form>
          )}

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
            <span>Encrypted with Supabase Authentication</span>
          </div>
        </div>
      </div>
    </main>
  );
}