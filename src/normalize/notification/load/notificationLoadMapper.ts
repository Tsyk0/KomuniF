// src/normalize/notification/load/notificationLoadMapper.ts
import type {
  NotificationRecentItemDTO,
} from "@/types/dto/notification";

/** 列表按 notificationId 升序，保证分页拼接稳定。 */
export function sortNotificationsAsc(
  list: NotificationRecentItemDTO[]
): NotificationRecentItemDTO[] {
  return [...list].sort((a, b) => a.notificationId - b.notificationId);
}
