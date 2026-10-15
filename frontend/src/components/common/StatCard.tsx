import React from "react";
import { ArrowUpRight } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  detail?: string;
  icon: React.ElementType;
  color?: "accent" | "purple" | "blue" | "orange" | "green" | "danger";
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  color = "accent",
  onClick,
  className = "",
}: StatCardProps) {
  const colorMap = {
    accent: {
      color: "var(--accent)",
      bg: "var(--accent-subtle)",
      border: "var(--accent-border)",
    },
    purple: {
      color: "var(--purple)",
      bg: "var(--purple-subtle)",
      border: "var(--purple-border)",
    },
    blue: {
      color: "var(--info)",
      bg: "var(--info-subtle)",
      border: "var(--info-border)",
    },
    orange: {
      color: "var(--warning)",
      bg: "var(--warning-subtle)",
      border: "var(--warning-border)",
    },
    green: {
      color: "var(--success)",
      bg: "var(--success-subtle)",
      border: "var(--success-border)",
    },
    danger: {
      color: "var(--danger)",
      bg: "var(--danger-subtle)",
      border: "var(--danger-border)",
    },
  };

  const scheme = colorMap[color] || colorMap.accent;

  return (
    <div
      onClick={onClick}
      className={`mx-stat-card ${className}`}
      style={{
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div className="mx-stat-top">
        <span className="mx-stat-label">{label}</span>
        <div
          className="mx-stat-icon"
          style={{
            color: scheme.color,
            background: scheme.bg,
            borderColor: scheme.border,
          }}
        >
          <Icon size={18} />
        </div>
      </div>

      <div className="mx-stat-value display-font">{value}</div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        {detail && <span className="mx-stat-detail">{detail}</span>}
        {onClick && (
          <ArrowUpRight
            size={14}
            className="mx-stat-arrow"
            style={{ marginLeft: "auto" }}
          />
        )}
      </div>
    </div>
  );
}
