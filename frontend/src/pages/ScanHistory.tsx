import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  ArrowUpRight,
  ScanSearch,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { StatCard } from "../components/common/StatCard";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { api } from "../services/api";
import type { ScanRecord } from "../types";

export default function ScanHistory() {
  const navigate = useNavigate();

  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getScanHistory();
      setScans(data);
    } catch (err: any) {
      setError(err.message || "Failed to load scan history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredScans = scans.filter((scan) => {
    const matchesSearch =
      scan.project.toLowerCase().includes(search.toLowerCase()) ||
      scan.id.toLowerCase().includes(search.toLowerCase()) ||
      scan.type.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || scan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const completedCount = scans.filter((s) => s.status === "Completed").length;
  const failedCount = scans.filter((s) => s.status === "Failed").length;
  const scores = scans.filter((s) => s.score !== undefined && s.score !== null).map((s) => s.score as number);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        eyebrow="AUDIT TRAIL"
        title="Scan History"
        description="Chronological log of multi-layer AST validations, contract matches, and vulnerability checks."
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => navigate("/app/projects/upload")}
          >
            New Codebase Scan
          </Button>
        }
      />

      {/* ERROR STATE */}
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
          <Button variant="secondary" size="sm" onClick={loadHistory}>
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
          label="Total Scans"
          value={loading ? "..." : scans.length}
          detail="Historical runs recorded"
          icon={ScanSearch}
          color="purple"
        />
        <StatCard
          label="Completed"
          value={loading ? "..." : completedCount}
          detail="Full audits finished"
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          label="Failed"
          value={loading ? "..." : failedCount}
          detail="Execution errors or timeouts"
          icon={XCircle}
          color="danger"
        />
        <StatCard
          label="Average Health Score"
          value={loading ? "..." : avgScore !== null ? `${avgScore}/100` : "N/A"}
          detail={avgScore !== null ? "Across completed scans" : "Awaiting scans"}
          icon={AlertTriangle}
          color="orange"
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
            placeholder="Search by project name or scan ID..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mx-input"
            style={{ width: 140, padding: "6px 10px", fontSize: 12 }}
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Failed">Failed</option>
          </select>
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}
            onClick={loadHistory}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          <div>Loading historical records...</div>
        </div>
      )}

      {/* EMPTY STATES / TABLE */}
      {!loading && !error && scans.length === 0 && (
        <EmptyState
          title="No scans executed yet"
          description="Upload your project code to run AST inspection and generate your first audit record."
          actionText="Upload Project ZIP"
          onAction={() => navigate("/app/projects/upload")}
        />
      )}

      {!loading && !error && scans.length > 0 && filteredScans.length === 0 && (
        <EmptyState
          title="No scan records match filter"
          description="Try adjusting your status filter or search query."
          actionText="Clear Filters"
          onAction={() => {
            setSearch("");
            setStatusFilter("All");
          }}
        />
      )}

      {!loading && !error && filteredScans.length > 0 && (
        <div className="mx-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>SCAN ID</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>PROJECT</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>AUDIT TYPE</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>STATUS</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>SCORE</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>DURATION</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>TIMESTAMP</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--text-muted)", fontWeight: 600 }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredScans.map((scan) => (
                  <tr
                    key={scan.id}
                    style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                    onClick={() => navigate(`/app/results/${scan.id}`)}
                    className="hover-bg"
                  >
                    <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--accent-lime)" }}>
                      {scan.id}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 600 }}>{scan.project}</td>
                    <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>{scan.type}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <Badge variant={scan.status === "Completed" ? "success" : scan.status === "Failed" ? "critical" : "warning"}>
                        {scan.status}
                      </Badge>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {scan.score !== undefined && scan.score !== null ? (
                        <strong style={{ color: scan.score >= 80 ? "var(--accent-lime)" : "var(--orange)" }}>
                          {scan.score}/100
                        </strong>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--text-muted)" }}>{scan.duration}</td>
                    <td style={{ padding: "14px 16px", color: "var(--text-muted)" }}>{scan.date}</td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--accent-lime)", fontSize: 12 }}>
                        <span>Results</span>
                        <ArrowUpRight size={14} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}