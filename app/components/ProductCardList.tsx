/**
 * ProductCardList Component
 * Displays imported product info in a list format
 */

interface ProductCardListProps {
  product: {
    id: string;
    title: string;
    productImage?: string | null;
    price?: number | null;
    status: string;
    pricingMode: string;
    destinationProductId: string;
    destinationHandle?: string | null;
    sourceProductUrl: string;
    createdAt: string;
  };
  shop: string;
}

export default function ProductCardList({ product, shop }: ProductCardListProps) {
  const productUrl = product.destinationHandle
    ? `https://${shop}/products/${product.destinationHandle}`
    : `https://${shop}/admin/products/${product.destinationProductId.split("/").pop()}`;

  const formattedDate = new Date(product.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        padding: "16px",
        border: "1px solid #e1e3e5",
        borderRadius: "12px",
        backgroundColor: "white",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
      onClick={() => window.open(productUrl, "_blank")}
    >
      {/* Product Image */}
      {product.productImage ? (
        <img
          src={product.productImage}
          alt={product.title}
          style={{
            width: "80px",
            height: "80px",
            objectFit: "cover",
            borderRadius: "8px",
            border: "1px solid #e1e3e5",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: "80px",
            height: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f6f6f7",
            borderRadius: "8px",
            border: "1px solid #e1e3e5",
            flexShrink: 0,
          }}
        >
          <s-text tone="subdued">📦</s-text>
        </div>
      )}

      {/* Product Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <s-text
          weight="semibold"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            marginBottom: "8px",
          }}
        >
          {product.title}
        </s-text>

        <s-stack direction="inline" gap="small" style={{ flexWrap: "wrap" }}>
          <s-badge tone={product.status === "ACTIVE" ? "success" : "info"}>
            {product.status === "ACTIVE" ? "✅ Active" : "📝 Draft"}
          </s-badge>
          <s-badge tone={product.pricingMode === "markup" ? "warning" : "info"}>
            {product.pricingMode === "markup" ? "➕ Markup" : "✖️ Multiplier"}
          </s-badge>
          {product.price && (
            <s-badge>
              ${product.price.toFixed(2)}
            </s-badge>
          )}
        </s-stack>

        <s-text size="small" tone="subdued" style={{ marginTop: "8px" }}>
          Imported on {formattedDate}
        </s-text>
      </div>

      {/* View Button */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <s-button size="small" variant="plain">
          View →
        </s-button>
      </div>
    </div>
  );
}
