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
  console.log(`Seed completed for ${email}`);
};
run().finally(() => prisma.$disconnect());
