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

// 获取`token`
export function getToken(): DataInfo<number> | null {
  // 此处与`TOKEN_KEY`相同，此写法解决初始化时`Cookies`中不存在`TOKEN_KEY`报错
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
 * 将`accessToken`、`expires`、`refreshToken`这三条信息放在key值为authorized-token的cookie里（过期自动销毁）
 * 将`avatar`、`username`、`nickname`、`roles`、`permissions`、`refreshToken`、`expires`这七条信息放在key值为`user-info`的localStorage里（利用`multipleTabsKey`当浏览器完全关闭后自动销毁）
 */
export function setToken(data: DataInfo<number>) {
  let expires = 0;
  const { accessToken, refreshToken } = data;
  const { isRemembered, loginDay } = useUserStoreHook();
  expires = data.expires;
  const cookieString = JSON.stringify({ accessToken, expires, refreshToken });

  expires > 0
    ? Cookies.set(TOKEN_KEY, cookieString, {
        expires: (expires - Date.now()) / 86400000
      })
    : Cookies.set(TOKEN_KEY, cookieString);

  Cookies.set(
    multipleTabsKey,
    "true",
    isRemembered
      ? {
          expires: loginDay
        }
      : {}
  );

  function setUserKey({ avatar, username, nickname, roles, permissions }) {
    useUserStoreHook().SET_AVATAR(avatar);
    useUserStoreHook().SET_USERNAME(username);
    useUserStoreHook().SET_NICKNAME(nickname);
    useUserStoreHook().SET_ROLES(roles);
    useUserStoreHook().SET_PERMS(permissions);
    storageLocal().setItem(USER_KEY, {
      refreshToken,
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
