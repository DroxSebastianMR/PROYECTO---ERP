import { authRepository } from "./auth.repository.js";
import { passwordService } from "./password.service.js";
import { tokenService } from "./token.service.js";
import { env } from "../../config/env.js";
import type { AuthenticatedUser, LoginInput } from "./auth.types.js";
import { permissionService } from "./permission.service.js";

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}
const toAuthenticatedUser = async (user: {
  id: string;
  companyId: string;
  email: string;
  fullName: string;
  role: AuthenticatedUser["role"];
  permissions: string[];
}): Promise<AuthenticatedUser> => ({
  id: user.id,
  companyId: user.companyId,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
  permissions: await permissionService.resolveEffectivePermissions(user),
});

export const authService = {
  async login(input: LoginInput) {
    const email = input.email.trim().toLowerCase();
    const user = await authRepository.findUserByEmail(email);
    const unavailable =
      !user || !user.isActive || (user.lockedUntil && user.lockedUntil > new Date());
    if (unavailable || !(await passwordService.verify(input.password, user.passwordHash))) {
      await authRepository.registerFailure(email, user?.id, input.ipAddress, input.userAgent);
      throw new AuthError(
        user?.lockedUntil && user.lockedUntil > new Date()
          ? "La cuenta está bloqueada temporalmente."
          : "Correo o contraseña inválidos.",
        user?.lockedUntil && user.lockedUntil > new Date() ? 423 : 401,
      );
    }
    const safeUser = await toAuthenticatedUser(user);
    const tokens = tokenService.createTokens(safeUser);
    await Promise.all([
      authRepository.registerSuccess(user.id, email, input.ipAddress, input.userAgent),
      authRepository.createSession(
        user.id,
        tokenService.hashRefreshToken(tokens.refreshToken),
        new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 86400000),
        input.ipAddress,
        input.userAgent,
      ),
    ]);
    return { user: safeUser, tokens };
  },
  async logout(refreshToken: string, userId: string) {
    await authRepository.revokeSession(tokenService.hashRefreshToken(refreshToken), userId);
  },
  async refresh(refreshToken: string, ipAddress?: string, userAgent?: string) {
    const refreshHash = tokenService.hashRefreshToken(refreshToken);
    const session = await authRepository.findActiveSessionByRefreshHash(refreshHash);
    if (!session || !session.user.isActive) throw new AuthError("Sesión inválida o expirada.", 401);

    const user = await toAuthenticatedUser(session.user);
    const tokens = tokenService.createTokens(user);
    await authRepository.revokeSession(refreshHash);
    await authRepository.createSession(
      user.id,
      tokenService.hashRefreshToken(tokens.refreshToken),
      new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 86400000),
      ipAddress,
      userAgent,
    );
    return { user, tokens };
  },
};
