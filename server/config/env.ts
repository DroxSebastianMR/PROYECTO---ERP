import "dotenv/config";

const required = ["DATABASE_URL", "DIRECT_URL", "JWT_SECRET"] as const;
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} is not defined in .env`);
}

export const env = {
  PORT: Number(process.env.API_PORT ?? 3001),
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:5173",
  JWT_SECRET: process.env.JWT_SECRET!,
  ACCESS_TOKEN_TTL: process.env.AUTH_ACCESS_TOKEN_TTL ?? "15m",
  REFRESH_TOKEN_DAYS: Number(process.env.AUTH_REFRESH_TOKEN_DAYS ?? 30),
  JWT_ISSUER: process.env.JWT_ISSUER ?? "districorp-erp-api",
  JWT_AUDIENCE: process.env.JWT_AUDIENCE ?? "districorp-erp-web",
};
