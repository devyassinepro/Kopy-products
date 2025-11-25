/**
 * Global constants for Poky-fy Import & Copy Products
 */

// Pricing types
export const PRICING_MODES = {
  MARKUP: "markup",
  MULTIPLIER: "multiplier",
} as const;

// Product statuses
export const PRODUCT_STATUS = {
  ACTIVE: "active",
  DRAFT: "draft",
  ARCHIVED: "archived",
} as const;

// Sync frequencies
export const SYNC_FREQUENCY = {
  DAILY: "daily",
  WEEKLY: "weekly",
  REALTIME: "realtime",
} as const;

// Shopify URL validation regex
export const SHOPIFY_URL_REGEX = {
  // Accepts all domain formats: .myshopify.com, .com, .fr, .it, .co.uk, .co.nz, etc.
  PRODUCT_URL:
    /^https?:\/\/((?:[a-zA-Z0-9-]+\.)+(?:myshopify\.com|[a-zA-Z]{2,}))\/products\/([a-zA-Z0-9-_]+)/,
  ADMIN_PRODUCT_URL:
    /^https?:\/\/admin\.shopify\.com\/store\/([a-zA-Z0-9-]+)\/products\/(\d+)/,
  SHOP_DOMAIN: /^((?:[a-zA-Z0-9-]+\.)+(?:myshopify\.com|[a-zA-Z]{2,}))$/,
} as const;

// Limits and default values
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

// Error messages
export const ERROR_MESSAGES = {
  INVALID_SHOPIFY_URL: "The provided URL is not a valid Shopify product URL",
  PRODUCT_NOT_FOUND: "Product not found",
  INVALID_PRICING_CONFIG: "Invalid pricing configuration",
  SHOP_NOT_AUTHORIZED: "This store is not authorized as a source",
  SYNC_NOT_AVAILABLE: "Automatic synchronization is not available",
} as const;
