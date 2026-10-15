import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Code2,
  ScanSearch,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { StatCard } from "../components/common/StatCard";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { api } from "../services/api";

export default function ProjectDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<"overview" | "scans" | "config">("overview");

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProject = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProject(id);
      setProject(data);
    } catch (err: any) {
      setError(err.message || "Failed to load project details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 60, textAlign: "center", color: "var(--text-secondary)" }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
        <div>Loading project metadata...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <button
          onClick={() => navigate("/app/projects")}
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
          <span>Back to all projects</span>
        </button>

        <div
          className="mx-card"
          style={{
            padding: 32,
            textAlign: "center",
            borderColor: "var(--danger)",
          }}
        >
          <AlertTriangle color="var(--danger)" size={32} style={{ margin: "0 auto 12px" }} />
          <h3 style={{ margin: "0 0 8px" }}>Project Not Found</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 16 }}>
            {error || `Project '${id}' could not be located in this workspace.`}
          </p>
          <Button variant="secondary" size="sm" onClick={() => navigate("/app/projects")}>
            Return to Projects
          </Button>
        </div>
      </div>
    );
  }

  const pastScans = project.recentScans || [];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <button
        onClick={() => navigate("/app/projects")}
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
        <span>Back to all projects</span>
      </button>

      <PageHeader
        eyebrow={`PROJECT ID: ${project.id}`}
        title={project.name}
        description={project.description || "Software repository configured for automated AST analysis and contract matching."}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <Button
              variant="secondary"
              size="sm"
              icon={<UploadCloud size={14} />}
              onClick={() => navigate("/app/projects/upload")}
            >
              Upload New Revision
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<ScanSearch size={14} />}
              onClick={() => {
                sessionStorage.setItem("mergex_selected_project", project.id);
                navigate("/app/projects/upload");
              }}
            >
              Trigger Full Scan
            </Button>
          </div>
        }
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
          label="Health Score"
          value={`${project.healthScore || 100}/100`}
          detail={project.healthScore >= 80 ? "Passing quality threshold" : "Review flagged issues"}
          icon={CheckCircle2}
          color={project.healthScore >= 80 ? "green" : "orange"}
        />
        <StatCard
          label="Detected Issues"
          value={project.issues}
          detail="Across integration & security"
          icon={AlertTriangle}
          color={project.issues > 0 ? "danger" : "green"}
        />
        <StatCard
          label="Total Code Files"
          value={project.totalFiles || "Indexed"}
          detail="Source files inspected"
          icon={Code2}
          color="purple"
        />
        <StatCard
          label="Validation Status"
          value={project.status}
          detail="Pipeline completion state"
          icon={Clock}
          color="accent"
        />
      </div>

      {/* TABS */}
      <div
        style={{
          display: "flex",
          gap: 8,
          borderBottom: "1px solid var(--border)",
          marginBottom: 24,
        }}
      >
        {[
          { id: "overview", label: "Overview & Stack" },
          { id: "scans", label: `Audit Scans (${pastScans.length})` },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "10px 16px",
                background: "none",
                border: "none",
                borderBottom: active ? "2px solid var(--accent-lime)" : "2px solid transparent",
                color: active ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: active ? 600 : 500,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "grid", gap: 20 }}>
          <div className="mx-card" style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600 }}>Detected Technologies & Frameworks</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {project.technology && project.technology.length > 0 ? (
                project.technology.map((tech: string) => (
                  <span
                    key={tech}
                    style={{
                      fontSize: 12,
                      padding: "4px 10px",
                      borderRadius: 6,
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {tech}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>General Software Repository</span>
              )}
            </div>

            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              First analyzed on <strong>{project.date}</strong>. {project.totalLines ? `Contains approximately ${project.totalLines} lines of source code across ${project.totalFiles} indexed files.` : ""}
            </p>
          </div>
        </div>
      )}

      {activeTab === "scans" && (
        <div className="mx-card" style={{ padding: 20 }}>
          {pastScans.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
              No previous audit scans found for this project.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {pastScans.map((scan: any) => (
                <div
                  key={scan.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    background: "var(--bg-elevated)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/app/results/${scan.id}`)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <ScanSearch size={18} color="var(--accent-lime)" />
                    <div>
                      <strong style={{ fontSize: 13 }}>Scan {scan.id}</strong>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {scan.date} · Duration: {scan.duration}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <Badge variant={scan.status === "completed" ? "success" : "warning"}>
                      {scan.status}
                    </Badge>
                    <ArrowUpRight size={15} color="var(--text-muted)" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}