import type { UserRole } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  companyId: string;
  email: string;
  fullName: string;
  role: UserRole;
};
export type LoginInput = {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
};
export type AuthTokens = { accessToken: string; refreshToken: string; expiresIn: string };
