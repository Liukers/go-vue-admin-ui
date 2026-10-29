import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer
} from "axios";
import type {
  PureHttpError,
  RequestMethods,
  PureHttpResponse,
  PureHttpRequestConfig
} from "./types.d";
import { stringify } from "qs";
import { getToken, formatToken, setToken } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";
import { message } from "@/utils/message";
import { ErrorCode, isAuthError } from "@/utils/errorCode";

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig: AxiosRequestConfig = {
  // 接口基础地址，从环境变量读取
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  // 请求超时时间（10秒，平衡响应速度和超时等待）
  timeout: 10000,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  // 数组格式参数序列化（https://github.com/axios/axios/issues/5142）
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};

// 默认 token 过期时长（1 小时），解析 JWT 失败时兜底使用
const DEFAULT_EXPIRES_IN = 60 * 60 * 1000;

/**
 * 解析 JWT payload 的 `exp` 字段，得到过期时间戳（毫秒）
 * 解析失败时回退为当前时间 + 1 小时
 */
export const parseTokenExpires = (token: string): number => {
  const fallback = new Date().getTime() + DEFAULT_EXPIRES_IN;
  try {
    const payload = token.split(".")[1];
    if (!payload) return fallback;
    // base64url -> base64，并补齐 `=` 填充
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const { exp } = JSON.parse(atob(padded));
    return typeof exp === "number" ? exp * 1000 : fallback;
  } catch {
    return fallback;
  }
};

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  // `token`过期后，暂存待执行的请求
  private static requests: Array<(token: string | null) => void> = [];

  // 防止重复刷新`token`
  private static isRefreshing = false;

  private static initConfig: PureHttpRequestConfig = {};

  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  private static retryOriginalRequest(config: PureHttpRequestConfig) {
    return new Promise((resolve, reject) => {
      PureHttp.requests.push((token: string | null) => {
        if (token) {
          config.headers["Authorization"] = formatToken(token);
          resolve(config);
        } else {
          reject(new Error("Token 刷新失败，请重新登录"));
        }
      });
    });
  }

  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      async (config: PureHttpRequestConfig): Promise<any> => {
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          return config;
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
          return config;
        }
        // 无需 token 的接口白名单，防止 token 过期后请求死循环
        const whiteList = [
          "/v1/system/login",
          "/v1/system/refresh-token",
          "/v1/system/captcha"
        ];
        const isWhiteListed = (url: string): boolean => {
          return whiteList.includes(url);
        };
        return isWhiteListed(config.url)
          ? config
          : new Promise(resolve => {
              const data = getToken();
              if (data) {
                const now = new Date().getTime();
                const expired = parseInt(String(data.expires)) - now <= 0;
                if (expired) {
                  // accessToken 过期，尝试用 refreshToken 续期
                  const refreshExpired =
                    parseInt(String(data.refreshExpires)) - now <= 0;
                  if (refreshExpired || !data.refreshToken) {
                    // refreshToken 也已过期或不存在，强制登出并中断请求
                    useUserStoreHook().logOut();
                    message("登录已过期，请重新登录", { type: "warning" });
                    resolve(Promise.reject(new Error("登录已过期")));
                    return;
                  }

                  if (!PureHttp.isRefreshing) {
                    PureHttp.isRefreshing = true;
                    useUserStoreHook()
                      .handRefreshToken({
                        accessToken: data.accessToken,
                        refreshToken: data.refreshToken,
                        expires: parseInt(String(data.expires)),
                        refreshExpires: parseInt(String(data.refreshExpires))
                      })
                      .then(res => {
                        const token = res.data.accessToken;
                        config.headers["Authorization"] = formatToken(token);
                        PureHttp.requests.forEach(cb => cb(token));
                        PureHttp.requests = [];
                      })
                      .catch((err: any) => {
                        // 刷新失败，清空队列并传入 null 使等待请求 reject
                        PureHttp.requests.forEach(cb => cb(null));
                        PureHttp.requests = [];
                        useUserStoreHook().logOut();
                        message(err?.message || "登录已过期，请重新登录", {
                          type: "warning"
                        });
                      })
                      .finally(() => {
                        PureHttp.isRefreshing = false;
                      });
                  }
                  resolve(PureHttp.retryOriginalRequest(config));
                } else {
                  config.headers["Authorization"] = formatToken(
                    data.accessToken
                  );
                  resolve(config);
                }
              } else {
                resolve(config);
              }
            });
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  private httpInterceptorsResponse(): void {
    const instance = PureHttp.axiosInstance;
    instance.interceptors.response.use(
      (response: PureHttpResponse) => {
        const $config = response.config;

        // 检查是否收到刷新后的token
        const refreshedToken = response.headers["x-refresh-token"];
        if (refreshedToken) {
          const tokenData = getToken();
          if (tokenData) {
            tokenData.accessToken = refreshedToken;
            // 解析新 token 的 exp 计算过期时间，失败时回退为 1 小时
            tokenData.expires = parseTokenExpires(refreshedToken);
            setToken(tokenData);
          }
        }

        // 处理业务错误码（token过期、无效、缺失）
        const data = response.data;
        if (data && typeof data.code === "number") {
          // 认证相关错误码：未登录、token无效、token过期
          if (isAuthError(data.code)) {
            message(data.message || "登录已过期，请重新登录", {
              type: "warning"
            });
            useUserStoreHook().logOut();
            return Promise.reject(new Error(data.message || "登录已过期"));
          }
          // 无权限（2001）：统一轻提示并中断，各页面无需再自行处理
          if (data.code === ErrorCode.FORBIDDEN) {
            message(data.message || "没有权限访问该资源", { type: "warning" });
            return Promise.reject(new Error(data.message || "没有权限访问"));
          }
        }

        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof $config.beforeResponseCallback === "function") {
          $config.beforeResponseCallback(response);
          return response.data;
        }
        if (PureHttp.initConfig.beforeResponseCallback) {
          PureHttp.initConfig.beforeResponseCallback(response);
          return response.data;
        }
        return response.data;
      },
      (error: PureHttpError) => {
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);

        const { response } = error;
        if (response) {
          const { status } = response;
          if (status >= 500) {
            message(`服务器错误 (${status})，请稍后重试`, { type: "error" });
          } else if (status === 401) {
            useUserStoreHook().logOut();
          } else if (status === 403) {
            message("没有权限访问该资源", { type: "warning" });
          } else if (status === 404) {
            message("请求的资源不存在", { type: "warning" });
          }
        } else if (!window.navigator.onLine) {
          message("网络连接已断开，请检查网络", { type: "error" });
        }

        return Promise.reject($error);
      }
    );
  }

  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T> {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig
    } as PureHttpRequestConfig;

    return new Promise((resolve, reject) => {
      PureHttp.axiosInstance
        .request(config)
        .then((response: undefined) => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  public post<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("post", url, params, config);
  }

  public get<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("get", url, params, config);
  }
}

export const http = new PureHttp();
