import { ref, computed, onUnmounted } from "vue";
import {
  readIflytekRtasrLlmEnv,
  buildIflytekRtasrLlmWsUrl,
  extractIflytekTranscriptFromData,
  extractIflytekSentenceType,
} from "@/commons/iflytek/rtasrLlm";

export type IflytekAsrPhase = "idle" | "mic" | "ws" | "live" | "error";

export type UseIflytekRtasrLlmOptions = {
  onFullText: (text: string) => void;
  onNotify: (message: string) => void;
};

const PCM_CHUNK_BYTES = 1280;
const SEND_INTERVAL_MS = 40;

/**
 * 生成握手用的 uuid：官方示例为 32 位十六进制、无连字符。
 * 使用场景：与文档示例格式对齐，降低服务端拒连概率。
 */
function randomIflytekSessionUuid(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * 将麦克风流式 PCM（16kHz / s16le）经讯飞大模型实时转写并回填文本。
 * 使用场景：聊天 composer `asr-mic-button` 切换听写（替代不稳定 Web Speech）。
 */
export function useIflytekRtasrLlm(options: UseIflytekRtasrLlmOptions) {
  const env = readIflytekRtasrLlmEnv();
  const phase = ref<IflytekAsrPhase>("idle");
  const isSupported = computed(
    () =>
      env.configured &&
      typeof WebSocket !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      !!globalThis.crypto?.subtle
  );

  const isListening = computed(
    () =>
      phase.value === "mic" ||
      phase.value === "ws" ||
      phase.value === "live"
  );

  /** 本轮开始时的输入框前缀 */
  let sessionBase = "";
  /** 已确认的识别片段拼接 */
  let sessionCommitted = "";
  /** 当前一句的中间结果（type=1 时刷新） */
  let sessionInterim = "";

  let ws: WebSocket | null = null;
  let sessionId: string | null = null;
  let userStopped = false;
  let audioCtx: AudioContext | null = null;
  let mediaStream: MediaStream | null = null;
  let scriptProcessor: ScriptProcessorNode | null = null;
  let mediaSource: MediaStreamAudioSourceNode | null = null;
  let sendTimer: ReturnType<typeof setInterval> | null = null;
  /** 待发送的 PCM 字节队列（16kHz s16le） */
  let pcmPending = new Uint8Array(0);

  /**
   * Float32 音频 downsample 至 16kHz 并量化 int16。
   * 使用场景：ScriptProcessor 回调内统一送出 PCM。
   */
  const downsampleTo16kInt16 = (
    input: Float32Array,
    inputRate: number
  ): Int16Array => {
    if (inputRate === 16000) {
      const out = new Int16Array(input.length);
      for (let i = 0; i < input.length; i += 1) {
        const s = Math.max(-1, Math.min(1, input[i]!));
        out[i] = s < 0 ? (s * 0x8000) | 0 : (s * 0x7fff) | 0;
      }
      return out;
    }
    const ratio = inputRate / 16000;
    const outLen = Math.max(1, Math.floor(input.length / ratio));
    const temp = new Float32Array(outLen);
    for (let i = 0; i < outLen; i += 1) {
      const start = Math.floor(i * ratio);
      const end = Math.min(Math.floor((i + 1) * ratio), input.length);
      let sum = 0;
      let count = 0;
      for (let j = start; j < end; j += 1) {
        sum += input[j]!;
        count += 1;
      }
      temp[i] = count ? sum / count : 0;
    }
    const out = new Int16Array(temp.length);
    for (let i = 0; i < temp.length; i += 1) {
      const s = Math.max(-1, Math.min(1, temp[i]!));
      out[i] = s < 0 ? (s * 0x8000) | 0 : (s * 0x7fff) | 0;
    }
    return out;
  };

  /**
   * int16 PCM 小端字节写入待发送缓冲。
   * 使用场景：与讯飞「每 40ms 1280 字节」建议对齐的发送循环。
   */
  const enqueueInt16Pcm = (samples: Int16Array) => {
    const buf = new ArrayBuffer(samples.length * 2);
    const view = new DataView(buf);
    for (let i = 0; i < samples.length; i += 1) {
      view.setInt16(i * 2, samples[i]!, true);
    }
    const chunk = new Uint8Array(buf);
    const next = new Uint8Array(pcmPending.length + chunk.length);
    next.set(pcmPending);
    next.set(chunk, pcmPending.length);
    pcmPending = next;
  };

  const pushDisplay = () => {
    options.onFullText(sessionBase + sessionCommitted + sessionInterim);
  };

  /**
   * 处理服务端下行 JSON（started / result / error）。
   * 使用场景：`WebSocket.onmessage` text 帧。
   */
  const handleDownlinkJson = (raw: string): boolean => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return false;
    }
    const p = parsed as Record<string, unknown>;

    if (p.action === "error") {
      const desc = typeof p.desc === "string" ? p.desc : "语音识别失败";
      options.onNotify(desc);
      phase.value = "error";
      return true;
    }

    if (p.action === "started" && String(p.code) === "0") {
      if (typeof p.sid === "string") sessionId = p.sid;
      const data = p.data as Record<string, unknown> | undefined;
      if (
        !sessionId &&
        data &&
        typeof data.sessionId === "string" &&
        data.sessionId.length > 0
      ) {
        sessionId = data.sessionId;
      }
      return false;
    }

    if (p.msg_type === "result" && p.res_type === "frc") {
      const data = p.data as Record<string, unknown> | undefined;
      const desc =
        data && typeof data.desc === "string" ? data.desc : "语音识别异常";
      options.onNotify(desc);
      phase.value = "error";
      return true;
    }

    if (p.msg_type === "result" && p.res_type === "asr" && p.data) {
      const text = extractIflytekTranscriptFromData(p.data);
      const typ = extractIflytekSentenceType(p.data);
      applySegment(text, typ);
      return false;
    }

    if (p.action === "result" && typeof p.data === "string") {
      try {
        const inner = JSON.parse(p.data) as unknown;
        const text = extractIflytekTranscriptFromData(inner);
        const typ = extractIflytekSentenceType(inner);
        applySegment(text, typ);
      } catch {
        /* 非 JSON data */
      }
      return false;
    }

    return false;
  };

  /**
   * 按句子类型合并确定性文本与中间预览。
   * 使用场景：`type===1` 覆盖 interim，否则写入 committed。
   */
  const applySegment = (text: string, typ: string | undefined) => {
    const clean = text.trim();
    if (!clean && typ !== "1") return;
    if (typ === "1") {
      sessionInterim = text;
    } else {
      sessionCommitted += text;
      sessionInterim = "";
    }
    pushDisplay();
  };

  const stopSendLoop = () => {
    if (sendTimer != null) {
      clearInterval(sendTimer);
      sendTimer = null;
    }
  };

  const flushPcmToSocket = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    while (pcmPending.length >= PCM_CHUNK_BYTES) {
      ws.send(pcmPending.slice(0, PCM_CHUNK_BYTES));
      pcmPending = pcmPending.slice(PCM_CHUNK_BYTES);
    }
  };

  const teardownAudio = () => {
    stopSendLoop();
    pcmPending = new Uint8Array(0);
    try {
      scriptProcessor?.disconnect();
    } catch {
      /* noop */
    }
    scriptProcessor = null;
    try {
      mediaSource?.disconnect();
    } catch {
      /* noop */
    }
    mediaSource = null;
    if (audioCtx) {
      void audioCtx.close().catch(() => {});
      audioCtx = null;
    }
    mediaStream?.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  };

  const closeWs = () => {
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      try {
        ws.close();
      } catch {
        /* noop */
      }
      ws = null;
    }
  };

  /**
   * 用户点击停止：发送 end 帧再关闭连接。
   * 使用场景：`asr-mic-button` 第二次点击。
   */
  const stopListening = () => {
    userStopped = true;
    stopSendLoop();
    flushPcmToSocket();
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        const sid = sessionId ?? "";
        if (sid) {
          ws.send(JSON.stringify({ end: true, sessionId: sid }));
        } else {
          ws.send(JSON.stringify({ end: true }));
        }
      } catch {
        /* noop */
      }
      try {
        ws.close();
      } catch {
        /* noop */
      }
    }
    teardownAudio();
    ws = null;
    sessionId = null;
    phase.value = "idle";
  };

  /**
   * 启动麦克风 + WSS，进入实时转写。
   * 使用场景：首次点击「开始语音输入」。
   */
  const startListening = async (baseText: string) => {
    if (!isSupported.value) {
      options.onNotify(
        "语音输入不可用：请在环境变量中配置讯飞凭证，并使用支持麦克风的浏览器"
      );
      return;
    }
    if (phase.value === "mic" || phase.value === "ws" || phase.value === "live") {
      return;
    }
    userStopped = false;
    sessionBase = baseText;
    sessionCommitted = "";
    sessionInterim = "";
    phase.value = "mic";

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      phase.value = "idle";
      options.onNotify("需要麦克风权限才能使用语音输入");
      return;
    }
    mediaStream = stream;

    const uuid = randomIflytekSessionUuid();

    phase.value = "ws";
    let url: string;
    try {
      url = await buildIflytekRtasrLlmWsUrl({
        baseUrl: env.baseUrl,
        appId: env.appId,
        accessKeyId: env.accessKeyId,
        accessKeySecret: env.accessKeySecret,
        uuid,
      });
    } catch {
      phase.value = "error";
      teardownAudio();
      mediaStream = null;
      stream.getTracks().forEach((t) => t.stop());
      options.onNotify("语音识别签名失败，请检查密钥与环境变量");
      return;
    }

    const socket = new WebSocket(url);
    ws = socket;

    socket.onopen = () => {
      if (userStopped) return;
      phase.value = "live";
      try {
        audioCtx = new AudioContext();
      } catch {
        phase.value = "error";
        closeWs();
        teardownAudio();
        stream.getTracks().forEach((t) => t.stop());
        options.onNotify("无法创建音频上下文");
        return;
      }
      const ctx = audioCtx;
      const source = ctx.createMediaStreamSource(stream);
      mediaSource = source;
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      scriptProcessor = proc;
      proc.onaudioprocess = (ev) => {
        if (!audioCtx || userStopped) return;
        const input = ev.inputBuffer.getChannelData(0);
        const pcm = downsampleTo16kInt16(input, ctx.sampleRate);
        enqueueInt16Pcm(pcm);
      };
      source.connect(proc);
      const mute = ctx.createGain();
      mute.gain.value = 0;
      proc.connect(mute);
      mute.connect(ctx.destination);

      sendTimer = setInterval(() => {
        flushPcmToSocket();
      }, SEND_INTERVAL_MS);
    };

    socket.onmessage = (ev) => {
      if (typeof ev.data !== "string") return;
      const fatal = handleDownlinkJson(ev.data);
      if (fatal && !userStopped) {
        teardownAudio();
        closeWs();
      }
    };

    socket.onerror = () => {
      if (import.meta.env.DEV) {
        console.warn(
          "[Iflytek ASR] WebSocket error（请在 Network → WS 查看握手 HTTP 状态码，常见 403 为鉴权失败）"
        );
      }
      if (!userStopped) {
        options.onNotify("语音识别连接异常，请检查网络或服务状态");
        phase.value = "error";
      }
      teardownAudio();
      closeWs();
    };

    socket.onclose = (ev: CloseEvent) => {
      if (import.meta.env.DEV) {
        console.warn("[Iflytek ASR] WebSocket closed", {
          code: ev.code,
          reason: ev.reason || "(empty)",
          wasClean: ev.wasClean,
        });
      }
      teardownAudio();
      const wasUserStop = userStopped;
      ws = null;
      if (wasUserStop) {
        phase.value = "idle";
        return;
      }
      if (phase.value === "error") return;
      if (phase.value === "live") {
        options.onNotify("语音识别连接已关闭");
        phase.value = "error";
        return;
      }
      if (phase.value === "ws") {
        const hint =
          ev.code === 1006
            ? "无法连接语音识别（握手可能被服务端拒绝）。请核对：①控制台 APIKey→ACCESS_KEY_ID、APISecret→ACCESS_KEY_SECRET 勿写反；②已开通「实时语音转写大模型」；③在开发者工具 Network 中查看该 WS 请求的 HTTP 状态码。"
            : ev.reason?.trim()
              ? `连接已关闭：${ev.reason}`
              : `连接已关闭（code=${ev.code}）`;
        options.onNotify(hint);
        phase.value = "error";
      }
    };
  };

  /**
   * 组件卸载时释放资源。
   * 使用场景：`ChatContainer` 销毁。
   */
  const dispose = () => {
    userStopped = true;
    stopListening();
  };

  onUnmounted(() => {
    dispose();
  });

  return {
    isSupported,
    phase,
    isListening,
    startListening,
    stopListening,
    dispose,
  };
}
