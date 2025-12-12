/**
 * API Route : Récupérer le statut d'un job de bulk import
 * POST /api/bulk/job-status
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    const formData = await request.formData();
    const jobId = formData.get("jobId") as string;

    if (!jobId) {
      return Response.json(
        { success: false, error: "Job ID requis" },
        { status: 400 },
      );
    }

    // Récupérer le job
    const job = await prisma.bulkImportJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return Response.json(
        { success: false, error: "Job non trouvé" },
        { status: 404 },
      );
    }

    // Vérifier que le job appartient bien à cette boutique
    if (job.shop !== shop) {
      return Response.json(
        { success: false, error: "Accès non autorisé" },
        { status: 403 },
      );
    }

    // Parser les erreurs si présentes
    const errors = job.errors ? JSON.parse(job.errors) : [];

    // Parser le progress des produits récents
    let recentProducts = [];
    try {
      recentProducts = job.recentProductProgress
        ? JSON.parse(job.recentProductProgress)
        : [];
    } catch (error) {
      console.error("Error parsing product progress:", error);
      recentProducts = [];
    }

    return Response.json({
      success: true,
      job: {
        id: job.id,
        sourceShop: job.sourceShop,
        sourceShopUrl: job.sourceShopUrl,
        totalProducts: job.totalProducts,
        processedProducts: job.processedProducts,
        successfulImports: job.successfulImports,
        failedImports: job.failedImports,
        jobStatus: job.jobStatus,
        errors,
        recentProducts,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        createdAt: job.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching job status:", error);
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la récupération du statut",
      },
      { status: 500 },
    );
  }
};
