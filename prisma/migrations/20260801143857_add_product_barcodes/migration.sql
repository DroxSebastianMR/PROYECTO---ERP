-- CreateEnum
CREATE TYPE "BarcodeFormat" AS ENUM ('CODE128', 'EAN13');

-- AlterTable
ALTER TABLE "MeasurementUnit" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ProductSubcategory" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ProductBarcode" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "format" "BarcodeFormat" NOT NULL DEFAULT 'CODE128',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductBarcode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductBarcode_companyId_productId_idx" ON "ProductBarcode"("companyId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBarcode_companyId_code_key" ON "ProductBarcode"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBarcode_productId_code_key" ON "ProductBarcode"("productId", "code");

-- AddForeignKey
ALTER TABLE "ProductBarcode" ADD CONSTRAINT "ProductBarcode_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBarcode" ADD CONSTRAINT "ProductBarcode_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
