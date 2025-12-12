/**
 * API Route : Récupérer tous les produits d'une collection
 * POST /api/collection/fetch-products
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  fetchProductsFromCollection,
  parseCollectionUrl,
} from "../services/collection-fetch.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  try {
    const formData = await request.formData();
    const collectionUrl = formData.get("collectionUrl") as string;

    if (!collectionUrl) {
      return Response.json(
        { success: false, error: "URL de collection requise" },
        { status: 400 },
      );
    }

    // Parser l'URL de collection
    const parsedUrl = parseCollectionUrl(collectionUrl);

    if (!parsedUrl) {
      return Response.json(
        {
          success: false,
          error:
            "URL de collection invalide. Utilisez le format: example.myshopify.com/collections/nom-collection",
        },
        { status: 400 },
      );
    }

    const { shop, handle } = parsedUrl;

    console.log(`Fetching products from collection ${handle} on ${shop}...`);

    // Récupérer tous les produits de la collection
    const result = await fetchProductsFromCollection(shop, handle);

    if (!result.success) {
      return Response.json(
        {
          success: false,
          error:
            result.error || "Impossible de récupérer les produits de la collection",
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      products: result.products,
      shopDomain: shop,
      collectionHandle: handle,
    });
  } catch (error) {
    console.error("Error fetching collection products:", error);
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la récupération des produits",
      },
      { status: 500 },
    );
  }
};
