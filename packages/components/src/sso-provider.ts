/**
 * SsoProvider - 顶层容器组件
 * 提供 SSO 客户端配置和状态给所有子组件
 */

import { LitElement, html } from 'lit';
import { customElement, property, provide } from 'lit/decorators.js';
import { createContext } from '@lit/context';
import { SsoClient, type SsoClientConfig, type SsoUser, type SsoStoreState } from '@sso-auth/core';
import { defaultTheme, generateCssVariables, type SsoTheme } from '../themes/index.js';

// 创建 Context
export const ssoClientContext = createContext<SsoClient | null>('sso-client');
export const ssoThemeContext = createContext<SsoTheme>('sso-theme');

/**
 * SsoProvider 组件
 *
 * @example
 * ```html
 * <sso-provider base-url="http://localhost:3002">
 *   <sso-login></sso-login>
 * </sso-provider>
 * ```
 */
@customElement('sso-provider')
export class SsoProvider extends LitElement {
  /** SSO 服务器地址 */
  @property({ attribute: 'base-url' })
  baseUrl = 'http://localhost:3002';

  /** Token 存储方式 */
  @property({ attribute: 'storage' })
  storage: 'localStorage' | 'sessionStorage' | 'memory' = 'localStorage';

  /** 主题配置（JSON 字符串或预设名称） */
  @property({ attribute: 'theme' })
  theme?: string;

  /** 自动刷新 Token 的阈值（秒） */
  @property({ attribute: 'auto-refresh-threshold', type: Number })
  autoRefreshThreshold = 300;

  /** 语言 */
  @property({ attribute: 'locale' })
  locale = 'zh-CN';

  @provide({ context: ssoClientContext })
  private client: SsoClient | null = null;

  @provide({ context: ssoThemeContext })
  private themeConfig: SsoTheme = defaultTheme;

  private unsubscribe: (() => void) | null = null;

  override connectedCallback(): void {
    super.connectedCallback();

    // 初始化客户端
    this.client = new SsoClient({
      baseUrl: this.baseUrl,
      storage: this.storage,
      autoRefreshThreshold: this.autoRefreshThreshold
    });

    // 解析主题
    this.parseTheme();

    // 订阅状态变化
    this.unsubscribe = this.client.subscribe((state) => {
      this.dispatchEvent(new CustomEvent('sso-state-change', {
        detail: state,
        bubbles: true,
        composed: true
      }));
    });

    // 如果有 token，验证并获取用户信息
    if (this.client.isAuthenticated) {
      this.client.verifyToken().catch(() => {});
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.client) {
      this.client.destroy();
    }
  }

  private parseTheme(): void {
    if (!this.theme) {
      this.themeConfig = defaultTheme;
      return;
    }

    try {
      // 尝试解析 JSON
      const parsed = JSON.parse(this.theme);
      this.themeConfig = { ...defaultTheme, ...parsed };
    } catch {
      // 预设主题名称
      if (this.theme === 'dark') {
        const { darkTheme } = require('../themes/index.js');
        this.themeConfig = darkTheme;
      } else {
        this.themeConfig = defaultTheme;
      }
    }
  }

  override render() {
    return html`
      <style>
        :host {
          display: block;
          ${generateCssVariables(this.themeConfig)}
          font-family: var(--sso-font-family);
          font-size: var(--sso-font-size);
          line-height: var(--sso-line-height);
          color: var(--sso-text-color);
        }
      </style>
      <slot></slot>
    `;
  }

  /**
   * 获取 SSO 客户端实例
   */
  getClient(): SsoClient | null {
    return this.client;
  }

  /**
   * 获取当前状态
   */
  getState(): SsoStoreState | null {
    return this.client?.getState() || null;
  }

  /**
   * 获取当前用户
   */
  getUser(): SsoUser | null {
    return this.client?.user || null;
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return this.client?.isAuthenticated || false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sso-provider': SsoProvider;
  }
}
