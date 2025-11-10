# Kopy Products - Application Shopify

Application Shopify permettant aux marchands d'importer facilement des produits depuis d'autres boutiques Shopify vers leur propre boutique avec un système de pricing automatique.

## 🎯 Fonctionnalités

### Import de Produits
- **Récupération de produits** : Importez des produits depuis n'importe quelle boutique Shopify via URL
- **Prévisualisation** : Vérifiez le produit avant l'import (images, variants, prix)
- **Pricing automatique** : Deux modes de pricing
  - **Markup fixe** : Ajoute un montant fixe à tous les prix
  - **Multiplicateur** : Multiplie tous les prix par un coefficient
- **Mapping automatique** : Tous les variants sont mappés automatiquement

### Plans de Facturation
- **Free** : 5 produits, import manuel uniquement
- **Basic** : 50 produits, import manuel, 9,99€/mois
- **Pro** : 500 produits, synchronisation quotidienne, 29,99€/mois
- **Premium** : Produits illimités, synchronisation en temps réel, 79,99€/mois

### Synchronisation
- **Manuelle** : Bouton "Sync" sur chaque produit importé
- **Automatique** (Pro/Premium)
  - Quotidienne (Pro)
  - Temps réel via webhooks (Premium)
- Mise à jour automatique des prix selon la configuration de pricing

### Gestion Avancée
- **Historique** : Liste complète avec filtres (statut, boutique source, pricing)
- **Paramètres** : Configuration des pricing par défaut, magasins sources autorisés
- **Statistiques** : Nombre de produits, utilisation du plan, etc.

## 🏗️ Architecture

### Stack Technique
- **Framework** : React Router v7
- **Backend** : Node.js avec TypeScript
- **Base de données** : Prisma (SQLite en dev, PostgreSQL/MySQL en prod)
- **UI** : Shopify Polaris Web Components
- **API** : Shopify Admin API & Storefront API (GraphQL)

### Structure des Fichiers

```
app/
├── models/              # Models Prisma (CRUD)
│   ├── app-settings.server.ts
│   └── imported-product.server.ts
├── services/            # Logique métier
│   ├── product-fetcher.server.ts
│   ├── product-importer.server.ts
│   ├── pricing.server.ts
│   ├── billing.server.ts
│   └── sync.server.ts
├── utils/               # Utilitaires
│   ├── constants.ts
│   ├── types.ts
│   ├── validators.ts
│   └── formatters.ts
└── routes/              # Pages et API
    ├── app._index.tsx           # Page d'import
    ├── app.history.tsx          # Historique
    ├── app.settings.tsx         # Paramètres
    ├── app.billing.tsx          # Abonnements
    ├── api.fetch-product.tsx    # API fetch
    ├── api.import-product.tsx   # API import
    ├── api.sync-product.$id.tsx # API sync
    └── webhooks/                # Webhooks
        ├── products.update.tsx
        ├── app.subscriptions_update.tsx
        ├── customers.data_request.tsx
        ├── customers.redact.tsx
        └── shop.redact.tsx
```

### Modèle de Données (Prisma)

```prisma
model Session {
  // Sessions Shopify (géré par Shopify App)
}

model AppSettings {
  id                   String
  shop                 String @unique
  defaultPricingMode   String
  defaultMarkupAmount  Float
  defaultMultiplier    Float
  autoSyncEnabled      Boolean
  syncFrequency        String?
  authorizedSources    String?
  currentPlan          String
  billingStatus        String
  subscriptionId       String?
  importedProducts     ImportedProduct[]
}

model ImportedProduct {
  id                    String
  shop                  String
  sourceShop            String
  sourceProductId       String
  sourceProductUrl      String
  destinationProductId  String
  title                 String
  status                String
  pricingMode           String
  markupAmount          Float?
  multiplier            Float?
  syncEnabled           Boolean
  lastSyncAt            DateTime?
  variants              VariantMapping[]
}

model VariantMapping {
  id                   String
  importedProductId    String
  sourceVariantId      String
  destinationVariantId String
  title                String?
  sourcePrice          Float
  destinationPrice     Float
  sku                  String?
}
```

