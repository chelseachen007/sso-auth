# @sso-auth/components

SSO Authentication Web Components - 基于 Lit 的 Web Components UI 组件库。

## 安装

```bash
npm install @sso-auth/components @sso-auth/core
```

## 快速开始

### 在 HTML 中直接使用

```html
<script type="module" src="https://unpkg.com/@sso-auth/components/dist/define.js"></script>

<sso-provider base-url="https://sso.example.com">
  <sso-login></sso-login>
</sso-provider>

<script>
  document.addEventListener('sso-login-success', (e) => {
    console.log('登录成功', e.detail);
  });
</script>
```

### 在 React 中使用

```jsx
import '@sso-auth/components/dist/define.js';

function LoginPage() {
  const handleLogin = (e) => {
    console.log('登录成功', e.detail);
  };

  return (
    <sso-provider base-url="https://sso.example.com">
      <sso-login onSsoLoginSuccess={handleLogin}></sso-login>
    </sso-provider>
  );
}
```

### 在 Vue 中使用

```vue
<template>
  <sso-provider base-url="https://sso.example.com">
    <sso-login @sso-login-success="handleLogin"></sso-login>
  </sso-provider>
</template>

<script setup>
import '@sso-auth/components/dist/define.js';

const handleLogin = (e) => {
  console.log('登录成功', e.detail);
};
</script>
```

## 组件列表

### `<sso-provider>`

顶层容器组件，提供 SSO 客户端配置给所有子组件。

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `base-url` | SSO 服务器地址 | `string` | - |
| `storage` | Token 存储方式 | `'localStorage' \| 'sessionStorage' \| 'memory'` | `'localStorage'` |
| `theme` | 主题配置（JSON 或预设名称） | `string` | - |
| `locale` | 语言 | `string` | `'zh-CN'` |

### `<sso-login>`

登录组件。

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `redirect-uri` | 登录成功后重定向地址 | `string` | - |
| `show-oauth` | 是否显示 OAuth 按钮 | `boolean` | `false` |
| `oauth-providers` | OAuth 提供商列表 | `('github' \| 'google')[]` | - |
| `mode` | 显示模式 | `'card' \| 'plain'` | `'card'` |
| `title` | 标题 | `string` | `'登录'` |
| `register-link` | 注册链接 | `string` | - |

| 事件 | 说明 |
|------|------|
| `sso-login-success` | 登录成功 |
| `sso-login-error` | 登录失败 |

### `<sso-register>`

注册组件。

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `redirect-uri` | 注册成功后重定向地址 | `string` | - |
| `mode` | 显示模式 | `'card' \| 'plain'` | `'card'` |
| `login-link` | 登录链接 | `string` | - |

| 事件 | 说明 |
|------|------|
| `sso-register-success` | 注册成功 |
| `sso-register-error` | 注册失败 |

### `<sso-profile>`

用户资料组件。

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `editable` | 是否可编辑 | `boolean` | `true` |
| `mode` | 显示模式 | `'card' \| 'plain'` | `'card'` |

### `<sso-password>`

修改密码组件。

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `mode` | 显示模式 | `'card' \| 'plain'` | `'card'` |

### `<sso-sessions>`

会话管理组件。

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `mode` | 显示模式 | `'card' \| 'plain'` | `'card'` |

### `<sso-app-list>`

应用列表组件。

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `manageable` | 是否可管理 | `boolean` | `true` |
| `mode` | 显示模式 | `'card' \| 'plain'` | `'card'` |

## 主题定制

通过 CSS 自定义属性覆盖主题：

```html
<style>
  sso-provider {
    --sso-primary-color: #10b981;
    --sso-primary-hover-color: #059669;
    --sso-border-radius: 12px;
  }
</style>
```

可用的 CSS 变量：

- `--sso-primary-color` - 主色
- `--sso-primary-hover-color` - 主色悬停
- `--sso-error-color` - 错误色
- `--sso-success-color` - 成功色
- `--sso-text-color` - 文字颜色
- `--sso-background-color` - 背景色
- `--sso-surface-color` - 表面色
- `--sso-border-color` - 边框色
- `--sso-font-family` - 字体
- `--sso-font-size` - 字体大小
- `--sso-border-radius` - 圆角
- `--sso-shadow` - 阴影

## License

MIT
