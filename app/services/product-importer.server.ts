/**
 * Service d'import de produits
 * Gère la création de produits dans la boutique destination
 */

import type {
  SourceProduct,
  PricingConfig,
  ImportProductResult,
  CreateProductInput,
} from "../utils/types";
import { prepareVariantsForCreation } from "./pricing.server";
import { fetchProductByUrl } from "./product-fetcher.server";
import { parseShopifyProductUrl } from "../utils/validators";
import { extractIdFromGid } from "../utils/formatters";
import prisma from "../db.server";

/**
 * Crée un produit via Admin API GraphQL
 */
async function createProductInShopify(
  admin: any,
  productInput: CreateProductInput,
): Promise<{
  id: string;
  handle: string;
  variants: Array<{ id: string; price: string }>;
}> {
  const mutation = `
    mutation createProduct($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          handle
          title
          variants(first: 100) {
            edges {
              node {
                id
                price
                sku
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await admin.graphql(mutation, {
    variables: {
      input: productInput,
    },
  });

  const result = await response.json();

  if (result.data?.productCreate?.userErrors?.length > 0) {
    const errors = result.data.productCreate.userErrors
      .map((err: any) => `${err.field}: ${err.message}`)
      .join(", ");
    throw new Error(`Failed to create product: ${errors}`);
  }

  if (!result.data?.productCreate?.product) {
    throw new Error("Failed to create product: No product returned");
  }

  const product = result.data.productCreate.product;

  return {
    id: product.id,
    handle: product.handle,
    variants: product.variants.edges.map((edge: any) => ({
      id: edge.node.id,
      price: edge.node.price,
    })),
  };
}

/**
 * Transforme un produit source en input pour création Shopify
 */
function transformToProductInput(
  sourceProduct: SourceProduct,
  pricingConfig: PricingConfig,
  status: "ACTIVE" | "DRAFT" = "ACTIVE",
): CreateProductInput {
  const variants = prepareVariantsForCreation(sourceProduct, pricingConfig);

  return {
    title: sourceProduct.title,
    descriptionHtml: sourceProduct.descriptionHtml || sourceProduct.description,
    vendor: sourceProduct.vendor,
    productType: sourceProduct.productType,
    tags: sourceProduct.tags,
    images: sourceProduct.images.map((img) => ({
      src: img.url,
      altText: img.altText,
    })),
    variants,
    options: sourceProduct.options,
    status: status.toLowerCase() as "active" | "draft",
  };
}

/**
 * Import un produit complet
 */
export async function importProduct(
  shop: string,
  sourceUrl: string,
  pricingConfig: PricingConfig,
  admin: any,
  status: "ACTIVE" | "DRAFT" = "ACTIVE",
): Promise<ImportProductResult> {
  try {
    // 1. Parser l'URL source
    const parsedUrl = parseShopifyProductUrl(sourceUrl);
    if (!parsedUrl) {
      return {
        success: false,
        errors: ["URL de produit Shopify invalide"],
      };
    }

    // 2. Récupérer le produit source
    const sourceProduct = await fetchProductByUrl(sourceUrl, admin);

    // 3. Préparer les données pour la création
    const productInput = transformToProductInput(
      sourceProduct,
      pricingConfig,
      status,
    );

    // 4. Créer le produit dans Shopify
    const createdProduct = await createProductInShopify(admin, productInput);

    // 5. Extraire les IDs
    const sourceProductId = extractIdFromGid(sourceProduct.id);
    const destinationProductId = extractIdFromGid(createdProduct.id);

    // 6. Mapper les variants source -> destination
    const variantMappings = sourceProduct.variants.map((sourceVariant, index) => {
      const destinationVariant = createdProduct.variants[index];
      const sourceVariantId = extractIdFromGid(sourceVariant.id);
      const destinationVariantId = extractIdFromGid(destinationVariant.id);

      return {
        sourceVariantId,
        destinationVariantId,
        title: sourceVariant.title,
        sourcePrice: parseFloat(sourceVariant.price),
        destinationPrice: parseFloat(destinationVariant.price),
        sku: sourceVariant.sku,
      };
    });

    // 7. Sauvegarder dans la base de données
    const importedProduct = await prisma.importedProduct.create({
      data: {
        shop,
        sourceShop: parsedUrl.shop,
        sourceProductId,
        sourceProductHandle: parsedUrl.handle,
        sourceProductUrl: sourceUrl,
        destinationProductId,
        destinationHandle: createdProduct.handle,
        title: sourceProduct.title,
        status: status.toLowerCase(),
        pricingMode: pricingConfig.mode,
        markupAmount: pricingConfig.markupAmount,
        multiplier: pricingConfig.multiplier,
        syncEnabled: false,
        variants: {
          create: variantMappings,
        },
      },
      include: {
        variants: true,
      },
    });

    return {
      success: true,
      product: {
        id: createdProduct.id,
        handle: createdProduct.handle,
        title: sourceProduct.title,
        variants: createdProduct.variants,
      },
      importedProductRecord: {
        id: importedProduct.id,
        destinationProductId: importedProduct.destinationProductId,
        title: importedProduct.title,
      },
    };
  } catch (error) {
    console.error("Error importing product:", error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
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
