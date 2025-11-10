/**
 * Service de synchronisation automatique des produits
 */

import type { ImportedProduct, VariantMapping } from "@prisma/client";
import prisma from "../db.server";
import { fetchProductByUrl } from "./product-fetcher.server";
import { calculateDestinationPrice } from "../utils/formatters";
import type { SyncResult } from "../utils/types";
import { extractIdFromGid } from "../utils/formatters";

type ImportedProductWithVariants = ImportedProduct & {
  variants: VariantMapping[];
};

/**
 * Synchronise un produit importé avec sa source
 */
export async function syncProduct(
  importedProduct: ImportedProductWithVariants,
  admin: any,
): Promise<SyncResult> {
  try {
    // 1. Récupérer le produit source à jour
    const sourceProduct = await fetchProductByUrl(
      importedProduct.sourceProductUrl,
      admin,
    );

    // 2. Créer un mapping des variants source
    const sourceVariantsMap = new Map(
      sourceProduct.variants.map((v) => {
        const id = extractIdFromGid(v.id);
        return [id, v];
      }),
    );

    let updatedVariants = 0;
    const errors: string[] = [];

    // 3. Pour chaque variant mappé, vérifier si le prix a changé
    const variantUpdates: Array<{
      variantId: string;
      newPrice: string;
      compareAtPrice?: string;
    }> = [];

    for (const variantMapping of importedProduct.variants) {
      const sourceVariant = sourceVariantsMap.get(variantMapping.sourceVariantId);

      if (!sourceVariant) {
        errors.push(`Variant source ${variantMapping.sourceVariantId} non trouvé`);
        continue;
      }

      const newSourcePrice = parseFloat(sourceVariant.price);

      // Vérifier si le prix a changé
      if (Math.abs(newSourcePrice - variantMapping.sourcePrice) < 0.01) {
        continue; // Prix inchangé
      }

      // Calculer le nouveau prix destination
      const newDestinationPrice = calculateDestinationPrice(newSourcePrice, {
        mode: importedProduct.pricingMode as "markup" | "multiplier",
        markupAmount: importedProduct.markupAmount || undefined,
        multiplier: importedProduct.multiplier || undefined,
      });

      // Mettre à jour le mapping en base
      await prisma.variantMapping.update({
        where: { id: variantMapping.id },
        data: {
          sourcePrice: newSourcePrice,
          destinationPrice: newDestinationPrice,
        },
      });

      // Préparer la mise à jour Shopify
      variantUpdates.push({
        variantId: `gid://shopify/ProductVariant/${variantMapping.destinationVariantId}`,
        newPrice: newDestinationPrice.toFixed(2),
        compareAtPrice: sourceVariant.compareAtPrice
          ? calculateDestinationPrice(parseFloat(sourceVariant.compareAtPrice), {
              mode: importedProduct.pricingMode as "markup" | "multiplier",
              markupAmount: importedProduct.markupAmount || undefined,
              multiplier: importedProduct.multiplier || undefined,
            }).toFixed(2)
          : undefined,
      });

      updatedVariants++;
    }

    // 4. Mettre à jour les prix dans Shopify si nécessaire
    if (variantUpdates.length > 0) {
      await updateVariantPricesInShopify(
        admin,
        `gid://shopify/Product/${importedProduct.destinationProductId}`,
        variantUpdates,
      );
    }

    // 5. Mettre à jour la date de dernière sync
    await prisma.importedProduct.update({
      where: { id: importedProduct.id },
      data: { lastSyncAt: new Date() },
    });

    return {
      success: true,
      updatedVariants,
      errors: errors.length > 0 ? errors : undefined,
      syncedAt: new Date(),
    };
  } catch (error) {
    console.error("Error syncing product:", error);
    return {
      success: false,
      updatedVariants: 0,
      errors: [error instanceof Error ? error.message : "Erreur inconnue"],
      syncedAt: new Date(),
    };
  }
}

/**
 * Met à jour les prix de variants dans Shopify
 */
async function updateVariantPricesInShopify(
  admin: any,
  productId: string,
  variantUpdates: Array<{
    variantId: string;
    newPrice: string;
    compareAtPrice?: string;
  }>,
): Promise<void> {
  const mutation = `
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
    }
  `;

  const variants = variantUpdates.map((update) => ({
    id: update.variantId,
    price: update.newPrice,
    ...(update.compareAtPrice && { compareAtPrice: update.compareAtPrice }),
  }));

  const response = await admin.graphql(mutation, {
    variables: {
      productId,
      variants,
    },
  });

  const result = await response.json();

  if (result.data?.productVariantsBulkUpdate?.userErrors?.length > 0) {
    const errors = result.data.productVariantsBulkUpdate.userErrors
      .map((err: any) => `${err.field}: ${err.message}`)
      .join(", ");
    throw new Error(`Échec de la mise à jour des variants: ${errors}`);
  }
}

/**
 * Synchronise tous les produits pour un shop
 */
export async function syncAllProductsForShop(
  shop: string,
  admin: any,
): Promise<{
  totalProducts: number;
  syncedProducts: number;
  errors: string[];
}> {
  // Récupérer tous les produits avec sync activé
  const products = await prisma.importedProduct.findMany({
    where: {
      shop,
      syncEnabled: true,
    },
    include: {
      variants: true,
    },
  });

  let syncedProducts = 0;
  const errors: string[] = [];

  for (const product of products) {
    try {
      const result = await syncProduct(product, admin);
      if (result.success) {
        syncedProducts++;
      } else {
        errors.push(`${product.title}: ${result.errors?.join(", ")}`);
      }
    } catch (error) {
      errors.push(
        `${product.title}: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  return {
    totalProducts: products.length,
    syncedProducts,
    errors,
  };
}

/**
 * Obtient les produits qui doivent être synchronisés
 * (selon la fréquence configurée)
 */
export async function getProductsNeedingSync(
  shop: string,
  frequencyHours: number = 24,
): Promise<ImportedProductWithVariants[]> {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - frequencyHours);

  return prisma.importedProduct.findMany({
    where: {
      shop,
      syncEnabled: true,
      OR: [
        { lastSyncAt: null },
        { lastSyncAt: { lt: cutoffDate } },
      ],
    },
    include: {
      variants: true,
    },
  });
}
