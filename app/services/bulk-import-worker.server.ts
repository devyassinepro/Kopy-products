/**
 * Background worker pour le bulk import
 * Traite les jobs d'import en arrière-plan
 */

import prisma from "../db.server";
import { fetchProductByUrl } from "./product-fetcher.server";
import { importProduct } from "./product-importer.server";
import type { PricingConfig } from "../utils/types";

/**
 * Helper pour ajouter un produit au progress tracking
 * Maintient une fenêtre glissante des 50 derniers produits
 */
function addProductProgress(
  currentProgress: string | null,
  newProduct: {
    handle: string;
    title: string;
    status: "success" | "failed" | "processing";
    startedAt: string;
    completedAt?: string;
    sourcePrice?: number;
    destinationPrice?: number;
    destinationProductId?: string;
    error?: string | null;
  },
): string {
  try {
    const progress = currentProgress ? JSON.parse(currentProgress) : [];

    // Ajouter le nouveau produit
    progress.push(newProduct);

    // Garder seulement les 50 derniers pour éviter un JSON trop gros
    const MAX_PRODUCTS = 50;
    if (progress.length > MAX_PRODUCTS) {
      progress.splice(0, progress.length - MAX_PRODUCTS);
    }

    return JSON.stringify(progress);
  } catch (error) {
    console.error("Error updating product progress:", error);
    return currentProgress || "[]";
  }
}

/**
 * Traite un job de bulk import
 * Cette fonction s'exécute de manière asynchrone
 */
export async function processBulkImportJob(
  jobId: string,
  admin: any,
): Promise<void> {
  console.log(`[BulkImportWorker] Processing job ${jobId}...`);

  try {
    // Récupérer le job
    const job = await prisma.bulkImportJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      console.error(`[BulkImportWorker] Job ${jobId} not found`);
      return;
    }

    // Vérifier si le job n'est pas déjà en cours ou terminé
    if (job.jobStatus !== "pending") {
      console.log(
        `[BulkImportWorker] Job ${jobId} status is ${job.jobStatus}, skipping`,
      );
      return;
    }

    // Marquer le job comme en cours de traitement
    await prisma.bulkImportJob.update({
      where: { id: jobId },
      data: {
        jobStatus: "processing",
        startedAt: new Date(),
      },
    });

    // Parser la liste des produits
    const productData: Array<{ id: string; handle: string }> = JSON.parse(
      job.productIds,
    );
    const errors: Array<{ productId: string; error: string }> = [];

    // Configuration de pricing
    const pricingConfig: PricingConfig = {
      mode: job.pricingMode as "markup" | "multiplier",
      markupAmount: job.markupAmount ?? undefined,
      multiplier: job.multiplier ?? undefined,
    };

    console.log(
      `[BulkImportWorker] Importing ${productData.length} products...`,
    );

    // Traiter chaque produit
    for (let i = 0; i < productData.length; i++) {
      const product = productData[i];
      const startTime = new Date().toISOString();

      try {
        console.log(
          `[BulkImportWorker] Importing product ${i + 1}/${productData.length}: ${product.handle}`,
        );

        // Marquer le produit comme "processing"
        const processingProgress = addProductProgress(
          job.recentProductProgress,
          {
            handle: product.handle,
            title: product.handle, // On ne connaît pas encore le titre
            status: "processing",
            startedAt: startTime,
          },
        );

        await prisma.bulkImportJob.update({
          where: { id: jobId },
          data: {
            recentProductProgress: processingProgress,
          },
        });

        // Construire l'URL du produit avec le handle
        const productUrl = `https://${job.sourceShop}/products/${product.handle}.json`;

        // Récupérer le produit
        const sourceProduct = await fetchProductByUrl(productUrl);

        // Importer le produit
        const result = await importProduct(
          job.shop,
          sourceProduct,
          productUrl,
          pricingConfig,
          admin,
          job.status as "ACTIVE" | "DRAFT",
        );

        if (result.success) {
          // Si une collection est spécifiée, ajouter le produit
          if (job.collectionId && result.product) {
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
                    id: job.collectionId,
                    productIds: [result.product.id],
                  },
                },
              );
            } catch (collectionError) {
              console.error(
                `[BulkImportWorker] Error adding to collection:`,
                collectionError,
              );
              // Ne pas faire échouer l'import si l'ajout à la collection échoue
            }
          }

          // Mettre à jour le progress avec succès
          const successProgress = addProductProgress(
            job.recentProductProgress,
            {
              handle: product.handle,
              title: sourceProduct.title,
              status: "success",
              startedAt: startTime,
              completedAt: new Date().toISOString(),
              sourcePrice: parseFloat(sourceProduct.variants[0]?.price || "0"),
              destinationPrice: parseFloat(
                result.product?.variants[0]?.price || "0",
              ),
              destinationProductId: result.product?.id,
              error: null,
            },
          );

          // Incrémenter le compteur de succès
          await prisma.bulkImportJob.update({
            where: { id: jobId },
            data: {
              processedProducts: i + 1,
              successfulImports: { increment: 1 },
              recentProductProgress: successProgress,
            },
          });

          console.log(
            `[BulkImportWorker] Product ${product.handle} imported successfully`,
          );
        } else {
          throw new Error(result.error || "Import failed");
        }
      } catch (error) {
        console.error(
          `[BulkImportWorker] Error importing product ${product.handle}:`,
          error,
        );

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        // Enregistrer l'erreur
        errors.push({
          productId: product.handle,
          error: errorMessage,
        });

        // Mettre à jour le progress avec échec
        const failedProgress = addProductProgress(
          job.recentProductProgress,
          {
            handle: product.handle,
            title: product.handle, // Fallback au handle si pas de titre
            status: "failed",
            startedAt: startTime,
            completedAt: new Date().toISOString(),
            error: errorMessage,
          },
        );

        // Incrémenter le compteur d'échecs
        await prisma.bulkImportJob.update({
          where: { id: jobId },
          data: {
            processedProducts: i + 1,
            failedImports: { increment: 1 },
            recentProductProgress: failedProgress,
          },
        });
      }

      // Petite pause entre chaque produit pour éviter de surcharger l'API
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Marquer le job comme terminé
    await prisma.bulkImportJob.update({
      where: { id: jobId },
      data: {
        jobStatus: "completed",
        completedAt: new Date(),
        errors: JSON.stringify(errors),
      },
    });

    console.log(
      `[BulkImportWorker] Job ${jobId} completed. Success: ${job.successfulImports + productData.length - errors.length}, Failed: ${errors.length}`,
    );
  } catch (error) {
    console.error(`[BulkImportWorker] Fatal error processing job ${jobId}:`, error);

    // Marquer le job comme échoué
    await prisma.bulkImportJob.update({
      where: { id: jobId },
      data: {
        jobStatus: "failed",
        completedAt: new Date(),
        errors: JSON.stringify([
          {
            error: error instanceof Error ? error.message : "Fatal error",
          },
        ]),
      },
    });
  }
}

/**
 * Lance le traitement d'un job en arrière-plan (fire and forget)
 * Le job continue même si l'utilisateur quitte la page
 */
export function startBulkImportJob(jobId: string, admin: any): void {
  // Lancer le traitement de manière asynchrone sans attendre
  processBulkImportJob(jobId, admin).catch((error) => {
    console.error(
      `[BulkImportWorker] Unhandled error in background job ${jobId}:`,
      error,
    );
  });

  console.log(`[BulkImportWorker] Job ${jobId} started in background`);
}
