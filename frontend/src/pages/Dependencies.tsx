import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  Package,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Plus,
} from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { StatCard } from "../components/common/StatCard";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { api } from "../services/api";
import type { DependencyItem } from "../types";

export default function Dependencies() {
  const navigate = useNavigate();

  const [dependencies, setDependencies] = useState<DependencyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");

  const loadDependencies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAllDependencies();
      setDependencies(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dependencies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  const filtered = dependencies.filter((dep) => {
    const matchesSearch =
      dep.name.toLowerCase().includes(search.toLowerCase()) ||
      dep.license.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "All" || dep.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalDeps = dependencies.length;
  const directCount = dependencies.filter((d) => d.type === "direct").length;
  const devCount = dependencies.filter((d) => d.type === "dev").length;
  const outdatedCount = dependencies.filter((d) => d.status === "outdated" || d.status === "vulnerable").length;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        eyebrow="DEPENDENCY AUDIT & COMPLIANCE"
        title="Package Dependencies"
        description="Software bill of materials (SBOM) extracted from package.json, requirements.txt, and project manifests."
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => navigate("/app/projects/upload")}
          >
            Upload Project
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
          <Button variant="secondary" size="sm" onClick={loadDependencies}>
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
          label="Total Packages"
          value={loading ? "..." : totalDeps}
          detail="Declared across manifests"
          icon={Package}
          color="purple"
        />
        <StatCard
          label="Direct Dependencies"
          value={loading ? "..." : directCount}
          detail="Runtime requirements"
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          label="Dev Dependencies"
          value={loading ? "..." : devCount}
          detail="Build, lint, and test tools"
          icon={Zap}
          color="accent"
        />
        <StatCard
          label="Unpinned / Outdated"
          value={loading ? "..." : outdatedCount}
          detail="Version drift or wildcards"
          icon={AlertTriangle}
          color={outdatedCount > 0 ? "orange" : "green"}
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
            placeholder="Search packages by name or license..."
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="mx-input"
            style={{ width: 140, padding: "6px 10px", fontSize: 12 }}
          >
            <option value="All">All Types</option>
            <option value="direct">Direct</option>
            <option value="dev">Dev</option>
            <option value="peer">Peer</option>
          </select>

          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}
            onClick={loadDependencies}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
          <div>Parsing manifest inventory...</div>
        </div>
      )}

      {/* EMPTY STATES / TABLE */}
      {!loading && !error && dependencies.length === 0 && (
        <EmptyState
          title="No package manifests detected"
          description="Upload a software project archive containing package.json, requirements.txt, or pyproject.toml to extract your dependency bill of materials."
          actionText="Upload Project Codebase"
          onAction={() => navigate("/app/projects/upload")}
        />
      )}

      {!loading && !error && dependencies.length > 0 && filtered.length === 0 && (
        <EmptyState
          title="No dependencies match your search"
          description="Try adjusting your query or type filter."
          actionText="Clear Filters"
          onAction={() => {
            setSearch("");
            setFilterType("All");
          }}
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="mx-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>PACKAGE NAME</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>INSTALLED VERSION</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>TYPE</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>STATUS</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>MANIFEST</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>LICENSE</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((dep, idx) => (
                  <tr key={dep.id || `${dep.name}-${idx}`} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {dep.name}
                    </td>
                    <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)" }}>
                      {dep.version}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          color: "var(--text-secondary)",
                          textTransform: "uppercase",
                        }}
                      >
                        {dep.type}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <Badge variant={dep.status === "secure" ? "success" : "warning"}>
                        {dep.status}
                      </Badge>
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                      {dep.manifestFile || "package.json"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>
                      {dep.license}
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