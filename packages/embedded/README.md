# @sso-auth/embedded

SSO Authentication Embedded SDK - 支持 iframe 嵌入和弹窗式登录。

## 安装

```bash
npm install @sso-auth/embedded @sso-auth/core
```

## 使用

### 创建实例

```javascript
import { SsoEmbedded } from '@sso-auth/embedded';

const auth = new SsoEmbedded({
  baseUrl: 'https://sso.example.com',
  ssoUrl: 'https://sso.example.com',
  storage: 'localStorage'
});
```

### 弹窗式登录

```javascript
auth.openPopupLogin({
  width: 400,
  height: 600,
  onSuccess: (data) => {
    console.log('登录成功', data.token, data.user);
  },
  onError: (error) => {
    console.error('登录失败', error);
  },
  onClose: () => {
    console.log('弹窗已关闭');
  }
});
```

### iframe 嵌入

```javascript
const iframe = auth.embedLogin('#login-container', {
  onSuccess: (data) => {
    console.log('登录成功', data);
  },
  onError: (error) => {
    console.error('登录失败', error);
  }
});

// 如果需要移除 iframe
iframe.remove();
```

### 关闭弹窗

```javascript
auth.closePopup();
```

### 继承自 SsoClient

`SsoEmbedded` 继承自 `SsoClient`，因此可以使用所有核心方法：

```javascript
// 登录状态
console.log(auth.isAuthenticated);
console.log(auth.user);

// 手动登录
await auth.login({ email: '...', password: '...' });

// 登出
await auth.logout();

// 订阅状态变化
auth.subscribe((state) => {
  console.log('状态变化', state);
});
```

## 后端配置

需要在 SSO 服务器添加嵌入式登录页面：

```
GET /embedded/login - 嵌入式登录页面
```

页面需要支持 `postMessage` 与父窗口通信：

```javascript
// 登录成功
window.parent.postMessage({
  type: 'sso-login-success',
  payload: { token: '...', user: { ... } }
}, '*');

// 登录失败
window.parent.postMessage({
  type: 'sso-login-error',
  payload: { error: '错误信息' }
}, '*');
```

## API

### SsoEmbeddedOptions

| 选项 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `baseUrl` | SSO API 地址 | `string` | - |
| `ssoUrl` | SSO 服务器地址（用于 iframe/popup） | `string` | `baseUrl` |
| `storage` | Token 存储方式 | `string` | `'localStorage'` |
| `embeddedPath` | 嵌入式登录页面路径 | `string` | `'/embedded/login'` |

### SsoPopupOptions

| 选项 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `width` | 弹窗宽度 | `number` | `400` |
| `height` | 弹窗高度 | `number` | `600` |
| `onSuccess` | 登录成功回调 | `function` | - |
| `onError` | 登录失败回调 | `function` | - |
| `onClose` | 弹窗关闭回调 | `function` | - |

### SsoIframeOptions

| 选项 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `onSuccess` | 登录成功回调 | `function` | - |
| `onError` | 登录失败回调 | `function` | - |

## License

MIT
