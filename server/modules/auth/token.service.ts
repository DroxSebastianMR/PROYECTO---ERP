import { createHash, randomBytes } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { AuthenticatedUser, AuthTokens } from "./auth.types.js";

export const tokenService = {
  createAccessToken(user: AuthenticatedUser) {
    const options: SignOptions = {
      subject: user.id,
      expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
    };

    return jwt.sign({ companyId: user.companyId, role: user.role }, env.JWT_SECRET, options);
  },
  createRefreshToken() {
    return randomBytes(48).toString("base64url");
  },
  hashRefreshToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  },
  createTokens(user: AuthenticatedUser): AuthTokens {
    return {
      accessToken: this.createAccessToken(user),
      refreshToken: this.createRefreshToken(),
      expiresIn: env.ACCESS_TOKEN_TTL,
    };
  },
};
