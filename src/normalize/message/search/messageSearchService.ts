import { searchMessagesApi } from "@/apis/chat/message-search";
import type { SearchMessagesRequest, SearchMessagesResponse } from "@/types/dto/message";

/** 消息搜索 normalize service：统一封装搜索接口调用。 */
export async function searchMessagesNormalized(
  params: SearchMessagesRequest,
  options?: { signal?: AbortSignal }
): Promise<SearchMessagesResponse> {
  return searchMessagesApi(params, options);
}
