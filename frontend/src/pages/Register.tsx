
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../services/supabase";
import "../App.css";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        setSuccess("Account created successfully! Opening your workspace...");

        window.setTimeout(() => {
          navigate("/app");
        }, 1200);
      } else {
        setSuccess(
          "Registration successful! Check your email for a verification link, then sign in."
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.";

      const lowerMessage = message.toLowerCase();

      if (
        lowerMessage.includes("already registered") ||
        lowerMessage.includes("already exists")
      ) {
        setError(
          "An account may already exist with this email. Try signing in instead."
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
          <span>Already a member?</span>
          <Link to="/login" className="auth-signup-link">
            Sign in
          </Link>
        </div>
      </nav>

      <section className="auth-main">
        <div className="auth-content">
          <div className="auth-eyebrow">
            <span>✦ START BUILDING</span>
          </div>

          <h1 className="auth-heading">
            Build better.
            <br />
            <span>Ship smarter.</span>
          </h1>

          <p className="auth-description">
            Create your MergeX AI account to analyze projects, identify
            integration issues, and improve your software quality.
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-card-icon">
              <UserRound size={23} />
            </div>

            <h2>Create account</h2>
            <p>Enter your details to get started.</p>
          </div>

          <form onSubmit={handleRegister} className="auth-form">
            <div className="auth-field">
              <label htmlFor="register-name">Full name</label>

              <div className="auth-input-wrapper">
                <UserRound size={18} className="auth-input-icon" />

                <input
                  id="register-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">Email address</label>

              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-input-icon" />

                <input
                  id="register-email"
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
              <label htmlFor="register-password">Password</label>

              <div className="auth-input-wrapper">
                <LockKeyhole size={18} className="auth-input-icon" />

                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password (min. 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
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
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create your account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="auth-bottom-text">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

          <div className="auth-security-note">
            <LockKeyhole size={15} />
            <span>Your account security matters.</span>
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

