
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  ShieldCheck,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../services/supabase";
import "../App.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (!data.session) {
        throw new Error(
          "Login session was not created. Please try again."
        );
      }

      setSuccess("Login successful! Opening your workspace...");

      window.setTimeout(() => {
        navigate("/app");
      }, 800);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Login failed. Please try again.";

      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes("invalid login credentials")) {
        setError("Incorrect email or password. Please check your details.");
      } else if (lowerMessage.includes("email not confirmed")) {
        setError(
          "Your email is not confirmed yet. Please verify your email and try again."
        );
      } else if (
        lowerMessage.includes("failed to fetch") ||
        lowerMessage.includes("network")
      ) {
        setError(
          "Unable to connect to the server. Check your internet connection and try again."
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-background-glow auth-glow-one" />
      <div className="auth-background-glow auth-glow-two" />

      <nav className="auth-navbar">
        <Link to="/" className="auth-back-link">
          <ArrowLeft size={17} />
          <span>Back to home</span>
        </Link>

        <Link to="/" className="auth-brand">
          <img
            src="/mergex-mark.png"
            alt="MergeX AI Logo"
            className="brand-logo"
          />
        </Link>

        <div className="auth-nav-right">
          <span>New here?</span>
          <Link to="/register" className="auth-signup-link">
            Create account
          </Link>
        </div>
      </nav>

      <section className="auth-main">
        <div className="auth-content">
          <div className="auth-eyebrow">
            <Sparkles size={15} />
            <span>WELCOME BACK</span>
          </div>

          <h1 className="auth-heading">
            Your code.
            <br />
            <span>Your control.</span>
          </h1>

          <p className="auth-description">
            Sign in to inspect your projects, detect integration issues,
            and keep your software quality under control.
          </p>

          <div className="auth-benefits">
            <div className="auth-benefit">
              <div className="auth-benefit-icon">
                <ShieldCheck size={19} />
              </div>
              <div>
                <h3>Security insights</h3>
                <p>Identify potential security risks.</p>
              </div>
            </div>

            <div className="auth-benefit">
              <div className="auth-benefit-icon">
                <LockKeyhole size={19} />
              </div>
              <div>
                <h3>Private workspace</h3>
                <p>Keep your projects organized.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-card-icon">
              <LockKeyhole size={23} />
            </div>

            <h2>Sign in</h2>
            <p>Enter your details to access your workspace.</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-field">
              <label htmlFor="login-email">Email address</label>

              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-input-icon" />

                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="login-password">Password</label>

                <Link to="/forgot-password">
                  Forgot password?
                </Link>
              </div>

              <div className="auth-input-wrapper">
                <LockKeyhole size={18} className="auth-input-icon" />

                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="auth-message auth-error">
                <AlertCircle size={17} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div role="status" className="auth-message auth-success">
                <CheckCircle2 size={17} />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="auth-spinner" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in to MergeX</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>SECURE WORKSPACE ACCESS</span>
          </div>

          <p className="auth-bottom-text">
            Don&apos;t have an account?{" "}
            <Link to="/register">Create one free</Link>
          </p>

          <div className="auth-security-note">
            <ShieldCheck size={15} />
            <span>Your workspace security matters.</span>
          </div>
        </div>
      </section>

      <footer className="auth-footer">
        <span>© 2026 MergeX AI</span>
        <span>Built for better software quality.</span>
      </footer>
    </main>
  );
}

