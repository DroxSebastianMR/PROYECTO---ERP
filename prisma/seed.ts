import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import { passwordService } from "../server/modules/auth/password.service.js";

const prisma = new PrismaClient();
const required = [
  "SEED_COMPANY_NAME",
  "SEED_COMPANY_TAX_ID",
  "SEED_ADMIN_EMAIL",
  "SEED_ADMIN_PASSWORD",
] as const;
for (const key of required)
  if (!process.env[key]) throw new Error(`${key} is required to run the seed.`);

const run = async () => {
  const company = await prisma.company.upsert({
    where: { taxId: process.env.SEED_COMPANY_TAX_ID },
    update: { name: process.env.SEED_COMPANY_NAME! },
    create: { name: process.env.SEED_COMPANY_NAME!, taxId: process.env.SEED_COMPANY_TAX_ID },
  });
  const email = process.env.SEED_ADMIN_EMAIL!.trim().toLowerCase();
  const passwordHash = await passwordService.hash(process.env.SEED_ADMIN_PASSWORD!);
  await prisma.user.upsert({
    where: { email },
    update: {
      fullName: "Administrador DistriCorp",
      companyId: company.id,
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      email,
      fullName: "Administrador DistriCorp",
      passwordHash,
      companyId: company.id,
      role: UserRole.ADMIN,
      emailVerifiedAt: new Date(),
    },
  });
  const customers = [
    {
      code: "CLI-000001",
      customerType: "PERSONA_NATURAL",
      documentType: "DNI",
      document: "45892134",
      name: "Carlos Mendoza",
      firstName: "Carlos",
      lastName: "Mendoza",
      mobilePhone: "987654321",
      email: "carlos.mendoza@ejemplo.pe",
      category: "REGULAR",
    },
    {
      code: "CLI-000002",
      customerType: "PERSONA_NATURAL",
      documentType: "DNI",
      document: "71239845",
      name: "Ana Gutierrez",
      firstName: "Ana",
      lastName: "Gutierrez",
      mobilePhone: "912345678",
      category: "REGULAR",
    },
    {
      code: "CLI-000003",
      customerType: "EMPRESA",
      documentType: "RUC",
      document: "20608912341",
      name: "Comercial Andina S.A.C.",
      companyName: "Comercial Andina S.A.C.",
      tradeName: "Andina Comercial",
      companyPhone: "014528900",
      companyEmail: "ventas@andina.pe",
      category: "MAYORISTA",
    },
    {
      code: "CLI-000004",
      customerType: "EMPRESA",
      documentType: "RUC",
      document: "20554433221",
      name: "Distribuidora Central E.I.R.L.",
      companyName: "Distribuidora Central E.I.R.L.",
      tradeName: "Distri Central",
      companyPhone: "016109900",
      category: "MAYORISTA",
    },
  ] as const;
  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { companyId_document: { companyId: company.id, document: customer.document } },
      update: { ...customer, isActive: true, status: "ACTIVO" },
      create: { companyId: company.id, ...customer, isActive: true, status: "ACTIVO" },
    });
  }
  console.log(`Seed completed for ${email}`);
};
run().finally(() => prisma.$disconnect());
