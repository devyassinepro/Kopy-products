/**
 * API Route : Récupérer tous les produits d'une boutique
 * POST /api/bulk/fetch-products
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { fetchAllProductsFromShop, parseShopDomain } from "../services/bulk-fetch.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  try {
    const formData = await request.formData();
    const shopUrl = formData.get("shopUrl") as string;

    if (!shopUrl) {
      return Response.json(
        { success: false, error: "URL de boutique requise" },
        { status: 400 },
      );
    }

    // Parser le domain
    const shopDomain = parseShopDomain(shopUrl);

    if (!shopDomain) {
      return Response.json(
        {
          success: false,
          error:
            "URL de boutique invalide. Utilisez le format: example.myshopify.com ou example.com",
        },
        { status: 400 },
      );
    }

    console.log(`Fetching products from ${shopDomain}...`);

    // Récupérer tous les produits
    const result = await fetchAllProductsFromShop(shopDomain);

    if (!result.success) {
      return Response.json(
        {
          success: false,
          error: result.error || "Impossible de récupérer les produits",
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      products: result.products,
      shopDomain,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de la récupération",
      },
      { status: 500 },
    );
  }
};
