/**
 * SSO Authentication - Type Definitions
 */

// ========== User Types ==========
export interface SsoUser {
  id: number;
  uuid: string;
  username: string | null;
  email: string | null;
  displayName: string | null;
  avatar: string | null;
}

export interface SsoAuthProvider {
  provider: string;
  createdAt: string;
}

export interface SsoUserWithProviders extends SsoUser {
  authProviders: SsoAuthProvider[];
}

// ========== Token Types ==========
export interface SsoTokenResponse {
  token: string;
  user: SsoUser;
}

export interface SsoTokenVerifyResponse {
  valid: boolean;
  user?: SsoUser;
  error?: string;
}

// ========== Session Types ==========
export interface SsoSession {
  id: number;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

// ========== Auth Request Types ==========
export interface SsoLoginRequest {
  username?: string;
  email?: string;
  password: string;
}

export interface SsoRegisterRequest {
  username?: string;
  email?: string;
  password: string;
}

export interface SsoProfileUpdateRequest {
  displayName?: string;
  avatar?: string;
  email?: string;
}

export interface SsoPasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

// ========== OAuth Types ==========
export interface SsoOAuthConfig {
  providers: ('github' | 'google')[];
  redirectUri?: string;
}

// ========== Application Types ==========
export interface SsoApplication {
  id: number;
  name: string;
  clientId: string;
  redirectUris: string[];
  isActive: boolean;
  createdAt: string;
}

export interface SsoApplicationCreateRequest {
  name: string;
  redirectUris: string[];
}

export interface SsoApplicationUpdateRequest {
  name?: string;
  redirectUris?: string[];
  isActive?: boolean;
}

// ========== Client Config ==========
export interface SsoClientConfig {
  /** SSO Server base URL */
  baseUrl: string;
  /** Token storage type */
  storage?: 'localStorage' | 'sessionStorage' | 'memory';
  /** Auto refresh token before expiry (in seconds) */
  autoRefreshThreshold?: number;
  /** Custom fetch function */
  fetch?: typeof fetch;
}

// ========== Event Types ==========
export interface SsoLoginEvent extends CustomEvent {
  detail: SsoTokenResponse;
}

export interface SsoLogoutEvent extends CustomEvent {
  detail: { success: boolean };
}

export interface SsoErrorEvent extends CustomEvent {
  detail: { error: string; message?: string };
}

export interface SsoUserUpdateEvent extends CustomEvent {
  detail: SsoUser;
}

// ========== Store Types ==========
export interface SsoStoreState {
  user: SsoUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export type SsoStoreListener = (state: SsoStoreState) => void;
