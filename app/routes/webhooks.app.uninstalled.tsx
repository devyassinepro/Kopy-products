import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    await db.session.deleteMany({ where: { shop } });
  }

  // Nettoyer les données de l'application
  // Note: Les ImportedProduct seront supprimés en cascade
  try {
    await db.appSettings.deleteMany({ where: { shop } });
    console.log(`Deleted app data for ${shop}`);
  } catch (error) {
    console.error(`Error deleting app data for ${shop}:`, error);
  }

  return new Response();
};
