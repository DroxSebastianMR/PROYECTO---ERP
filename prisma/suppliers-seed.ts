import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const suppliers = [
  { code: "PRV001", ruc: "20123456789", businessName: "Distribuidora Bebidas del Perú S.A.C.", tradeName: "Bebidas Perú", phone: "01 458 9210", email: "ventas@bebidasperu.pe", contactName: "María Torres", paymentTermsDays: 15 },
  { code: "PRV002", ruc: "20456789123", businessName: "Comercializadora Andina S.A.C.", tradeName: "Andina Comercial", phone: "01 617 3040", email: "pedidos@andina.com.pe", contactName: "Jorge Ramírez", paymentTermsDays: 30 },
  { code: "PRV003", ruc: "20678912345", businessName: "Importadora Central E.I.R.L.", tradeName: "Importadora Central", phone: "01 720 1880", email: "compras@importadoracentral.pe", contactName: "Lucía Mendoza", paymentTermsDays: 7 },
] as const;

const run = async () => {
  const company = process.env.SEED_COMPANY_TAX_ID
    ? await prisma.company.findUnique({ where: { taxId: process.env.SEED_COMPANY_TAX_ID } })
    : await prisma.company.findFirst();
  if (!company) throw new Error("No existe una empresa para registrar los proveedores.");
  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { companyId_ruc: { companyId: company.id, ruc: supplier.ruc } },
      update: { ...supplier, isActive: true },
      create: { companyId: company.id, ...supplier },
    });
  }
  console.log(`Seed de proveedores completado: ${suppliers.length} proveedores disponibles.`);
};

run().catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
