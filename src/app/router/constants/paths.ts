export const PATHS = {
  AUTH: { LOGIN: "/login", FORGOT_PASSWORD: "/recuperar-contrasena" },
  APP: {
    DASHBOARD: "/dashboard",
    PRODUCTS: "/productos",
    INVENTORY: "/inventario",
    PURCHASES: "/compras",
    SALES: "/ventas",
    NEW_SALE: "/ventas/nueva",
    CUSTOMERS: "/clientes",
    USERS: "/usuarios",
  },
} as const;
