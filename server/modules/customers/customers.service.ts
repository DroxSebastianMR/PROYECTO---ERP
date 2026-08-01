import { SaleStatus, type Customer } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export class CustomerError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
  }
}

export type CustomerInput = {
  customerType: "PERSONA_NATURAL" | "EMPRESA";
  documentType: "DNI" | "RUC" | "CE" | "PASAPORTE" | "OTRO";
  documentNumber: string;
  firstName?: string;
  lastName?: string;
  birthDate?: Date;
  gender?: "M" | "F" | "OTRO";
  civilStatus?: "SOLTERO" | "CASADO" | "DIVORCIADO" | "VIUDO";
  phone?: string;
  mobilePhone?: string;
  email?: string;
  companyName?: string;
  tradeName?: string;
  legalRepresentative?: string;
  representativeRole?: string;
  companyPhone?: string;
  companyEmail?: string;
  address?: string;
  ubigeo?: string;
  category: "REGULAR" | "VIP" | "MAYORISTA" | "MINORISTA" | "CORPORATIVO";
  notes?: string;
};

const customerInclude = {
  sales: { include: { payments: true, document: true }, orderBy: { createdAt: "desc" as const } },
};

type CustomerWithSales = Customer & {
  sales: Array<{
    id: string;
    number: string;
    total: { toString(): string };
    status: SaleStatus;
    createdAt: Date;
    payments: Array<{ id: string; amount: { toString(): string }; paidAt: Date }>;
    document: { series: string; number: string } | null;
  }>;
};

const money = (value: { toString(): string } | null | undefined) => Number(value?.toString() ?? 0);
const customerName = (input: CustomerInput) =>
  input.customerType === "EMPRESA"
    ? input.companyName?.trim() ?? ""
    : [input.firstName, input.lastName].filter(Boolean).join(" ").trim();

const toDto = (customer: CustomerWithSales) => {
  const totalSpent = customer.sales
    .filter((sale) => sale.status !== SaleStatus.CANCELLED)
    .reduce((sum, sale) => sum + money(sale.total), 0);
  const pendingBalance = customer.sales
    .filter((sale) =>
      ([SaleStatus.PENDING_PAYMENT, SaleStatus.PARTIALLY_PAID] as SaleStatus[]).includes(sale.status),
    )
    .reduce(
      (sum, sale) =>
        sum + Math.max(0, money(sale.total) - sale.payments.reduce((paid, payment) => paid + money(payment.amount), 0)),
      0,
    );
  const activeSales = customer.sales.filter((sale) => sale.status !== SaleStatus.CANCELLED);

  return {
    id: customer.id,
    code: customer.code,
    customerType: customer.customerType,
    documentType: customer.documentType,
    documentNumber: customer.document ?? "",
    firstName: customer.firstName,
    lastName: customer.lastName,
    birthDate: customer.birthDate?.toISOString().slice(0, 10),
    gender: customer.gender,
    civilStatus: customer.civilStatus,
    phone: customer.phone,
    mobilePhone: customer.mobilePhone,
    email: customer.email,
    companyName: customer.companyName,
    tradeName: customer.tradeName,
    legalRepresentative: customer.legalRepresentative,
    representativeRole: customer.representativeRole,
    companyPhone: customer.companyPhone,
    companyEmail: customer.companyEmail,
    address: customer.address,
    ubigeo: customer.ubigeo,
    category: customer.category,
    status: customer.status,
    notes: customer.notes,
    hasOperations: customer.sales.length > 0,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
    summary: {
      totalSpent,
      totalSalesCount: activeSales.length,
      pendingBalance,
      averageTicket: activeSales.length ? totalSpent / activeSales.length : 0,
      lastPurchaseDate: activeSales[0]?.createdAt.toISOString(),
    },
    operationsHistory: customer.sales.map((sale) => ({
      id: sale.id,
      date: sale.createdAt.toISOString(),
      type: "VENTA" as const,
      documentNumber: sale.document ? `${sale.document.series}-${sale.document.number}` : sale.number,
      amount: money(sale.total),
      status: sale.status === SaleStatus.CANCELLED ? "ANULADO" : sale.status === SaleStatus.PAID ? "COMPLETADO" : "PENDIENTE",
      description: `Venta ${sale.number}`,
    })),
  };
};

const dataFromInput = ({ documentNumber, ...input }: CustomerInput) => ({
  ...input,
  document: documentNumber.trim(),
  name: customerName({ ...input, documentNumber }),
});

export const customersService = {
  async list(companyId: string) {
    const customers = await prisma.customer.findMany({
      where: { companyId },
      include: customerInclude,
      orderBy: { createdAt: "desc" },
    });
    return customers.map((customer) => toDto(customer as CustomerWithSales));
  },

  async get(companyId: string, id: string) {
    const customer = await prisma.customer.findFirst({ where: { id, companyId }, include: customerInclude });
    return customer ? toDto(customer as CustomerWithSales) : null;
  },

  async create(companyId: string, input: CustomerInput) {
    const name = customerName(input);
    if (!name) throw new CustomerError("Indica el nombre o razón social del cliente.");
    const count = await prisma.customer.count({ where: { companyId } });
    const customer = await prisma.customer.create({
      data: {
        companyId,
        code: `CLI-${String(count + 1).padStart(6, "0")}`,
        ...dataFromInput(input),
        isActive: true,
        status: "ACTIVO",
      },
      include: customerInclude,
    });
    return toDto(customer as CustomerWithSales);
  },

  async update(companyId: string, id: string, input: Partial<CustomerInput>) {
    const current = await prisma.customer.findFirst({ where: { id, companyId } });
    if (!current) throw new CustomerError("Cliente no encontrado.", 404);
    const merged = {
      customerType: current.customerType as CustomerInput["customerType"],
      documentType: current.documentType as CustomerInput["documentType"],
      documentNumber: current.document ?? "",
      firstName: current.firstName ?? undefined,
      lastName: current.lastName ?? undefined,
      companyName: current.companyName ?? undefined,
      category: current.category as CustomerInput["category"],
      ...input,
    } as CustomerInput;
    const name = customerName(merged);
    if (!name) throw new CustomerError("Indica el nombre o razón social del cliente.");
    const customer = await prisma.customer.update({
      where: { id },
      data: { ...dataFromInput(merged), code: current.code },
      include: customerInclude,
    });
    return toDto(customer as CustomerWithSales);
  },

  async setStatus(companyId: string, id: string, status: "ACTIVO" | "INACTIVO" | "BLOQUEADO") {
    const exists = await prisma.customer.findFirst({ where: { id, companyId }, select: { id: true } });
    if (!exists) throw new CustomerError("Cliente no encontrado.", 404);
    const customer = await prisma.customer.update({
      where: { id },
      data: { status, isActive: status === "ACTIVO" },
      include: customerInclude,
    });
    return toDto(customer as CustomerWithSales);
  },

  async remove(companyId: string, id: string) {
    const customer = await prisma.customer.findFirst({ where: { id, companyId }, include: { _count: { select: { sales: true } } } });
    if (!customer) throw new CustomerError("Cliente no encontrado.", 404);
    if (customer._count.sales > 0)
      throw new CustomerError("El cliente tiene operaciones y solo puede desactivarse.", 409);
    await prisma.customer.delete({ where: { id } });
  },
};
