import service from "../../service";
import type { SearchMessagesRequest, SearchMessagesResponse } from "@/types/dto/message";

/**
 * 搜索消息（ES 模糊搜索）
 * 对应后端接口：GET /messages/search
 */
export function searchMessagesApi(
  params: SearchMessagesRequest,
  options?: { signal?: AbortSignal }
): Promise<SearchMessagesResponse> {
  return service({
    url: "/messages/search",
    method: "get",
    params,
    signal: options?.signal,
  });
}

export const messageSearchApi = {
  searchMessages: searchMessagesApi,
};

export default messageSearchApi;
