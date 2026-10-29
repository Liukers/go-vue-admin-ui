import Cookies from "js-cookie";
import { useUserStoreHook } from "@/store/modules/user";
import { storageLocal, isString, isIncludeAllChildren } from "@pureadmin/utils";

export interface DataInfo<T> {
  // token
  accessToken: string;
  // `accessToken`的过期时间（时间戳）
  expires: T;
  // 用于调用刷新accessToken的接口时所需的token
  refreshToken: string;
  // `refreshToken`的过期时间（时间戳）
  refreshExpires: T;
  // 头像
  avatar?: string;
  // 用户名
  username?: string;
  // 昵称
  nickname?: string;
  // 当前登录用户的角色
  roles?: Array<string>;
  // 当前登录用户的按钮级别权限
  permissions?: Array<string>;
}

export const USER_KEY = "user-info";
export const TOKEN_KEY = "authorized-token";
/**
 * 通过`multiple-tabs`是否在`cookie`中，判断用户是否已经登录系统，
 * 从而支持多标签页打开已经登录的系统后无需再登录。
 * 浏览器完全关闭后`multiple-tabs`将自动从`cookie`中销毁，
 * 再次打开浏览器需要重新登录系统
 * */
export const multipleTabsKey = "multiple-tabs";

export function getToken(): DataInfo<number> | null {
  // cookie 中的 token 解析失败时清理登录态并返回 null
  try {
    const cookieValue = Cookies.get(TOKEN_KEY);
    if (cookieValue) {
      return JSON.parse(cookieValue);
    }
    return storageLocal().getItem(USER_KEY);
  } catch (e) {
    console.error("Token 解析失败，请重新登录", e);
    removeToken();
    return null;
  }
}

/**
 * @description 设置`token`以及一些必要信息并采用无感刷新`token`方案
 * 无感刷新：后端返回`accessToken`（访问接口使用的`token`）、`refreshToken`（用于调用刷新`accessToken`的接口时所需的`token`，`refreshToken`的过期时间（比如30天）应大于`accessToken`的过期时间（比如2小时））、`expires`（`accessToken`的过期时间）
 * 将 token 相关信息放入key值为authorized-token的cookie里（过期自动销毁）
 * 将用户信息等放入key值为`user-info`的localStorage里（利用`multipleTabsKey`当浏览器完全关闭后自动销毁）
 */
export function setToken(data: DataInfo<number>) {
  const { accessToken, refreshToken } = data;
  const { isRemembered, loginDay } = useUserStoreHook();
  const expires = data.expires;
  const refreshExpires = data.refreshExpires || 0;
  const cookieString = JSON.stringify({
    accessToken,
    expires,
    refreshToken,
    refreshExpires
  });

  // TOKEN cookie 生命周期：
  // 未勾选「记住我」→ 随 refreshToken 生命周期（无感刷新方案能工作的前提，必须活到 refreshToken 过期，不能是会话 cookie）
  // 勾选「记住我」→ 用户选择的 loginDay 天与 refreshToken 生命周期取较短者（refreshExpires 是后端 refreshToken 的真实上限）
  // refreshExpires 缺失时回退按 accessToken 过期时间
  const accessExpiresDays =
    expires > 0 ? (expires - Date.now()) / 86400000 : undefined;
  const refreshExpiresDays =
    refreshExpires > 0 ? (refreshExpires - Date.now()) / 86400000 : undefined;
  let cookieExpires: number | undefined;
  if (isRemembered && loginDay > 0) {
    cookieExpires =
      refreshExpiresDays !== undefined
        ? Math.min(loginDay, refreshExpiresDays)
        : loginDay;
  } else {
    cookieExpires = refreshExpiresDays ?? accessExpiresDays;
  }

  Cookies.set(TOKEN_KEY, cookieString, {
    expires: cookieExpires,
    sameSite: "Lax"
  });

  Cookies.set(
    multipleTabsKey,
    "true",
    isRemembered
      ? {
          expires: loginDay,
          sameSite: "Lax"
        }
      : { sameSite: "Lax" }
  );

  function setUserKey({ avatar, username, nickname, roles, permissions }) {
    useUserStoreHook().SET_AVATAR(avatar);
    useUserStoreHook().SET_USERNAME(username);
    useUserStoreHook().SET_NICKNAME(nickname);
    useUserStoreHook().SET_ROLES(roles);
    useUserStoreHook().SET_PERMS(permissions);
    storageLocal().setItem(USER_KEY, {
      refreshToken,
      refreshExpires,
      expires,
      avatar,
      username,
      nickname,
      roles,
      permissions
    });
  }

  if (data.username && data.roles) {
    const { username, roles } = data;
    setUserKey({
      avatar: data?.avatar ?? "",
      username,
      nickname: data?.nickname ?? "",
      roles,
      permissions: data?.permissions ?? []
    });
  } else {
    const avatar =
      storageLocal().getItem<DataInfo<number>>(USER_KEY)?.avatar ?? "";
    const username =
      storageLocal().getItem<DataInfo<number>>(USER_KEY)?.username ?? "";
    const nickname =
      storageLocal().getItem<DataInfo<number>>(USER_KEY)?.nickname ?? "";
    const roles =
      storageLocal().getItem<DataInfo<number>>(USER_KEY)?.roles ?? [];
    const permissions =
      storageLocal().getItem<DataInfo<number>>(USER_KEY)?.permissions ?? [];
    setUserKey({
      avatar,
      username,
      nickname,
      roles,
      permissions
    });
  }
}

// 删除`token`以及key值为`user-info`的localStorage信息
export function removeToken() {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(multipleTabsKey);
  storageLocal().removeItem(USER_KEY);
}

/** 更新本地缓存（USER_KEY）中的用户信息字段（个人中心修改昵称/头像后调用） */
export const updateUserInfoCache = (info: {
  nickname?: string;
  avatar?: string;
}) => {
  const data = storageLocal().getItem<DataInfo<number>>(USER_KEY);
  if (data) {
    storageLocal().setItem(USER_KEY, { ...data, ...info });
  }
};

// 格式化token（jwt格式）
export const formatToken = (token: string): string => {
  return "Bearer " + token;
};

// 是否有按钮级别的权限（根据登录接口返回的`permissions`字段进行判断）
export const hasPerms = (value: string | Array<string>): boolean => {
  if (!value) return false;
  const allPerms = "*:*:*";
  const { permissions } = useUserStoreHook();
  if (!permissions) return false;
  if (permissions.length === 1 && permissions[0] === allPerms) return true;
  const isAuths = isString(value)
    ? permissions.includes(value)
    : isIncludeAllChildren(value, permissions);
  return isAuths ? true : false;
};
