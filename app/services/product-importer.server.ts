/**
 * Service d'import de produits - Version refactorisée
 * Utilise productCreate + productVariantsBulkCreate pour une création fiable
 */

import type {
  SourceProduct,
  PricingConfig,
} from "../utils/types";
import { PRICING_MODES } from "../utils/constants";
import prisma from "../db.server";

interface MediaInput {
  mediaContentType: "IMAGE";
  alt: string;
  originalSource: string;
}

/**
 * Calcule le prix de destination basé sur la configuration de pricing
 */
function calculateDestinationPrice(
  sourcePrice: number,
  config: PricingConfig,
): number {
  if (config.mode === PRICING_MODES.MARKUP) {
    const markup = config.markupAmount ?? 0;
    return Math.max(0, sourcePrice + markup);
  }

  if (config.mode === PRICING_MODES.MULTIPLIER) {
    const multiplier = config.multiplier ?? 1.0;
    return Math.max(0, sourcePrice * multiplier);
  }

  return sourcePrice;
}

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  status: string;
  descriptionHtml: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: string;
        selectedOptions: Array<{
          name: string;
          value: string;
        }>;
        image?: {
          id: string;
          url: string;
        };
      };
    }>;
  };
  media?: {
    nodes: Array<{
      id: string;
      alt?: string;
      mediaContentType: string;
    }>;
  };
}

export interface CreateProductResult {
  success: boolean;
  product?: ShopifyProduct;
  error?: string;
}

/**
 * Crée un produit Shopify à partir d'un produit source
 */
