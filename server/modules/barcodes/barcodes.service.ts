import { prisma } from "../../lib/prisma.js";

export class BarcodeError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

type Format = "CODE128" | "EAN13";

const barcodeRepo = () => (prisma as typeof prisma & { productBarcode: any }).productBarcode;

const ean13CheckDigit = (digits: string) => {
  const sum = digits.split("").reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
  return String((10 - (sum % 10)) % 10);
};

const normalizeCode = (code: string) => code.trim().toUpperCase();

const ensureAvailable = async (companyId: string, code: string, excludingId?: string) => {
  const exists = await barcodeRepo().findFirst({ where: { companyId, code, ...(excludingId ? { id: { not: excludingId } } : {}) } });
  if (exists) throw new BarcodeError("Este código de barras ya está asignado.", 409);
};

export const barcodesService = {
  async list(companyId: string, search?: string) {
    return barcodeRepo().findMany({
      where: { companyId, ...(search ? { OR: [{ code: { contains: search, mode: "insensitive" } }, { product: { name: { contains: search, mode: "insensitive" } } }, { product: { sku: { contains: search, mode: "insensitive" } } }] } : {}) },
      include: { product: { select: { id: true, sku: true, name: true, imageUrl: true, barcode: true, isActive: true } } },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    });
  },

  async generate(companyId: string, format: Format) {
    const count = await barcodeRepo().count({ where: { companyId } });
    for (let sequence = count + 1; sequence < count + 10_000; sequence += 1) {
      const code = format === "CODE128"
        ? `DIST${String(sequence).padStart(6, "0")}`
        : `200${String(sequence).padStart(9, "0").slice(-9)}`;
      const candidate = format === "EAN13" ? `${code}${ean13CheckDigit(code)}` : code;
      const exists = await barcodeRepo().findFirst({ where: { companyId, code: candidate } });
      if (!exists) return { code: candidate, format };
    }
    throw new BarcodeError("No se pudo generar un código disponible.", 409);
  },

  async create(companyId: string, input: { productId: string; code: string; format: Format; isPrimary?: boolean }) {
    const code = normalizeCode(input.code);
    if (input.format === "EAN13" && !/^\d{13}$/.test(code)) throw new BarcodeError("EAN-13 debe tener exactamente 13 dígitos.");
    if (input.format === "CODE128" && !/^[\x20-\x7E]{3,80}$/.test(code)) throw new BarcodeError("El código CODE128 no tiene un formato válido.");
    const product = await prisma.product.findFirst({ where: { id: input.productId, companyId } });
    if (!product) throw new BarcodeError("Producto no encontrado.", 404);
    await ensureAvailable(companyId, code);
    return prisma.$transaction(async (tx) => {
      const repo = (tx as typeof tx & { productBarcode: any }).productBarcode;
      if (input.isPrimary) await repo.updateMany({ where: { productId: input.productId }, data: { isPrimary: false } });
      const barcode = await repo.create({ data: { companyId, productId: input.productId, code, format: input.format, isPrimary: Boolean(input.isPrimary) }, include: { product: { select: { id: true, sku: true, name: true, imageUrl: true } } } });
      if (input.isPrimary) await tx.product.update({ where: { id: input.productId }, data: { barcode: code } });
      return barcode;
    });
  },

  async setPrimary(companyId: string, id: string) {
    const barcode = await barcodeRepo().findFirst({ where: { id, companyId } });
    if (!barcode) throw new BarcodeError("Código de barras no encontrado.", 404);
    return prisma.$transaction(async (tx) => {
      const repo = (tx as typeof tx & { productBarcode: any }).productBarcode;
      await repo.updateMany({ where: { productId: barcode.productId }, data: { isPrimary: false } });
      const updated = await repo.update({ where: { id }, data: { isPrimary: true }, include: { product: { select: { id: true, sku: true, name: true, imageUrl: true } } } });
      await tx.product.update({ where: { id: barcode.productId }, data: { barcode: barcode.code } });
      return updated;
    });
  },

  async remove(companyId: string, id: string) {
    const barcode = await barcodeRepo().findFirst({ where: { id, companyId } });
    if (!barcode) throw new BarcodeError("Código de barras no encontrado.", 404);
    if (barcode.isPrimary) throw new BarcodeError("Asigna otro código principal antes de eliminar este código.", 409);
    await barcodeRepo().delete({ where: { id } });
  },
};
