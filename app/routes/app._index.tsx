/**
 * Page principale : Import et édition de produits
 * Interface complète avec tous les champs modifiables
 */

import { useState, useEffect } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { getOrCreateAppSettings, canImportMoreProducts } from "../models/app-settings.server";
import { calculateUsagePercentage } from "../utils/formatters";
import type { SourceProduct } from "../utils/types";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  // Récupérer les paramètres et limites
  const settings = await getOrCreateAppSettings(shop);
  const limits = await canImportMoreProducts(shop);
  const usagePercentage = calculateUsagePercentage(
    limits.currentCount,
    limits.maxProducts,
  );

  // Récupérer les collections
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
    collections,
  });
};

export default function ImportProduct() {
  const { settings, limits, collections } = useLoaderData<typeof loader>();
  const shopify = useAppBridge();

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
  const [pricingMode, setPricingMode] = useState(settings.defaultPricingMode);
  const [markupAmount, setMarkupAmount] = useState(settings.defaultMarkupAmount.toString());
  const [multiplier, setMultiplier] = useState(settings.defaultMultiplier.toString());
  const [applyToAll, setApplyToAll] = useState(true);

  // State - Publishing
  const [productStatus, setProductStatus] = useState("ACTIVE");
  const [selectedCollection, setSelectedCollection] = useState("");

  // State - UI
  const [showPreview, setShowPreview] = useState(false);
  const [showDescriptionEditor, setShowDescriptionEditor] = useState(false);

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
      const product = fetchProductFetcher.data.product;
      setProductData(product);
      setEditedTitle(product.title);
      setEditedDescription(product.description);
      setEditedDescriptionHtml(product.descriptionHtml);
      setEditedVendor(product.vendor || "");
      setEditedProductType(product.productType || "");
      setEditedTags(product.tags || []);
      setEditedImages(product.images || []);
      setEditedVariants(product.variants || []);
      setShowPreview(true);
      shopify.toast.show("Produit chargé avec succès !");
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
      setProductData(null);
      setShowPreview(false);
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
    if (!productData) {
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

    // Appliquer les prix modifiés aux variants
    const finalVariants = editedVariants.map((variant) => {
      let finalPrice = parseFloat(variant.price);

      if (applyToAll) {
        if (pricingMode === "markup") {
          finalPrice = finalPrice + parseFloat(markupAmount || "0");
        } else {
          finalPrice = finalPrice * parseFloat(multiplier || "1");
        }
      }

      return {
        ...variant,
        price: finalPrice.toFixed(2),
      };
    });

    // Construire le produit final avec toutes les modifications
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

    const formData = new FormData();
    formData.append("productData", JSON.stringify(finalProduct));
    formData.append("sourceUrl", productUrl);
    formData.append("pricingMode", pricingMode);
    formData.append("markupAmount", markupAmount);
    formData.append("multiplier", multiplier);
    formData.append("status", productStatus);
    formData.append("collectionId", selectedCollection);

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

      if (pricingMode === "markup") {
        newPrice = originalPrice + parseFloat(markupAmount || "0");
      } else {
        newPrice = originalPrice * parseFloat(multiplier || "1");
      }

      return { ...variant, price: newPrice.toFixed(2) };
    });

    setEditedVariants(newVariants);
    shopify.toast.show("Prix appliqués à tous les variants !");
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
    shopify.toast.show(`Prix augmentés !`);
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
    shopify.toast.show(`Prix diminués !`);
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

          <s-banner tone="info">
            <s-paragraph>
              L'URL est utilisée pour récupérer toutes les données du produit (titre, description, images, variants, etc.).
              Une fois chargé, vous pourrez modifier tous les champs avant l'import.
            </s-paragraph>
          </s-banner>

          <s-text-field
            label="URL du produit Shopify"
            value={productUrl}
            onChange={(e: any) => setProductUrl(e.target.value)}
            placeholder="https://example.myshopify.com/products/mon-produit"
          />

          <s-button onClick={handleFetchProduct} {...(isFetchingPreview ? { loading: true } : {})}>
            {isFetchingPreview ? "Chargement..." : "Charger le produit"}
          </s-button>
        </s-stack>
      </s-section>

      {/* Section 2: Édition des informations de base */}
      {showPreview && productData && (
        <>
          <s-section heading="2. Informations du produit">
            <s-stack direction="block" gap="base">
              <s-text-field
                label="Titre du produit"
                value={editedTitle}
                onChange={(e: any) => setEditedTitle(e.target.value)}
              />

              <s-text-field
                label="Vendor"
                value={editedVendor}
                onChange={(e: any) => setEditedVendor(e.target.value)}
                helptext="Nom du fournisseur ou de la marque"
              />

              <s-text-field
                label="Type de produit"
                value={editedProductType}
                onChange={(e: any) => setEditedProductType(e.target.value)}
                helptext="Catégorie du produit"
              />

              {/* Description */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#202223" }}>
                  Description
                </label>

                {!showDescriptionEditor ? (
                  <div>
                    <s-paragraph>
                      {editedDescription.substring(0, 200)}
                      {editedDescription.length > 200 && "..."}
                    </s-paragraph>
                    <s-button onClick={() => setShowDescriptionEditor(true)}>
                      Modifier la description
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
                      placeholder="<p>Description HTML...</p>"
                    />
                    <s-stack direction="inline" gap="small">
                      <s-button onClick={() => setShowDescriptionEditor(false)}>
                        Fermer l'éditeur
                      </s-button>
                      <s-text size="small" tone="subdued">
                        Vous pouvez utiliser du HTML (p, strong, ul, li, etc.)
                      </s-text>
                    </s-stack>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#202223" }}>
                  Tags (séparés par des virgules)
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

          {/* Section 3: Gestion des images */}
          <s-section heading="3. Images du produit">
            <s-stack direction="block" gap="base">
              <s-paragraph>
                Gérez les images de votre produit. Vous pouvez supprimer ou réordonner les images.
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
                        <s-badge tone="success">Image principale</s-badge>
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
                        🗑️ Supprimer
                      </button>
                    </s-stack>
                  </div>
                ))}
              </div>

              {editedImages.length === 0 && (
                <s-banner tone="warning">
                  <s-paragraph>Aucune image disponible pour ce produit.</s-paragraph>
                </s-banner>
              )}
            </s-stack>
          </s-section>

          {/* Section 4: Configuration du pricing */}
          <s-section heading="4. Configuration du pricing">
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
                  helptext="Exemple: 10 pour ajouter 10€ à chaque prix"
                  step="0.01"
                />
              )}

              {pricingMode === "multiplier" && (
                <s-text-field
                  type="number"
                  label="Multiplicateur"
                  value={multiplier}
                  onChange={(e: any) => setMultiplier(e.target.value)}
                  helptext="Exemple: 1.5 pour augmenter les prix de 50%"
                  step="0.01"
                  min="0.1"
                />
              )}

              <s-stack direction="inline" gap="base">
                <s-button variant="primary" onClick={handleIncreaseAllPrices}>
                  ⬆️ Augmenter tous les prix
                </s-button>
                <s-button onClick={handleDecreaseAllPrices}>
                  ⬇️ Diminuer tous les prix
                </s-button>
                <s-button onClick={handleApplyPricingToAll}>
                  Appliquer à tous
                </s-button>
              </s-stack>
            </s-stack>
          </s-section>

          {/* Section 5: Gestion des variants */}
          <s-section heading="5. Variants et prix">
            <s-stack direction="block" gap="base">
              <s-paragraph>
                Modifiez les prix de chaque variant individuellement si nécessaire.
              </s-paragraph>

              <s-data-table>
                <table>
                  <thead>
                    <tr>
                      <th>Variant</th>
                      <th>Prix actuel</th>
                      <th>Aperçu nouveau prix</th>
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

          {/* Section 6: Options de publication */}
          <s-section heading="6. Options de publication">
            <s-stack direction="block" gap="base">
              <s-choice-list
                label="Statut du produit"
                value={productStatus}
                onChange={(e: any) => setProductStatus(e.target.value)}
              >
                <s-radio value="ACTIVE">Actif (publié)</s-radio>
                <s-radio value="DRAFT">Brouillon</s-radio>
              </s-choice-list>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label htmlFor="selectedCollection" style={{ fontSize: "13px", fontWeight: "600", color: "#202223" }}>
                  Collection (optionnel)
                </label>
                <select
                  id="selectedCollection"
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #c9cccf",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "white",
                    cursor: "pointer",
                  }}
                >
                  <option value="">-- Aucune collection --</option>
                  {collections && collections.length > 0 ? (
                    collections.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))
                  ) : null}
                </select>
              </div>

              <s-stack direction="inline" gap="base">
                <s-button onClick={() => setShowPreview(false)}>
                  Annuler
                </s-button>
                <s-button
                  variant="primary"
                  onClick={handleImportProduct}
                  {...(isImporting ? { loading: true } : {})}
                  {...(!limits.canImport ? { disabled: true } : {})}
                >
                  {isImporting ? "Import en cours..." : "Importer ce produit"}
                </s-button>
              </s-stack>

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
        <s-ordered-list>
          <s-list-item>Copiez l'URL d'un produit Shopify</s-list-item>
          <s-list-item>Cliquez sur "Charger le produit"</s-list-item>
          <s-list-item>Modifiez le titre, description, images</s-list-item>
          <s-list-item>Configurez vos prix (individuel ou global)</s-list-item>
          <s-list-item>Choisissez le statut et la collection</s-list-item>
          <s-list-item>Importez le produit dans votre boutique</s-list-item>
        </s-ordered-list>
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
