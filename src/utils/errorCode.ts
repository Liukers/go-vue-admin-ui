/**
 * 错误码枚举 - 与后端 go-vue-admin-api/models/res/err_code.go 保持一致
 *
 * 错误码区间划分：
 * 1000-1999：通用参数错误
 * 2000-2999：认证授权
 * 3000-3999：业务逻辑
 * 4000-4999：资源不存在
 * 5000-5999：服务器内部错误
 * 6000-6999：限流/安全
 */

export enum ErrorCode {
  // 成功
  SUCCESS = 200,

  // 请求参数错误 1000-1999
  PARAM_INVALID = 1000,
  PARAM_FORMAT = 1001,
  PARAM_VALIDATION = 1002,
  PHONE_INVALID = 1003,
  EMAIL_INVALID = 1004,
  PASSWORD_WEAK = 1005,

  // 认证授权错误 2000-2999
  UNAUTHORIZED = 2000,
  FORBIDDEN = 2001,
  TOKEN_INVALID = 2002,
  TOKEN_EXPIRED = 2003,
  LOGIN_FAILED = 2004,
  USER_DISABLED = 2005,
  USER_NOT_EXIST = 2006,
  USER_EXIST = 2007,
  PASSWORD_ERROR = 2008,
  OLD_PASSWORD_ERROR = 2009,
  ACCOUNT_LOCKED = 2010,
  CAPTCHA_ERROR = 2011,
  CAPTCHA_EXPIRED = 2012,

  // 业务逻辑错误 3000-3999
  BUSINESS_ERROR = 3000,
  USERNAME_EXIST = 3100,
  ROLE_CODE_EXIST = 3101,
  ROLE_HAS_USERS = 3200,
  ROLE_SYSTEM_RESERVED = 3201,
  MENU_HAS_CHILDREN = 3300,

  // 资源不存在错误 4000-4999
  NOT_FOUND = 4000,

  // 服务器内部错误 5000-5999
  INTERNAL_SERVER = 5000,
  DB_ERROR = 5001,

  // 限流错误 6000-6999
  TOO_MANY_REQUESTS = 6000
}

/**
 * 错误码消息映射表
 */
export const ErrorCodeMessage: Record<number, string> = {
  [ErrorCode.SUCCESS]: "success",
  [ErrorCode.PARAM_INVALID]: "请求参数错误",
  [ErrorCode.PARAM_FORMAT]: "参数格式错误",
  [ErrorCode.PARAM_VALIDATION]: "参数校验失败",
  [ErrorCode.PHONE_INVALID]: "手机号格式错误",
  [ErrorCode.EMAIL_INVALID]: "邮箱格式错误",
  [ErrorCode.PASSWORD_WEAK]: "密码强度不足",
  [ErrorCode.UNAUTHORIZED]: "未登录或登录已过期",
  [ErrorCode.FORBIDDEN]: "无权限访问",
  [ErrorCode.TOKEN_INVALID]: "无效的token",
  [ErrorCode.TOKEN_EXPIRED]: "token已过期",
  [ErrorCode.LOGIN_FAILED]: "用户名或密码错误",
  [ErrorCode.USER_DISABLED]: "用户已被禁用",
  [ErrorCode.USER_NOT_EXIST]: "用户不存在",
  [ErrorCode.USER_EXIST]: "用户已存在",
  [ErrorCode.PASSWORD_ERROR]: "密码错误",
  [ErrorCode.OLD_PASSWORD_ERROR]: "旧密码错误",
  [ErrorCode.ACCOUNT_LOCKED]: "账户已被锁定，请稍后重试",
  [ErrorCode.CAPTCHA_ERROR]: "验证码错误",
  [ErrorCode.CAPTCHA_EXPIRED]: "验证码已过期",
  [ErrorCode.BUSINESS_ERROR]: "业务处理失败",
  [ErrorCode.USERNAME_EXIST]: "用户名已存在",
  [ErrorCode.ROLE_CODE_EXIST]: "角色代码已存在",
  [ErrorCode.ROLE_HAS_USERS]: "角色下存在用户，无法删除",
  [ErrorCode.ROLE_SYSTEM_RESERVED]: "系统保留角色无法删除",
  [ErrorCode.MENU_HAS_CHILDREN]: "菜单下存在子菜单，无法删除",
  [ErrorCode.NOT_FOUND]: "资源不存在",
  [ErrorCode.INTERNAL_SERVER]: "服务器内部错误",
  [ErrorCode.DB_ERROR]: "数据库操作失败",
  [ErrorCode.TOO_MANY_REQUESTS]: "请求过于频繁，请稍后再试"
};

/**
 * 根据错误码获取错误消息
 */
export function getErrorMessage(code: number): string {
  return ErrorCodeMessage[code] || "未知错误";
}

/**
 * 是否为认证相关错误（需要重新登录）
 */
export function isAuthError(code: number): boolean {
  return (
    code === ErrorCode.UNAUTHORIZED ||
    code === ErrorCode.TOKEN_INVALID ||
    code === ErrorCode.TOKEN_EXPIRED
  );
}
