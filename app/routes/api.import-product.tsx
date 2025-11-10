/**
 * API Route : Import d'un produit
 * POST /api/import-product
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { importProduct, isProductAlreadyImported } from "../services/product-importer.server";
import { canImportMoreProducts } from "../models/app-settings.server";
import { isValidShopifyProductUrl, validatePricingConfig, parseShopifyProductUrl } from "../utils/validators";
import { ERROR_MESSAGES } from "../utils/constants";
import { extractIdFromGid } from "../utils/formatters";
import type { PricingConfig } from "../utils/types";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    const formData = await request.formData();
    const url = formData.get("url") as string;
    const pricingMode = formData.get("pricingMode") as string;
    const markupAmount = formData.get("markupAmount");
    const multiplier = formData.get("multiplier");
    const status = (formData.get("status") as string) || "ACTIVE";

    // Validations
    if (!url) {
      return Response.json(
        { success: false, error: "URL requise" },
        { status: 400 },
      );
    }

    if (!isValidShopifyProductUrl(url)) {
      return Response.json(
        { success: false, error: ERROR_MESSAGES.INVALID_SHOPIFY_URL },
        { status: 400 },
      );
    }

    // Construire la config de pricing
    const pricingConfig: PricingConfig = {
      mode: pricingMode as "markup" | "multiplier",
      markupAmount: markupAmount ? parseFloat(markupAmount as string) : undefined,
      multiplier: multiplier ? parseFloat(multiplier as string) : undefined,
    };

    // Valider le pricing
    const pricingValidation = validatePricingConfig(pricingConfig);
    if (!pricingValidation.valid) {
      return Response.json(
        { success: false, error: pricingValidation.error },
        { status: 400 },
      );
    }

    // Vérifier les limites du plan
    const limits = await canImportMoreProducts(shop);
    if (!limits.canImport) {
      return Response.json(
        {
          success: false,
          error: `${ERROR_MESSAGES.PRODUCT_LIMIT_REACHED}. Plan actuel: ${limits.planName} (${limits.currentCount}/${limits.maxProducts})`,
        },
        { status: 403 },
      );
    }

    // Vérifier si le produit n'a pas déjà été importé
    const parsedUrl = parseShopifyProductUrl(url);
    if (parsedUrl) {
      // Note: On ne peut vérifier que si on a l'ID du produit
      // Pour l'instant, on laisse passer, l'import échouera si doublon
    }

    // Importer le produit
    const result = await importProduct(
      shop,
      url,
      pricingConfig,
      admin,
      status as "ACTIVE" | "DRAFT",
    );

    if (!result.success) {
      return Response.json(
        { success: false, error: result.errors?.[0] || "Échec de l'import" },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      product: result.product,
      importedProduct: result.importedProductRecord,
    });
  } catch (error) {
    console.error("Error importing product:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    );
  }
};
