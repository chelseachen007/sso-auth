# @sso-auth/core

SSO Authentication Core SDK - API 客户端和 Token 管理。

## 安装

```bash
npm install @sso-auth/core
```

## 使用

### 创建客户端

```javascript
import { SsoClient } from '@sso-auth/core';

const client = new SsoClient({
  baseUrl: 'https://sso.example.com',
  storage: 'localStorage', // 或 'sessionStorage', 'memory'
  autoRefreshThreshold: 300 // Token 过期前 5 分钟自动刷新
});
```

### 登录

```javascript
// 用户名/邮箱登录
const result = await client.login({
  email: 'user@example.com',
  password: 'password'
});

console.log(result.token);
console.log(result.user);
```

### 注册

```javascript
const result = await client.register({
  username: 'myuser',
  email: 'user@example.com',
  password: 'password'
});
```

### 获取用户信息

```javascript
const user = await client.fetchUser();
console.log(user);
```

### 登出

```javascript
await client.logout();
```

### OAuth 登录

```javascript
// 跳转到 OAuth 授权页面
client.oauthLogin('github', 'https://myapp.com/callback');

// 处理 OAuth 回调
const result = client.handleOAuthCallback();
if (result) {
  console.log('OAuth 登录成功', result);
}
```

### 状态管理

```javascript
// 获取当前状态
const state = client.getState();
console.log(state.isAuthenticated, state.user, state.token);

// 订阅状态变化
const unsubscribe = client.subscribe((state) => {
  console.log('状态变化:', state);
});

// 取消订阅
unsubscribe();
```

### 会话管理

```javascript
// 获取所有会话
const sessions = await client.getSessions();

// 撤销指定会话
await client.revokeSession(sessionId);

// 撤销所有其他会话
await client.revokeOtherSessions();
```

## API

### SsoClient

| 方法 | 说明 |
|------|------|
| `login(data)` | 用户登录 |
| `register(data)` | 用户注册 |
| `logout()` | 登出 |
| `fetchUser()` | 获取当前用户信息 |
| `updateProfile(data)` | 更新用户资料 |
| `changePassword(data)` | 修改密码 |
| `verifyToken()` | 验证当前 Token |
| `refreshToken()` | 刷新 Token |
| `getSessions()` | 获取所有会话 |
| `revokeSession(id)` | 撤销指定会话 |
| `revokeOtherSessions()` | 撤销所有其他会话 |
| `oauthLogin(provider, redirectUri)` | OAuth 登录 |
| `handleOAuthCallback()` | 处理 OAuth 回调 |
| `subscribe(listener)` | 订阅状态变化 |
| `getState()` | 获取当前状态 |

## License

MIT
