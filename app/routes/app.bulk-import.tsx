/**
 * Page : Bulk Import - Importer plusieurs produits en masse
 */

import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useActionData, useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import { getOrCreateAppSettings } from "../models/app-settings.server";

// Loader pour récupérer les paramètres
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  // Récupérer les paramètres de l'application
  const settings = await getOrCreateAppSettings(shop);

  // Récupérer les collections disponibles
  const collectionsResponse = await admin.graphql(`
    query {
      collections(first: 100) {
        edges {
          node {
            id
            title
          }
        }
      }
    }
  `);

  const collectionsData = await collectionsResponse.json();
  const collections =
    collectionsData.data.collections.edges.map((edge: any) => edge.node) || [];

  return Response.json({
    settings: {
      defaultPricingMode: settings.defaultPricingMode,
      defaultMarkupAmount: settings.defaultMarkupAmount,
      defaultMultiplier: settings.defaultMultiplier,
    },
    collections,
  });
};

export default function BulkImport() {
  const { settings, collections } = useLoaderData<typeof loader>();
  const actionData = useActionData<any>();
  const navigate = useNavigate();

  // État pour l'URL de la boutique
  const [shopUrl, setShopUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  // État pour les produits récupérés
  const [products, setProducts] = useState<any[]>([]);
  const [shopDomain, setShopDomain] = useState("");

  // État pour la sélection (stocke les objets {id, handle})
  const [selectedProducts, setSelectedProducts] = useState<
    Map<string, { id: string; handle: string }>
  >(new Map());
  const [selectAll, setSelectAll] = useState(false);

  // Configuration de pricing
  const [pricingMode, setPricingMode] = useState(settings.defaultPricingMode);
  const [markupAmount, setMarkupAmount] = useState(
    settings.defaultMarkupAmount.toString(),
  );
  const [multiplier, setMultiplier] = useState(
    settings.defaultMultiplier.toString(),
  );

  // Statut et collection
  const [status, setStatus] = useState("ACTIVE");
  const [collectionId, setCollectionId] = useState("");

  // État pour l'import
  const [isImporting, setIsImporting] = useState(false);

  // Fonction pour récupérer les produits
  const fetchProducts = async () => {
    if (!shopUrl.trim()) {
      alert("Veuillez entrer une URL de boutique");
      return;
    }

    setIsFetching(true);
    try {
      const formData = new FormData();
      formData.append("shopUrl", shopUrl);

      const response = await fetch("/api/bulk/fetch-products", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setProducts(data.products || []);
        setShopDomain(data.shopDomain);
      } else {
        alert(`Erreur : ${data.error}`);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Erreur lors de la récupération des produits");
    } finally {
      setIsFetching(false);
    }
  };

  // Gérer la sélection globale
  useEffect(() => {
    if (selectAll) {
      const newMap = new Map<string, { id: string; handle: string }>();
      products.forEach((p) => {
        newMap.set(p.id, { id: p.id, handle: p.handle });
      });
      setSelectedProducts(newMap);
    } else {
      setSelectedProducts(new Map());
    }
  }, [selectAll, products]);

  // Fonction pour basculer la sélection d'un produit
  const toggleProductSelection = (product: {
    id: string;
    handle: string;
  }) => {
    const newSelected = new Map(selectedProducts);
    if (newSelected.has(product.id)) {
      newSelected.delete(product.id);
    } else {
      newSelected.set(product.id, { id: product.id, handle: product.handle });
    }
    setSelectedProducts(newSelected);
  };

  // Fonction pour lancer l'import
  const startImport = async () => {
    if (selectedProducts.size === 0) {
      alert("Veuillez sélectionner au moins un produit");
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append("sourceShopUrl", `https://${shopDomain}`);
      formData.append("sourceShop", shopDomain);
      // Convertir la Map en array d'objets {id, handle}
      formData.append(
        "productData",
        JSON.stringify(Array.from(selectedProducts.values())),
      );
      formData.append("pricingMode", pricingMode);
      formData.append("markupAmount", markupAmount);
      formData.append("multiplier", multiplier);
      formData.append("status", status);
      if (collectionId) {
        formData.append("collectionId", collectionId);
      }

      const response = await fetch("/api/bulk/start-import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Rediriger vers la page de progression
        navigate(`/app/bulk-import/progress?jobId=${data.jobId}`);
      } else {
        alert(`Erreur : ${data.error}`);
        setIsImporting(false);
      }
    } catch (error) {
      console.error("Error starting import:", error);
      alert("Erreur lors du lancement de l'import");
      setIsImporting(false);
    }
  };

  return (
    <s-page title="Import en masse">
      <s-section>
        <s-card>
          <h2 style={{ marginTop: 0 }}>1. Récupérer les produits</h2>
          <p>Entrez l'URL de la boutique Shopify source :</p>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <input
              type="text"
              value={shopUrl}
              onChange={(e) => setShopUrl(e.target.value)}
              placeholder="example.myshopify.com ou example.com"
              style={{
                flex: 1,
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
            <s-button
              onClick={fetchProducts}
              disabled={isFetching || !shopUrl.trim()}
              variant="primary"
            >
              {isFetching ? "Chargement..." : "Récupérer les produits"}
            </s-button>
          </div>
        </s-card>
      </s-section>

      {products.length > 0 && (
        <>
          <s-section>
            <s-card>
              <h2 style={{ marginTop: 0 }}>
                2. Sélectionner les produits ({selectedProducts.size}/
                {products.length})
              </h2>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => setSelectAll(e.target.checked)}
                    style={{ marginRight: "8px" }}
                  />
                  Sélectionner tous les produits
                </label>
              </div>

              <div
                style={{
                  maxHeight: "400px",
                  overflowY: "auto",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead
                    style={{ position: "sticky", top: 0, background: "#f9f9f9" }}
                  >
                    <tr>
                      <th style={{ padding: "10px", textAlign: "left" }}>
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={(e) => setSelectAll(e.target.checked)}
                        />
                      </th>
                      <th style={{ padding: "10px", textAlign: "left" }}>
                        Image
                      </th>
                      <th style={{ padding: "10px", textAlign: "left" }}>
                        Titre
                      </th>
                      <th style={{ padding: "10px", textAlign: "left" }}>
                        Vendeur
                      </th>
                      <th style={{ padding: "10px", textAlign: "left" }}>
                        Type
                      </th>
                      <th style={{ padding: "10px", textAlign: "left" }}>
                        Prix
                      </th>
                      <th style={{ padding: "10px", textAlign: "left" }}>
                        Variantes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        style={{
                          borderBottom: "1px solid #eee",
                          background: selectedProducts.has(product.id)
                            ? "#f0f9ff"
                            : "white",
                        }}
                      >
                        <td style={{ padding: "10px" }}>
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={() =>
                              toggleProductSelection({
                                id: product.id,
                                handle: product.handle,
                              })
                            }
                          />
                        </td>
                        <td style={{ padding: "10px" }}>
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.title}
                              style={{
                                width: "50px",
                                height: "50px",
                                objectFit: "cover",
                                borderRadius: "4px",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "50px",
                                height: "50px",
                                background: "#f0f0f0",
                                borderRadius: "4px",
                              }}
                            />
                          )}
                        </td>
                        <td style={{ padding: "10px" }}>{product.title}</td>
                        <td style={{ padding: "10px" }}>{product.vendor}</td>
                        <td style={{ padding: "10px" }}>
                          {product.productType}
                        </td>
                        <td style={{ padding: "10px" }}>${product.price}</td>
                        <td style={{ padding: "10px" }}>
                          {product.variantsCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </s-card>
          </s-section>

          <s-section>
            <s-card>
              <h2 style={{ marginTop: 0 }}>3. Configuration de l'import</h2>

              <div style={{ marginBottom: "20px" }}>
                <h3>Pricing</h3>
                <div style={{ marginBottom: "15px" }}>
                  <label>
                    <input
                      type="radio"
                      name="pricingMode"
                      value="markup"
                      checked={pricingMode === "markup"}
                      onChange={(e) => setPricingMode(e.target.value)}
                    />{" "}
                    Ajouter un montant fixe
                  </label>
                  <input
                    type="number"
                    value={markupAmount}
                    onChange={(e) => setMarkupAmount(e.target.value)}
                    disabled={pricingMode !== "markup"}
                    style={{ marginLeft: "10px", padding: "5px", width: "100px" }}
                    step="0.01"
                  />
                  $
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label>
                    <input
                      type="radio"
                      name="pricingMode"
                      value="multiplier"
                      checked={pricingMode === "multiplier"}
                      onChange={(e) => setPricingMode(e.target.value)}
                    />{" "}
                    Multiplier par
                  </label>
                  <input
                    type="number"
                    value={multiplier}
                    onChange={(e) => setMultiplier(e.target.value)}
                    disabled={pricingMode !== "multiplier"}
                    style={{ marginLeft: "10px", padding: "5px", width: "100px" }}
                    step="0.01"
                  />
                  x
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h3>Statut</h3>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ padding: "8px", borderRadius: "4px" }}
                >
                  <option value="ACTIVE">Actif</option>
                  <option value="DRAFT">Brouillon</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h3>Collection (optionnel)</h3>
                <select
                  value={collectionId}
                  onChange={(e) => setCollectionId(e.target.value)}
                  style={{ padding: "8px", borderRadius: "4px", width: "100%" }}
                >
                  <option value="">Aucune collection</option>
                  {collections.map((collection: any) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.title}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  padding: "15px",
                  background: "#f0f9ff",
                  borderRadius: "4px",
                  marginBottom: "20px",
                }}
              >
                <strong>Note :</strong> L'import se fera en arrière-plan. Vous
                pouvez quitter cette page, l'import continuera. Vous pourrez
                suivre la progression sur la page suivante.
              </div>

              <s-button
                onClick={startImport}
                disabled={isImporting || selectedProducts.size === 0}
                variant="primary"
                style={{ width: "100%" }}
              >
                {isImporting
                  ? "Lancement en cours..."
                  : `Importer ${selectedProducts.size} produit${selectedProducts.size > 1 ? "s" : ""}`}
              </s-button>
            </s-card>
          </s-section>
        </>
      )}
    </s-page>
  );
}
