/**
 * Service de récupération de produits depuis Shopify
 * Supporte Storefront API (produits publics) et Admin API (avec authentification)
 */

import type { SourceProduct } from "../utils/types";
import { parseShopifyProductUrl } from "../utils/validators";
import { ERROR_MESSAGES } from "../utils/constants";

/**
 * Récupère un produit via Storefront API (produits publics)
 */
export async function fetchProductFromStorefront(
  shop: string,
  handle: string,
): Promise<SourceProduct> {
  const storefrontAccessToken = process.env.STOREFRONT_ACCESS_TOKEN;

  // Pour l'instant, nous utilisons l'API publique
  // Note: Pour un vrai shop source, il faudrait que le marchand configure un token
  const query = `
    query getProduct($handle: String!) {
      productByHandle(handle: $handle) {
        id
        handle
        title
        description
        descriptionHtml
        vendor
        productType
        tags
        images(first: 20) {
          edges {
            node {
              id
              url
              altText
            }
          }
        }
        variants(first: 100) {
          edges {
            node {
              id
              title
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              sku
              barcode
              availableForSale
              weight
              weightUnit
              requiresShipping
              taxable
              selectedOptions {
                name
                value
              }
            }
          }
        }
        options {
          name
          values
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://${shop}/api/2024-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(storefrontAccessToken && {
          "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
        }),
      },
      body: JSON.stringify({
        query,
        variables: { handle },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || "GraphQL error");
    }

    const product = result.data?.productByHandle;
    if (!product) {
      throw new Error(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    return transformStorefrontProduct(product);
  } catch (error) {
    console.error("Error fetching product from Storefront API:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch product",
    );
  }
}

/**
 * Récupère un produit via Admin API
 */
export async function fetchProductFromAdmin(
  admin: any,
  productId: string,
): Promise<SourceProduct> {
  const query = `
    query getProduct($id: ID!) {
      product(id: $id) {
        id
        handle
        title
        description
        descriptionHtml
        vendor
        productType
        tags
        images(first: 20) {
          edges {
            node {
              id
              url
              altText
            }
          }
        }
        variants(first: 100) {
          edges {
            node {
              id
              title
              price
              compareAtPrice
              sku
              barcode
              inventoryQuantity
              weight
              weightUnit
              requiresShipping
              taxable
              selectedOptions {
                name
                value
              }
            }
          }
        }
        options {
          name
          values
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(query, {
      variables: { id: productId },
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || "GraphQL error");
    }

    const product = result.data?.product;
    if (!product) {
      throw new Error(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    return transformAdminProduct(product);
  } catch (error) {
    console.error("Error fetching product from Admin API:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch product",
    );
  }
}

/**
 * Récupère un produit selon l'URL fournie
 */
export async function fetchProductByUrl(
  url: string,
  adminClient?: any,
): Promise<SourceProduct> {
  const parsed = parseShopifyProductUrl(url);

  if (!parsed) {
    throw new Error(ERROR_MESSAGES.INVALID_SHOPIFY_URL);
  }

  // Si c'est une URL admin et qu'on a un client admin, utiliser Admin API
  if (parsed.isAdminUrl && parsed.productId && adminClient) {
    const gid = `gid://shopify/Product/${parsed.productId}`;
    return fetchProductFromAdmin(adminClient, gid);
  }

  // Sinon utiliser Storefront API
  if (parsed.handle) {
    return fetchProductFromStorefront(parsed.shop, parsed.handle);
  }

  throw new Error(ERROR_MESSAGES.INVALID_SHOPIFY_URL);
}

/**
 * Transforme un produit Storefront API vers notre format interne
 */
function transformStorefrontProduct(product: any): SourceProduct {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description || "",
    descriptionHtml: product.descriptionHtml,
    vendor: product.vendor,
    productType: product.productType,
    tags: product.tags || [],
    images:
      product.images?.edges.map((edge: any) => ({
        id: edge.node.id,
        url: edge.node.url,
        altText: edge.node.altText,
      })) || [],
    variants:
      product.variants?.edges.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        price: edge.node.price.amount,
        compareAtPrice: edge.node.compareAtPrice?.amount,
        sku: edge.node.sku,
        barcode: edge.node.barcode,
        inventoryQuantity: 0, // Non disponible via Storefront API
        weight: edge.node.weight,
        weightUnit: edge.node.weightUnit,
        requiresShipping: edge.node.requiresShipping,
        taxable: edge.node.taxable,
        options: edge.node.selectedOptions,
      })) || [],
    options:
      product.options?.map((option: any) => ({
        name: option.name,
        values: option.values,
      })) || [],
  };
}

/**
 * Transforme un produit Admin API vers notre format interne
 */
function transformAdminProduct(product: any): SourceProduct {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description || "",
    descriptionHtml: product.descriptionHtml,
    vendor: product.vendor,
    productType: product.productType,
    tags: product.tags || [],
    images:
      product.images?.edges.map((edge: any) => ({
        id: edge.node.id,
        url: edge.node.url,
        altText: edge.node.altText,
      })) || [],
    variants:
      product.variants?.edges.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        price: edge.node.price,
        compareAtPrice: edge.node.compareAtPrice,
        sku: edge.node.sku,
        barcode: edge.node.barcode,
        inventoryQuantity: edge.node.inventoryQuantity,
        weight: edge.node.weight,
        weightUnit: edge.node.weightUnit,
        requiresShipping: edge.node.requiresShipping,
        taxable: edge.node.taxable,
        options: edge.node.selectedOptions,
      })) || [],
    options:
      product.options?.map((option: any) => ({
        name: option.name,
        values: option.values,
      })) || [],
  };
}
