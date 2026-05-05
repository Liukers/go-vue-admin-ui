<template>
  <div class="welcome-container">
    <!-- 顶部欢迎卡片 -->
    <div class="welcome-card">
      <div class="welcome-content">
        <div class="welcome-header">
          <span class="wave-emoji">👋</span>
          <h1 class="welcome-title">欢迎回来，{{ nickname }}！</h1>
        </div>
        <p class="welcome-subtitle">
          今天是 {{ currentDate }} {{ currentTime }}，祝您工作愉快！
        </p>
        <div class="role-tag">
          <span class="role-label">所属角色：</span>
          <el-tag type="danger" effect="light" size="large">
            <el-icon><component :is="useRenderIcon(Role)" /></el-icon>
            {{ roleName }}
          </el-tag>
        </div>
      </div>
      <div class="welcome-decoration" />
    </div>

    <!-- 快捷入口和登录信息 -->
    <div class="bottom-section">
      <!-- 快捷入口 -->
      <el-card shadow="never" class="quick-links-card">
        <template #header>
          <div class="card-header-title">
            <span>快捷入口</span>
          </div>
        </template>
        <div v-if="quickLinks.length === 0" class="empty-text">
          暂无快捷入口
        </div>
        <div v-else class="quick-links-grid">
          <div
            v-for="link in quickLinks"
            :key="link.path"
            class="quick-link-item"
            @click="handleQuickLink(link.path)"
          >
            <div
              class="quick-link-icon"
              :style="{ background: link.bg, color: link.color }"
            >
              <component :is="useRenderIcon(link.icon)" />
            </div>
            <span class="quick-link-name">{{ link.name }}</span>
          </div>
        </div>
      </el-card>

      <!-- 登录信息 -->
      <el-card shadow="never" class="login-info-card">
        <template #header>
          <div class="card-header-title">
            <el-icon><component :is="useRenderIcon(User)" /></el-icon>
            <span>登录信息</span>
          </div>
        </template>
        <div>
          <div class="info-item">
            <el-icon><component :is="useRenderIcon(User)" /></el-icon>
            <span class="info-label">用户名：</span>
            <span class="info-value">{{ loginInfo.username }}</span>
          </div>
          <el-divider />
          <div class="info-item">
            <el-icon><component :is="useRenderIcon(Time)" /></el-icon>
            <span class="info-label">登录时间：</span>
            <span class="info-value">{{ loginInfo.loginTime || "-" }}</span>
          </div>
          <el-divider />
          <div class="info-item">
            <el-icon><component :is="useRenderIcon(Calendar)" /></el-icon>
            <span class="info-label">当前时间：</span>
            <span class="info-value">{{ currentTime }}</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useUserStoreHook } from "@/store/modules/user";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { useRouter } from "vue-router";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { getLoginLogList } from "@/api/system";

// 图标
import User from "~icons/ri/user-3-line";
import Role from "~icons/ri/shield-user-line";
import Time from "~icons/ri/time-line";
import Calendar from "~icons/ri/calendar-line";

// 菜单图标映射
import Home from "~icons/ri/home-4-line";
import UserManage from "~icons/ri/user-settings-line";
import RoleManage from "~icons/ri/admin-line";
import MenuManage from "~icons/ri/menu-line";
import Log from "~icons/ri/file-list-line";
import LoginLog from "~icons/ri/login-circle-line";
import Setting from "~icons/ri/settings-3-line";
import DefaultIcon from "~icons/ri/apps-line";

defineOptions({
  name: "Welcome"
});

const router = useRouter();
const userStore = useUserStoreHook();
const permissionStore = usePermissionStoreHook();

// 当前时间
const currentTime = ref("");
const currentDate = ref("");

// 登录信息
const loginInfo = ref({
  username: "",
  loginTime: "",
  currentTime: ""
});

// 获取用户信息
const nickname = computed(
  () => userStore.nickname || userStore.username || "管理员"
);
const roles = computed(() => userStore.roles || []);

// 格式化角色显示
const roleName = computed(() => {
  if (roles.value.includes("admin") || roles.value.includes("超级管理员")) {
    return "超级管理员";
  }
  return roles.value[0] || "普通用户";
});

// 图标名称到组件的映射
const iconComponents: Record<string, any> = {
  "ri:home-4-line": Home,
  "ri:user-settings-line": UserManage,
  "ri:admin-line": RoleManage,
  "ri:menu-line": MenuManage,
  "ri:file-list-line": Log,
  "ri:login-circle-line": LoginLog,
  "ri:settings-3-line": Setting,
  "ri:settings-4-line": Setting
};

// 默认颜色配置（按顺序循环使用）
const colorPalette = [
  { color: "#1890ff", bg: "#e6f7ff" },
  { color: "#52c41a", bg: "#f6ffed" },
  { color: "#722ed1", bg: "#f9f0ff" },
  { color: "#13c2c2", bg: "#e6fffb" },
  { color: "#fa8c16", bg: "#fff7e6" },
  { color: "#eb2f96", bg: "#fff0f6" },
  { color: "#faad14", bg: "#fffbe6" },
  { color: "#595959", bg: "#f5f5f5" }
];

