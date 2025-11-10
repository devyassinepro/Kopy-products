/**
 * API Route : Récupération d'un produit pour prévisualisation
 * POST /api/fetch-product
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { fetchProductByUrl } from "../services/product-fetcher.server";
import { isValidShopifyProductUrl } from "../utils/validators";
import { ERROR_MESSAGES } from "../utils/constants";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const formData = await request.formData();
    const url = formData.get("url") as string;

    // Validation
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

    // Récupérer le produit
    const product = await fetchProductByUrl(url, admin);

    return Response.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    );
  }
};
