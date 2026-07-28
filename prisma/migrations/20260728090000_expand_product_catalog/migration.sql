-- Product catalog attributes and commercial classifications.
CREATE TYPE "TaxTreatment" AS ENUM ('TAXED', 'EXONERATED', 'UNAFFECTED');

CREATE TABLE "ProductCategory" (
  "id" UUID NOT NULL,
  "companyId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductBrand" (
  "id" UUID NOT NULL,
  "companyId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductBrand_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductPresentation" (
  "id" UUID NOT NULL,
  "companyId" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "unitsPerBase" DECIMAL(14,3) NOT NULL DEFAULT 1,
  "barcode" TEXT,
  "salePrice" DECIMAL(12,2),
  "wholesalePrice" DECIMAL(12,2),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductPresentation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Product"
  ADD COLUMN "barcode" TEXT,
  ADD COLUMN "categoryId" UUID,
  ADD COLUMN "brandId" UUID,
  ADD COLUMN "presentation" TEXT,
  ADD COLUMN "purchasePrice" DECIMAL(12,2),
  ADD COLUMN "wholesalePrice" DECIMAL(12,2),
  ADD COLUMN "taxTreatment" "TaxTreatment" NOT NULL DEFAULT 'TAXED',
  ADD COLUMN "imageUrl" TEXT,
  ADD COLUMN "description" TEXT;

CREATE UNIQUE INDEX "Product_companyId_barcode_key" ON "Product"("companyId", "barcode");
CREATE INDEX "Product_companyId_name_idx" ON "Product"("companyId", "name");
CREATE UNIQUE INDEX "ProductCategory_companyId_name_key" ON "ProductCategory"("companyId", "name");
CREATE UNIQUE INDEX "ProductBrand_companyId_name_key" ON "ProductBrand"("companyId", "name");
CREATE UNIQUE INDEX "ProductPresentation_productId_name_key" ON "ProductPresentation"("productId", "name");
CREATE UNIQUE INDEX "ProductPresentation_companyId_barcode_key" ON "ProductPresentation"("companyId", "barcode");

ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductBrand" ADD CONSTRAINT "ProductBrand_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductPresentation" ADD CONSTRAINT "ProductPresentation_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductPresentation" ADD CONSTRAINT "ProductPresentation_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey"
  FOREIGN KEY ("brandId") REFERENCES "ProductBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
