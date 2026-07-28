import "dotenv/config";
import { PrismaClient, TaxTreatment } from "@prisma/client";

const prisma = new PrismaClient();

type SeedProduct = {
  sku: string;
  barcode: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  presentation: string;
  purchasePrice: number;
  salePrice: number;
  wholesalePrice: number;
  taxTreatment: TaxTreatment;
  description: string;
  presentations?: { name: string; unit: string; unitsPerBase: number; barcode: string; salePrice: number; wholesalePrice: number }[];
};

const products: SeedProduct[] = [
  {
    sku: "BEB-COCA-625", barcode: "7750180001234", name: "Coca-Cola Original 625 ml", category: "Bebidas", brand: "Coca-Cola", unit: "UND", presentation: "Botella de 625 ml", purchasePrice: 2.4, salePrice: 3.5, wholesalePrice: 3.1, taxTreatment: TaxTreatment.TAXED, description: "Bebida gaseosa Coca-Cola original, botella retornable de 625 ml.",
    presentations: [{ name: "Caja de 12 botellas", unit: "CAJ", unitsPerBase: 12, barcode: "7750180001241", salePrice: 37.2, wholesalePrice: 34.8 }],
  },
  {
    sku: "BEB-INKA-500", barcode: "7751271002036", name: "Inca Kola 500 ml", category: "Bebidas", brand: "Inca Kola", unit: "UND", presentation: "Botella de 500 ml", purchasePrice: 2.1, salePrice: 3.2, wholesalePrice: 2.85, taxTreatment: TaxTreatment.TAXED, description: "Bebida gaseosa sabor nacional en botella de 500 ml.",
    presentations: [{ name: "Caja de 12 botellas", unit: "CAJ", unitsPerBase: 12, barcode: "7751271002043", salePrice: 34.2, wholesalePrice: 32.0 }],
  },
  {
    sku: "ABR-ARROZ-5K", barcode: "7751002003015", name: "Arroz Superior Extra 5 kg", category: "Abarrotes", brand: "Costeño", unit: "BOL", presentation: "Bolsa de 5 kg", purchasePrice: 18.5, salePrice: 23.9, wholesalePrice: 21.5, taxTreatment: TaxTreatment.TAXED, description: "Arroz extra de grano largo, bolsa de 5 kilogramos.",
  },
  {
    sku: "ABR-ACEITE-1L", barcode: "7752003004018", name: "Aceite Vegetal Primor 1 L", category: "Abarrotes", brand: "Primor", unit: "UND", presentation: "Botella de 1 litro", purchasePrice: 7.2, salePrice: 9.5, wholesalePrice: 8.5, taxTreatment: TaxTreatment.TAXED, description: "Aceite vegetal comestible en presentación de 1 litro.",
    presentations: [{ name: "Caja de 12 botellas", unit: "CAJ", unitsPerBase: 12, barcode: "7752003004025", salePrice: 102, wholesalePrice: 96 }],
  },
  {
    sku: "LIM-DET-900", barcode: "7753004005011", name: "Detergente Bolívar 900 g", category: "Limpieza", brand: "Bolívar", unit: "BOL", presentation: "Bolsa de 900 g", purchasePrice: 8.1, salePrice: 11.5, wholesalePrice: 10.3, taxTreatment: TaxTreatment.TAXED, description: "Detergente en polvo para lavado de ropa.",
  },
  {
    sku: "LIM-LEJIA-1L", barcode: "7754005006014", name: "Lejía Clorox 1 L", category: "Limpieza", brand: "Clorox", unit: "UND", presentation: "Botella de 1 litro", purchasePrice: 3.3, salePrice: 5.2, wholesalePrice: 4.5, taxTreatment: TaxTreatment.TAXED, description: "Lejía desinfectante para limpieza del hogar.",
  },
  {
    sku: "SNK-GAL-6U", barcode: "7755006007017", name: "Galletas Soda Field 6 unidades", category: "Snacks", brand: "Field", unit: "PAQ", presentation: "Paquete de 6 unidades", purchasePrice: 1.7, salePrice: 2.8, wholesalePrice: 2.4, taxTreatment: TaxTreatment.TAXED, description: "Galletas soda en empaque individual de seis unidades.",
  },
  {
    sku: "LAC-LECHE-400", barcode: "7756007008010", name: "Leche Evaporada Gloria 400 g", category: "Lácteos", brand: "Gloria", unit: "UND", presentation: "Lata de 400 gramos", purchasePrice: 3.4, salePrice: 4.8, wholesalePrice: 4.25, taxTreatment: TaxTreatment.TAXED, description: "Leche evaporada entera en lata.",
    presentations: [{ name: "Caja de 24 latas", unit: "CAJ", unitsPerBase: 24, barcode: "7756007008027", salePrice: 102, wholesalePrice: 96 }],
  },
];

const run = async () => {
  const taxId = process.env.SEED_COMPANY_TAX_ID;
  const company = taxId
    ? await prisma.company.findUnique({ where: { taxId } })
    : await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });
  if (!company) throw new Error("No existe una empresa. Ejecuta primero el seed principal.");

  for (const item of products) {
    const { category: categoryName, brand: brandName, presentations, ...productData } = item;
    const category = await prisma.productCategory.upsert({
      where: { companyId_name: { companyId: company.id, name: categoryName } },
      update: { isActive: true },
      create: { companyId: company.id, name: categoryName },
    });
    const brand = await prisma.productBrand.upsert({
      where: { companyId_name: { companyId: company.id, name: brandName } },
      update: { isActive: true },
      create: { companyId: company.id, name: brandName },
    });
    const product = await prisma.product.upsert({
      where: { companyId_sku: { companyId: company.id, sku: item.sku } },
      update: { ...productData, categoryId: category.id, brandId: brand.id },
      create: { ...productData, companyId: company.id, categoryId: category.id, brandId: brand.id },
    });

    for (const presentation of presentations ?? []) {
      await prisma.productPresentation.upsert({
        where: { productId_name: { productId: product.id, name: presentation.name } },
        update: presentation,
        create: { ...presentation, companyId: company.id, productId: product.id },
      });
    }
  }

  console.log(`Products seed completed: ${products.length} products for ${company.name}.`);
};

run()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
