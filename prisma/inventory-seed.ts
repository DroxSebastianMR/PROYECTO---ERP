import "dotenv/config";
import { MovementType, PrismaClient, WarehouseType } from "@prisma/client";

const prisma = new PrismaClient();
const stocks = [
  ["BEB-COCA-625", "ALM-PRINCIPAL", 120], ["BEB-INKA-500", "ALM-PRINCIPAL", 96],
  ["ABR-ARROZ-5K", "ALM-PRINCIPAL", 40], ["ABR-ACEITE-1L", "ALM-PRINCIPAL", 72],
  ["LIM-DET-900", "ALM-PRINCIPAL", 30], ["LIM-LEJIA-1L", "ALM-PRINCIPAL", 48],
  ["SNK-GAL-6U", "ALM-TIENDA", 60], ["LAC-LECHE-400", "ALM-TIENDA", 72],
] as const;

const run = async () => {
  const company = process.env.SEED_COMPANY_TAX_ID
    ? await prisma.company.findUnique({ where: { taxId: process.env.SEED_COMPANY_TAX_ID } })
    : await prisma.company.findFirst();
  if (!company) throw new Error("No existe una empresa. Ejecuta primero db:seed y db:seed:products.");

  const [main, store] = await prisma.$transaction([
    prisma.warehouse.upsert({ where: { companyId_name: { companyId: company.id, name: "Almacén Principal" } }, update: { code: "ALM-PRINCIPAL", type: WarehouseType.MAIN, isPrimary: true }, create: { companyId: company.id, name: "Almacén Principal", code: "ALM-PRINCIPAL", type: WarehouseType.MAIN, isPrimary: true, address: "Sede central" } }),
    prisma.warehouse.upsert({ where: { companyId_name: { companyId: company.id, name: "Tienda Principal" } }, update: { code: "ALM-TIENDA", type: WarehouseType.STORE }, create: { companyId: company.id, name: "Tienda Principal", code: "ALM-TIENDA", type: WarehouseType.STORE, address: "Área de exhibición" } }),
  ]);
  const warehouses = new Map([["ALM-PRINCIPAL", main], ["ALM-TIENDA", store]]);
  const user = await prisma.user.findFirst({ where: { companyId: company.id, isActive: true }, orderBy: { createdAt: "asc" } });
  if (!user) throw new Error("No existe un usuario activo para registrar el inventario inicial.");

  let created = 0;
  for (const [sku, warehouseCode, quantity] of stocks) {
    const product = await prisma.product.findUnique({ where: { companyId_sku: { companyId: company.id, sku } } });
    const warehouse = warehouses.get(warehouseCode)!;
    if (!product) throw new Error(`Producto no encontrado: ${sku}`);
    const existing = await prisma.inventoryStock.findUnique({ where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } } });
    if (existing) continue;
    await prisma.$transaction(async (tx) => {
      await tx.inventoryStock.create({ data: { productId: product.id, warehouseId: warehouse.id, quantity, reserved: 0, minimum: Math.max(5, quantity * 0.15), maximum: quantity * 2 } });
      await tx.inventoryMovement.create({ data: { productId: product.id, warehouseId: warehouse.id, type: MovementType.INITIAL, quantity, quantityIn: quantity, quantityOut: 0, previousStock: 0, resultingStock: quantity, documentRef: "INV-INICIAL-2026", reason: "Carga inicial de inventario de demostración", reference: "Inventario inicial", createdById: user.id } });
    });
    created += 1;
  }

  const milk = await prisma.product.findUnique({ where: { companyId_sku: { companyId: company.id, sku: "LAC-LECHE-400" } } });
  if (milk) await prisma.inventoryBatch.upsert({ where: { productId_warehouseId_lotNumber: { productId: milk.id, warehouseId: store.id, lotNumber: "GL-2026-08" } }, update: {}, create: { productId: milk.id, warehouseId: store.id, lotNumber: "GL-2026-08", manufacturedAt: new Date("2026-06-01"), expiresAt: new Date("2027-06-01"), quantity: 72 } });
  console.log(`Inventory seed completed: ${created} initial stock records created for ${company.name}.`);
};

run().catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
