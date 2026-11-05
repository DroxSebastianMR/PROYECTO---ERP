CREATE TABLE "AccessRole" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "companyId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccessRole_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AccessRolePermission" (
  "accessRoleId" UUID NOT NULL,
  "permissionId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccessRolePermission_pkey" PRIMARY KEY ("accessRoleId", "permissionId")
);
CREATE UNIQUE INDEX "AccessRole_companyId_code_key" ON "AccessRole"("companyId", "code");
CREATE UNIQUE INDEX "AccessRole_companyId_name_key" ON "AccessRole"("companyId", "name");
CREATE INDEX "AccessRole_companyId_isActive_idx" ON "AccessRole"("companyId", "isActive");
CREATE INDEX "AccessRolePermission_permissionId_idx" ON "AccessRolePermission"("permissionId");
ALTER TABLE "AccessRole" ADD CONSTRAINT "AccessRole_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessRolePermission" ADD CONSTRAINT "AccessRolePermission_accessRoleId_fkey" FOREIGN KEY ("accessRoleId") REFERENCES "AccessRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessRolePermission" ADD CONSTRAINT "AccessRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "PermissionDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
