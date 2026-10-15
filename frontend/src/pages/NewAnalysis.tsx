import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Workflow,
  ShieldCheck,
  Zap,
  Code2,
} from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { Button } from "../components/common/Button";

export default function NewAnalysis() {
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState("");
  const [techStack, setTechStack] = useState("Full-Stack (React + Python)");
  const [strictness, setStrictness] = useState("Strict");

  const [modules, setModules] = useState({
    integration: true,
    security: true,
    dependencies: true,
  });

  const toggleModule = (key: keyof typeof modules) => {
    setModules((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      window.alert("Please provide a project name.");
      return;
    }

    sessionStorage.setItem(
      "mergex_analysis_config",
      JSON.stringify({
        projectName: projectName.trim(),
        techStack,
        strictness,
        modules,
        timestamp: new Date().toISOString(),
      })
    );

    navigate("/app/projects/upload");
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <PageHeader
        eyebrow="MULTI-TIER VALIDATION"
        title="Configure New Analysis"
        description="Select the validation modules and rule presets to inspect your application layers."
      />

      <form onSubmit={handleContinue} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* STEP 1: PROJECT DETAILS */}
        <div className="mx-card" style={{ padding: 24 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Code2 size={18} color="var(--accent)" />
            1. Target Application
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label
                htmlFor="analysis-project-name"
                style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}
              >
                Project Name
              </label>
              <input
                id="analysis-project-name"
                className="mx-input"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. AI SaaS Platform"
                required
              />
            </div>

            <div>
              <label
                htmlFor="analysis-tech-stack"
                style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}
              >
                Technology Preset
              </label>
              <select
                id="analysis-tech-stack"
                className="mx-input"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
              >
                <option value="React + FastAPI (Python)">React 19 + FastAPI (Python)</option>
                <option value="React + Node.js (Express)">React + Node.js (Express)</option>
                <option value="Next.js Fullstack">Next.js App Router (Fullstack)</option>
                <option value="Vue + Django (Python)">Vue + Django REST Framework</option>
                <option value="Mixed / Polyglot Stack">Mixed / Polyglot Stack</option>
              </select>
            </div>
          </div>
        </div>

        {/* STEP 2: MODULES SELECTION */}
        <div className="mx-card" style={{ padding: 24 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Workflow size={18} color="var(--accent)" />
            2. Validation Modules
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label
              style={{
                display: "flex",
                gap: 14,
                padding: 16,
                borderRadius: "var(--radius-sm)",
                background: modules.integration ? "var(--bg-elevated)" : "transparent",
                border: modules.integration ? "1px solid var(--accent-border)" : "1px solid var(--border)",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
            >
              <input
                type="checkbox"
                checked={modules.integration}
                onChange={() => toggleModule("integration")}
                style={{ accentColor: "var(--accent)", marginTop: 3 }}
              />
              <div>
                <strong style={{ fontSize: 14, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Workflow size={15} color="var(--accent)" />
                  Integration & Route Contract Intelligence
                </strong>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  Parses frontend API call routes (fetch, axios) and cross-references against backend endpoint decorators (FastAPI, Express) for missing routes or parameter mismatches.
                </p>
              </div>
            </label>

            <label
              style={{
                display: "flex",
                gap: 14,
                padding: 16,
                borderRadius: "var(--radius-sm)",
                background: modules.security ? "var(--bg-elevated)" : "transparent",
                border: modules.security ? "1px solid var(--accent-border)" : "1px solid var(--border)",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
            >
              <input
                type="checkbox"
                checked={modules.security}
                onChange={() => toggleModule("security")}
                style={{ accentColor: "var(--accent)", marginTop: 3 }}
              />
              <div>
                <strong style={{ fontSize: 14, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                  <ShieldCheck size={15} color="var(--accent)" />
                  Code Security & Secret Scanning
                </strong>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  Detects committed tokens, hardcoded database credentials, SQL injection surfaces, and permissive CORS configurations.
                </p>
              </div>
            </label>

            <label
              style={{
                display: "flex",
                gap: 14,
                padding: 16,
                borderRadius: "var(--radius-sm)",
                background: modules.dependencies ? "var(--bg-elevated)" : "transparent",
                border: modules.dependencies ? "1px solid var(--accent-border)" : "1px solid var(--border)",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
            >
              <input
                type="checkbox"
                checked={modules.dependencies}
                onChange={() => toggleModule("dependencies")}
                style={{ accentColor: "var(--accent)", marginTop: 3 }}
              />
              <div>
                <strong style={{ fontSize: 14, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Zap size={15} color="var(--accent)" />
                  Dependency Health & Compatibility
                </strong>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  Inspects package.json, requirements.txt, and lockfiles to detect known CVEs, license risks, and version incompatibilities.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* STEP 3: STRICTNESS LEVEL */}
        <div className="mx-card" style={{ padding: 24 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>
            3. Rule Enforcement Level
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button
              type="button"
              onClick={() => setStrictness("Standard")}
              style={{
                padding: 14,
                textAlign: "left",
                borderRadius: "var(--radius-sm)",
                background: strictness === "Standard" ? "var(--accent-subtle)" : "var(--bg-elevated)",
                border: strictness === "Standard" ? "1px solid var(--accent-border)" : "1px solid var(--border)",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
            >
              <strong style={{ fontSize: 13, display: "block" }}>Standard Rules</strong>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Flags critical contract breaks and secrets</span>
            </button>

            <button
              type="button"
              onClick={() => setStrictness("Strict")}
              style={{
                padding: 14,
                textAlign: "left",
                borderRadius: "var(--radius-sm)",
                background: strictness === "Strict" ? "var(--accent-subtle)" : "var(--bg-elevated)",
                border: strictness === "Strict" ? "1px solid var(--accent-border)" : "1px solid var(--border)",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
            >
              <strong style={{ fontSize: 13, display: "block" }}>Strict Production</strong>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Requires typed query contracts and zero warnings</span>
            </button>
          </div>
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/app/projects")}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={<ArrowRight size={16} />}
          >
            Continue to Project Upload
          </Button>
        </div>
      </form>
    </div>
  );
}