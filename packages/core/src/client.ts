/**
 * SSO Client - 主入口类
 */

import { ApiClient, ApiError } from './api/index.js';
import { SsoStateStore, TokenStore, type StorageType } from './store/index.js';
import type {
  SsoClientConfig,
  SsoLoginRequest,
  SsoRegisterRequest,
  SsoTokenResponse,
  SsoUser,
  SsoUserWithProviders,
  SsoProfileUpdateRequest,
  SsoPasswordChangeRequest,
  SsoSession,
  SsoApplication,
  SsoApplicationCreateRequest,
  SsoApplicationUpdateRequest,
  SsoStoreState,
  SsoStoreListener
} from './types.js';

export class SsoClient {
  private api: ApiClient;
  private store: SsoStateStore;
  private tokenStore: TokenStore;
  private config: Required<Pick<SsoClientConfig, 'baseUrl' | 'storage' | 'autoRefreshThreshold'>>;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: SsoClientConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      storage: config.storage || 'localStorage',
      autoRefreshThreshold: config.autoRefreshThreshold || 300
    };

    this.tokenStore = new TokenStore(this.config.storage);
    this.store = new SsoStateStore(this.config.storage);
    this.api = new ApiClient(config, () => this.tokenStore.getToken());

    // 初始化时检查并设置刷新定时器
    if (this.store.getState().isAuthenticated) {
      this.scheduleTokenRefresh();
    }
  }

  // ========== 状态管理 ==========

  /**
   * 获取当前状态
   */
  getState(): SsoStoreState {
    return this.store.getState();
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener: SsoStoreListener): () => void {
    return this.store.subscribe(listener);
  }

  /**
   * 获取当前用户
   */
  get user(): SsoUser | null {
    return this.store.getState().user;
  }

  /**
   * 获取当前 Token
   */
  get token(): string | null {
    return this.store.getToken();
  }

  /**
   * 是否已认证
   */
  get isAuthenticated(): boolean {
    return this.store.getState().isAuthenticated;
  }

  /**
   * 是否加载中
   */
  get loading(): boolean {
    return this.store.getState().loading;
  }

  /**
   * 获取错误信息
   */
  get error(): string | null {
    return this.store.getState().error;
  }

  // ========== 认证方法 ==========

  /**
   * 用户登录
   */
  async login(data: SsoLoginRequest): Promise<SsoTokenResponse> {
    this.store.setLoading(true);
    this.store.setError(null);

    try {
      const response = await this.api.login(data);
      this.store.setToken(response.token);
      this.store.setUser(response.user);
      this.scheduleTokenRefresh();
      return response;
    } catch (err) {
      const error = err instanceof ApiError ? err.message : '登录失败';
      this.store.setError(error);
      throw err;
    } finally {
      this.store.setLoading(false);
    }
  }

  /**
   * 用户注册
   */
  async register(data: SsoRegisterRequest): Promise<SsoTokenResponse> {
    this.store.setLoading(true);
    this.store.setError(null);

    try {
      const response = await this.api.register(data);
      this.store.setToken(response.token);
      this.store.setUser(response.user);
      this.scheduleTokenRefresh();
      return response;
    } catch (err) {
      const error = err instanceof ApiError ? err.message : '注册失败';
      this.store.setError(error);
      throw err;
    } finally {
      this.store.setLoading(false);
    }
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    try {
      await this.api.logout();
    } catch {
      // 即使 API 调用失败，也清除本地状态
    } finally {
      this.clearRefreshTimer();
      this.store.clearAuth();
    }
  }

  /**
   * 获取当前用户信息
   */
  async fetchUser(): Promise<SsoUserWithProviders> {
    const user = await this.api.getMe();
    this.store.setUser(user);
    return user;
  }

  /**
   * 更新用户资料
   */
  async updateProfile(data: SsoProfileUpdateRequest): Promise<SsoUser> {
    const user = await this.api.updateProfile(data);
    this.store.setUser(user);
    return user;
  }

  /**
   * 修改密码
   */
  async changePassword(data: SsoPasswordChangeRequest): Promise<{ success: boolean; message: string }> {
    return this.api.changePassword(data);
  }

  // ========== Token 管理 ==========

  /**
   * 验证当前 Token
   */
  async verifyToken(): Promise<boolean> {
    const token = this.store.getToken();
    if (!token) return false;

    try {
      const result = await this.api.verifyToken(token);
      if (result.valid && result.user) {
        this.store.setUser(result.user);
        return true;
      }
      this.store.clearAuth();
      return false;
    } catch {
      this.store.clearAuth();
      return false;
    }
  }

  /**
   * 刷新 Token
   */
  async refreshToken(): Promise<SsoTokenResponse> {
    const response = await this.api.refreshToken();
    this.store.setToken(response.token);
    this.store.setUser(response.user);
    this.scheduleTokenRefresh();
    return response;
  }

  /**
   * 设置 Token 刷新定时器
   */
  private scheduleTokenRefresh(): void {
    this.clearRefreshTimer();

    if (this.tokenStore.isTokenExpiringSoon(this.config.autoRefreshThreshold)) {
      // Token 即将过期，立即刷新
      this.refreshToken().catch(() => {
        this.store.clearAuth();
      });
      return;
    }

    const expiry = this.tokenStore.getTokenExpiry();
    if (!expiry) return;

    const now = Date.now();
    const refreshTime = expiry.getTime() - this.config.autoRefreshThreshold * 1000 - now;

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken().catch(() => {
          this.store.clearAuth();
        });
      }, refreshTime);
    }
  }

  /**
   * 清除刷新定时器
   */
  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // ========== 会话管理 ==========

  /**
   * 获取所有会话
   */
  async getSessions(): Promise<SsoSession[]> {
    return this.api.getSessions();
  }

  /**
   * 撤销指定会话
   */
  async revokeSession(sessionId: number): Promise<{ success: boolean }> {
    return this.api.revokeSession(sessionId);
  }

  /**
   * 撤销所有其他会话
   */
  async revokeOtherSessions(): Promise<{ success: boolean; revokedCount: number }> {
    return this.api.revokeOtherSessions();
  }

  // ========== OAuth ==========

  /**
   * 获取 OAuth 登录 URL
   */
  getOAuthUrl(provider: 'github' | 'google', redirectUri?: string): string {
    return this.api.getOAuthUrl(provider, redirectUri);
  }

  /**
   * 发起 OAuth 登录（跳转到授权页面）
   */
  oauthLogin(provider: 'github' | 'google', redirectUri?: string): void {
    const url = this.getOAuthUrl(provider, redirectUri);
    window.location.href = url;
  }

  /**
   * 获取 OAuth 绑定 URL
   */
  async getOAuthBindUrl(provider: 'github' | 'google'): Promise<string> {
    const result = await this.api.getOAuthBindUrl(provider);
    return result.authorizeUrl;
  }

  /**
   * 绑定 OAuth 账号（跳转到授权页面）
   */
  async bindOAuth(provider: 'github' | 'google'): Promise<void> {
    const url = await this.getOAuthBindUrl(provider);
    window.location.href = url;
  }

  /**
   * 解绑 OAuth 账号
   */
  async unbindOAuth(provider: 'github' | 'google'): Promise<{ success: boolean; deleted: number }> {
    return this.api.unbindOAuth(provider);
  }

  // ========== 应用管理 ==========

  /**
   * 获取所有应用
   */
  async getApplications(): Promise<SsoApplication[]> {
    return this.api.getApplications();
  }

  /**
   * 获取单个应用
   */
  async getApplication(id: number): Promise<SsoApplication> {
    return this.api.getApplication(id);
  }

  /**
   * 创建应用
   */
  async createApplication(data: SsoApplicationCreateRequest): Promise<SsoApplication & { clientSecret: string }> {
    return this.api.createApplication(data);
  }

  /**
   * 更新应用
   */
  async updateApplication(id: number, data: SsoApplicationUpdateRequest): Promise<SsoApplication> {
    return this.api.updateApplication(id, data);
  }

  /**
   * 重新生成 Client Secret
   */
  async regenerateSecret(id: number): Promise<{ id: number; name: string; clientSecret: string }> {
    return this.api.regenerateSecret(id);
  }

  /**
   * 删除应用
   */
  async deleteApplication(id: number): Promise<{ success: boolean }> {
    return this.api.deleteApplication(id);
  }

  // ========== 工具方法 ==========

  /**
   * 处理 OAuth 回调（从 URL 中提取 token）
   */
  handleOAuthCallback(): SsoTokenResponse | null {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userStr = params.get('user');

    if (!token || !userStr) return null;

    try {
      const user = JSON.parse(decodeURIComponent(userStr)) as SsoUser;
      this.store.setToken(token);
      this.store.setUser(user);
      this.scheduleTokenRefresh();

      // 清理 URL
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('user');
      window.history.replaceState({}, '', url.toString());

      return { token, user };
    } catch {
      return null;
    }
  }

  /**
   * 销毁客户端
   */
  destroy(): void {
    this.clearRefreshTimer();
  }
}

// 导出类型
export type {
  SsoClientConfig,
  SsoUser,
  SsoUserWithProviders,
  SsoTokenResponse,
  SsoSession,
  SsoApplication,
  SsoStoreState,
  SsoStoreListener,
  SsoLoginRequest,
  SsoRegisterRequest,
  SsoProfileUpdateRequest,
  SsoPasswordChangeRequest,
  SsoApplicationCreateRequest,
  SsoApplicationUpdateRequest
};

export { ApiError } from './api/index.js';
export { TokenStore, SsoStateStore, type StorageType } from './store/index.js';
