<template>
  <div class="change-password-container">
    <div class="change-password-header">
      <button class="back-btn" @click="handleBack" v-ripple>
        <span>←</span> 返回
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
      >
        {{ loading ? "处理中..." : "修改密码" }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed } from "vue";
import { useUserStore } from "@/stores/user";
import toast from "@/commons/utils/toast";

export default {
  name: "ChangePassword",
  props: {
    userId: {
      type: String,
      required: true,
    },
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
    const formData = reactive({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    // 错误信息
    const errors = reactive({
      currentPassword: "",
      confirmPassword: "",
    });

    // 表单验证
    const isFormValid = computed(() => {
      return (
        formData.currentPassword &&
        formData.newPassword &&
        formData.confirmPassword &&
        formData.newPassword === formData.confirmPassword &&
        formData.newPassword.length >= 6
      );
    });

    // 清除错误信息
    const clearErrors = () => {
      errors.currentPassword = "";
      errors.confirmPassword = "";
    };

    // 验证原密码
    const validateCurrentPassword = async () => {
      try {
        const result = await userStore.checkUserPassword(
          props.userId,
          formData.currentPassword
        );

        if (!result.success) {
          errors.currentPassword = result.message;
          toast.error(result.message);
          return false;
        }
        return true;
      } catch (error) {
        console.error("验证原密码失败:", error);
        errors.currentPassword = "验证原密码失败，请检查网络连接";
        toast.error("验证原密码失败，请检查网络连接");
        return false;
      }
    };

    // 验证新密码
    const validateNewPassword = () => {
      // 检查密码长度
      if (formData.newPassword.length < 6) {
        errors.confirmPassword = "新密码至少需要6个字符";
        toast.error("新密码至少需要6个字符");
        return false;
      }

      // 检查两次输入是否一致
      if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = "两次输入的新密码不一致";
        toast.error("两次输入的新密码不一致");
        return false;
      }

      // 检查新密码是否与原密码相同
      if (formData.newPassword === formData.currentPassword) {
        errors.confirmPassword = "新密码不能与原密码相同";
        toast.error("新密码不能与原密码相同");
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
        const isValid = await validateCurrentPassword();
        if (!isValid) {
          loading.value = false;
          return;
        }

        // 更新密码
        const result = await userStore.updateUserPassword(
          props.userId,
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
      formData.currentPassword = "";
      formData.newPassword = "";
      formData.confirmPassword = "";
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
@import "@/assets/styles/scrollbar.css";
</style>