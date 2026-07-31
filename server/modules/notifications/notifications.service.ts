import { NotificationType } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

const createInitialNotifications = (userId: string) =>
  prisma.notification.createMany({
    data: [
      {
        userId,
        type: NotificationType.SYSTEM,
        title: "Sesión protegida",
        message: "Tu cuenta está protegida mediante autenticación segura.",
      },
      {
        userId,
        type: NotificationType.INVENTORY,
        title: "Inventario actualizado",
        message: "Consulta las alertas de stock y los últimos movimientos.",
        actionUrl: "/inventario",
      },
      {
        userId,
        type: NotificationType.SALE,
        title: "Ventas en tiempo real",
        message: "Las ventas confirmadas descuentan el stock automáticamente.",
        actionUrl: "/ventas",
      },
    ],
  });

export const notificationsService = {
  async list(userId: string) {
    const existing = await prisma.notification.count({ where: { userId } });
    if (!existing) await createInitialNotifications(userId);
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  },
  markRead(userId: string, id: string) {
    return prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  },
  markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },
};
