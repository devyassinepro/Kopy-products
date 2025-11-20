/**
 * Webhook GDPR : Point d'entrée unique pour tous les webhooks GDPR
 * Gère les requêtes POST de Shopify et les routes vers les handlers appropriés
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  // L'authentification va automatiquement retourner 401 si elle échoue
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log("Received GDPR webhook:", topic);

  if (!shop) {
    throw new Response("Shop is required", { status: 400 });
  }

  try {
    switch (topic) {
      case "CUSTOMERS_DATA_REQUEST": {
        // Demande d'accès aux données du client
        const {
          customer,
          orders_requested,
        } = payload as {
          customer: {
            id: number;
            email: string;
          };
          orders_requested: number[];
        };

        console.log(
          `GDPR Data Request for shop ${shop}, customer ${customer.id} (${customer.email})`,
        );
        console.log(`Orders requested: ${orders_requested.join(", ")}`);

        // Notre app ne stocke pas de données clients personnelles
        // car nous ne traitons que des produits
        return new Response("Data request logged", { status: 200 });
      }

      case "CUSTOMERS_REDACT": {
        // Demande de suppression des données du client
        const {
          customer,
          orders_to_redact,
        } = payload as {
          customer: {
            id: number;
            email: string;
          };
          orders_to_redact: number[];
        };

        console.log(
          `GDPR Redact Request for shop ${shop}, customer ${customer.id} (${customer.email})`,
        );
        console.log(`Orders to redact: ${orders_to_redact.join(", ")}`);

        // Notre app ne stocke pas de données clients personnelles
        return new Response("Redaction completed", { status: 200 });
      }

      case "SHOP_REDACT": {
        // Demande de suppression de toutes les données de la boutique
        const shopDomain = payload.shop_domain as string;

        console.log(`GDPR Shop Redact Request for shop ${shopDomain}`);

        // Supprimer toutes les données de la boutique
        await prisma.appSettings.deleteMany({
          where: { shop: shopDomain },
        });

        console.log(`All data deleted for shop ${shopDomain}`);

        return new Response("Shop data redacted", { status: 200 });
      }

      default:
        console.log(`Unhandled GDPR topic: ${topic}`);
        return new Response("Webhook received", { status: 200 });
    }
  } catch (error) {
    console.error("Error processing GDPR webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
};
