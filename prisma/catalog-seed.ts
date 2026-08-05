import "dotenv/config";
import { MovementType, PrismaClient, TaxTreatment, UserRole, WarehouseType } from "@prisma/client";
import { passwordService } from "../server/modules/auth/password.service.js";

const prisma = new PrismaClient();

type CatalogItem = {
  sku: string;
  category: string;
  subcategory: string;
  name: string;
  description: string;
  brand: string;
  presentation: string;
  unit: string;
  content: string;
  purchasePrice: number;
  retailPrice: number;
  wholesalePrice: number;
  wholesaleMinQuantity: number;
  initialStock: number;
  minimumStock: number;
  imageUrl: string;
};

const items: CatalogItem[] = [
  { sku: "GAS001", category: "Gaseosas", subcategory: "Cola", name: "Coca-Cola 500 ml", description: "Bebida gaseosa sabor cola en botella descartable de 500 ml", brand: "Coca-Cola", presentation: "Botella", unit: "UND", content: "500 ml", purchasePrice: 2.2, retailPrice: 3.5, wholesalePrice: 3.2, wholesaleMinQuantity: 12, initialStock: 120, minimumStock: 20, imageUrl: "https://www.popeyes.com.pe/media/catalog/product/2/1/2146464550.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=700&width=700&canvas=700:700&format=jpeg" },
  { sku: "GAS002", category: "Gaseosas", subcategory: "Amarilla", name: "Inca Kola 500 ml", description: "Bebida gaseosa amarilla en botella descartable de 500 ml", brand: "Inca Kola", presentation: "Botella", unit: "UND", content: "500 ml", purchasePrice: 2.2, retailPrice: 3.5, wholesalePrice: 3.2, wholesaleMinQuantity: 12, initialStock: 100, minimumStock: 20, imageUrl: "https://www.popeyes.com.pe/media/catalog/product/2/1/2146464545.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=700&width=700&canvas=700:700&format=jpeg" },
  { sku: "GAS003", category: "Gaseosas", subcategory: "Lima-limón", name: "Sprite 500 ml", description: "Bebida gaseosa sabor lima-limón en botella descartable de 500 ml", brand: "Sprite", presentation: "Botella", unit: "UND", content: "500 ml", purchasePrice: 2.1, retailPrice: 3.4, wholesalePrice: 3.1, wholesaleMinQuantity: 12, initialStock: 80, minimumStock: 15, imageUrl: "https://www.bembos.com.pe/media/catalog/product/2/1/2146466383.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=700&width=700&canvas=700:700&format=jpeg" },
  { sku: "GAS004", category: "Gaseosas", subcategory: "Naranja", name: "Fanta Naranja 500 ml", description: "Bebida gaseosa sabor naranja en botella descartable de 500 ml", brand: "Fanta", presentation: "Botella", unit: "UND", content: "500 ml", purchasePrice: 2.1, retailPrice: 3.4, wholesalePrice: 3.1, wholesaleMinQuantity: 12, initialStock: 90, minimumStock: 15, imageUrl: "https://plazavea.vteximg.com.br/arquivos/ids/34817793-418-418/382595.jpg" },
  { sku: "CER001", category: "Cervezas", subcategory: "Lager", name: "Pilsen 620 ml", description: "Cerveza lager en botella de vidrio de 620 ml", brand: "Pilsen", presentation: "Botella", unit: "UND", content: "620 ml", purchasePrice: 5.8, retailPrice: 7.5, wholesalePrice: 7, wholesaleMinQuantity: 12, initialStock: 60, minimumStock: 12, imageUrl: "https://hablacausa.com.pe/wp-content/uploads/2025/03/cerveza-pilsen-bt-x-630-ml.jpg" },
  { sku: "CER002", category: "Cervezas", subcategory: "Lager", name: "Cristal 620 ml", description: "Cerveza lager en botella de vidrio de 620 ml", brand: "Cristal", presentation: "Botella", unit: "UND", content: "620 ml", purchasePrice: 5.8, retailPrice: 7.5, wholesalePrice: 7, wholesaleMinQuantity: 12, initialStock: 60, minimumStock: 12, imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXJ5cmxqRr4V4SSbZUkrID2e3e5IFgqgyxEdRVAZE_gFPM_PiYnnUeq7OJ&s=10" },
  { sku: "CER003", category: "Cervezas", subcategory: "Dorada", name: "Cusqueña Dorada 330 ml", description: "Cerveza dorada en botella de vidrio de 330 ml", brand: "Cusqueña", presentation: "Botella", unit: "UND", content: "330 ml", purchasePrice: 3.8, retailPrice: 5.5, wholesalePrice: 5, wholesaleMinQuantity: 24, initialStock: 96, minimumStock: 24, imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6OAHGu2SqA9mTSVPJfD0WxKxzy0PUGzPDRowGWJmuNzy2lHtF5tPRmvFW&s=10" },
  { sku: "ENE001", category: "Energizantes", subcategory: "Tradicional", name: "Red Bull 250 ml", description: "Bebida energizante en lata de 250 ml", brand: "Red Bull", presentation: "Lata", unit: "UND", content: "250 ml", purchasePrice: 5.5, retailPrice: 8.5, wholesalePrice: 8, wholesaleMinQuantity: 24, initialStock: 72, minimumStock: 12, imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYqxUjnLep5g-0rXr5rYB3OWK_4JCmIg45ZoAKSuTGhw&s=10" },
  { sku: "ENE002", category: "Energizantes", subcategory: "Tradicional", name: "Volt 300 ml", description: "Bebida energizante en lata de 300 ml", brand: "Volt", presentation: "Lata", unit: "UND", content: "300 ml", purchasePrice: 2.8, retailPrice: 4.5, wholesalePrice: 4.2, wholesaleMinQuantity: 24, initialStock: 100, minimumStock: 20, imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSKxZv2TvHgOOhtoWW9Zlswx7rXah8dnN983d-seRkwQ&s=10" },
  { sku: "ENE003", category: "Energizantes", subcategory: "Tradicional", name: "Monster 473 ml", description: "Bebida energizante en lata de 473 ml", brand: "Monster", presentation: "Lata", unit: "UND", content: "473 ml", purchasePrice: 6.5, retailPrice: 9.5, wholesalePrice: 9, wholesaleMinQuantity: 12, initialStock: 48, minimumStock: 10, imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9SBnCsrGgR_YyXLWxDSBYDT2NyJPH5CAklqH8ClZEIg&s=10" },
  { sku: "AGU001", category: "Aguas", subcategory: "Sin gas", name: "Cielo 625 ml", description: "Agua de mesa sin gas en botella descartable de 625 ml", brand: "Cielo", presentation: "Botella", unit: "UND", content: "625 ml", purchasePrice: 1.2, retailPrice: 2, wholesalePrice: 1.8, wholesaleMinQuantity: 24, initialStock: 120, minimumStock: 24, imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgVEuypbU_ioLDzNS_UkUWlTeCOYvBv4T2DovBm2djyw&s=10" },
  { sku: "AGU002", category: "Aguas", subcategory: "Sin gas", name: "San Luis 625 ml", description: "Agua de mesa sin gas en botella descartable de 625 ml", brand: "San Luis", presentation: "Botella", unit: "UND", content: "625 ml", purchasePrice: 1.2, retailPrice: 2, wholesalePrice: 1.8, wholesaleMinQuantity: 24, initialStock: 120, minimumStock: 24, imageUrl: "https://www.bembos.com.pe/media/catalog/product/2/1/2146469608_1.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=700&width=700&canvas=700:700&format=jpeg" },
  { sku: "JUG001", category: "Jugos", subcategory: "Néctares", name: "Frugos 1 L", description: "Néctar de fruta en envase de cartón descartable de 1 L", brand: "Frugos", presentation: "Caja", unit: "UND", content: "1 L", purchasePrice: 3.8, retailPrice: 5.5, wholesalePrice: 5, wholesaleMinQuantity: 12, initialStock: 50, minimumStock: 10, imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxPXzdjWNJW1hQK4Mc2KJyBRdxPQeMBHk0CkyuuhjXTA&s=10" },
  { sku: "JUG002", category: "Jugos", subcategory: "Néctares", name: "Pulp 450 ml", description: "Néctar de fruta en botella descartable de 450 ml", brand: "Pulp", presentation: "Botella", unit: "UND", content: "450 ml", purchasePrice: 2.4, retailPrice: 3.8, wholesalePrice: 3.5, wholesaleMinQuantity: 12, initialStock: 70, minimumStock: 15, imageUrl: "https://abattz.com/productoswebp/231298.webp" },
  { sku: "TE001", category: "Tés", subcategory: "Té helado", name: "Fuze Tea Limón 500 ml", description: "Bebida de té sabor limón en botella descartable de 500 ml", brand: "Fuze Tea", presentation: "Botella", unit: "UND", content: "500 ml", purchasePrice: 2.5, retailPrice: 4, wholesalePrice: 3.7, wholesaleMinQuantity: 12, initialStock: 60, minimumStock: 12, imageUrl: "https://www.coca-cola.com/content/dam/onexp/es/es/fuzetea/productospages/limon500ml.jpg" },
  { sku: "ISO001", category: "Rehidratantes", subcategory: "Isotónicas", name: "Sporade 500 ml", description: "Bebida rehidratante isotónica en botella descartable de 500 ml", brand: "Sporade", presentation: "Botella", unit: "UND", content: "500 ml", purchasePrice: 2.3, retailPrice: 3.8, wholesalePrice: 3.5, wholesaleMinQuantity: 12, initialStock: 80, minimumStock: 15, imageUrl: "https://oechsle.vteximg.com.br/arquivos/ids/1350551-1000-1000/image-5c00452922784beab76b0a3495d0b386.jpg?v=637494715750930000" },
  { sku: "ISO002", category: "Rehidratantes", subcategory: "Isotónicas", name: "Gatorade 500 ml", description: "Bebida rehidratante isotónica en botella descartable de 500 ml", brand: "Gatorade", presentation: "Botella", unit: "UND", content: "500 ml", purchasePrice: 3.2, retailPrice: 5, wholesalePrice: 4.7, wholesaleMinQuantity: 12, initialStock: 80, minimumStock: 15, imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_Q_KkEOg_-S2Ruufkh95p-0zJeepZp7P8IsDiAvjRo27TXyonmRILn88&s=10" },
  { sku: "MAL001", category: "Maltas", subcategory: "Bebida de malta", name: "Maltín Power 330 ml", description: "Bebida de malta en lata descartable de 330 ml", brand: "Maltín Power", presentation: "Lata", unit: "UND", content: "330 ml", purchasePrice: 2, retailPrice: 3.5, wholesalePrice: 3.2, wholesaleMinQuantity: 24, initialStock: 90, minimumStock: 20, imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFCgUNRPdXHSHlOxHw1-fT-mfU86znagg0UWl27lHiLQ&s=10" },
  { sku: "BEB001", category: "Refrescos", subcategory: "Guaraná", name: "Guaraná 500 ml", description: "Bebida refrescante sabor guaraná en botella descartable de 500 ml", brand: "Guaraná", presentation: "Botella", unit: "UND", content: "500 ml", purchasePrice: 2.2, retailPrice: 3.6, wholesalePrice: 3.3, wholesaleMinQuantity: 12, initialStock: 70, minimumStock: 15, imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtE5azOoo47JO4oUPgqEiUg8IqFltc37uTr-2P4nRq7A&s=10" },
  { sku: "BEB002", category: "Refrescos", subcategory: "Piña", name: "Concordia Piña 500 ml", description: "Bebida refrescante sabor piña en botella descartable de 500 ml", brand: "Concordia", presentation: "Botella", unit: "UND", content: "500 ml", purchasePrice: 2, retailPrice: 3.3, wholesalePrice: 3, wholesaleMinQuantity: 12, initialStock: 70, minimumStock: 15, imageUrl: "https://aceleralastatic.nyc3.cdn.digitaloceanspaces.com/files/uploads/1499/1596824007-145-concordia-pina-500-jpg.jpg" },
];

const users = [
  { fullName: "Ronald De la Cruz", email: "ronald@clienty.pe", role: UserRole.ADMIN },
  { fullName: "Sebastian Mercado", email: "sebastian@clienty.pe", role: UserRole.SALES_PURCHASING },
  { fullName: "Valeria Flores", email: "valeria@clienty.pe", role: UserRole.ACCOUNTANT },
  { fullName: "Diego Ramírez", email: "diego@clienty.pe", role: UserRole.WAREHOUSE },
] as const;

const categoryCodes = new Map(
  [...new Set(items.map((item) => item.category))].map((category, index) => [
    category,
    `CAT${String(index + 1).padStart(3, "0")}`,
  ]),
);

const suppliers = [
  { code: "PRV001", ruc: "20123456789", businessName: "Bebidas del Pacífico S.A.C.", tradeName: "Bebidas Pacífico", address: "Av. Industrial 450, Lima", phone: "01 458 9210", email: "ventas@bebidaspacifico.pe", contactName: "María Torres", paymentTermsDays: 15 },
  { code: "PRV002", ruc: "20456789123", businessName: "Comercializadora Andina S.A.C.", tradeName: "Andina Comercial", address: "Jr. Los Olivos 820, Lima", phone: "01 617 3040", email: "pedidos@andina.pe", contactName: "Jorge Ramírez", paymentTermsDays: 30 },
  { code: "PRV003", ruc: "20678912345", businessName: "Importadora Central E.I.R.L.", tradeName: "Importadora Central", address: "Av. Argentina 1290, Callao", phone: "01 720 1880", email: "compras@importadoracentral.pe", contactName: "Lucía Mendoza", paymentTermsDays: 7 },
] as const;

const customers = [
  { code: "CLI-000001", customerType: "PERSONA_NATURAL", documentType: "DNI", document: "45892134", name: "María López", firstName: "María", lastName: "López", mobilePhone: "987654321", email: "maria.lopez@ejemplo.pe", category: "REGULAR" },
  { code: "CLI-000002", customerType: "PERSONA_NATURAL", documentType: "DNI", document: "71239845", name: "Carlos Mendoza", firstName: "Carlos", lastName: "Mendoza", mobilePhone: "912345678", email: "carlos.mendoza@ejemplo.pe", category: "REGULAR" },
  { code: "CLI-000003", customerType: "EMPRESA", documentType: "RUC", document: "20608912341", name: "Bodega San Martín S.A.C.", companyName: "Bodega San Martín S.A.C.", tradeName: "Bodega San Martín", companyPhone: "014528900", companyEmail: "compras@bodegasanmartin.pe", category: "MAYORISTA" },
] as const;

const run = async () => {
  const taxId = process.env.SEED_COMPANY_TAX_ID ?? "20500000001";
  const company = await prisma.company.upsert({
    where: { taxId },
    update: { name: "Clienty - Sistema de Ventas" },
    create: { taxId, name: "Clienty - Sistema de Ventas" },
  });

  await prisma.$transaction(async (tx) => {
    await tx.cashCountDetail.deleteMany({ where: { cashCount: { cashSession: { companyId: company.id } } } });
    await tx.cashCount.deleteMany({ where: { cashSession: { companyId: company.id } } });
    await tx.cashMovement.deleteMany({ where: { companyId: company.id } });
    await tx.cashSession.deleteMany({ where: { companyId: company.id } });
    await tx.cashRegister.deleteMany({ where: { companyId: company.id } });
    await tx.supplierPayment.deleteMany({ where: { payable: { purchase: { companyId: company.id } } } });
    await tx.accountsPayable.deleteMany({ where: { purchase: { companyId: company.id } } });
    await tx.purchaseReceiptLine.deleteMany({ where: { receipt: { purchase: { companyId: company.id } } } });
    await tx.purchaseReceipt.deleteMany({ where: { purchase: { companyId: company.id } } });
    await tx.purchaseDocument.deleteMany({ where: { purchase: { companyId: company.id } } });
    await tx.purchaseItem.deleteMany({ where: { purchase: { companyId: company.id } } });
    await tx.purchase.deleteMany({ where: { companyId: company.id } });
    await tx.saleReturnLine.deleteMany({ where: { saleReturn: { sale: { companyId: company.id } } } });
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
    await tx.productBarcode.deleteMany({ where: { companyId: company.id } });
    await tx.productPresentation.deleteMany({ where: { companyId: company.id } });
    await tx.product.deleteMany({ where: { companyId: company.id } });
    await tx.productSubcategory.deleteMany({ where: { companyId: company.id } });
    await tx.productCategory.deleteMany({ where: { companyId: company.id } });
    await tx.productBrand.deleteMany({ where: { companyId: company.id } });
    await tx.measurementUnit.deleteMany({ where: { companyId: company.id } });
    await tx.warehouse.deleteMany({ where: { companyId: company.id } });
    await tx.customer.deleteMany({ where: { companyId: company.id } });
    await tx.supplier.deleteMany({ where: { companyId: company.id } });
    await tx.notification.deleteMany({ where: { user: { companyId: company.id } } });
    await tx.authSession.deleteMany({ where: { user: { companyId: company.id } } });
    await tx.loginAudit.deleteMany({ where: { user: { companyId: company.id } } });
    await tx.user.deleteMany({ where: { companyId: company.id } });
  }, { timeout: 30_000 });

  const passwordHash = await passwordService.hash("Clienty2026!");
  const seededUsers = await Promise.all(
    users.map((seededUser) => prisma.user.create({
      data: {
        ...seededUser,
        passwordHash,
        companyId: company.id,
        emailVerifiedAt: new Date(),
        permissions: [],
      },
    })),
  );
  const user = seededUsers.find((seededUser) => seededUser.role === UserRole.ADMIN);
  if (!user) throw new Error("No se pudo crear el usuario administrador.");

  await Promise.all([
    ...suppliers.map((supplier) => prisma.supplier.create({ data: { ...supplier, companyId: company.id } })),
    ...customers.map((customer) => prisma.customer.create({ data: { ...customer, companyId: company.id, isActive: true, status: "ACTIVO" } })),
  ]);

  await prisma.measurementUnit.upsert({
    where: { companyId_code: { companyId: company.id, code: "UND001" } },
    update: { name: "Unidad", abbreviation: "UND", isActive: true },
    create: { companyId: company.id, code: "UND001", abbreviation: "UND", name: "Unidad" },
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { companyId_name: { companyId: company.id, name: "Almacén Principal" } },
    update: { code: "ALM-PRINCIPAL", type: WarehouseType.MAIN, isPrimary: true, isActive: true },
    create: { companyId: company.id, name: "Almacén Principal", code: "ALM-PRINCIPAL", type: WarehouseType.MAIN, isPrimary: true },
  });

  for (const item of items) {
    const category = await prisma.productCategory.upsert({
      where: { companyId_name: { companyId: company.id, name: item.category } },
      update: { isActive: true },
      create: { companyId: company.id, code: categoryCodes.get(item.category)!, name: item.category, description: `Catálogo de ${item.category.toLowerCase()}.` },
    });
    const subcategory = await prisma.productSubcategory.upsert({
      where: { categoryId_name: { categoryId: category.id, name: item.subcategory } },
      update: { isActive: true },
      create: { companyId: company.id, categoryId: category.id, name: item.subcategory },
    });
    const brand = await prisma.productBrand.upsert({
      where: { companyId_name: { companyId: company.id, name: item.brand } },
      update: { isActive: true },
      create: { companyId: company.id, name: item.brand },
    });
    const product = await prisma.product.create({
      data: {
        companyId: company.id,
        sku: item.sku,
        barcode: item.sku,
        name: item.name,
        description: item.description,
        brandId: brand.id,
        categoryId: category.id,
        subcategoryId: subcategory.id,
        unit: item.unit,
        presentation: `${item.presentation} · ${item.content}`,
        purchasePrice: item.purchasePrice,
        salePrice: item.retailPrice,
        wholesalePrice: item.wholesalePrice,
        wholesaleMinQuantity: item.wholesaleMinQuantity,
        sellRetail: true,
        sellWholesale: true,
        taxTreatment: TaxTreatment.TAXED,
        imageUrl: item.imageUrl,
      },
    });
    await prisma.productBarcode.create({
      data: { companyId: company.id, productId: product.id, code: item.sku, isPrimary: true },
    });
    await prisma.inventoryStock.create({ data: { productId: product.id, warehouseId: warehouse.id, quantity: item.initialStock, reserved: 0, minimum: item.minimumStock, maximum: item.initialStock * 2 } });
    await prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        warehouseId: warehouse.id,
        type: MovementType.INITIAL,
        quantity: item.initialStock,
        quantityIn: item.initialStock,
        quantityOut: 0,
        previousStock: 0,
        resultingStock: item.initialStock,
        documentRef: "INV-INICIAL-2026",
        reason: "Carga inicial de catálogo de bebidas",
        reference: "Seed de catálogo bebidas",
        createdById: user.id,
      },
    });
  }

  console.log(`Sistema reiniciado: ${seededUsers.length} usuarios, ${customers.length} clientes, ${suppliers.length} proveedores y ${items.length} productos.`);
};

run()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
