-- CreateTable
CREATE TABLE "BulkImportJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "sourceShop" TEXT NOT NULL,
    "sourceShopUrl" TEXT NOT NULL,
    "pricingMode" TEXT NOT NULL,
    "markupAmount" REAL,
    "multiplier" REAL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "collectionId" TEXT,
    "productIds" TEXT NOT NULL,
    "totalProducts" INTEGER NOT NULL,
    "processedProducts" INTEGER NOT NULL DEFAULT 0,
    "successfulImports" INTEGER NOT NULL DEFAULT 0,
    "failedImports" INTEGER NOT NULL DEFAULT 0,
    "jobStatus" TEXT NOT NULL DEFAULT 'pending',
    "errors" TEXT DEFAULT '[]',
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "BulkImportJob_shop_idx" ON "BulkImportJob"("shop");

-- CreateIndex
CREATE INDEX "BulkImportJob_jobStatus_idx" ON "BulkImportJob"("jobStatus");
