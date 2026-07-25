interface Env {
  API_URL: string;
}

export const env: Env = {
  API_URL: import.meta.env.VITE_API_URL,
};

if (!env.API_URL) {
  throw new Error("VITE_API_URL no está definida en las variables de entorno.");
}
