/**
 * API Route : Synchronisation manuelle d'un produit
 * POST /api/sync-product/:id
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getImportedProductById } from "../models/imported-product.server";
import { syncProduct } from "../services/sync.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const { id } = params;

  if (!id) {
    return Response.json(
      { success: false, error: "ID de produit requis" },
      { status: 400 },
    );
  }

  try {
    // Récupérer le produit
    const product = await getImportedProductById(id);

    if (!product) {
      return Response.json(
        { success: false, error: "Produit non trouvé" },
        { status: 404 },
      );
    }

    // Vérifier que le produit appartient au shop actuel
    if (product.shop !== shop) {
      return Response.json(
        { success: false, error: "Accès refusé" },
        { status: 403 },
      );
    }

    // Synchroniser le produit
    const result = await syncProduct(product, admin);

    if (!result.success) {
      return Response.json(
        {
          success: false,
          error: result.errors?.join(", ") || "Échec de la synchronisation",
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      updatedVariants: result.updatedVariants,
      syncedAt: result.syncedAt,
    });
  } catch (error) {
    console.error("Error syncing product:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    );
  }
};
