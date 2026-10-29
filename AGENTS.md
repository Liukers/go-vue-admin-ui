# AGENTS.md

给 AI 编码代理的入门手册。修改代码前请先读本文件，并遵循其中的约定。

## 1. 项目简介

go-vue-admin 的后台管理前端：基于 [pure-admin-thin](https://github.com/pure-admin/pure-admin-thin) 裁剪二次开发的中后台脚手架，对接自研 Go 后端（go-vue-admin-api）。

技术栈：

- Vue 3.5（`<script setup>`）+ Vite 7 + TypeScript
- Element Plus + Tailwind CSS 4
- Pinia（状态管理）+ vue-router 4（**hash 模式**）
- axios 封装类 `PureHttp`（`src/utils/http/index.ts`）
- vitest + happy-dom（单元测试，配置见 `vitest.config.ts`，测试在 `tests/`）

## 2. 目录结构

| 路径                     | 职责                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `src/api/`               | 接口层，一接口一函数（`system.ts` 登录/用户/角色/菜单等，`routes.ts` 动态路由），统一返回 `Result<T>` |
| `src/store/modules/`     | Pinia 模块（`user.ts` 认证与记住我、`app.ts`、`multiTags.ts` 等）                                     |
| `src/store/types.ts`     | 各 store 的 state 类型                                                                                |
| `src/router/`            | `index.ts` 守卫 + 静态路由 glob 导入；`utils.ts` 动态路由注册（`initRouter`/`handleAsyncRoutes`）     |
| `src/utils/http/`        | axios 封装：请求/响应拦截器、无感刷新队列、白名单、`parseTokenExpires`                                |
| `src/utils/auth.ts`      | token 存取：双 Token 写入 cookie（`authorized-token`）+ 用户信息写 localStorage（`user-info`）        |
| `src/utils/errorCode.ts` | 错误码枚举与消息映射（与后端 `err_code.go` 对齐）                                                     |
| `src/layout/`            | 布局组件（侧边栏、导航栏、标签页、搜索）                                                              |
| `src/views/`             | 业务页面：welcome / login / profile / error / system（user、role、menu、log、setting）                |
| `src/directives/`        | 自定义指令：`auth`（v-auth）、`perms`（v-perms）、copy、ripple 等                                     |
| `src/hooks/`             | `useCrudPage.ts`：CRUD 页面通用逻辑（列表查询/分页/表单提交）                                         |
| `src/config/`            | 平台默认配置，`public/platform-config.json` 可覆盖                                                    |
| `build/`                 | vite 插件、路径别名、依赖优化清单                                                                     |
| `tests/`                 | vitest 单元测试（`*.test.ts`，与 `src/` 平级）                                                        |

## 3. 常用命令

| 命令             | 作用                                                |
| ---------------- | --------------------------------------------------- |
| `pnpm dev`       | 启动开发服务器（代理 `/api` → `VITE_PROXY_TARGET`） |
| `pnpm build`     | 生产构建                                            |
| `pnpm typecheck` | `tsc --noEmit && vue-tsc --noEmit`                  |
| `pnpm lint`      | eslint + prettier + stylelint（带 `--fix`）         |
| `pnpm test`      | vitest run 单元测试                                 |
| `pnpm report`    | 构建并输出包体积分析                                |

## 4. 代码约定

- SFC 一律 `<script setup>`，用 `defineOptions({ name: "Xxx" })` 命名组件。
- API 层一接口一导出函数，返回 `Result<T>`；axios 实例统一走 `@/utils/http` 导出的 `http`。
- 权限**fail-close**：`permissions` 完全以后端返回为准，后端不返回 `perms` 则前端无任何按钮权限，禁止前端自行"升级"为超管（见 `user.ts` 的 `loginByUsername`）。
- 环境变量必须 `VITE_` 前缀，在 `.env*` 中定义、在 `src/vite-env.d.ts` 声明类型。
- 错误码区间：1000 参数 / 2000 认证授权 / 3000 业务 / 4000 资源不存在 / 5000 服务器 / 6000 限流。新增错误码需同时改 `src/utils/errorCode.ts` 和后端 `go-vue-admin-api/models/res/err_code.go`。
- commit 走 commitlint 规范（husky + lint-staged 已配），提交前自动跑 lint。

## 5. 关键机制速查

- **双 Token 无感刷新**：`src/utils/http/index.ts:66-87`（暂存队列 `requests` + `isRefreshing` 防重入），刷新主流程在请求拦截器 `index.ts:117-157`；accessToken 过期先用 refreshToken 换新（`user.ts:142` `handRefreshToken`），响应头 `x-refresh-token` 也会就地更新（`index.ts:182-191`）。
- **logOut 时序**：`user.ts:123-140`。先带 `X-Refresh-Token` 头通知后端拉黑（此时本地 token 未清，Authorization 头仍在），无论成败都在 `finally` 清本地并跳 `/login`；模块级 `isNotifyingLogout`（`user.ts:30`）防止响应拦截器在 401/2003 时重复进入形成循环。
- **动态路由**：`src/router/utils.ts:195` `initRouter` → `src/api/routes.ts:29` `GET /v1/system/routes` → `handleAsyncRoutes`（`utils.ts:154`）把后端路由映射到 `import.meta.glob` 的页面组件（`src/router/index.ts:40`）。
- **路由守卫判据**：`src/router/index.ts:116` `beforeEach`——`multipleTabsKey` cookie + `user-info`（localStorage）双重判据；白名单只有 `/login`（`index.ts:112`）。**陷阱：刷新时 beforeEach 可能触发两次，判断逻辑务必放在 `to.name` 存在的分支里**（`index.ts:199` 注释）。
- **记住我**：`REMEMBER_KEY = "user-remember"`（`user.ts:26`）持久化 `isRemembered`/`loginDay`（默认 7 天）；TOKEN cookie 生命周期：未勾选随 refreshToken，勾选取 `min(loginDay, refreshExpires)`（`auth.ts:71-87`）。登录页 UI 文案"7天免登录"在 `src/views/login/index.vue:97`。

## 6. 改 XX 功能先读这些文件

| 任务       | 必读                                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| 加新页面   | `src/router/index.ts`（静态路由 glob）、`src/router/utils.ts`（动态路由字段约定）、对应业务域 `src/views/system/<域>/`     |
| 加新接口   | `src/api/system.ts`（照现有函数风格）、`src/utils/http/index.ts`（白名单/拦截器行为）、后端对应 handler 的错误码           |
| 改登录认证 | `src/utils/auth.ts`、`src/store/modules/user.ts`、`src/utils/http/index.ts`、`src/views/login/index.vue`                   |
| 改权限指令 | `src/directives/auth/index.ts`、`src/directives/perms/index.ts`、`auth.ts` 的 `hasPerms`、各页面的 `v-auth`/`v-perms` 用法 |
| 改 CRUD 页 | `src/hooks/useCrudPage.ts` + 任一 `src/views/system/*` 页面参考实现                                                        |

## 7. 已知注意事项

- `tsconfig` 为 `strict: false`，代码里存在历史 `as any`；新代码尽量带类型，但不要为消除旧 `any` 大改无关文件。
- `vite.config.ts` 的 `chunkSizeWarningLimit: 4000` 是临时阈值（产物偏大），体积优化后应回落到默认值。
- `package.json` 的 `version: 6.2.0` 继承自 pure-admin-thin，与 git 版本叙事无关，发版时以后端/仓库 tag 为准。
- 无 i18n，全部中文硬编码；无远程 CI，但已配 husky pre-push 钩子（`.husky/pre-push`，push 前自动跑 `pnpm typecheck && pnpm test`），commit 前如需全面自检再补跑 `pnpm lint`。
- 单元测试注意：`@pureadmin/utils` 的 `storageLocal` 在 happy-dom 下对**空的** localStorage 会静默不写入（其内部 `isAllEmpty` 误判），测试需先种一个 key（见 `tests/auth.test.ts` 的 `beforeEach`）。
