# Limitations de Kopy Products

## Erreur 403 - Accès Interdit

### Pourquoi cette erreur ?

L'erreur 403 se produit lorsque vous essayez d'importer un produit depuis une boutique Shopify qui a **désactivé l'accès public** à son API Storefront. C'est une mesure de sécurité que certains marchands utilisent pour protéger leurs données.

### Boutiques concernées

La boutique **pourtoimonchat.com** (et beaucoup d'autres) nécessite une authentification pour accéder aux données des produits via l'API.

## Solutions Alternatives

### Solution 1 : Importer depuis votre propre boutique

Si vous avez installé Kopy Products sur votre boutique et que vous voulez dupliquer un produit qui existe déjà chez vous :
1. Copiez l'URL du produit depuis votre admin Shopify
2. L'application utilisera votre token d'authentification

### Solution 2 : Demander l'accès à la boutique source

Si vous avez un partenariat avec la boutique source :
1. Demandez-leur d'activer l'accès public à leur Storefront API
2. Ou demandez-leur un token Storefront API que vous pouvez configurer

### Solution 3 : Import manuel (À venir)

Nous travaillons sur une fonctionnalité d'import manuel où vous pourrez :
1. Copier/coller les informations du produit manuellement
2. Télécharger les images
3. Créer le produit avec le pricing automatique

### Solution 4 : Web Scraping (Non recommandé)

Bien que techniquement possible, scraper les données d'une boutique sans permission viole généralement :
- Les conditions d'utilisation de Shopify
- Les droits de propriété intellectuelle
- Les lois sur la protection des données

**Nous ne recommandons PAS cette approche.**

## Boutiques Compatibles

Kopy Products fonctionne avec :
- ✅ Boutiques avec Storefront API publique activée
- ✅ Votre propre boutique (via Admin API)
- ✅ Boutiques partenaires qui vous ont donné un token

## Configuration Avancée

### Ajouter un Token Storefront

Si vous avez obtenu un token Storefront d'une boutique partenaire :

1. Allez dans **Paramètres** > **Magasins sources autorisés**
2. Ajoutez le domaine de la boutique
3. Contactez notre support pour configurer le token

### Partenariats entre Boutiques

Si vous avez un partenariat avec d'autres boutiques Shopify :
1. Les deux boutiques installent Kopy Products
2. Vous autorisez l'accès mutuel via les paramètres
3. L'import devient possible dans les deux sens

## Support

Pour toute question sur les limitations ou pour demander de l'aide :
- Email : support@kopyproducts.com
- Documentation : https://docs.kopyproducts.com

## Roadmap

Fonctionnalités à venir pour contourner ces limitations :
- [ ] Import manuel avec formulaire
- [ ] Gestion des tokens Storefront par boutique
- [ ] Système de partenariat entre boutiques
- [ ] Import depuis CSV/Excel
- [ ] Import depuis images + IA pour extraire les données
