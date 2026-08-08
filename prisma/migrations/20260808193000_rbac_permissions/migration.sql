CREATE TABLE "PermissionDefinition" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PermissionDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RolePermission" (
  "role" "UserRole" NOT NULL,
  "permissionId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("role", "permissionId"),
  CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "PermissionDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "UserPermission" (
  "userId" UUID NOT NULL,
  "permissionId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("userId", "permissionId"),
  CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "PermissionDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PermissionDefinition_code_key" ON "PermissionDefinition"("code");
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");
CREATE INDEX "UserPermission_permissionId_idx" ON "UserPermission"("permissionId");

INSERT INTO "PermissionDefinition" ("code", "module", "resource", "action", "description", "updatedAt")
SELECT code, split_part(code, '.', 1), split_part(code, '.', 2), split_part(code, '.', 3), replace(code, '.', ' '), CURRENT_TIMESTAMP
FROM (VALUES
  ('dashboard.access'),
  ('products.access'), ('products.catalog.access'), ('products.catalog.manage'), ('products.categories.access'), ('products.categories.manage'), ('products.units.access'), ('products.units.manage'), ('products.barcodes.access'), ('products.barcodes.manage'),
  ('inventory.access'), ('inventory.stock.access'), ('inventory.movements.access'), ('inventory.transfers.access'), ('inventory.transfers.manage'), ('inventory.adjustments.access'), ('inventory.adjustments.manage'), ('inventory.warehouses.access'), ('inventory.warehouses.manage'),
  ('purchases.access'), ('purchases.orders.access'), ('purchases.orders.manage'), ('purchases.suppliers.access'), ('purchases.suppliers.manage'),
  ('sales.access'), ('sales.new_sale.access'), ('sales.new_sale.create'), ('sales.history.access'), ('sales.history.view_own'), ('sales.history.view_all'),
  ('customers.access'), ('customers.manage'), ('cash.access'), ('cash.sessions.manage'), ('cash.movements.manage'),
  ('reports.access'), ('reports.export'), ('users.access'), ('users.manage'), ('users.permissions.manage'), ('settings.access')
) AS catalog(code)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "RolePermission" ("role", "permissionId")
SELECT role_map.role::"UserRole", permission."id"
FROM (VALUES
  ('ADMIN', '%'), ('MANAGER', '%'),
  ('SALES_PURCHASING', 'sales.access'), ('SALES_PURCHASING', 'sales.new_sale.access'), ('SALES_PURCHASING', 'sales.new_sale.create'), ('SALES_PURCHASING', 'sales.history.access'), ('SALES_PURCHASING', 'sales.history.view_own'), ('SALES_PURCHASING', 'customers.access'), ('SALES_PURCHASING', 'customers.manage'), ('SALES_PURCHASING', 'inventory.access'), ('SALES_PURCHASING', 'inventory.stock.access'), ('SALES_PURCHASING', 'inventory.movements.access'), ('SALES_PURCHASING', 'cash.access'), ('SALES_PURCHASING', 'cash.sessions.manage'), ('SALES_PURCHASING', 'cash.movements.manage'),
  ('ACCOUNTANT', 'dashboard.access'), ('ACCOUNTANT', 'purchases.access'), ('ACCOUNTANT', 'purchases.orders.access'), ('ACCOUNTANT', 'purchases.suppliers.access'), ('ACCOUNTANT', 'sales.access'), ('ACCOUNTANT', 'sales.history.access'), ('ACCOUNTANT', 'sales.history.view_all'), ('ACCOUNTANT', 'customers.access'), ('ACCOUNTANT', 'cash.access'), ('ACCOUNTANT', 'reports.access'), ('ACCOUNTANT', 'reports.export'),
  ('WAREHOUSE', 'products.access'), ('WAREHOUSE', 'products.catalog.access'), ('WAREHOUSE', 'products.categories.access'), ('WAREHOUSE', 'products.units.access'), ('WAREHOUSE', 'products.barcodes.access'), ('WAREHOUSE', 'inventory.access'), ('WAREHOUSE', 'inventory.stock.access'), ('WAREHOUSE', 'inventory.movements.access'), ('WAREHOUSE', 'inventory.transfers.access'), ('WAREHOUSE', 'inventory.transfers.manage'), ('WAREHOUSE', 'inventory.adjustments.access'), ('WAREHOUSE', 'inventory.adjustments.manage'), ('WAREHOUSE', 'inventory.warehouses.access')
) AS role_map(role, code)
JOIN "PermissionDefinition" permission ON role_map.code = '%' OR permission."code" = role_map.code
ON CONFLICT DO NOTHING;

INSERT INTO "UserPermission" ("userId", "permissionId")
SELECT DISTINCT user_legacy."id", definition."id"
FROM "User" user_legacy
CROSS JOIN LATERAL unnest(user_legacy."permissions") AS legacy(code)
JOIN "PermissionDefinition" definition ON definition."code" = CASE legacy.code
  WHEN 'DASHBOARD_VIEW' THEN 'dashboard.access'
  WHEN 'PRODUCTS_VIEW' THEN 'products.catalog.access'
  WHEN 'PRODUCTS_MANAGE' THEN 'products.catalog.manage'
  WHEN 'INVENTORY_VIEW' THEN 'inventory.stock.access'
  WHEN 'INVENTORY_MANAGE' THEN 'inventory.adjustments.manage'
  WHEN 'PURCHASES_VIEW' THEN 'purchases.orders.access'
  WHEN 'PURCHASES_MANAGE' THEN 'purchases.orders.manage'
  WHEN 'SALES_VIEW_OWN' THEN 'sales.history.view_own'
  WHEN 'SALES_VIEW_ALL' THEN 'sales.history.view_all'
  WHEN 'SALES_MANAGE' THEN 'sales.new_sale.create'
  WHEN 'CUSTOMERS_VIEW' THEN 'customers.access'
  WHEN 'CUSTOMERS_MANAGE' THEN 'customers.manage'
  WHEN 'CASH_VIEW' THEN 'cash.access'
  WHEN 'CASH_MANAGE' THEN 'cash.sessions.manage'
  WHEN 'REPORTS_VIEW' THEN 'reports.access'
  WHEN 'USERS_MANAGE' THEN 'users.manage'
  ELSE legacy.code
END
ON CONFLICT DO NOTHING;
