CREATE TYPE "CashSessionStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "CashCountStatus" AS ENUM ('BALANCED', 'SHORTAGE', 'SURPLUS');

CREATE TABLE "CashRegister" (
  "id" UUID NOT NULL,
  "companyId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CashRegister_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CashSession" (
  "id" UUID NOT NULL,
  "companyId" UUID NOT NULL,
  "cashRegisterId" UUID NOT NULL,
  "openedById" UUID NOT NULL,
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "openingAmount" DECIMAL(12,2) NOT NULL,
  "openingNotes" TEXT,
  "status" "CashSessionStatus" NOT NULL DEFAULT 'OPEN',
  "closedById" UUID,
  "closedAt" TIMESTAMP(3),
  "closingAmount" DECIMAL(12,2),
  "expectedAmount" DECIMAL(12,2),
  "countedAmount" DECIMAL(12,2),
  "difference" DECIMAL(12,2),
  "closingNotes" TEXT,
  "closingIp" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CashSession_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CashCount" (
  "id" UUID NOT NULL,
  "cashSessionId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "expectedAmount" DECIMAL(12,2) NOT NULL,
  "countedAmount" DECIMAL(12,2) NOT NULL,
  "difference" DECIMAL(12,2) NOT NULL,
  "status" "CashCountStatus" NOT NULL,
  "explanation" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CashCount_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CashCountDetail" (
  "id" UUID NOT NULL,
  "cashCountId" UUID NOT NULL,
  "denomination" DECIMAL(8,2) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "subtotal" DECIMAL(12,2) NOT NULL,
  CONSTRAINT "CashCountDetail_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CashRegister_companyId_name_key" ON "CashRegister"("companyId", "name");
CREATE UNIQUE INDEX "CashRegister_companyId_code_key" ON "CashRegister"("companyId", "code");
CREATE INDEX "CashSession_companyId_status_idx" ON "CashSession"("companyId", "status");
CREATE INDEX "CashSession_cashRegisterId_status_idx" ON "CashSession"("cashRegisterId", "status");
CREATE INDEX "CashSession_openedById_status_idx" ON "CashSession"("openedById", "status");
CREATE UNIQUE INDEX "CashSession_one_open_per_register" ON "CashSession"("cashRegisterId") WHERE "status" = 'OPEN';
CREATE UNIQUE INDEX "CashSession_one_open_per_user" ON "CashSession"("companyId", "openedById") WHERE "status" = 'OPEN';
CREATE INDEX "CashCount_cashSessionId_createdAt_idx" ON "CashCount"("cashSessionId", "createdAt");
CREATE UNIQUE INDEX "CashCountDetail_cashCountId_denomination_key" ON "CashCountDetail"("cashCountId", "denomination");
ALTER TABLE "CashRegister" ADD CONSTRAINT "CashRegister_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "CashRegister"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CashCount" ADD CONSTRAINT "CashCount_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashCount" ADD CONSTRAINT "CashCount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashCountDetail" ADD CONSTRAINT "CashCountDetail_cashCountId_fkey" FOREIGN KEY ("cashCountId") REFERENCES "CashCount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
