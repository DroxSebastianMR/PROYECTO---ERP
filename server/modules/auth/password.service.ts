import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;
export const passwordService = {
  hash: (password: string) => bcrypt.hash(password, SALT_ROUNDS),
  verify: (password: string, hash: string) => bcrypt.compare(password, hash),
};
