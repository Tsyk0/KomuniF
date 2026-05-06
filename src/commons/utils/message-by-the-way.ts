/**
 * 从非文本消息 messageContent(JSON) 中提取附带文案。
 * 兼容字段：textByTheWay（标准）/ textbtw（别名）。
 */
export function extractByTheWayTextFromMessageContent(
  messageContent: string | null | undefined
): string {
  const raw = String(messageContent || "").trim();
  if (!raw) return "";
  try {
    const payload = JSON.parse(raw) as {
      textByTheWay?: unknown;
      textbtw?: unknown;
    };
    const primary =
      typeof payload.textByTheWay === "string" ? payload.textByTheWay.trim() : "";
    if (primary) return primary;
    const fallback =
      typeof payload.textbtw === "string" ? payload.textbtw.trim() : "";
    return fallback;
  } catch {
    return "";
  }
}

