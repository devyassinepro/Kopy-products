/**
 * Page: Collection Import - Import all products from a collection
 */

import { useState, useEffect } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import { getOrCreateAppSettings } from "../models/app-settings.server";
import { ImportProgress } from "../components/ImportProgress";
import prisma from "../db.server";

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

  // Check for active jobs (pending or processing)
  const activeJob = await prisma.bulkImportJob.findFirst({
    where: {
      shop,
      jobStatus: {
        in: ["pending", "processing"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return Response.json({
    settings: {
      defaultPricingMode: settings.defaultPricingMode,
      defaultMarkupAmount: settings.defaultMarkupAmount,
      defaultMultiplier: settings.defaultMultiplier,
    },
    collections,
    activeJobId: activeJob?.id || null,
  });
};

export default function CollectionImport() {
  const { settings, collections, activeJobId: loaderActiveJobId } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // State for collection URL
  const [collectionUrl, setCollectionUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  // State for retrieved products
  const [products, setProducts] = useState<any[]>([]);
  const [shopDomain, setShopDomain] = useState("");
  const [collectionHandle, setCollectionHandle] = useState("");

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
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Load active job from loader if exists
  useEffect(() => {
    if (loaderActiveJobId) {
      setActiveJobId(loaderActiveJobId);
      setIsImporting(true);
    }
  }, [loaderActiveJobId]);

  // Function to fetch products from collection
  const fetchProducts = async () => {
    if (!collectionUrl.trim()) {
      alert("Please enter a collection URL");
      return;
    }

    setIsFetching(true);
    try {
      const formData = new FormData();
      formData.append("collectionUrl", collectionUrl);

      const response = await fetch("/api/collection/fetch-products", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setProducts(data.products || []);
        setShopDomain(data.shopDomain);
        setCollectionHandle(data.collectionHandle);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error fetching collection products:", error);
      alert("Error fetching products");
    } finally {
      setIsFetching(false);
    }
  };

  // Function to start import
  const startImport = async () => {
    if (products.length === 0) {
      alert("No products to import");
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append("sourceShopUrl", `https://${shopDomain}`);
      formData.append("sourceShop", shopDomain);
      // All products are auto-selected
      const productData = products.map((p) => ({ id: p.id, handle: p.handle }));
      formData.append("productData", JSON.stringify(productData));
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
        // Set active job ID to display progress inline
        setActiveJobId(data.jobId);
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
    <s-page title="Collection Import">
      <s-section>
        <s-card>
          <h2 style={{ marginTop: 0 }}>1. Enter Collection URL</h2>
          <p>
            Enter the URL of a Shopify collection to import all its products:
          </p>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <input
              type="text"
              value={collectionUrl}
              onChange={(e) => setCollectionUrl(e.target.value)}
              placeholder="https://example.myshopify.com/collections/summer-sale"
              style={{
                flex: 1,
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
            <s-button
              onClick={fetchProducts}
              disabled={isFetching || !collectionUrl.trim() || isImporting}
              variant="primary"
            >
              {isFetching ? "Loading..." : "Fetch Products"}
            </s-button>
          </div>

          <div
            style={{
              padding: "12px",
              background: "#f9fafb",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            <strong>Accepted formats:</strong>
            <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
              <li>https://shop.myshopify.com/collections/summer-sale</li>
              <li>shop.myshopify.com/collections/summer-sale</li>
              <li>https://shop.com/collections/summer-sale</li>
            </ul>
          </div>
        </s-card>
      </s-section>

      {products.length > 0 && (
        <>
          <s-section>
            <s-card>
              <h2 style={{ marginTop: 0 }}>
                2. Collection Products ({products.length})
              </h2>

              <div
                style={{
                  padding: "12px",
                  background: "#f0f9ff",
                  borderRadius: "4px",
                  marginBottom: "15px",
                }}
              >
                <strong>ℹ️ All products will be imported</strong>
                <p style={{ margin: "5px 0 0 0", fontSize: "14px" }}>
                  Collection: {collectionHandle} ({shopDomain})
                </p>
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
                          background: "#f0f9ff",
                        }}
                      >
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
                <h3>Destination collection (optional)</h3>
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
                <strong>Note:</strong> The import will run in the background.
                You can leave this page, the import will continue. You can
                track progress on this page.
              </div>

              <s-button
                onClick={startImport}
                disabled={isImporting || products.length === 0}
                variant="primary"
                style={{ width: "100%" }}
              >
                {isImporting
                  ? "Starting import..."
                  : `Import ${products.length} product${products.length > 1 ? "s" : ""}`}
              </s-button>
            </s-card>
          </s-section>
        </>
      )}

      {activeJobId && (
        <s-section>
          <s-card>
            <ImportProgress
              jobId={activeJobId}
              onComplete={() => setIsImporting(false)}
              onNewImport={() => {
                setActiveJobId(null);
                setIsImporting(false);
                setProducts([]);
                setCollectionUrl("");
              }}
            />
          </s-card>
        </s-section>
      )}
    </s-page>
  );
}
