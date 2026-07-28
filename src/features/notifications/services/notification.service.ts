import { httpClient } from "@/lib/api/http-client";
import type { AppNotification } from "@/features/notifications/types/notification.types";
export const notificationService = {
  list: () => httpClient<AppNotification[]>("/notifications"),
  markRead: (id: string) => httpClient<void>(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () => httpClient<void>("/notifications/read-all", { method: "PATCH" }),
};
