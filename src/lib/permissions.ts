import { PATHS } from "@/app/router/constants/paths";

export const PERMISSIONS = [
  "dashboard.access",
  "products.access", "products.catalog.access", "products.catalog.manage", "products.categories.access", "products.categories.manage", "products.units.access", "products.units.manage", "products.barcodes.access", "products.barcodes.manage",
  "inventory.access", "inventory.stock.access", "inventory.movements.access", "inventory.transfers.access", "inventory.transfers.manage", "inventory.adjustments.access", "inventory.adjustments.manage", "inventory.warehouses.access", "inventory.warehouses.manage",
  "purchases.access", "purchases.orders.access", "purchases.orders.manage", "purchases.suppliers.access", "purchases.suppliers.manage",
  "sales.access", "sales.new_sale.access", "sales.new_sale.create", "sales.history.access", "sales.history.view_own", "sales.history.view_all",
  "customers.access", "customers.manage", "cash.access", "cash.sessions.manage", "cash.movements.manage", "reports.access", "reports.export", "users.access", "users.manage", "users.permissions.manage", "settings.access",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const legacyAliases: Partial<Record<Permission, readonly string[]>> = {
  "dashboard.access": ["DASHBOARD_VIEW"], "products.access": ["PRODUCTS_VIEW", "PRODUCTS_MANAGE"], "products.catalog.access": ["PRODUCTS_VIEW", "PRODUCTS_MANAGE"], "products.catalog.manage": ["PRODUCTS_MANAGE"], "products.categories.access": ["PRODUCTS_VIEW", "PRODUCTS_MANAGE"], "products.categories.manage": ["PRODUCTS_MANAGE"], "products.units.access": ["PRODUCTS_VIEW", "PRODUCTS_MANAGE"], "products.units.manage": ["PRODUCTS_MANAGE"], "products.barcodes.access": ["PRODUCTS_VIEW", "PRODUCTS_MANAGE"], "products.barcodes.manage": ["PRODUCTS_MANAGE"],
  "inventory.access": ["INVENTORY_VIEW", "INVENTORY_MANAGE"], "inventory.stock.access": ["INVENTORY_VIEW", "INVENTORY_MANAGE"], "inventory.movements.access": ["INVENTORY_VIEW", "INVENTORY_MANAGE"], "inventory.transfers.access": ["INVENTORY_MANAGE"], "inventory.transfers.manage": ["INVENTORY_MANAGE"], "inventory.adjustments.access": ["INVENTORY_MANAGE"], "inventory.adjustments.manage": ["INVENTORY_MANAGE"], "inventory.warehouses.access": ["INVENTORY_MANAGE"], "inventory.warehouses.manage": ["INVENTORY_MANAGE"],
  "purchases.access": ["PURCHASES_VIEW", "PURCHASES_MANAGE"], "purchases.orders.access": ["PURCHASES_VIEW", "PURCHASES_MANAGE"], "purchases.orders.manage": ["PURCHASES_MANAGE"], "purchases.suppliers.access": ["PURCHASES_VIEW", "PURCHASES_MANAGE"], "purchases.suppliers.manage": ["PURCHASES_MANAGE"],
  "sales.access": ["SALES_VIEW_OWN", "SALES_VIEW_ALL", "SALES_MANAGE"], "sales.new_sale.access": ["SALES_MANAGE"], "sales.new_sale.create": ["SALES_MANAGE"], "sales.history.access": ["SALES_VIEW_OWN", "SALES_VIEW_ALL"], "sales.history.view_own": ["SALES_VIEW_OWN"], "sales.history.view_all": ["SALES_VIEW_ALL"],
  "customers.access": ["CUSTOMERS_VIEW", "CUSTOMERS_MANAGE"], "customers.manage": ["CUSTOMERS_MANAGE"], "cash.access": ["CASH_VIEW", "CASH_MANAGE"], "cash.sessions.manage": ["CASH_MANAGE"], "cash.movements.manage": ["CASH_MANAGE"], "reports.access": ["REPORTS_VIEW"], "reports.export": ["REPORTS_VIEW"], "users.access": ["USERS_MANAGE"], "users.manage": ["USERS_MANAGE"], "users.permissions.manage": ["USERS_MANAGE"],
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  "dashboard.access": "Ver dashboard",
  "products.access": "Acceder a productos", "products.catalog.access": "Ver catálogo", "products.catalog.manage": "Gestionar productos", "products.categories.access": "Ver categorías", "products.categories.manage": "Gestionar categorías", "products.units.access": "Ver unidades de medida", "products.units.manage": "Gestionar unidades de medida", "products.barcodes.access": "Ver códigos de barras", "products.barcodes.manage": "Gestionar códigos de barras",
  "inventory.access": "Acceder a inventario", "inventory.stock.access": "Ver stock", "inventory.movements.access": "Ver movimientos", "inventory.transfers.access": "Ver transferencias", "inventory.transfers.manage": "Gestionar transferencias", "inventory.adjustments.access": "Ver ajustes", "inventory.adjustments.manage": "Gestionar ajustes", "inventory.warehouses.access": "Ver almacenes", "inventory.warehouses.manage": "Gestionar almacenes",
  "purchases.access": "Acceder a compras", "purchases.orders.access": "Ver compras", "purchases.orders.manage": "Gestionar compras", "purchases.suppliers.access": "Ver proveedores", "purchases.suppliers.manage": "Gestionar proveedores",
  "sales.access": "Acceder a ventas", "sales.new_sale.access": "Acceder a nueva venta", "sales.new_sale.create": "Registrar ventas", "sales.history.access": "Ver historial de ventas", "sales.history.view_own": "Ver ventas propias", "sales.history.view_all": "Ver todas las ventas",
  "customers.access": "Acceder a clientes", "customers.manage": "Gestionar clientes", "cash.access": "Acceder a caja", "cash.sessions.manage": "Operar caja", "cash.movements.manage": "Registrar movimientos de caja", "reports.access": "Ver reportes", "reports.export": "Exportar reportes", "users.access": "Acceder a usuarios", "users.manage": "Gestionar usuarios", "users.permissions.manage": "Administrar permisos", "settings.access": "Acceder a configuración",
};

const pathPermissions: Partial<Record<(typeof PATHS.APP)[keyof typeof PATHS.APP], readonly Permission[]>> = {
  [PATHS.APP.DASHBOARD]: ["dashboard.access"],
  [PATHS.APP.PRODUCTS]: ["products.access"],
  [PATHS.APP.BARCODES]: ["products.access", "products.barcodes.access"],
  [PATHS.APP.INVENTORY]: ["inventory.access"],
  [PATHS.APP.PURCHASES]: ["purchases.access"],
  [PATHS.APP.SALES]: ["sales.access", "sales.history.access"],
  [PATHS.APP.NEW_SALE]: ["sales.access", "sales.new_sale.access"],
  [PATHS.APP.CUSTOMERS]: ["customers.access"],
  [PATHS.APP.REPORTS]: ["reports.access"],
  [PATHS.APP.USERS]: ["users.access"],
  [PATHS.APP.CASH]: ["cash.access"],
};

export const hasPermission = (permissions: readonly string[] | undefined, permission: Permission) => Boolean(permissions?.includes(permission) || legacyAliases[permission]?.some((legacyCode) => permissions?.includes(legacyCode)));
export const hasAnyPermission = (permissions: readonly string[] | undefined, required: readonly Permission[]) => required.some((item) => hasPermission(permissions, item));
export const permissionsForPath = (path: keyof typeof pathPermissions) => pathPermissions[path] ?? [];
