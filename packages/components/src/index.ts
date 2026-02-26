/**
 * @sso-auth/components
 * SSO Authentication Web Components
 */

// Provider
export { SsoProvider, ssoClientContext, ssoThemeContext } from './sso-provider.js';

// Login
export { SsoLogin } from './login/index.js';

// Register
export { SsoRegister } from './register/index.js';

// Profile
export { SsoProfile } from './profile/index.js';
import './profile/sso-password.js';

// Sessions
export { SsoSessions } from './sessions/index.js';

// Applications
export { SsoAppList, SsoAppForm } from './applications/index.js';

// Themes
export { defaultTheme, darkTheme, generateCssVariables, type SsoTheme } from './themes/index.js';

// Re-export types from core
export type {
  SsoClientConfig,
  SsoUser,
  SsoTokenResponse,
  SsoStoreState,
  SsoLoginRequest,
  SsoRegisterRequest
} from '@sso-auth/core';
