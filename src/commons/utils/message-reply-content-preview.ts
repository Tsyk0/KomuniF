import type { DisplayMessage } from "@/entity/message";

const TEXT_PREVIEW_MAX = 140;

/**
 * 将任意类型的消息压成引用条中的一行「内容预览」文案。
 * 使用场景：展示「回复某条消息」时气泡下方的摘要、输入区上方的待回复条。
 */
export function formatQuotedMessageContentPreview(message: DisplayMessage): string {
  if (message.isRecalled) {
    return "原消息已撤回";
  }
  const t = (message.messageType || "text").toLowerCase();
  if (t === "image") {
    return "[图片]";
  }
  if (t === "video") {
    return "[视频]";
  }
  if (t === "file") {
    const raw = message.messageContent || "";
    try {
      const o = JSON.parse(raw) as { fileName?: string };
      const name = (o?.fileName || "").trim();
      return name ? `[文件] ${name}` : "[文件]";
    } catch {
      return "[文件]";
    }
  }
  const text = (message.messageContent || "").replace(/\s+/g, " ").trim();
  if (!text) {
    return "[空消息]";
  }
  return text.length > TEXT_PREVIEW_MAX ? `${text.slice(0, TEXT_PREVIEW_MAX)}…` : text;
}
