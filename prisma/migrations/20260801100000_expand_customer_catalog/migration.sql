ALTER TABLE "Customer"
  ADD COLUMN "code" TEXT,
  ADD COLUMN "customerType" TEXT NOT NULL DEFAULT 'PERSONA_NATURAL',
  ADD COLUMN "documentType" TEXT NOT NULL DEFAULT 'DNI',
  ADD COLUMN "firstName" TEXT,
  ADD COLUMN "lastName" TEXT,
  ADD COLUMN "birthDate" TIMESTAMP(3),
  ADD COLUMN "gender" TEXT,
  ADD COLUMN "civilStatus" TEXT,
  ADD COLUMN "companyName" TEXT,
  ADD COLUMN "tradeName" TEXT,
  ADD COLUMN "legalRepresentative" TEXT,
  ADD COLUMN "representativeRole" TEXT,
  ADD COLUMN "mobilePhone" TEXT,
  ADD COLUMN "companyPhone" TEXT,
  ADD COLUMN "companyEmail" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "ubigeo" TEXT,
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'REGULAR',
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVO',
  ADD COLUMN "notes" TEXT;

WITH numbered_customers AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "companyId" ORDER BY "createdAt", "id") AS sequence
  FROM "Customer"
)
UPDATE "Customer" AS customer
SET "code" = 'CLI-' || LPAD(numbered_customers.sequence::TEXT, 6, '0')
FROM numbered_customers
WHERE customer."id" = numbered_customers."id";

ALTER TABLE "Customer" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "Customer_companyId_code_key" ON "Customer"("companyId", "code");
