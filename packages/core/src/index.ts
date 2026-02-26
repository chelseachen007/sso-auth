/**
 * @sso-auth/core
 * SSO Authentication Core SDK
 */

// 主类
export { SsoClient } from './client.js';

// API
export { ApiClient, ApiError } from './api/index.js';

// Store
export { TokenStore, SsoStateStore, tokenStore, stateStore, type StorageType } from './store/index.js';

// 类型导出
export type {
  // 用户类型
  SsoUser,
  SsoUserWithProviders,
  SsoAuthProvider,

  // Token 类型
  SsoTokenResponse,
  SsoTokenVerifyResponse,

  // 会话类型
  SsoSession,

  // 请求类型
  SsoLoginRequest,
  SsoRegisterRequest,
  SsoProfileUpdateRequest,
  SsoPasswordChangeRequest,
  SsoOAuthConfig,

  // 应用类型
  SsoApplication,
  SsoApplicationCreateRequest,
  SsoApplicationUpdateRequest,

  // 配置类型
  SsoClientConfig,

  // Store 类型
  SsoStoreState,
  SsoStoreListener,

  // 事件类型
  SsoLoginEvent,
  SsoLogoutEvent,
  SsoErrorEvent,
  SsoUserUpdateEvent
} from './types.js';
