import { http } from "@/utils/http";

// ==================== 通用响应类型 ====================
export type Result<T = any> = {
  code: number;
  message: string;
  data: T;
};

export type PageResult<T = any> = {
  code: number;
  message: string;
  data: {
    list: T[];
    total: number;
    page: number;
    pageSize: number;
  };
};

// ==================== 用户管理 ====================
export type UserInfo = {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  email: string;
  phone: string;
  status: number;
  roleId: number;
  role?: RoleInfo;
  roles?: string[];
  perms?: string[];
  lastLoginIp: string;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
  password?: string; // 仅用于创建/更新用户
};

export type LoginResult = {
  token: string;
  expiresAt: number;
  userInfo: UserInfo;
};

// 登录
export const login = (data: {
  username: string;
  password: string;
  captchaId: string;
  captchaCode: string;
}) => {
  return http.request<Result<LoginResult>>("post", "/v1/system/login", {
    data
  });
};

// 获取验证码
export const getCaptcha = () => {
  return http.request<Result<{ captchaId: string; captchaImg: string }>>(
    "get",
    "/v1/system/captcha"
  );
};

// 登出
export const logout = () => {
  return http.request<Result<null>>("post", "/v1/system/logout");
};

// 刷新token
export const refreshToken = () => {
  return http.request<Result<{ token: string; expiresAt: number }>>(
    "post",
    "/v1/system/refresh-token"
  );
};

// 获取当前用户信息
export const getUserInfo = () => {
  return http.request<Result<UserInfo>>("get", "/v1/system/users/info");
};

// 获取用户列表
export const getUserList = (params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: number;
}) => {
  return http.request<PageResult<UserInfo>>("get", "/v1/system/users", {
    params
  });
};

// 创建用户
export const createUser = (data: Partial<UserInfo> & { password: string }) => {
  return http.request<Result<number>>("post", "/v1/system/users", {
    data
  });
};

// 更新用户
export const updateUser = (data: Partial<UserInfo>) => {
  return http.request<Result<null>>("put", `/v1/system/users/${data.id}`, {
    data
  });
};

// 删除用户
export const deleteUser = (id: number) => {
  return http.request<Result<null>>("delete", `/v1/system/users/${id}`);
};

// ==================== 角色管理 ====================
export type RoleInfo = {
  id: number;
  roleName: string;
  roleCode: string;
  description: string;
  status: number;
  sort: number;
  createdAt: string;
  updatedAt: string;
};

// 获取角色列表
export const getRoleList = (params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
}) => {
  return http.request<PageResult<RoleInfo>>("get", "/v1/system/roles", {
    params
  });
};

// 获取角色选项列表（排除超级管理员，用于下拉选择）
export const getRoleOptions = () => {
  return http.request<Result<RoleInfo[]>>("get", "/v1/system/roles/options");
};

// 获取角色详情
export const getRoleDetail = (id: number) => {
  return http.request<Result<RoleInfo>>("get", `/v1/system/roles/${id}`);
};

// 创建角色
export const createRole = (data: Partial<RoleInfo>) => {
  return http.request<Result<number>>("post", "/v1/system/roles", {
    data
  });
};

// 更新角色
export const updateRole = (data: Partial<RoleInfo>) => {
  return http.request<Result<null>>("put", `/v1/system/roles/${data.id}`, {
    data
  });
};

// 删除角色
export const deleteRole = (id: number) => {
  return http.request<Result<null>>("delete", `/v1/system/roles/${id}`);
};

// 获取角色菜单权限
export const getRoleMenus = (id: number) => {
  return http.request<Result<number[]>>("get", `/v1/system/roles/${id}/menus`);
};

// 设置角色菜单权限
export const setRoleMenus = (data: { roleId: number; menuIds: number[] }) => {
  return http.request<Result<null>>(
    "put",
    `/v1/system/roles/${data.roleId}/menus`,
    {
      data
    }
  );
};

// ==================== 菜单管理 ====================
export type MenuInfo = {
  id: number;
  parentId: number;
  menuName: string;
  menuType: number; // 1目录 2菜单 3按钮
  icon: string;
  path: string;
  component: string;
  perm: string;
  sort: number;
  status: number;
  visible: number;
  createdAt: string;
  updatedAt: string;
  children?: MenuInfo[];
};

