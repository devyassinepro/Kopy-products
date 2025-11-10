/**
 * Model pour ImportedProduct - Produits importés
 */

import prisma from "../db.server";
import type { ImportedProduct, VariantMapping } from "@prisma/client";
import type { PaginationOptions, PaginatedResult, ProductHistoryFilters } from "../utils/types";
import { LIMITS } from "../utils/constants";

/**
 * Type de produit avec ses variants
 */
export type ImportedProductWithVariants = ImportedProduct & {
  variants: VariantMapping[];
};

/**
 * Récupère un produit importé par ID
 */
export async function getImportedProductById(
  id: string,
): Promise<ImportedProductWithVariants | null> {
  return prisma.importedProduct.findUnique({
    where: { id },
    include: { variants: true },
  });
}

/**
 * Récupère un produit importé par l'ID du produit destination
 */
export async function getImportedProductByDestinationId(
  shop: string,
  destinationProductId: string,
): Promise<ImportedProductWithVariants | null> {
  return prisma.importedProduct.findFirst({
    where: {
      shop,
      destinationProductId,
    },
    include: { variants: true },
  });
}

/**
 * Récupère tous les produits importés pour une boutique avec pagination
 */
export async function getImportedProducts(
  shop: string,
  filters?: ProductHistoryFilters,
  pagination?: PaginationOptions,
): Promise<PaginatedResult<ImportedProductWithVariants>> {
  const page = pagination?.page || 1;
  const limit = Math.min(
    pagination?.limit || LIMITS.PAGINATION_DEFAULT_LIMIT,
    LIMITS.PAGINATION_MAX_LIMIT,
  );
  const skip = (page - 1) * limit;

  // Construire le where clause
  const where: any = { shop };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.sourceShop) {
    where.sourceShop = filters.sourceShop;
  }

  if (filters?.pricingMode) {
    where.pricingMode = filters.pricingMode;
  }

  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { sourceProductHandle: { contains: filters.search } },
    ];
  }

  // Récupérer le total
  const total = await prisma.importedProduct.count({ where });

  // Récupérer les produits
  const data = await prisma.importedProduct.findMany({
    where,
    include: { variants: true },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

/**
 * Met à jour le statut d'un produit
 */
export async function updateProductStatus(
  id: string,
  status: string,
): Promise<ImportedProduct> {
  return prisma.importedProduct.update({
    where: { id },
    data: { status },
  });
}

/**
 * Active/désactive la synchronisation pour un produit
 */
export async function toggleProductSync(
  id: string,
  enabled: boolean,
): Promise<ImportedProduct> {
  return prisma.importedProduct.update({
    where: { id },
    data: {
      syncEnabled: enabled,
      ...(enabled ? {} : { lastSyncAt: null }),
    },
  });
}

/**
 * Met à jour la date de dernière synchronisation
 */
export async function updateLastSyncDate(id: string): Promise<ImportedProduct> {
  return prisma.importedProduct.update({
    where: { id },
    data: { lastSyncAt: new Date() },
  });
}

/**
 * Supprime un produit importé (cascade sur variants)
 */
export async function deleteImportedProduct(id: string): Promise<void> {
  await prisma.importedProduct.delete({
    where: { id },
  });
}

/**
 * Obtient tous les produits avec sync activé pour une boutique
 */
export async function getProductsWithSyncEnabled(
  shop: string,
): Promise<ImportedProductWithVariants[]> {
  return prisma.importedProduct.findMany({
    where: {
      shop,
      syncEnabled: true,
    },
    include: { variants: true },
  });
}

/**
 * Obtient les statistiques de produits pour une boutique
 */
export async function getProductStats(shop: string): Promise<{
  total: number;
  active: number;
  draft: number;
  archived: number;
  withSyncEnabled: number;
}> {
  const [total, active, draft, archived, withSyncEnabled] = await Promise.all([
    prisma.importedProduct.count({ where: { shop } }),
    prisma.importedProduct.count({ where: { shop, status: "active" } }),
    prisma.importedProduct.count({ where: { shop, status: "draft" } }),
    prisma.importedProduct.count({ where: { shop, status: "archived" } }),
    prisma.importedProduct.count({ where: { shop, syncEnabled: true } }),
  ]);

  return {
    total,
    active,
    draft,
    archived,
    withSyncEnabled,
  };
}

/**
 * Obtient les magasins sources uniques pour une boutique
 */
export async function getUniqueSourceShops(shop: string): Promise<string[]> {
  const products = await prisma.importedProduct.findMany({
    where: { shop },
    select: { sourceShop: true },
    distinct: ["sourceShop"],
  });

  return products.map((p) => p.sourceShop);
}

/**
 * Met à jour le pricing d'un produit importé
 */
export async function updateProductPricing(
  id: string,
  pricingMode: string,
  markupAmount?: number,
  multiplier?: number,
): Promise<ImportedProduct> {
  return prisma.importedProduct.update({
    where: { id },
    data: {
      pricingMode,
      markupAmount,
      multiplier,
    },
  });
}

/**
 * Recherche des produits importés
 */
export async function searchImportedProducts(
  shop: string,
  query: string,
  limit: number = 10,
): Promise<ImportedProductWithVariants[]> {
  return prisma.importedProduct.findMany({
    where: {
      shop,
      OR: [
        { title: { contains: query } },
        { sourceProductHandle: { contains: query } },
        { destinationHandle: { contains: query } },
      ],
    },
    include: { variants: true },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}
