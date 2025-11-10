-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "defaultPricingMode" TEXT NOT NULL DEFAULT 'markup',
    "defaultMarkupAmount" REAL NOT NULL DEFAULT 0,
    "defaultMultiplier" REAL NOT NULL DEFAULT 1.0,
    "autoSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "syncFrequency" TEXT,
    "authorizedSources" TEXT DEFAULT '[]',
    "currentPlan" TEXT NOT NULL DEFAULT 'free',
    "billingStatus" TEXT NOT NULL DEFAULT 'active',
    "subscriptionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ImportedProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "sourceShop" TEXT NOT NULL,
    "sourceProductId" TEXT NOT NULL,
    "sourceProductHandle" TEXT,
    "sourceProductUrl" TEXT NOT NULL,
    "destinationProductId" TEXT NOT NULL,
    "destinationHandle" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "pricingMode" TEXT NOT NULL,
    "markupAmount" REAL,
    "multiplier" REAL,
    "lastSyncAt" DATETIME,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ImportedProduct_shop_fkey" FOREIGN KEY ("shop") REFERENCES "AppSettings" ("shop") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VariantMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "importedProductId" TEXT NOT NULL,
    "sourceVariantId" TEXT NOT NULL,
    "destinationVariantId" TEXT NOT NULL,
    "title" TEXT,
    "sourcePrice" REAL NOT NULL,
    "destinationPrice" REAL NOT NULL,
    "sku" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VariantMapping_importedProductId_fkey" FOREIGN KEY ("importedProductId") REFERENCES "ImportedProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_shop_key" ON "AppSettings"("shop");

-- CreateIndex
CREATE INDEX "ImportedProduct_shop_idx" ON "ImportedProduct"("shop");

-- CreateIndex
CREATE INDEX "ImportedProduct_destinationProductId_idx" ON "ImportedProduct"("destinationProductId");

-- CreateIndex
CREATE UNIQUE INDEX "ImportedProduct_shop_sourceProductId_key" ON "ImportedProduct"("shop", "sourceProductId");

-- CreateIndex
CREATE INDEX "VariantMapping_destinationVariantId_idx" ON "VariantMapping"("destinationVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantMapping_importedProductId_sourceVariantId_key" ON "VariantMapping"("importedProductId", "sourceVariantId");
