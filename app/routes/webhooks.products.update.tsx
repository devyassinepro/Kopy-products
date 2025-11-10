/**
 * Webhook : Mise à jour de produit
 * Utilisé pour la synchronisation automatique des produits importés
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { extractIdFromGid } from "../utils/formatters";
import { calculateDestinationPrice } from "../utils/formatters";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, payload } = await authenticate.webhook(request);

  console.log("Received webhook:", topic);

  if (!shop) {
    throw new Response("Shop is required", { status: 400 });
  }

  try {
    const product = payload as {
      id: number;
      admin_graphql_api_id: string;
      title: string;
      variants: Array<{
        id: number;
        price: string;
        compare_at_price?: string;
      }>;
    };

    const sourceProductId = product.id.toString();

    // Trouver les produits importés qui correspondent à ce produit source
    // Note: Cela fonctionnera seulement si le shop qui a envoyé le webhook
    // correspond au sourceShop dans notre BD
    const importedProducts = await prisma.importedProduct.findMany({
      where: {
        sourceProductId,
        syncEnabled: true,
      },
      include: {
        variants: true,
        settings: true,
      },
    });

    console.log(`Found ${importedProducts.length} products to sync for source product ${sourceProductId}`);

    if (importedProducts.length === 0) {
      return new Response("No products to sync", { status: 200 });
    }

    // Pour chaque produit importé, mettre à jour les prix
    for (const importedProduct of importedProducts) {
      console.log(`Syncing product ${importedProduct.id} for shop ${importedProduct.shop}`);

      // Créer un mapping des variants source -> variants payload
      const sourceVariantsMap = new Map(
        product.variants.map((v) => [v.id.toString(), v])
      );

      // Mettre à jour chaque variant
      for (const variantMapping of importedProduct.variants) {
        const sourceVariant = sourceVariantsMap.get(variantMapping.sourceVariantId);

        if (!sourceVariant) {
          console.log(`Source variant ${variantMapping.sourceVariantId} not found in webhook payload`);
          continue;
        }

        const newSourcePrice = parseFloat(sourceVariant.price);

        // Calculer le nouveau prix destination
        const newDestinationPrice = calculateDestinationPrice(newSourcePrice, {
          mode: importedProduct.pricingMode as "markup" | "multiplier",
          markupAmount: importedProduct.markupAmount || undefined,
          multiplier: importedProduct.multiplier || undefined,
        });

        // Mettre à jour le mapping
        await prisma.variantMapping.update({
          where: { id: variantMapping.id },
          data: {
            sourcePrice: newSourcePrice,
            destinationPrice: newDestinationPrice,
          },
        });

        console.log(
          `Updated variant ${variantMapping.id}: ${variantMapping.sourcePrice} -> ${newSourcePrice}, ` +
          `destination: ${variantMapping.destinationPrice} -> ${newDestinationPrice}`
        );

        // TODO: Mettre à jour le prix dans Shopify via Admin API
        // Nécessite d'avoir un admin client pour chaque shop destination
        // Ce serait mieux fait via un job background
      }

      // Mettre à jour la date de dernière sync
      await prisma.importedProduct.update({
        where: { id: importedProduct.id },
        data: { lastSyncAt: new Date() },
      });
    }

    return new Response("Sync completed", { status: 200 });
  } catch (error) {
    console.error("Error processing products/update webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
};
