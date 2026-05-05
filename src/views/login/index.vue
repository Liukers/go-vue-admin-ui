<template>
  <div ref="loginFormRef" class="select-none">
    <img :src="bg" class="wave" />
    <div class="flex-c absolute right-5 top-3">
      <!-- 主题 -->
      <el-switch
        v-model="dataTheme"
        inline-prompt
        :active-icon="dayIcon"
        :inactive-icon="darkIcon"
        @change="dataThemeChange"
      />
    </div>
    <div class="login-container">
      <div class="img">
        <component :is="toRaw(illustration)" />
      </div>
      <div class="login-box">
        <div class="login-form">
          <avatar class="avatar" />
          <Motion>
            <h2 class="outline-hidden">{{ title }}</h2>
          </Motion>

          <el-form
            ref="ruleFormRef"
            :model="ruleForm"
            :rules="loginRules"
            size="large"
          >
            <Motion :delay="100">
              <el-form-item
                :rules="[
                  {
                    required: true,
                    message: '请输入账号',
                    trigger: 'blur'
                  }
                ]"
                prop="username"
              >
                <el-input
                  v-model="ruleForm.username"
                  clearable
                  placeholder="账号"
                  :prefix-icon="useRenderIcon(User)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="150">
              <el-form-item prop="password">
                <el-input
                  v-model="ruleForm.password"
                  clearable
                  show-password
                  placeholder="密码"
                  :prefix-icon="useRenderIcon(Lock)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="180">
              <el-form-item prop="captchaCode">
                <div class="flex w-full gap-2">
                  <el-input
                    v-model="ruleForm.captchaCode"
                    clearable
                    placeholder="验证码"
                    :prefix-icon="useRenderIcon(Shield)"
                    class="flex-1"
                    @keyup.enter="onLogin(ruleFormRef)"
                  />
                  <div
                    class="captcha-img cursor-pointer rounded border border-[#dcdfe6]"
                    @click="refreshCaptcha"
                  >
                    <img
                      v-if="captchaImg"
                      :src="captchaImg"
                      alt="验证码"
                      class="h-[40px] w-[120px] rounded"
                    />
                    <div
                      v-else
                      class="flex h-[40px] w-[120px] items-center justify-center text-sm text-gray-400"
                    >
                      点击刷新
                    </div>
                  </div>
                </div>
              </el-form-item>
            </Motion>

            <Motion :delay="250">
              <el-button
                class="w-full mt-4!"
                size="default"
                type="primary"
                :loading="loading"
                :disabled="disabled"
                @click="onLogin(ruleFormRef)"
              >
                登录
              </el-button>
            </Motion>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Motion from "./utils/motion";
import { useRouter } from "vue-router";
import { message } from "@/utils/message";
import { loginRules } from "./utils/rule";
import { ref, reactive, toRaw, onMounted } from "vue";
import { debounce } from "@pureadmin/utils";
import { useNav } from "@/layout/hooks/useNav";
import { useEventListener } from "@vueuse/core";
import type { FormInstance } from "element-plus";
import { useLayout } from "@/layout/hooks/useLayout";
import { useUserStoreHook } from "@/store/modules/user";
import { initRouter, getTopMenu } from "@/router/utils";
import { bg, avatar, illustration } from "./utils/static";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { getCaptcha } from "@/api/system";
import { getErrorMessage } from "@/utils/errorCode";

import dayIcon from "@/assets/svg/day.svg?component";
import darkIcon from "@/assets/svg/dark.svg?component";
import Lock from "~icons/ri/lock-fill";
import User from "~icons/ri/user-3-fill";
import Shield from "~icons/ri/shield-keyhole-line";

defineOptions({
  name: "Login"
});

const router = useRouter();
const loading = ref(false);
const disabled = ref(false);
const ruleFormRef = ref<FormInstance>();
const captchaImg = ref("");
const loginFormRef = ref<HTMLDivElement | null>(null);

const { initStorage } = useLayout();
initStorage();

const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);
const { title } = useNav();

const ruleForm = reactive({
  username: import.meta.env.DEV ? "admin" : "",
  password: import.meta.env.DEV ? "admin123" : "",
  captchaId: "",
  captchaCode: ""
});

// 获取验证码
const fetchCaptcha = async () => {
  try {
    const res = await getCaptcha();
    if (res.code === 200) {
      ruleForm.captchaId = res.data.captchaId;
      captchaImg.value = res.data.captchaImg;
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("获取验证码失败:", error);
    }
    message("验证码加载失败，请刷新重试", { type: "error" });
  }
};

// 刷新验证码
const refreshCaptcha = () => {
  ruleForm.captchaCode = "";
  fetchCaptcha();
};

const onLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl || loading.value) return;
  await formEl.validate(valid => {
    if (valid) {
      loading.value = true;
      useUserStoreHook()
        .loginByUsername({
          username: ruleForm.username,
          password: ruleForm.password,
          captchaId: ruleForm.captchaId,
          captchaCode: ruleForm.captchaCode
        })
        .then(res => {
          if (res.code === 200) {
            return initRouter().then(() => {
              disabled.value = true;
              router
                .push(getTopMenu(true).path)
                .then(() => {
                  message("登录成功", { type: "success" });
                })
                .finally(() => (disabled.value = false));
            });
          } else {
            const msg = res.message || getErrorMessage(res.code);
            message(msg, { type: "error" });
            refreshCaptcha();
          }
        })
        .catch((err: any) => {
          message(err?.message || "网络异常，请稍后重试", { type: "error" });
          refreshCaptcha();
        })
        .finally(() => (loading.value = false));
    }
  });
};

const immediateDebounce = debounce(
  (formRef: FormInstance | undefined) => onLogin(formRef),
  1000,
  true
) as (formRef: FormInstance | undefined) => void;

useEventListener(loginFormRef, "keydown", ({ code }) => {
  if (
    ["Enter", "NumpadEnter"].includes(code) &&
    !disabled.value &&
    !loading.value
  )
    immediateDebounce(ruleFormRef.value);
});

onMounted(() => {
  fetchCaptcha();
});
</script>

<style scoped>
@import url("@/style/login.css");
</style>

<style lang="scss" scoped>
:deep(.el-input-group__append, .el-input-group__prepend) {
  padding: 0;
}

.captcha-img {
  overflow: hidden;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }

  img {
    display: block;
  }
}
</style>
