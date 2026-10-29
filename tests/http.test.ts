import { describe, it, expect, vi } from "vitest";

// 拦截器整体依赖 store/router 链路，单测只针对纯函数 parseTokenExpires，
// 这里 mock 掉重依赖避免拉起整个应用模块树
vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: () => ({})
}));
vi.mock("@/utils/message", () => ({
  message: vi.fn()
}));

import { parseTokenExpires } from "@/utils/http";

const HOUR = 3600 * 1000;

function b64url(obj: object): string {
  return btoa(JSON.stringify(obj))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function makeJwt(payload: object): string {
  return `${b64url({ alg: "HS256" })}.${b64url(payload)}.signature`;
}

describe("parseTokenExpires", () => {
  it("合法 JWT：返回 payload.exp 的毫秒时间戳", () => {
    const exp = 1893456000; // 2030-01-01
    expect(parseTokenExpires(makeJwt({ exp, sub: "1" }))).toBe(exp * 1000);
  });

  it("payload 无 exp 字段：回退为当前时间 + 1 小时", () => {
    const t0 = Date.now();
    const result = parseTokenExpires(makeJwt({ sub: "1" }));
    const t1 = Date.now();
    expect(result).toBeGreaterThanOrEqual(t0 + HOUR);
    expect(result).toBeLessThanOrEqual(t1 + HOUR);
  });

  it("exp 非数字：回退为当前时间 + 1 小时", () => {
    const t0 = Date.now();
    const result = parseTokenExpires(makeJwt({ exp: "not-a-number" }));
    const t1 = Date.now();
    expect(result).toBeGreaterThanOrEqual(t0 + HOUR);
    expect(result).toBeLessThanOrEqual(t1 + HOUR);
  });

  it("非 JWT 格式输入：回退为当前时间 + 1 小时", () => {
    const t0 = Date.now();
    const result = parseTokenExpires("not-a-jwt");
    const t1 = Date.now();
    expect(result).toBeGreaterThanOrEqual(t0 + HOUR);
    expect(result).toBeLessThanOrEqual(t1 + HOUR);
  });

  it("base64url 特殊字符（- 和 _）能正确解码", () => {
    // 构造一个 JSON，其 base64 编码包含 +/ 以便验证替换逻辑
    const payload = { exp: 1893456000, data: "??>>" };
    const token = makeJwt(payload);
    expect(token).not.toContain("+");
    expect(token).not.toContain("/");
    expect(parseTokenExpires(token)).toBe(payload.exp * 1000);
  });
});
