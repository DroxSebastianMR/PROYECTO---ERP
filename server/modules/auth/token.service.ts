import { createHash, randomBytes } from "node:crypto";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { UserRole } from "@prisma/client";
import type { AuthenticatedUser, AuthTokens } from "./auth.types.js";

export type AccessTokenPayload = JwtPayload & {
  sub: string;
  companyId: string;
  role: UserRole;
};

export const tokenService = {
  createAccessToken(user: AuthenticatedUser) {
    const options: SignOptions = {
      subject: user.id,
      expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    };

    return jwt.sign({ companyId: user.companyId, role: user.role }, env.JWT_SECRET, options);
  },
  createRefreshToken() {
    return randomBytes(48).toString("base64url");
  },
  hashRefreshToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  },
  verifyAccessToken(token: string): AccessTokenPayload {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
    if (typeof payload === "string" || !payload.sub || !payload.companyId || !payload.role) {
      throw new jwt.JsonWebTokenError("Invalid access token payload");
    }
    return payload as AccessTokenPayload;
  },
  createTokens(user: AuthenticatedUser): AuthTokens {
    return {
      accessToken: this.createAccessToken(user),
      refreshToken: this.createRefreshToken(),
      expiresIn: env.ACCESS_TOKEN_TTL,
    };
  },
};
