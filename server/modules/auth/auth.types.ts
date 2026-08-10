import type { UserRole } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  companyId: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: string[];
};
export type LoginInput = {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
};

export type PasswordRecoveryInput = {
  identifier: string;
};

export type PasswordResetInput = {
  token: string;
  password: string;
};
export type AuthTokens = { accessToken: string; refreshToken: string; expiresIn: string };
