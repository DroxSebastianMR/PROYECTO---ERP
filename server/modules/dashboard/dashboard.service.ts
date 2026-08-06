import { SalePaymentMethod, SaleStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const startOfDay = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const startOfMonth = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), 1);
const dateLabel = (date: Date) => new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short" }).format(date);
const saleStatus = (status: SaleStatus) => status === SaleStatus.CANCELLED ? "Anulado" : status === SaleStatus.PENDING_PAYMENT || status === SaleStatus.PARTIALLY_PAID ? "Pendiente" : "Pagado";
const paymentLabels: Record<SalePaymentMethod, string> = { CASH: "Efectivo", BANK_TRANSFER: "Transferencia", CARD: "Tarjeta", YAPE_PLIN: "Yape / Plin", CREDIT: "Crédito" };

export const dashboardService = {
  async getOverview(companyId: string, year: number) {
    const now = new Date();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);
    const today = startOfDay(now);
    const month = startOfMonth(now);
    const paidStatuses = [SaleStatus.PAID, SaleStatus.CONFIRMED, SaleStatus.DISPATCHED];

    const [products, customers, stocks, todaySales, monthPurchases, monthIncome, yearlySales, payments, recentSales, recentPurchases, recentCustomers, recentMovements] = await Promise.all([
      prisma.product.count({ where: { companyId, isActive: true } }),
      prisma.customer.count({ where: { companyId, isActive: true } }),
      prisma.inventoryStock.findMany({ where: { warehouse: { companyId }, product: { isActive: true } }, include: { product: true, warehouse: true } }),
      prisma.sale.aggregate({ where: { companyId, createdAt: { gte: today }, status: { in: paidStatuses } }, _sum: { total: true } }),
      prisma.purchase.aggregate({ where: { companyId, createdAt: { gte: month }, status: { not: "CANCELLED" } }, _sum: { total: true } }),
      prisma.sale.aggregate({ where: { companyId, createdAt: { gte: month }, status: { in: paidStatuses } }, _sum: { total: true } }),
      prisma.sale.findMany({ where: { companyId, createdAt: { gte: yearStart, lt: yearEnd }, status: { in: paidStatuses } }, select: { createdAt: true, total: true } }),
      prisma.salePayment.groupBy({ by: ["method"], where: { sale: { companyId }, paidAt: { gte: month } }, _sum: { amount: true }, _count: { _all: true } }),
      prisma.sale.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 10, include: { customer: { select: { name: true } } } }),
      prisma.purchase.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 4, select: { id: true, number: true, supplierName: true, createdAt: true } }),
      prisma.customer.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 4, select: { id: true, name: true, createdAt: true } }),
      prisma.inventoryMovement.findMany({ where: { warehouse: { companyId } }, orderBy: { createdAt: "desc" }, take: 4, include: { product: { select: { name: true } } } }),
    ]);

    const monthlyTotals = Array.from({ length: 12 }, () => 0);
    yearlySales.forEach((sale) => { monthlyTotals[sale.createdAt.getMonth()] += Number(sale.total); });
    const paymentTotal = payments.reduce((sum, payment) => sum + Number(payment._sum.amount ?? 0), 0);
    const colors = ["#2563eb", "#1d4ed8", "#7c3aed", "#0f766e", "#94a3b8"];
    const activities = [
      ...recentCustomers.map((customer) => ({ id: `customer-${customer.id}`, kind: "client", title: `Nuevo cliente: ${customer.name}`, detail: "registrado en el sistema.", timestamp: dateLabel(customer.createdAt), date: customer.createdAt })),
      ...recentPurchases.map((purchase) => ({ id: `purchase-${purchase.id}`, kind: "purchase", title: `Compra registrada: ${purchase.number}`, detail: purchase.supplierName, timestamp: dateLabel(purchase.createdAt), date: purchase.createdAt })),
      ...recentMovements.map((movement) => ({ id: `inventory-${movement.id}`, kind: "alert", title: `Movimiento de inventario: ${movement.product.name}`, detail: movement.reason ?? movement.reference ?? "Actualización de existencias.", timestamp: dateLabel(movement.createdAt), date: movement.createdAt })),
    ].sort((first, second) => second.date.getTime() - first.date.getTime()).slice(0, 10).map(({ date: _date, ...activity }) => activity);

    return {
      metrics: {
        todaySales: Number(todaySales._sum.total ?? 0),
        monthPurchases: Number(monthPurchases._sum.total ?? 0),
        products,
        customers,
        monthIncome: Number(monthIncome._sum.total ?? 0),
        lowStock: stocks.filter((stock) => stock.quantity.lessThanOrEqualTo(stock.minimum)).length,
      },
      sales: months.map((name, index) => ({ month: name, amount: monthlyTotals[index] })),
      paymentMethods: payments.map((payment, index) => ({ name: paymentLabels[payment.method], percentage: paymentTotal ? Math.round((Number(payment._sum.amount ?? 0) / paymentTotal) * 100) : 0, color: colors[index] ?? "#94a3b8", transactions: payment._count._all })),
      recentSales: recentSales.map((sale) => ({ id: sale.number, customer: sale.customer?.name ?? "Cliente contado", date: dateLabel(sale.createdAt), amount: Number(sale.total), status: saleStatus(sale.status) })),
      activities,
      stockAlerts: stocks.filter((stock) => stock.quantity.lessThanOrEqualTo(stock.minimum)).sort((first, second) => Number(first.quantity) - Number(second.quantity)).slice(0, 10).map((stock) => ({ id: stock.id, product: stock.product.name, sku: stock.product.sku, warehouse: stock.warehouse.name, quantity: Number(stock.quantity), minimum: Number(stock.minimum), unit: stock.product.unit })),
    };
  },
};
