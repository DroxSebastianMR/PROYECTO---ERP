import "dotenv/config";
import { MovementType, PrismaClient, TaxTreatment, WarehouseType } from "@prisma/client";

const prisma = new PrismaClient();
type Item = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  number,
  number,
  number,
  number,
  number,
  number,
];
const items: Item[] = [
  [
    "GAS001",
    "Coca-Cola 500 ml",
    "Bebida gaseosa sabor cola en botella descartable de 500 ml",
    "Coca-Cola",
    "Gaseosas",
    "Botella",
    "500 ml",
    2.2,
    3.5,
    3.2,
    12,
    120,
    20,
  ],
  [
    "GAS002",
    "Inca Kola 500 ml",
    "Bebida gaseosa sabor cola en botella descartable de 500 ml",
    "Inca Kola",
    "Gaseosas",
    "Botella",
    "500 ml",
    2.2,
    3.5,
    3.2,
    12,
    100,
    20,
  ],
  [
    "GAS003",
    "Sprite 500 ml",
    "Bebida gaseosa en botella descartable de 500 ml",
    "Sprite",
    "Gaseosas",
    "Botella",
    "500 ml",
    2.1,
    3.4,
    3.1,
    12,
    80,
    15,
  ],
  [
    "GAS004",
    "Fanta Naranja 500 ml",
    "Bebida gaseosa sabor naranja en botella descartable de 500 ml",
    "Fanta",
    "Gaseosas",
    "Botella",
    "500 ml",
    2.1,
    3.4,
    3.1,
    12,
    90,
    15,
  ],
  [
    "CER001",
    "Pilsen 620 ml",
    "Bebida cerveza en botella de vidrio 620 ml",
    "Pilsen",
    "Cerveza",
    "Botella",
    "620 ml",
    5.8,
    7.5,
    7,
    12,
    60,
    12,
  ],
  [
    "CER002",
    "Cristal 620 ml",
    "Bebida cerveza en botella de vidrio 620 ml",
    "Cristal",
    "Cerveza",
    "Botella",
    "620 ml",
    5.8,
    7.5,
    7,
    12,
    60,
    12,
  ],
  [
    "CER003",
    "Cusqueña Dorada 330 ml",
    "Bebida cerveza en botella de vidrio 330 ml",
    "Cusqueña",
    "Cerveza",
    "Botella",
    "330 ml",
    3.8,
    5.5,
    5,
    24,
    96,
    24,
  ],
  [
    "ENE001",
    "Red Bull 250 ml",
    "Bebida energizante en lata de 250 ml",
    "Red Bull",
    "Energizantes",
    "Lata",
    "250 ml",
    5.5,
    8.5,
    8,
    24,
    72,
    12,
  ],
  [
    "ENE002",
    "Volt 300 ml",
    "Bebida energizante en lata de 300 ml",
    "Volt",
    "Energizantes",
    "Lata",
    "300 ml",
    2.8,
    4.5,
    4.2,
    24,
    100,
    20,
  ],
  [
    "ENE003",
    "Monster 473 ml",
    "Bebida energizante en lata de 473 ml",
    "Monster",
    "Energizantes",
    "Lata",
    "473 ml",
    6.5,
    9.5,
    9,
    12,
    48,
    10,
  ],
  [
    "AGU001",
    "Cielo 625 ml",
    "Bebida agua sin gas en botella descartable de 625 ml",
    "Cielo",
    "Agua",
    "Botella",
    "625 ml",
    1.2,
    2,
    1.8,
    24,
    120,
    24,
  ],
  [
    "AGU002",
    "San Luis 625 ml",
    "Bebida agua sin gas en botella descartable de 625 ml",
    "San Luis",
    "Agua",
    "Botella",
    "625 ml",
    1.2,
    2,
    1.8,
    24,
    120,
    24,
  ],
  [
    "JUG001",
    "Frugos 1 L",
    "Bebida jugo sabor fruta en caja descartable de 1 L",
    "Frugos",
    "Jugos",
    "Caja",
    "1 L",
    3.8,
    5.5,
    5,
    12,
    50,
    10,
  ],
  [
    "JUG002",
    "Pulp 450 ml",
    "Bebida jugo sabor fruta en botella descartable de 450 ml",
    "Pulp",
    "Jugos",
    "Botella",
    "450 ml",
    2.4,
    3.8,
    3.5,
    12,
    70,
    15,
  ],
  [
    "TE001",
    "Fuze Tea Limón 500 ml",
    "Bebida té sabor limón en botella descartable de 500 ml",
    "Fuze Tea",
    "Té",
    "Botella",
    "500 ml",
    2.5,
    4,
    3.7,
    12,
    60,
    12,
  ],
  [
    "ISO001",
    "Sporade 500 ml",
    "Bebida isotónica en botella descartable de 500 ml",
    "Sporade",
    "Isotónicas",
    "Botella",
    "500 ml",
    2.3,
    3.8,
    3.5,
    12,
    80,
    15,
  ],
  [
    "ISO002",
    "Gatorade 500 ml",
    "Bebida isotónica en botella descartable de 500 ml",
    "Gatorade",
    "Isotónicas",
    "Botella",
    "500 ml",
    3.2,
    5,
    4.7,
    12,
    80,
    15,
  ],
  [
    "MAL001",
    "Maltin Power 330 ml",
    "Bebida malta en lata descartable de 330 ml",
    "Maltin",
    "Malta",
    "Lata",
    "330 ml",
    2,
    3.5,
    3.2,
    24,
    90,
    20,
  ],
  [
    "BEB001",
    "Guaraná 500 ml",
    "Bebida refrescante sabor guaraná en botella descartable de 500 ml",
    "Guaraná",
    "Refrescos",
    "Botella",
    "500 ml",
    2.2,
    3.6,
    3.3,
    12,
    70,
    15,
  ],
  [
    "BEB002",
    "Concordia Piña 500 ml",
    "Bebida refrescante sabor piña en botella descartable de 500 ml",
    "Concordia",
    "Refrescos",
    "Botella",
    "500 ml",
    2,
    3.3,
    3,
    12,
    70,
    15,
  ],
];

