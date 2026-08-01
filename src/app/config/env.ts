interface Env {
  API_URL: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_PRODUCT_IMAGES_BUCKET: string;
}

export const env: Env = {
  API_URL: import.meta.env.VITE_API_URL,
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, ""),
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  SUPABASE_PRODUCT_IMAGES_BUCKET: import.meta.env.VITE_SUPABASE_PRODUCT_IMAGES_BUCKET ?? "product-images",
};

if (!env.API_URL) {
  throw new Error("VITE_API_URL no está definida en las variables de entorno.");
}
