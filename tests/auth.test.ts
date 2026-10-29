import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Cookies from "js-cookie";
import { storageLocal } from "@pureadmin/utils";
import {
  setToken,
  getToken,
  removeToken,
  TOKEN_KEY,
  USER_KEY,
  multipleTabsKey,
  formatToken
} from "@/utils/auth";

// auth.ts 通过 useUserStoreHook 读取「记住我」状态，这里 mock 整个 user store
const mockStore = vi.hoisted(() => ({
  isRemembered: false,
  loginDay: 7,
  SET_AVATAR: vi.fn(),
  SET_USERNAME: vi.fn(),
  SET_NICKNAME: vi.fn(),
  SET_ROLES: vi.fn(),
  SET_PERMS: vi.fn()
}));

vi.mock("@/store/modules/user", () => ({
  useUserStoreHook: () => mockStore
}));

const DAY = 86400000;

function makeData(overrides: Record<string, any> = {}) {
  return {
    accessToken: "access-token",
    expires: Date.now() + 2 * 3600 * 1000,
    refreshToken: "refresh-token",
    refreshExpires: Date.now() + 30 * DAY,
    avatar: "a.png",
    username: "admin",
    nickname: "管理员",
    roles: ["admin"],
    permissions: ["*:*:*"],
    ...overrides
  };
}

let setSpy: ReturnType<typeof vi.spyOn>;

/** 取 Cookies.set 最后一次调用某 key 的 attributes 参数 */
function getSetAttributes(key: string) {
  const call = [...setSpy.mock.calls].reverse().find(args => args[0] === key);
  expect(call, `Cookies.set 应被调用：${key}`).toBeTruthy();
  return (call as any[])[2] as Record<string, any>;
}

/** expires 落在 [ (ref - t1)/DAY, (ref - t0)/DAY ] 区间内（setToken 内部取了一次 Date.now()） */
function expectExpiresInRange(
  expires: number,
  ref: number,
  t0: number,
  t1: number
) {
  expect(expires).toBeGreaterThanOrEqual((ref - t1) / DAY);
  expect(expires).toBeLessThanOrEqual((ref - t0) / DAY);
}

