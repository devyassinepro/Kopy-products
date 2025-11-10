/**
 * Page Paramètres : Configuration de l'application
 */

import { useState, useEffect } from "react";
import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useFetcher} from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  getOrCreateAppSettings,
  updateDefaultPricing,
  updateSyncSettings,
  addAuthorizedSource,
  removeAuthorizedSource,
  getAuthorizedSources,
  getCurrentPlanWithLimits,
} from "../models/app-settings.server";
import { normalizeShopifyDomain, isValidShopifyDomain } from "../utils/validators";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [settings, authorizedSources, planInfo] = await Promise.all([
    getOrCreateAppSettings(shop),
    getAuthorizedSources(shop),
    getCurrentPlanWithLimits(shop),
  ]);

  return Response.json({
    settings: {
      defaultPricingMode: settings.defaultPricingMode,
      defaultMarkupAmount: settings.defaultMarkupAmount,
      defaultMultiplier: settings.defaultMultiplier,
      autoSyncEnabled: settings.autoSyncEnabled,
      syncFrequency: settings.syncFrequency,
    },
    authorizedSources,
    plan: planInfo,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    switch (action) {
      case "updatePricing": {
        const pricingMode = formData.get("pricingMode") as string;
        const markupAmount = parseFloat(formData.get("markupAmount") as string);
        const multiplier = parseFloat(formData.get("multiplier") as string);

        await updateDefaultPricing(shop, pricingMode, markupAmount, multiplier);

        return Response.json({ success: true, message: "Paramètres de pricing mis à jour" });
      }

      case "updateSync": {
        const autoSyncEnabled = formData.get("autoSyncEnabled") === "true";
        const syncFrequency = formData.get("syncFrequency") as string | null;

        await updateSyncSettings(shop, autoSyncEnabled, syncFrequency || undefined);

        return Response.json({
          success: true,
          message: "Paramètres de synchronisation mis à jour",
        });
      }

      case "addSource": {
        const source = formData.get("source") as string;
        const normalized = normalizeShopifyDomain(source);

        if (!isValidShopifyDomain(normalized)) {
          return Response.json(
            { success: false, error: "Domaine Shopify invalide" },
            { status: 400 },
          );
        }

        await addAuthorizedSource(shop, normalized);

        return Response.json({ success: true, message: "Magasin source ajouté" });
      }

      case "removeSource": {
        const source = formData.get("source") as string;

        await removeAuthorizedSource(shop, source);

        return Response.json({ success: true, message: "Magasin source retiré" });
      }

      default:
        return Response.json({ success: false, error: "Action invalide" }, { status: 400 });
    }
  } catch (error) {
    console.error("Settings action error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    );
  }
};

export default function Settings() {
  const { settings, authorizedSources, plan } = useLoaderData<typeof loader>();
  const shopify = useAppBridge();
  const fetcher = useFetcher<typeof action>();

  // State pour pricing
  const [pricingMode, setPricingMode] = useState(settings.defaultPricingMode);
  const [markupAmount, setMarkupAmount] = useState(
    settings.defaultMarkupAmount.toString(),
  );
  const [multiplier, setMultiplier] = useState(
    settings.defaultMultiplier.toString(),
  );

  // State pour sync
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(settings.autoSyncEnabled);
  const [syncFrequency, setSyncFrequency] = useState(settings.syncFrequency || "daily");

  // State pour sources
  const [newSource, setNewSource] = useState("");

  // Gérer les réponses
  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show(fetcher.data.message || "Paramètres enregistrés");
    } else if (fetcher.data?.error) {
      shopify.toast.show(fetcher.data.error, { isError: true });
    }
  }, [fetcher.data, shopify]);

  const isLoading = fetcher.state !== "idle";

  // Fonctions
  const handleSavePricing = () => {
    const formData = new FormData();
    formData.append("action", "updatePricing");
    formData.append("pricingMode", pricingMode);
    formData.append("markupAmount", markupAmount);
    formData.append("multiplier", multiplier);

    fetcher.submit(formData, { method: "POST" });
  };

  const handleSaveSync = () => {
    if (!plan.limits.autoSync) {
      shopify.toast.show(
        "La synchronisation automatique nécessite un plan Pro ou Premium",
        { isError: true },
      );
      return;
    }

    const formData = new FormData();
    formData.append("action", "updateSync");
    formData.append("autoSyncEnabled", autoSyncEnabled.toString());
    formData.append("syncFrequency", syncFrequency);

    fetcher.submit(formData, { method: "POST" });
  };

  const handleAddSource = () => {
    if (!newSource.trim()) {
      shopify.toast.show("Veuillez entrer un domaine", { isError: true });
      return;
    }

    const formData = new FormData();
    formData.append("action", "addSource");
    formData.append("source", newSource);

    fetcher.submit(formData, { method: "POST" });
    setNewSource("");
  };

  const handleRemoveSource = (source: string) => {
    const formData = new FormData();
    formData.append("action", "removeSource");
    formData.append("source", source);

    fetcher.submit(formData, { method: "POST" });
  };

  return (
    <s-page heading="Paramètres">
      <s-link slot="back-action" href="/app" />

      {/* Section 1: Pricing par défaut */}
      <s-section heading="Pricing par défaut">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Configuration par défaut utilisée lors de l'import de produits. Vous
            pourrez toujours la modifier pour chaque produit.
          </s-paragraph>

          <s-choice-list
            label="Mode de pricing"
            value={pricingMode}
            onChange={(e: any) => setPricingMode(e.target.value)}
          >
            <s-radio value="markup">
              Markup fixe (ajouter un montant aux prix)
            </s-radio>
            <s-radio value="multiplier">
              Multiplicateur (multiplier les prix)
            </s-radio>
          </s-choice-list>

          {pricingMode === "markup" && (
            <s-text-field
              type="number"
              label="Montant du markup par défaut (€)"
              value={markupAmount}
              onChange={(e: any) => setMarkupAmount(e.target.value)}
              helpText="Exemple: 10 pour ajouter 10€ à chaque prix"
              step="0.01"
            />
          )}

          {pricingMode === "multiplier" && (
            <s-text-field
              type="number"
              label="Multiplicateur par défaut"
              value={multiplier}
              onChange={(e: any) => setMultiplier(e.target.value)}
              helpText="Exemple: 1.5 pour augmenter les prix de 50%"
              step="0.01"
              min="0.1"
            />
          )}

          <s-button
            variant="primary"
            onClick={handleSavePricing}
            {...(isLoading ? { loading: true } : {})}
          >
            Enregistrer les paramètres de pricing
          </s-button>
        </s-stack>
      </s-section>

      {/* Section 2: Synchronisation automatique */}
      <s-section heading="Synchronisation automatique">
        <s-stack direction="block" gap="base">
          {!plan.limits.autoSync ? (
            <s-banner tone="info">
              <s-paragraph>
                La synchronisation automatique est disponible avec les plans Pro et
                Premium. <s-link href="/app/billing">Voir les plans</s-link>
              </s-paragraph>
            </s-banner>
          ) : (
            <>
              <s-paragraph>
                Permet de synchroniser automatiquement les prix des produits importés
                lorsque les produits sources changent.
              </s-paragraph>

              <s-checkbox
                checked={autoSyncEnabled}
                onChange={(e: any) => setAutoSyncEnabled(e.target.checked)}
              >
                Activer la synchronisation automatique
              </s-checkbox>

              {autoSyncEnabled && (
                <s-select
                  label="Fréquence de synchronisation"
                  value={syncFrequency}
                  onChange={(e: any) => setSyncFrequency(e.target.value)}
                >
                  <option value="daily">Quotidienne</option>
                  <option value="weekly">Hebdomadaire</option>
                  {plan.limits.syncFrequency === "realtime" && (
                    <option value="realtime">Temps réel (webhooks)</option>
                  )}
                </s-select>
              )}

              <s-button
                variant="primary"
                onClick={handleSaveSync}
                {...(isLoading ? { loading: true } : {})}
              >
                Enregistrer les paramètres de synchronisation
              </s-button>
            </>
          )}
        </s-stack>
      </s-section>

      {/* Section 3: Magasins sources autorisés */}
      <s-section heading="Magasins sources autorisés">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Configurez les boutiques Shopify depuis lesquelles vous pouvez importer
            des produits. Laissez vide pour autoriser toutes les boutiques.
          </s-paragraph>

          {/* Liste des sources */}
          {authorizedSources.length > 0 && (
            <s-stack direction="block" gap="tight">
              {authorizedSources.map((source) => (
                <s-stack
                  key={source}
                  direction="inline"
                  gap="base"
                  style={{
                    padding: "8px",
                    border: "1px solid var(--s-color-border)",
                    borderRadius: "4px",
                  }}
                >
                  <s-text style={{ flex: 1 }}>{source}</s-text>
                  <s-button
                    size="small"
                    variant="tertiary"
                    onClick={() => handleRemoveSource(source)}
                    {...(isLoading ? { disabled: true } : {})}
                  >
                    Retirer
                  </s-button>
                </s-stack>
              ))}
            </s-stack>
          )}

          {/* Ajouter une source */}
          <s-stack direction="inline" gap="base">
            <s-text-field
              label="Nouveau magasin source"
              value={newSource}
              onChange={(e: any) => setNewSource(e.target.value)}
              placeholder="example.myshopify.com"
              helpText="Format: boutique.myshopify.com ou boutique.com"
            />
            <s-button
              onClick={handleAddSource}
              {...(isLoading ? { loading: true } : {})}
            >
              Ajouter
            </s-button>
          </s-stack>
        </s-stack>
      </s-section>

      {/* Section aside: Plan actuel */}
      <s-section slot="aside" heading="Plan actuel">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            <s-text fontWeight="bold">{plan.limits.name}</s-text>
          </s-paragraph>

          <s-unordered-list>
            {plan.limits.features.map((feature, i) => (
              <s-list-item key={i}>{feature}</s-list-item>
            ))}
          </s-unordered-list>

          <s-link href="/app/billing">Gérer votre abonnement</s-link>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
