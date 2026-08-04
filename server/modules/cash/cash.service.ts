import { CashCountStatus, CashSessionStatus, SalePaymentMethod, type Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export class CashError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); }
}

const sessionInclude = {
  cashRegister: true,
  openedBy: { select: { id: true, fullName: true } },
  closedBy: { select: { id: true, fullName: true } },
  counts: { include: { user: { select: { fullName: true } } }, orderBy: { createdAt: "desc" } },
} satisfies Prisma.CashSessionInclude;

const money = (value: number) => Math.round(value * 100) / 100;
const countStatus = (difference: number): CashCountStatus =>
  difference === 0 ? CashCountStatus.BALANCED : difference < 0 ? CashCountStatus.SHORTAGE : CashCountStatus.SURPLUS;

export type CashCountInput = { denominations: Array<{ denomination: number; quantity: number }>; explanation?: string };

export const cashService = {
  async listRegisters(companyId: string) {
    const registers = await prisma.cashRegister.findMany({ where: { companyId, isActive: true }, orderBy: { name: "asc" } });
    if (registers.length) return registers;
    return [await prisma.cashRegister.create({ data: { companyId, name: "Caja principal", code: "PRINCIPAL" } })];
  },
  async current(companyId: string) {
    return prisma.cashSession.findFirst({
      where: { companyId, status: CashSessionStatus.OPEN }, include: sessionInclude, orderBy: { openedAt: "desc" },
    });
  },
  async get(companyId: string, id: string) {
    return prisma.cashSession.findFirst({ where: { id, companyId }, include: sessionInclude });
  },
  async summary(session: { companyId: string; openedAt: Date; openingAmount: Prisma.Decimal | number }) {
    const [cashPayments, digitalPayments, cashExpenses, manualIncome, manualExpenses] = await Promise.all([
      prisma.salePayment.aggregate({
        where: { paidAt: { gte: session.openedAt }, method: SalePaymentMethod.CASH, sale: { companyId: session.companyId } },
        _sum: { amount: true },
      }),
      prisma.salePayment.aggregate({
        where: { paidAt: { gte: session.openedAt }, method: { in: [SalePaymentMethod.BANK_TRANSFER, SalePaymentMethod.CARD, SalePaymentMethod.YAPE_PLIN] }, sale: { companyId: session.companyId } },
        _sum: { amount: true },
      }),
      prisma.supplierPayment.aggregate({
        where: { paidAt: { gte: session.openedAt }, method: "CASH", payable: { purchase: { companyId: session.companyId } } },
        _sum: { amount: true },
      }),
      prisma.cashMovement.aggregate({
        where: { cashSessionId: (session as { id?: string }).id, type: "INCOME" },
        _sum: { amount: true },
      }),
      prisma.cashMovement.aggregate({
        where: { cashSessionId: (session as { id?: string }).id, type: "EXPENSE" },
        _sum: { amount: true },
      }),
    ]);
    const openingAmount = Number(session.openingAmount);
    const cashIncome = Number(cashPayments._sum.amount ?? 0) + Number(manualIncome._sum.amount ?? 0);
    const digitalIncome = Number(digitalPayments._sum.amount ?? 0);
    const expenses = Number(cashExpenses._sum.amount ?? 0) + Number(manualExpenses._sum.amount ?? 0);
    return { openingAmount, cashIncome, digitalIncome, expenses, expectedAmount: money(openingAmount + cashIncome - expenses), totalOperational: money(openingAmount + cashIncome + digitalIncome - expenses) };
  },
  async listMovements(companyId: string) {
    const session = await this.current(companyId);
    if (!session) return { session: null, movements: [] };
    const [manual, salePayments, supplierPayments] = await Promise.all([
      prisma.cashMovement.findMany({
        where: { cashSessionId: session.id },
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.salePayment.findMany({
        where: { paidAt: { gte: session.openedAt }, method: { in: ["CASH", "BANK_TRANSFER", "CARD", "YAPE_PLIN"] }, sale: { companyId } },
        include: { sale: { include: { createdBy: { select: { fullName: true } } } } },
        orderBy: { paidAt: "desc" },
      }),
      prisma.supplierPayment.findMany({
        where: { paidAt: { gte: session.openedAt }, method: "CASH", payable: { purchase: { companyId } } },
        include: { payable: { include: { purchase: true } } },
        orderBy: { paidAt: "desc" },
      }),
    ]);
    const movements = [
      ...manual.map((item) => ({ id: item.id, type: item.type, description: item.description, amount: Number(item.amount), paymentMethod: item.paymentMethod, createdAt: item.createdAt, user: item.user.fullName, source: "MANUAL" })),
      ...salePayments.map((item) => ({ id: `sale-${item.id}`, type: "INCOME", description: `Venta ${item.sale.number} · ${item.method === "CASH" ? "Movimiento físico" : "Movimiento digital"}`, amount: Number(item.amount), paymentMethod: item.method, createdAt: item.paidAt, user: item.sale.createdBy.fullName, source: "SALE" })),
      ...supplierPayments.map((item) => ({ id: `purchase-${item.id}`, type: "EXPENSE", description: `Pago a proveedor · ${item.payable.purchase.number}`, amount: Number(item.amount), paymentMethod: item.method, createdAt: item.paidAt, user: "Sistema", source: "PURCHASE" })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { session, movements };
  },
  async sessionActivity(companyId: string, id: string) {
    const session = await this.get(companyId, id);
    if (!session) throw new CashError("Turno de caja no encontrado.", 404);
    const until = session.closedAt ?? new Date();
    const [manual, salePayments, supplierPayments, counts] = await Promise.all([
      prisma.cashMovement.findMany({ where: { cashSessionId: session.id }, include: { user: { select: { fullName: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.salePayment.findMany({ where: { paidAt: { gte: session.openedAt, lte: until }, method: { in: ["CASH", "BANK_TRANSFER", "CARD", "YAPE_PLIN"] }, sale: { companyId } }, include: { sale: { include: { createdBy: { select: { fullName: true } } } } }, orderBy: { paidAt: "desc" } }),
      prisma.supplierPayment.findMany({ where: { paidAt: { gte: session.openedAt, lte: until }, method: "CASH", payable: { purchase: { companyId } } }, include: { payable: { include: { purchase: true } } }, orderBy: { paidAt: "desc" } }),
      prisma.cashCount.findMany({ where: { cashSessionId: session.id }, include: { user: { select: { fullName: true } }, details: true }, orderBy: { createdAt: "desc" } }),
    ]);
    const movements = [
      ...manual.map((item) => ({ id: item.id, type: item.type, description: item.description, amount: Number(item.amount), paymentMethod: item.paymentMethod, createdAt: item.createdAt, user: item.user.fullName, source: "MANUAL" })),
      ...salePayments.map((item) => ({ id: `sale-${item.id}`, type: "INCOME", description: `Venta ${item.sale.number} · ${item.method === "CASH" ? "Movimiento físico" : "Movimiento digital"}`, amount: Number(item.amount), paymentMethod: item.method, createdAt: item.paidAt, user: item.sale.createdBy.fullName, source: "SALE" })),
      ...supplierPayments.map((item) => ({ id: `purchase-${item.id}`, type: "EXPENSE", description: `Pago a proveedor · ${item.payable.purchase.number}`, amount: Number(item.amount), paymentMethod: item.method, createdAt: item.paidAt, user: "Sistema", source: "PURCHASE" })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { session, movements, counts: counts.map((count) => ({ ...count, expectedAmount: Number(count.expectedAmount), countedAmount: Number(count.countedAmount), difference: Number(count.difference), details: count.details.map((detail) => ({ ...detail, denomination: Number(detail.denomination), subtotal: Number(detail.subtotal) })) })) };
  },
  async createMovement(companyId: string, userId: string, input: { type: "INCOME" | "EXPENSE"; description: string; amount: number; paymentMethod: "CASH" | "BANK_TRANSFER" | "CARD" | "YAPE_PLIN" }) {
    const session = await this.current(companyId);
    if (!session) throw new CashError("Debe abrir una caja antes de registrar movimientos.", 409);
    return prisma.cashMovement.create({
      data: { companyId, cashSessionId: session.id, userId, ...input },
      include: { user: { select: { fullName: true } } },
    });
  },
  async open(companyId: string, userId: string, input: { cashRegisterId: string; openingAmount: number; notes?: string }) {
    const [register, userOpen, registerOpen] = await Promise.all([
      prisma.cashRegister.findFirst({ where: { id: input.cashRegisterId, companyId, isActive: true } }),
      prisma.cashSession.findFirst({ where: { companyId, openedById: userId, status: CashSessionStatus.OPEN } }),
      prisma.cashSession.findFirst({ where: { companyId, cashRegisterId: input.cashRegisterId, status: CashSessionStatus.OPEN } }),
    ]);
    if (!register) throw new CashError("Caja no vÃ¡lida.", 404);
    if (userOpen) throw new CashError("El usuario ya tiene una caja abierta.", 409);
    if (registerOpen) throw new CashError("Esta caja ya tiene una apertura activa.", 409);
    try {
      return await prisma.cashSession.create({ data: { companyId, cashRegisterId: register.id, openedById: userId, openingAmount: input.openingAmount, openingNotes: input.notes }, include: sessionInclude });
    } catch (error) {
      // Los chequeos previos dan un mensaje claro; este guard protege aperturas concurrentes.
      throw error;
    }
  },
  async createCount(companyId: string, userId: string, input: CashCountInput) {
    const session = await this.current(companyId);
    if (!session) throw new CashError("No existe una caja abierta para realizar el arqueo.", 409);
    const countedAmount = money(input.denominations.reduce((sum, item) => sum + item.denomination * item.quantity, 0));
    const summary = await this.summary(session);
    const difference = money(countedAmount - summary.expectedAmount);
    if (difference !== 0 && !input.explanation?.trim()) throw new CashError("La explicaciÃ³n es obligatoria cuando existe una diferencia.");
    return prisma.cashCount.create({
      data: { cashSessionId: session.id, userId, expectedAmount: summary.expectedAmount, countedAmount, difference, status: countStatus(difference), explanation: input.explanation?.trim(), details: { create: input.denominations.map((item) => ({ denomination: item.denomination, quantity: item.quantity, subtotal: money(item.denomination * item.quantity) })) } },
      include: { details: true, user: { select: { fullName: true } } },
    });
  },
  async close(companyId: string, userId: string, input: { countedAmount: number; notes?: string; ip?: string }) {
    const session = await this.current(companyId);
    if (!session) throw new CashError("No existe una caja abierta para cerrar.", 409);
    const summary = await this.summary(session);
    const difference = money(input.countedAmount - summary.expectedAmount);
    if (difference !== 0 && !input.notes?.trim()) throw new CashError("La explicaciÃ³n es obligatoria cuando existe una diferencia.");
    return prisma.cashSession.update({
      where: { id: session.id },
      data: { status: CashSessionStatus.CLOSED, closedById: userId, closedAt: new Date(), closingAmount: input.countedAmount, countedAmount: input.countedAmount, expectedAmount: summary.expectedAmount, difference, closingNotes: input.notes?.trim(), closingIp: input.ip },
      include: sessionInclude,
    });
  },
  history(companyId: string) {
    return prisma.cashSession.findMany({ where: { companyId }, include: sessionInclude, orderBy: { openedAt: "desc" }, take: 50 });
  },
};
