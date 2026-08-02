ALTER TABLE "Supplier" ADD COLUMN "code" TEXT;

WITH numbered_suppliers AS (
  SELECT
    "id",
    'PRV' || LPAD(ROW_NUMBER() OVER (PARTITION BY "companyId" ORDER BY "createdAt")::TEXT, 3, '0') AS code
  FROM "Supplier"
)
UPDATE "Supplier" AS supplier
SET "code" = numbered_suppliers.code
FROM numbered_suppliers
WHERE supplier."id" = numbered_suppliers."id";

ALTER TABLE "Supplier" ALTER COLUMN "code" SET NOT NULL;

CREATE UNIQUE INDEX "Supplier_companyId_code_key" ON "Supplier"("companyId", "code");
