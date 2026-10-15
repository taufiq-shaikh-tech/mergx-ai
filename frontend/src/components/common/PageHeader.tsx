import React from "react";

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <header
      className={`mx-page-header ${className}`}
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 20,
        marginBottom: 28,
        flexWrap: "wrap",
      }}
    >
      <div style={{ maxWidth: 720 }}>
        {eyebrow && (
          <span
            style={{
              display: "inline-block",
              color: "var(--accent)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "1.5px",
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </span>
        )}
        <h1
          className="display-font"
          style={{
            margin: "0 0 8px",
            fontSize: "clamp(24px, 3.5vw, 32px)",
            fontWeight: 700,
            letterSpacing: "-0.5px",
            color: "var(--text-primary)",
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              margin: 0,
              color: "var(--text-secondary)",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 4,
          }}
        >
          {actions}
        </div>
      )}
    </header>
  );
}
