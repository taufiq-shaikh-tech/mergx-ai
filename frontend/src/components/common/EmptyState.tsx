import React from "react";
import { FolderSearch } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = FolderSearch,
  title,
  description,
  actionText,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`mx-empty-state ${className}`}
      style={{
        padding: "48px 24px",
        textAlign: "center",
        border: "1px dashed var(--border)",
        borderRadius: "var(--radius-md)",
        background: "rgba(17, 17, 19, 0.4)",
        maxWidth: 600,
        margin: "24px auto",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          margin: "0 auto 16px",
          display: "grid",
          placeItems: "center",
          borderRadius: "var(--radius-md)",
          background: "var(--accent-subtle)",
          border: "1px solid var(--accent-border)",
          color: "var(--accent)",
        }}
      >
        <Icon size={24} />
      </div>

      <h3
        style={{
          margin: "0 0 8px",
          fontSize: 16,
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: "0 0 20px",
          fontSize: 13,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          maxWidth: 420,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {description}
      </p>

      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
