import { defineStore } from "pinia";
import {
  type UserType,
  store,
  router,
  resetRouter,
  routerArrays,
  storageLocal
} from "../utils";
import {
  type Result,
  type LoginResult,
  login,
  logout,
  refreshToken
} from "@/api/system";
import { useMultiTagsStoreHook } from "./multiTags";
import {
  type DataInfo,
  setToken,
  removeToken,
  USER_KEY,
  getToken
} from "@/utils/auth";

const REMEMBER_KEY = "user-remember";

// 标记「通知后端登出」正在进行，防止登出请求返回 401/2003 时
// 响应拦截器再次调用 logOut 造成重复清状态与重复导航
let isNotifyingLogout = false;

export const useUserStore = defineStore("pure-user", {
  state: (): UserType => ({
    avatar: storageLocal().getItem<DataInfo<number>>(USER_KEY)?.avatar ?? "",
    username:
      storageLocal().getItem<DataInfo<number>>(USER_KEY)?.username ?? "",
    nickname:
      storageLocal().getItem<DataInfo<number>>(USER_KEY)?.nickname ?? "",
    // 页面级别权限
    roles: storageLocal().getItem<DataInfo<number>>(USER_KEY)?.roles ?? [],
    // 按钮级别权限
    permissions:
      storageLocal().getItem<DataInfo<number>>(USER_KEY)?.permissions ?? [],
    // 是否勾选了登录页的「记住我」（持久化，方便下次登录时默认选中）
    isRemembered:
      storageLocal().getItem<{ isRemembered: boolean }>(REMEMBER_KEY)
        ?.isRemembered ?? false,
    // 「记住我」的免登录存储几天，默认7天
    loginDay:
      storageLocal().getItem<{ loginDay: number }>(REMEMBER_KEY)?.loginDay ?? 7
  }),
  actions: {
    SET_AVATAR(avatar: string) {
      this.avatar = avatar;
    },
    SET_USERNAME(username: string) {
      this.username = username;
    },
    SET_NICKNAME(nickname: string) {
      this.nickname = nickname;
    },
    SET_ROLES(roles: Array<string>) {
      this.roles = roles;
    },
    SET_PERMS(permissions: Array<string>) {
      this.permissions = permissions;
    },
    SET_ISREMEMBERED(bool: boolean) {
      this.isRemembered = bool;
      storageLocal().setItem(REMEMBER_KEY, {
        isRemembered: bool,
        loginDay: this.loginDay
      });
    },
    SET_LOGINDAY(value: number) {
      this.loginDay = Number(value);
      storageLocal().setItem(REMEMBER_KEY, {
        isRemembered: this.isRemembered,
        loginDay: Number(value)
      });
    },
    async loginByUsername(data: {
      username: string;
      password: string;
      captchaId: string;
      captchaCode: string;
    }) {
      return new Promise<Result<LoginResult>>((resolve, reject) => {
        login(data)
          .then(res => {
            if (res.code === 200) {
              // 转换后端返回格式到前端存储格式
              // 安全原则 fail-close：权限完全以后端返回为准，
              // 字段缺失时默认无任何权限，绝不让前端自行"升级"为超管
              const permissions = res.data.userInfo.perms ?? [];

              const tokenData = {
                accessToken: res.data.token,
                expires: res.data.expiresAt * 1000, // 时间戳（毫秒）
                refreshToken: res.data.refreshToken,
                refreshExpires: res.data.refreshExpiresAt * 1000,
                avatar: res.data.userInfo.avatar || "",
                username: res.data.userInfo.username,
                nickname:
                  res.data.userInfo.nickname || res.data.userInfo.username,
                roles: res.data.userInfo.roles ?? [],
                permissions: permissions
              };
              setToken(tokenData as any);

              this.SET_PERMS(permissions);
              this.SET_ROLES(tokenData.roles);
            }
            resolve(res);
          })
          .catch(error => {
            reject(error);
          });
      });
    },
    // 登出：先带 X-Refresh-Token 通知后端拉黑（isNotifyingLogout 防止响应拦截器重复进入形成循环），
    // 无论成功、失败还是异常，都会继续清理本地状态并跳登录页
    async logOut() {
      if (isNotifyingLogout) return;
      isNotifyingLogout = true;
      try {
        const tokenData = getToken();
        if (tokenData && tokenData.refreshToken) {
          await logout(tokenData.refreshToken).catch(() => {});
        }
      } finally {
        isNotifyingLogout = false;
        this.username = "";
        this.roles = [];
        this.permissions = [];
        removeToken();
        useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
        resetRouter();
        router.push("/login");
      }
    },
    async handRefreshToken(data: {
      accessToken: string;
      refreshToken: string;
      expires: number;
      refreshExpires?: number;
    }) {
      return new Promise<any>((resolve, reject) => {
        // 使用 refreshToken 换取新的 accessToken/refreshToken
        refreshToken(data.refreshToken)
          .then(res => {
            if (res.code === 200 && res.data) {
              const oldToken = getToken() || {};
              const tokenData = {
                ...oldToken,
                accessToken: res.data.token || data.accessToken,
                refreshToken: res.data.refreshToken || data.refreshToken,
                refreshExpires: res.data.refreshExpiresAt
                  ? res.data.refreshExpiresAt * 1000
                  : data.refreshExpires,
                expires: res.data.expiresAt
                  ? res.data.expiresAt * 1000
                  : data.expires
              };
              setToken(tokenData as any);
              resolve({
                code: 200,
                data: tokenData
              });
            } else {
              reject(new Error(res.message || "刷新 Token 失败，请重新登录"));
            }
          })
          .catch(err => {
            reject(err);
          });
      });
    }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}
