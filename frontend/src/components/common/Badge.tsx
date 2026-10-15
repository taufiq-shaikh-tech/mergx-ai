import React from "react";
import type { Severity } from "../../types";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "critical" | "warning" | "success" | "info" | "neutral" | "accent";
  severity?: Severity;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({
  children,
  variant,
  severity,
  icon,
  className = "",
  style,
}: BadgeProps) {
  let computedVariant = variant || "neutral";

  if (severity) {
    switch (severity) {
      case "Critical":
        computedVariant = "critical";
        break;
      case "High":
        computedVariant = "warning";
        break;
      case "Medium":
        computedVariant = "info";
        break;
      case "Low":
        computedVariant = "neutral";
        break;
    }
  }

  return (
    <span
      className={`mx-badge mx-badge-${computedVariant} ${className}`}
      style={style}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
}
