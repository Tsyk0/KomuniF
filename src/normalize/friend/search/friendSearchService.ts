import { searchUsersApi, type UserSearchResponse } from "@/apis/user-search";

export type UserSearchParams = {
  keyword: string;
  page?: number;
  pageSize?: number;
};

/** 用户检索 normalize service。 */
export async function searchUsersNormalized(
  params: UserSearchParams
): Promise<UserSearchResponse> {
  return searchUsersApi(params);
}
