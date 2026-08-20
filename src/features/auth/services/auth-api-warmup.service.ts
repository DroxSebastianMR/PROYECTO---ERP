import { env } from "@/app/config/env";

let warmupRequest: Promise<void> | null = null;

/**
 * Starts Render before the operator submits their credentials.
 * The request is intentionally anonymous and is shared per browser tab so it
 * does not duplicate calls during React development rendering.
 */
export const authApiWarmupService = {
  warm() {
    if (!warmupRequest) {
      warmupRequest = fetch(`${env.API_URL}/health`, { cache: "no-store" })
        .then(() => undefined)
        .catch(() => undefined)
        .finally(() => {
          warmupRequest = null;
        });
    }

    return warmupRequest;
  },
};
