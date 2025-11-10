/**
 * Webhook GDPR : Demande de données client
 * Doit répondre avec les données du client dans les 30 jours
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log("Received GDPR webhook:", topic);

  if (!shop) {
    throw new Response("Shop is required", { status: 400 });
  }

  try {
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

    // Log de la demande pour traitement manuel
    console.log(
      `GDPR Data Request for shop ${shop}, customer ${customer.id} (${customer.email})`,
    );
    console.log(`Orders requested: ${orders_requested.join(", ")}`);

    // TODO: Dans une vraie application, vous devriez :
    // 1. Rechercher toutes les données associées à ce client dans votre BD
    // 2. Générer un rapport avec ces données
    // 3. Envoyer le rapport au client par email
    // 4. Garder une trace de la demande pour conformité

    // Pour l'instant, nous n'avons pas de données clients personnelles stockées
    // car notre app ne traite que des produits

    return new Response("Data request logged", { status: 200 });
  } catch (error) {
    console.error("Error processing customers/data_request webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
};
