ALTER TABLE "ProductCategory" ADD COLUMN "code" TEXT;
ALTER TABLE "MeasurementUnit" ADD COLUMN "abbreviation" TEXT;

CREATE UNIQUE INDEX "ProductCategory_companyId_code_key" ON "ProductCategory"("companyId", "code");