// 获取菜单列表
export const getMenuList = () => {
  return http.request<Result<MenuInfo[]>>("get", "/v1/system/menus");
};

// 获取菜单树
export const getMenuTree = () => {
  return http.request<Result<MenuInfo[]>>("get", "/v1/system/menus/tree");
};

// 创建菜单
export const createMenu = (data: Partial<MenuInfo>) => {
  return http.request<Result<number>>("post", "/v1/system/menus", {
    data
  });
};

// 更新菜单
export const updateMenu = (data: Partial<MenuInfo>) => {
  return http.request<Result<null>>("put", `/v1/system/menus/${data.id}`, {
    data
  });
};

// 删除菜单
export const deleteMenu = (id: number) => {
  return http.request<Result<null>>("delete", `/v1/system/menus/${id}`);
};

// 重置用户密码（管理员）
export const resetUserPassword = (id: number, password: string) => {
  return http.request<Result<null>>("put", `/v1/system/user/update`, {
    data: { id, password }
  });
};

// 更新当前用户信息（个人中心）
export const updateCurrentUser = (data: {
  nickname?: string;
  avatar?: string;
  phone?: string;
  email?: string;
}) => {
  return http.request<Result<null>>("put", "/v1/system/users/profile", {
    data
  });
};

// 修改当前用户密码（个人中心）
export const updateCurrentUserPassword = (data: {
  oldPassword: string;
  newPassword: string;
}) => {
  return http.request<Result<null>>("put", "/v1/system/users/password", {
    data
  });
};

// ==================== 系统设置 ====================
export type SystemSettingInfo = {
  id: number;
  enableOperationLog: number; // 1开启 2关闭
  enableLoginLog: number; // 1开启 2关闭
  createdAt: string;
  updatedAt: string;
};

// 获取系统设置
export const getSystemSetting = () => {
  return http.request<Result<SystemSettingInfo>>("get", "/v1/system/settings");
};

// 更新系统设置
export const updateSystemSetting = (data: {
  enableOperationLog: number;
  enableLoginLog: number;
}) => {
  return http.request<Result<null>>("put", "/v1/system/settings", {
    data
  });
};

// ==================== 日志管理 ====================
export type OperationLogInfo = {
  id: number;
  userId: number;
  username: string;
  roleName: string;
  method: string;
  path: string;
  requestData: string;
  responseData: string;
  status: number; // 1成功 2失败
  errorMessage: string;
  ip: string;
  userAgent: string;
  operationTime: number;
  createdAt: string;
};

export type LoginLogInfo = {
  id: number;
  username: string;
  ip: string;
  location: string;
  browser: string;
  os: string;
  status: number; // 1成功 2失败
  message: string;
  createdAt: string;
};

// 获取操作日志列表
export const getOperationLogList = (params?: {
  page?: number;
  pageSize?: number;
  username?: string;
  status?: number;
  startTime?: string;
  endTime?: string;
}) => {
  return http.request<PageResult<OperationLogInfo>>(
    "get",
    "/v1/system/operation-logs",
    { params }
  );
};

// 删除操作日志
export const deleteOperationLog = (id: number) => {
  return http.request<Result<null>>(
    "delete",
    `/v1/system/operation-logs/${id}`
  );
};

// 清空操作日志
export const clearOperationLog = () => {
  return http.request<Result<null>>("delete", "/v1/system/operation-logs");
};

// 获取登录日志列表
export const getLoginLogList = (params?: {
  page?: number;
  pageSize?: number;
  username?: string;
  status?: number;
  startTime?: string;
  endTime?: string;
}) => {
  return http.request<PageResult<LoginLogInfo>>(
    "get",
    "/v1/system/login-logs",
    { params }
  );
};

// 删除登录日志
export const deleteLoginLog = (id: number) => {
  return http.request<Result<null>>("delete", `/v1/system/login-logs/${id}`);
};

// 清空登录日志
export const clearLoginLog = () => {
  return http.request<Result<null>>("delete", "/v1/system/login-logs");
};
