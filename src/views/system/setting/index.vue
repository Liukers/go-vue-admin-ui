<template>
  <div class="main">
    <el-card v-loading="loading" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">
            <el-icon class="icon"
              ><component :is="useRenderIcon(Setting)"
            /></el-icon>
            系统设置
          </span>
          <div class="header-buttons">
            <el-button
              :icon="useRenderIcon(Refresh)"
              :loading="refreshing"
              @click="handleRefreshMenu"
            >
              刷新菜单
            </el-button>
            <el-button
              type="primary"
              :icon="useRenderIcon(CircleCheck)"
              :loading="saving"
              @click="handleSave"
            >
              保存设置
            </el-button>
          </div>
        </div>
      </template>

      <el-form :model="settingForm" label-width="180px" class="setting-form">
        <el-form-item label="操作日志记录">
          <el-switch
            v-model="settingForm.enableOperationLog"
            :active-value="1"
            :inactive-value="2"
            active-text="开启"
            inactive-text="关闭"
          />
          <div class="form-tip">
            开启后系统将记录所有用户的操作行为，包括请求路径、请求参数、响应数据等
          </div>
        </el-form-item>

        <el-form-item label="登录日志记录">
          <el-switch
            v-model="settingForm.enableLoginLog"
            :active-value="1"
            :inactive-value="2"
            active-text="开启"
            inactive-text="关闭"
          />
          <div class="form-tip">
            开启后系统将记录所有用户的登录行为，包括登录时间、IP地址、浏览器信息等
          </div>
        </el-form-item>

        <el-form-item v-if="settingForm.updatedAt" label="最后更新时间">
          <span class="text-muted">{{ settingForm.updatedAt }}</span>
        </el-form-item>
      </el-form>

      <el-divider />

      <div class="setting-notice">
        <h4>说明</h4>
        <ul>
          <li>开启日志功能会增加数据库的存储压力，建议定期清理日志数据</li>
          <li>关闭日志功能后，相关的操作日志和登录日志菜单将自动隐藏</li>
          <li>修改设置后需要点击「刷新菜单」按钮，侧边栏菜单会立即更新</li>
          <li>刷新菜单后无需重启服务，设置会立即生效</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "@/utils/message";
import {
  getSystemSetting,
  updateSystemSetting,
  type SystemSettingInfo
} from "@/api/system";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { initRouter } from "@/router/utils";
import { storageLocal } from "@pureadmin/utils";
import CircleCheck from "~icons/ep/circle-check";
import Setting from "~icons/ri/settings-3-line";
import Refresh from "~icons/ep/refresh";

defineOptions({
  name: "SystemSetting"
});

const loading = ref(false);
const saving = ref(false);

const settingForm = ref<SystemSettingInfo>({
  id: 0,
  enableOperationLog: 2,
  enableLoginLog: 2,
  createdAt: "",
  updatedAt: ""
});

const fetchSetting = async () => {
  loading.value = true;
  try {
    const res = await getSystemSetting();
    if (res.code === 200) {
      settingForm.value = res.data;
    } else {
      message(res.message, { type: "error" });
    }
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  saving.value = true;
  try {
    const res = await updateSystemSetting({
      enableOperationLog: settingForm.value.enableOperationLog,
      enableLoginLog: settingForm.value.enableLoginLog
    });
    if (res.code === 200) {
      message("保存成功，请刷新页面以更新菜单", { type: "success" });
      // 重新获取设置以更新时间
      fetchSetting();
      // 清除路由缓存，下次路由初始化时会重新获取
      storageLocal().removeItem("async-routes");
    } else {
      message(res.message, { type: "error" });
    }
  } finally {
    saving.value = false;
  }
};

const refreshing = ref(false);

// 刷新路由菜单
const handleRefreshMenu = async () => {
  refreshing.value = true;
  try {
    // 清除路由缓存
    storageLocal().removeItem("async-routes");
    // 重新初始化路由
    await initRouter();
    message("菜单已刷新", { type: "success" });
  } catch (error) {
    message("刷新菜单失败，请稍后重试", { type: "error" });
  } finally {
    refreshing.value = false;
  }
};

onMounted(() => {
  fetchSetting();
});
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.icon {
  margin-right: 8px;
  vertical-align: middle;
}

.setting-form {
  max-width: 600px;
  margin: 20px 0;
}

.form-tip {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.text-muted {
  color: var(--el-text-color-secondary);
}

.setting-notice {
  padding: 16px 20px;
  margin-top: 20px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.setting-notice h4 {
  margin: 0 0 10px;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.setting-notice ul {
  padding-left: 20px;
  margin: 0;
}

.setting-notice li {
  font-size: 13px;
  line-height: 1.8;
  color: var(--el-text-color-secondary);
}
</style>