export async function createShopifyProduct(
  admin: any,
  sourceProduct: SourceProduct,
  pricingConfig: PricingConfig,
  status: "ACTIVE" | "DRAFT" = "ACTIVE",
): Promise<CreateProductResult> {
  try {
    console.log("=== CREATING SHOPIFY PRODUCT ===");
    console.log("Title:", sourceProduct.title);
    console.log("Variants:", sourceProduct.variants.length);
    console.log("Images:", sourceProduct.images.length);

    // ==========================================
    // STEP 1: Prepare Media Inputs
    // ==========================================
    const mediaInputs: MediaInput[] = sourceProduct.images.map((image) => ({
      mediaContentType: "IMAGE",
      alt: image.altText || sourceProduct.title,
      originalSource: image.url,
    }));

    console.log(`Prepared ${mediaInputs.length} media inputs`);

    // ==========================================
    // STEP 2: Create Product with Media
    // ==========================================
    const productInput: any = {
      title: sourceProduct.title,
      descriptionHtml: sourceProduct.descriptionHtml || `<p>${sourceProduct.description}</p>`,
      vendor: sourceProduct.vendor || "Import",
      productType: sourceProduct.productType || "Imported",
      tags: sourceProduct.tags || [],
      status,
    };

    // Add product options if variants exist
    if (sourceProduct.options && sourceProduct.options.length > 0) {
      productInput.productOptions = sourceProduct.options
        .slice(0, 3) // Shopify max 3 options
        .map((option) => ({
          name: option.name,
          values: option.values.map((value) => ({ name: value })),
        }));
    }

    const productCreateResponse = await admin.graphql(
      `#graphql
      mutation productCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
        productCreate(product: $product, media: $media) {
          product {
            id
            title
            handle
            status
            descriptionHtml
            vendor
            productType
            tags
            variants(first: 1) {
              edges {
                node {
                  id
                  title
                  price
                }
              }
            }
            media(first: 50) {
              nodes {
                ... on MediaImage {
                  id
                  alt
                  mediaContentType
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          product: productInput,
          media: mediaInputs.length > 0 ? mediaInputs : undefined,
        },
      },
    );

    const productCreateJson = await productCreateResponse.json();

    if (
      productCreateJson.data?.productCreate?.userErrors &&
      productCreateJson.data.productCreate.userErrors.length > 0
    ) {
      const errors = productCreateJson.data.productCreate.userErrors
        .map((e: any) => e.message)
        .join(", ");
      throw new Error(`Failed to create product: ${errors}`);
    }

    const product: ShopifyProduct = productCreateJson.data.productCreate.product;
    console.log("Product created:", product.id);

    // ==========================================
    // STEP 3: Build Media ID Map for Variants
    // ==========================================
    const mediaIdMap: Record<number, string> = {};
    if (product.media && product.media.nodes) {
      product.media.nodes.forEach((media, index) => {
        mediaIdMap[index] = media.id;
      });
    }

    // ==========================================
    // STEP 4: Create Variants (if multiple)
    // ==========================================
    if (
      sourceProduct.variants &&
      sourceProduct.variants.length > 0 &&
      sourceProduct.options &&
      sourceProduct.options.length > 0
    ) {
      console.log(`Creating ${sourceProduct.variants.length} variants...`);

      const variantsInput = sourceProduct.variants.map((variant, variantIndex) => {
        // Build option values for this variant
        const optionValues: Array<{ optionName: string; name: string }> = [];

        variant.options.forEach((opt) => {
          optionValues.push({
            optionName: opt.name,
            name: opt.value,
          });
        });

        // Calculate destination price
        const sourcePrice = parseFloat(variant.price);
        const destinationPrice = calculateDestinationPrice(sourcePrice, pricingConfig);

        // Find matching media for this variant (by index)
        let mediaId: string | undefined;
        if (variantIndex < Object.keys(mediaIdMap).length) {
          mediaId = mediaIdMap[variantIndex];
        }

        const variantInput: any = {
          price: destinationPrice.toString(),
          inventoryPolicy: "CONTINUE",
          inventoryItem: {
            tracked: false,
          },
          optionValues: optionValues,
        };

        if (mediaId) {
          variantInput.mediaId = mediaId;
        }

        return variantInput;
      });

      const variantsCreateResponse = await admin.graphql(
        `#graphql
        mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!, $strategy: ProductVariantsBulkCreateStrategy) {
          productVariantsBulkCreate(productId: $productId, variants: $variants, strategy: $strategy) {
            productVariants {
              id
              title
              price
              selectedOptions {
                name
                value
              }
              image {
                id
                url
              }
            }
            userErrors {
              field
              message
            }
          }
        }`,
        {
          variables: {
            productId: product.id,
            variants: variantsInput,
            strategy: "REMOVE_STANDALONE_VARIANT",
          },
        },
      );

      const variantsCreateJson = await variantsCreateResponse.json();

      if (
        variantsCreateJson.data?.productVariantsBulkCreate?.userErrors &&
        variantsCreateJson.data.productVariantsBulkCreate.userErrors.length > 0
      ) {
        const errors = variantsCreateJson.data.productVariantsBulkCreate.userErrors
          .map((e: any) => e.message)
          .join(", ");
        console.error("Variant creation errors:", errors);
      }

      const createdVariants =
        variantsCreateJson.data?.productVariantsBulkCreate?.productVariants || [];
      console.log(`Created ${createdVariants.length} variants`);
    } else {
      // ==========================================
      // No custom variants - update default variant price
      // ==========================================
      console.log("Updating default variant price...");

      const variantId = product.variants.edges[0]?.node?.id;
      if (variantId && sourceProduct.variants.length > 0) {
        const sourcePrice = parseFloat(sourceProduct.variants[0].price);
        const destinationPrice = calculateDestinationPrice(sourcePrice, pricingConfig);

        await admin.graphql(
          `#graphql
          mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
            productVariantsBulkUpdate(productId: $productId, variants: $variants) {
              productVariants {
                id
                price
              }
              userErrors {
                field
                message
              }
            }
          }`,
          {
            variables: {
              productId: product.id,
              variants: [
                {
                  id: variantId,
                  price: destinationPrice.toString(),
                  inventoryPolicy: "CONTINUE",
                  inventoryItem: {
                    tracked: false,
                  },
                },
              ],
            },
          },
        );
        console.log("Default variant price updated");
      }
    }

    // ==========================================
    // STEP 5: Fetch Final Product Data
    // ==========================================
    const finalProductResponse = await admin.graphql(
      `#graphql
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          status
          descriptionHtml
          vendor
          productType
          tags
          variants(first: 250) {
            edges {
              node {
                id
                title
                price
                selectedOptions {
                  name
                  value
                }
                image {
                  id
                  url
                }
              }
            }
          }
          media(first: 50) {
            nodes {
              ... on MediaImage {
                id
                alt
                mediaContentType
              }
            }
          }
        }
      }`,
      {
        variables: {
          id: product.id,
        },
      },
    );

    const finalProductJson = await finalProductResponse.json();
    const finalProduct: ShopifyProduct = finalProductJson.data.product;

    console.log("=== PRODUCT CREATION COMPLETE ===");
    console.log("Product ID:", finalProduct.id);
    console.log("Product Handle:", finalProduct.handle);
    console.log("Variants:", finalProduct.variants.edges.length);

    return {
      success: true,
      product: finalProduct,
    };
  } catch (error) {
    console.error("Error creating Shopify product:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create Shopify product",
    };
  }
}

/**
 * Import un produit complet et sauvegarde dans la DB
 */
export async function importProduct(
  shop: string,
  sourceProduct: SourceProduct,
  sourceUrl: string,
  pricingConfig: PricingConfig,
  admin: any,
  status: "ACTIVE" | "DRAFT" = "ACTIVE",
) {
  try {
    // 1. Créer le produit dans Shopify
    const result = await createShopifyProduct(
      admin,
      sourceProduct,
      pricingConfig,
      status,
    );

    if (!result.success || !result.product) {
      return {
        success: false,
        error: result.error || "Failed to create product",
      };
    }

    const product = result.product;

    // 2. Extraire les IDs pour la DB
    const extractId = (gid: string) => gid.split("/").pop() || "";
    const sourceProductId = extractId(sourceProduct.id);
    const destinationProductId = extractId(product.id);

    // 3. Parser l'URL source
    const urlMatch = sourceUrl.match(/https?:\/\/([^\/]+)/);
    const sourceShop = urlMatch ? urlMatch[1] : "unknown";

    // 4. Sauvegarder dans la base de données
    const importedProduct = await prisma.importedProduct.create({
      data: {
        shop,
        sourceShop,
        sourceProductId,
        sourceProductHandle: sourceProduct.handle,
        sourceProductUrl: sourceUrl,
        destinationProductId,
        destinationHandle: product.handle,
        title: sourceProduct.title,
        status: status.toLowerCase(),
        pricingMode: pricingConfig.mode,
        markupAmount: pricingConfig.markupAmount,
        multiplier: pricingConfig.multiplier,
        productImage: sourceProduct.images?.[0]?.url || null,
        price: sourceProduct.variants?.[0] ? calculateDestinationPrice(parseFloat(sourceProduct.variants[0].price), pricingConfig) : null,
        syncEnabled: false,
        variants: {
          create: product.variants.edges.map((edge, index) => {
            const sourceVariant = sourceProduct.variants[index];
            const destVariant = edge.node;

            return {
              sourceVariantId: extractId(sourceVariant?.id || ""),
              destinationVariantId: extractId(destVariant.id),
              title: destVariant.title,
              sourcePrice: sourceVariant ? parseFloat(sourceVariant.price) : 0,
              destinationPrice: parseFloat(destVariant.price),
              sku: sourceVariant?.sku || "",
            };
          }),
        },
      },
      include: {
        variants: true,
      },
    });

    return {
      success: true,
      product,
      importedProduct,
    };
  } catch (error) {
    console.error("Error importing product:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Import failed",
    };
  }
}

/**
 * Vérifie si un produit a déjà été importé
 */
export async function isProductAlreadyImported(
  shop: string,
  sourceProductId: string,
): Promise<boolean> {
  const existing = await prisma.importedProduct.findUnique({
    where: {
      shop_sourceProductId: {
        shop,
        sourceProductId,
      },
    },
  });

  return existing !== null;
}

/**
 * Obtient le nombre de produits importés pour une boutique
 */
export async function getImportedProductsCount(shop: string): Promise<number> {
  return prisma.importedProduct.count({
    where: { shop },
  });
}
