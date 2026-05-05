import { storeToRefs } from "pinia";
import { getConfig } from "@/config";
import { emitter } from "@/utils/mitt";
import Avatar from "@/assets/user.jpg";
import { getTopMenu } from "@/router/utils";
import { useFullscreen } from "@vueuse/core";
import type { routeMetaType } from "../types";
import { useRouter, useRoute } from "vue-router";
import { router, remainingPaths } from "@/router";
import { computed, type CSSProperties } from "vue";
import { useAppStoreHook } from "@/store/modules/app";
import { useUserStoreHook } from "@/store/modules/user";
import { useGlobal, isAllEmpty } from "@pureadmin/utils";
import { usePermissionStoreHook } from "@/store/modules/permission";
import ExitFullscreen from "~icons/ri/fullscreen-exit-fill";
import Fullscreen from "~icons/ri/fullscreen-fill";

export function useNav() {
  const route = useRoute();
  const pureApp = useAppStoreHook();
  const routers = useRouter().options.routes;
  const { isFullscreen, toggle } = useFullscreen();
  const { wholeMenus } = storeToRefs(usePermissionStoreHook());
  // 平台`layout`中所有`el-tooltip`的`effect`配置，默认`light`
  const tooltipEffect = getConfig()?.TooltipEffect ?? "light";

  const getDivStyle = computed((): CSSProperties => {
    return {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      overflow: "hidden"
    };
  });

  // 头像图片 URL（如果头像为空则使用文字头像）
  const userAvatar = computed(() => {
    return isAllEmpty(useUserStoreHook()?.avatar)
      ? Avatar
      : useUserStoreHook()?.avatar;
  });

  // 头像文本（显示昵称第一个字或用户名首字母大写）
  const userAvatarText = computed(() => {
    const nickname = useUserStoreHook()?.nickname;
    const username = useUserStoreHook()?.username;
    const name = isAllEmpty(nickname) ? username : nickname;
    if (!name || name === "") return "U";
    const nameStr = String(name);
    // 如果是中文，取第一个字
    if (/[\u4e00-\u9fa5]/.test(nameStr)) {
      return nameStr.charAt(0);
    }
    // 如果是英文，取首字母大写
    return nameStr.charAt(0).toUpperCase();
  });

  // 头像背景色（基于用户名生成固定颜色）
  const userAvatarBgColor = computed(() => {
    const username = useUserStoreHook()?.username || "";
    const colors = [
      "#409EFF", // 蓝色
      "#67C23A", // 绿色
      "#E6A23C", // 橙色
      "#F56C6C", // 红色
      "#909399", // 灰色
      "#9254DE", // 紫色
      "#FF6D6D", // 粉红
      "#36CFC9" // 青色
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  });

  // 是否显示图片头像（用户上传了头像图片时显示）
  const showAvatarImage = computed(() => {
    return !isAllEmpty(useUserStoreHook()?.avatar);
  });

  // 昵称（如果昵称为空则显示用户名）
  const username = computed(() => {
    return isAllEmpty(useUserStoreHook()?.nickname)
      ? useUserStoreHook()?.username
      : useUserStoreHook()?.nickname;
  });

  const avatarsStyle = computed(() => {
    return username.value ? { marginRight: "10px" } : "";
  });

  const isCollapse = computed(() => {
    return !pureApp.getSidebarStatus;
  });

  const device = computed(() => {
    return pureApp.getDevice;
  });

  const { $storage, $config } = useGlobal<GlobalPropertiesApi>();
  const layout = computed(() => {
    return $storage?.layout?.layout;
  });

  const title = computed(() => {
    return $config.Title;
  });

  // 动态title
  function changeTitle(meta: routeMetaType) {
    const Title = getConfig().Title;
    if (Title) document.title = `${meta.title} | ${Title}`;
    else document.title = meta.title;
  }

  // 退出登录
  function logout() {
    useUserStoreHook().logOut();
  }

  function backTopMenu() {
    router.push(getTopMenu()?.path);
  }

  function onPanel() {
    emitter.emit("openPanel");
  }

  function toggleSideBar() {
    pureApp.toggleSideBar();
  }

  function handleResize(menuRef) {
    menuRef?.handleResize();
  }

  function resolvePath(route) {
    if (!route.children) return;
    const httpReg = /^http(s?):\/\//;
    const routeChildPath = route.children[0]?.path;
    if (httpReg.test(routeChildPath)) {
      return route.path + "/" + routeChildPath;
    } else {
      return routeChildPath;
    }
  }

  function menuSelect(indexPath: string) {
    if (wholeMenus.value.length === 0 || isRemaining(indexPath)) return;
    emitter.emit("changLayoutRoute", indexPath);
  }

  // 判断路径是否参与菜单
  function isRemaining(path: string) {
    return remainingPaths.includes(path);
  }

  // 获取`logo`
  function getLogo() {
    return new URL("/logo.svg", import.meta.url).href;
  }

  return {
    route,
    title,
    device,
    layout,
    logout,
    routers,
    $storage,
    isFullscreen,
    Fullscreen,
    ExitFullscreen,
    toggle,
    backTopMenu,
    onPanel,
    getDivStyle,
    changeTitle,
    toggleSideBar,
    menuSelect,
    handleResize,
    resolvePath,
    getLogo,
    isCollapse,
    pureApp,
    username,
    userAvatar,
    userAvatarText,
    userAvatarBgColor,
    showAvatarImage,
    avatarsStyle,
    tooltipEffect
  };
}
