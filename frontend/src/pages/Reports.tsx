import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileBarChart,
  ShieldCheck,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { StatCard } from "../components/common/StatCard";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { api } from "../services/api";
import type { ReportItem } from "../types";

export default function Reports() {
  const navigate = useNavigate();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getReports();
      setReports(data);
    } catch (err: any) {
      setError(err.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDownload = (report: ReportItem) => {
    // Generate real downloadable JSON export of report
    const content = JSON.stringify(report, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.id}_${report.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.project.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "All" || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        eyebrow="AUDIT COMPLIANCE & EXPORTS"
        title="Audit Reports"
        description="Download and inspect generated verification reports, AST coverage assessments, and vulnerability summaries."
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Sparkles size={14} />}
            onClick={() => navigate("/app/history")}
          >
            Generate from Scan History
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
          <Button variant="secondary" size="sm" onClick={loadReports}>
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
          label="Generated Reports"
          value={loading ? "..." : reports.length}
          detail="Available for download"
          icon={FileBarChart}
          color="purple"
        />
        <StatCard
          label="Full System Audits"
          value={loading ? "..." : reports.filter((r) => r.type === "Full Audit").length}
          detail="End-to-end AST validations"
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          label="Security Summaries"
          value={loading ? "..." : reports.filter((r) => r.type === "Security").length}
          detail="Vulnerability & secret assessments"
          icon={ShieldCheck}
          color="orange"
        />
        <StatCard
          label="Integration Reports"
          value={loading ? "..." : reports.filter((r) => r.type === "Integration").length}
          detail="Route contract compatibility"
          icon={Clock}
          color="accent"
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
            placeholder="Search reports by title or project..."
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="mx-input"
            style={{ width: 150, padding: "6px 10px", fontSize: 12 }}
          >
            <option value="All">All Categories</option>
            <option value="Full Audit">Full Audit</option>
            <option value="Security">Security</option>
            <option value="Integration">Integration</option>
            <option value="Dependencies">Dependencies</option>
          </select>

          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}
            onClick={loadReports}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          <div>Retrieving persisted reports from backend...</div>
        </div>
      )}

      {/* EMPTY STATES / CARDS */}
      {!loading && !error && reports.length === 0 && (
        <EmptyState
          title="No reports generated yet"
          description="Reports are automatically compiled upon scan completion. Upload a codebase to generate your first audit report."
          actionText="Upload Codebase"
          onAction={() => navigate("/app/projects/upload")}
        />
      )}

      {!loading && !error && reports.length > 0 && filteredReports.length === 0 && (
        <EmptyState
          title="No reports match your search"
          description="Try adjusting your query or category filter."
          actionText="Reset Filters"
          onAction={() => {
            setSearch("");
            setTypeFilter("All");
          }}
        />
      )}

      {!loading && !error && filteredReports.length > 0 && (
        <div style={{ display: "grid", gap: 14 }}>
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="mx-card"
              style={{
                padding: "18px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-elevated)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-lime)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <FileBarChart size={20} />
                </div>

                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{report.name}</h3>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 4,
                    }}
                  >
                    <span>{report.project}</span>
                    <span>·</span>
                    <span>{report.date}</span>
                    <span>·</span>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{report.fileSize}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ textAlign: "right" }}>
                  <Badge variant={report.score >= 80 ? "success" : "warning"}>
                    {report.score}/100
                  </Badge>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    {report.issues} {report.issues === 1 ? "issue" : "issues"} flagged
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Download size={14} />}
                  onClick={() => handleDownload(report)}
                >
                  Download JSON
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}