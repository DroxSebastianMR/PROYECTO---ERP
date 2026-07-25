import { prisma } from "../../lib/prisma.js";

export const authRepository = {
  findUserByEmail: (email: string) =>
    prisma.user.findUnique({ where: { email }, include: { company: true } }),
  registerFailure: async (
    email: string,
    userId: string | undefined,
    ipAddress?: string,
    userAgent?: string,
  ) => {
    if (userId) {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { failedLoginCount: { increment: 1 } },
        select: { failedLoginCount: true },
      });
      if (user.failedLoginCount >= 5)
        await prisma.user.update({
          where: { id: userId },
          data: { lockedUntil: new Date(Date.now() + 15 * 60 * 1000), failedLoginCount: 0 },
        });
    }
    await prisma.loginAudit.create({
      data: { userId, email, success: false, ipAddress, userAgent },
    });
  },
  registerSuccess: async (
    userId: string,
    email: string,
    ipAddress: string | undefined,
    userAgent: string | undefined,
  ) =>
    prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
      }),
      prisma.loginAudit.create({ data: { userId, email, success: true, ipAddress, userAgent } }),
    ]),
  createSession: (
    userId: string,
    refreshHash: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ) =>
    prisma.authSession.create({ data: { userId, refreshHash, expiresAt, ipAddress, userAgent } }),
  revokeSession: (refreshHash: string) =>
    prisma.authSession.updateMany({
      where: { refreshHash, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
};
