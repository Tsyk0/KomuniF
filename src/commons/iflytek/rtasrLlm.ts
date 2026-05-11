/**
 * 讯飞开放平台「实时语音转写大模型」WebSocket 握手参数与结果解析。
 * 文档：https://www.xfyun.cn/doc/spark/asr_llm/rtasr_llm.html
 * 使用场景：`useIflytekRtasrLlm` 生成带签名的 wss URL，并解析下行 JSON。
 */

const DEFAULT_RTASR_LLM_WSS =
  "wss://office-api-ast-dx.iflyaisol.com/ast/communicate/v1";

const RTASR_LLM_PATH = "/ast/communicate/v1";

/**
 * 将环境变量里的 WSS 根地址规范为文档要求的完整路径。
 * 使用场景：官网只写域名 `wss://…iflyaisol.com/` 时自动补上 `/ast/communicate/v1`。
 */
function normalizeIflytekRtasrBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return DEFAULT_RTASR_LLM_WSS;
  try {
    const u = new URL(trimmed);
    const pathOnly = (u.pathname || "").replace(/\/$/, "") || "/";
    if (pathOnly === "/" || pathOnly === "") {
      u.pathname = RTASR_LLM_PATH;
    }
    return u.href.replace(/\/$/, "");
  } catch {
    return DEFAULT_RTASR_LLM_WSS;
  }
}

/**
 * 读取前端环境变量中的讯飞大模型实时转写配置（密钥勿写入仓库，使用 .env.local）。
 * 使用场景：composer 挂载前判断是否具备调用条件。
 */
export function readIflytekRtasrLlmEnv(): {
  baseUrl: string;
  appId: string;
  accessKeyId: string;
  accessKeySecret: string;
  configured: boolean;
} {
  const fromEnv = (import.meta.env.VITE_IFLYTEK_RTASR_WSS_URL || "").trim();
  const baseUrl = fromEnv
    ? normalizeIflytekRtasrBaseUrl(fromEnv)
    : DEFAULT_RTASR_LLM_WSS;
  const appId = (import.meta.env.VITE_IFLYTEK_APP_ID || "").trim();
  const accessKeyId = (import.meta.env.VITE_IFLYTEK_ACCESS_KEY_ID || "").trim();
  const accessKeySecret = (
    import.meta.env.VITE_IFLYTEK_ACCESS_KEY_SECRET || ""
  ).trim();
  return {
    baseUrl,
    appId,
    accessKeyId,
    accessKeySecret,
    configured: !!(appId && accessKeyId && accessKeySecret),
  };
}

/**
 * 生成接口要求的 utc 字符串（示例：2025-09-04T15:38:07+0800）。
 * 使用场景：握手 URL 参数 `utc`，需参与签名。
 */
export function formatIflytekRtasrUtc(date = new Date()): string {
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const h = pad2(date.getHours());
  const min = pad2(date.getMinutes());
  const s = pad2(date.getSeconds());
  const tzMin = -date.getTimezoneOffset();
  const sign = tzMin >= 0 ? "+" : "-";
  const ah = pad2(Math.floor(Math.abs(tzMin) / 60));
  const am = pad2(Math.abs(tzMin) % 60);
  return `${y}-${m}-${d}T${h}:${min}:${s}${sign}${ah}${am}`;
}

/**
 * HMAC-SHA1 后对摘要做 Base64，得到 signature。
 * 使用场景：讯飞文档「以 accessKeySecret 为密钥对 baseString 加密」。
 */
export async function iflytekHmacSha1Base64(
  secret: string,
  message: string
): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1)
    binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

export type IflytekHandshakeParams = {
  baseUrl: string;
  appId: string;
  accessKeyId: string;
  accessKeySecret: string;
  uuid: string;
  /** 默认 autodialect（中英 + 方言） */
  lang?: string;
};

/**
 * 按文档规则拼接 baseString 并生成完整 WebSocket URL（含 signature）。
 * 使用场景：`new WebSocket(url)` 握手。
 */
export async function buildIflytekRtasrLlmWsUrl(
  config: IflytekHandshakeParams
): Promise<string> {
  const utc = formatIflytekRtasrUtc();
  const params: Record<string, string> = {
    accessKeyId: config.accessKeyId,
    appId: config.appId,
    audio_encode: "pcm_s16le",
    lang: config.lang ?? "autodialect",
    samplerate: "16000",
    utc,
    uuid: config.uuid,
  };
  const sortedKeys = Object.keys(params).sort((a, b) =>
    a.localeCompare(b, "en")
  );
  const baseString = sortedKeys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k]!)}`)
    .join("&");
  const signature = await iflytekHmacSha1Base64(
    config.accessKeySecret,
    baseString
  );
  const qs = `${baseString}&signature=${encodeURIComponent(signature)}`;
  const base = config.baseUrl.replace(/\/$/, "");
  return base.includes("?") ? `${base}&${qs}` : `${base}?${qs}`;
}

type LooseRecord = Record<string, unknown>;

/**
 * 从大模型下行 `data` 对象中提取拼接后的可见文本（含标点类 cw）。
 * 使用场景：`msg_type=result` 且 `res_type=asr`。
 */
export function extractIflytekTranscriptFromData(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const cn = (data as LooseRecord).cn as LooseRecord | undefined;
  const st = cn?.st as LooseRecord | undefined;
  const rt = st?.rt;
  if (!Array.isArray(rt)) return "";
  let out = "";
  for (const seg of rt) {
    const ws = (seg as LooseRecord)?.ws;
    if (!Array.isArray(ws)) continue;
    for (const w of ws) {
      const cw = (w as LooseRecord)?.cw;
      if (!Array.isArray(cw)) continue;
      for (const c of cw) {
        const word = (c as LooseRecord)?.w;
        if (typeof word === "string") out += word;
      }
    }
  }
  return out;
}

/**
 * 读取句子类型：文档 type「0」确定性、「1」中间结果。
 * 使用场景：区分追加确定性文本或覆盖 interim 预览。
 */
export function extractIflytekSentenceType(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const cn = (data as LooseRecord).cn as LooseRecord | undefined;
  const st = cn?.st as LooseRecord | undefined;
  const t = st?.type;
  return t == null ? undefined : String(t);
}
