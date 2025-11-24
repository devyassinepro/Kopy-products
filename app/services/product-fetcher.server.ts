/**
 * Service de récupération de produits depuis Shopify
 * Supporte Storefront API (produits publics) et Admin API (avec authentification)
 */

import type { SourceProduct } from "../utils/types";
import { parseShopifyProductUrl } from "../utils/validators";
import { ERROR_MESSAGES } from "../utils/constants";

/**
 * Récupère un produit via l'endpoint JSON public de Shopify
 * Cette méthode fonctionne pour toutes les boutiques Shopify sans authentification
 */
export async function fetchProductFromStorefront(
  shop: string,
  handle: string,
): Promise<SourceProduct> {
  try {
    // Construire l'URL avec .json pour obtenir les données du produit
    const url = `https://${shop}/products/${handle}.json`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Poky-fy Import & Copy Products App",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const product = result.product;

    if (!product) {
      throw new Error(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    return transformPublicJsonProduct(product);
  } catch (error) {
    console.error("Error fetching product from JSON endpoint:", error);
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

/**
 * Transforme un produit depuis l'endpoint JSON public vers notre format interne
 * Format: https://shop.myshopify.com/products/handle.json
 */
function transformPublicJsonProduct(product: any): SourceProduct {
  return {
    id: product.id?.toString() || "",
    handle: product.handle || "",
    title: product.title || "",
    description: product.body_html
      ? product.body_html.replace(/<[^>]*>/g, "")
      : "",
    descriptionHtml: product.body_html || "",
    vendor: product.vendor || "",
    productType: product.product_type || "",
    tags: Array.isArray(product.tags)
      ? product.tags
      : typeof product.tags === "string"
        ? product.tags.split(",").map((tag: string) => tag.trim())
        : [],
    images:
      product.images?.map((image: any) => ({
        id: image.id?.toString() || "",
        url: image.src || "",
        altText: image.alt || null,
      })) || [],
    variants:
      product.variants?.map((variant: any) => {
        // Construire les options sélectionnées à partir de option1, option2, option3
        const selectedOptions = [];
        if (product.options && product.options.length > 0) {
          if (variant.option1) {
            selectedOptions.push({
              name: product.options[0]?.name || "Option 1",
              value: variant.option1,
            });
          }
          if (variant.option2 && product.options[1]) {
            selectedOptions.push({
              name: product.options[1].name,
              value: variant.option2,
            });
          }
          if (variant.option3 && product.options[2]) {
            selectedOptions.push({
              name: product.options[2].name,
              value: variant.option3,
            });
          }
        }

        return {
          id: variant.id?.toString() || "",
          title: variant.title || "",
          price: variant.price || "0",
          compareAtPrice: variant.compare_at_price || null,
          sku: variant.sku || "",
          barcode: variant.barcode || "",
          inventoryQuantity: variant.inventory_quantity || 0,
          weight: variant.weight || 0,
          weightUnit: variant.weight_unit || "kg",
          requiresShipping: variant.requires_shipping ?? true,
          taxable: variant.taxable ?? true,
          options: selectedOptions,
        };
      }) || [],
    options:
      product.options?.map((option: any) => ({
        name: option.name || "",
        values: option.values || [],
      })) || [],
  };
}
