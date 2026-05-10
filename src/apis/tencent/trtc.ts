import service from "@/apis/service";
import type { BaseResponse } from "@/types/dto/base";

export interface TrtcUserSigData {
  sdkAppId: number;
  userId: string;
  userSig: string;
}

/**
 * 解包后端统一响应，与文件上传等接口保持一致。
 * 使用场景：TRTC / ASR 接口返回 `BaseResponse<T>` 时取出 `data`。
 */
const unwrapApiResponseData = <T>(response: any): T => {
  if (response?.data?.data !== undefined) return response.data.data as T;
  if (response?.data !== undefined && response?.code !== undefined)
    return response.data as T;
  return response as T;
};

/**
 * 向自有后端申请 TRTC 登录凭证（UserSig、userId、sdkAppId）。
 * 使用场景：发起或接听音视频通话前初始化 TUICallKit / TRTC Web SDK；密钥只在服务端持有。
 */
export function fetchTrtcUserSigApi(): Promise<TrtcUserSigData> {
  const path =
    (import.meta.env.VITE_API_TRTC_USER_SIG_PATH || "").trim() ||
    "/trtc/user-sig";
  return service
    .post<BaseResponse<TrtcUserSigData>>(path, {})
    .then((response) => unwrapApiResponseData<TrtcUserSigData>(response)) as Promise<TrtcUserSigData>;
}
