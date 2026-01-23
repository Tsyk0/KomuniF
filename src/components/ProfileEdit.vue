<template>
  <!-- 在根元素上添加 profile-edit 类名 -->
  <div class="profile-edit profile-edit-container">
    <div class="edit-header">
      <button class="back-btn" @click="$emit('back')" v-ripple>
        <span>←</span> 返回
      </button>
      <h2>编辑个人资料</h2>
      <button
        class="save-btn"
        @click="saveProfile"
        :disabled="saving"
        v-ripple="{ color: 'rgba(0, 119, 230, 0.3)', duration: 600 }"
      >
        {{ saving ? "保存中..." : "保存" }}
      </button>
    </div>

    <div class="edit-content">
      <!-- 左半部分：头像区域 -->
      <div class="avatar-section">
        <div class="avatar-display" @click="triggerAvatarUpload">
          <div v-if="formData.userAvatar" class="avatar-img-container">
            <img :src="formData.userAvatar" class="avatar-img" />
            <div class="avatar-overlay"></div>
          </div>
          <div v-else class="avatar-placeholder-large">
            {{ formData.userNickname?.charAt(0) || " " }}
            <div class="upload-hint">点击上传头像</div>
          </div>
        </div>

        <input
          type="file"
          ref="avatarInput"
          accept="image/*"
          @change="handleAvatarUpload"
          style="display: none"
        />

        <div class="avatar-info">
          <p class="avatar-hint">支持 JPG、PNG 格式</p>
          <p class="avatar-hint">最大 2MB</p>
          <p class="avatar-hint">点击头像选择图片</p>
        </div>
      </div>

      <!-- 右半部分：基本信息表单 -->
      <div class="form-section">
        <!-- 新增表单内容容器 -->
        <div class="form-content">
          <div class="form-group">
            <label for="userNickname">昵称 *</label>
            <input
              id="userNickname"
              v-model="formData.userNickname"
              type="text"
              placeholder="请输入昵称"
              class="el-input"
              maxlength="20"
              @keyup.enter="saveProfile"
            />
            <div class="char-count">
              {{ formData.userNickname?.length || 0 }}/20
            </div>
          </div>

          <div class="form-group">
            <label for="userGender">性别</label>
            <div class="gender-options">
              <label
                class="gender-option"
                :class="{ active: formData.userGender === 0 }"
              >
                <input
                  type="radio"
                  v-model="formData.userGender"
                  :value="0"
                  style="display: none"
                />
                <span class="gender-icon">⚪</span>
                <span>未知</span>
              </label>
              <label
                class="gender-option"
                :class="{ active: formData.userGender === 1 }"
              >
                <input
                  type="radio"
                  v-model="formData.userGender"
                  :value="1"
                  style="display: none"
                />
                <span class="gender-icon">♂️</span>
                <span>男</span>
              </label>
              <label
                class="gender-option"
                :class="{ active: formData.userGender === 2 }"
              >
                <input
                  type="radio"
                  v-model="formData.userGender"
                  :value="2"
                  style="display: none"
                />
                <span class="gender-icon">♀️</span>
                <span>女</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label for="userBirthday">生日</label>
            <input
              id="userBirthday"
              v-model="formData.userBirthday"
              type="date"
              class="el-input"
            />
          </div>

          <div class="form-group">
            <label for="userLocation">所在地</label>
            <input
              id="userLocation"
              v-model="formData.userLocation"
              type="text"
              placeholder="请输入所在地"
              class="el-input"
              maxlength="50"
              @keyup.enter="saveProfile"
            />
          </div>

          <div class="form-group">
            <label for="userSignature">个性签名</label>
            <textarea
              id="userSignature"
              v-model="formData.userSignature"
              placeholder="介绍一下自己吧～"
              class="el-textarea"
              rows="3"
              maxlength="100"
              @keyup.enter="saveProfile"
            ></textarea>
            <div class="char-count">
              {{ formData.userSignature?.length || 0 }}/100
            </div>
          </div>

          <div class="form-group">
            <label for="userPhone">手机号</label>
            <input
              id="userPhone"
              v-model="formData.userPhone"
              type="tel"
              placeholder="请输入手机号"
              class="el-input"
              maxlength="11"
              @keyup.enter="saveProfile"
            />
          </div>

          <div class="form-group">
            <label for="userEmail">邮箱</label>
            <input
              id="userEmail"
              v-model="formData.userEmail"
              type="email"
              placeholder="请输入邮箱"
              class="el-input"
              maxlength="50"
              @keyup.enter="saveProfile"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button class="cancel-btn" @click="resetForm" v-ripple>
        <span class="btn-icon">↺</span>
        重置
      </button>
    </div>
  </div>
</template>


