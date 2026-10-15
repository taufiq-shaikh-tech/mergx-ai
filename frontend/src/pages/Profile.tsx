import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  LogOut,
  Mail,
  User,
} from "lucide-react";
import { supabase } from "../services/supabase";
import { PageHeader } from "../components/common/PageHeader";
import { Button } from "../components/common/Button";

export default function Profile() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [lastSignIn, setLastSignIn] = useState("");

  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      try {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (data.user && isMounted) {
          setEmail(data.user.email || "");
          setUserId(data.user.id || "");
          setName(data.user.user_metadata?.full_name || "");
          if (data.user.created_at) {
            setCreatedAt(new Date(data.user.created_at).toLocaleDateString());
          }
          if (data.user.last_sign_in_at) {
            setLastSignIn(new Date(data.user.last_sign_in_at).toLocaleString());
          }
        }
      } catch {
        // Not logged in or guest
      }
    }
    loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user) {
        throw new Error("No active session found. Please sign in again.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: name.trim(),
        },
      });

      if (updateError) {
        throw updateError;
      }

      setMessage("Profile details saved successfully.");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to save profile details."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch {
      window.alert("Unable to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <PageHeader
        eyebrow="WORKSPACE ACCOUNT"
        title="Account Profile"
        description="Manage your personal workspace identity and view your Supabase authentication details."
      />

      {message && (
        <div
          style={{
            padding: "12px 16px",
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
            padding: "12px 16px",
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

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* PROFILE CARD */}
        <div className="mx-card" style={{ padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 24 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "var(--radius-md)",
                background: "linear-gradient(135deg, var(--accent), #9bc83e)",
                display: "grid",
                placeItems: "center",
                fontSize: 24,
                fontWeight: 800,
                color: "#09090b",
              }}
            >
              {name ? name.charAt(0).toUpperCase() : email ? email.charAt(0).toUpperCase() : "M"}
            </div>

            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>
                {name || "MergeX Developer"}
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: 13 }}>
                <Mail size={14} />
                <span>{email || "Not signed in"}</span>
              </div>
            </div>
          </div>

          <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label
                htmlFor="profile-name"
                style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}
              >
                Full Name / Display Name
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
                <User size={16} color="var(--text-muted)" style={{ marginRight: 8 }} />
                <input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  style={{
                    background: "none",
                    border: "none",
                    outline: "none",
                    color: "var(--text-primary)",
                    padding: "10px 0",
                    width: "100%",
                    fontSize: 13,
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-email"
                style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}
              >
                Email Address (Managed by Supabase)
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0 12px",
                }}
              >
                <Mail size={16} color="var(--text-muted)" style={{ marginRight: 8 }} />
                <input
                  id="profile-email"
                  value={email}
                  readOnly
                  disabled
                  style={{
                    background: "none",
                    border: "none",
                    outline: "none",
                    color: "var(--text-muted)",
                    padding: "10px 0",
                    width: "100%",
                    fontSize: 13,
                    cursor: "not-allowed",
                  }}
                />
              </div>
              <small style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 4, display: "block" }}>
                Email changes require verification in your Supabase Auth settings.
              </small>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                icon={<Save size={15} />}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>

        {/* SECURITY & SESSION INFO */}
        <div className="mx-card" style={{ padding: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={18} color="var(--accent)" />
            Security & Session Telemetry
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              fontSize: 12,
            }}
          >
            <div>
              <span style={{ color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Account Created</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                {createdAt || "Active"}
              </span>
            </div>

            <div>
              <span style={{ color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Last Sign In</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                {lastSignIn || "Current Session"}
              </span>
            </div>

            <div>
              <span style={{ color: "var(--text-muted)", display: "block", marginBottom: 4 }}>User ID (UUID)</span>
              <span className="mono-font" style={{ color: "var(--text-secondary)", fontSize: 11 }}>
                {userId ? `${userId.substring(0, 16)}...` : "Authenticated"}
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Need to change your password? Visit the <button onClick={() => navigate("/app/security")} style={{ color: "var(--accent)", textDecoration: "underline", background: "none", border: "none", padding: 0, cursor: "pointer" }}>Security Center</button>.
            </span>

            <Button
              variant="danger"
              size="sm"
              loading={signingOut}
              icon={<LogOut size={14} />}
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}