/**
 * Service de récupération en masse (bulk) de produits
 * Récupère tous les produits d'une boutique Shopify
 */

export interface BulkProduct {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  price: string;
  image: string | null;
  variantsCount: number;
}

/**
 * Récupère tous les produits d'une boutique Shopify via l'endpoint JSON
 * Utilise la pagination pour récupérer tous les produits
 */
export async function fetchAllProductsFromShop(
  shopDomain: string,
): Promise<{ success: boolean; products?: BulkProduct[]; error?: string }> {
  try {
    const allProducts: BulkProduct[] = [];
    let page = 1;
    let hasMoreProducts = true;

    console.log(`Fetching products from ${shopDomain}...`);

    // Shopify limite à 250 produits par page
    while (hasMoreProducts) {
      const url = `https://${shopDomain}/products.json?limit=250&page=${page}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Kopy Products App",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: "Boutique non trouvée ou API non accessible",
          };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const products = data.products || [];

      console.log(`Page ${page}: ${products.length} products fetched`);

      if (products.length === 0) {
        hasMoreProducts = false;
        break;
      }

      // Transformer les produits au format simplifié
      const transformedProducts = products.map((product: any) => ({
        id: product.id?.toString() || "",
        handle: product.handle || "",
        title: product.title || "",
        vendor: product.vendor || "",
        productType: product.product_type || "",
        price: product.variants?.[0]?.price || "0",
        image: product.images?.[0]?.src || null,
        variantsCount: product.variants?.length || 0,
      }));

      allProducts.push(...transformedProducts);

      // Si moins de 250 produits, c'est la dernière page
      if (products.length < 250) {
        hasMoreProducts = false;
      } else {
        page++;
      }

      // Petite pause pour éviter de surcharger le serveur
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`Total products fetched: ${allProducts.length}`);

    return {
      success: true,
      products: allProducts,
    };
  } catch (error) {
    console.error("Error fetching products from shop:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de la récupération des produits",
    };
  }
}

/**
 * Parse une URL de boutique Shopify et retourne le domain
 */
export function parseShopDomain(url: string): string | null {
  try {
    // Nettoyer l'URL
    let cleanUrl = url.trim();

    // Ajouter https:// si manquant
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const urlObj = new URL(cleanUrl);
    let hostname = urlObj.hostname;

    // Retirer www. si présent
    if (hostname.startsWith("www.")) {
      hostname = hostname.substring(4);
    }

    // Vérifier que c'est bien une boutique Shopify
    if (hostname.includes("myshopify.com") || hostname.includes(".")) {
      return hostname;
    }

    return null;
  } catch {
    // Si l'URL n'est pas valide, essayer de la traiter comme un domain direct
    const cleaned = url.trim().replace(/^(https?:\/\/)?(www\.)?/, "");
    if (cleaned.includes(".")) {
      return cleaned.split("/")[0];
    }
    return null;
  }
}
