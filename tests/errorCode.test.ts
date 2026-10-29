import { describe, it, expect } from "vitest";
import {
  ErrorCode,
  ErrorCodeMessage,
  getErrorMessage,
  isAuthError
} from "@/utils/errorCode";

describe("errorCode", () => {
  it("每个错误码枚举值都有对应的中文消息", () => {
    for (const code of Object.values(ErrorCode).filter(
      (v): v is number => typeof v === "number"
    )) {
      expect(
        ErrorCodeMessage[code],
        `错误码 ${code} 缺少消息映射`
      ).toBeTruthy();
    }
  });

  it("getErrorMessage 返回映射消息，未知码回退“未知错误”", () => {
    expect(getErrorMessage(ErrorCode.SUCCESS)).toBe("success");
    expect(getErrorMessage(ErrorCode.TOKEN_EXPIRED)).toBe("token已过期");
    expect(getErrorMessage(999999)).toBe("未知错误");
  });

  it("isAuthError 只认未登录/token 无效/token 过期（2000/2002/2003）", () => {
    expect(isAuthError(ErrorCode.UNAUTHORIZED)).toBe(true);
    expect(isAuthError(ErrorCode.TOKEN_INVALID)).toBe(true);
    expect(isAuthError(ErrorCode.TOKEN_EXPIRED)).toBe(true);

    // 2001 无权限、200 成功、业务错误均不应触发重新登录
    expect(isAuthError(ErrorCode.FORBIDDEN)).toBe(false);
    expect(isAuthError(ErrorCode.SUCCESS)).toBe(false);
    expect(isAuthError(ErrorCode.BUSINESS_ERROR)).toBe(false);
  });

  it("错误码数值与后端 err_code.go 约定的关键值保持一致", () => {
    expect(ErrorCode.SUCCESS).toBe(200);
    expect(ErrorCode.UNAUTHORIZED).toBe(2000);
    expect(ErrorCode.FORBIDDEN).toBe(2001);
    expect(ErrorCode.TOKEN_EXPIRED).toBe(2003);
    expect(ErrorCode.TOO_MANY_REQUESTS).toBe(6000);
  });
});
