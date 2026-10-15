import { LoaderCircle } from "lucide-react";

interface LoadingSpinnerProps {
  size?: number;
  text?: string;
  className?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({
  size = 20,
  text,
  className = "",
  fullPage = false,
}: LoadingSpinnerProps) {
  const content = (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        color: "var(--accent)",
      }}
      className={className}
    >
      <LoaderCircle
        size={size}
        style={{
          animation: "mx-spin 1s linear infinite",
        }}
      />
      {text && (
        <span
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            fontWeight: 500,
          }}
        >
          {text}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          minHeight: "50vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}
