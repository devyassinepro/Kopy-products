/**
 * Webhook GDPR : Suppression de données boutique
 * Appelé 48h après la désinstallation de l'app
 * Doit supprimer toutes les données de la boutique
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log("Received GDPR webhook:", topic);

  if (!shop) {
    throw new Response("Shop is required", { status: 400 });
  }

  try {
    const shopDomain = payload.shop_domain as string;

    console.log(`GDPR Shop Redact Request for shop ${shopDomain}`);

    // Supprimer toutes les données de la boutique
    // Les produits importés seront supprimés en cascade grâce aux relations Prisma
    await prisma.appSettings.deleteMany({
      where: { shop: shopDomain },
    });

    // Les importedProducts seront supprimés automatiquement via cascade
    // Les variants seront supprimés automatiquement via cascade

    console.log(`All data deleted for shop ${shopDomain}`);

    return new Response("Shop data redacted", { status: 200 });
  } catch (error) {
    console.error("Error processing shop/redact webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
};
