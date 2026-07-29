ALTER TABLE "Product" ADD COLUMN "subcategoryId" UUID;
ALTER TABLE "Product" ADD COLUMN "wholesaleMinQuantity" DECIMAL(14,3);
ALTER TABLE "Product" ADD COLUMN "sellRetail" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Product" ADD COLUMN "sellWholesale" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "ProductSubcategory" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "companyId" UUID NOT NULL,
  "categoryId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductSubcategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProductSubcategory_categoryId_name_key" ON "ProductSubcategory"("categoryId", "name");
CREATE INDEX "ProductSubcategory_companyId_categoryId_idx" ON "ProductSubcategory"("companyId", "categoryId");
ALTER TABLE "Product" ADD CONSTRAINT "Product_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "ProductSubcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductSubcategory" ADD CONSTRAINT "ProductSubcategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductSubcategory" ADD CONSTRAINT "ProductSubcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
