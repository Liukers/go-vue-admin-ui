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
    // 是否勾选了登录页的免登录
    isRemembered: false,
    // 登录页的免登录存储几天，默认7天
    loginDay: 7
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
    },
    SET_LOGINDAY(value: number) {
      this.loginDay = Number(value);
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
                refreshToken: res.data.token, // 后端暂无refreshToken，先用token代替
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
    // 登出：token 未过期时先通知后端加入黑名单（失败不影响本地登出），再清理本地状态
    logOut() {
      const tokenData = getToken();
      if (tokenData && new Date().getTime() < tokenData.expires) {
        logout().catch(() => {});
      }
      this.username = "";
      this.roles = [];
      this.permissions = [];
      removeToken();
      useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
      resetRouter();
      router.push("/login");
    },
    async handRefreshToken(data: {
      accessToken: string;
      refreshToken: string;
      expires: number;
    }) {
      return new Promise<any>((resolve, reject) => {
        // 显式携带已过期的token（后端校验签名并在宽限期内换发）
        refreshToken(data.accessToken)
          .then(res => {
            if (res.code === 200 && res.data) {
              const oldToken = getToken() || {};
              const tokenData = {
                ...oldToken,
                accessToken: res.data.token || data.accessToken,
                refreshToken: res.data.token || data.refreshToken,
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
