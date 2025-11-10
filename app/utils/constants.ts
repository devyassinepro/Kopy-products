/**
 * Constantes globales pour Kopy Products
 */

// Plans de facturation
export const BILLING_PLANS = {
  FREE: {
    id: "free",
    name: "Free",
    price: 0,
    maxProducts: 5,
    autoSync: false,
    syncFrequency: null,
    supportLevel: "community",
    features: [
      "Jusqu'à 5 produits importés",
      "Import manuel uniquement",
      "Support communautaire",
    ],
  },
  BASIC: {
    id: "basic",
    name: "Basic",
    price: 9.99,
    maxProducts: 50,
    autoSync: false,
    syncFrequency: null,
    supportLevel: "email",
    features: [
      "Jusqu'à 50 produits importés",
      "Import manuel",
      "Support par email",
      "Pricing automatique",
    ],
  },
  PRO: {
    id: "pro",
    name: "Pro",
    price: 29.99,
    maxProducts: 500,
    autoSync: true,
    syncFrequency: "daily",
    supportLevel: "priority",
    features: [
      "Jusqu'à 500 produits importés",
      "Synchronisation automatique quotidienne",
      "Support prioritaire",
      "Pricing avancé",
      "Rapports détaillés",
    ],
  },
  PREMIUM: {
    id: "premium",
    name: "Premium",
    price: 79.99,
    maxProducts: -1, // illimité
    autoSync: true,
    syncFrequency: "realtime",
    supportLevel: "dedicated",
    features: [
      "Produits importés illimités",
      "Synchronisation en temps réel (webhooks)",
      "Support dédié",
      "Pricing avancé",
      "Rapports personnalisés",
      "API access",
    ],
  },
} as const;

// Types de pricing
export const PRICING_MODES = {
  MARKUP: "markup",
  MULTIPLIER: "multiplier",
} as const;

// Statuts de produits
export const PRODUCT_STATUS = {
  ACTIVE: "active",
  DRAFT: "draft",
  ARCHIVED: "archived",
} as const;

// Statuts de billing
export const BILLING_STATUS = {
  ACTIVE: "active",
  CANCELLED: "cancelled",
  PENDING: "pending",
  EXPIRED: "expired",
} as const;

// Fréquences de synchronisation
export const SYNC_FREQUENCY = {
  DAILY: "daily",
  WEEKLY: "weekly",
  REALTIME: "realtime",
} as const;

// Regex pour validation des URLs Shopify
export const SHOPIFY_URL_REGEX = {
  PRODUCT_URL: /^https?:\/\/([a-zA-Z0-9-]+\.myshopify\.com|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})\/products\/([a-zA-Z0-9-_]+)/,
  ADMIN_PRODUCT_URL: /^https?:\/\/admin\.shopify\.com\/store\/([a-zA-Z0-9-]+)\/products\/(\d+)/,
  SHOP_DOMAIN: /^([a-zA-Z0-9-]+\.myshopify\.com|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})$/,
} as const;

// Limites et valeurs par défaut
export const LIMITS = {
  DEFAULT_MARKUP_AMOUNT: 0,
  DEFAULT_MULTIPLIER: 1.0,
  MIN_MARKUP_AMOUNT: -1000,
  MAX_MARKUP_AMOUNT: 10000,
  MIN_MULTIPLIER: 0.1,
  MAX_MULTIPLIER: 10.0,
  PAGINATION_DEFAULT_LIMIT: 20,
  PAGINATION_MAX_LIMIT: 100,
} as const;

// Messages d'erreur
export const ERROR_MESSAGES = {
  INVALID_SHOPIFY_URL: "L'URL fournie n'est pas une URL de produit Shopify valide",
  PRODUCT_NOT_FOUND: "Produit non trouvé",
  PRODUCT_LIMIT_REACHED: "Limite de produits atteinte pour votre plan",
  INVALID_PRICING_CONFIG: "Configuration de pricing invalide",
  SHOP_NOT_AUTHORIZED: "Ce magasin n'est pas autorisé comme source",
  SYNC_NOT_AVAILABLE: "La synchronisation automatique n'est pas disponible pour votre plan",
  BILLING_ERROR: "Erreur lors de la gestion de l'abonnement",
} as const;
