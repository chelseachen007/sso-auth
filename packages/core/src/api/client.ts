/**
 * API Client - 处理与 SSO 服务器的所有 HTTP 通信
 */

import type {
  SsoClientConfig,
  SsoLoginRequest,
  SsoRegisterRequest,
  SsoTokenResponse,
  SsoTokenVerifyResponse,
  SsoUser,
  SsoUserWithProviders,
  SsoProfileUpdateRequest,
  SsoPasswordChangeRequest,
  SsoSession,
  SsoApplication,
  SsoApplicationCreateRequest,
  SsoApplicationUpdateRequest
} from '../types';

export class ApiClient {
  private baseUrl: string;
  private customFetch: typeof fetch;
  private getToken: () => string | null;

  constructor(config: SsoClientConfig, getToken: () => string | null) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.customFetch = config.fetch || fetch.bind(globalThis);
    this.getToken = getToken;
  }

  /**
   * 发送请求
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const url = `${this.baseUrl}${path}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await this.customFetch(url, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || 'Request failed',
        data.message || response.statusText,
        response.status
      );
    }

    return data;
  }

  // ========== 认证 API ==========

  /**
   * 用户登录
   */
  async login(data: SsoLoginRequest): Promise<SsoTokenResponse> {
    return this.request<SsoTokenResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * 用户注册
   */
  async register(data: SsoRegisterRequest): Promise<SsoTokenResponse> {
    return this.request<SsoTokenResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * 获取当前用户信息
   */
  async getMe(): Promise<SsoUserWithProviders> {
    return this.request<SsoUserWithProviders>('/api/auth/me');
  }

  /**
   * 更新用户资料
   */
  async updateProfile(data: SsoProfileUpdateRequest): Promise<SsoUser> {
    return this.request<SsoUser>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * 修改密码
   */
  async changePassword(data: SsoPasswordChangeRequest): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * 登出
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/logout', {
      method: 'POST'
    });
  }

  // ========== Token API ==========

  /**
   * 验证 Token
   */
  async verifyToken(token: string): Promise<SsoTokenVerifyResponse> {
    return this.request<SsoTokenVerifyResponse>('/api/token/verify', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  }

  /**
   * 刷新 Token
   */
  async refreshToken(): Promise<SsoTokenResponse> {
    return this.request<SsoTokenResponse>('/api/token/refresh', {
      method: 'POST'
    });
  }

  /**
   * 获取所有会话
   */
  async getSessions(): Promise<SsoSession[]> {
    return this.request<SsoSession[]>('/api/token/sessions');
  }

  /**
   * 撤销指定会话
   */
  async revokeSession(sessionId: number): Promise<{ success: boolean }> {
    return this.request(`/api/token/sessions/${sessionId}`, {
      method: 'DELETE'
    });
  }

  /**
   * 撤销所有其他会话
   */
  async revokeOtherSessions(): Promise<{ success: boolean; revokedCount: number }> {
    return this.request('/api/token/sessions/revoke-others', {
      method: 'POST'
    });
  }

  // ========== OAuth API ==========

  /**
   * 获取 OAuth 授权 URL
   */
  getOAuthUrl(provider: 'github' | 'google', redirectUri?: string): string {
    const params = new URLSearchParams();
    if (redirectUri) {
      params.set('redirect_uri', redirectUri);
    }
    return `${this.baseUrl}/api/oauth/${provider}?${params}`;
  }

  /**
   * 获取 OAuth 绑定 URL
   */
  async getOAuthBindUrl(provider: 'github' | 'google'): Promise<{ authorizeUrl: string }> {
    return this.request(`/api/oauth/bind/${provider}`, {
      method: 'POST'
    });
  }

  /**
   * 解绑 OAuth
   */
  async unbindOAuth(provider: 'github' | 'google'): Promise<{ success: boolean; deleted: number }> {
    return this.request(`/api/oauth/unbind/${provider}`, {
      method: 'DELETE'
    });
  }

  // ========== 应用管理 API ==========

  /**
   * 获取所有应用
   */
  async getApplications(): Promise<SsoApplication[]> {
    return this.request<SsoApplication[]>('/api/applications');
  }

  /**
   * 获取单个应用
   */
  async getApplication(id: number): Promise<SsoApplication> {
    return this.request<SsoApplication>(`/api/applications/${id}`);
  }

  /**
   * 创建应用
   */
  async createApplication(data: SsoApplicationCreateRequest): Promise<SsoApplication & { clientSecret: string }> {
    return this.request('/api/applications', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * 更新应用
   */
  async updateApplication(id: number, data: SsoApplicationUpdateRequest): Promise<SsoApplication> {
    return this.request<SsoApplication>(`/api/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * 重新生成 Client Secret
   */
  async regenerateSecret(id: number): Promise<{ id: number; name: string; clientSecret: string }> {
    return this.request(`/api/applications/${id}/regenerate-secret`, {
      method: 'POST'
    });
  }

  /**
   * 删除应用
   */
  async deleteApplication(id: number): Promise<{ success: boolean }> {
    return this.request(`/api/applications/${id}`, {
      method: 'DELETE'
    });
  }
}

/**
 * API 错误类
 */
export class ApiError extends Error {
  public statusCode: number;
  public message: string;

  constructor(error: string, message: string, statusCode: number) {
    super(error);
    this.name = 'ApiError';
    this.message = message;
    this.statusCode = statusCode;
  }
}
