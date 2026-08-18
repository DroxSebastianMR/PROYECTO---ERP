import { SaleStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const startOfDay = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());
const startOfMonth = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), 1);
const dateLabel = (date: Date) =>
  new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short" }).format(date);
const saleStatus = (status: SaleStatus) =>
  status === SaleStatus.CANCELLED
    ? "Anulado"
    : status === SaleStatus.PENDING_PAYMENT || status === SaleStatus.PARTIALLY_PAID
      ? "Pendiente"
      : "Pagado";
const paidStatuses = [SaleStatus.PAID, SaleStatus.CONFIRMED, SaleStatus.DISPATCHED];

export const dashboardService = {
  async getOverview(companyId: string, year: number) {
    const now = new Date();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);
    const today = startOfDay(now);
    const month = startOfMonth(now);
    const [
      products,
      customers,
      stocks,
      todaySales,
      monthPurchases,
      monthIncome,
      yearlySales,
      recentSales,
      recentPurchases,
      recentCustomers,
      recentMovements,
    ] = await Promise.all([
      prisma.product.count({ where: { companyId, isActive: true } }),
      prisma.customer.count({ where: { companyId, isActive: true } }),
      prisma.inventoryStock.findMany({
        where: { warehouse: { companyId }, product: { isActive: true } },
        select: {
          id: true,
          quantity: true,
          minimum: true,
          product: { select: { name: true, sku: true, unit: true, purchasePrice: true } },
          warehouse: { select: { name: true } },
        },
      }),
      prisma.sale.aggregate({
        where: { companyId, createdAt: { gte: today }, status: { in: paidStatuses } },
        _sum: { total: true },
      }),
      prisma.purchase.aggregate({
        where: { companyId, createdAt: { gte: month }, status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
      prisma.sale.aggregate({
        where: { companyId, createdAt: { gte: month }, status: { in: paidStatuses } },
        _sum: { total: true },
      }),
      prisma.sale.findMany({
        where: {
          companyId,
          createdAt: { gte: yearStart, lt: yearEnd },
          status: { in: paidStatuses },
        },
        select: { createdAt: true, total: true },
      }),
      prisma.sale.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          number: true,
          total: true,
          status: true,
          createdAt: true,
          customer: { select: { name: true } },
        },
      }),
      prisma.purchase.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { id: true, number: true, supplierName: true, createdAt: true },
      }),
      prisma.customer.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { id: true, name: true, createdAt: true },
      }),
      prisma.inventoryMovement.findMany({
        where: { warehouse: { companyId } },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: { product: { select: { name: true } } },
      }),
    ]);

    const monthlySales = Array.from({ length: 12 }, () => ({ amount: 0, salesCount: 0 }));
    yearlySales.forEach((sale) => {
      const item = monthlySales[sale.createdAt.getMonth()];
      item.amount += Number(sale.total);
      item.salesCount += 1;
    });
    const activities = [
      ...recentCustomers.map((customer) => ({
        id: `customer-${customer.id}`,
        kind: "client",
        title: `Nuevo cliente: ${customer.name}`,
        detail: "registrado en el sistema.",
        timestamp: dateLabel(customer.createdAt),
        date: customer.createdAt,
      })),
      ...recentPurchases.map((purchase) => ({
        id: `purchase-${purchase.id}`,
        kind: "purchase",
        title: `Compra registrada: ${purchase.number}`,
        detail: purchase.supplierName,
        timestamp: dateLabel(purchase.createdAt),
        date: purchase.createdAt,
      })),
      ...recentMovements.map((movement) => ({
        id: `inventory-${movement.id}`,
        kind: "alert",
        title: `Movimiento de inventario: ${movement.product.name}`,
        detail: movement.reason ?? movement.reference ?? "Actualización de existencias.",
        timestamp: dateLabel(movement.createdAt),
        date: movement.createdAt,
      })),
    ]
      .sort((first, second) => second.date.getTime() - first.date.getTime())
      .slice(0, 10)
      .map(({ date: _date, ...activity }) => activity);
    return {
      metrics: {
        todaySales: Number(todaySales._sum.total ?? 0),
        monthPurchases: Number(monthPurchases._sum.total ?? 0),
        products,
        customers,
        monthIncome: Number(monthIncome._sum.total ?? 0),
        lowStock: stocks.filter((stock) => stock.quantity.lessThanOrEqualTo(stock.minimum)).length,
        stockValue: stocks.reduce(
          (total, stock) =>
            total + Number(stock.quantity) * Number(stock.product.purchasePrice ?? 0),
          0,
        ),
      },
      sales: months.map((name, index) => ({ month: name, ...monthlySales[index] })),
      recentSales: recentSales.map((sale) => ({
        id: sale.number,
        customer: sale.customer?.name ?? "Cliente contado",
        date: dateLabel(sale.createdAt),
        amount: Number(sale.total),
        status: saleStatus(sale.status),
      })),
      activities,
      stockAlerts: stocks
        .filter((stock) => stock.quantity.lessThanOrEqualTo(stock.minimum))
        .sort((first, second) => Number(first.quantity) - Number(second.quantity))
        .slice(0, 10)
        .map((stock) => ({
          id: stock.id,
          product: stock.product.name,
          sku: stock.product.sku,
          warehouse: stock.warehouse.name,
          quantity: Number(stock.quantity),
          minimum: Number(stock.minimum),
          unit: stock.product.unit,
        })),
    };
  },

  async getTopSellingProducts(companyId: string, year: number, monthNumber: number) {
    const start = new Date(year, monthNumber - 1, 1);
    const end = new Date(year, monthNumber, 1);
    const groups = await prisma.saleItem.groupBy({
      by: ["productId"],
      where: {
        sale: { companyId, createdAt: { gte: start, lt: end }, status: { in: paidStatuses } },
      },
      _sum: { quantity: true },
      _count: { _all: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });
    if (!groups.length) return [];
    const products = await prisma.product.findMany({
      where: { id: { in: groups.map((item) => item.productId) }, companyId },
      select: { id: true, name: true, sku: true, imageUrl: true, unit: true },
    });
    const productsById = new Map(products.map((product) => [product.id, product]));
    return groups.flatMap((item) => {
      const product = productsById.get(item.productId);
      return product
        ? [{ ...product, quantity: Number(item._sum.quantity ?? 0), lines: item._count._all }]
        : [];
    });
  },
};