<script>
import { ref, reactive, onMounted, watch } from "vue";
import { useUserStore } from "@/stores/user";
import toast from "@/commons/utils/toast"; // 导入独立的toast服务

export default {
  name: "ProfileEdit",
  props: {
    userData: {
      type: Object,
      required: true,
    },
  },
  emits: ["back", "update:userData"],
  setup(props, { emit }) {
    const userStore = useUserStore();
    const avatarInput = ref(null);
    const saving = ref(false);

    // 表单数据
    const formData = reactive({
      userId: "",
      userNickname: "",
      userAvatar: "",
      userGender: 0,
      userBirthday: "",
      userLocation: "",
      userSignature: "",
      userPhone: "",
      userEmail: "",
    });

    // 原始数据备份
    const originalData = ref(null);

    // 初始化表单数据
    const initFormData = () => {
      Object.assign(formData, {
        userId: props.userData.userId || "",
        userNickname: props.userData.userNickname || "",
        userAvatar: props.userData.userAvatar || "",
        userGender: props.userData.userGender || 0,
        userBirthday: formatDateForInput(props.userData.userBirthday),
        userLocation: props.userData.userLocation || "",
        userSignature: props.userData.userSignature || "",
        userPhone: props.userData.userPhone || "",
        userEmail: props.userData.userEmail || "",
      });

      originalData.value = JSON.parse(JSON.stringify(formData));
    };

    // 日期格式化
    const formatDateForInput = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    };

    // 图片压缩
    const compressImage = (
      file,
      maxWidth = 400,
      maxHeight = 400,
      quality = 0.7
    ) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width *= ratio;
              height *= ratio;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
            resolve(compressedBase64);
          };
          img.onerror = reject;
          img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    // 表单验证
    const validateForm = () => {
      if (!formData.userNickname?.trim()) {
        toast.error("昵称不能为空");
        return false;
      }

      if (formData.userPhone && !/^1[3-9]\d{9}$/.test(formData.userPhone)) {
        toast.error("请输入有效的手机号");
        return false;
      }

      if (
        formData.userEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)
      ) {
        toast.error("请输入有效的邮箱地址");
        return false;
      }

      return true;
    };

    // 保存资料
    const saveProfile = async () => {
      if (!validateForm()) return;

      saving.value = true;

      try {
        const userUpdateData = {
          userId: formData.userId,
          userNickname: formData.userNickname?.trim(),
          userGender: formData.userGender,
          userBirthday: formData.userBirthday || null,
          userLocation: formData.userLocation?.trim() || null,
          userSignature: formData.userSignature?.trim() || null,
          userPhone: formData.userPhone?.trim() || null,
          userEmail: formData.userEmail?.trim() || null,
        };

        if (
          formData.userAvatar &&
          formData.userAvatar.startsWith("data:image/")
        ) {
          userUpdateData.userAvatar = formData.userAvatar;
        }

        const result = await userStore.updateUser(userUpdateData);

        if (!result.success) {
          toast.error("更新用户信息失败: " + result.message);
          return;
        }

        const latestResult = await userStore.fetchUserById(formData.userId);

        if (latestResult.success) {
          emit("update:userData", latestResult.data);
          toast.success("个人信息修改成功！");
        } else {
          toast.warning("个人信息已更新，但部分信息同步失败");
        }
      } catch (error) {
        console.error("保存资料失败:", error);
        toast.error("保存失败，请稍后重试");
      } finally {
        saving.value = false;
      }
    };

    // 触发头像上传
    const triggerAvatarUpload = () => {
      avatarInput.value.click();
    };

    // 处理头像上传
    const handleAvatarUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        toast.error("图片大小不能超过2MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("请选择图片文件");
        return;
      }

      try {
        saving.value = true;
        const compressedBase64 = await compressImage(file, 400, 400, 0.7);
        formData.userAvatar = compressedBase64;
        toast.success("头像上传成功");
      } catch (error) {
        console.error("图片处理失败:", error);
        toast.error("图片处理失败，请重试");
      } finally {
        saving.value = false;
        event.target.value = "";
      }
    };

    // 重置表单
    const resetForm = () => {
      if (confirm("确定要重置所有修改吗？")) {
        Object.assign(formData, JSON.parse(JSON.stringify(originalData.value)));
        toast.info("表单已重置");
      }
    };

    // 监听props变化
    watch(() => props.userData, initFormData, { immediate: true });

    return {
      avatarInput,
      saving,
      formData,
      saveProfile,
      triggerAvatarUpload,
      handleAvatarUpload,
      resetForm,
    };
  },
};
</script>

<style scoped>
/* 使用外部样式 */
@import "@/assets/styles/base.css";
@import "@/assets/styles/profile-edit.css";
/* 移除toast.css的导入，因为使用独立的toast服务 */
</style>