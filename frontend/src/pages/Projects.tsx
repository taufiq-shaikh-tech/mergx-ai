import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Code2,
  FolderGit2,
  Plus,
  Search,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { StatCard } from "../components/common/StatCard";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { api } from "../services/api";
import type { Project } from "../types";

export default function Projects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || "Failed to load projects from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.description.toLowerCase().includes(search.toLowerCase()) ||
        project.id.toLowerCase().includes(search.toLowerCase()) ||
        project.technology.some((tech) =>
          tech.toLowerCase().includes(search.toLowerCase())
        );

      const matchesFilter = filter === "All" || project.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [projects, search, filter]);

  const completedCount = projects.filter((p) => p.status === "Completed").length;
  const inProgressCount = projects.filter((p) => p.status === "In Progress").length;
  const totalIssues = projects.reduce((total, p) => total + (p.issues || 0), 0);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        eyebrow="WORKSPACE PROJECTS"
        title="My Projects"
        description="Inspect codebases, launch integration scans, and monitor validation status across your applications."
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <Button
              variant="secondary"
              size="sm"
              icon={<UploadCloud size={14} />}
              onClick={() => navigate("/app/projects/upload")}
            >
              Upload Project
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => navigate("/app/projects/upload")}
            >
              New Analysis
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
          label="Total Projects"
          value={loading ? "..." : projects.length}
          detail="Active in workspace"
          icon={FolderGit2}
          color="purple"
        />
        <StatCard
          label="Completed Scans"
          value={loading ? "..." : completedCount}
          detail="Analyzed repositories"
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          label="In Progress"
          value={loading ? "..." : inProgressCount}
          detail="Active analysis pipelines"
          icon={Clock}
          color="orange"
        />
        <StatCard
          label="Active Issues"
          value={loading ? "..." : totalIssues}
          detail="Discovered findings"
          icon={AlertTriangle}
          color="danger"
        />
      </div>

      {/* TOOLBAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
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
            placeholder="Search by project name or technology..."
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
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mx-input"
            style={{ width: 150, padding: "6px 10px", fontSize: 12 }}
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
            onClick={fetchProjects}
          >
            Refresh
          </Button>
        </div>
      </div>

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
                Failed to load projects
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>
                {error}
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchProjects}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          <div>Loading projects from backend...</div>
        </div>
      )}

      {/* PROJECTS GRID / EMPTY STATES */}
      {!loading && !error && projects.length === 0 && (
        <EmptyState
          title="No projects yet"
          description="Upload your first software project archive (.zip) to run automated AST contracts and security audits."
          actionText="Upload Project ZIP"
          onAction={() => navigate("/app/projects/upload")}
        />
      )}

      {!loading && !error && projects.length > 0 && filteredProjects.length === 0 && (
        <EmptyState
          title="No projects match your filter"
          description="Try adjusting your search query or status filter to see other workspace projects."
          actionText="Clear Filters"
          onAction={() => {
            setSearch("");
            setFilter("All");
          }}
        />
      )}

      {!loading && !error && filteredProjects.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: 20,
          }}
        >
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="mx-card"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: 24,
                cursor: "pointer",
              }}
              onClick={() => navigate(`/app/projects/${project.id}`)}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "var(--radius-sm)",
                        background: "var(--bg-card-hover)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--accent-lime)",
                      }}
                    >
                      <Code2 size={20} />
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 15,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {project.name}
                      </h3>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        ID: {project.id}
                      </span>
                    </div>
                  </div>

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
                </div>

                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    marginBottom: 16,
                  }}
                >
                  {project.description || "Uploaded project codebase."}
                </p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 20,
                  }}
                >
                  {project.technology.map((tech) => (
                    <span
                      key={tech}
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: "var(--bg-card-hover)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 16,
                  borderTop: "1px solid var(--border)",
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                <div>
                  Issues:{" "}
                  <strong
                    style={{
                      color:
                        project.issues > 0
                          ? "var(--danger)"
                          : "var(--text-primary)",
                    }}
                  >
                    {project.issues}
                  </strong>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span>{project.date}</span>
                  <ArrowUpRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}