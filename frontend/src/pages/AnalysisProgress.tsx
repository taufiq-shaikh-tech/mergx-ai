import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Code2,
  GitBranch,
  ShieldCheck,
  Terminal,
  Zap,
  ArrowRight,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { Button } from "../components/common/Button";
import { api } from "../services/api";
import type { AnalysisProgressData } from "../types";

export default function AnalysisProgress() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const logContainerRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<AnalysisProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    let timerId: any = null;

    const pollProgress = async () => {
      try {
        const result = await api.getAnalysisProgress(id);
        if (!isMounted) return;

        setData(result);
        setError(null);

        // Auto-scroll logs
        if (logContainerRef.current) {
          logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }

        // Keep polling if not finished
        if (result.status === "queued" || result.status === "processing") {
          timerId = setTimeout(pollProgress, 1200);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || "Unable to fetch live scan status.");
      }
    };

    pollProgress();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [id]);

  const stagesList = data?.stages && data.stages.length > 0 ? data.stages : [
    { id: "unpack", name: "AST Parsing & File Tree Indexing", status: data?.progress && data.progress > 20 ? "completed" : "running" },
    { id: "deps", name: "Dependency Health & Conflict Check", status: data?.progress && data.progress > 45 ? "completed" : data?.progress && data.progress > 20 ? "running" : "pending" },
    { id: "routes", name: "Frontend Route Contract Extraction", status: data?.progress && data.progress > 70 ? "completed" : data?.progress && data.progress > 45 ? "running" : "pending" },
    { id: "security", name: "OWASP Vulnerability & Secret Audit", status: data?.progress && data.progress > 90 ? "completed" : data?.progress && data.progress > 70 ? "running" : "pending" },
    { id: "complete", name: "Final Health Scoring & Report Generation", status: data?.status === "completed" ? "completed" : "pending" },
  ];

  const getStageIcon = (stageId: string) => {
    switch (stageId) {
      case "unpack":
        return Code2;
      case "routes":
        return GitBranch;
      case "security":
        return ShieldCheck;
      case "deps":
        return Zap;
      default:
        return Terminal;
    }
  };

  const isCompleted = data?.status === "completed";
  const isFailed = data?.status === "failed";
  const progressPercent = data?.progress ?? 15;

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <PageHeader
        eyebrow="MULTI-LAYER AST ANALYSIS"
        title={data?.projectName ? `Validating '${data.projectName}'` : "Analyzing Project Codebase"}
        description={`Job ID: ${id || "SCAN-ACTIVE"} · Live pipeline monitoring and contract verification.`}
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
            <XCircle color="var(--danger)" size={20} />
            <span style={{ fontSize: 13, color: "var(--danger)" }}>{error}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      )}

      {/* FAILED STATUS BANNER */}
      {isFailed && (
        <div
          className="mx-card"
          style={{
            padding: 20,
            marginBottom: 24,
            borderColor: "var(--danger)",
            background: "rgba(239, 68, 68, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <XCircle color="var(--danger)" size={24} />
            <div>
              <strong style={{ color: "var(--danger)", fontSize: 14 }}>Analysis Pipeline Failed</strong>
              <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
                {data?.errorMessage || "An unexpected error occurred during codebase parsing."}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROGRESS BAR & CURRENT STAGE */}
      <div className="mx-card" style={{ padding: 28, marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isCompleted ? (
              <CheckCircle2 color="var(--accent-lime)" size={20} />
            ) : isFailed ? (
              <XCircle color="var(--danger)" size={20} />
            ) : (
              <RefreshCw color="var(--accent-lime)" size={18} className="animate-spin" />
            )}
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {isCompleted
                ? "Inspection Complete!"
                : isFailed
                ? "Analysis Stopped"
                : data?.currentStage || "Analyzing Codebase..."}
            </span>
          </div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 16,
              fontWeight: 700,
              color: isCompleted ? "var(--accent-lime)" : "var(--text-primary)",
            }}
          >
            {progressPercent}%
          </span>
        </div>

        {/* PROGRESS TRACK */}
        <div
          style={{
            width: "100%",
            height: 8,
            background: "var(--bg-card-hover)",
            borderRadius: 99,
            overflow: "hidden",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              background: isFailed
                ? "var(--danger)"
                : "linear-gradient(90deg, var(--accent-lime), #84cc16)",
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {/* COMPLETION ACTION BAR */}
        {isCompleted && (
          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Health Score:{" "}
                <strong style={{ color: "var(--accent-lime)", fontSize: 15 }}>
                  {data?.score ?? 100}/100
                </strong>
                {" · "}
                Duration: <strong>{data?.duration}</strong>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={<ArrowRight size={16} />}
              onClick={() => navigate(`/app/results/${id}`)}
            >
              View Full Analysis Results
            </Button>
          </div>
        )}
      </div>

      {/* PIPELINE STAGES LIST */}
      <div className="mx-card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
          PIPELINE VALIDATION STAGES
        </h3>

        <div style={{ display: "grid", gap: 12 }}>
          {stagesList.map((stage: any, index: number) => {
            const Icon = getStageIcon(stage.id);
            const status = stage.status;

            return (
              <div
                key={stage.id || index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-sm)",
                  background:
                    status === "running"
                      ? "rgba(196, 247, 91, 0.05)"
                      : "var(--bg-elevated)",
                  border: `1px solid ${
                    status === "running"
                      ? "var(--accent-border)"
                      : "var(--border)"
                  }`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: "var(--bg-card)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color:
                        status === "completed"
                          ? "var(--accent-lime)"
                          : status === "running"
                          ? "var(--accent-lime)"
                          : "var(--text-muted)",
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{stage.name}</span>
                </div>

                <div>
                  {status === "completed" ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        color: "var(--accent-lime)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <CheckCircle2 size={15} /> Completed
                    </span>
                  ) : status === "running" ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        color: "var(--accent-lime)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <RefreshCw size={13} className="animate-spin" /> In Progress
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        color: "var(--text-muted)",
                        fontSize: 12,
                      }}
                    >
                      <Clock size={13} /> Queued
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LIVE ANALYSIS LOG CONSOLE */}
      <div className="mx-card" style={{ padding: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Terminal size={16} color="var(--accent-lime)" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Live AST Stream Logs</h3>
          </div>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Real-time analyzer events
          </span>
        </div>

        <div
          ref={logContainerRef}
          style={{
            background: "#080b0f",
            borderRadius: "var(--radius-sm)",
            padding: 16,
            maxHeight: 220,
            overflowY: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            lineHeight: 1.6,
            color: "#e2e8f0",
            border: "1px solid var(--border)",
          }}
        >
          {data?.logs && data.logs.length > 0 ? (
            data.logs.map((log: string, idx: number) => (
              <div
                key={idx}
                style={{
                  color: log.includes("[ERROR]")
                    ? "#ef4444"
                    : log.includes("[COMPLETE]")
                    ? "var(--accent-lime)"
                    : "#cbd5e1",
                }}
              >
                {log}
              </div>
            ))
          ) : (
            <div style={{ color: "var(--text-muted)" }}>Waiting for engine output...</div>
          )}
        </div>
      </div>
    </div>
  );
}