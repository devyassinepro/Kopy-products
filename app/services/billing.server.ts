/**
 * Service de gestion de la facturation Shopify
 * Utilise l'API Billing de Shopify pour gérer les abonnements
 */

import { BILLING_PLANS } from "../utils/constants";
import { updateBillingPlan, updateBillingStatus } from "../models/app-settings.server";

/**
 * Crée un abonnement Shopify
 */
export async function createSubscription(
  admin: any,
  shop: string,
  planId: string,
  returnUrl: string,
) {
  const planKey = planId.toUpperCase() as keyof typeof BILLING_PLANS;
  const plan = BILLING_PLANS[planKey];

  if (!plan) {
    throw new Error("Plan invalide");
  }

  // Le plan Free ne nécessite pas d'abonnement
  if (plan.id === "free") {
    await updateBillingPlan(shop, "free");
    return { confirmationUrl: null };
  }

  // Créer un abonnement récurrent via GraphQL
  const mutation = `
    mutation CreateAppSubscription($name: String!, $price: Decimal!, $returnUrl: URL!) {
      appSubscriptionCreate(
        name: $name
        returnUrl: $returnUrl
        lineItems: [
          {
            plan: {
              appRecurringPricingDetails: {
                price: { amount: $price, currencyCode: USD }
              }
            }
          }
        ]
      ) {
        appSubscription {
          id
          status
        }
        confirmationUrl
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await admin.graphql(mutation, {
    variables: {
      name: `Kopy Products - ${plan.name}`,
      price: plan.price,
      returnUrl,
    },
  });

  const result = await response.json();

  if (result.data?.appSubscriptionCreate?.userErrors?.length > 0) {
    const errors = result.data.appSubscriptionCreate.userErrors
      .map((err: any) => err.message)
      .join(", ");
    throw new Error(`Erreur de création d'abonnement: ${errors}`);
  }

  const subscription = result.data?.appSubscriptionCreate?.appSubscription;
  const confirmationUrl = result.data?.appSubscriptionCreate?.confirmationUrl;

  if (!subscription || !confirmationUrl) {
    throw new Error("Échec de la création de l'abonnement");
  }

  // Enregistrer le statut en "pending" en attendant la confirmation
  await updateBillingPlan(shop, plan.id, subscription.id);
  await updateBillingStatus(shop, "pending");

  return {
    confirmationUrl,
    subscriptionId: subscription.id,
  };
}

/**
 * Annule un abonnement Shopify
 */
export async function cancelSubscription(admin: any, shop: string, subscriptionId: string) {
  const mutation = `
    mutation CancelAppSubscription($id: ID!) {
      appSubscriptionCancel(id: $id) {
        appSubscription {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await admin.graphql(mutation, {
    variables: {
      id: subscriptionId,
    },
  });

  const result = await response.json();

  if (result.data?.appSubscriptionCancel?.userErrors?.length > 0) {
    const errors = result.data.appSubscriptionCancel.userErrors
      .map((err: any) => err.message)
      .join(", ");
    throw new Error(`Erreur d'annulation: ${errors}`);
  }

  // Mettre à jour le statut en base
  await updateBillingStatus(shop, "cancelled");
  await updateBillingPlan(shop, "free");

  return {
    success: true,
  };
}

/**
 * Récupère l'abonnement actif pour un shop
 */
export async function getActiveSubscription(admin: any) {
  const query = `
    query {
      currentAppInstallation {
        activeSubscriptions {
          id
          name
          status
          lineItems {
            plan {
              pricingDetails {
                ... on AppRecurringPricing {
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
          createdAt
          trialDays
        }
      }
    }
  `;

  const response = await admin.graphql(query);
  const result = await response.json();

  const subscriptions = result.data?.currentAppInstallation?.activeSubscriptions || [];

  return subscriptions.length > 0 ? subscriptions[0] : null;
}

/**
 * Vérifie si un abonnement est actif
 */
export async function isSubscriptionActive(admin: any, shop: string): Promise<boolean> {
  try {
    const subscription = await getActiveSubscription(admin);
    return subscription !== null && subscription.status === "ACTIVE";
  } catch (error) {
    console.error("Error checking subscription:", error);
    return false;
  }
}

/**
 * Gère le changement de plan (upgrade ou downgrade)
 */
export async function changePlan(
  admin: any,
  shop: string,
  currentSubscriptionId: string | null,
  newPlanId: string,
  returnUrl: string,
) {
  // Si on passe au plan free, annuler l'abonnement actuel
  if (newPlanId === "free" && currentSubscriptionId) {
    return cancelSubscription(admin, shop, currentSubscriptionId);
  }

  // Sinon, annuler l'ancien et créer le nouveau
  if (currentSubscriptionId) {
    await cancelSubscription(admin, shop, currentSubscriptionId);
  }

  return createSubscription(admin, shop, newPlanId, returnUrl);
}

/**
 * Obtient les informations d'un plan par ID
 */
export function getPlanById(planId: string) {
  const planKey = planId.toUpperCase() as keyof typeof BILLING_PLANS;
  return BILLING_PLANS[planKey] || null;
}

/**
 * Compare deux plans pour déterminer s'il s'agit d'un upgrade
 */
export function isUpgrade(currentPlanId: string, newPlanId: string): boolean {
  const planOrder = ["free", "basic", "pro", "premium"];
  const currentIndex = planOrder.indexOf(currentPlanId.toLowerCase());
  const newIndex = planOrder.indexOf(newPlanId.toLowerCase());

  return newIndex > currentIndex;
}
