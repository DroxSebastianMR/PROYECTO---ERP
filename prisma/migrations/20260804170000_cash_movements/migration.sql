CREATE TABLE "CashMovement" (
  "id" UUID NOT NULL,
  "companyId" UUID NOT NULL,
  "cashSessionId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CashMovement_cashSessionId_createdAt_idx" ON "CashMovement"("cashSessionId", "createdAt");
CREATE INDEX "CashMovement_companyId_createdAt_idx" ON "CashMovement"("companyId", "createdAt");
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
