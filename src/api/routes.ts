import { http } from "@/utils/http";

// 路由元数据类型
export type RouteMeta = {
  title: string;
  icon?: string;
  showLink?: boolean;
  keepAlive?: boolean;
  roles?: string[];
  auths?: string[];
  [key: string]: any;
};

// 路由项类型
export type RouteItem = {
  path: string;
  name?: string;
  component?: string;
  redirect?: string;
  meta?: RouteMeta;
  children?: RouteItem[];
};

export type RouteResult = {
  code: number;
  message: string;
  data: RouteItem[];
};

// 获取动态路由菜单（根据当前用户角色权限）
export const getAsyncRoutes = () => {
  return http.request<RouteResult>("get", "/v1/system/routes");
};
