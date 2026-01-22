// 修改后的 src/types/flow/message.response.ts
export interface BaseResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
}
// 删除其他接口