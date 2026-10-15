import { useEffect, useState } from "react";
import {
  ShieldAlert,
  LockKeyhole,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  RefreshCw,
  Search,
  Check,
} from "lucide-react";
import { supabase } from "../services/supabase";
import { PageHeader } from "../components/common/PageHeader";
import { StatCard } from "../components/common/StatCard";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { api } from "../services/api";
import type { Finding } from "../types";

export default function Security() {
  const [activeTab, setActiveTab] = useState<"findings" | "account">("findings");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorFindings, setErrorFindings] = useState<string | null>(null);

  const [filterSeverity, setFilterSeverity] = useState<string>("All");
  const [search, setSearch] = useState("");

  // Account Password Update State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);
  const [message, setMessage] = useState("");
  const [errorPass, setErrorPass] = useState("");

  const loadSecurityFindings = async () => {
    try {
      setLoading(true);
      setErrorFindings(null);
      const data = await api.getFindings("Security");
      setFindings(data);
    } catch (err: any) {
      setErrorFindings(err.message || "Failed to load security findings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityFindings();
  }, []);

  const handleToggleStatus = async (findingId: string, currentStatus?: string) => {
    const nextStatus = currentStatus === "resolved" ? "open" : "resolved";
    try {
      await api.updateFindingStatus(findingId, nextStatus);
      setFindings((prev) =>
        prev.map((f) => (f.id === findingId ? { ...f, status: nextStatus } : f))
      );
    } catch (err) {
      console.error("Failed to update finding status:", err);
    }
  };

  const updatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorPass("");

    if (password.length < 8) {
      setErrorPass("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorPass("Passwords do not match.");
      return;
    }

    setLoadingPass(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setMessage("Password updated successfully.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setErrorPass(
        err instanceof Error ? err.message : "Unable to update your password."
      );
    } finally {
      setLoadingPass(false);
    }
  };

  const filteredFindings = findings.filter((f) => {
    const matchesSeverity = filterSeverity === "All" || f.severity === filterSeverity;
    const matchesSearch =
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.filePath.toLowerCase().includes(search.toLowerCase()) ||
      (f.ruleId && f.ruleId.toLowerCase().includes(search.toLowerCase()));
    return matchesSeverity && matchesSearch;
  });

  const criticalCount = findings.filter((f) => f.severity === "Critical" && f.status !== "resolved").length;
  const highCount = findings.filter((f) => f.severity === "High" && f.status !== "resolved").length;
  const resolvedCount = findings.filter((f) => f.status === "resolved").length;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        eyebrow="SECURITY & COMPLIANCE"
        title="Security Center"
        description="Audit code vulnerabilities, secret exposure, and manage workspace authentication settings."
      />

      {/* METRICS ROW */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Critical Findings"
          value={loading ? "..." : criticalCount}
          detail="Urgent security fixes"
          icon={ShieldAlert}
          color="danger"
        />
        <StatCard
          label="High Severity"
          value={loading ? "..." : highCount}
          detail="Potential vulnerabilities"
          icon={AlertTriangle}
          color="orange"
        />
        <StatCard
          label="Resolved Issues"
          value={loading ? "..." : resolvedCount}
          detail="Remediated findings"
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          label="Auth Protection"
          value="Enforced"
          detail="Supabase Auth token validation"
          icon={LockKeyhole}
          color="accent"
        />
      </div>

      {/* TABS */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border)",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={() => setActiveTab("findings")}
            style={{
              padding: "10px 16px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "findings" ? "2px solid var(--accent-lime)" : "2px solid transparent",
              color: activeTab === "findings" ? "var(--text-primary)" : "var(--text-muted)",
              fontWeight: activeTab === "findings" ? 600 : 500,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Codebase Security Findings ({findings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("account")}
            style={{
              padding: "10px 16px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "account" ? "2px solid var(--accent-lime)" : "2px solid transparent",
              color: activeTab === "account" ? "var(--text-primary)" : "var(--text-muted)",
              fontWeight: activeTab === "account" ? 600 : 500,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Account Credentials
          </button>
        </div>

        {activeTab === "findings" && (
          <div style={{ display: "flex", gap: 10, paddingBottom: 8, alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "4px 10px",
                width: 220,
              }}
            >
              <Search size={14} color="var(--text-muted)" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search findings..."
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  width: "100%",
                }}
              />
            </div>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="mx-input"
              style={{ width: 140, padding: "5px 8px", fontSize: 12 }}
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw size={13} className={loading ? "animate-spin" : ""} />}
              onClick={loadSecurityFindings}
            >
              Refresh
            </Button>
          </div>
        )}
      </div>

      {activeTab === "findings" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {errorFindings && (
            <div
              className="mx-card"
              style={{
                color: "var(--danger)",
                borderLeft: "3px solid var(--danger)",
                padding: "12px 16px",
              }}
            >
              {errorFindings}
            </div>
          )}
          {loading && (
            <div style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
              <div>Scanning security records...</div>
            </div>
          )}

          {!loading && findings.length === 0 && (
            <div
              className="mx-card"
              style={{
                padding: 40,
                textAlign: "center",
                background: "rgba(196, 247, 91, 0.02)",
                border: "1px solid var(--accent-border)",
              }}
            >
              <CheckCircle2 size={36} color="var(--accent-lime)" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>No Security Vulnerabilities Detected</h3>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
                Static pattern matching found zero hardcoded secrets, injection vectors, or permissive CORS configurations.
              </p>
            </div>
          )}

          {!loading && findings.length > 0 && filteredFindings.length === 0 && (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                background: "var(--bg-card)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
            >
              No security findings match the current filter.
            </div>
          )}

          {!loading &&
            filteredFindings.map((finding) => {
              const isResolved = finding.status === "resolved";
              return (
                <div
                  key={finding.id}
                  className="mx-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    opacity: isResolved ? 0.6 : 1,
                    borderLeft:
                      finding.severity === "Critical"
                        ? "3px solid var(--danger)"
                        : finding.severity === "High"
                        ? "3px solid var(--orange)"
                        : "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <Badge severity={finding.severity as any}>
                        {finding.severity}
                      </Badge>
                      {finding.ruleId && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            background: "rgba(255,255,255,0.05)",
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {finding.ruleId}
                        </span>
                      )}
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 15,
                          fontWeight: 600,
                          textDecoration: isResolved ? "line-through" : "none",
                        }}
                      >
                        {finding.title}
                      </h3>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(finding.id, finding.status)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          padding: "4px 10px",
                          borderRadius: "var(--radius-sm)",
                          background: isResolved ? "rgba(196, 247, 91, 0.1)" : "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          color: isResolved ? "var(--accent-lime)" : "var(--text-secondary)",
                          cursor: "pointer",
                        }}
                      >
                        <Check size={13} />
                        {isResolved ? "Resolved" : "Mark Resolved"}
                      </button>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {finding.description}
                  </p>

                  {finding.codeSnippet && (
                    <pre
                      style={{
                        background: "#080b0f",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        padding: "10px 14px",
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "#f8fafc",
                        overflowX: "auto",
                        margin: 0,
                      }}
                    >
                      <code>{finding.codeSnippet}</code>
                    </pre>
                  )}

                  <div
                    style={{
                      background: "rgba(196, 247, 91, 0.04)",
                      border: "1px solid var(--accent-border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "10px 14px",
                      fontSize: 12,
                      color: "var(--text-secondary)",
                    }}
                  >
                    <strong style={{ color: "var(--accent-lime)" }}>Recommendation: </strong>
                    {finding.recommendation}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 11,
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    <FileCode2 size={13} />
                    <span>
                      {finding.filePath}
                      {finding.lineNumber ? `:${finding.lineNumber}` : ""}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        /* ACCOUNT SECURITY SECTION */
        <div className="mx-card" style={{ padding: 32, maxWidth: 640 }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>
            Update Account Password
          </h2>
          <p style={{ margin: "0 0 24px", fontSize: 13, color: "var(--text-secondary)" }}>
            Change the password used to sign into your Supabase developer session.
          </p>

          {message && (
            <div
              style={{
                padding: "12px 14px",
                background: "rgba(196, 247, 91, 0.1)",
                border: "1px solid var(--accent-border)",
                color: "var(--accent-lime)",
                borderRadius: "var(--radius-sm)",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {message}
            </div>
          )}

          {errorPass && (
            <div
              style={{
                padding: "12px 14px",
                background: "var(--danger-subtle)",
                border: "1px solid var(--danger-border)",
                color: "var(--danger)",
                borderRadius: "var(--radius-sm)",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {errorPass}
            </div>
          )}

          <form onSubmit={updatePassword} style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mx-input"
                  placeholder="At least 8 characters"
                  style={{ width: "100%", paddingRight: 40 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Confirm New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mx-input"
                placeholder="Re-enter password"
                style={{ width: "100%" }}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loadingPass}
              style={{ marginTop: 8 }}
            >
              Save New Password
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}