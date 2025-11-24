/**
 * Settings Page: Application configuration
 */

import { useState, useEffect } from "react";
import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useFetcher} from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  getOrCreateAppSettings,
  updateDefaultPricing,
  updateSyncSettings,
  updateDefaultOrganization,
  addAuthorizedSource,
  removeAuthorizedSource,
  getAuthorizedSources,
} from "../models/app-settings.server";
import { normalizeShopifyDomain, isValidShopifyDomain } from "../utils/validators";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const [settings, authorizedSources] = await Promise.all([
    getOrCreateAppSettings(shop),
    getAuthorizedSources(shop),
  ]);

  // Fetch collections for default collection selection
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

  // Free plan info (no limits)
  const planInfo = {
    limits: {
      name: "Free",
      autoSync: false, // Disabled for free plan
      syncFrequency: "daily",
      features: [
        "Unlimited product imports",
        "Single product import",
        "Bulk import",
        "Price configuration",
        "Image management",
        "Collection assignment",
      ],
    },
  };

  return Response.json({
    settings: {
      defaultPricingMode: settings.defaultPricingMode,
      defaultMarkupAmount: settings.defaultMarkupAmount,
      defaultMultiplier: settings.defaultMultiplier,
      autoSyncEnabled: settings.autoSyncEnabled,
      syncFrequency: settings.syncFrequency,
      defaultCollectionId: settings.defaultCollectionId,
      defaultTags: settings.defaultTags,
      autoPublish: settings.autoPublish,
      termsAccepted: settings.termsAccepted,
      termsAcceptedAt: settings.termsAcceptedAt?.toISOString() || null,
    },
    authorizedSources,
    collections,
    plan: planInfo,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    switch (action) {
      case "updatePricing": {
        const pricingMode = formData.get("pricingMode") as string;
        const markupAmount = parseFloat(formData.get("markupAmount") as string);
        const multiplier = parseFloat(formData.get("multiplier") as string);

        await updateDefaultPricing(shop, pricingMode, markupAmount, multiplier);

        return Response.json({ success: true, message: "Pricing settings updated" });
      }

      case "updateSync": {
        const autoSyncEnabled = formData.get("autoSyncEnabled") === "true";
        const syncFrequency = formData.get("syncFrequency") as string | null;

        await updateSyncSettings(shop, autoSyncEnabled, syncFrequency || undefined);

        return Response.json({
          success: true,
          message: "Synchronization settings updated",
        });
      }

      case "addSource": {
        const source = formData.get("source") as string;
        const normalized = normalizeShopifyDomain(source);

        if (!isValidShopifyDomain(normalized)) {
          return Response.json(
            { success: false, error: "Invalid Shopify domain" },
            { status: 400 },
          );
        }

        await addAuthorizedSource(shop, normalized);

        return Response.json({ success: true, message: "Source store added" });
      }

      case "removeSource": {
        const source = formData.get("source") as string;

        await removeAuthorizedSource(shop, source);

        return Response.json({ success: true, message: "Source store removed" });
      }

      case "updateOrganization": {
        const defaultCollectionId = formData.get("defaultCollectionId") as string | null;
        const defaultTags = formData.get("defaultTags") as string | null;
        const autoPublish = formData.get("autoPublish") === "true";

        await updateDefaultOrganization(shop, defaultCollectionId, defaultTags, autoPublish);

        return Response.json({
          success: true,
          message: "Organization settings updated",
        });
      }

      default:
        return Response.json({ success: false, error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Settings action error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
};

export default function Settings() {
  const { settings, authorizedSources, collections, plan } = useLoaderData<typeof loader>();
  const shopify = useAppBridge();
  const fetcher = useFetcher<typeof action>();

  // State for pricing
  const [pricingMode, setPricingMode] = useState(settings.defaultPricingMode);
  const [markupAmount, setMarkupAmount] = useState(
    settings.defaultMarkupAmount.toString(),
  );
  const [multiplier, setMultiplier] = useState(
    settings.defaultMultiplier.toString(),
  );

  // State for sync
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(settings.autoSyncEnabled);
  const [syncFrequency, setSyncFrequency] = useState(settings.syncFrequency || "daily");

  // State for sources
  const [newSource, setNewSource] = useState("");

  // State for organization
  const [defaultCollectionId, setDefaultCollectionId] = useState(settings.defaultCollectionId || "");
  // Use "kopy-product" as default if tags is empty or "[]"
  const initialTags = settings.defaultTags && settings.defaultTags !== "[]" ? settings.defaultTags : "kopy-product";
  const [defaultTags, setDefaultTags] = useState(initialTags);
  const [autoPublish, setAutoPublish] = useState(settings.autoPublish);

  // Handle responses
  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show(fetcher.data.message || "Settings saved");
    } else if (fetcher.data?.error) {
      shopify.toast.show(fetcher.data.error, { isError: true });
    }
  }, [fetcher.data, shopify]);

  const isLoading = fetcher.state !== "idle";

  // Functions
  const handleSavePricing = () => {
    const formData = new FormData();
    formData.append("action", "updatePricing");
    formData.append("pricingMode", pricingMode);
    formData.append("markupAmount", markupAmount);
    formData.append("multiplier", multiplier);

    fetcher.submit(formData, { method: "POST" });
  };

  const handleSaveSync = () => {
    if (!plan.limits.autoSync) {
      shopify.toast.show(
        "Automatic synchronization requires a Pro or Premium plan",
        { isError: true },
      );
      return;
    }

    const formData = new FormData();
    formData.append("action", "updateSync");
    formData.append("autoSyncEnabled", autoSyncEnabled.toString());
    formData.append("syncFrequency", syncFrequency);

    fetcher.submit(formData, { method: "POST" });
  };

  const handleAddSource = () => {
    if (!newSource.trim()) {
      shopify.toast.show("Please enter a domain", { isError: true });
      return;
    }

    const formData = new FormData();
    formData.append("action", "addSource");
    formData.append("source", newSource);

    fetcher.submit(formData, { method: "POST" });
    setNewSource("");
  };

  const handleRemoveSource = (source: string) => {
    const formData = new FormData();
    formData.append("action", "removeSource");
    formData.append("source", source);

    fetcher.submit(formData, { method: "POST" });
  };

  const handleSaveOrganization = () => {
    const formData = new FormData();
    formData.append("action", "updateOrganization");
    formData.append("defaultCollectionId", defaultCollectionId);
    formData.append("defaultTags", defaultTags);
    formData.append("autoPublish", autoPublish.toString());

    fetcher.submit(formData, { method: "POST" });
  };

  return (
    <s-page heading="Settings">
      <s-link slot="back-action" href="/app" />

      {/* Section 1: Default pricing */}
      <s-section heading="Default pricing">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Default configuration used when importing products. You can
            always modify it for each product.
          </s-paragraph>

          <s-choice-list
            label="Pricing mode"
            value={pricingMode}
            onChange={(e: any) => setPricingMode(e.target.value)}
          >
            <s-radio value="markup">
              Fixed markup (add an amount to prices)
            </s-radio>
            <s-radio value="multiplier">
              Multiplier (multiply prices)
            </s-radio>
          </s-choice-list>

          {pricingMode === "markup" && (
            <s-text-field
              type="number"
              label="Default markup amount ($)"
              value={markupAmount}
              onChange={(e: any) => setMarkupAmount(e.target.value)}
              helpText="Example: 10 to add $10 to each price"
              step="0.01"
            />
          )}

          {pricingMode === "multiplier" && (
            <s-text-field
              type="number"
              label="Default multiplier"
              value={multiplier}
              onChange={(e: any) => setMultiplier(e.target.value)}
              helpText="Example: 1.5 to increase prices by 50%"
              step="0.01"
              min="0.1"
            />
          )}

          <s-button
            variant="primary"
            onClick={handleSavePricing}
            {...(isLoading ? { loading: true } : {})}
          >
            Save pricing settings
          </s-button>
        </s-stack>
      </s-section>

      {/* Section 2: Automatic synchronization */}
      <s-section heading="Automatic synchronization">
        <s-stack direction="block" gap="base">
          {!plan.limits.autoSync ? (
            <s-banner tone="info">
              <s-paragraph>
                Automatic synchronization is not yet available. This feature will be added in a future version.
              </s-paragraph>
            </s-banner>
          ) : (
            <>
              <s-paragraph>
                Allows automatic synchronization of imported product prices
                when source products change.
              </s-paragraph>

              <s-checkbox
                checked={autoSyncEnabled}
                onChange={(e: any) => setAutoSyncEnabled(e.target.checked)}
              >
                Enable automatic synchronization
              </s-checkbox>

              {autoSyncEnabled && (
                <s-select
                  label="Synchronization frequency"
                  value={syncFrequency}
                  onChange={(e: any) => setSyncFrequency(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  {plan.limits.syncFrequency === "realtime" && (
                    <option value="realtime">Real-time (webhooks)</option>
                  )}
                </s-select>
              )}

              <s-button
                variant="primary"
                onClick={handleSaveSync}
                {...(isLoading ? { loading: true } : {})}
              >
                Save synchronization settings
              </s-button>
            </>
          )}
        </s-stack>
      </s-section>

      {/* Section 4: Product Organization */}
      <s-section heading="📂 Product organization">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Default configuration for organizing imported products in your store.
          </s-paragraph>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#202223" }}>
              Default collection
            </label>
            <select
              value={defaultCollectionId}
              onChange={(e) => setDefaultCollectionId(e.target.value)}
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
              <option value="">-- No default collection --</option>
              {collections && collections.length > 0 &&
                collections.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))
              }
            </select>
            <s-text tone="subdued" size="small">
              New products will be automatically added to this collection
            </s-text>
            {collections && collections.length === 0 && (
              <s-banner tone="info">
                <s-paragraph size="small">
                  No collections found in your store. Create a collection in Shopify Admin first to use this feature.
                </s-paragraph>
              </s-banner>
            )}
          </div>

          <s-text-field
            label="Default tags"
            value={defaultTags}
            onChange={(e: any) => setDefaultTags(e.target.value)}
            placeholder="kopy-product, imported, wholesale"
            helpText="Separate multiple tags with commas. Example: kopy-product, imported, sale"
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#202223" }}>
              Default product status
            </label>
            <select
              value={autoPublish ? "ACTIVE" : "DRAFT"}
              onChange={(e) => setAutoPublish(e.target.value === "ACTIVE")}
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
              <option value="ACTIVE">Active (published immediately)</option>
              <option value="DRAFT">Draft (review before publishing)</option>
            </select>
            <s-text tone="subdued" size="small">
              Choose the default status for newly imported products
            </s-text>
          </div>

          <s-banner tone={autoPublish ? "warning" : "info"}>
            <s-stack direction="block" gap="tight">
              {autoPublish ? (
                <>
                  <s-text fontWeight="semibold">⚠️ Auto-publish enabled</s-text>
                  <s-paragraph size="small">
                    Products will be immediately visible to customers after import.
                    Make sure to verify details before importing.
                  </s-paragraph>
                </>
              ) : (
                <>
                  <s-text fontWeight="semibold">ℹ️ Products will be saved as drafts</s-text>
                  <s-paragraph size="small">
                    Imported products will be saved as drafts, giving you time
                    to review them before making them visible.
                  </s-paragraph>
                </>
              )}
            </s-stack>
          </s-banner>

          <s-button
            variant="primary"
            onClick={handleSaveOrganization}
            {...(isLoading ? { loading: true } : {})}
          >
            Save organization settings
          </s-button>
        </s-stack>
      </s-section>

      {/* Section 5: Terms & Conditions */}
      <s-section heading="📜 Terms of use">
        <s-stack direction="block" gap="base">
          <s-banner tone="warning">
            <s-paragraph>
              By using this application, you acknowledge that you have read and agree to comply with all
              applicable laws and Shopify policies regarding product import and resale.
            </s-paragraph>
          </s-banner>

          {settings.termsAccepted && settings.termsAcceptedAt && (
            <s-banner tone="success">
              <s-paragraph size="small">
                ✅ Terms accepted on: {new Date(settings.termsAcceptedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </s-paragraph>
            </s-banner>
          )}

          {!settings.termsAccepted && (
            <s-banner tone="info">
              <s-paragraph>
                You must accept the terms of use from the home screen to use the application.
              </s-paragraph>
            </s-banner>
          )}
        </s-stack>
      </s-section>

      {/* Section aside: Current plan */}
      <s-section slot="aside" heading="Current plan">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            <s-text fontWeight="bold">{plan.limits.name}</s-text>
          </s-paragraph>

          <s-unordered-list>
            {plan.limits.features.map((feature, i) => (
              <s-list-item key={i}>{feature}</s-list-item>
            ))}
          </s-unordered-list>

          <s-banner tone="success">
            <s-paragraph>All features are completely free!</s-paragraph>
          </s-banner>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
