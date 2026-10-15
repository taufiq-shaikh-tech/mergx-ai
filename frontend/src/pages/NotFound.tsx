import {
  ArrowLeft,
  Home,
  SearchX,
  ShieldAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import "../App.css";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#09090b",
        color: "#f4f4f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "620px",
          textAlign: "center",
          padding: "48px 28px",
          border: "1px solid #27272a",
          borderRadius: "24px",
          background: "#111113",
        }}
      >
        <div
          style={{
            width: "76px",
            height: "76px",
            margin: "0 auto 26px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "22px",
            color: "#c4f75b",
            background: "rgba(196, 247, 91, 0.09)",
            border: "1px solid rgba(196, 247, 91, 0.2)",
          }}
        >
          <SearchX size={36} />
        </div>

        <div
          style={{
            color: "#c4f75b",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "3px",
            marginBottom: "14px",
          }}
        >
          MERGEX AI · ERROR 404
        </div>

        <h1
          style={{
            fontSize: "clamp(64px, 12vw, 100px)",
            lineHeight: 1,
            letterSpacing: "-5px",
            margin: "0 0 20px",
            fontWeight: 800,
          }}
        >
          404<span style={{ color: "#c4f75b" }}>.</span>
        </h1>

        <h2
          style={{
            fontSize: "25px",
            margin: "0 0 12px",
            fontWeight: 650,
          }}
        >
          This page couldn't be found.
        </h2>

        <p
          style={{
            color: "#a1a1aa",
            fontSize: "15px",
            lineHeight: 1.8,
            maxWidth: "420px",
            margin: "0 auto 30px",
          }}
        >
          The page may have moved, the address may be incorrect, or the
          resource may not exist in your workspace.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="secondary"
            size="md"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate(-1)}
          >
            Go back
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={<Home size={16} />}
            onClick={() => navigate("/app")}
          >
            Open Dashboard
          </Button>
        </div>

        <div
          style={{
            marginTop: "38px",
            paddingTop: "20px",
            borderTop: "1px solid #27272a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            color: "#71717a",
            fontSize: "12px",
          }}
        >
          <ShieldAlert size={15} />
          MergeX AI Software Validation Platform
        </div>
      </div>
    </main>
  );
}