import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Search,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Check,
} from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { StatCard } from "../components/common/StatCard";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { api } from "../services/api";
import type { AnalysisResultsData } from "../types";

export default function AnalysisResults() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<AnalysisResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [severityFilter, setSeverityFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  const fetchResults = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAnalysisResults(id);
      setData(res);
      if (res.findings && res.findings.length > 0) {
        setExpandedIssue(res.findings[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load analysis findings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [id]);

  const handleToggleStatus = async (findingId: string, currentStatus?: string) => {
    const newStatus = currentStatus === "resolved" ? "open" : "resolved";
    try {
      await api.updateFindingStatus(findingId, newStatus);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          findings: prev.findings.map((f) =>
            f.id === findingId ? { ...f, status: newStatus } : f
          ),
        };
      });
    } catch (err) {
      console.error("Failed to update finding status:", err);
    }
  };

  const findings = data?.findings || [];

  const filteredFindings = findings.filter((finding) => {
    const matchesCat = activeCategory === "All" || finding.category === activeCategory;
    const matchesSev = severityFilter === "All" || finding.severity === severityFilter;
    const matchesSearch =
      finding.title.toLowerCase().includes(search.toLowerCase()) ||
      finding.filePath.toLowerCase().includes(search.toLowerCase()) ||
      finding.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSev && matchesSearch;
  });

  const criticalCount = findings.filter((f) => f.severity === "Critical").length;
  const highCount = findings.filter((f) => f.severity === "High").length;
  const mediumCount = findings.filter((f) => f.severity === "Medium").length;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <button
        onClick={() => navigate("/app/history")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--text-secondary)",
          fontSize: 13,
          marginBottom: 16,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Scan History</span>
      </button>

      <PageHeader
        eyebrow="AUDIT RESULTS & FINDINGS"
        title={data ? `${data.projectName} — Analysis Report` : "Analysis Findings"}
        description={`Job ID: ${id || "N/A"} · Analyzed ${data?.totalFiles ?? 0} files (${data?.totalLines ?? 0} lines of code).`}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={14} />}
              onClick={() => navigate("/app/reports")}
            >
              Export Report
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Sparkles size={14} />}
              onClick={() => navigate("/app/projects/upload")}
            >
              Re-Scan Codebase
            </Button>
          </div>
        }
      />

      {/* ERROR STATE */}
      {error && (
        <div
          className="mx-card"
          style={{
            padding: 24,
            marginBottom: 24,
            borderColor: "var(--danger)",
            background: "rgba(239, 68, 68, 0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AlertTriangle color="var(--danger)" size={20} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: "var(--danger)", fontSize: 14 }}>
                Failed to load scan findings
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>
                {error}
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchResults}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* LOADING SKELETON */}
      {loading && (
        <div style={{ padding: 60, textAlign: "center", color: "var(--text-secondary)" }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 16px" }} />
          <div>Retrieving verified findings and contracts from backend...</div>
        </div>
      )}

      {!loading && data && (
        <>
          {/* STATS OVERVIEW */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              marginBottom: 28,
            }}
          >
            <StatCard
              label="Overall Health Score"
              value={`${data.score}/100`}
              detail={data.score >= 80 ? "Healthy Architecture" : "Requires Attention"}
              icon={CheckCircle2}
              color={data.score >= 80 ? "green" : data.score >= 60 ? "orange" : "danger"}
            />
            <StatCard
              label="Critical Findings"
              value={criticalCount}
              detail="Urgent security vulnerabilities"
              icon={ShieldAlert}
              color="danger"
            />
            <StatCard
              label="High / Medium Issues"
              value={highCount + mediumCount}
              detail="Integration & contract risks"
              icon={AlertTriangle}
              color="orange"
            />
            <StatCard
              label="Total Discrepancies"
              value={data.totalIssues}
              detail="Across all inspection rules"
              icon={FileCode2}
              color="purple"
            />
          </div>

          {/* CATEGORY FILTER TABS */}
          <div
            style={{
              display: "flex",
              gap: 8,
              borderBottom: "1px solid var(--border)",
              marginBottom: 24,
              overflowX: "auto",
              paddingBottom: 2,
            }}
          >
            {["All", "Security", "Integration", "Dependencies", "Configuration"].map((cat) => {
              const count =
                cat === "All"
                  ? findings.length
                  : findings.filter((f) => f.category === cat).length;

              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: "10px 16px",
                    background: "none",
                    border: "none",
                    borderBottom: active ? "2px solid var(--accent-lime)" : "2px solid transparent",
                    color: active ? "var(--text-primary)" : "var(--text-muted)",
                    fontWeight: active ? 600 : 500,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>{cat}</span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "1px 6px",
                      borderRadius: 99,
                      background: active ? "var(--accent-subtle)" : "var(--bg-card-hover)",
                      color: active ? "var(--accent-lime)" : "var(--text-muted)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
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
                minWidth: 280,
              }}
            >
              <Search size={14} color="var(--text-muted)" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search issues, file paths, or recommendations..."
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
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="mx-input"
                style={{ width: 140, padding: "6px 10px", fontSize: 12 }}
              >
                <option value="All">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* FINDINGS LIST */}
          {findings.length === 0 ? (
            <div
              className="mx-card"
              style={{
                padding: 48,
                textAlign: "center",
                background: "rgba(196, 247, 91, 0.03)",
                border: "1px solid var(--accent-border)",
              }}
            >
              <CheckCircle2 size={40} color="var(--accent-lime)" style={{ margin: "0 auto 16px" }} />
              <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>
                Clean Architecture — No Discrepancies Found!
              </h3>
              <p style={{ margin: "0 auto 20px", maxWidth: 480, fontSize: 13, color: "var(--text-secondary)" }}>
                The automated AST engine verified route declarations, security patterns, and manifest dependencies. No critical issues were detected in this codebase.
              </p>
              <Button variant="secondary" size="sm" onClick={() => navigate("/app/projects")}>
                Return to Workspace Projects
              </Button>
            </div>
          ) : filteredFindings.length === 0 ? (
            <EmptyState
              title="No findings match your filter"
              description="Adjust your search term or category filters to inspect other audit findings."
              actionText="Reset Filters"
              onAction={() => {
                setActiveCategory("All");
                setSeverityFilter("All");
                setSearch("");
              }}
            />
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {filteredFindings.map((finding) => {
                const isExpanded = expandedIssue === finding.id;
                const isResolved = finding.status === "resolved";

                return (
                  <div
                    key={finding.id}
                    className="mx-card"
                    style={{
                      padding: 20,
                      opacity: isResolved ? 0.6 : 1,
                      transition: "all var(--transition-fast)",
                      border: isExpanded
                        ? "1px solid var(--accent-border)"
                        : "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setExpandedIssue(isExpanded ? null : finding.id)
                      }
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                        <button
                          type="button"
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            padding: 0,
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>

                        <Badge severity={finding.severity}>
                          {finding.severity}
                        </Badge>

                        <div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: isResolved ? "var(--text-muted)" : "var(--text-primary)",
                              textDecoration: isResolved ? "line-through" : "none",
                            }}
                          >
                            {finding.title}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--text-muted)",
                              fontFamily: "var(--font-mono)",
                              marginTop: 2,
                            }}
                          >
                            {finding.filePath}
                            {finding.lineNumber ? `:${finding.lineNumber}` : ""}
                            {" · "}
                            {finding.category}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12 }} onClick={(e) => e.stopPropagation()}>
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

                    {/* EXPANDED DETAILS */}
                    {isExpanded && (
                      <div
                        style={{
                          marginTop: 18,
                          paddingTop: 16,
                          borderTop: "1px solid var(--border)",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 13,
                            color: "var(--text-secondary)",
                            lineHeight: 1.6,
                            marginBottom: 16,
                          }}
                        >
                          {finding.description}
                        </p>

                        {/* CODE EVIDENCE SNIPPET */}
                        {finding.codeSnippet && (
                          <div style={{ marginBottom: 16 }}>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "var(--text-muted)",
                                marginBottom: 6,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Code Evidence (Masked & Redacted)
                            </div>
                            <pre
                              style={{
                                background: "#0a0e14",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--radius-sm)",
                                padding: "12px 16px",
                                fontFamily: "var(--font-mono)",
                                fontSize: 12,
                                color: "#f8fafc",
                                overflowX: "auto",
                                margin: 0,
                                lineHeight: 1.5,
                              }}
                            >
                              <code>{finding.codeSnippet}</code>
                            </pre>
                          </div>
                        )}

                        {/* RECOMMENDATION BOX */}
                        <div
                          style={{
                            background: "rgba(196, 247, 91, 0.04)",
                            border: "1px solid var(--accent-border)",
                            borderRadius: "var(--radius-sm)",
                            padding: "14px 16px",
                            marginBottom: 12,
                          }}
                        >
                          <strong
                            style={{
                              display: "block",
                              fontSize: 12,
                              color: "var(--accent-lime)",
                              marginBottom: 4,
                            }}
                          >
                            Recommended Fix:
                          </strong>
                          <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                            {finding.recommendation}
                          </span>
                        </div>

                        {finding.impact && (
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            <strong>Impact:</strong> {finding.impact}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}