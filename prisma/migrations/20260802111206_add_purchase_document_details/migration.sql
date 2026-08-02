-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "purchasedAt" TIMESTAMP(3),
ADD COLUMN     "warehouseEntryAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PurchaseItem" ADD COLUMN     "presentationName" TEXT,
ADD COLUMN     "unit" TEXT;
