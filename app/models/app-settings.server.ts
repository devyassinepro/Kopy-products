/**
 * Model for AppSettings - Application configuration per store
 */

import prisma from "../db.server";
import type { AppSettings } from "@prisma/client";
import {
  parseAuthorizedSources,
  stringifyAuthorizedSources,
} from "../utils/formatters";

/**
 * Get or create settings for a store
 */
export async function getOrCreateAppSettings(
  shop: string,
): Promise<AppSettings> {
  let settings = await prisma.appSettings.findUnique({
    where: { shop },
  });

  if (!settings) {
    settings = await prisma.appSettings.create({
      data: {
        shop,
        defaultPricingMode: "markup",
        defaultMarkupAmount: 0,
        defaultMultiplier: 1.0,
        autoSyncEnabled: false,
        authorizedSources: "[]",
        defaultTags: "kopy-product",
      },
    });
  }

  return settings;
}

/**
 * Update default pricing settings
 */
export async function updateDefaultPricing(
  shop: string,
  pricingMode: string,
  markupAmount: number,
  multiplier: number,
): Promise<AppSettings> {
  await getOrCreateAppSettings(shop);

  return prisma.appSettings.update({
    where: { shop },
    data: {
      defaultPricingMode: pricingMode,
      defaultMarkupAmount: markupAmount,
      defaultMultiplier: multiplier,
    },
  });
}

/**
 * Update synchronization settings
 */
export async function updateSyncSettings(
  shop: string,
  autoSyncEnabled: boolean,
  syncFrequency?: string,
): Promise<AppSettings> {
  await getOrCreateAppSettings(shop);

  return prisma.appSettings.update({
    where: { shop },
    data: {
      autoSyncEnabled,
      syncFrequency: syncFrequency || null,
    },
  });
}

/**
 * Add an authorized source
 */
export async function addAuthorizedSource(
  shop: string,
  sourceShop: string,
): Promise<AppSettings> {
  const settings = await getOrCreateAppSettings(shop);
  const sources = parseAuthorizedSources(settings.authorizedSources);

  if (!sources.includes(sourceShop)) {
    sources.push(sourceShop);
  }

  return prisma.appSettings.update({
    where: { shop },
    data: {
      authorizedSources: stringifyAuthorizedSources(sources),
    },
  });
}

/**
 * Remove an authorized source
 */
export async function removeAuthorizedSource(
  shop: string,
  sourceShop: string,
): Promise<AppSettings> {
  const settings = await getOrCreateAppSettings(shop);
  const sources = parseAuthorizedSources(settings.authorizedSources);

  const filtered = sources.filter((s) => s !== sourceShop);

  return prisma.appSettings.update({
    where: { shop },
    data: {
      authorizedSources: stringifyAuthorizedSources(filtered),
    },
  });
}

/**
 * Get authorized sources
 */
export async function getAuthorizedSources(shop: string): Promise<string[]> {
  const settings = await getOrCreateAppSettings(shop);
  return parseAuthorizedSources(settings.authorizedSources);
}

/**
 * Check if a source is authorized
 */
export async function isSourceAuthorized(
  shop: string,
  sourceShop: string,
): Promise<boolean> {
  const sources = await getAuthorizedSources(shop);
  return sources.length === 0 || sources.includes(sourceShop);
}

/**
 * Update default organization settings
 */
export async function updateDefaultOrganization(
  shop: string,
  defaultCollectionId?: string | null,
  defaultTags?: string | null,
  autoPublish?: boolean,
): Promise<AppSettings> {
  await getOrCreateAppSettings(shop);

  return prisma.appSettings.update({
    where: { shop },
    data: {
      defaultCollectionId: defaultCollectionId || null,
      defaultTags: defaultTags || null,
      autoPublish: autoPublish || false,
    },
  });
}

/**
 * Update price rounding settings
 */
export async function updatePriceRounding(
  shop: string,
  priceRoundingEnabled: boolean,
  defaultRoundingValue?: string | null,
): Promise<AppSettings> {
  await getOrCreateAppSettings(shop);

  return prisma.appSettings.update({
    where: { shop },
    data: {
      priceRoundingEnabled,
      defaultRoundingValue: defaultRoundingValue || "0.99",
    },
  });
}

/**
 * Get product count for a shop (no limits in free version)
 */
export async function getProductCount(shop: string): Promise<number> {
  return prisma.importedProduct.count({
    where: { shop },
  });
}
