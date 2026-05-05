import type { FormItemRule } from "element-plus";

// 密码正则（密码格式应为8-18位数字、字母、符号的任意两种组合）
export const REGEXP_PWD =
  /^(?![0-9]+$)(?![a-z]+$)(?![A-Z]+$)(?!([^(0-9a-zA-Z)]|[()])+$)(?!^.*[\u4E00-\u9FA5].*$)([^(0-9a-zA-Z)]|[()]|[a-z]|[A-Z]|[0-9]){8,18}$/;

// 手机号正则
export const REGEXP_PHONE = /^1[3-9]\d{9}$/;

// 用户名正则（字母、数字、下划线，2-32位）
export const REGEXP_USERNAME = /^[a-zA-Z0-9_]{2,32}$/;

// 必填
export const required = (
  message: string,
  trigger: string | string[] = "blur"
): FormItemRule[] => [{ required: true, message, trigger }];

// 手机号
export const phone = (trigger: string | string[] = "blur"): FormItemRule[] => [
  {
    validator: (_rule, value, callback) => {
      if (!value || REGEXP_PHONE.test(value)) {
        callback();
      } else {
        callback(new Error("手机号格式不正确"));
      }
    },
    trigger
  }
];

// 邮箱
export const email = (trigger: string | string[] = "blur"): FormItemRule[] => [
  { type: "email", message: "邮箱格式不正确", trigger }
];

// 用户名
export const username = (
  trigger: string | string[] = "blur"
): FormItemRule[] => [
  {
    validator: (_rule, value, callback) => {
      if (!value || REGEXP_USERNAME.test(value)) {
        callback();
      } else {
        callback(new Error("用户名只能包含字母、数字、下划线，长度2-32位"));
      }
    },
    trigger
  }
];

// 密码
export const password = (
  trigger: string | string[] = "blur"
): FormItemRule[] => [
  {
    validator: (_rule, value, callback) => {
      if (!value || REGEXP_PWD.test(value)) {
        callback();
      } else {
        callback(new Error("密码格式应为8-18位数字、字母、符号的任意两种组合"));
      }
    },
    trigger
  }
];

// 确认密码（需传入表单数据对象和密码字段名）
export const confirmPassword = (
  form: Record<string, any>,
  passwordField = "password",
  trigger: string | string[] = "blur"
): FormItemRule[] => [
  {
    validator: (_rule, value, callback) => {
      if (!value) {
        callback(new Error("请再次输入密码"));
      } else if (value !== form[passwordField]) {
        callback(new Error("两次输入密码不一致"));
      } else {
        callback();
      }
    },
    trigger
  }
];

// 状态选择（1启用 2禁用）
export const status = (
  trigger: string | string[] = "change"
): FormItemRule[] => [
  {
    validator: (_rule, value, callback) => {
      if (value === 1 || value === 2) {
        callback();
      } else {
        callback(new Error("状态值不正确"));
      }
    },
    trigger
  }
];

// 验证码
export const captcha = (
  trigger: string | string[] = "blur"
): FormItemRule[] => [{ required: true, message: "请输入验证码", trigger }];
