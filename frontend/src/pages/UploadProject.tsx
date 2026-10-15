import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FileArchive,
  AlertTriangle,
  ArrowLeft,
  X,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { Button } from "../components/common/Button";
import { api } from "../services/api";

export default function UploadProject() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [projectName, setProjectName] = useState<string>(() => {
    const raw = sessionStorage.getItem("mergex_analysis_config");
    if (raw) {
      try {
        const config = JSON.parse(raw);
        if (config.projectName) return config.projectName;
      } catch {
        // Fallback
      }
    }
    return "";
  });
  const [description, setDescription] = useState("");

  const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

  function validateFile(selectedFile: File) {
    setError("");

    if (!selectedFile.name.toLowerCase().endsWith(".zip")) {
      setFile(null);
      setError("Please select a valid .ZIP archive containing your project files.");
      return;
    }

    if (selectedFile.size > MAX_SIZE) {
      setFile(null);
      setError("Project archive exceeds maximum size limit (100 MB).");
      return;
    }

    if (selectedFile.size === 0) {
      setFile(null);
      setError("The selected archive is empty.");
      return;
    }

    setFile(selectedFile);
    if (!projectName) {
      // Suggest clean name based on file stem
      const stem = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setProjectName(stem.charAt(0).toUpperCase() + stem.slice(1));
    }
  }

  async function handleStartScan() {
    if (!file) {
      setError("Please select your project ZIP file first.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const finalName = projectName.trim() || file.name.replace(/\.[^/.]+$/, "");
      const res = await api.uploadProjectZip(file, finalName, description.trim());
      
      // Navigate directly to the real job progression view
      navigate(`/app/analysis/${res.jobId}`);
    } catch (err: any) {
      setError(err.message || "Failed to upload and extract project archive. Please try again.");
      setUploading(false);
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
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
        <span>Back to projects</span>
      </button>

      <PageHeader
        eyebrow="PROJECT INGESTION"
        title="Upload Project Codebase"
        description="Upload a software repository ZIP archive. The backend will safely extract and run multi-layer AST inspection, route matching, and security checks."
      />

      <div className="mx-card" style={{ padding: 32 }}>
        {/* PROJECT METADATA INPUTS */}
        <div style={{ marginBottom: 24, display: "grid", gap: 16 }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 6,
              }}
            >
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. AI SaaS Dashboard"
              className="mx-input"
              style={{ width: "100%", padding: "8px 12px", fontSize: 13 }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 6,
              }}
            >
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Full-stack React + FastAPI repository"
              className="mx-input"
              style={{ width: "100%", padding: "8px 12px", fontSize: 13 }}
            />
          </div>
        </div>

        {/* DRAG AND DROP ZONE */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const dropped = e.dataTransfer.files[0];
            if (dropped) validateFile(dropped);
          }}
          style={{
            border: `2px dashed ${dragging ? "var(--accent-lime)" : file ? "rgba(196, 247, 91, 0.4)" : "var(--border)"}`,
            borderRadius: "var(--radius-md)",
            background: dragging ? "rgba(196, 247, 91, 0.05)" : "var(--bg-elevated)",
            padding: "40px 24px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all var(--transition-fast)",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--accent-subtle)",
              border: "1px solid var(--accent-border)",
              color: "var(--accent-lime)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <UploadCloud size={28} />
          </div>

          <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>
            {file ? file.name : "Drag & drop your project ZIP here"}
          </h3>

          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
            {file
              ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · Ready to inspect`
              : "Supports full repository exports containing frontend & backend folders"}
          </p>

          <span
            style={{
              display: "inline-block",
              marginTop: 12,
              fontSize: 11,
              color: "var(--text-muted)",
              letterSpacing: "0.5px",
            }}
          >
            ZIP Archive · Maximum 100 MB · Safe sandbox extraction
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          style={{ display: "none" }}
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) validateFile(selected);
            e.target.value = "";
          }}
        />

        {error && (
          <div
            style={{
              padding: "12px 14px",
              marginTop: 16,
              background: "var(--danger-subtle)",
              border: "1px solid var(--danger-border)",
              color: "var(--danger)",
              borderRadius: "var(--radius-sm)",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {file && !error && (
          <div
            style={{
              marginTop: 20,
              padding: "14px 18px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--accent-border)",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <FileArchive size={20} color="var(--accent-lime)" />
              <div>
                <strong style={{ fontSize: 13, display: "block" }}>{file.name}</strong>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {(file.size / (1024 * 1024)).toFixed(2)} MB · Valid archive structure
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              style={{
                color: "var(--text-muted)",
                padding: 4,
                cursor: "pointer",
                background: "none",
                border: "none",
              }}
              title="Remove file"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28 }}>
          <Button
            variant="ghost"
            onClick={() => navigate("/app/projects")}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            size="lg"
            disabled={!file || uploading}
            loading={uploading}
            icon={uploading ? undefined : <Sparkles size={16} />}
            onClick={handleStartScan}
          >
            {uploading ? "Uploading & Analyzing..." : "Start Automated Validation"}
          </Button>
        </div>
      </div>
    </div>
  );
}