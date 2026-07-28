import "dotenv/config";
import { MovementType, PrismaClient, SaleDocumentType, SalePaymentMethod, SaleStatus } from "@prisma/client";

const prisma = new PrismaClient();
const run = async () => {
  const company = process.env.SEED_COMPANY_TAX_ID ? await prisma.company.findUnique({ where: { taxId: process.env.SEED_COMPANY_TAX_ID } }) : await prisma.company.findFirst();
  if (!company) throw new Error("No existe empresa. Ejecuta primero el seed principal.");
  const [warehouse, user] = await Promise.all([prisma.warehouse.findFirst({ where: { companyId: company.id, isActive: true }, orderBy: { isPrimary: "desc" } }), prisma.user.findFirst({ where: { companyId: company.id, isActive: true } })]);
  if (!warehouse || !user) throw new Error("Ejecuta db:seed:inventory antes del seed de ventas.");
  const customer = await prisma.customer.upsert({ where: { companyId_document: { companyId: company.id, document: "20609988771" } }, update: { name: "Bodega San Martín S.A.C.", creditLimit: 2500, creditDays: 30, isActive: true }, create: { companyId: company.id, name: "Bodega San Martín S.A.C.", document: "20609988771", phone: "999888777", creditLimit: 2500, creditDays: 30 } });
  const [coca, leche] = await Promise.all([prisma.product.findUnique({ where: { companyId_sku: { companyId: company.id, sku: "BEB-COCA-625" } } }), prisma.product.findUnique({ where: { companyId_sku: { companyId: company.id, sku: "LAC-LECHE-400" } } })]);
  if (!coca || !leche) throw new Error("Faltan productos. Ejecuta db:seed:products.");
  const number = "V-SEED-000001";
  if (!await prisma.sale.findUnique({ where: { companyId_number: { companyId: company.id, number } } })) {
    const sale = await prisma.sale.create({ data: { companyId: company.id, customerId: customer.id, createdById: user.id, warehouseId: warehouse.id, number, status: SaleStatus.PAID, paymentMethod: SalePaymentMethod.CASH, documentType: SaleDocumentType.RECEIPT, subtotal: 37.63, taxAmount: 6.77, total: 44.4, items: { create: [{ productId: coca.id, quantity: 6, unitPrice: 3.5, subtotal: 21 }, { productId: leche.id, quantity: 4, unitPrice: 4.8, subtotal: 19.2 }] }, document: { create: { type: SaleDocumentType.RECEIPT, series: "B001", number } }, payments: { create: { amount: 44.4, method: SalePaymentMethod.CASH } } }, include: { items: true } });
    for (const item of sale.items) {
      const stock = await prisma.inventoryStock.findUnique({ where: { productId_warehouseId: { productId: item.productId, warehouseId: warehouse.id } } });
      if (!stock || Number(stock.quantity) < Number(item.quantity)) continue;
      const resulting = Number(stock.quantity) - Number(item.quantity);
      await prisma.$transaction([prisma.inventoryStock.update({ where: { id: stock.id }, data: { quantity: resulting } }), prisma.inventoryMovement.create({ data: { productId: item.productId, warehouseId: warehouse.id, type: MovementType.SALE_DISPATCH, quantity: item.quantity, quantityOut: item.quantity, previousStock: stock.quantity, resultingStock: resulting, documentRef: sale.number, reason: "Venta de demostración", createdById: user.id } })]);
    }
  }
  console.log(`Sales seed completed for ${company.name}: customer and sample sale available.`);
};
run().catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
