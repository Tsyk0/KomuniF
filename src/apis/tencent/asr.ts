import service from "@/apis/service";
import type { BaseResponse } from "@/types/dto/base";

export interface AsrTranscribeData {
  /** 识别得到的纯文本，可直接填入输入框或作为 text 消息发送 */
  text: string;
}

/**
 * 解包后端统一响应。
 * 使用场景：ASR 接口返回 `BaseResponse<T>` 时取出 `data`。
 */
const unwrapApiResponseData = <T>(response: any): T => {
  if (response?.data?.data !== undefined) return response.data.data as T;
  if (response?.data !== undefined && response?.code !== undefined)
    return response.data as T;
  return response as T;
};

/**
 * 上传短语音由后端调用腾讯云 ASR 并返回文本。
 * 使用场景：IM 按住说话录音结束后，将 Blob 转为文字再 `sendMessage`。
 */
export function transcribeSpeechApi(
  audio: Blob,
  /** 与后端、ASR 格式约定一致，例如 wav / webm */
  fileName = "speech.webm"
): Promise<AsrTranscribeData> {
  const path =
    (import.meta.env.VITE_API_ASR_TRANSCRIBE_PATH || "").trim() ||
    "/api/tencent/asr/transcribe";
  const formData = new FormData();
  formData.append("audio", audio, fileName);
  return service
    .post<BaseResponse<AsrTranscribeData>>(path, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((response) => unwrapApiResponseData<AsrTranscribeData>(response)) as Promise<AsrTranscribeData>;
}
