import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

const SALT_ROUNDS = 12;
export const passwordService = {
  hash: (password: string) => bcrypt.hash(password, SALT_ROUNDS),
  verify: (password: string, hash: string) => bcrypt.compare(password, hash),
  createResetToken: () => randomBytes(32).toString("base64url"),
  hashResetToken: (token: string) => createHash("sha256").update(token).digest("hex"),
};
