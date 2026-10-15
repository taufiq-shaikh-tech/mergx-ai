import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Code2,
  FolderGit2,
  ScanSearch,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Workflow,
  Search,
  Plus,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { StatCard } from "../components/common/StatCard";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { api } from "../services/api";
import type { DashboardStats } from "../types";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const projects = stats?.recentProjects || [];
  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.technology && p.technology.some((t) => t.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <PageHeader
        eyebrow="ENGINEERING WORKSPACE"
        title="Workspace Overview"
        description="Monitor multi-layer software health, verify route integration contracts, and audit code security."
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <Button
              variant="secondary"
              size="sm"
              icon={<FolderGit2 size={14} />}
              onClick={() => navigate("/app/projects")}
            >
              All Projects
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => navigate("/app/projects/upload")}
            >
              Upload Codebase
            </Button>
          </div>
        }
      />

      {/* ERROR BANNER */}
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
          <Button variant="secondary" size="sm" onClick={loadStats}>
            Retry
          </Button>
        </div>
      )}

      {/* STATS ROW */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Active Projects"
          value={loading ? "..." : stats?.totalProjects ?? 0}
          detail="Monitored in this workspace"
          icon={FolderGit2}
          color="purple"
          onClick={() => navigate("/app/projects")}
        />
        <StatCard
          label="Architecture Scans"
          value={loading ? "..." : stats?.totalScans ?? 0}
          detail="Completed across codebases"
          icon={ScanSearch}
          color="accent"
          onClick={() => navigate("/app/history")}
        />
        <StatCard
          label="Security Findings"
          value={loading ? "..." : stats?.openIssues ?? 0}
          detail={
            stats?.criticalIssues
              ? `${stats.criticalIssues} critical vulnerabilities`
              : "Active findings"
          }
          icon={ShieldCheck}
          color="orange"
          onClick={() => navigate("/app/security")}
        />
        <StatCard
          label="Overall Health Score"
          value={loading ? "..." : stats?.averageScore !== null && stats?.averageScore !== undefined ? `${stats.averageScore}/100` : "N/A"}
          detail={
            stats?.averageScore !== null && stats?.averageScore !== undefined
              ? stats.averageScore >= 80
                ? "Optimal architecture"
                : "Issues flagged"
              : "Upload a project to compute"
          }
          icon={CheckCircle2}
          color="green"
          onClick={() => navigate("/app/reports")}
        />
      </div>

      {/* QUICK WORKFLOW BANNER */}
      <div
        className="mx-card"
        style={{
          marginBottom: 32,
          padding: "24px 28px",
          background: "linear-gradient(135deg, rgba(196, 247, 91, 0.08), rgba(17, 17, 19, 0.95))",
          borderColor: "rgba(196, 247, 91, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div style={{ maxWidth: 640 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--accent-lime)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "1px",
              marginBottom: 8,
            }}
          >
            <Zap size={13} />
            <span>AUTOMATED AST INTEGRATION & SECURITY SCANNER</span>
          </div>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700 }}>
            Inspect your frontend and backend connections with AST analysis.
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Upload project ZIP archives to cross-reference route parameters, detect leaked API secrets, and flag unpinned package dependencies.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Button
            variant="secondary"
            size="md"
            icon={<Workflow size={15} />}
            onClick={() => navigate("/app/integration")}
          >
            Route Contracts
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={15} />}
            onClick={() => navigate("/app/projects/upload")}
          >
            Upload Project ZIP
          </Button>
        </div>
      </div>

      {/* TWO COLUMN GRID: PROJECTS & RECENT ACTIVITY */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 24,
        }}
      >
        {/* PROJECTS SECTION */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Active Projects</h2>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                Codebases configured for analysis
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "4px 8px",
              }}
            >
              <Search size={13} color="var(--text-muted)" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter..."
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "var(--text-primary)",
                  fontSize: 11,
                  width: 90,
                }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
              <RefreshCw size={20} className="animate-spin" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 12 }}>Loading projects...</div>
            </div>
          ) : projects.length === 0 ? (
            <div
              className="mx-card"
              style={{
                padding: 32,
                textAlign: "center",
                background: "var(--bg-elevated)",
              }}
            >
              <FolderGit2 size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                No projects analyzed yet
              </div>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>
                Upload your first project ZIP archive to trigger automated AST code analysis.
              </p>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => navigate("/app/projects/upload")}
              >
                Upload Project
              </Button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="mx-card"
                  style={{
                    padding: 16,
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  onClick={() => navigate(`/app/projects/${project.id}`)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 6,
                        background: "var(--bg-card-hover)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--accent-lime)",
                      }}
                    >
                      <Code2 size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{project.name}</h3>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          display: "flex",
                          gap: 6,
                          marginTop: 3,
                        }}
                      >
                        <span>{project.technology.slice(0, 2).join(", ") || "Codebase"}</span>
                        <span>·</span>
                        <span>{project.date}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <Badge
                      variant={
                        project.status === "Completed"
                          ? "success"
                          : project.status === "In Progress"
                          ? "warning"
                          : "critical"
                      }
                    >
                      {project.status}
                    </Badge>
                    <div
                      style={{
                        fontSize: 11,
                        color: project.issues > 0 ? "var(--danger)" : "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      {project.issues} {project.issues === 1 ? "issue" : "issues"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECENT ACTIVITY SECTION */}
        <div>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Recent Scan Activity</h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
              Chronological log of analysis pipeline runs
            </p>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
              <RefreshCw size={20} className="animate-spin" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 12 }}>Loading activity...</div>
            </div>
          ) : !stats?.recentActivity || stats.recentActivity.length === 0 ? (
            <div
              className="mx-card"
              style={{
                padding: 32,
                textAlign: "center",
                background: "var(--bg-elevated)",
              }}
            >
              <Clock3 size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                No recent activity
              </div>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Start a scan to see audit events and pipeline logs here.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="mx-card"
                  style={{
                    padding: 16,
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  onClick={() => navigate(`/app/analysis/${activity.id}`)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 6,
                        background:
                          activity.status === "completed"
                            ? "rgba(196, 247, 91, 0.1)"
                            : "var(--bg-card-hover)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color:
                          activity.status === "completed"
                            ? "var(--accent-lime)"
                            : "var(--text-muted)",
                      }}
                    >
                      <ScanSearch size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{activity.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        {activity.description}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-muted)" }}>
                    <span>{activity.time}</span>
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}