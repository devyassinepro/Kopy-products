/**
 * Fonctions de validation pour Poky-fy Import & Copy Products
 */

import {
  SHOPIFY_URL_REGEX,
  LIMITS,
  ERROR_MESSAGES,
  PRICING_MODES,
} from "./constants";
import type { ParsedShopifyUrl, PricingConfig } from "./types";

/**
 * Valide et parse une URL de produit Shopify
 * Supporte les URLs storefront et admin
 */
export function parseShopifyProductUrl(url: string): ParsedShopifyUrl | null {
  // Nettoyer l'URL
  const cleanUrl = url.trim();

  // Tenter de matcher une URL admin
  const adminMatch = cleanUrl.match(SHOPIFY_URL_REGEX.ADMIN_PRODUCT_URL);
  if (adminMatch) {
    return {
      shop: `${adminMatch[1]}.myshopify.com`,
      productId: adminMatch[2],
      isAdminUrl: true,
    };
  }

  // Tenter de matcher une URL storefront
  const storefrontMatch = cleanUrl.match(SHOPIFY_URL_REGEX.PRODUCT_URL);
  if (storefrontMatch) {
    return {
      shop: storefrontMatch[1],
      handle: storefrontMatch[2],
      isAdminUrl: false,
    };
  }

  return null;
}

/**
 * Valide qu'une URL est une URL de produit Shopify valide
 */
export function isValidShopifyProductUrl(url: string): boolean {
  return parseShopifyProductUrl(url) !== null;
}

/**
 * Valide un domaine de boutique Shopify
 */
export function isValidShopifyDomain(domain: string): boolean {
  return SHOPIFY_URL_REGEX.SHOP_DOMAIN.test(domain.trim());
}

/**
 * Valide une configuration de pricing
 */
export function validatePricingConfig(config: PricingConfig): {
  valid: boolean;
  error?: string;
} {
  if (!config.mode || !Object.values(PRICING_MODES).includes(config.mode)) {
    return {
      valid: false,
      error: "Mode de pricing invalide",
    };
  }

  if (config.mode === PRICING_MODES.MARKUP) {
    if (config.markupAmount === undefined || config.markupAmount === null) {
      return {
        valid: false,
        error: "Le montant du markup est requis",
      };
    }

    if (
      config.markupAmount < LIMITS.MIN_MARKUP_AMOUNT ||
      config.markupAmount > LIMITS.MAX_MARKUP_AMOUNT
    ) {
      return {
        valid: false,
        error: `Le markup doit être entre ${LIMITS.MIN_MARKUP_AMOUNT} et ${LIMITS.MAX_MARKUP_AMOUNT}`,
      };
    }
  }

  if (config.mode === PRICING_MODES.MULTIPLIER) {
    if (config.multiplier === undefined || config.multiplier === null) {
      return {
        valid: false,
        error: "Le multiplicateur est requis",
      };
    }

    if (
      config.multiplier < LIMITS.MIN_MULTIPLIER ||
      config.multiplier > LIMITS.MAX_MULTIPLIER
    ) {
      return {
        valid: false,
        error: `Le multiplicateur doit être entre ${LIMITS.MIN_MULTIPLIER} et ${LIMITS.MAX_MULTIPLIER}`,
      };
    }

    if (config.multiplier <= 0) {
      return {
        valid: false,
        error: "Le multiplicateur doit être supérieur à 0",
      };
    }
  }

  return { valid: true };
}

/**
 * Normalise un domaine Shopify (retire https://, www, etc.)
 */
export function normalizeShopifyDomain(domain: string): string {
  let normalized = domain.trim().toLowerCase();

  // Retirer le protocole
  normalized = normalized.replace(/^https?:\/\//, "");

  // Retirer www.
  normalized = normalized.replace(/^www\./, "");

  // Retirer les chemins
  normalized = normalized.split("/")[0];

  // Ajouter .myshopify.com si nécessaire
  if (!normalized.includes(".") && !normalized.endsWith(".myshopify.com")) {
    normalized = `${normalized}.myshopify.com`;
  }

  return normalized;
}

/**
 * Extrait le nom de la boutique depuis un domaine
 */
export function extractShopName(domain: string): string {
  const normalized = normalizeShopifyDomain(domain);
  return normalized.replace(".myshopify.com", "").split(".")[0];
}

/**
 * Valide une liste de domaines sources autorisés
 */
export function validateAuthorizedSources(sources: string[]): {
  valid: boolean;
  invalidDomains?: string[];
} {
  const invalidDomains = sources.filter(
    (source) => !isValidShopifyDomain(source),
  );

  if (invalidDomains.length > 0) {
    return {
      valid: false,
      invalidDomains,
    };
  }

  return { valid: true };
}

/**
 * Sanitize une chaîne de caractères pour éviter les injections
 */
export function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, "") // Retirer < et >
    .substring(0, 255); // Limiter la longueur
}

/**
 * Valide un prix
 */
export function isValidPrice(price: number | string): boolean {
  const priceNum = typeof price === "string" ? parseFloat(price) : price;
  return !isNaN(priceNum) && priceNum >= 0 && priceNum < 1000000;
}

/**
 * Formate un prix pour Shopify (2 décimales)
 */
export function formatPrice(price: number): string {
  return price.toFixed(2);
}

/**
 * Parse un prix depuis une chaîne Shopify
 */
export function parsePrice(price: string): number {
  const parsed = parseFloat(price);
  return isNaN(parsed) ? 0 : parsed;
}
