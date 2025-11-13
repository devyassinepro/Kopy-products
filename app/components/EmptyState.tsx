/**
 * EmptyState Component
 * Professional empty state with icon and optional action
 */

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        textAlign: "center",
        backgroundColor: "#f6f6f7",
        borderRadius: "12px",
        border: "2px dashed #c9cccf",
      }}
    >
      <div style={{ fontSize: "64px", marginBottom: "20px" }}>{icon}</div>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: "600",
          color: "#202223",
          marginBottom: "12px",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: "15px",
          color: "#6d7175",
          maxWidth: "500px",
          marginBottom: "24px",
          lineHeight: "1.6",
        }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: "12px 24px",
            backgroundColor: "#5c6ac4",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#4a5ab3";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#5c6ac4";
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
