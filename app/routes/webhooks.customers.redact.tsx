/**
 * Webhook GDPR : Suppression de données client
 * Doit supprimer toutes les données du client dans les 30 jours
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
      orders_to_redact,
    } = payload as {
      customer: {
        id: number;
        email: string;
      };
      orders_to_redact: number[];
    };

    // Log de la demande
    console.log(
      `GDPR Redact Request for shop ${shop}, customer ${customer.id} (${customer.email})`,
    );
    console.log(`Orders to redact: ${orders_to_redact.join(", ")}`);

    // TODO: Dans une vraie application, vous devriez :
    // 1. Rechercher toutes les données associées à ce client dans votre BD
    // 2. Supprimer ou anonymiser ces données
    // 3. Garder une trace de la suppression pour conformité

    // Pour notre app, nous n'avons pas de données clients personnelles stockées
    // car nous ne traitons que des produits sans lien avec les clients

    return new Response("Redaction completed", { status: 200 });
  } catch (error) {
    console.error("Error processing customers/redact webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
};