describe("auth.ts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    // @pureadmin/utils 的 storageLocal 内部用 isAllEmpty 判断 storage 对象，
    // 在 happy-dom 中空的 localStorage 会被判为"空值"导致 setItem 静默不生效，
    // 先种一个 key 绕过该环境差异（真实浏览器无此问题）
    localStorage.setItem("test-seed", "1");
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(multipleTabsKey);
    mockStore.isRemembered = false;
    mockStore.loginDay = 7;
    setSpy = vi.spyOn(Cookies, "set");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("setToken 双 Token 写入", () => {
    it("cookie 写入 accessToken/expires/refreshToken/refreshExpires 四个值，且带 sameSite=Lax", () => {
      const data = makeData();
      setToken(data as any);

      const cookie = JSON.parse(Cookies.get(TOKEN_KEY) as string);
      expect(cookie).toEqual({
        accessToken: data.accessToken,
        expires: data.expires,
        refreshToken: data.refreshToken,
        refreshExpires: data.refreshExpires
      });

      const attrs = getSetAttributes(TOKEN_KEY);
      expect(attrs.sameSite).toBe("Lax");
    });

    it("localStorage(USER_KEY) 写入 8 个字段的用户信息", () => {
      const data = makeData();
      setToken(data as any);

      // cookie 优先于 localStorage，先移除 cookie 以读到 localStorage 回退值
      Cookies.remove(TOKEN_KEY);
      const stored = storageLocal().getItem<Record<string, any>>(USER_KEY);
      expect(stored).not.toBeFalsy();
      expect(Object.keys(stored as object).sort()).toEqual(
        [
          "avatar",
          "expires",
          "nickname",
          "permissions",
          "refreshExpires",
          "refreshToken",
          "roles",
          "username"
        ].sort()
      );
      expect((stored as any).refreshToken).toBe("refresh-token");
      expect((stored as any).username).toBe("admin");
    });

    it("multipleTabsKey  cookie 带 sameSite=Lax；勾选记住我时 expires 取 loginDay", () => {
      mockStore.isRemembered = true;
      mockStore.loginDay = 7;
      setToken(makeData() as any);

      const attrs = getSetAttributes(multipleTabsKey);
      expect(attrs.sameSite).toBe("Lax");
      expect(attrs.expires).toBe(7);
    });
  });

  describe("cookie 有效期优先级（记住我）", () => {
    it("未勾选记住我：TOKEN cookie 随 refreshToken 生命周期", () => {
      mockStore.isRemembered = false;
      const data = makeData();
      const t0 = Date.now();
      setToken(data as any);
      const t1 = Date.now();

      expectExpiresInRange(
        getSetAttributes(TOKEN_KEY).expires,
        data.refreshExpires,
        t0,
        t1
      );
    });

    it("勾选记住我：取 min(loginDay, refreshExpires)", () => {
      mockStore.isRemembered = true;
      mockStore.loginDay = 7;
      // refreshToken 30 天 > 7 天 → 取 loginDay
      setToken(makeData() as any);
      expect(getSetAttributes(TOKEN_KEY).expires).toBe(7);

      // refreshToken 只剩 2 天 < 7 天 → 取 refreshExpires
      const data = makeData({ refreshExpires: Date.now() + 2 * DAY });
      const t0 = Date.now();
      setToken(data as any);
      const t1 = Date.now();
      expectExpiresInRange(
        getSetAttributes(TOKEN_KEY).expires,
        data.refreshExpires,
        t0,
        t1
      );
    });

    it("refreshExpires 缺失：未勾选回退 accessToken 过期时间，勾选取 loginDay", () => {
      // 未勾选 + refreshExpires 缺失 → 按 accessToken 过期时间
      const dataNoRefresh = makeData({ refreshExpires: 0 });
      const t0 = Date.now();
      setToken(dataNoRefresh as any);
      const t1 = Date.now();
      expectExpiresInRange(
        getSetAttributes(TOKEN_KEY).expires,
        dataNoRefresh.expires,
        t0,
        t1
      );

      // 勾选 + refreshExpires 缺失 → 直接取 loginDay
      mockStore.isRemembered = true;
      setToken(makeData({ refreshExpires: 0 }) as any);
      expect(getSetAttributes(TOKEN_KEY).expires).toBe(7);
    });
  });

  describe("getToken", () => {
    it("正常解析 cookie 中的 token", () => {
      const data = makeData();
      setToken(data as any);
      const token = getToken();
      expect(token?.accessToken).toBe("access-token");
      expect(token?.refreshToken).toBe("refresh-token");
    });

    it("cookie 解析失败时清理登录态并返回 null", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      // 直接写入非法 JSON，绕过 setToken
      Cookies.set(TOKEN_KEY, "{bad json");
      storageLocal().setItem(USER_KEY, { username: "admin" });

      expect(getToken()).toBeFalsy();
      expect(consoleSpy).toHaveBeenCalled();
      expect(Cookies.get(TOKEN_KEY)).toBeUndefined();
      expect(storageLocal().getItem(USER_KEY)).toBeFalsy();
    });
  });

  describe("removeToken", () => {
    it("同时清理 TOKEN cookie、multipleTabsKey cookie 和 USER_KEY localStorage", () => {
      setToken(makeData() as any);
      expect(Cookies.get(TOKEN_KEY)).toBeTruthy();
      expect(Cookies.get(multipleTabsKey)).toBeTruthy();
      expect(storageLocal().getItem(USER_KEY)).not.toBeFalsy();

      removeToken();

      expect(Cookies.get(TOKEN_KEY)).toBeUndefined();
      expect(Cookies.get(multipleTabsKey)).toBeUndefined();
      expect(storageLocal().getItem(USER_KEY)).toBeFalsy();
    });
  });

  describe("formatToken", () => {
    it("格式化为 Bearer token", () => {
      expect(formatToken("abc")).toBe("Bearer abc");
    });
  });
});
