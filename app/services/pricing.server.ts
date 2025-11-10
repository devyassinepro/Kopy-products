/**
 * Service de calcul de pricing pour les produits importés
 */

import type { PricingConfig, VariantWithPricing, SourceProduct } from "../utils/types";
import { calculateDestinationPrice } from "../utils/formatters";
import { validatePricingConfig, parsePrice, formatPrice } from "../utils/validators";

/**
 * Calcule les prix pour tous les variants d'un produit
 */
export function calculateVariantsPricing(
  sourceProduct: SourceProduct,
  pricingConfig: PricingConfig,
): VariantWithPricing[] {
  // Valider la config de pricing
  const validation = validatePricingConfig(pricingConfig);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return sourceProduct.variants.map((variant) => {
    const originalPrice = parsePrice(variant.price);
    const calculatedPrice = calculateDestinationPrice(originalPrice, pricingConfig);

    return {
      id: variant.id,
      title: variant.title,
      originalPrice,
      calculatedPrice,
      sku: variant.sku,
    };
  });
}

/**
 * Calcule le prix d'un seul variant
 */
export function calculateSingleVariantPrice(
  sourcePrice: string | number,
  pricingConfig: PricingConfig,
): number {
  const validation = validatePricingConfig(pricingConfig);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const price = typeof sourcePrice === "string" ? parsePrice(sourcePrice) : sourcePrice;
  return calculateDestinationPrice(price, pricingConfig);
}

/**
 * Prépare les données de variants pour la création Shopify
 */
export function prepareVariantsForCreation(
  sourceProduct: SourceProduct,
  pricingConfig: PricingConfig,
): Array<{
  price: string;
  compareAtPrice?: string;
  sku?: string;
  barcode?: string;
  inventoryQuantity?: number;
  weight?: number;
  weightUnit?: string;
  requiresShipping?: boolean;
  taxable?: boolean;
  option1?: string;
  option2?: string;
  option3?: string;
}> {
  const variantsWithPricing = calculateVariantsPricing(sourceProduct, pricingConfig);

  return sourceProduct.variants.map((variant, index) => {
    const calculatedPrice = variantsWithPricing[index].calculatedPrice;

    // Calculer le compareAtPrice si nécessaire
    let compareAtPrice: string | undefined;
    if (variant.compareAtPrice) {
      const originalCompareAtPrice = parsePrice(variant.compareAtPrice);
      const calculatedCompareAtPrice = calculateDestinationPrice(
        originalCompareAtPrice,
        pricingConfig,
      );
      compareAtPrice = formatPrice(calculatedCompareAtPrice);
    }

    // Extraire les options du variant
    const options = variant.options || [];
    const option1 = options[0]?.value;
    const option2 = options[1]?.value;
    const option3 = options[2]?.value;

    return {
      price: formatPrice(calculatedPrice),
      compareAtPrice,
      sku: variant.sku,
      barcode: variant.barcode,
      inventoryQuantity: variant.inventoryQuantity ?? 0,
      weight: variant.weight,
      weightUnit: variant.weightUnit || "KILOGRAMS",
      requiresShipping: variant.requiresShipping ?? true,
      taxable: variant.taxable ?? true,
      option1,
      option2,
      option3,
    };
  });
}

/**
 * Obtient un résumé des changements de prix
 */
export function getPricingSummary(
  sourceProduct: SourceProduct,
  pricingConfig: PricingConfig,
): {
  totalVariants: number;
  averageOriginalPrice: number;
  averageNewPrice: number;
  minOriginalPrice: number;
  maxOriginalPrice: number;
  minNewPrice: number;
  maxNewPrice: number;
} {
  const variantsWithPricing = calculateVariantsPricing(sourceProduct, pricingConfig);

  const originalPrices = variantsWithPricing.map((v) => v.originalPrice);
  const newPrices = variantsWithPricing.map((v) => v.calculatedPrice);

  return {
    totalVariants: variantsWithPricing.length,
    averageOriginalPrice:
      originalPrices.reduce((a, b) => a + b, 0) / originalPrices.length,
    averageNewPrice: newPrices.reduce((a, b) => a + b, 0) / newPrices.length,
    minOriginalPrice: Math.min(...originalPrices),
    maxOriginalPrice: Math.max(...originalPrices),
    minNewPrice: Math.min(...newPrices),
    maxNewPrice: Math.max(...newPrices),
  };
}
