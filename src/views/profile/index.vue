<template>
  <div class="main">
    <h3 class="page-title">个人中心</h3>
    <el-row :gutter="20">
      <!-- 左侧：基本信息 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span class="card-title">基本信息</span>
          </template>

          <el-form
            ref="infoFormRef"
            :model="infoForm"
            :rules="infoRules"
            label-position="top"
          >
            <el-form-item label="用户名">
              <el-input v-model="infoForm.username" disabled />
            </el-form-item>
            <el-form-item label="昵称" prop="nickname">
              <el-input
                v-model="infoForm.nickname"
                placeholder="请输入昵称"
                clearable
              />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="infoForm.email"
                placeholder="请输入邮箱"
                clearable
              />
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input
                v-model="infoForm.phone"
                placeholder="请输入手机号"
                clearable
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="infoLoading"
                @click="handleUpdateInfo"
              >
                保存
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右侧：修改密码 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span class="card-title">修改密码</span>
          </template>

          <el-form
            ref="pwdFormRef"
            :model="pwdForm"
            :rules="pwdRules"
            label-position="top"
          >
            <el-form-item label="旧密码" prop="oldPassword">
              <el-input
                v-model="pwdForm.oldPassword"
                type="password"
                placeholder="请输入旧密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="pwdForm.newPassword"
                type="password"
                placeholder="请输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="pwdForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="pwdLoading"
                @click="handleUpdatePassword"
              >
                确认
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "@/utils/message";
import {
  getUserInfo,
  updateCurrentUser,
  updateCurrentUserPassword
} from "@/api/system";
import { useUserStoreHook } from "@/store/modules/user";
import type { FormInstance, FormRules } from "element-plus";

defineOptions({ name: "Profile" });

const userStore = useUserStoreHook();

// 用户信息
const userInfo = ref<any>({});

// 基本信息表单
const infoFormRef = ref<FormInstance>();
const infoLoading = ref(false);
const infoForm = reactive({
  username: "",
  nickname: "",
  avatar: "",
  phone: "",
  email: ""
});

const infoRules: FormRules = {
  nickname: [{ max: 50, message: "昵称最多50个字符", trigger: "blur" }],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: "手机号格式不正确", trigger: "blur" }
  ],
  email: [{ type: "email", message: "邮箱格式不正确", trigger: "blur" }]
};

// 密码表单
const pwdFormRef = ref<FormInstance>();
const pwdLoading = ref(false);
const pwdForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
});

// 密码正则（密码格式应为8-18位数字、字母、符号的任意两种组合）
const REGEXP_PWD =
  /^(?![0-9]+$)(?![a-z]+$)(?![A-Z]+$)(?!([^(0-9a-zA-Z)]|[()])+$)(?!^.*[\u4E00-\u9FA5].*$)([^(0-9a-zA-Z)]|[()]|[a-z]|[A-Z]|[0-9]){8,18}$/;

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== pwdForm.newPassword) {
    callback(new Error("两次输入的密码不一致"));
  } else {
    callback();
  }
};

const pwdRules: FormRules = {
  oldPassword: [{ required: true, message: "请输入原密码", trigger: "blur" }],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    {
      pattern: REGEXP_PWD,
      message: "密码格式应为8-18位数字、字母、符号的任意两种组合",
      trigger: "blur"
    }
  ],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    { validator: validateConfirmPassword, trigger: "blur" }
  ]
};

// 获取用户信息
const fetchUserInfo = async () => {
  const res = await getUserInfo();
  if (res.code === 200) {
    userInfo.value = res.data;
    // 填充表单
    infoForm.username = res.data.username || "";
    infoForm.nickname = res.data.nickname || "";
    infoForm.avatar = res.data.avatar || "";
    infoForm.phone = res.data.phone || "";
    infoForm.email = res.data.email || "";
  }
};

// 更新基本信息
const handleUpdateInfo = async () => {
  if (!infoFormRef.value) return;
  await infoFormRef.value.validate(async valid => {
    if (valid) {
      infoLoading.value = true;
      try {
        const { username, ...updateData } = infoForm;
        const res = await updateCurrentUser(updateData);
        if (res.code === 200) {
          message("修改成功", { type: "success" });
          // 更新 store 中的用户信息
          if (infoForm.nickname) userStore.SET_NICKNAME(infoForm.nickname);
          if (infoForm.avatar) userStore.SET_AVATAR(infoForm.avatar);
          fetchUserInfo();
        } else {
          message(res.message, { type: "error" });
        }
      } finally {
        infoLoading.value = false;
      }
    }
  });
};

// 修改密码
const handleUpdatePassword = async () => {
  if (!pwdFormRef.value) return;
  await pwdFormRef.value.validate(async valid => {
    if (valid) {
      pwdLoading.value = true;
      try {
        const res = await updateCurrentUserPassword({
          oldPassword: pwdForm.oldPassword,
          newPassword: pwdForm.newPassword
        });
        if (res.code === 200) {
          message("密码修改成功，请重新登录", { type: "success" });
          // 重置表单
          pwdForm.oldPassword = "";
          pwdForm.newPassword = "";
          pwdForm.confirmPassword = "";
          // 延迟登出
          setTimeout(() => {
            userStore.logOut();
          }, 1500);
        } else {
          message(res.message, { type: "error" });
        }
      } finally {
        pwdLoading.value = false;
      }
    }
  });
};

onMounted(() => {
  fetchUserInfo();
});
</script>

<style scoped lang="scss">
.page-title {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 500;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
}

:deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #e4e7ed;
}
</style>
