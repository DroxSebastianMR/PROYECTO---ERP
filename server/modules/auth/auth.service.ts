import { authRepository } from "./auth.repository.js";
import { passwordService } from "./password.service.js";
import { tokenService } from "./token.service.js";
import { env } from "../../config/env.js";
import type { AuthenticatedUser, LoginInput } from "./auth.types.js";
import { permissionService } from "./permission.service.js";
import { createPasswordRecoveryEmail, emailService } from "../email/index.js";
import type { PasswordRecoveryInput, PasswordResetInput } from "./auth.types.js";

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
  async requestPasswordRecovery(input: PasswordRecoveryInput) {
    const identifier = input.identifier.trim().toLowerCase();
    const user = await authRepository.findUserByRecoveryIdentifier(identifier);

    // This response is intentionally identical for unknown accounts to avoid user enumeration.
    if (!user?.personalEmail) return;

    const rawToken = passwordService.createResetToken();
    const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TOKEN_TTL_MINUTES * 60_000);
    await authRepository.createPasswordResetToken(
      user.id,
      passwordService.hashResetToken(rawToken),
      expiresAt,
    );

    const resetUrl = new URL("/cambiar-contrasena", env.CLIENT_URL);
    resetUrl.searchParams.set("token", rawToken);
    const template = createPasswordRecoveryEmail({
      recipientName: user.fullName,
      resetUrl: resetUrl.toString(),
      expiresInMinutes: env.PASSWORD_RESET_TOKEN_TTL_MINUTES,
    });

    try {
      await emailService.send({ to: { email: user.personalEmail }, ...template });
    } catch (error) {
      // Do not disclose account existence through this public endpoint.
      const cause = error instanceof Error && error.cause instanceof Error ? error.cause : error;
      console.error("Password recovery email could not be sent", {
        name: cause instanceof Error ? cause.name : "UnknownError",
        message: cause instanceof Error ? cause.message : String(cause),
        code: cause && typeof cause === "object" && "code" in cause ? String(cause.code) : undefined,
      });
    }
  },
  async resetPassword(input: PasswordResetInput) {
    const passwordHash = await passwordService.hash(input.password);
    const wasReset = await authRepository.consumePasswordResetToken(
      passwordService.hashResetToken(input.token),
      passwordHash,
    );
    if (!wasReset) throw new AuthError("El enlace de recuperación no es válido o ya expiró.", 400);
  },
};