## 🚀 Installation & Développement

### Prérequis
- Node.js >= 20.19
- Compte Shopify Partner
- Shopify CLI

### Setup

1. Cloner le repo
```bash
git clone https://github.com/votre-repo/kopy-products
cd kopy-products
```

2. Installer les dépendances
```bash
npm install
```

3. Générer la base de données
```bash
npm run setup
```

4. Lancer en développement
```bash
npm run dev
```

### Configuration

Fichier `.env` (créé automatiquement par Shopify CLI) :
```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SCOPES=write_products,read_products
SHOPIFY_APP_URL=https://your-tunnel.ngrok.io
```

### Webhooks Configurés

Dans `shopify.app.toml` :
- `app/uninstalled` : Nettoyage des données
- `app/scopes_update` : Mise à jour des scopes
- `products/update` : Synchronisation automatique
- `app_subscriptions/update` : Gestion billing
- `customers/data_request` : GDPR
- `customers/redact` : GDPR
- `shop/redact` : GDPR

## 📋 Flux Utilisateur

### Import d'un Produit

1. **Coller l'URL** : Copier l'URL du produit source (ex: https://shop.example.com/products/product-handle)
2. **Charger** : Cliquer sur "Charger le produit"
3. **Prévisualiser** : Vérifier le produit (images, variants, prix)
4. **Configurer le pricing** :
   - Choisir le mode (markup ou multiplicateur)
   - Définir la valeur
5. **Importer** : Cliquer sur "Importer ce produit"

Le produit est créé dans la boutique avec les prix calculés automatiquement.

### Synchronisation

**Manuelle** :
- Aller dans Historique
- Cliquer sur "Sync" à côté du produit

**Automatique** (Pro/Premium) :
- Activer dans Paramètres
- Choisir la fréquence
- Les prix se mettent à jour automatiquement

## 🔒 Sécurité & Conformité

### GDPR
- Webhook `customers/data_request` : Export des données client
- Webhook `customers/redact` : Suppression des données client
- Webhook `shop/redact` : Suppression complète à la désinstallation

### Validation
- Validation des URLs Shopify
- Validation des configs de pricing
- Sanitization des inputs
- Vérification des limites de plan

## 🧪 Tests

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build
npm run build
```

## 📦 Déploiement

1. Build l'application
```bash
npm run build
```

2. Déployer sur votre hébergeur (Fly.io, Heroku, etc.)
```bash
npm run deploy
```

3. Configurer les variables d'environnement en production
- `NODE_ENV=production`
- `DATABASE_URL` : URL de votre base de données
- Autres variables Shopify

## 🔮 Améliorations Futures

- [ ] Export/Import en masse (CSV)
- [ ] Gestion des collections
- [ ] Historique des modifications de prix
- [ ] Rapports et analytics détaillés
- [ ] Support multi-devises
- [ ] API publique pour intégrations tierces
- [ ] Règles de pricing avancées (par catégorie, vendor, etc.)

## 📝 Notes Techniques

### Pricing
Le calcul du pricing est effectué côté serveur dans `app/services/pricing.server.ts` :
- **Markup** : `newPrice = sourcePrice + markupAmount`
- **Multiplier** : `newPrice = sourcePrice * multiplier`

### Synchronisation
La synchronisation compare les prix sources avec les prix enregistrés et met à jour uniquement si changement :
- Récupération du produit source
- Comparaison des prix
- Calcul des nouveaux prix destination
- Mise à jour via Admin API

### Webhooks
Les webhooks `products/update` ne fonctionnent que si le produit source envoie des webhooks vers votre app, ce qui nécessite :
- Que la boutique source ait installé votre app (impossible pour les boutiques tierces)
- Ou que vous ayez un partenariat/accès spécial

**Solution** : Pour les boutiques tierces, la synchronisation se fait via cron jobs (plans Pro/Premium).

## 🤝 Support

Pour toute question ou problème :
- Email : support@kopyproducts.com
- Documentation : https://docs.kopyproducts.com

## 📄 Licence

Propriétaire - Tous droits réservés
