/**
 * Fonctions de formatage pour Poky-fy Import & Copy Products
 */

import type { PricingConfig } from "./types";
import { PRICING_MODES } from "./constants";

/**
 * Calcule un prix de destination basé sur la configuration de pricing
 */
export function calculateDestinationPrice(
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

/**
 * Formate un montant en devise
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Formate une date de manière relative (il y a X jours)
 */
export function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const target = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - target.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return "à l'instant";
  } else if (diffMins < 60) {
    return `il y a ${diffMins} minute${diffMins > 1 ? "s" : ""}`;
  } else if (diffHours < 24) {
    return `il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
  } else if (diffDays < 30) {
    return `il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  } else {
    return target.toLocaleDateString("fr-FR");
  }
}

/**
 * Formate une date complète
 */
export function formatDate(date: Date | string): string {
  const target = typeof date === "string" ? new Date(date) : date;
  return target.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Tronque un texte avec ellipse
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Génère un nom de produit avec préfixe
 */
export function generateImportedProductTitle(
  originalTitle: string,
  prefix?: string,
): string {
  const cleanPrefix = prefix?.trim();
  if (cleanPrefix) {
    return `${cleanPrefix} ${originalTitle}`;
  }
  return originalTitle;
}

/**
 * Parse des sources autorisées depuis JSON
 */
export function parseAuthorizedSources(jsonString: string | null): string[] {
  if (!jsonString) {
    return [];
  }

  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Stringify des sources autorisées vers JSON
 */
export function stringifyAuthorizedSources(sources: string[]): string {
  return JSON.stringify(sources);
}

/**
 * Calcule le pourcentage d'utilisation
 */
export function calculateUsagePercentage(
  current: number,
  max: number,
): number {
  if (max === -1) {
    return 0; // Illimité
  }
  if (max === 0) {
    return 100;
  }
  return Math.min(100, Math.round((current / max) * 100));
}

/**
 * Formate un statut de produit pour l'affichage
 */
export function formatProductStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: "Actif",
    draft: "Brouillon",
    archived: "Archivé",
  };
  return statusMap[status] || status;
}

/**
 * Formate un mode de pricing pour l'affichage
 */
export function formatPricingMode(mode: string): string {
  const modeMap: Record<string, string> = {
    markup: "Markup fixe",
    multiplier: "Multiplicateur",
  };
  return modeMap[mode] || mode;
}

/**
 * Formate la description d'un pricing
 */
export function formatPricingDescription(config: PricingConfig): string {
  if (config.mode === PRICING_MODES.MARKUP) {
    const amount = config.markupAmount ?? 0;
    return amount >= 0 ? `+${amount} €` : `${amount} €`;
  }
  if (config.mode === PRICING_MODES.MULTIPLIER) {
    const mult = config.multiplier ?? 1.0;
    return `×${mult}`;
  }
  return "N/A";
}

/**
 * Extrait l'ID numérique depuis un GID Shopify
 */
export function extractIdFromGid(gid: string): string {
  const parts = gid.split("/");
  return parts[parts.length - 1];
}

/**
 * Génère un GID Shopify depuis un ID numérique
 */
export function generateGid(type: string, id: string | number): string {
  return `gid://shopify/${type}/${id}`;
}

/**
 * Formate une liste de tags
 */
export function formatTags(tags: string[] | null): string {
  if (!tags || tags.length === 0) {
    return "Aucun tag";
  }
  return tags.join(", ");
}
