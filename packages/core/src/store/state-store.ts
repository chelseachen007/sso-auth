/**
 * State Store - 响应式状态管理
 */

import type { SsoUser, SsoStoreState, SsoStoreListener } from '../types';
import { TokenStore, type StorageType } from './token-store';

export class SsoStateStore {
  private state: SsoStoreState;
  private listeners: Set<SsoStoreListener> = new Set();
  private tokenStore: TokenStore;

  constructor(storageType: StorageType = 'localStorage') {
    this.tokenStore = new TokenStore(storageType);
    const token = this.tokenStore.getToken();

    this.state = {
      user: null,
      token,
      isAuthenticated: !!token && !this.tokenStore.isTokenExpired(),
      loading: false,
      error: null
    };
  }

  /**
   * 获取当前状态
   */
  getState(): SsoStoreState {
    return { ...this.state };
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener: SsoStoreListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 更新状态
   */
  setState(partial: Partial<SsoStoreState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  /**
   * 设置用户信息
   */
  setUser(user: SsoUser | null): void {
    this.setState({
      user,
      isAuthenticated: !!user
    });
  }

  /**
   * 设置 Token
   */
  setToken(token: string | null): void {
    this.tokenStore.setToken(token);
    this.setState({
      token,
      isAuthenticated: !!token && !this.tokenStore.isTokenExpired()
    });
  }

  /**
   * 获取 Token
   */
  getToken(): string | null {
    return this.tokenStore.getToken();
  }

  /**
   * 设置加载状态
   */
  setLoading(loading: boolean): void {
    this.setState({ loading });
  }

  /**
   * 设置错误信息
   */
  setError(error: string | null): void {
    this.setState({ error });
  }

  /**
   * 清除认证状态
   */
  clearAuth(): void {
    this.tokenStore.removeToken();
    this.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null
    });
  }

  /**
   * 通知所有监听器
   */
  private notify(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }
}

// 创建默认实例
export const stateStore = new SsoStateStore();
