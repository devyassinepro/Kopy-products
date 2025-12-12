/**
 * Service de récupération de produits par collection
 * Récupère tous les produits d'une collection Shopify spécifique
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
 * Parse une URL de collection Shopify et retourne le domain et le handle
 */
export function parseCollectionUrl(url: string): {
  shop: string;
  handle: string;
} | null {
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

    // Extraire le handle de la collection depuis le path
    const pathMatch = urlObj.pathname.match(/\/collections\/([^\/\?]+)/);
    if (!pathMatch) {
      return null;
    }

    const handle = pathMatch[1];

    // Vérifier que c'est bien une boutique Shopify ou un domaine valide
    if (hostname.includes("myshopify.com") || hostname.includes(".")) {
      return {
        shop: hostname,
        handle: handle,
      };
    }

    return null;
  } catch {
    // Si l'URL n'est pas valide, essayer de la traiter manuellement
    const cleaned = url.trim().replace(/^(https?:\/\/)?(www\.)?/, "");
    const parts = cleaned.split("/");

    if (parts.length >= 3 && parts[1] === "collections") {
      const shop = parts[0];
      const handle = parts[2].split("?")[0]; // Retirer les query params

      if (shop.includes(".")) {
        return { shop, handle };
      }
    }

    return null;
  }
}

/**
 * Récupère tous les produits d'une collection Shopify via l'endpoint JSON
 * Utilise la pagination pour récupérer tous les produits
 */
export async function fetchProductsFromCollection(
  shopDomain: string,
  collectionHandle: string,
): Promise<{ success: boolean; products?: BulkProduct[]; error?: string }> {
  try {
    const allProducts: BulkProduct[] = [];
    let page = 1;
    let hasMoreProducts = true;

    console.log(
      `Fetching products from collection ${collectionHandle} on ${shopDomain}...`,
    );

    // Shopify limite à 250 produits par page
    while (hasMoreProducts) {
      const url = `https://${shopDomain}/collections/${collectionHandle}/products.json?limit=250&page=${page}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Poky-fy Import & Copy Products App",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error:
              "Collection non trouvée. Elle est peut-être privée ou supprimée.",
          };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const products = data.products || [];

      console.log(
        `Page ${page}: ${products.length} products fetched from collection`,
      );

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

    console.log(
      `Total products fetched from collection: ${allProducts.length}`,
    );

    // Vérifier si la collection est vide
    if (allProducts.length === 0) {
      return {
        success: false,
        error: "Cette collection ne contient aucun produit à importer.",
      };
    }

    return {
      success: true,
      products: allProducts,
    };
  } catch (error) {
    console.error("Error fetching products from collection:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de la récupération des produits de la collection",
    };
  }
}
