/**
 * Main page: Product import and editing
 * Complete interface with all editable fields
 */

import { useState, useEffect } from "react";
import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { getOrCreateAppSettings, getProductCount } from "../models/app-settings.server";
import type { SourceProduct } from "../utils/types";
import TermsBlocker from "../components/TermsBlocker";
import ProductCardList from "../components/ProductCardList";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  // Get settings
  const settings = await getOrCreateAppSettings(shop);
  const currentCount = await getProductCount(shop);

  // No limits - free application
  const limits = {
    canImport: true,
    currentCount: currentCount,
    maxProducts: -1, // unlimited
    planName: "Free",
    usagePercentage: 0, // no limit so 0%
  };

  // Get collections
  const collectionsResponse = await admin.graphql(
    `#graphql
    query getCollections {
      collections(first: 250) {
        edges {
          node {
            id
            title
          }
        }
      }
    }`,
  );

  const collectionsData = await collectionsResponse.json();
  const collections = collectionsData.data.collections.edges.map((edge: any) => ({
    id: edge.node.id,
    title: edge.node.title,
  }));

  // Get 5 most recent imported products
  const recentProducts = await prisma.importedProduct.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return Response.json({
    settings: {
      defaultPricingMode: settings.defaultPricingMode,
      defaultMarkupAmount: settings.defaultMarkupAmount,
      defaultMultiplier: settings.defaultMultiplier,
      termsAccepted: settings.termsAccepted,
      defaultTags: settings.defaultTags,
    },
    limits: {
      canImport: limits.canImport,
      currentCount: limits.currentCount,
      maxProducts: limits.maxProducts,
      planName: limits.planName,
      usagePercentage: limits.usagePercentage,
    },
    collections,
    recentProducts,
    shop: session.shop,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "acceptTerms") {
    await prisma.appSettings.update({
      where: { shop: session.shop },
      data: {
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      },
    });
    return Response.json({ success: true, action: "termsAccepted" });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
};

export default function ImportProduct() {
  const { settings, limits, collections, recentProducts, shop } = useLoaderData<typeof loader>();
  const shopify = useAppBridge();
  const fetcher = useFetcher<typeof action>();

  // Fetchers
  const fetchProductFetcher = useFetcher();
  const importProductFetcher = useFetcher();

  // State - URL
  const [productUrl, setProductUrl] = useState("");

  // State - Product Data (editable)
  const [productData, setProductData] = useState<SourceProduct | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedDescriptionHtml, setEditedDescriptionHtml] = useState("");
  const [editedVendor, setEditedVendor] = useState("");
  const [editedProductType, setEditedProductType] = useState("");
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [editedImages, setEditedImages] = useState<Array<{ id: string; url: string; altText: string | null }>>([]);
  const [editedVariants, setEditedVariants] = useState<any[]>([]);

  // State - Pricing
  // Convert legacy pricing modes to new format
  const initialPricingMode = settings.defaultPricingMode === "markup"
    ? "increase-dollar"
    : settings.defaultPricingMode === "multiplier"
    ? "increase-percent"
    : settings.defaultPricingMode;
  const [pricingMode, setPricingMode] = useState(initialPricingMode);
  const [markupAmount, setMarkupAmount] = useState(settings.defaultMarkupAmount.toString());
  const [multiplier, setMultiplier] = useState(settings.defaultMultiplier.toString());
  const [applyToAll, setApplyToAll] = useState(true);

  // State - Publishing
  const [productStatus, setProductStatus] = useState("ACTIVE");
  const [selectedCollection, setSelectedCollection] = useState("");

  // State - UI
  const [showPreview, setShowPreview] = useState(false);
  const [showDescriptionEditor, setShowDescriptionEditor] = useState(false);
  const [showTermsBlocker, setShowTermsBlocker] = useState(!settings.termsAccepted);
  const [hasPermission, setHasPermission] = useState(settings.termsAccepted);

  // Loading states
  const isFetchingPreview =
    fetchProductFetcher.state === "submitting" ||
    fetchProductFetcher.state === "loading";
  const isImporting =
    importProductFetcher.state === "submitting" ||
    importProductFetcher.state === "loading";

  // Handle fetch response
  useEffect(() => {
    if (fetchProductFetcher.data?.success && fetchProductFetcher.data?.product) {
      const product = fetchProductFetcher.data.product;
      setProductData(product);
      setEditedTitle(product.title);
      setEditedDescription(product.description);
      setEditedDescriptionHtml(product.descriptionHtml);
      setEditedVendor(product.vendor || "");
      setEditedProductType(product.productType || "");

      // Merge default tags with product tags
      const productTags = product.tags || [];
      const defaultTagsString = settings.defaultTags || "";
      const defaultTagsArray = defaultTagsString
        .split(",")
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0);

      // Combine tags without duplicates
      const combinedTags = [...new Set([...defaultTagsArray, ...productTags])];
      setEditedTags(combinedTags);

      setEditedImages(product.images || []);
      setEditedVariants(product.variants || []);
      setShowPreview(true);
      shopify.toast.show("Product loaded successfully!");
    } else if (fetchProductFetcher.data?.error) {
      shopify.toast.show(fetchProductFetcher.data.error, { isError: true });
    }
  }, [fetchProductFetcher.data, shopify, settings.defaultTags]);

  // Handle import response
  useEffect(() => {
    if (importProductFetcher.data?.success) {
      shopify.toast.show("Product imported successfully!");
      // Reset
      setProductUrl("");
      setProductData(null);
      setShowPreview(false);
    } else if (importProductFetcher.data?.error) {
      shopify.toast.show(importProductFetcher.data.error, { isError: true });
    }
  }, [importProductFetcher.data, shopify]);

  // Handle terms acceptance
  useEffect(() => {
    if (fetcher.data?.action === "termsAccepted") {
      setShowTermsBlocker(false);
      setHasPermission(true);
      shopify.toast.show("Terms accepted successfully!");
    }
  }, [fetcher.data, shopify]);

  // Functions
  const handleFetchProduct = () => {
    if (!productUrl.trim()) {
      shopify.toast.show("Please enter a URL", { isError: true });
      return;
    }

    if (!hasPermission) {
      shopify.toast.show("You must confirm you have permission to Import this product", { isError: true });
      return;
    }

    const formData = new FormData();
    formData.append("url", productUrl);

    fetchProductFetcher.submit(formData, {
      method: "POST",
      action: "/api/fetch-product",
    });
  };

  const handleImportProduct = () => {
    if (!productData) {
      shopify.toast.show("Please load a product first", { isError: true });
      return;
    }

    // Apply modified prices to variants
    const finalVariants = editedVariants.map((variant) => {
      let finalPrice = parseFloat(variant.price);

      if (applyToAll) {
        if (pricingMode === "increase-dollar") {
          finalPrice = finalPrice + parseFloat(markupAmount || "0");
        } else if (pricingMode === "decrease-dollar") {
          finalPrice = Math.max(0, finalPrice - parseFloat(markupAmount || "0"));
        } else if (pricingMode === "increase-percent") {
          const percent = parseFloat(multiplier || "0");
          finalPrice = finalPrice * (1 + percent / 100);
        } else if (pricingMode === "decrease-percent") {
          const percent = parseFloat(multiplier || "0");
          finalPrice = Math.max(0, finalPrice * (1 - percent / 100));
        } else if (pricingMode === "markup") {
          // Legacy mode
          finalPrice = finalPrice + parseFloat(markupAmount || "0");
        } else {
          // Legacy multiplier mode
          finalPrice = finalPrice * parseFloat(multiplier || "1");
        }
      }

      return {
        ...variant,
        price: finalPrice.toFixed(2),
      };
    });

    // Build final product with all modifications
    const finalProduct: SourceProduct = {
      ...productData,
      title: editedTitle,
      description: editedDescription,
      descriptionHtml: editedDescriptionHtml,
      vendor: editedVendor,
      productType: editedProductType,
      tags: editedTags,
      images: editedImages,
      variants: finalVariants,
    };

    // Convert new pricing modes to legacy format for server
    const legacyPricingMode =
      pricingMode === "increase-dollar" || pricingMode === "decrease-dollar"
        ? "markup"
        : "multiplier";
    const adjustedMarkupAmount = pricingMode === "decrease-dollar"
      ? (parseFloat(markupAmount) * -1).toString()
      : markupAmount;
    const adjustedMultiplier = pricingMode === "increase-percent"
      ? (1 + parseFloat(multiplier) / 100).toString()
      : pricingMode === "decrease-percent"
      ? (1 - parseFloat(multiplier) / 100).toString()
      : multiplier;

    const formData = new FormData();
    formData.append("productData", JSON.stringify(finalProduct));
    formData.append("sourceUrl", productUrl);
    formData.append("pricingMode", legacyPricingMode);
    formData.append("markupAmount", adjustedMarkupAmount);
    formData.append("multiplier", adjustedMultiplier);
    formData.append("status", productStatus);
    formData.append("collectionId", selectedCollection);

    importProductFetcher.submit(formData, {
      method: "POST",
      action: "/api/import-product",
    });
  };

  const calculatePreviewPrice = (price: string) => {
    const priceNum = parseFloat(price);

    if (pricingMode === "increase-dollar") {
      return (priceNum + parseFloat(markupAmount || "0")).toFixed(2);
    } else if (pricingMode === "decrease-dollar") {
      return Math.max(0, priceNum - parseFloat(markupAmount || "0")).toFixed(2);
    } else if (pricingMode === "increase-percent") {
      const percent = parseFloat(multiplier || "0");
      return (priceNum * (1 + percent / 100)).toFixed(2);
    } else if (pricingMode === "decrease-percent") {
      const percent = parseFloat(multiplier || "0");
      return Math.max(0, priceNum * (1 - percent / 100)).toFixed(2);
    }

    // Fallback for legacy modes
    if (pricingMode === "markup") {
      return (priceNum + parseFloat(markupAmount || "0")).toFixed(2);
    } else {
      return (priceNum * parseFloat(multiplier || "1")).toFixed(2);
    }
  };

  const handleRemoveImage = (index: number) => {
    setEditedImages(editedImages.filter((_, i) => i !== index));
  };

  const handleMoveImageUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...editedImages];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    setEditedImages(newImages);
  };

  const handleMoveImageDown = (index: number) => {
    if (index === editedImages.length - 1) return;
    const newImages = [...editedImages];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    setEditedImages(newImages);
  };

  const handleVariantPriceChange = (index: number, newPrice: string) => {
    const newVariants = [...editedVariants];
    newVariants[index] = { ...newVariants[index], price: newPrice };
    setEditedVariants(newVariants);
  };

  const handleApplyPricingToAll = () => {
    const newVariants = editedVariants.map((variant) => {
      const originalPrice = parseFloat(variant.price);
      let newPrice = originalPrice;

      if (pricingMode === "increase-dollar") {
        newPrice = originalPrice + parseFloat(markupAmount || "0");
      } else if (pricingMode === "decrease-dollar") {
        newPrice = Math.max(0, originalPrice - parseFloat(markupAmount || "0"));
      } else if (pricingMode === "increase-percent") {
        const percent = parseFloat(multiplier || "0");
        newPrice = originalPrice * (1 + percent / 100);
      } else if (pricingMode === "decrease-percent") {
        const percent = parseFloat(multiplier || "0");
        newPrice = Math.max(0, originalPrice * (1 - percent / 100));
      } else if (pricingMode === "markup") {
        // Legacy mode
        newPrice = originalPrice + parseFloat(markupAmount || "0");
      } else {
        // Legacy multiplier mode
        newPrice = originalPrice * parseFloat(multiplier || "1");
      }

      return { ...variant, price: newPrice.toFixed(2) };
    });

    setEditedVariants(newVariants);
    shopify.toast.show("Prices applied to all variants!");
  };

  const handleIncreaseAllPrices = () => {
    const newVariants = editedVariants.map((variant) => {
      const originalPrice = parseFloat(variant.price);
      let newPrice = originalPrice;

      if (pricingMode === "markup") {
        newPrice = originalPrice + parseFloat(markupAmount || "0");
      } else {
        newPrice = originalPrice * parseFloat(multiplier || "1");
      }

      return { ...variant, price: newPrice.toFixed(2) };
    });

    setEditedVariants(newVariants);
    shopify.toast.show(`Prices increased!`);
  };

  const handleDecreaseAllPrices = () => {
    const newVariants = editedVariants.map((variant) => {
      const originalPrice = parseFloat(variant.price);
      let newPrice = originalPrice;

      if (pricingMode === "markup") {
        newPrice = originalPrice - parseFloat(markupAmount || "0");
      } else {
        newPrice = originalPrice / parseFloat(multiplier || "1");
      }

      return { ...variant, price: Math.max(0, newPrice).toFixed(2) };
    });

    setEditedVariants(newVariants);
    shopify.toast.show(`Prices decreased!`);
  };

  const handleAcceptTerms = () => {
    const formData = new FormData();
    formData.append("action", "acceptTerms");
    fetcher.submit(formData, { method: "POST" });
  };

  return (
    <>
      <TermsBlocker show={showTermsBlocker} onAccept={handleAcceptTerms} />
      <s-page heading="Import a product">
        <s-link slot="back-action" href="/app" />

      {/* Section 1: URL and fetch */}
      <s-section heading="1. Source product URL">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Paste the URL of a Shopify product that you want to import into
            your store.
          </s-paragraph>

          {/* <s-banner tone="info">
            <s-paragraph>
              The URL is used to retrieve all product data (title, description, images, variants, etc.).
              Once loaded, you can modify all fields before importing.
            </s-paragraph>
          </s-banner> */}

          <s-text-field
            label="Shopify product URL"
            value={productUrl}
            onChange={(e: any) => setProductUrl(e.target.value)}
            placeholder="https://example.com/products/product-name"
          />

          <s-checkbox
            checked={hasPermission}
            label="I have permission to Import this product"
            onChange={(e: any) => setHasPermission(e.target.checked)}
          ></s-checkbox>

          <s-button
            onClick={handleFetchProduct}
            {...(isFetchingPreview ? { loading: true } : {})}
            {...(!hasPermission ? { disabled: true } : {})}
          >
            {isFetchingPreview ? "Loading..." : "Import product"}
          </s-button>
        </s-stack>
      </s-section>

      {/* Product Import Modal */}
      {showPreview && productData && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowPreview(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              maxWidth: "1200px",
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e1e3e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>
                📦 Configure Product Import
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: "0",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "6px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f6f6f7";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px",
              }}
            >
              <s-stack direction="block" gap="large">
                {/* Sections go here */}
          <s-section heading="2. Product information">
            <s-stack direction="block" gap="base">
              <s-text-field
                label="Product title"
                value={editedTitle}
                onChange={(e: any) => setEditedTitle(e.target.value)}
              />

              {/* Description */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#202223" }}>
                  Description
                </label>

                {!showDescriptionEditor ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div
                      style={{
                        padding: "12px",
                        border: "1px solid #e1e3e5",
                        borderRadius: "8px",
                        backgroundColor: "#f6f6f7",
                        maxHeight: "200px",
                        overflowY: "auto",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: editedDescriptionHtml || editedDescription,
                      }}
                    />
                    <s-button onClick={() => setShowDescriptionEditor(true)}>
                      Edit description
                    </s-button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <textarea
                      value={editedDescriptionHtml}
                      onChange={(e) => {
                        setEditedDescriptionHtml(e.target.value);
                        // Strip HTML for plain description
                        const plainText = e.target.value.replace(/<[^>]*>/g, "");
                        setEditedDescription(plainText);
                      }}
                      rows={10}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #c9cccf",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontFamily: "monospace",
                        resize: "vertical",
                      }}
                      placeholder="<p>HTML description...</p>"
                    />
                    <s-stack direction="inline" gap="small">
                      <s-button onClick={() => setShowDescriptionEditor(false)}>
                        Close editor
                      </s-button>
                      <s-text size="small" tone="subdued">
                        You can use HTML (p, strong, ul, li, etc.)
                      </s-text>
                    </s-stack>
                  </div>
                )}
              </div>

              <s-text-field
                label="Vendor"
                value={editedVendor}
                onChange={(e: any) => setEditedVendor(e.target.value)}
                helptext="Supplier or brand name"
              />

              <s-text-field
                label="Product type"
                value={editedProductType}
                onChange={(e: any) => setEditedProductType(e.target.value)}
                helptext="Product category"
              />

              {/* Tags */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#202223" }}>
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={editedTags.join(", ")}
                  onChange={(e) => {
                    const tags = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
                    setEditedTags(tags);
                  }}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #c9cccf",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </s-stack>
          </s-section>

          {/* Section 3: Image management */}
          <s-section heading="3. Product images">
            <s-stack direction="block" gap="base">
              <s-paragraph>
                Manage your product images. You can remove or reorder images.
              </s-paragraph>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {editedImages.map((image, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: "16px",
                      padding: "16px",
                      border: "1px solid #c9cccf",
                      borderRadius: "8px",
                      alignItems: "center",
                    }}
                  >
                    <img
                      src={image.url}
                      alt={image.altText || `Image ${index + 1}`}
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                        borderRadius: "6px",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <s-text fontWeight="bold">Image {index + 1}</s-text>
                      {index === 0 && (
                        <s-badge tone="success">Main image</s-badge>
                      )}
                    </div>
                    <s-stack direction="inline" gap="small">
                      <button
                        onClick={() => handleMoveImageUp(index)}
                        disabled={index === 0}
                        style={{
                          padding: "8px 12px",
                          border: "1px solid #c9cccf",
                          borderRadius: "6px",
                          background: "white",
                          cursor: index === 0 ? "not-allowed" : "pointer",
                          opacity: index === 0 ? 0.5 : 1,
                        }}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveImageDown(index)}
                        disabled={index === editedImages.length - 1}
                        style={{
                          padding: "8px 12px",
                          border: "1px solid #c9cccf",
                          borderRadius: "6px",
                          background: "white",
                          cursor: index === editedImages.length - 1 ? "not-allowed" : "pointer",
                          opacity: index === editedImages.length - 1 ? 0.5 : 1,
                        }}
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => handleRemoveImage(index)}
                        style={{
                          padding: "8px 12px",
                          border: "1px solid #d72c0d",
                          borderRadius: "6px",
                          background: "white",
                          color: "#d72c0d",
                          cursor: "pointer",
                        }}
                      >
                        🗑️ Remove
                      </button>
                    </s-stack>
                  </div>
                ))}
              </div>

              {editedImages.length === 0 && (
                <s-banner tone="warning">
                  <s-paragraph>No images available for this product.</s-paragraph>
                </s-banner>
              )}
            </s-stack>
          </s-section>

          {/* Section 4: Pricing configuration */}
          <s-section heading="4. Pricing configuration">
            <s-stack direction="block" gap="base">
              {/* Direction: Increase or Decrease */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#202223" }}>
                  Price adjustment direction
                </label>
                <s-stack direction="inline" gap="base">
                  <s-checkbox
                    checked={pricingMode.startsWith("increase")}
                    onChange={(e: any) => {
                      if (e.target.checked) {
                        setPricingMode(
                          pricingMode.includes("dollar")
                            ? "increase-dollar"
                            : pricingMode.includes("percent")
                            ? "increase-percent"
                            : "increase-dollar"
                        );
                      }
                    }}
                    label="⬆️ Increase prices"
                  />
                  <s-checkbox
                    checked={pricingMode.startsWith("decrease")}
                    onChange={(e: any) => {
                      if (e.target.checked) {
                        setPricingMode(
                          pricingMode.includes("dollar")
                            ? "decrease-dollar"
                            : pricingMode.includes("percent")
                            ? "decrease-percent"
                            : "decrease-dollar"
                        );
                      }
                    }}
                    label="⬇️ Decrease prices"
                  />
                </s-stack>
              </div>

              {/* Type: Dollar or Percentage */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#202223" }}>
                  Adjustment type
                </label>
                <s-stack direction="inline" gap="base">
                  <s-checkbox
                    checked={pricingMode.includes("dollar")}
                    onChange={(e: any) => {
                      if (e.target.checked) {
                        setPricingMode(
                          pricingMode.startsWith("increase")
                            ? "increase-dollar"
                            : "decrease-dollar"
                        );
                      }
                    }}
                    label="💵 Dollar amount"
                  />
                  <s-checkbox
                    checked={pricingMode.includes("percent")}
                    onChange={(e: any) => {
                      if (e.target.checked) {
                        setPricingMode(
                          pricingMode.startsWith("increase")
                            ? "increase-percent"
                            : "decrease-percent"
                        );
                      }
                    }}
                    label="📊 Percentage"
                  />
                </s-stack>
              </div>

              {/* Input field based on type */}
              {(pricingMode === "increase-dollar" || pricingMode === "decrease-dollar") && (
                <s-text-field
                  type="number"
                  label={`Dollar amount ($)`}
                  value={markupAmount}
                  onChange={(e: any) => setMarkupAmount(e.target.value)}
                  helptext={`Amount to ${pricingMode === "increase-dollar" ? "add to" : "subtract from"} each price`}
                  step="0.01"
                  min="0"
                />
              )}

              {(pricingMode === "increase-percent" || pricingMode === "decrease-percent") && (
                <s-text-field
                  type="number"
                  label={`Percentage (%)`}
                  value={multiplier}
                  onChange={(e: any) => setMultiplier(e.target.value)}
                  helptext={`Percentage to ${pricingMode === "increase-percent" ? "increase" : "decrease"} prices`}
                  step="0.01"
                  min="0"
                />
              )}

              <s-button variant="primary" onClick={handleApplyPricingToAll}>
                Apply pricing to all variants
              </s-button>
            </s-stack>
          </s-section>

          {/* Section 5: Variant management */}
          <s-section heading="5. Variants and prices">
            <s-stack direction="block" gap="base">
              <s-paragraph>
                Modify the prices of each variant individually if needed.
              </s-paragraph>

              <s-data-table>
                <table>
                  <thead>
                    <tr>
                      <th>Variant</th>
                      <th>Current price</th>
                      <th>New price preview</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editedVariants.map((variant, index) => (
                      <tr key={variant.id || index}>
                        <td>{variant.title}</td>
                        <td>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => handleVariantPriceChange(index, e.target.value)}
                            step="0.01"
                            min="0"
                            style={{
                              padding: "6px 10px",
                              border: "1px solid #c9cccf",
                              borderRadius: "4px",
                              width: "100px",
                            }}
                          />
                        </td>
                        <td>
                          <s-text fontWeight="bold">
                            {calculatePreviewPrice(variant.price)} €
                          </s-text>
                        </td>
                        <td>
                          <s-badge tone="info">SKU: {variant.sku || "N/A"}</s-badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </s-data-table>
            </s-stack>
          </s-section>

          {/* Section 6: Publishing options */}
          <s-section heading="6. Publishing options">
            <s-stack direction="block" gap="base">
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#202223" }}>
                  Product status
                </label>
                <select
                  value={productStatus}
                  onChange={(e) => setProductStatus(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #8c9196",
                    borderRadius: "8px",
                    fontSize: "14px",
                    backgroundColor: "white",
                    cursor: "pointer",
                    outline: "none",
                    width: "100%",
                  }}
                >
                  <option value="ACTIVE">Active (published)</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#202223" }}>
                  Collection (optional)
                </label>
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #8c9196",
                    borderRadius: "8px",
                    fontSize: "14px",
                    backgroundColor: "white",
                    cursor: "pointer",
                    outline: "none",
                    width: "100%",
                  }}
                >
                  <option value="">-- No collection --</option>
                  {collections && collections.length > 0 &&
                    collections.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))
                  }
                </select>
                {collections && collections.length === 0 && (
                  <s-text tone="subdued" size="small">
                    No collections found. Create a collection in Shopify Admin first.
                  </s-text>
                )}
              </div>
            </s-stack>
          </s-section>
              </s-stack>
            </div>

            {/* Modal Footer - Sticky */}
            <div
              style={{
                padding: "20px 24px",
                borderTop: "1px solid #e1e3e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <s-button onClick={() => setShowPreview(false)} size="large">
                Cancel
              </s-button>
              <s-button
                variant="primary"
                size="large"
                onClick={handleImportProduct}
                {...(isImporting ? { loading: true } : {})}
              >
                {isImporting ? "Importing..." : "✓ Import this product"}
              </s-button>
            </div>
          </div>
        </div>
      )}

      {/* Section aside: Guide */}
      <s-section slot="aside" heading="Usage guide">
        <s-ordered-list>
          <s-list-item>Copy the URL of a Shopify product</s-list-item>
          <s-list-item>Click "Import product"</s-list-item>
          <s-list-item>Edit the title, description, images</s-list-item>
          <s-list-item>Configure your prices (individual or global)</s-list-item>
          <s-list-item>Choose the status and collection</s-list-item>
          <s-list-item>Import the product into your store</s-list-item>
        </s-ordered-list>
      </s-section>

      {/* <s-section slot="aside" heading="Current plan">
        <s-paragraph>
          <s-text fontWeight="bold">{limits.planName}</s-text>
        </s-paragraph>
        <s-paragraph>
          {limits.currentCount} products imported
        </s-paragraph>
        <s-banner tone="success">
          <s-paragraph>All products are free!</s-paragraph>
        </s-banner>
      </s-section> */}

      {/* Section: Recent Products */}
      {recentProducts && recentProducts.length > 0 && (
        <s-section heading="📦 Recently imported products">
          <s-stack direction="block" gap="base">
            <s-paragraph tone="subdued">
              Here are the 5 most recent products you imported
            </s-paragraph>
            {recentProducts.map((product) => (
              <ProductCardList key={product.id} product={product} shop={shop} />
            ))}
          </s-stack>
        </s-section>
      )}
    </s-page>
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
