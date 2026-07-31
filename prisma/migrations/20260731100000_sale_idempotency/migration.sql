ALTER TABLE "Sale" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "Sale_companyId_idempotencyKey_key" ON "Sale"("companyId", "idempotencyKey");
