import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/features/notifications/services/notification.service";
const KEY = ["notifications"] as const;
export const useNotifications = () => {
  const client = useQueryClient();
  const query = useQuery({ queryKey: KEY, queryFn: notificationService.list, refetchInterval: 60_000 });
  const refresh = () => client.invalidateQueries({ queryKey: KEY });
  const read = useMutation({ mutationFn: notificationService.markRead, onSuccess: refresh });
  const readAll = useMutation({ mutationFn: notificationService.markAllRead, onSuccess: refresh });
  const notifications = query.data ?? [];
  return { notifications, unreadCount: notifications.filter((item) => !item.isRead).length, markRead: read.mutate, markAllRead: readAll.mutate, isLoading: query.isLoading };
};