const run = async () => {
  const company = process.env.SEED_COMPANY_TAX_ID
    ? await prisma.company.findUnique({ where: { taxId: process.env.SEED_COMPANY_TAX_ID } })
    : await prisma.company.findFirst();
  if (!company) throw new Error("No existe empresa. Ejecuta primero db:seed.");
  const user = await prisma.user.findFirst({ where: { companyId: company.id, isActive: true } });
  if (!user) throw new Error("No existe un usuario activo.");
  await prisma.$transaction(
    async (tx) => {
      await tx.supplierPayment.deleteMany({
        where: { payable: { purchase: { companyId: company.id } } },
      });
      await tx.accountsPayable.deleteMany({ where: { purchase: { companyId: company.id } } });
      await tx.purchaseReceiptLine.deleteMany({
        where: { receipt: { purchase: { companyId: company.id } } },
      });
      await tx.purchaseReceipt.deleteMany({ where: { purchase: { companyId: company.id } } });
      await tx.purchaseDocument.deleteMany({ where: { purchase: { companyId: company.id } } });
      await tx.purchaseItem.deleteMany({ where: { purchase: { companyId: company.id } } });
      await tx.purchase.deleteMany({ where: { companyId: company.id } });
      await tx.saleReturnLine.deleteMany({
        where: { saleReturn: { sale: { companyId: company.id } } },
      });
      await tx.saleReturn.deleteMany({ where: { sale: { companyId: company.id } } });
      await tx.saleDispatch.deleteMany({ where: { sale: { companyId: company.id } } });
      await tx.salePayment.deleteMany({ where: { sale: { companyId: company.id } } });
      await tx.saleDocument.deleteMany({ where: { sale: { companyId: company.id } } });
      await tx.saleItem.deleteMany({ where: { sale: { companyId: company.id } } });
      await tx.sale.deleteMany({ where: { companyId: company.id } });
      await tx.inventoryCountLine.deleteMany({ where: { count: { companyId: company.id } } });
      await tx.inventoryCount.deleteMany({ where: { companyId: company.id } });
      await tx.inventoryTransferItem.deleteMany({ where: { transfer: { companyId: company.id } } });
      await tx.inventoryTransfer.deleteMany({ where: { companyId: company.id } });
      await tx.inventoryMovement.deleteMany({ where: { warehouse: { companyId: company.id } } });
      await tx.inventoryBatch.deleteMany({ where: { warehouse: { companyId: company.id } } });
      await tx.inventoryStock.deleteMany({ where: { warehouse: { companyId: company.id } } });
      await tx.productPresentation.deleteMany({ where: { companyId: company.id } });
      await tx.product.deleteMany({ where: { companyId: company.id } });
      await tx.productSubcategory.deleteMany({ where: { companyId: company.id } });
      await tx.productCategory.deleteMany({ where: { companyId: company.id } });
      await tx.productBrand.deleteMany({ where: { companyId: company.id } });
      await tx.supplier.deleteMany({ where: { companyId: company.id } });
      await tx.customer.deleteMany({ where: { companyId: company.id } });
    },
    { timeout: 30_000 },
  );
  const category = await prisma.productCategory.create({
    data: {
      companyId: company.id,
      name: "Bebidas",
      description: "Catálogo de bebidas para venta minorista y mayorista.",
    },
  });
  const warehouse = await prisma.warehouse.upsert({
    where: { companyId_name: { companyId: company.id, name: "Almacén Principal" } },
    update: { code: "ALM-PRINCIPAL", type: WarehouseType.MAIN, isPrimary: true, isActive: true },
    create: {
      companyId: company.id,
      name: "Almacén Principal",
      code: "ALM-PRINCIPAL",
      type: WarehouseType.MAIN,
      isPrimary: true,
    },
  });
  for (const [
    sku,
    name,
    description,
    brandName,
    subcategoryName,
    presentation,
    content,
    purchasePrice,
    salePrice,
    wholesalePrice,
    wholesaleMinQuantity,
    initialStock,
    minimum,
  ] of items) {
    const subcategory = await prisma.productSubcategory.upsert({
      where: { categoryId_name: { categoryId: category.id, name: subcategoryName } },
      update: { isActive: true },
      create: { companyId: company.id, categoryId: category.id, name: subcategoryName },
    });
    const brand = await prisma.productBrand.upsert({
      where: { companyId_name: { companyId: company.id, name: brandName } },
      update: { isActive: true },
      create: { companyId: company.id, name: brandName },
    });
    const product = await prisma.product.create({
      data: {
        companyId: company.id,
        sku,
        barcode: `BC-${sku}`,
        name,
        description,
        brandId: brand.id,
        categoryId: category.id,
        subcategoryId: subcategory.id,
        unit: "UND",
        presentation: `${presentation} · ${content}`,
        purchasePrice,
        salePrice,
        wholesalePrice,
        wholesaleMinQuantity,
        sellRetail: true,
        sellWholesale: true,
        taxTreatment: TaxTreatment.TAXED,
        imageUrl: sku.startsWith("CER")
          ? "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=320&q=80"
          : sku.startsWith("ENE")
            ? "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=320&q=80"
            : sku.startsWith("AGU")
              ? "https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=320&q=80"
              : "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=320&q=80",
      },
    });
    await prisma.inventoryStock.create({
      data: {
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: initialStock,
        reserved: 0,
        minimum,
        maximum: initialStock * 2,
      },
    });
    await prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        warehouseId: warehouse.id,
        type: MovementType.INITIAL,
        quantity: initialStock,
        quantityIn: initialStock,
        quantityOut: 0,
        previousStock: 0,
        resultingStock: initialStock,
        documentRef: "INV-INICIAL-2026",
        reason: "Carga inicial de catálogo de bebidas",
        reference: "Seed catálogo bebidas",
        createdById: user.id,
      },
    });
  }
  console.log(`Catálogo cargado: ${items.length} productos, stock inicial y 9 subcategorías.`);
};
run()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
