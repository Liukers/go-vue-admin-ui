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
import { isAuthError } from "@/utils/errorCode";

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

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  // `token`过期后，暂存待执行的请求
  private static requests: Array<(token: string | null) => void> = [];

  // 防止重复刷新`token`
  private static isRefreshing = false;

  // 初始化配置对象
  private static initConfig: PureHttpRequestConfig = {};

  // 保存当前`Axios`实例对象
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  // 重连原始请求
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

  // 请求拦截
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
        // 请求白名单，放置一些不需要`token`的接口（通过设置请求白名单，防止`token`过期后再请求造成的死循环问题）
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
                  if (!PureHttp.isRefreshing) {
                    PureHttp.isRefreshing = true;
                    // token过期刷新
                    useUserStoreHook()
                      .handRefreshToken({
                        accessToken: data.accessToken,
                        refreshToken: data.refreshToken,
                        expires: parseInt(String(data.expires))
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
                        // 强制登出并提示用户重新登录
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

  // 响应拦截
  private httpInterceptorsResponse(): void {
    const instance = PureHttp.axiosInstance;
    instance.interceptors.response.use(
      (response: PureHttpResponse) => {
        const $config = response.config;

        // 检查是否收到刷新后的token
        const refreshedToken = response.headers["x-refresh-token"];
        if (refreshedToken) {
          // 更新本地token
          const tokenData = getToken();
          if (tokenData) {
            tokenData.accessToken = refreshedToken;
            // 重新计算过期时间
            const expires = new Date().getTime() + 60 * 60 * 1000; // 默认1小时
            tokenData.expires = expires;
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
            // 调用登出方法，清除token并跳转到登录页
            useUserStoreHook().logOut();
            return Promise.reject(new Error(data.message || "登录已过期"));
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

        // 处理服务器错误
        const { response } = error;
        if (response) {
          const { status } = response;
          if (status >= 500) {
            message(`服务器错误 (${status})，请稍后重试`, { type: "error" });
          } else if (status === 401) {
            // 未授权，清除登录信息并跳转到登录页
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

  // 通用请求工具函数
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

    // 单独处理自定义请求/响应回调
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

  // 单独抽离的`post`工具函数
  public post<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("post", url, params, config);
  }

  // 单独抽离的`get`工具函数
  public get<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("get", url, params, config);
  }
}

export const http = new PureHttp();
