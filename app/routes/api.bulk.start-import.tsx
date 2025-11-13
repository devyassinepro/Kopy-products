/**
 * API Route : Lancer un bulk import en arrière-plan
 * POST /api/bulk/start-import
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { startBulkImportJob } from "../services/bulk-import-worker.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    const formData = await request.formData();
    const sourceShopUrl = formData.get("sourceShopUrl") as string;
    const sourceShop = formData.get("sourceShop") as string;
    const productDataJson = formData.get("productData") as string;
    const pricingMode = formData.get("pricingMode") as string;
    const markupAmount = formData.get("markupAmount");
    const multiplier = formData.get("multiplier");
    const status = (formData.get("status") as string) || "ACTIVE";
    const collectionId = formData.get("collectionId") as string | null;

    // Validations
    if (!sourceShopUrl || !sourceShop || !productDataJson) {
      return Response.json(
        { success: false, error: "Paramètres manquants" },
        { status: 400 },
      );
    }

    const productData: Array<{ id: string; handle: string }> =
      JSON.parse(productDataJson);

    if (productData.length === 0) {
      return Response.json(
        { success: false, error: "Aucun produit sélectionné" },
        { status: 400 },
      );
    }

    // Vérifier les limites du plan (DÉSACTIVÉ POUR TESTS)
    // const limits = await canImportMoreProducts(shop);

    // if (!limits.canImport) {
    //   return Response.json(
    //     {
    //       success: false,
    //       error: `Limite atteinte pour votre plan ${limits.planName} (${limits.currentCount}/${limits.maxProducts})`,
    //     },
    //     { status: 403 },
    //   );
    // }

    // // Vérifier si le nombre de produits à importer ne dépasse pas la limite
    // if (
    //   limits.maxProducts !== -1 &&
    //   limits.currentCount + productIds.length > limits.maxProducts
    // ) {
    //   return Response.json(
    //     {
    //       success: false,
    //       error: `Vous ne pouvez importer que ${limits.maxProducts - limits.currentCount} produits supplémentaires avec votre plan ${limits.planName}`,
    //     },
    //     { status: 403 },
    //   );
    // }

    // Créer le job
    const job = await prisma.bulkImportJob.create({
      data: {
        shop,
        sourceShop,
        sourceShopUrl,
        pricingMode,
        markupAmount: markupAmount ? parseFloat(markupAmount as string) : null,
        multiplier: multiplier ? parseFloat(multiplier as string) : null,
        status,
        collectionId: collectionId || null,
        productIds: productDataJson,
        totalProducts: productData.length,
        jobStatus: "pending",
      },
    });

    console.log(
      `Created bulk import job ${job.id} with ${productData.length} products`,
    );

    // Lancer le traitement en arrière-plan
    startBulkImportJob(job.id, admin);

    return Response.json({
      success: true,
      jobId: job.id,
      message: `Import de ${productData.length} produits lancé en arrière-plan`,
    });
  } catch (error) {
    console.error("Error starting bulk import:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur lors du lancement",
      },
      { status: 500 },
    );
  }
};
