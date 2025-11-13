/**
 * StatCard Component
 * Animated statistics card with trends and color variants
 */

interface StatCardProps {
  icon: string;
  value: number | string;
  label: string;
  colorVariant: "blue" | "green" | "yellow" | "purple";
  delay?: number;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const colorVariants = {
  blue: {
    bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    shadow: "0 4px 20px rgba(102, 126, 234, 0.4)",
  },
  green: {
    bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    shadow: "0 4px 20px rgba(16, 185, 129, 0.4)",
  },
  yellow: {
    bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    shadow: "0 4px 20px rgba(245, 158, 11, 0.4)",
  },
  purple: {
    bg: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    shadow: "0 4px 20px rgba(139, 92, 246, 0.4)",
  },
};

export default function StatCard({
  icon,
  value,
  label,
  colorVariant,
  delay = 0,
  trend,
}: StatCardProps) {
  const colors = colorVariants[colorVariant];

  return (
    <div
      style={{
        background: colors.bg,
        borderRadius: "12px",
        padding: "20px",
        minWidth: "200px",
        flex: "1 1 200px",
        color: "white",
        boxShadow: colors.shadow,
        transform: "translateY(0)",
        transition: `all 0.3s ease ${delay}ms`,
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = colors.shadow.replace("20px", "25px");
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = colors.shadow;
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ fontSize: "28px" }}>{icon}</div>
        <div
          style={{
            fontSize: "32px",
            fontWeight: "700",
            lineHeight: "1",
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: "500",
            opacity: 0.9,
          }}
        >
          {label}
        </div>
        {trend && (
          <div
            style={{
              fontSize: "12px",
              opacity: 0.8,
              marginTop: "4px",
              padding: "4px 8px",
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "6px",
              display: "inline-block",
              width: "fit-content",
            }}
          >
            {trend.isPositive ? "↗ " : "↘ "}
            {trend.value}
          </div>
        )}
      </div>
    </div>
  );
}
