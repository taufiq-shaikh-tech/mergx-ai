import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Workflow,
  Plus,
  CircleDot,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Check,
} from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { StatCard } from "../components/common/StatCard";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { api } from "../services/api";
import type { Finding } from "../types";

export default function Integration() {
  const navigate = useNavigate();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterSeverity, setFilterSeverity] = useState("All");
  const [search, setSearch] = useState("");

  const loadFindings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getFindings("Integration");
      setFindings(data);
    } catch (err: any) {
      setError(err.message || "Failed to load integration analysis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFindings();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus?: string) => {
    const nextStatus = currentStatus === "resolved" ? "open" : "resolved";
    try {
      await api.updateFindingStatus(id, nextStatus);
      setFindings((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: nextStatus } : f))
      );
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const filtered = findings.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.filePath.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase());
    const matchesSev = filterSeverity === "All" || f.severity === filterSeverity;
    return matchesSearch && matchesSev;
  });

  const highCount = findings.filter((f) => f.severity === "High" && f.status !== "resolved").length;
  const mediumCount = findings.filter((f) => f.severity === "Medium" && f.status !== "resolved").length;
  const resolvedCount = findings.filter((f) => f.status === "resolved").length;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        eyebrow="MULTI-TIER CONTRACT MATCHING"
        title="Route & Integration Architecture"
        description="Cross-references frontend API invocations (fetch, axios) against backend decorators (FastAPI, Express) to catch missing routes and parameter mismatches."
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => navigate("/app/projects/upload")}
          >
            Upload Codebase
          </Button>
        }
      />

      {/* ERROR */}
      {error && (
        <div
          className="mx-card"
          style={{
            padding: 20,
            marginBottom: 24,
            borderColor: "var(--danger)",
            background: "rgba(239, 68, 68, 0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle color="var(--danger)" size={20} />
            <span style={{ fontSize: 13, color: "var(--danger)" }}>{error}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={loadFindings}>
            Retry
          </Button>
        </div>
      )}

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
          label="Integration Issues"
          value={loading ? "..." : findings.length}
          detail="Total contract discrepancies"
          icon={Workflow}
          color="purple"
        />
        <StatCard
          label="High Severity"
          value={loading ? "..." : highCount}
          detail="Unmatched routes or missing handlers"
          icon={AlertTriangle}
          color="danger"
        />
        <StatCard
          label="Medium Risks"
          value={loading ? "..." : mediumCount}
          detail="Hardcoded URLs or parameter drift"
          icon={CircleDot}
          color="orange"
        />
        <StatCard
          label="Resolved Items"
          value={loading ? "..." : resolvedCount}
          detail="Verified and addressed"
          icon={CheckCircle2}
          color="green"
        />
      </div>

      {/* TOOLBAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "6px 12px",
            minWidth: 260,
          }}
        >
          <Search size={14} color="var(--text-muted)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search integration findings or endpoints..."
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

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="mx-input"
            style={{ width: 140, padding: "6px 10px", fontSize: 12 }}
          >
            <option value="All">All Severities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}
            onClick={loadFindings}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          <div>Checking cross-layer contract matches...</div>
        </div>
      )}

      {/* EMPTY STATES */}
      {!loading && !error && findings.length === 0 && (
        <div
          className="mx-card"
          style={{
            padding: 48,
            textAlign: "center",
            background: "rgba(196, 247, 91, 0.03)",
            border: "1px solid var(--accent-border)",
          }}
        >
          <CheckCircle2 size={36} color="var(--accent-lime)" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>
            All Integration Contracts Aligned!
          </h3>
          <p style={{ margin: "0 auto 20px", maxWidth: 500, fontSize: 13, color: "var(--text-secondary)" }}>
            Zero unreferenced routes, path parameter mismatches, or hardcoded API base URLs were detected in your scanned codebases.
          </p>
          <Button variant="secondary" size="sm" onClick={() => navigate("/app/projects/upload")}>
            Upload Another Project
          </Button>
        </div>
      )}

      {!loading && !error && findings.length > 0 && filtered.length === 0 && (
        <EmptyState
          title="No integration findings match your filter"
          description="Adjust your search term or severity filter."
          actionText="Clear Filters"
          onAction={() => {
            setSearch("");
            setFilterSeverity("All");
          }}
        />
      )}

      {/* FINDINGS LIST */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: "grid", gap: 14 }}>
          {filtered.map((item) => {
            const isResolved = item.status === "resolved";

            return (
              <div
                key={item.id}
                className="mx-card"
                style={{
                  padding: 20,
                  opacity: isResolved ? 0.6 : 1,
                  borderLeft:
                    item.severity === "High"
                      ? "3px solid var(--danger)"
                      : item.severity === "Medium"
                      ? "3px solid var(--orange)"
                      : "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <Badge severity={item.severity}>
                        {item.severity}
                      </Badge>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 15,
                          fontWeight: 600,
                          textDecoration: isResolved ? "line-through" : "none",
                        }}
                      >
                        {item.title}
                      </h3>
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-mono)",
                        marginBottom: 10,
                      }}
                    >
                      {item.filePath}
                      {item.lineNumber ? `:${item.lineNumber}` : ""}
                    </div>

                    <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      {item.description}
                    </p>

                    {item.codeSnippet && (
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
                          margin: "0 0 12px",
                        }}
                      >
                        <code>{item.codeSnippet}</code>
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
                      {item.recommendation}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item.id, item.status)}
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
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Check size={13} />
                    {isResolved ? "Resolved" : "Mark Resolved"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}