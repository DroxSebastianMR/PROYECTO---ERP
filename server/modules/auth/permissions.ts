import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./auth.middleware.js";

export const PERMISSION_CATALOG = [
  ["dashboard.access", "Dashboard", "Consultar el panel principal"],
  ["products.access", "Productos", "Acceder al módulo de productos"],
  ["products.catalog.access", "Productos", "Consultar el catálogo"],
  ["products.catalog.manage", "Productos", "Crear y editar productos"],
  ["products.categories.access", "Productos", "Consultar categorías"],
  ["products.categories.manage", "Productos", "Gestionar categorías"],
  ["products.units.access", "Productos", "Consultar unidades de medida"],
  ["products.units.manage", "Productos", "Gestionar unidades de medida"],
  ["products.barcodes.access", "Productos", "Consultar códigos de barras"],
  ["products.barcodes.manage", "Productos", "Generar e imprimir códigos de barras"],
  ["inventory.access", "Inventario", "Acceder al módulo de inventario"],
  ["inventory.stock.access", "Inventario", "Consultar stock actual"],
  ["inventory.movements.access", "Inventario", "Consultar movimientos"],
  ["inventory.transfers.access", "Inventario", "Consultar transferencias"],
  ["inventory.transfers.manage", "Inventario", "Registrar transferencias"],
  ["inventory.adjustments.access", "Inventario", "Consultar ajustes"],
  ["inventory.adjustments.manage", "Inventario", "Registrar ajustes"],
  ["inventory.warehouses.access", "Inventario", "Consultar almacenes"],
  ["inventory.warehouses.manage", "Inventario", "Gestionar almacenes"],
  ["purchases.access", "Compras", "Acceder al módulo de compras"],
  ["purchases.orders.access", "Compras", "Consultar compras"],
  ["purchases.orders.manage", "Compras", "Registrar y editar compras"],
  ["purchases.suppliers.access", "Compras", "Consultar proveedores"],
  ["purchases.suppliers.manage", "Compras", "Gestionar proveedores"],
  ["sales.access", "Ventas", "Acceder al módulo de ventas"],
  ["sales.new_sale.access", "Ventas", "Acceder a nueva venta"],
  ["sales.new_sale.create", "Ventas", "Registrar ventas"],
  ["sales.history.access", "Ventas", "Consultar historial de ventas"],
  ["sales.history.view_own", "Ventas", "Consultar ventas propias"],
  ["sales.history.view_all", "Ventas", "Consultar ventas de todos los usuarios"],
  ["customers.access", "Clientes", "Acceder al módulo de clientes"],
  ["customers.manage", "Clientes", "Crear y editar clientes"],
  ["cash.access", "Caja", "Acceder al módulo de caja"],
  ["cash.sessions.manage", "Caja", "Aperturar y cerrar caja"],
  ["cash.movements.manage", "Caja", "Registrar movimientos de caja"],
  ["reports.access", "Reportes", "Consultar reportes"],
  ["reports.export", "Reportes", "Exportar reportes"],
  ["users.access", "Usuarios", "Acceder a usuarios y permisos"],
  ["users.manage", "Usuarios", "Crear y editar usuarios"],
  ["users.permissions.manage", "Usuarios", "Administrar permisos"],
  ["settings.access", "Configuración", "Acceder a configuración"],
] as const;

export type Permission = (typeof PERMISSION_CATALOG)[number][0];
export const PERMISSIONS = PERMISSION_CATALOG.map(([code]) => code) as Permission[];

const legacyAliases: Partial<Record<Permission, readonly string[]>> = {
  "dashboard.access": ["DASHBOARD_VIEW"],
  "products.access": ["PRODUCTS_VIEW", "PRODUCTS_MANAGE"],
  "products.catalog.access": ["PRODUCTS_VIEW", "PRODUCTS_MANAGE"],
  "products.catalog.manage": ["PRODUCTS_MANAGE"],
  "products.categories.access": ["PRODUCTS_VIEW", "PRODUCTS_MANAGE"],
  "products.categories.manage": ["PRODUCTS_MANAGE"],
  "products.units.access": ["PRODUCTS_VIEW", "PRODUCTS_MANAGE"],
  "products.units.manage": ["PRODUCTS_MANAGE"],
  "products.barcodes.access": ["PRODUCTS_VIEW", "PRODUCTS_MANAGE"],
  "products.barcodes.manage": ["PRODUCTS_MANAGE"],
  "inventory.access": ["INVENTORY_VIEW", "INVENTORY_MANAGE"],
  "inventory.stock.access": ["INVENTORY_VIEW", "INVENTORY_MANAGE"],
  "inventory.movements.access": ["INVENTORY_VIEW", "INVENTORY_MANAGE"],
  "inventory.transfers.access": ["INVENTORY_MANAGE"],
  "inventory.transfers.manage": ["INVENTORY_MANAGE"],
  "inventory.adjustments.access": ["INVENTORY_MANAGE"],
  "inventory.adjustments.manage": ["INVENTORY_MANAGE"],
  "inventory.warehouses.access": ["INVENTORY_MANAGE"],
  "inventory.warehouses.manage": ["INVENTORY_MANAGE"],
  "purchases.access": ["PURCHASES_VIEW", "PURCHASES_MANAGE"],
  "purchases.orders.access": ["PURCHASES_VIEW", "PURCHASES_MANAGE"],
  "purchases.orders.manage": ["PURCHASES_MANAGE"],
  "purchases.suppliers.access": ["PURCHASES_VIEW", "PURCHASES_MANAGE"],
  "purchases.suppliers.manage": ["PURCHASES_MANAGE"],
  "sales.access": ["SALES_VIEW_OWN", "SALES_VIEW_ALL", "SALES_MANAGE"],
  "sales.new_sale.access": ["SALES_MANAGE"],
  "sales.new_sale.create": ["SALES_MANAGE"],
  "sales.history.access": ["SALES_VIEW_OWN", "SALES_VIEW_ALL"],
  "sales.history.view_own": ["SALES_VIEW_OWN"],
  "sales.history.view_all": ["SALES_VIEW_ALL"],
  "customers.access": ["CUSTOMERS_VIEW", "CUSTOMERS_MANAGE"],
  "customers.manage": ["CUSTOMERS_MANAGE"],
  "cash.access": ["CASH_VIEW", "CASH_MANAGE"],
  "cash.sessions.manage": ["CASH_MANAGE"],
  "cash.movements.manage": ["CASH_MANAGE"],
  "reports.access": ["REPORTS_VIEW"],
  "reports.export": ["REPORTS_VIEW"],
  "users.access": ["USERS_MANAGE"],
  "users.manage": ["USERS_MANAGE"],
  "users.permissions.manage": ["USERS_MANAGE"],
};

export const hasPermission = (permissions: readonly string[] | undefined, required: Permission) =>
  Boolean(permissions?.includes(required) || legacyAliases[required]?.some((legacyCode) => permissions?.includes(legacyCode)));

export const requirePermission = (required: Permission | readonly Permission[]) =>
  (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    const candidates = Array.isArray(required) ? required : [required];
    if (!candidates.some((permission) => hasPermission(request.auth?.permissions, permission))) {
      return response.status(403).json({ message: "No tienes permiso para realizar esta acción." });
    }
    next();
  };
