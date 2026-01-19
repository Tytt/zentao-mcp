# 禅道 MCP Server

让 AI 助手能够直接管理禅道中的 Bug、需求和测试用例。通过 MCP (Model Context Protocol)，你可以用自然语言与 AI 交流来查询、创建、更新和关闭各种禅道数据。

## ✨ 功能特性

### Bug 管理
- 📋 获取 Bug 列表（支持按状态筛选）
- 🔍 查看 Bug 详情
- ➕ 创建新 Bug
- ✅ 解决 Bug（标记为已修复）
- 🔒 关闭 Bug
- 🔄 激活 Bug（重新打开）
- ✔️ 确认 Bug

### 需求管理
- 📋 获取需求列表（支持按状态筛选）
- 🔍 查看需求详情
- ➕ 创建新需求
- 🔒 关闭需求
- 🔄 激活需求

### 测试用例管理
- 📋 获取测试用例列表
- 🔍 查看测试用例详情
- ➕ 创建测试用例
- ✏️ 修改测试用例
- 🗑️ 删除测试用例

### 其他功能
- 📦 获取产品列表
- 📁 获取项目列表
- 🔄 获取执行（迭代）列表

## 🚀 快速开始

### 方式一：使用 npx（推荐）

无需安装，直接在 MCP 客户端配置中使用：

#### Cursor 配置

编辑 `~/.cursor/mcp.json`（Windows: `%USERPROFILE%\.cursor\mcp.json`）：

```json
{
  "mcpServers": {
    "zentao": {
      "command": "npx",
      "args": ["-y", "@tytt/zentao-mcp"],
      "env": {
        "ZENTAO_URL": "https://your-zentao-server.com",
        "ZENTAO_ACCOUNT": "your_username",
        "ZENTAO_PASSWORD": "your_password",
        "ZENTAO_SKIP_SSL": "true"
      }
    }
  }
}
```

#### Claude Desktop 配置

编辑 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "zentao": {
      "command": "npx",
      "args": ["-y", "@tytt/zentao-mcp"],
      "env": {
        "ZENTAO_URL": "https://your-zentao-server.com",
        "ZENTAO_ACCOUNT": "your_username",
        "ZENTAO_PASSWORD": "your_password",
        "ZENTAO_SKIP_SSL": "true"
      }
    }
  }
}
```

### 方式二：全局安装

```bash
npm install -g @tytt/zentao-mcp
```

然后在 MCP 配置中使用：

```json
{
  "mcpServers": {
    "zentao": {
      "command": "zentao-mcp",
      "env": {
        "ZENTAO_URL": "https://your-zentao-server.com",
        "ZENTAO_ACCOUNT": "your_username",
        "ZENTAO_PASSWORD": "your_password",
        "ZENTAO_SKIP_SSL": "true"
      }
    }
  }
}
```

### 方式三：从源码运行

1. 克隆项目并安装依赖：

```bash
git clone https://github.com/Tytt/zentao-mcp.git
cd zentao-mcp
npm install
npm run build
```

2. 在 MCP 配置中使用本地路径：

```json
{
  "mcpServers": {
    "zentao": {
      "command": "node",
      "args": ["/path/to/zentao-mcp/dist/index.js"],
      "env": {
        "ZENTAO_URL": "https://your-zentao-server.com",
        "ZENTAO_ACCOUNT": "your_username",
        "ZENTAO_PASSWORD": "your_password",
        "ZENTAO_SKIP_SSL": "true"
      }
    }
  }
}
```

## ⚙️ 环境变量说明

| 变量名 | 必填 | 说明 |
|-------|------|------|
| `ZENTAO_URL` | ✅ | 禅道服务器地址（包含协议，如 `https://zentao.example.com`） |
| `ZENTAO_ACCOUNT` | ✅ | 禅道登录账号 |
| `ZENTAO_PASSWORD` | ✅ | 禅道登录密码 |
| `ZENTAO_SKIP_SSL` | ❌ | 是否跳过 SSL 证书验证（自签名证书时设为 `true`） |

## 💬 使用示例

配置完成后，你可以用自然语言与 AI 交流来管理禅道：

### Bug 相关

```
> "帮我看下有哪些 Bug 还没修复"
> "查看 Bug #123 的详细信息"
> "我已经修复了 Bug #123，帮我关闭它"
> "在产品 1 创建一个 Bug：登录页面按钮点击无响应"
```

### 需求相关

```
> "列出产品 1 的需求"
> "有哪些正在进行中的需求？"
> "创建一个新需求：用户登录功能优化"
```

### 测试用例相关

```
> "帮我看下有哪些测试用例"
> "创建一个登录功能的测试用例"
> "删除测试用例 #5"
```

## 🛠️ 可用工具列表

### Bug 管理

| 工具名称 | 描述 |
|---------|------|
| `zentao_get_bugs` | 获取 Bug 列表，支持状态筛选 |
| `zentao_get_active_bugs` | 获取未解决的 Bug 列表 |
| `zentao_get_assigned_bugs` | 获取指派给某人的 Bug |
| `zentao_get_bug` | 获取 Bug 详情 |
| `zentao_create_bug` | 创建新 Bug |
| `zentao_resolve_bug` | 解决 Bug |
| `zentao_close_bug` | 关闭 Bug |
| `zentao_activate_bug` | 激活 Bug |
| `zentao_confirm_bug` | 确认 Bug |

### 需求管理

| 工具名称 | 描述 |
|---------|------|
| `zentao_get_stories` | 获取需求列表 |
| `zentao_get_active_stories` | 获取进行中的需求 |
| `zentao_get_story` | 获取需求详情 |
| `zentao_create_story` | 创建新需求 |
| `zentao_close_story` | 关闭需求 |
| `zentao_activate_story` | 激活需求 |

### 测试用例管理

| 工具名称 | 描述 |
|---------|------|
| `zentao_get_testcases` | 获取测试用例列表 |
| `zentao_get_testcase` | 获取测试用例详情 |
| `zentao_create_testcase` | 创建测试用例 |
| `zentao_update_testcase` | 修改测试用例 |
| `zentao_delete_testcase` | 删除测试用例 |

### 产品和项目

| 工具名称 | 描述 |
|---------|------|
| `zentao_get_products` | 获取产品列表 |
| `zentao_get_projects` | 获取项目列表 |
| `zentao_get_executions` | 获取执行列表 |

## 📝 状态说明

### Bug 状态

| 状态 | 描述 |
|------|------|
| `active` | 未解决/激活状态 |
| `resolved` | 已解决，待验证 |
| `closed` | 已关闭 |

### 需求状态

| 状态 | 描述 |
|------|------|
| `draft` | 草稿 |
| `active` | 激活/进行中 |
| `changed` | 已变更 |
| `reviewing` | 评审中 |
| `closed` | 已关闭 |

### 测试用例状态

| 状态 | 描述 |
|------|------|
| `wait` | 待评审 |
| `normal` | 正常 |
| `blocked` | 被阻塞 |
| `investigate` | 研究中 |

## ⚠️ 注意事项

1. **API 版本**：本项目基于禅道 REST API v1 开发，适用于禅道 12.x 及以上版本
2. **权限**：确保配置的账号有足够的权限进行相应操作
3. **SSL 证书**：如果禅道使用自签名证书，需要设置 `ZENTAO_SKIP_SSL=true`
4. **密码安全**：不要将配置文件提交到公开的版本控制系统

## 🔧 发布到 npm（维护者）

```bash
# 登录 npm
npm login

# 发布
npm publish --access public
```

## 📄 License

MIT
