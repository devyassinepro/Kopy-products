/**
 * Page Billing : Gestion des abonnements et plans
 */

import { useEffect } from "react";
import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { getOrCreateAppSettings, canImportMoreProducts } from "../models/app-settings.server";
import { createSubscription, cancelSubscription, changePlan, getPlanById, isUpgrade } from "../services/billing.server";
import { BILLING_PLANS } from "../utils/constants";
import { calculateUsagePercentage } from "../utils/formatters";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const settings = await getOrCreateAppSettings(shop);
  const limits = await canImportMoreProducts(shop);
  const usagePercentage = calculateUsagePercentage(
    limits.currentCount,
    limits.maxProducts,
  );

  // Obtenir les infos du plan actuel
  const currentPlan = getPlanById(settings.currentPlan);

  // Calculer les upgrades disponibles pour chaque plan (server-side)
  const plansWithUpgradeInfo = Object.values(BILLING_PLANS).map((plan) => ({
    ...plan,
    isUpgrade: isUpgrade(settings.currentPlan, plan.id),
  }));

  return Response.json({
    currentPlan: {
      id: settings.currentPlan,
      details: currentPlan,
      subscriptionId: settings.subscriptionId,
      status: settings.billingStatus,
    },
    usage: {
      currentCount: limits.currentCount,
      maxProducts: limits.maxProducts,
      percentage: usagePercentage,
    },
    plans: plansWithUpgradeInfo,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    switch (action) {
      case "subscribe": {
        const planId = formData.get("planId") as string;
        const returnUrl = `${process.env.SHOPIFY_APP_URL}/app/billing?subscription=success`;

        const result = await createSubscription(admin, shop, planId, returnUrl);

        if (result.confirmationUrl) {
          return Response.json({
            success: true,
            confirmationUrl: result.confirmationUrl,
          });
        } else {
          // Plan free, pas de confirmation nécessaire
          return Response.json({
            success: true,
            message: "Passage au plan gratuit effectué",
          });
        }
      }

      case "cancel": {
        const subscriptionId = formData.get("subscriptionId") as string;

        await cancelSubscription(admin, shop, subscriptionId);

        return Response.json({
          success: true,
          message: "Abonnement annulé avec succès",
        });
      }

      case "changePlan": {
        const currentSubscriptionId = formData.get("currentSubscriptionId") as string | null;
        const newPlanId = formData.get("newPlanId") as string;
        const returnUrl = `${process.env.SHOPIFY_APP_URL}/app/billing?subscription=success`;

        const result = await changePlan(
          admin,
          shop,
          currentSubscriptionId,
          newPlanId,
          returnUrl,
        );

        if (result.confirmationUrl) {
          return Response.json({
            success: true,
            confirmationUrl: result.confirmationUrl,
          });
        } else {
          return Response.json({
            success: true,
            message: "Plan changé avec succès",
          });
        }
      }

      default:
        return Response.json({ success: false, error: "Action invalide" }, { status: 400 });
    }
  } catch (error) {
    console.error("Billing action error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    );
  }
};

export default function Billing() {
  const { currentPlan, usage, plans } = useLoaderData<typeof loader>();
  const shopify = useAppBridge();
  const fetcher = useFetcher<typeof action>();

  // Gérer les réponses
  useEffect(() => {
    if (fetcher.data?.success) {
      if (fetcher.data.confirmationUrl) {
        // Rediriger vers la page de confirmation Shopify
        window.location.href = fetcher.data.confirmationUrl;
      } else if (fetcher.data.message) {
        shopify.toast.show(fetcher.data.message);
        // Recharger la page
        window.location.reload();
      }
    } else if (fetcher.data?.error) {
      shopify.toast.show(fetcher.data.error, { isError: true });
    }
  }, [fetcher.data, shopify]);

  const isLoading = fetcher.state !== "idle";

  // Fonction pour changer de plan
  const handleChangePlan = (planId: string) => {
    const formData = new FormData();
    formData.append("action", "changePlan");
    formData.append("currentSubscriptionId", currentPlan.subscriptionId || "");
    formData.append("newPlanId", planId);

    fetcher.submit(formData, { method: "POST" });
  };

  // Fonction pour annuler
  const handleCancel = () => {
    if (!currentPlan.subscriptionId) return;

    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir annuler votre abonnement ? Vous serez rétrogradé au plan gratuit.",
    );

    if (!confirmed) return;

    const formData = new FormData();
    formData.append("action", "cancel");
    formData.append("subscriptionId", currentPlan.subscriptionId);

    fetcher.submit(formData, { method: "POST" });
  };

  return (
    <s-page heading="Abonnement">
      <s-link slot="back-action" href="/app" />

      {/* Plan actuel */}
      <s-section heading="Plan actuel">
        <s-stack direction="block" gap="base">
          <s-heading>{currentPlan.details?.name || "Free"}</s-heading>

          {currentPlan.details && (
            <>
              <s-paragraph>
                {currentPlan.details.price === 0
                  ? "Gratuit"
                  : `${currentPlan.details.price} € / mois`}
              </s-paragraph>

              <s-unordered-list>
                {currentPlan.details.features.map((feature, i) => (
                  <s-list-item key={i}>{feature}</s-list-item>
                ))}
              </s-unordered-list>
            </>
          )}

          {/* Usage */}
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="tight">
              <s-text fontWeight="bold">Utilisation</s-text>
              <s-paragraph>
                {usage.currentCount} /{" "}
                {usage.maxProducts === -1 ? "∞" : usage.maxProducts} produits
                importés ({usage.percentage}%)
              </s-paragraph>

              {usage.percentage >= 80 && usage.maxProducts !== -1 && (
                <s-banner tone="warning">
                  <s-paragraph>
                    Vous approchez de la limite de votre plan. Envisagez un upgrade
                    pour continuer à importer des produits.
                  </s-paragraph>
                </s-banner>
              )}
            </s-stack>
          </s-box>

          {currentPlan.id !== "free" && currentPlan.subscriptionId && (
            <s-button
              variant="tertiary"
              tone="critical"
              onClick={handleCancel}
              {...(isLoading ? { loading: true } : {})}
            >
              Annuler l'abonnement
            </s-button>
          )}
        </s-stack>
      </s-section>

      {/* Plans disponibles */}
      <s-section heading="Plans disponibles">
        <s-stack direction="block" gap="base">
          {plans.map((plan) => {
            const isCurrent = currentPlan.id === plan.id;
            const upgradeAvailable = plan.isUpgrade;

            return (
              <s-box
                key={plan.id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
                {...(isCurrent ? { background: "subdued" } : {})}
              >
                <s-stack direction="block" gap="base">
                  <s-stack direction="inline" gap="base" style={{ alignItems: "center" }}>
                    <s-heading style={{ flex: 1 }}>{plan.name}</s-heading>
                    {isCurrent && <s-badge tone="info">Actuel</s-badge>}
                  </s-stack>

                  <s-text fontWeight="bold">
                    {plan.price === 0 ? "Gratuit" : `${plan.price} € / mois`}
                  </s-text>

                  <s-unordered-list>
                    {plan.features.map((feature, i) => (
                      <s-list-item key={i}>{feature}</s-list-item>
                    ))}
                  </s-unordered-list>

                  {!isCurrent && (
                    <s-button
                      variant={upgradeAvailable ? "primary" : "secondary"}
                      onClick={() => handleChangePlan(plan.id)}
                      {...(isLoading ? { loading: true } : {})}
                    >
                      {upgradeAvailable ? "Upgrader" : "Changer de plan"}
                    </s-button>
                  )}
                </s-stack>
              </s-box>
            );
          })}
        </s-stack>
      </s-section>

      {/* Section aside: Informations */}
      <s-section slot="aside" heading="Informations">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Les changements de plan prennent effet immédiatement.
          </s-paragraph>

          <s-paragraph>
            Les downgrades sont appliqués à la fin de votre période de facturation
            actuelle.
          </s-paragraph>

          <s-paragraph>
            Vous pouvez annuler votre abonnement à tout moment.
          </s-paragraph>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
