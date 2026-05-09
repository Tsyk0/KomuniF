import { defineStore } from "pinia";
import { ref } from "vue";
import { fetchOriginImagePreviewUrlNormalized } from "@/normalize/message";

export const useImagePreviewStore = defineStore("imagePreview", () => {
  const visible = ref(false);
  const imageUrl = ref("");
  const loading = ref(false);
  const error = ref<string | null>(null);
  /** 当前预览 object URL；用于关闭预览时释放浏览器内存 */
  const currentPreviewObjectUrl = ref<string | null>(null);

  /**
   * 打开原图预览。
   * 使用场景：消息列表点击图片缩略图后，请求 `/play` 原图并展示弹层（非 `/download`）。
   */
  const openPreviewByPlayUrl = async (playUrl: string) => {
    if (!playUrl) return;
    loading.value = true;
    error.value = null;
    try {
      const previewUrl = await fetchOriginImagePreviewUrlNormalized(playUrl);
      if (currentPreviewObjectUrl.value) {
        URL.revokeObjectURL(currentPreviewObjectUrl.value);
      }
      currentPreviewObjectUrl.value = previewUrl;
      imageUrl.value = previewUrl;
      visible.value = true;
    } catch (previewError) {
      console.error("获取原图失败:", previewError);
      error.value = "获取原图失败，请稍后重试";
      visible.value = false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 关闭原图预览并清理资源。
   * 使用场景：点击弹层非图片区域，或切会话/组件卸载时统一收尾。
   */
  const closePreview = () => {
    visible.value = false;
    imageUrl.value = "";
    error.value = null;
    if (currentPreviewObjectUrl.value) {
      URL.revokeObjectURL(currentPreviewObjectUrl.value);
      currentPreviewObjectUrl.value = null;
    }
  };

  return {
    visible,
    imageUrl,
    loading,
    error,
    openPreviewByPlayUrl,
    closePreview,
  };
});
