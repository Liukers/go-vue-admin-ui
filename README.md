# Go-Vue-Admin UI

基于 Vue 3 + Element Plus 的轻量级 RBAC 后台管理前端

## 📋 项目介绍

这是一个纯前端项目，基于 [vue-pure-admin](https://github.com/pure-admin/vue-pure-admin) 精简版构建，提供完整的后台管理界面，需要配合后端 API 使用。

### 功能特性

- ✅ Vue 3 + TypeScript
- ✅ Element Plus 组件库
- ✅ 动态路由与菜单
- ✅ RBAC 权限控制
- ✅ JWT 认证
- ✅ 响应式布局
- ✅ 主题切换
- ✅ 多标签页
- ✅ 系统设置（日志开关控制）
- ✅ 首页快捷链接
- ✅ 登录验证码（支持刷新）
- ✅ 统一错误码与错误边界处理
- ✅ 共享表单校验规则
- ✅ 全屏 Loading 管理

## 🏗️ 技术栈

- **框架**: Vue 3 + TypeScript
- **UI库**: Element Plus
- **路由**: Vue Router
- **状态管理**: Pinia
- **构建工具**: Vite 7
- **HTTP**: Axios
- **图标**: Remix Icon + Iconify
- **样式**: Tailwind CSS

## 📁 项目结构

```
.
├── build/               # 构建配置
├── public/              # 静态资源
│   └── platform-config.json  # 平台配置文件
├── src/
│   ├── api/             # API 请求封装
│   │   ├── system.ts    # 系统管理 API（用户、角色、菜单）
│   │   ├── user.ts      # 用户相关 API
│   │   └── routes.ts    # 动态路由 API
│   ├── assets/          # 静态资源
│   ├── components/      # 全局组件
│   ├── directives/      # 自定义指令
│   ├── layout/          # 布局组件
│   │   ├── components/  # 布局子组件
│   │   ├── hooks/       # 布局 hooks
│   │   └── index.vue    # 主布局
│   ├── router/          # 路由配置
│   │   ├── modules/     # 路由模块
│   │   ├── index.ts     # 路由入口
│   │   └── utils.ts     # 路由工具
│   ├── store/           # 状态管理 (Pinia)
│   │   ├── modules/     # 状态模块
│   │   │   ├── user.ts  # 用户状态
│   │   │   ├── permission.ts  # 权限状态
│   │   │   └── ...
│   ├── style/           # 全局样式
│   ├── utils/           # 工具函数
│   │   ├── http/        # HTTP 请求封装（含 Token 刷新与统一错误码处理）
│   │   ├── auth.ts      # 认证工具
│   │   ├── loading.ts   # 全屏 Loading（引用计数）
│   │   ├── formRules.ts # 共享表单校验规则
│   │   └── errorCode.ts # 前后端统一错误码枚举
│   ├── views/           # 页面视图
│   │   ├── system/      # 系统管理
│   │   │   ├── user/    # 用户管理
│   │   │   ├── role/    # 角色管理
│   │   │   └── menu/    # 菜单管理
│   │   ├── login/       # 登录页
│   │   └── welcome/     # 首页
│   ├── App.vue          # 根组件
│   └── main.ts          # 入口文件
├── types/               # 类型定义
├── .env.development     # 开发环境配置
├── .env.production      # 生产环境配置（已启用 gzip 压缩）
├── index.html           # HTML 模板
├── package.json         # 依赖配置
├── tsconfig.json        # TS 配置
└── vite.config.ts       # Vite 配置
```

## 🚀 快速开始

### 环境要求

- Node.js 20+ (推荐 20.19.0 或更高版本)
- pnpm 9+ (推荐，项目强制使用 pnpm)
- 或 npm / yarn

### 1. 克隆项目

```bash
git clone https://github.com/Liukers/go-vue-admin-ui
cd go-vue-admin-ui
```

### 2. 安装依赖

```bash
# 推荐使用 pnpm
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

### 3. 配置 API 地址

项目使用环境变量管理不同环境的 API 地址：

**开发环境** - 编辑 `.env.development`：

```env
# 开发环境运行端口
VITE_PORT = 8848

# 开发环境接口地址（前端请求的基础路径）
VITE_API_BASE_URL = /api

# 开发环境代理目标（后端服务地址）
VITE_PROXY_TARGET = http://localhost:8080
```

开发环境使用 Vite 的代理功能，会将 `/api` 开头的请求转发到 `VITE_PROXY_TARGET` 配置的后端地址。

**注意**：

- 修改 `.env.development` 后需要**重启 Vite 开发服务器**才能生效
- HTTP 请求超时时间为 10 秒，可根据实际情况在 `src/utils/http/index.ts` 中调整

**生产环境** - 编辑 `.env.production`：

```env
# 线上环境接口地址（根据实际后端地址配置）
VITE_API_BASE_URL = http://your-backend-domain.com/api
```

生产构建默认启用 gzip 压缩，可通过 `VITE_COMPRESSION` 配置调整。

### 4. 启动开发服务器

```bash
pnpm dev
```

服务默认运行在 `http://localhost:8848`

### 5. 访问系统

打开浏览器访问：`http://localhost:8848`

默认账号：

- 用户名：`admin`
- 密码：`admin123`

## 🔌 后端配套

**⚠️ 本项目是纯前端项目，需要配合后端 API 使用！**

### 配套后端仓库

| 仓库                 | GitHub                                                | Gitee                                               |
| -------------------- | ----------------------------------------------------- | --------------------------------------------------- |
| **go-vue-admin-api** | [GitHub](https://github.com/Liukers/go-vue-admin-api) | [Gitee](https://gitee.com/liukers/go-vue-admin-api) |

### 快速启动完整项目

```bash
# 1. 克隆并启动后端
git clone https://github.com/Liukers/go-vue-admin-api.git
# 或 git clone https://gitee.com/liukers/go-vue-admin-api.git
cd go-vue-admin-api
go run main.go -db  # 初始化数据库
go run main.go      # 启动后端 (端口 8080)

# 2. 克隆并启动前端（新终端）
git clone https://github.com/Liukers/go-vue-admin-ui.git
# 或 git clone https://gitee.com/liukers/go-vue-admin-ui.git
cd go-vue-admin-ui
pnpm install
pnpm dev  # 启动前端 (端口 8848)
```

访问 http://localhost:8848

### 后端要求

- 支持 JWT 认证
- 提供动态路由接口 (`GET /api/v1/system/routes`)
- 支持 RBAC + Casbin 权限控制
- 提供系统设置接口 (`/api/v1/system/settings`)
- API 响应格式：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {}
  }
  ```

### 联调说明

```
前端 (localhost:8848)  →  Vite 代理  →  后端 (localhost:8080)
```

开发时确保：

1. 后端服务已启动（`go run main.go`）
2. `.env.development` 中的 `VITE_PROXY_TARGET` 指向正确后端地址
3. 后端 `setting.yaml` 中的 CORS 配置允许前端域名

## 🎨 功能模块

### 系统管理

| 模块     | 功能               | 说明                       |
| -------- | ------------------ | -------------------------- |
| 用户管理 | 增删改查、重置密码 | 系统用户管理               |
| 角色管理 | 增删改查、权限分配 | RBAC 角色管理              |
| 菜单管理 | 目录/菜单/按钮管理 | 动态路由配置               |
| 操作日志 | 查询、删除、清空   | 记录用户操作行为（可开关） |
| 登录日志 | 查询、删除、清空   | 记录登录行为（可开关）     |
| 系统设置 | 日志开关控制       | 开启/关闭操作/登录日志     |

### 系统功能

- **动态路由**: 根据权限动态生成路由和菜单
- **权限控制**: 按钮级别权限控制（`v-auth` 和 `v-perms` 指令）
- **主题切换**: 支持亮色/暗色主题
- **多标签页**: 类似浏览器的多标签页操作
- **全屏/搜索**: 全屏展示、菜单搜索

## 🛠️ 开发指南

### 如何新增页面

参考项目中已有的**用户管理**实现：

**1. 创建 API 文件**

参考 `src/api/system.ts` 创建 API 接口：

- 定义数据类型（TypeScript interface）
- 使用 `http.request` 封装请求

**2. 创建页面组件**

参考 `src/views/system/user/` 创建页面：

- 使用 `defineOptions` 设置页面名称（用于 keep-alive）
- 使用 Element Plus 组件构建表单和表格
- 使用 `v-perms` 指令控制按钮权限

**3. 后端配置菜单**

登录后端管理系统 → 菜单管理 → 新增：

| 字段     | 示例值             | 说明                         |
| -------- | ------------------ | ---------------------------- |
| 菜单名称 | 用户管理           | 显示在导航栏的名称           |
| 菜单类型 | 目录/菜单/按钮     | 目录包含子菜单，菜单对应页面 |
| 路由路径 | /system/user       | 前端路由地址                 |
| 组件路径 | /system/user/index | 对应 Vue 文件路径            |
| 权限标识 | system:user:list   | 用于按钮级权限控制           |

**4. 分配权限**

角色管理 → 选择角色 → 勾选对应菜单权限

### 菜单类型说明

| 类型     | 说明                                    | 示例             |
| -------- | --------------------------------------- | ---------------- |
| **目录** | 左侧导航栏分组，包含子菜单              | 系统管理         |
| **菜单** | 实际页面，点击后跳转                    | 用户管理         |
| **按钮** | 页面内操作权限，配合 `v-perms` 指令使用 | 新增、编辑、删除 |

**按钮权限使用示例：**

系统提供两种权限指令：

| 指令      | 作用             | 示例                               |
| --------- | ---------------- | ---------------------------------- |
| `v-auth`  | 基于用户权限标识 | `v-auth="['system:user:create']"`  |
| `v-perms` | 基于角色权限码   | `v-perms="['system:user:create']"` |

```vue
<el-button v-auth="['system:user:create']">新增用户</el-button>
<el-button v-auth="['system:user:update']">编辑</el-button>
<el-button v-auth="['system:user:delete']">删除</el-button>
```

> **说明**：`v-auth` 和 `v-perms` 功能相同，可根据项目规范选择使用。

### 常用组件

**图标使用**

```vue
<script setup>
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import UserIcon from "~icons/ri/user-line";
</script>

<template>
  <el-icon><component :is="useRenderIcon(UserIcon)" /></el-icon>
</template>
```

**权限指令**

```vue
<!-- 按钮权限 -->
<el-button v-perms="['system:user:create']">新增</el-button>
<el-button v-perms="['system:user:update']">编辑</el-button>
<el-button v-perms="['system:user:delete']">删除</el-button>
```

## 📝 常用命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产环境
pnpm build

# 预览生产构建
pnpm preview

# 类型检查
pnpm typecheck

# 代码格式化
pnpm lint:prettier

# 代码检查（ESLint）
pnpm lint:eslint

# 样式检查（Stylelint）
pnpm lint:stylelint

# 一键格式化所有
pnpm lint
```

## 📦 部署

### 生产环境配置

构建前必须修改 `.env.production`：

```env
# 修改为你的后端 API 地址
VITE_API_BASE_URL = https://your-api-domain.com/api

# gzip 压缩已默认启用
VITE_COMPRESSION = gzip
```

### 构建

```bash
# 构建生产环境
pnpm build

# 输出目录: dist/
# 构建产物包含 gzip 压缩文件
```

### 部署说明

构建完成后，将 `dist/` 目录下的文件部署到任意静态文件服务器即可。

### Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install -g pnpm
RUN pnpm install
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🎨 主题配置

编辑 `public/platform-config.json`：

```json
{
  "Title": "Go-Admin",
  "Theme": "light",
  "DarkMode": false,
  "SidebarStatus": true,
  "ShowLogo": true,
  ...
}
```

## 🙏 致谢

### 基于的开源项目

| 项目               | 说明                   | 地址                                         |
| ------------------ | ---------------------- | -------------------------------------------- |
| **vue-pure-admin** | 开源后台管理系统模板   | https://github.com/pure-admin/vue-pure-admin |
| **Vue 3**          | 渐进式 JavaScript 框架 | https://github.com/vuejs/core                |
| **Element Plus**   | Vue 3 组件库           | https://github.com/element-plus/element-plus |
| **Vite**           | 下一代前端构建工具     | https://github.com/vitejs/vite               |
| **Remix Icon**     | 开源图标库             | https://github.com/Remix-Design/RemixIcon    |

### 特别感谢

- **[vue-pure-admin](https://github.com/pure-admin/vue-pure-admin)** - 本项目基于此优秀的开源后台管理系统模板构建，感谢作者的出色工作！

## 📄 许可证

MIT License

## 🔗 相关仓库

| 平台       | 地址                                       |
| ---------- | ------------------------------------------ |
| **GitHub** | https://github.com/Liukers/go-vue-admin-ui |
| **Gitee**  | https://gitee.com/liukers/go-vue-admin-ui  |

**配套后端**：

- GitHub: https://github.com/Liukers/go-vue-admin-api
- Gitee: https://gitee.com/liukers/go-vue-admin-api

## 💬 问题反馈

- GitHub Issues: https://github.com/Liukers/go-vue-admin-ui/issues
- Gitee Issues: https://gitee.com/liukers/go-vue-admin-ui/issues

---

**如果觉得项目有帮助，请给个 Star ⭐️ 支持一下！**
