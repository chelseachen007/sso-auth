# SSO Auth - 单点登录认证服务

独立的单点登录认证服务，支持用户名/密码登录和第三方 OAuth 登录。

## 架构

```
┌─────────────────────────────────────┐
│     SSO Auth (独立部署)              │
│     sso.example.com:3002            │
└─────────────────────────────────────┘
         ↓              ↓              ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Personal     │ │ App 2        │ │ App 3        │
│ Tracker      │ │              │ │              │
│ tracker.xxx  │ │ app2.xxx     │ │ app3.xxx     │
└──────────────┘ └──────────────┘ └──────────────┘
```

## 快速开始

### 1. 安装依赖

```bash
npm install
npx prisma generate
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`：

```env
# JWT 密钥（必须修改！）
JWT_SECRET=your-strong-random-secret-key

# GitHub OAuth（可选）
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Google OAuth（可选）
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. 初始化数据库

```bash
npx prisma migrate dev --name init
```

### 4. 启动服务

```bash
npm run dev    # 开发模式
npm start      # 生产模式
```

## Docker 部署

### 构建并运行

```bash
docker build -t sso-auth .
docker run -d -p 3002:3002 \
  -v $(pwd)/database:/app/database \
  -e JWT_SECRET=your-secret \
  sso-auth
```

### Docker Compose

```yaml
version: '3.8'
services:
  sso-auth:
    build: .
    ports:
      - "3002:3002"
    volumes:
      - ./database:/app/database
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
      - GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
    restart: unless-stopped
```

## 配置 OAuth

### GitHub OAuth

1. 访问 https://github.com/settings/developers
2. 创建 OAuth App
3. Callback URL: `https://sso.example.com/api/oauth/github/callback`

### Google OAuth

1. 访问 https://console.cloud.google.com/apis/credentials
2. 创建 OAuth 2.0 客户端 ID
3. 重定向 URI: `https://sso.example.com/api/oauth/google/callback`

## API 文档

启动后访问 http://localhost:3002/docs

### 主要接口

| 接口 | 方法 | 描述 |
|-----|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/me` | GET | 获取当前用户 |
| `/api/auth/logout` | POST | 登出 |
| `/api/oauth/github` | GET | GitHub 登录 |
| `/api/oauth/google` | GET | Google 登录 |
| `/api/token/verify` | POST | 验证 Token |
| `/api/applications` | CRUD | 应用管理 |

## 接入新应用

### 1. 注册应用

```bash
curl -X POST https://sso.example.com/api/applications \
  -H "Content-Type: application/json" \
  -d '{"name": "My App", "redirectUris": ["https://myapp.example.com/auth/callback"]}'
```

### 2. 后端验证 Token

```javascript
const response = await fetch('https://sso.example.com/api/token/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token })
})
const { valid, user } = await response.json()
```

### 3. 前端登录

```javascript
// 跳转到 SSO 登录
const redirect = encodeURIComponent('https://myapp.example.com/auth/callback')
window.location.href = `https://sso.example.com/api/oauth/github?redirect_uri=${redirect}`

// 处理回调
const token = new URLSearchParams(location.search).get('token')
const user = JSON.parse(new URLSearchParams(location.search).get('user'))
```

## 项目结构

```
sso-auth/
├── src/
│   ├── server.js           # 入口
│   ├── routes/
│   │   ├── auth.js         # 认证
│   │   ├── oauth.js        # OAuth
│   │   ├── token.js        # Token
│   │   └── applications.js # 应用管理
│   └── services/
│       └── tokenService.js
├── prisma/schema.prisma
├── Dockerfile
└── package.json
```