// 获取可访问的菜单（快捷入口）
const quickLinks = computed(() => {
  const menus = permissionStore.wholeMenus || [];
  const links: any[] = [];
  let colorIndex = 0;

  const processMenu = (menu: any) => {
    // 处理目录下的子菜单
    if (menu.children && menu.children.length > 0) {
      menu.children.forEach((child: any) => {
        if (child.path && child.meta?.title && !child.meta?.hidden) {
          // 避免重复添加
          if (links.find(l => l.path === child.path)) {
            return;
          }

          // 从菜单的 meta.icon 获取图标
          const iconName = child.meta?.icon || "";
          let iconComponent = iconComponents[iconName];

          // 如果没有找到匹配的图标，使用默认图标
          if (!iconComponent) {
            // 尝试根据路径关键词匹配
            const path = child.path.toLowerCase();
            if (path.includes("user")) iconComponent = UserManage;
            else if (path.includes("role")) iconComponent = RoleManage;
            else if (path.includes("menu")) iconComponent = MenuManage;
            else if (path.includes("operation") || path.includes("log"))
              iconComponent = Log;
            else if (path.includes("login")) iconComponent = LoginLog;
            else if (path.includes("setting")) iconComponent = Setting;
            else iconComponent = DefaultIcon;
          }

          // 分配颜色（循环使用调色板）
          const colors = colorPalette[colorIndex % colorPalette.length];
          colorIndex++;

          links.push({
            name: child.meta.title,
            path: child.path,
            icon: iconComponent,
            ...colors
          });
        }
      });
    }
  };

  menus.forEach(processMenu);
  return links.slice(0, 14);
});

// 更新时间和日期
const updateTime = () => {
  const now = new Date();
  const days = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六"
  ];

  currentDate.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${days[now.getDay()]}`;
  currentTime.value = now.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  loginInfo.value.currentTime = `${currentDate.value} ${currentTime.value}`;
};

// 获取最近登录时间
const fetchLoginTime = async () => {
  try {
    const res = await getLoginLogList({ page: 1, pageSize: 1 });
    if (res.code === 200 && res.data.list.length > 0) {
      loginInfo.value.loginTime = res.data.list[0].createdAt;
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("获取登录时间失败:", error);
    }
  }
};

// 跳转到快捷入口
const handleQuickLink = (path: string) => {
  router.push(path);
};

let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  loginInfo.value.username = userStore.username || "";
  updateTime();
  timer = setInterval(updateTime, 1000);
  fetchLoginTime();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped lang="scss">
@keyframes wave {
  0%,
  100% {
    transform: rotate(0deg);
  }

  25% {
    transform: rotate(-10deg);
  }

  75% {
    transform: rotate(10deg);
  }
}

// 响应式
@media (width <= 768px) {
  .bottom-section {
    grid-template-columns: 1fr;
  }

  .quick-links-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.welcome-card {
  position: relative;
  padding: 24px 32px;
  margin-bottom: 20px;
  overflow: hidden;
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgb(102 126 234 / 30%);
}

.welcome-content {
  position: relative;
  z-index: 1;
  max-width: 600px;
}

.welcome-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.wave-emoji {
  font-size: 32px;
  animation: wave 2s ease-in-out infinite;
}

.welcome-title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
}

.welcome-subtitle {
  margin-bottom: 16px;
  font-size: 14px;
  opacity: 0.9;
}

.role-tag {
  display: flex;
  gap: 8px;
  align-items: center;
}

.role-label {
  font-size: 14px;
  opacity: 0.9;
}

.welcome-decoration {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  pointer-events: none;
  background: rgb(255 255 255 / 10%);
  border-radius: 50%;
}

// 主内容区

// 快捷入口卡片
.quick-links-card {
  :deep(.el-card__header) {
    padding: 15px 20px;
    border-bottom: none;
  }

  :deep(.el-card__body) {
    padding: 0;
  }
}

.card-header-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

.quick-links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
  padding: 20px;
}

.quick-link-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 10px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: var(--el-fill-color-light);

    .quick-link-icon {
      transform: scale(1.1);
    }
  }
}

.quick-link-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: 10px;
  font-size: 24px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.quick-link-name {
  font-size: 14px;
  text-align: center;
}

// 登录信息卡片
.login-info-card {
  height: fit-content;

  :deep(.el-card__header) {
    padding: 15px 20px;
    border-bottom: none;
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.info-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px 0;

  .el-icon {
    font-size: 16px;
    color: #909399;
  }
}

.info-label {
  min-width: 80px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.info-value {
  font-size: 14px;
  font-weight: 500;
}

:deep(.el-divider) {
  margin: 8px 0;
}

// 底部区域（快捷入口 + 登录信息）
.bottom-section {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  align-items: start;
}

.empty-text {
  padding: 40px 0;
  color: var(--el-text-color-secondary);
  text-align: center;
} // 顶部欢迎卡片
</style>
