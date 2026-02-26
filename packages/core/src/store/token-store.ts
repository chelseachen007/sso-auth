/**
 * Token Store - 管理认证 Token 存储
 */

export type StorageType = 'localStorage' | 'sessionStorage' | 'memory';

interface MemoryStore {
  token: string | null;
}

const TOKEN_KEY = 'sso_token';
const USER_KEY = 'sso_user';

export class TokenStore {
  private storageType: StorageType;
  private memoryStore: MemoryStore = { token: null };

  constructor(storageType: StorageType = 'localStorage') {
    this.storageType = storageType;
  }

  /**
   * 保存 Token
   */
  setToken(token: string | null): void {
    if (token === null) {
      this.removeToken();
      return;
    }

    switch (this.storageType) {
      case 'localStorage':
        localStorage.setItem(TOKEN_KEY, token);
        break;
      case 'sessionStorage':
        sessionStorage.setItem(TOKEN_KEY, token);
        break;
      case 'memory':
        this.memoryStore.token = token;
        break;
    }
  }

  /**
   * 获取 Token
   */
  getToken(): string | null {
    switch (this.storageType) {
      case 'localStorage':
        return localStorage.getItem(TOKEN_KEY);
      case 'sessionStorage':
        return sessionStorage.getItem(TOKEN_KEY);
      case 'memory':
        return this.memoryStore.token;
    }
  }

  /**
   * 移除 Token
   */
  removeToken(): void {
    switch (this.storageType) {
      case 'localStorage':
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        break;
      case 'sessionStorage':
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        break;
      case 'memory':
        this.memoryStore.token = null;
        break;
    }
  }

  /**
   * 解析 JWT payload（不验证签名）
   */
  parseJwt(token: string): Record<string, unknown> | null {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  /**
   * 检查 Token 是否即将过期
   * @param thresholdSeconds 提前多少秒认为即将过期
   */
  isTokenExpiringSoon(thresholdSeconds: number = 300): boolean {
    const token = this.getToken();
    if (!token) return true;

    const payload = this.parseJwt(token);
    if (!payload || !payload.exp) return true;

    const expiresAt = (payload.exp as number) * 1000;
    const now = Date.now();

    return expiresAt - now < thresholdSeconds * 1000;
  }

  /**
   * 检查 Token 是否已过期
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    const payload = this.parseJwt(token);
    if (!payload || !payload.exp) return true;

    const expiresAt = (payload.exp as number) * 1000;
    return Date.now() >= expiresAt;
  }

  /**
   * 获取 Token 过期时间
   */
  getTokenExpiry(): Date | null {
    const token = this.getToken();
    if (!token) return null;

    const payload = this.parseJwt(token);
    if (!payload || !payload.exp) return null;

    return new Date((payload.exp as number) * 1000);
  }
}

// 创建默认实例
export const tokenStore = new TokenStore();
