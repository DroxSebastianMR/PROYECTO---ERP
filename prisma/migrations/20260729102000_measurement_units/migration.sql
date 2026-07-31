CREATE TABLE "MeasurementUnit" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "companyId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MeasurementUnit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MeasurementUnit_companyId_code_key" ON "MeasurementUnit"("companyId", "code");
CREATE UNIQUE INDEX "MeasurementUnit_companyId_name_key" ON "MeasurementUnit"("companyId", "name");
CREATE INDEX "MeasurementUnit_companyId_isActive_idx" ON "MeasurementUnit"("companyId", "isActive");
ALTER TABLE "MeasurementUnit" ADD CONSTRAINT "MeasurementUnit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
