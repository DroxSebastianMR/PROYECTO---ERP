import "dotenv/config";
import { MovementType, PaymentMethod, PrismaClient, PurchaseStatus } from "@prisma/client";

const prisma = new PrismaClient();

const findProduct = (companyId: string, sku: string) =>
  prisma.product.findUnique({ where: { companyId_sku: { companyId, sku } } });

const run = async () => {
  const company = process.env.SEED_COMPANY_TAX_ID
    ? await prisma.company.findUnique({ where: { taxId: process.env.SEED_COMPANY_TAX_ID } })
    : await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });
  if (!company) throw new Error("No existe una empresa. Ejecuta primero db:seed.");

  const warehouse = await prisma.warehouse.findFirst({
    where: { companyId: company.id, isActive: true },
    orderBy: { isPrimary: "desc" },
  });
  const user = await prisma.user.findFirst({ where: { companyId: company.id, isActive: true } });
  if (!warehouse || !user) throw new Error("Ejecuta primero db:seed:inventory para crear almacén y usuario.");

  const [beverages, groceries] = await Promise.all([
    prisma.supplier.upsert({
      where: { companyId_ruc: { companyId: company.id, ruc: "20100000001" } },
      update: { isActive: true, businessName: "Bebidas del Perú S.A.C." },
      create: { companyId: company.id, ruc: "20100000001", businessName: "Bebidas del Perú S.A.C.", tradeName: "Bebidas Perú", paymentTermsDays: 30 },
    }),
    prisma.supplier.upsert({
      where: { companyId_ruc: { companyId: company.id, ruc: "20400000002" } },
      update: { isActive: true, businessName: "Distribuidora de Abarrotes S.A.C." },
      create: { companyId: company.id, ruc: "20400000002", businessName: "Distribuidora de Abarrotes S.A.C.", tradeName: "Abarrotes Mayorista", paymentTermsDays: 15 },
    }),
  ]);

  const [cocaCola, incaKola, arroz, aceite] = await Promise.all([
    findProduct(company.id, "BEB-COCA-625"),
    findProduct(company.id, "BEB-INKA-500"),
    findProduct(company.id, "ABR-ARROZ-5K"),
    findProduct(company.id, "ABR-ACEITE-1L"),
  ]);
  if (!cocaCola || !incaKola || !arroz || !aceite) throw new Error("Faltan productos de ejemplo. Ejecuta primero db:seed:products.");

  const receivedNumber = "OC-SEED-000001";
  const receivedExists = await prisma.purchase.findUnique({ where: { companyId_number: { companyId: company.id, number: receivedNumber } } });
  if (!receivedExists) {
    const purchase = await prisma.purchase.create({
      data: {
        companyId: company.id,
        number: receivedNumber,
        supplierId: beverages.id,
        supplierName: beverages.businessName,
        warehouseId: warehouse.id,
        paymentMethod: PaymentMethod.CREDIT,
        status: PurchaseStatus.PENDING_PAYMENT,
        subtotal: 430.8,
        taxAmount: 77.54,
        total: 508.34,
        items: { create: [
          { productId: cocaCola.id, quantity: 120, receivedQuantity: 120, unitCost: 2.4, subtotal: 288, taxRate: 18 },
          { productId: incaKola.id, quantity: 68, receivedQuantity: 68, unitCost: 2.1, subtotal: 142.8, taxRate: 18 },
        ] },
      },
      include: { items: true },
    });
    const receipt = await prisma.purchaseReceipt.create({
      data: {
        purchaseId: purchase.id,
        warehouseId: warehouse.id,
        receivedById: user.id,
        notes: "Recepción de demostración registrada por el seed.",
        lines: { create: purchase.items.map((item) => ({ purchaseItemId: item.id, receivedQuantity: item.receivedQuantity })) },
      },
    });
    for (const item of purchase.items) {
      const stock = await prisma.inventoryStock.upsert({
        where: { productId_warehouseId: { productId: item.productId, warehouseId: warehouse.id } },
        update: { quantity: { increment: item.receivedQuantity } },
        create: { productId: item.productId, warehouseId: warehouse.id, quantity: item.receivedQuantity, minimum: 10 },
      });
      await prisma.inventoryMovement.create({
        data: {
          productId: item.productId,
          warehouseId: warehouse.id,
          type: MovementType.PURCHASE_RECEIPT,
          quantity: item.receivedQuantity,
          quantityIn: item.receivedQuantity,
          previousStock: Number(stock.quantity) - Number(item.receivedQuantity),
          resultingStock: stock.quantity,
          documentRef: purchase.number,
          reference: receipt.id,
          reason: "Recepción de compra de demostración",
          createdById: user.id,
        },
      });
    }
    await prisma.accountsPayable.create({ data: { purchaseId: purchase.id, originalAmount: purchase.total, paidAmount: 0, status: "PENDING" } });
  }

  const pendingNumber = "OC-SEED-000002";
  const pendingExists = await prisma.purchase.findUnique({ where: { companyId_number: { companyId: company.id, number: pendingNumber } } });
  if (!pendingExists) {
    await prisma.purchase.create({
      data: {
        companyId: company.id,
        number: pendingNumber,
        supplierId: groceries.id,
        supplierName: groceries.businessName,
        warehouseId: warehouse.id,
        paymentMethod: PaymentMethod.CREDIT,
        status: PurchaseStatus.ORDERED,
        expectedDeliveryAt: new Date("2026-08-05"),
        subtotal: 551.4,
        taxAmount: 99.25,
        total: 650.65,
        items: { create: [
          { productId: arroz.id, quantity: 20, unitCost: 18.5, subtotal: 370, taxRate: 18 },
          { productId: aceite.id, quantity: 25, unitCost: 7.2, subtotal: 180, taxRate: 18 },
        ] },
      },
    });
  }
  console.log(`Purchases seed completed for ${company.name}: 2 suppliers and 2 purchase orders available.`);
};

run().catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
