import type { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/app/router/guards/protected-route";
import { PATHS } from "@/app/router/constants/paths";
import { AppLayout } from "@/layouts/app/app-layout";
import { DashboardPage } from "@/features/dashboard/pages";
import { ProductsPage } from "@/features/products/pages";
import { InventoryPage } from "@/features/inventory/pages";
import { PurchasesPage } from "@/features/purchases/pages";
import { NewSalePage, SalesPage } from "@/features/sales/pages";
import { CustomersPage } from "@/features/customers/pages";
import { UsersPage } from "@/features/users/pages";
import { BarcodesPage } from "@/features/barcodes/pages";

export const protectedRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: PATHS.APP.DASHBOARD, element: <DashboardPage /> },
          { path: PATHS.APP.PRODUCTS, element: <ProductsPage /> },
          { path: PATHS.APP.BARCODES, element: <BarcodesPage /> },
          { path: PATHS.APP.INVENTORY, element: <InventoryPage /> },
          { path: PATHS.APP.PURCHASES, element: <PurchasesPage /> },
          { path: PATHS.APP.SALES, element: <SalesPage /> },
          { path: PATHS.APP.NEW_SALE, element: <NewSalePage /> },
          { path: PATHS.APP.CUSTOMERS, element: <CustomersPage /> },
          { path: PATHS.APP.USERS, element: <UsersPage /> },
        ],
      },
    ],
  },
];
