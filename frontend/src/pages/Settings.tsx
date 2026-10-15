import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save,
  CheckCircle2,
  AlertTriangle,
  User,
  Bell,
  Palette,
  LogOut,
} from "lucide-react";
import { supabase } from "../services/supabase";
import { PageHeader } from "../components/common/PageHeader";
import { Button } from "../components/common/Button";

export default function Settings() {
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [contractBreaksAlert, setContractBreaksAlert] = useState(true);

  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      try {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (data.user && isMounted) {
          setEmail(data.user.email ?? "");
          setDisplayName(data.user.user_metadata?.full_name ?? "");
        }
      } catch {
        // Fallback
      }
    }
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        throw new Error("Please sign in before updating workspace settings.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: displayName.trim() },
      });

      if (updateError) {
        throw updateError;
      }

      setMessage("Workspace preferences saved successfully.");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to save settings."
      );
    } finally {
      setLoading(false);
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
        eyebrow="PREFERENCES & CONFIGURATION"
        title="Settings"
        description="Configure workspace identity, alert preferences, and automated validation policies."
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

      <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* WORKSPACE PROFILE */}
        <div className="mx-card" style={{ padding: 24 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <User size={18} color="var(--accent)" />
            Profile Information
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label
                htmlFor="settings-name"
                style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}
              >
                Display Name
              </label>
              <input
                id="settings-name"
                className="mx-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Developer name"
              />
            </div>

            <div>
              <label
                htmlFor="settings-email"
                style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}
              >
                Account Email
              </label>
              <input
                id="settings-email"
                className="mx-input"
                value={email}
                disabled
                style={{ opacity: 0.6, cursor: "not-allowed" }}
              />
            </div>
          </div>
        </div>

        {/* NOTIFICATION PREFERENCES */}
        <div className="mx-card" style={{ padding: 24 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Bell size={18} color="var(--accent)" />
            Alerts & Notifications
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
              <div>
                <strong style={{ fontSize: 13, display: "block" }}>Contract Break Warnings</strong>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Notify when frontend routes mismatch backend endpoint contracts
                </span>
              </div>
              <input
                type="checkbox"
                checked={contractBreaksAlert}
                onChange={(e) => setContractBreaksAlert(e.target.checked)}
                style={{ accentColor: "var(--accent)" }}
              />
            </label>

            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
              <div>
                <strong style={{ fontSize: 13, display: "block" }}>Security & Secret Advisories</strong>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Immediate notification when committed credentials or CVEs are surfaced
                </span>
              </div>
              <input
                type="checkbox"
                checked={securityAlerts}
                onChange={(e) => setSecurityAlerts(e.target.checked)}
                style={{ accentColor: "var(--accent)" }}
              />
            </label>

            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
              <div>
                <strong style={{ fontSize: 13, display: "block" }}>Email Digest</strong>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Weekly summary report of workspace software quality
                </span>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                style={{ accentColor: "var(--accent)" }}
              />
            </label>
          </div>
        </div>

        {/* THEME & APPEARANCE */}
        <div className="mx-card" style={{ padding: 24 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Palette size={18} color="var(--accent)" />
            Workspace Theme
          </h2>

          <div style={{ display: "flex", gap: 12 }}>
            <div
              style={{
                padding: "12px 18px",
                borderRadius: "var(--radius-sm)",
                background: "var(--accent-subtle)",
                border: "1px solid var(--accent-border)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--accent)",
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "var(--accent)",
                }}
              />
              MergeX Obsidian & Lime (Default)
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={<Save size={15} />}
          >
            Save Settings
          </Button>

          <Button
            type="button"
            variant="danger"
            size="sm"
            loading={signingOut}
            icon={<LogOut size={14} />}
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </div>
      </form>
    </div>
  );
}