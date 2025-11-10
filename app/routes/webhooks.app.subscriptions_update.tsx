/**
 * Webhook : Mise à jour d'abonnement
 * Appelé quand un abonnement change de statut (activé, annulé, expiré)
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { updateBillingPlan, updateBillingStatus } from "../models/app-settings.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, payload } = await authenticate.webhook(request);

  console.log("Received webhook:", topic);

  if (!shop) {
    throw new Response("Shop is required", { status: 400 });
  }

  try {
    const {
      app_subscription,
    } = payload as {
      app_subscription: {
        id: string;
        name: string;
        status: string;
        admin_graphql_api_id: string;
      };
    };

    // Déterminer le plan à partir du nom de l'abonnement
    let planId = "free";
    if (app_subscription.name.includes("Basic")) {
      planId = "basic";
    } else if (app_subscription.name.includes("Pro")) {
      planId = "pro";
    } else if (app_subscription.name.includes("Premium")) {
      planId = "premium";
    }

    // Mettre à jour le statut en fonction du status du webhook
    let billingStatus = "active";
    switch (app_subscription.status) {
      case "ACTIVE":
        billingStatus = "active";
        await updateBillingPlan(shop, planId, app_subscription.admin_graphql_api_id);
        break;
      case "CANCELLED":
      case "EXPIRED":
      case "DECLINED":
        billingStatus = "cancelled";
        // Rétrograder au plan free
        await updateBillingPlan(shop, "free");
        break;
      case "PENDING":
        billingStatus = "pending";
        break;
      default:
        billingStatus = "active";
    }

    await updateBillingStatus(shop, billingStatus);

    console.log(`Updated billing for ${shop}: plan=${planId}, status=${billingStatus}`);

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing app_subscriptions/update webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
};
