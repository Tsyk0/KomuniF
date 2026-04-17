// File: src/types/dto/base.ts
/**
 * 基础响应类型
 */
export interface BaseResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
}
