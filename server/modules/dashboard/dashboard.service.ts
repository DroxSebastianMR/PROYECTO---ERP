import { prisma } from "../../lib/prisma.js";

/** Read model for the dashboard. Add authenticated companyId filtering when auth is enabled. */
export const dashboardService = {
  async getSummary() {
    const [products, customers, inventory] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.customer.count(),
      prisma.inventoryStock.findMany({ select: { quantity: true, minimum: true } }),
    ]);

    const lowStock = inventory.filter((stock) =>
      stock.quantity.lessThanOrEqualTo(stock.minimum),
    ).length;
    return { products, customers, lowStock };
  },
};
