/**
 * Types et interfaces TypeScript pour Kopy Products
 */

import type { PRICING_MODES, PRODUCT_STATUS } from "./constants";

// Types dérivés des constantes
export type PricingMode = (typeof PRICING_MODES)[keyof typeof PRICING_MODES];
export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

// Configuration de pricing
export interface PricingConfig {
  mode: PricingMode;
  markupAmount?: number;
  multiplier?: number;
}

// Données de produit source (récupéré depuis Shopify)
export interface SourceProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  images: Array<{
    id?: string;
    url: string;
    altText?: string;
  }>;
  variants: Array<{
    id: string;
    title: string;
    price: string;
    compareAtPrice?: string;
    sku?: string;
    barcode?: string;
    inventoryQuantity?: number;
    weight?: number;
    weightUnit?: string;
    requiresShipping?: boolean;
    taxable?: boolean;
    options?: Array<{
      name: string;
      value: string;
    }>;
  }>;
  options?: Array<{
    name: string;
    values: string[];
  }>;
}

// Données pour créer un produit
export interface CreateProductInput {
  title: string;
  descriptionHtml?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  images?: Array<{
    src: string;
    altText?: string;
  }>;
  variants?: Array<{
    price: string;
    compareAtPrice?: string;
    sku?: string;
    barcode?: string;
    inventoryQuantity?: number;
    weight?: number;
    weightUnit?: string;
    requiresShipping?: boolean;
    taxable?: boolean;
    options?: string[];
  }>;
  options?: Array<{
    name: string;
    values: string[];
  }>;
  status?: "active" | "draft" | "archived";
}

// Résultat de l'import d'un produit
export interface ImportProductResult {
  success: boolean;
  product?: {
    id: string;
    handle: string;
    title: string;
    variants: Array<{
      id: string;
      price: string;
    }>;
  };
  importedProductRecord?: {
    id: string;
    destinationProductId: string;
    title: string;
  };
  errors?: string[];
}

// Informations extraites d'une URL Shopify
export interface ParsedShopifyUrl {
  shop: string;
  handle?: string;
  productId?: string;
  isAdminUrl: boolean;
}

// Configuration de synchronisation
export interface SyncConfig {
  enabled: boolean;
  frequency?: "daily" | "weekly" | "realtime";
  lastSyncAt?: Date;
}

// Statistiques d'utilisation
export interface UsageStats {
  currentProducts: number;
  maxProducts: number;
  percentageUsed: number;
  canImportMore: boolean;
}

// Données de plan de facturation
export interface BillingPlanData {
  id: string;
  name: string;
  price: number;
  maxProducts: number;
  autoSync: boolean;
  syncFrequency: string | null;
  supportLevel: string;
  features: string[];
}

// Options de pagination
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

// Résultat paginé
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Filtres pour l'historique
export interface ProductHistoryFilters {
  status?: ProductStatus;
  sourceShop?: string;
  pricingMode?: PricingMode;
  search?: string;
}

// Erreur API
export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

// Réponse API standardisée
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// Variant avec pricing calculé
export interface VariantWithPricing {
  id: string;
  title: string;
  originalPrice: number;
  calculatedPrice: number;
  sku?: string;
}

// Données de synchronisation
export interface SyncResult {
  success: boolean;
  updatedVariants: number;
  errors?: string[];
  syncedAt: Date;
}
