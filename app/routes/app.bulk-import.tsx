/**
 * Page: Bulk Import - Import multiple products in bulk
 */

import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useActionData, useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import { getOrCreateAppSettings } from "../models/app-settings.server";

// Loader to retrieve settings
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  // Get application settings
  const settings = await getOrCreateAppSettings(shop);

  // Get available collections
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

  // State for shop URL
  const [shopUrl, setShopUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  // State for retrieved products
  const [products, setProducts] = useState<any[]>([]);
  const [shopDomain, setShopDomain] = useState("");

  // State for selection (stores objects {id, handle})
  const [selectedProducts, setSelectedProducts] = useState<
    Map<string, { id: string; handle: string }>
  >(new Map());
  const [selectAll, setSelectAll] = useState(false);

  // Pricing configuration
  const [pricingMode, setPricingMode] = useState(settings.defaultPricingMode);
  const [markupAmount, setMarkupAmount] = useState(
    settings.defaultMarkupAmount.toString(),
  );
  const [multiplier, setMultiplier] = useState(
    settings.defaultMultiplier.toString(),
  );

  // Status and collection
  const [status, setStatus] = useState("ACTIVE");
  const [collectionId, setCollectionId] = useState("");

  // State for import
  const [isImporting, setIsImporting] = useState(false);

  // Function to fetch products
  const fetchProducts = async () => {
    if (!shopUrl.trim()) {
      alert("Please enter a shop URL");
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
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Error fetching products");
    } finally {
      setIsFetching(false);
    }
  };

  // Handle global selection
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

  // Function to toggle product selection
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

  // Function to start import
  const startImport = async () => {
    if (selectedProducts.size === 0) {
      alert("Please select at least one product");
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append("sourceShopUrl", `https://${shopDomain}`);
      formData.append("sourceShop", shopDomain);
      // Convert Map to array of objects {id, handle}
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
        // Redirect to progress page
        navigate(`/app/bulk-import/progress?jobId=${data.jobId}`);
      } else {
        alert(`Error: ${data.error}`);
        setIsImporting(false);
      }
    } catch (error) {
      console.error("Error starting import:", error);
      alert("Error starting import");
      setIsImporting(false);
    }
  };

  return (
    <s-page title="Bulk Import">
      <s-section>
        <s-card>
          <h2 style={{ marginTop: 0 }}>1. Fetch Products</h2>
          <p>Enter the source Shopify shop URL:</p>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <input
              type="text"
              value={shopUrl}
              onChange={(e) => setShopUrl(e.target.value)}
              placeholder="example.myshopify.com or example.com"
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
              {isFetching ? "Loading..." : "Fetch Products"}
            </s-button>
          </div>
        </s-card>
      </s-section>

      {products.length > 0 && (
        <>
          <s-section>
            <s-card>
              <h2 style={{ marginTop: 0 }}>
                2. Select Products ({selectedProducts.size}/
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
                  Select all products
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
                        Title
                      </th>
                      <th style={{ padding: "10px", textAlign: "left" }}>
                        Vendor
                      </th>
                      <th style={{ padding: "10px", textAlign: "left" }}>
                        Type
                      </th>
                      <th style={{ padding: "10px", textAlign: "left" }}>
                        Price
                      </th>
                      <th style={{ padding: "10px", textAlign: "left" }}>
                        Variants
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
              <h2 style={{ marginTop: 0 }}>3. Import Configuration</h2>

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
                    Add fixed amount
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
                    Multiply by
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
                <h3>Status</h3>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ padding: "8px", borderRadius: "4px" }}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h3>Collection (optional)</h3>
                <select
                  value={collectionId}
                  onChange={(e) => setCollectionId(e.target.value)}
                  style={{ padding: "8px", borderRadius: "4px", width: "100%" }}
                >
                  <option value="">No collection</option>
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
                <strong>Note:</strong> The import will run in the background. You
                can leave this page, the import will continue. You can
                track progress on the next page.
              </div>

              <s-button
                onClick={startImport}
                disabled={isImporting || selectedProducts.size === 0}
                variant="primary"
                style={{ width: "100%" }}
              >
                {isImporting
                  ? "Starting import..."
                  : `Import ${selectedProducts.size} product${selectedProducts.size > 1 ? "s" : ""}`}
              </s-button>
            </s-card>
          </s-section>
        </>
      )}
    </s-page>
  );
}
