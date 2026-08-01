import { env } from "@/app/config/env";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type UploadedProductImage = {
  path: string;
  publicUrl: string;
};

const getStorageConfig = () => {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error("Supabase Storage no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.");
  }
  return {
    baseUrl: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    bucket: env.SUPABASE_PRODUCT_IMAGES_BUCKET,
  };
};

const extensionFor = (file: File) => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && /^[a-z0-9]+$/.test(extension)) return extension;
  return file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
};

const objectUrl = (baseUrl: string, bucket: string, path: string) =>
  `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`;

export const productImageStorage = {
  validate(file: File) {
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      throw new Error("La imagen debe estar en formato JPG, PNG o WEBP.");
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error("La imagen no puede superar los 5 MB.");
    }
  },

  async upload(file: File): Promise<UploadedProductImage> {
    this.validate(file);
    const { baseUrl, anonKey, bucket } = getStorageConfig();
    const path = `products/${new Date().getFullYear()}/${crypto.randomUUID()}.${extensionFor(file)}`;
    const response = await fetch(objectUrl(baseUrl, bucket, path), {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": file.type,
        "x-upsert": "false",
      },
      body: file,
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => null) as { message?: string } | null;
      throw new Error(detail?.message ?? "No se pudo guardar la imagen en Supabase Storage.");
    }
    return { path, publicUrl: `${baseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${path.split("/").map(encodeURIComponent).join("/")}` };
  },

  async remove(path: string) {
    const { baseUrl, anonKey, bucket } = getStorageConfig();
    await fetch(`${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}`, {
      method: "DELETE",
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [path] }),
    });
  },
};
