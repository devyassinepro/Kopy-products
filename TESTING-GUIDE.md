# Guide de Test - Kopy Products

## Comment Tester l'Application

### Option 1 : Tester avec Votre Propre Boutique

La méthode la plus simple pour tester l'application :

1. **Créez un produit dans votre boutique de test**
   - Allez dans Products > Add product
   - Créez un produit simple avec quelques variants
   - Publiez-le

2. **Obtenez l'URL du produit**
   - Cliquez sur "View product" dans l'admin
   - Copiez l'URL du produit (ex: https://votre-boutique.myshopify.com/products/nom-produit)

3. **Importez dans Kopy Products**
   - Collez l'URL dans Kopy Products
   - Comme c'est votre boutique, l'app utilisera votre token Admin API
   - L'import devrait fonctionner parfaitement

### Option 2 : Boutiques de Démonstration Shopify

Certaines boutiques de démonstration Shopify ont l'API publique activée :

**Boutique de test recommandée :**
```
https://hydrogen-preview.myshopify.com/products/
```

Cette boutique est publique et utilisée par Shopify pour les démonstrations.

### Option 3 : Créer Une Boutique de Test Publique

1. **Créez une boutique de développement**
   - Via Shopify Partners
   - Ajoutez quelques produits

2. **Activez l'accès public (si nécessaire)**
   - Installez l'app Storefront API
   - Créez un token public

3. **Utilisez cette boutique comme source**
   - Vous avez le contrôle total
   - Vous pouvez tester toutes les fonctionnalités

## Scénarios de Test

### Test 1 : Import Basique
1. Collez une URL de produit
2. Cliquez sur "Charger le produit"
3. Vérifiez la prévisualisation
4. Configurez le pricing (ex: markup +10€)
5. Importez le produit
6. Vérifiez dans votre catalogue Shopify

### Test 2 : Pricing avec Multiplicateur
1. Chargez un produit
2. Choisissez "Multiplicateur"
3. Mettez 1.5 (prix x 1.5)
4. Vérifiez l'aperçu des prix
5. Importez

### Test 3 : Plans de Facturation
1. Allez dans Abonnement
2. Testez le passage au plan Basic
3. Importez jusqu'à 5 produits (limite Free)
4. Vérifiez que le 6ème produit est bloqué
5. Passez au plan Pro
6. Vérifiez que l'import est à nouveau possible

### Test 4 : Synchronisation Manuelle
1. Importez un produit
2. Allez dans Historique
3. Cliquez sur "Sync" à côté du produit
4. Modifiez le prix source
5. Relancez la sync
6. Vérifiez que le prix destination est mis à jour

### Test 5 : Filtres et Recherche
1. Importez plusieurs produits
2. Allez dans Historique
3. Testez les filtres (statut, boutique source, pricing)
4. Testez la recherche par titre
5. Testez la pagination

## Produits de Test Recommandés

Pour des tests réalistes, créez des produits avec :
- ✅ Plusieurs variants (taille, couleur)
- ✅ Prix variés (10€, 50€, 100€)
- ✅ Images multiples
- ✅ Descriptions longues

## Erreurs Attendues

### ❌ Erreur 403
**Cause** : Boutique source avec API privée
**Solution** : Utilisez votre propre boutique ou une boutique publique

### ❌ "Limite atteinte"
**Cause** : Vous avez atteint la limite de votre plan
**Solution** : Supprimez des produits ou passez au plan supérieur

### ❌ "URL invalide"
**Cause** : Format d'URL incorrect
**Solution** : Utilisez le format https://shop.com/products/handle

## Checklist de Test Complet

- [ ] Import d'un produit simple
- [ ] Import d'un produit avec variants
- [ ] Pricing avec markup
- [ ] Pricing avec multiplicateur
- [ ] Synchronisation manuelle
- [ ] Filtres dans l'historique
- [ ] Recherche de produits
- [ ] Changement de plan
- [ ] Vérification des limites
- [ ] Paramètres de pricing par défaut
- [ ] Ajout/suppression de magasins sources

## Nettoyage Après Tests

Pour nettoyer votre base de données après les tests :

```bash
# Supprimer la base de données SQLite
rm prisma/dev.sqlite

# Recréer la base
npm run setup
```

## Support

Si vous rencontrez des problèmes pendant les tests :
- Vérifiez les logs dans la console
- Vérifiez que `npm run dev` tourne sans erreurs
- Consultez LIMITATIONS.md pour les restrictions connues
