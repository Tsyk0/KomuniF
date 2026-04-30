<!-- File: src/components/ChangePassword.vue -->
<template>
  <div class="change-password-container">
    <div class="change-password-header">
      <button
        class="back-btn"
        @click="handleBack"
        v-ripple
        type="button"
        aria-label="返回"
        title="返回"
      >
        <ArrowLeft :size="22" :stroke-width="2.2" />
      </button>
      <h2>修改密码</h2>
    </div>

    <div class="change-password-form">
      <div class="form-group">
        <label for="currentNickname">当前用户</label>
        <input
          id="currentNickname"
          type="text"
          :value="userNickname"
          class="el-input disabled"
          disabled
          placeholder="当前用户名"
        />
      </div>

      <div class="form-group">
        <label for="currentPassword">原密码 *</label>
        <input
          id="currentPassword"
          v-model="formData.currentPassword"
          type="password"
          placeholder="请输入原密码"
          class="el-input"
          @input="clearErrors"
        />
        <div v-if="errors.currentPassword" class="error-message">
          {{ errors.currentPassword }}
        </div>
      </div>

      <div class="form-group">
        <label for="newPassword">新密码 *</label>
        <input
          id="newPassword"
          v-model="formData.newPassword"
          type="password"
          placeholder="请输入新密码"
          class="el-input"
          @input="clearErrors"
        />
      </div>

      <div class="form-group">
        <label for="confirmPassword">确认新密码 *</label>
        <input
          id="confirmPassword"
          v-model="formData.confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          class="el-input"
          @input="clearErrors"
          @keyup.enter="handleSubmit"
        />
        <div v-if="errors.confirmPassword" class="error-message">
          {{ errors.confirmPassword }}
        </div>
      </div>

      <div class="password-requirements">
        <p>密码要求：</p>
        <ul>
          <li>至少6个字符</li>
          <li>建议包含字母、数字和特殊字符</li>
        </ul>
      </div>

      <button
        class="submit-btn"
        @click="handleSubmit"
        :disabled="loading || !isFormValid"
        v-ripple
        type="button"
        aria-label="提交修改密码"
        title="提交修改密码"
      >
        <LoaderCircle v-if="loading" :size="22" :stroke-width="2.2" class="submit-loading-icon" />
        <Check v-else :size="22" :stroke-width="2.2" />
      </button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed } from "vue";
import { ArrowLeft, Check, LoaderCircle } from "lucide-vue-next";
import { useUserStore } from "@/store/user/user";
import toast from "@/commons/utils/toast";
import {
  createEmptyChangePasswordErrors,
  createEmptyChangePasswordForm,
  isChangePasswordFormSubmittable,
  validateNewPasswordInput,
} from "@/interactions/changePassword/ChangePasswordInteraction";

export default {
  name: "ChangePassword",
  components: {
    ArrowLeft,
    Check,
    LoaderCircle,
  },
  props: {
    userNickname: {
      type: String,
      required: true,
    },
  },
  emits: ["back", "success"],
  setup(props, { emit }) {
    const userStore = useUserStore();
    const loading = ref(false);

    // 表单数据
    const formData = reactive(createEmptyChangePasswordForm());

    // 错误信息
    const errors = reactive(createEmptyChangePasswordErrors());

    // 表单验证
    const isFormValid = computed(() => {
      return isChangePasswordFormSubmittable(formData);
    });

    // 清除错误信息
    const clearErrors = () => {
      const empty = createEmptyChangePasswordErrors();
      errors.currentPassword = empty.currentPassword;
      errors.confirmPassword = empty.confirmPassword;
    };

    // 验证原密码
    // const validateCurrentPassword = async () => {
    //   try {
    //     const result = await userStore.checkUserPassword(
    //       props.userId,
    //       formData.currentPassword
    //     );

    //     if (!result.success) {
    //       errors.currentPassword = result.message;
    //       toast.error(result.message);
    //       return false;
    //     }
    //     return true;
    //   } catch (error) {
    //     console.error("验证原密码失败:", error);
    //     errors.currentPassword = "验证原密码失败，请检查网络连接";
    //     toast.error("验证原密码失败，请检查网络连接");
    //     return false;
    //   }
    // };

    // 验证新密码
    const validateNewPassword = () => {
      const validationMessage = validateNewPasswordInput(formData);
      if (validationMessage) {
        errors.confirmPassword = validationMessage;
        toast.error(validationMessage);
        return false;
      }
      return true;
    };

    // 提交表单
    const handleSubmit = async () => {
      // 清空之前的错误
      clearErrors();

      // 验证表单
      if (!validateNewPassword()) {
        return;
      }

      loading.value = true;

      try {
        // 验证原密码
        // const isValid = await validateCurrentPassword();
        // if (!isValid) {
        //   loading.value = false;
        //   return;
        // }

        // 更新密码
        const result = await userStore.updateUserPassword(
          formData.currentPassword,
          formData.newPassword
        );

        if (result.success) {
          // 重置表单
          resetForm();

          // 触发成功事件
          emit("success", "密码修改成功！");

          // 使用toast显示成功消息
          toast.success("密码修改成功！");
        } else {
          errors.confirmPassword = result.message;
          toast.error(result.message || "密码修改失败");
        }
      } catch (error) {
        console.error("修改密码失败:", error);
        errors.confirmPassword = "修改密码失败，请稍后重试";
        toast.error("修改密码失败，请稍后重试");
      } finally {
        loading.value = false;
      }
    };

    // 重置表单
    const resetForm = () => {
      const empty = createEmptyChangePasswordForm();
      formData.currentPassword = empty.currentPassword;
      formData.newPassword = empty.newPassword;
      formData.confirmPassword = empty.confirmPassword;
    };

    // 返回处理
    const handleBack = () => {
      emit("back");
    };

    return {
      loading,
      formData,
      errors,
      isFormValid,
      clearErrors,
      handleSubmit,
      handleBack,
    };
  },
};
</script>

<style scoped>
@import "@/assets/styles/base.css";
@import "@/assets/styles/change-password.css";
</style>