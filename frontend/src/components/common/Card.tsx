import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({
  children,
  className = "",
  hoverable = false,
  style,
  ...props
}: CardProps) {
  return (
    <div
      className={`mx-card ${className}`}
      style={{
        transition: hoverable
          ? "border-color var(--transition-fast), transform var(--transition-fast)"
          : undefined,
        cursor: hoverable ? "pointer" : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
