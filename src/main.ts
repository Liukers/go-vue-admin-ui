// 屏蔽浏览器插件导致的错误（如翻译插件、密码管理器等）
window.addEventListener("error", event => {
  const errorMsg = event.message || "";
  const filename = event.filename || "";
  // 过滤浏览器插件的错误
  if (
    filename.includes("content.bundle.js") ||
    filename.includes("content_script") ||
    filename.includes("chrome-extension") ||
    (errorMsg.includes("setAttribute") && filename === "") ||
    errorMsg.includes("Cannot read properties of null")
  ) {
    event.preventDefault();
    if (import.meta.env.DEV) {
      console.warn("[Plugin Error Filtered]", errorMsg);
    }
    return;
  }
});

// 捕获未处理的 Promise 错误
window.addEventListener("unhandledrejection", event => {
  const errorMsg = String(event.reason);
  if (
    errorMsg.includes("setAttribute") ||
    errorMsg.includes("content.bundle.js")
  ) {
    event.preventDefault();
    if (import.meta.env.DEV) {
      console.warn("[Plugin Error Filtered]", errorMsg);
    }
    return;
  }
  // 非插件错误的 Promise 未捕获
  if (import.meta.env.DEV) {
    console.error("[Unhandled Promise Rejection]", event.reason);
  }
});

import App from "./App.vue";
import router from "./router";
import { setupStore } from "@/store";
import { getPlatformConfig } from "./config";
import { MotionPlugin } from "@vueuse/motion";
import { createApp, type Directive } from "vue";
import { useElementPlus } from "@/plugins/elementPlus";
import { injectResponsiveStorage } from "@/utils/responsive";

import Table from "@pureadmin/table";

// 引入重置样式
import "./style/reset.scss";
// 导入公共样式
import "./style/index.scss";
// 一定要在main.ts中导入tailwind.css，防止vite每次hmr都会请求src/style/index.scss整体css文件导致热更新慢的问题
import "./style/tailwind.css";
import "element-plus/dist/index.css";
// 导入字体图标
import "./assets/iconfont/iconfont.js";
import "./assets/iconfont/iconfont.css";

const app = createApp(App);

// Vue 全局错误处理器
app.config.errorHandler = (err, _vm, info) => {
  if (import.meta.env.DEV) {
    console.error("[Vue Error]", err, info);
  }
};

// 自定义指令
import * as directives from "@/directives";
Object.keys(directives).forEach(key => {
  app.directive(key, (directives as { [key: string]: Directive })[key]);
});

// 全局注册@iconify/vue图标库
import {
  IconifyIconOffline,
  IconifyIconOnline,
  FontIcon
} from "./components/ReIcon";
app.component("IconifyIconOffline", IconifyIconOffline);
app.component("IconifyIconOnline", IconifyIconOnline);
app.component("FontIcon", FontIcon);

// 全局注册按钮级别权限组件
import { Auth } from "@/components/ReAuth";
import { Perms } from "@/components/RePerms";
app.component("Auth", Auth);
app.component("Perms", Perms);

// 全局注册vue-tippy
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import VueTippy from "vue-tippy";
app.use(VueTippy);

getPlatformConfig(app).then(async config => {
  setupStore(app);
  app.use(router);
  await router.isReady();
  injectResponsiveStorage(app, config);
  app.use(MotionPlugin).use(useElementPlus).use(Table);
  app.mount("#app");
});
