import React, { forwardRef } from "react";
import { LoaderCircle } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      icon,
      className = "",
      style,
      ...props
    },
    ref
  ) => {
    const sizeStyles: Record<string, React.CSSProperties> = {
      sm: { padding: "6px 12px", fontSize: "12px", minHeight: "32px" },
      md: { padding: "8px 16px", fontSize: "13px", minHeight: "38px" },
      lg: { padding: "12px 22px", fontSize: "14px", minHeight: "44px" },
    };

    const variantClass = `mx-btn-${variant}`;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`mx-btn ${variantClass} ${className}`}
        style={{ ...sizeStyles[size], ...style }}
        {...props}
      >
        {loading ? (
          <LoaderCircle
            size={size === "sm" ? 14 : 16}
            style={{ animation: "mx-spin 1s linear infinite" }}
          />
        ) : (
          icon
        )}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";
