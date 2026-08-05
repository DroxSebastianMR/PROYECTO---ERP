export const PATHS = {
  AUTH: { LOGIN: "/login", FORGOT_PASSWORD: "/recuperar-contrasena" },
  APP: {
    DASHBOARD: "/dashboard",
    PRODUCTS: "/productos",
    BARCODES: "/codigos-de-barras",
    INVENTORY: "/inventario",
    PURCHASES: "/compras",
    SALES: "/ventas",
    NEW_SALE: "/ventas/nueva",
    CUSTOMERS: "/clientes",
    USERS: "/usuarios",
    CASH: "/caja",
    REPORTS: "/reportes",
    PROFILE: "/perfil",
  },
} as const;
