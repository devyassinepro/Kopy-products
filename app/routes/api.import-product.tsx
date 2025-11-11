/**
 * API Route : Import d'un produit
 * POST /api/import-product
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { importProduct } from "../services/product-importer.server";
import { canImportMoreProducts } from "../models/app-settings.server";
import { ERROR_MESSAGES } from "../utils/constants";
import type { PricingConfig, SourceProduct } from "../utils/types";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    const formData = await request.formData();
    const productDataJson = formData.get("productData") as string;
    const sourceUrl = formData.get("sourceUrl") as string;
    const pricingMode = formData.get("pricingMode") as string;
    const markupAmount = formData.get("markupAmount");
    const multiplier = formData.get("multiplier");
    const status = (formData.get("status") as string) || "ACTIVE";

    // Validations
    if (!productDataJson || !sourceUrl) {
      return Response.json(
        { success: false, error: "Données du produit requises" },
        { status: 400 },
      );
    }

    const productData: SourceProduct = JSON.parse(productDataJson);

    // Construire la config de pricing
    const pricingConfig: PricingConfig = {
      mode: pricingMode as "markup" | "multiplier",
      markupAmount: markupAmount ? parseFloat(markupAmount as string) : undefined,
      multiplier: multiplier ? parseFloat(multiplier as string) : undefined,
    };

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

    // Importer le produit
    const result = await importProduct(
      shop,
      productData,
      sourceUrl,
      pricingConfig,
      admin,
      status as "ACTIVE" | "DRAFT",
    );

    if (!result.success) {
      return Response.json(
        { success: false, error: result.error || "Échec de l'import" },
        { status: 500 },
      );
    }

    // Ajouter à la collection si spécifié
    const collectionId = formData.get("collectionId") as string;
    if (collectionId && result.product) {
      try {
        await admin.graphql(
          `#graphql
          mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
            collectionAddProducts(id: $id, productIds: $productIds) {
              collection { id }
              userErrors { field message }
            }
          }`,
          {
            variables: {
              id: collectionId,
              productIds: [result.product.id]
            }
          },
        );
      } catch (error) {
        console.error("Error adding product to collection:", error);
        // Ne pas faire échouer l'import si l'ajout à la collection échoue
      }
    }

    return Response.json({
      success: true,
      product: result.product,
      importedProduct: result.importedProduct,
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
