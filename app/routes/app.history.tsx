/**
 * Page Historique : Liste des produits importés
 */

import { useState, useEffect } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useSearchParams } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { getImportedProducts, getProductStats, getUniqueSourceShops } from "../models/imported-product.server";
import { formatRelativeDate, formatPricingDescription, formatProductStatus } from "../utils/formatters";
import type { ProductHistoryFilters } from "../utils/types";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Parser les query params
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const status = url.searchParams.get("status") || undefined;
  const sourceShop = url.searchParams.get("sourceShop") || undefined;
  const pricingMode = url.searchParams.get("pricingMode") || undefined;
  const search = url.searchParams.get("search") || undefined;

  const filters: ProductHistoryFilters = {
    status: status as any,
    sourceShop,
    pricingMode: pricingMode as any,
    search,
  };

  // Récupérer les produits avec pagination
  const productsResult = await getImportedProducts(shop, filters, { page, limit: 20 });

  // Récupérer les stats et sources
  const [stats, sources] = await Promise.all([
    getProductStats(shop),
    getUniqueSourceShops(shop),
  ]);

  return Response.json({
    products: productsResult.data,
    pagination: productsResult.pagination,
    stats,
    sources,
    filters,
  });
};

export default function History() {
  const { products, pagination, stats, sources, filters } = useLoaderData<typeof loader>();
  const shopify = useAppBridge();
  const [searchParams, setSearchParams] = useSearchParams();
  const syncFetcher = useFetcher();

  // State local pour les filtres
  const [searchQuery, setSearchQuery] = useState(filters.search || "");

  // Gérer les réponses de sync
  useEffect(() => {
    if (syncFetcher.data?.success) {
      shopify.toast.show("Produit synchronisé avec succès");
      window.location.reload();
    } else if (syncFetcher.data?.error) {
      shopify.toast.show(syncFetcher.data.error, { isError: true });
    }
  }, [syncFetcher.data, shopify]);

  // Fonction pour mettre à jour les filtres
  const updateFilter = (key: string, value: string | undefined) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set("page", "1"); // Reset à la page 1
    setSearchParams(newParams);
  };

  // Fonction pour changer de page
  const goToPage = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", page.toString());
    setSearchParams(newParams);
  };

  // Fonction pour voir un produit dans Shopify
  const viewProduct = (productId: string) => {
    shopify.intents.invoke?.("edit:shopify/Product", {
      value: `gid://shopify/Product/${productId}`,
    });
  };

  // Gérer la recherche
  const handleSearch = () => {
    updateFilter("search", searchQuery || undefined);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchQuery("");
  };

  const handleSync = (productId: string) => {
    const formData = new FormData();
    syncFetcher.submit(formData, {
      method: "POST",
      action: `/api/sync-product/${productId}`,
    });
  };

  const hasActiveFilters = filters.status || filters.sourceShop || filters.pricingMode || filters.search;

  return (
    <s-page heading="Historique des produits importés">
      <s-link slot="back-action" href="/app" />

      <s-button slot="primary-action" variant="primary" href="/app">
        Importer un produit
      </s-button>

      {/* Stats Cards */}
      <s-stack direction="inline" gap="base">
        <s-box padding="base" borderWidth="base" borderRadius="base">
          <s-stack direction="block" gap="tight">
            <s-text tone="subdued">Total</s-text>
            <s-heading>{stats.total}</s-heading>
          </s-stack>
        </s-box>

        <s-box padding="base" borderWidth="base" borderRadius="base">
          <s-stack direction="block" gap="tight">
            <s-text tone="subdued">Actifs</s-text>
            <s-heading>{stats.active}</s-heading>
          </s-stack>
        </s-box>

        <s-box padding="base" borderWidth="base" borderRadius="base">
          <s-stack direction="block" gap="tight">
            <s-text tone="subdued">Brouillons</s-text>
            <s-heading>{stats.draft}</s-heading>
          </s-stack>
        </s-box>

        <s-box padding="base" borderWidth="base" borderRadius="base">
          <s-stack direction="block" gap="tight">
            <s-text tone="subdued">Avec sync</s-text>
            <s-heading>{stats.withSyncEnabled}</s-heading>
          </s-stack>
        </s-box>
      </s-stack>

      {/* Filtres */}
      <s-section heading="Filtres">
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base">
            {/* Recherche */}
            <s-text-field
              label="Rechercher"
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              placeholder="Titre, handle..."
            />
            <s-button onClick={handleSearch}>Rechercher</s-button>
          </s-stack>

          <s-stack direction="inline" gap="base">
            {/* Statut */}
            <s-select
              label="Statut"
              value={filters.status || ""}
              onChange={(e: any) => updateFilter("status", e.target.value || undefined)}
            >
              <option value="">Tous</option>
              <option value="active">Actif</option>
              <option value="draft">Brouillon</option>
              <option value="archived">Archivé</option>
            </s-select>

            {/* Source */}
            {sources.length > 0 && (
              <s-select
                label="Boutique source"
                value={filters.sourceShop || ""}
                onChange={(e: any) => updateFilter("sourceShop", e.target.value || undefined)}
              >
                <option value="">Toutes</option>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </s-select>
            )}

            {/* Pricing */}
            <s-select
              label="Mode de pricing"
              value={filters.pricingMode || ""}
              onChange={(e: any) => updateFilter("pricingMode", e.target.value || undefined)}
            >
              <option value="">Tous</option>
              <option value="markup">Markup</option>
              <option value="multiplier">Multiplicateur</option>
            </s-select>
          </s-stack>

          {hasActiveFilters && (
            <s-button onClick={clearFilters} variant="tertiary">
              Effacer les filtres
            </s-button>
          )}
        </s-stack>
      </s-section>

      {/* Liste des produits */}
      <s-section heading={`Produits (${pagination.total})`}>
        {products.length === 0 ? (
          <s-empty-state heading="Aucun produit trouvé">
            <s-paragraph>
              {hasActiveFilters
                ? "Aucun produit ne correspond aux filtres sélectionnés."
                : "Vous n'avez pas encore importé de produits."}
            </s-paragraph>
            {!hasActiveFilters && (
              <s-button variant="primary" href="/app">
                Importer votre premier produit
              </s-button>
            )}
          </s-empty-state>
        ) : (
          <s-data-table>
            <table>
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Source</th>
                  <th>Statut</th>
                  <th>Pricing</th>
                  <th>Variants</th>
                  <th>Importé</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <s-text fontWeight="bold">{product.title}</s-text>
                    </td>
                    <td>{product.sourceShop}</td>
                    <td>
                      <s-badge
                        tone={
                          product.status === "active"
                            ? "success"
                            : product.status === "draft"
                            ? "info"
                            : "critical"
                        }
                      >
                        {formatProductStatus(product.status)}
                      </s-badge>
                    </td>
                    <td>
                      {formatPricingDescription({
                        mode: product.pricingMode as any,
                        markupAmount: product.markupAmount || undefined,
                        multiplier: product.multiplier || undefined,
                      })}
                    </td>
                    <td>{product.variants.length}</td>
                    <td>{formatRelativeDate(product.createdAt)}</td>
                    <td>
                      <s-stack direction="inline" gap="tight">
                        <s-button
                          size="small"
                          onClick={() => viewProduct(product.destinationProductId)}
                        >
                          Voir
                        </s-button>
                        <s-button
                          size="small"
                          variant="secondary"
                          onClick={() => handleSync(product.id)}
                          {...(syncFetcher.state !== "idle" ? { loading: true } : {})}
                        >
                          Sync
                        </s-button>
                      </s-stack>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </s-data-table>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <s-stack direction="inline" gap="tight" style={{ marginTop: "16px" }}>
            <s-button
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Précédent
            </s-button>

            <s-text>
              Page {pagination.page} sur {pagination.totalPages}
            </s-text>

            <s-button
              onClick={() => goToPage(pagination.page + 1)}
              disabled={!pagination.hasMore}
            >
              Suivant
            </s-button>
          </s-stack>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
