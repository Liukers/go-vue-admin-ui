# go-vue-admin-ui

go-vue-admin 管理系统的前端，基于 [pure-admin-thin](https://github.com/pure-admin/pure-admin-thin) 深度裁剪，仅保留 RBAC 后台所需的核心能力。需要配合配套后端使用：[`../go-vue-admin-api`](../go-vue-admin-api)（Go + Gin + GORM + JWT 双 Token + Casbin）。

## 功能特性

- **双 Token 无感刷新**：accessToken 过期时拦截器自动用 refreshToken 续期（单飞 + 请求队列，并发请求不重复刷新），也可由响应头 `x-refresh-token` 就地更新
- **记住我**：可配置免登录天数（默认 7 天），TOKEN cookie 生命周期随 refreshToken 且不超过其上限
- **登出时序安全**：先带 `X-Refresh-Token` 头通知后端拉黑双 Token，无论成败再清本地状态，防 401 重复导航
- **按钮级权限**：`v-perms` / `v-auth` 指令 + fail-close（后端不返回 `perms` 则无任何按钮权限）
- **动态路由**：后端 `GET /v1/system/routes` 下发菜单树，前端映射组件动态注册
- **五个业务域**：用户 / 角色 / 菜单 / 系统设置 / 操作与登录日志（审计日志可开关）
- **CRUD 页面**：`useCrudPage` 统一列表分页、表单提交与权限控制
- 登录验证码、多标签页、明暗主题、全屏/菜单搜索

## 技术栈

| 类别      | 技术                                                     |
| --------- | -------------------------------------------------------- |
| 框架      | Vue 3.5（`<script setup>`）+ TypeScript（strict: false） |
| 构建      | Vite 7                                                   |
| UI        | Element Plus + Tailwind CSS 4                            |
| 状态/路由 | Pinia + vue-router 4（hash 模式）                        |
| HTTP      | axios 封装 `PureHttp`（拦截器 / 刷新队列 / 白名单）      |
| 测试      | vitest + happy-dom（19 用例，见 `tests/`）               |
| 配套后端  | Go + Gin + GORM + JWT 双 Token + Casbin（独立仓库）      |

## 快速开始

- Node.js `^20.19.0 || >=22.13.0`（`.nvmrc` 锁定 v22.20.0），pnpm `>=9`（`preinstall` 强制仅允许 pnpm）
- 默认账号：`admin` / `admin123`

```bash
pnpm install
pnpm dev        # http://localhost:8848
```

Vite 代理已配置：`/api` → `http://localhost:8080`（后端默认端口，可在 `.env.development` 的 `VITE_PROXY_TARGET` 修改，改后需重启 dev server）。

## 常用命令

| 命令             | 作用                                            |
| ---------------- | ----------------------------------------------- |
| `pnpm dev`       | 启动开发服务器（端口 8848）                     |
| `pnpm build`     | 生产构建（输出 `dist/`，默认 gzip）             |
| `pnpm typecheck` | `tsc --noEmit && vue-tsc --noEmit`              |
| `pnpm lint`      | eslint + prettier + stylelint（带 `--fix`）     |
| `pnpm test`      | vitest run 单元测试（`tests/`，happy-dom 环境） |
| `pnpm report`    | 构建并输出包体积分析                            |

## 目录结构

```
src/
├── api/            # 接口层：system.ts（登录/用户/角色/菜单/日志/设置）、routes.ts（动态路由）
├── store/modules/  # Pinia：user.ts（认证/记住我/登出）、app.ts、multiTags.ts 等
├── router/         # index.ts（hash 路由 + 守卫）、utils.ts（动态路由注册 initRouter）
├── utils/http/     # PureHttp 封装：双 Token 无感刷新队列、白名单、parseTokenExpires
├── utils/auth.ts   # token 存取：双 Token 写 cookie、用户信息写 localStorage
├── views/          # login / welcome / profile / error / system（user、role、menu、log、setting）
├── directives/     # v-perms、v-auth 等指令
├── hooks/          # useCrudPage.ts：CRUD 页通用逻辑
└── ...
tests/              # vitest 单元测试（auth / http / errorCode）
AGENTS.md           # AI 编码代理入门手册
vitest.config.ts    # vitest 配置（happy-dom，复用 build/utils 别名）
```

## 与后端的协作约定

- **错误码两端对齐**：`src/utils/errorCode.ts` ↔ 后端 `models/res/err_code.go`。区间：1000 参数 / 2000 认证授权 / 3000 业务 / 4000 资源不存在 / 5000 服务器 / 6000 限流。新增错误码必须两端同步修改。
- **响应格式**：`{ code, message, data }`，`code === 200` 为成功；2000/2002/2003 由响应拦截器统一触发重新登录。
- **双 Token 时序**：登录返回 `token`（accessToken）+ `expiresAt` + `refreshToken` + `refreshExpiresAt`（秒级时间戳）；accessToken 过期后前端用 refreshToken 调 `/v1/system/refresh-token` 换新；登出时前端把 refreshToken 放在 `X-Refresh-Token` 头调 `/v1/system/logout`，后端同时拉黑双 Token。
- **权限 fail-close**：按钮权限完全以后端返回的 `perms` 为准，前端不做任何兜底"升级"。
- 两个仓库独立 git 管理、分别提交；详细机制速查见 `AGENTS.md`。

## 出处与协议

本项目基于 [pure-admin-thin](https://github.com/pure-admin/pure-admin-thin)（[vue-pure-admin](https://github.com/pure-admin/vue-pure-admin) 精简版）裁剪构建，感谢原作者的出色工作！

- 上游模板：https://github.com/pure-admin/pure-admin-thin
- 本项目仓库：GitHub [Liukers/go-vue-admin-ui](https://github.com/Liukers/go-vue-admin-ui) / Gitee [liukers/go-vue-admin-ui](https://gitee.com/liukers/go-vue-admin-ui)
- 配套后端：GitHub [Liukers/go-vue-admin-api](https://github.com/Liukers/go-vue-admin-api) / Gitee [liukers/go-vue-admin-api](https://gitee.com/liukers/go-vue-admin-api)
- 许可证：MIT License

## 已知事项

- TypeScript 未开 `strict`，代码存在历史 `as any`（详见 `AGENTS.md` 注意事项）
- `chunkSizeWarningLimit` 临时提到 4MB（产物偏大），体积优化后应回落
- 无 i18n，界面文案全中文硬编码
- 无 CI，提交前请本地跑 `pnpm typecheck && pnpm lint && pnpm test`（commit 走 commitlint 规范）
