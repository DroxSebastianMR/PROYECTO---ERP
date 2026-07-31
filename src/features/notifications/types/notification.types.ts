export type AppNotification = {
  id: string;
  type: "INVENTORY" | "SALE" | "PURCHASE" | "SYSTEM";
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
};
