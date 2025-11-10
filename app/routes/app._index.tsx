/**
 * Page principale : Import de produits
 */

import { useState, useEffect } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { getOrCreateAppSettings, canImportMoreProducts } from "../models/app-settings.server";
import { calculateUsagePercentage } from "../utils/formatters";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Récupérer les paramètres et limites
  const settings = await getOrCreateAppSettings(shop);
  const limits = await canImportMoreProducts(shop);
  const usagePercentage = calculateUsagePercentage(
    limits.currentCount,
    limits.maxProducts,
  );

  return Response.json({
    settings: {
      defaultPricingMode: settings.defaultPricingMode,
      defaultMarkupAmount: settings.defaultMarkupAmount,
      defaultMultiplier: settings.defaultMultiplier,
    },
    limits: {
      canImport: limits.canImport,
      currentCount: limits.currentCount,
      maxProducts: limits.maxProducts,
      planName: limits.planName,
      usagePercentage,
    },
  });
};

export default function ImportProduct() {
  const { settings, limits } = useLoaderData<typeof loader>();
  const shopify = useAppBridge();

  // Fetchers
  const fetchProductFetcher = useFetcher();
  const importProductFetcher = useFetcher();

  // State
  const [productUrl, setProductUrl] = useState("");
  const [pricingMode, setPricingMode] = useState(settings.defaultPricingMode);
  const [markupAmount, setMarkupAmount] = useState(
    settings.defaultMarkupAmount.toString(),
  );
  const [multiplier, setMultiplier] = useState(
    settings.defaultMultiplier.toString(),
  );
  const [productStatus, setProductStatus] = useState("ACTIVE");
  const [previewProduct, setPreviewProduct] = useState<any>(null);

  // Loading states
  const isFetchingPreview =
    fetchProductFetcher.state === "submitting" ||
    fetchProductFetcher.state === "loading";
  const isImporting =
    importProductFetcher.state === "submitting" ||
    importProductFetcher.state === "loading";

  // Gérer la réponse du fetch
  useEffect(() => {
    if (fetchProductFetcher.data?.success && fetchProductFetcher.data?.product) {
      setPreviewProduct(fetchProductFetcher.data.product);
    } else if (fetchProductFetcher.data?.error) {
      shopify.toast.show(fetchProductFetcher.data.error, { isError: true });
    }
  }, [fetchProductFetcher.data, shopify]);

  // Gérer la réponse de l'import
  useEffect(() => {
    if (importProductFetcher.data?.success) {
      shopify.toast.show("Produit importé avec succès !");
      // Reset
      setProductUrl("");
      setPreviewProduct(null);
    } else if (importProductFetcher.data?.error) {
      shopify.toast.show(importProductFetcher.data.error, { isError: true });
    }
  }, [importProductFetcher.data, shopify]);

  // Fonctions
  const handleFetchProduct = () => {
    if (!productUrl.trim()) {
      shopify.toast.show("Veuillez entrer une URL", { isError: true });
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
    if (!previewProduct) {
      shopify.toast.show("Veuillez d'abord charger un produit", { isError: true });
      return;
    }

    if (!limits.canImport) {
      shopify.toast.show(
        `Limite atteinte pour votre plan ${limits.planName}`,
        { isError: true },
      );
      return;
    }

    const formData = new FormData();
    formData.append("url", productUrl);
    formData.append("pricingMode", pricingMode);
    formData.append("markupAmount", markupAmount);
    formData.append("multiplier", multiplier);
    formData.append("status", productStatus);

    importProductFetcher.submit(formData, {
      method: "POST",
      action: "/api/import-product",
    });
  };

  const calculatePreviewPrice = (price: string) => {
    const priceNum = parseFloat(price);
    if (pricingMode === "markup") {
      return (priceNum + parseFloat(markupAmount || "0")).toFixed(2);
    } else {
      return (priceNum * parseFloat(multiplier || "1")).toFixed(2);
    }
  };

  return (
    <s-page heading="Importer un produit">
      <s-link slot="back-action" href="/app" />

      {/* Limites du plan */}
      {limits.usagePercentage >= 80 && (
        <s-banner
          tone={limits.usagePercentage >= 100 ? "critical" : "warning"}
          slot="banner"
        >
          <s-paragraph>
            Vous avez utilisé {limits.currentCount} /{" "}
            {limits.maxProducts === -1 ? "∞" : limits.maxProducts} produits de
            votre plan {limits.planName}.
            {!limits.canImport && " Veuillez upgrader votre plan pour continuer."}
          </s-paragraph>
        </s-banner>
      )}

      {/* Section 1: URL et fetch */}
      <s-section heading="1. URL du produit source">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Collez l'URL d'un produit Shopify que vous souhaitez importer dans
            votre boutique.
          </s-paragraph>

          <s-text-field
            label="URL du produit Shopify"
            value={productUrl}
            onChange={(e: any) => setProductUrl(e.target.value)}
            placeholder="https://example.myshopify.com/products/mon-produit"
            helpText="Exemple: https://shop.example.com/products/product-handle"
          />

          <s-button onClick={handleFetchProduct} {...(isFetchingPreview ? { loading: true } : {})}>
            Charger le produit
          </s-button>
        </s-stack>
      </s-section>

      {/* Section 2: Prévisualisation */}
      {previewProduct && (
        <>
          <s-section heading="2. Aperçu du produit">
            <s-stack direction="block" gap="base">
              <s-heading>{previewProduct.title}</s-heading>

              {previewProduct.images && previewProduct.images.length > 0 && (
                <s-box>
                  <img
                    src={previewProduct.images[0].url}
                    alt={previewProduct.title}
                    style={{ maxWidth: "300px", borderRadius: "8px" }}
                  />
                </s-box>
              )}

              <s-paragraph>
                <s-text fontWeight="bold">Vendor:</s-text> {previewProduct.vendor || "N/A"}
              </s-paragraph>

              <s-paragraph>
                <s-text fontWeight="bold">Type:</s-text> {previewProduct.productType || "N/A"}
              </s-paragraph>

              <s-paragraph>
                <s-text fontWeight="bold">Variants:</s-text> {previewProduct.variants.length}
              </s-paragraph>
            </s-stack>
          </s-section>

          {/* Section 3: Configuration du pricing */}
          <s-section heading="3. Configuration du pricing">
            <s-stack direction="block" gap="base">
              <s-choice-list
                label="Mode de pricing"
                value={pricingMode}
                onChange={(e: any) => setPricingMode(e.target.value)}
              >
                <s-radio value="markup">
                  Markup fixe (ajouter un montant aux prix)
                </s-radio>
                <s-radio value="multiplier">
                  Multiplicateur (multiplier les prix)
                </s-radio>
              </s-choice-list>

              {pricingMode === "markup" && (
                <s-text-field
                  type="number"
                  label="Montant du markup (€)"
                  value={markupAmount}
                  onChange={(e: any) => setMarkupAmount(e.target.value)}
                  helpText="Exemple: 10 pour ajouter 10€ à chaque prix"
                  step="0.01"
                />
              )}

              {pricingMode === "multiplier" && (
                <s-text-field
                  type="number"
                  label="Multiplicateur"
                  value={multiplier}
                  onChange={(e: any) => setMultiplier(e.target.value)}
                  helpText="Exemple: 1.5 pour augmenter les prix de 50%"
                  step="0.01"
                  min="0.1"
                />
              )}

              <s-choice-list
                label="Statut du produit"
                value={productStatus}
                onChange={(e: any) => setProductStatus(e.target.value)}
              >
                <s-radio value="ACTIVE">Actif (publié)</s-radio>
                <s-radio value="DRAFT">Brouillon</s-radio>
              </s-choice-list>
            </s-stack>
          </s-section>

          {/* Section 4: Aperçu des prix */}
          <s-section heading="4. Aperçu des prix">
            <s-data-table>
              <table>
                <thead>
                  <tr>
                    <th>Variant</th>
                    <th>Prix source</th>
                    <th>Nouveau prix</th>
                  </tr>
                </thead>
                <tbody>
                  {previewProduct.variants.slice(0, 5).map((variant: any) => (
                    <tr key={variant.id}>
                      <td>{variant.title}</td>
                      <td>{variant.price} €</td>
                      <td>
                        <s-text fontWeight="bold">
                          {calculatePreviewPrice(variant.price)} €
                        </s-text>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </s-data-table>

            {previewProduct.variants.length > 5 && (
              <s-paragraph>
                ... et {previewProduct.variants.length - 5} autres variants
              </s-paragraph>
            )}
          </s-section>

          {/* Section 5: Import */}
          <s-section heading="5. Importer">
            <s-stack direction="block" gap="base">
              <s-button
                variant="primary"
                onClick={handleImportProduct}
                {...(isImporting ? { loading: true } : {})}
                {...(!limits.canImport ? { disabled: true } : {})}
              >
                Importer ce produit
              </s-button>

              {!limits.canImport && (
                <s-banner tone="warning">
                  <s-paragraph>
                    Vous avez atteint la limite de votre plan. Veuillez upgrader
                    pour continuer.
                  </s-paragraph>
                </s-banner>
              )}
            </s-stack>
          </s-section>
        </>
      )}

      {/* Section aside: Guide */}
      <s-section slot="aside" heading="Guide d'utilisation">
        <s-unordered-list>
          <s-list-item>Copiez l'URL d'un produit Shopify</s-list-item>
          <s-list-item>Cliquez sur "Charger le produit"</s-list-item>
          <s-list-item>Configurez vos prix</s-list-item>
          <s-list-item>Importez le produit dans votre boutique</s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section slot="aside" heading="Plan actuel">
        <s-paragraph>
          <s-text fontWeight="bold">{limits.planName}</s-text>
        </s-paragraph>
        <s-paragraph>
          {limits.currentCount} / {limits.maxProducts === -1 ? "∞" : limits.maxProducts}{" "}
          produits utilisés
        </s-paragraph>
        <s-link href="/app/billing">Voir les plans</s-link>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
