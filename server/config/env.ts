import "dotenv/config";

const required = ["DATABASE_URL", "DIRECT_URL", "JWT_SECRET"] as const;
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} is not defined in .env`);
}

export const env = {
  // Hosting providers such as Render provide PORT at runtime; API_PORT remains for local development.
  PORT: Number(process.env.PORT ?? process.env.API_PORT ?? 3001),
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:5173",
  CORS_ORIGINS: (process.env.CORS_ORIGINS ?? "https://districorp-erp-web.onrender.com")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  JWT_SECRET: process.env.JWT_SECRET!,
  ACCESS_TOKEN_TTL: process.env.AUTH_ACCESS_TOKEN_TTL ?? "15m",
  REFRESH_TOKEN_DAYS: Number(process.env.AUTH_REFRESH_TOKEN_DAYS ?? 30),
  PASSWORD_RESET_TOKEN_TTL_MINUTES: Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ?? 30),
  JWT_ISSUER: process.env.JWT_ISSUER ?? "districorp-erp-api",
  JWT_AUDIENCE: process.env.JWT_AUDIENCE ?? "districorp-erp-web",
  SMTP: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    username: process.env.SMTP_USERNAME,
    password: process.env.SMTP_PASSWORD,
    fromEmail: process.env.SMTP_FROM_EMAIL,
    fromName: process.env.SMTP_FROM_NAME ?? "Clienty - Sistema de Ventas",
  },
};
