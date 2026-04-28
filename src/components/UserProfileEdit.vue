<!-- File: src/components/UserProfileEdit.vue -->
<template>
  <!-- 在根元素上添加 user-profile-edit 类名 -->
  <div class="user-profile-edit user-profile-edit-container">
    <div class="edit-header">
      <button
        class="back-btn profile-back-btn"
        @click="$emit('back')"
        v-ripple
        type="button"
        aria-label="返回"
      >
        <ArrowLeft :size="20" :stroke-width="2.2" />
      </button>
      <h2>编辑个人资料</h2>
      <button
        class="save-btn"
        @click="saveProfile"
        :disabled="saving"
        v-ripple="{ color: 'rgba(0, 119, 230, 0.3)', duration: 600 }"
        type="button"
        aria-label="保存"
        title="保存"
      >
        <done-all
          theme="outline"
          size="24"
          :fill="saving ? '#9ca3af' : 'currentColor'"
        />
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
            <label for="userNickname">昵称</label>
            <el-input
              id="userNickname"
              v-model="formData.userNickname"
              placeholder="请输入昵称"
              maxlength="20"
              @keyup.enter="saveProfile"
            />
            <div class="char-count">
              {{ formData.userNickname?.length || 0 }}/20
            </div>
          </div>

          <div class="form-group form-group-gender">
            <label for="userGender">性别</label>
            <el-radio-group v-model="formData.userGender" class="gender-radio-group">
              <el-radio-button
                :value="0"
                :label="0"
                class="gender-option-unknown"
                title="未知"
              >
                <User :size="14" class="gender-lucide-icon" /> 未知
              </el-radio-button>
              <el-radio-button
                :value="1"
                :label="1"
                class="gender-option-male"
                title="男"
              >
                <Mars :size="14" class="gender-lucide-icon" /> 男
              </el-radio-button>
              <el-radio-button
                :value="2"
                :label="2"
                class="gender-option-female"
                title="女"
              >
                <Venus :size="14" class="gender-lucide-icon" /> 女
              </el-radio-button>
            </el-radio-group>
          </div>

          <div class="form-group form-group-birthday">
            <label for="userBirthday">生日</label>
            <el-date-picker
              id="userBirthday"
              v-model="formData.userBirthday"
              type="date"
              value-format="YYYY-MM-DD"
              format="YYYY-MM-DD"
              placeholder="请选择生日"
            />
          </div>

          <div class="form-group">
            <label for="userLocation">所在地</label>
            <el-input
              id="userLocation"
              v-model="formData.userLocation"
              placeholder="请输入所在地"
              maxlength="50"
              @keyup.enter="saveProfile"
            />
          </div>

          <div class="form-group form-group-signature">
            <label for="userSignature">个性签名</label>
            <el-input
              id="userSignature"
              v-model="formData.userSignature"
              type="textarea"
              placeholder="介绍一下自己吧～"
              rows="3"
              maxlength="100"
              @keyup.enter="saveProfile"
            />
            <div class="char-count">
              {{ formData.userSignature?.length || 0 }}/100
            </div>
          </div>

          <div class="form-group">
            <label for="userPhone">手机号</label>
            <el-input
              id="userPhone"
              v-model="formData.userPhone"
              placeholder="请输入手机号"
              maxlength="11"
              @keyup.enter="saveProfile"
            />
          </div>

          <div class="form-group">
            <label for="userEmail">邮箱</label>
            <el-input
              id="userEmail"
              v-model="formData.userEmail"
              placeholder="请输入邮箱"
              maxlength="50"
              @keyup.enter="saveProfile"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button
        class="cancel-btn"
        @click="resetForm"
        v-ripple
        type="button"
        aria-label="重置"
        title="重置"
      >
        <RotateCcw class="btn-icon" :size="18" :stroke-width="2.2" />
      </button>
    </div>
  </div>
</template>


<script>
import { ref, reactive, onMounted, watch } from "vue";
import { DoneAll } from "@icon-park/vue-next";
import { ArrowLeft, Mars, RotateCcw, User, Venus } from "lucide-vue-next";
import { useUserStore } from "@/store/user/user";
import toast from "@/commons/utils/toast"; // 导入独立的toast服务
import {
  compressImageToBase64,
  validateImageFile,
} from "@/commons/utils/image";
import {
  buildProfileFormData,
  buildUserProfileUpdatePayload,
  mapAvatarUploadError,
  mapUserProfileSaveError,
  shouldResetProfileForm,
  validateUserProfileForm,
} from "@/interactions/userProfileEdit/UserProfileEditInteraction";

export default {
  name: "UserProfileEdit",
  components: {
    DoneAll,
    ArrowLeft,
    User,
    Mars,
    Venus,
    RotateCcw,
  },
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
      Object.assign(formData, buildProfileFormData(props.userData));

      originalData.value = JSON.parse(JSON.stringify(formData));
    };

    // 表单验证
    const validateForm = () => {
      const msg = validateUserProfileForm(formData);
      if (msg) {
        toast.error(msg);
        return false;
      }
      return true;
    };

    // 保存资料
    const saveProfile = async () => {
      if (!validateForm()) return;

      saving.value = true;

      try {
        const userUpdateData = buildUserProfileUpdatePayload(formData);

        const result = await userStore.updateUser(userUpdateData);

        if (!result.success) {
          toast.error("更新用户信息失败: " + result.message);
          return;
        }

        const uid = Number(formData.userId);
        if (!uid) {
          toast.error("用户ID无效，无法同步最新信息");
          return;
        }

        const latestResult = await userStore.fetchUserById(uid);

        if (latestResult.success && latestResult.data) {
          emit("update:userData", latestResult.data);
          toast.success("个人信息修改成功！");
        } else {
          toast.error("更新成功，但无法获取最新信息，请刷新页面");
        }
      } catch (error) {
        console.error("保存资料失败:", error);
        toast.error(mapUserProfileSaveError(error));
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
      const validation = validateImageFile(file, {
        maxSizeBytes: 2 * 1024 * 1024,
      });
      if (!validation.ok) {
        if (validation.message) toast.error(validation.message);
        return;
      }

      try {
        saving.value = true;
        const compressedBase64 = await compressImageToBase64(
          file,
          400,
          400,
          0.7
        );
        formData.userAvatar = compressedBase64;
        toast.success("头像上传成功");
      } catch (error) {
        console.error("图片处理失败:", error);
        toast.error(mapAvatarUploadError(error));
      } finally {
        saving.value = false;
        event.target.value = "";
      }
    };

    // 重置表单
    const resetForm = () => {
      if (shouldResetProfileForm(confirm)) {
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
@import "@/assets/styles/user-profile-edit.css";
@import "@/assets/styles/night/user-profile-edit-night.css";
/* 移除toast.css的导入，因为使用独立的toast服务 */
</style>
