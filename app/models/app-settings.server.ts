/**
 * Model pour AppSettings - Configuration de l'application par boutique
 */

import prisma from "../db.server";
import type { AppSettings } from "@prisma/client";
import { BILLING_PLANS } from "../utils/constants";
import {
  parseAuthorizedSources,
  stringifyAuthorizedSources,
} from "../utils/formatters";

/**
 * Récupère ou crée les paramètres pour une boutique
 */
export async function getOrCreateAppSettings(shop: string): Promise<AppSettings> {
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
        currentPlan: "free",
        billingStatus: "active",
        authorizedSources: "[]",
      },
    });
  }

  return settings;
}

/**
 * Met à jour les paramètres de pricing par défaut
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
 * Met à jour les paramètres de synchronisation
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
 * Met à jour le plan de facturation
 */
export async function updateBillingPlan(
  shop: string,
  plan: string,
  subscriptionId?: string,
): Promise<AppSettings> {
  await getOrCreateAppSettings(shop);

  return prisma.appSettings.update({
    where: { shop },
    data: {
      currentPlan: plan,
      subscriptionId: subscriptionId || null,
      billingStatus: "active",
    },
  });
}

/**
 * Met à jour le statut de facturation
 */
export async function updateBillingStatus(
  shop: string,
  status: string,
): Promise<AppSettings> {
  await getOrCreateAppSettings(shop);

  return prisma.appSettings.update({
    where: { shop },
    data: {
      billingStatus: status,
    },
  });
}

/**
 * Ajoute une source autorisée
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
 * Retire une source autorisée
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
 * Obtient les sources autorisées
 */
export async function getAuthorizedSources(shop: string): Promise<string[]> {
  const settings = await getOrCreateAppSettings(shop);
  return parseAuthorizedSources(settings.authorizedSources);
}

/**
 * Vérifie si une source est autorisée
 */
export async function isSourceAuthorized(
  shop: string,
  sourceShop: string,
): Promise<boolean> {
  const sources = await getAuthorizedSources(shop);
  return sources.length === 0 || sources.includes(sourceShop);
}

/**
 * Obtient le plan actuel avec ses limites
 */
export async function getCurrentPlanWithLimits(shop: string): Promise<{
  plan: string;
  limits: (typeof BILLING_PLANS)[keyof typeof BILLING_PLANS];
}> {
  const settings = await getOrCreateAppSettings(shop);
  const planKey = settings.currentPlan.toUpperCase() as keyof typeof BILLING_PLANS;

  return {
    plan: settings.currentPlan,
    limits: BILLING_PLANS[planKey] || BILLING_PLANS.FREE,
  };
}

/**
 * Vérifie si la boutique peut importer plus de produits
 */
export async function canImportMoreProducts(shop: string): Promise<{
  canImport: boolean;
  currentCount: number;
  maxProducts: number;
  planName: string;
}> {
  const { plan, limits } = await getCurrentPlanWithLimits(shop);

  const currentCount = await prisma.importedProduct.count({
    where: { shop },
  });

  const canImport =
    limits.maxProducts === -1 || currentCount < limits.maxProducts;

  return {
    canImport,
    currentCount,
    maxProducts: limits.maxProducts,
    planName: limits.name,
  };
}
