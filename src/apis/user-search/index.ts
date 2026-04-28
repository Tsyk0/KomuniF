// File: src/apis/user-search/index.ts
import service from "@/apis/service";
import type { BaseResponse } from "@/types/dto/base";
import type { User } from "@/entity/user";
import type { ConversationSummaryDTO } from "@/types/dto/conversation";

export interface UserSearchPageData {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

export type UserSearchResponse = BaseResponse<UserSearchPageData>;
export interface GroupSearchPageData {
  conversations: ConversationSummaryDTO[];
  convList?: ConversationSummaryDTO[];
  total: number;
  page: number;
  pageSize: number;
}
export type GroupSearchResponse = BaseResponse<GroupSearchPageData>;

export function searchUsersApi(params: {
  keyword: string;
  page?: number;
  pageSize?: number;
}): Promise<UserSearchResponse> {
  return service({
    url: "/user-search/search",
    method: "get",
    params: {
      keyword: params.keyword.trim(),
      page: params.page || 1,
      pageSize: params.pageSize || 20,
    },
  });
}

export const userSearchApi = {
  search: searchUsersApi,
};

export function searchGroupsApi(params: {
  keyword: string;
  page?: number;
  pageSize?: number;
  convType?: number;
}): Promise<GroupSearchResponse> {
  return service({
    url: "/conversation-search/search",
    method: "get",
    params: {
      keyword: params.keyword.trim(),
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      convType: params.convType ?? 2,
    },
  });
}

export const groupSearchApi = {
  search: searchGroupsApi,
};

export default userSearchApi;
