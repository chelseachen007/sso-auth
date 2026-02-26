/**
 * SsoLogin - 登录组件
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { classMap } from 'lit/directives/class-map.js';
import { ssoClientContext, ssoThemeContext } from '../sso-provider.js';
import { SsoClient, ApiError } from '@sso-auth/core';
import type { SsoTheme } from '../themes/index.js';
import { baseStyles, formStyles, buttonStyles, cardStyles, oauthButtonStyles } from '../common/styles.js';

/**
 * 登录组件
 *
 * @fires sso-login-success - 登录成功
 * @fires sso-login-error - 登录失败
 *
 * @example
 * ```html
 * <sso-provider base-url="http://localhost:3002">
 *   <sso-login
 *     show-oauth
 *     oauth-providers='["github", "google"]'
 *   ></sso-login>
 * </sso-provider>
 * ```
 */
@customElement('sso-login')
export class SsoLogin extends LitElement {
  static override styles = [
    baseStyles,
    formStyles,
    buttonStyles,
    cardStyles,
    oauthButtonStyles,
    css`
      :host {
        max-width: 400px;
        margin: 0 auto;
      }

      .login-header {
        text-align: center;
        margin-bottom: var(--sso-spacing-large, 24px);
      }

      .login-title {
        font-size: var(--sso-font-size-large, 16px);
        font-weight: 600;
        margin-bottom: var(--sso-spacing-small, 8px);
      }

      .login-subtitle {
        font-size: var(--sso-font-size, 14px);
        color: var(--sso-text-secondary-color, #6b7280);
      }

      .divider {
        display: flex;
        align-items: center;
        margin: var(--sso-spacing, 16px) 0;
        color: var(--sso-text-secondary-color, #6b7280);
        font-size: var(--sso-font-size-small, 12px);
      }

      .divider::before,
      .divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background-color: var(--sso-border-color, #e5e7eb);
      }

      .divider span {
        padding: 0 var(--sso-spacing-small, 8px);
      }

      .footer-link {
        display: block;
        text-align: center;
        margin-top: var(--sso-spacing, 16px);
        color: var(--sso-primary-color, #3b82f6);
        text-decoration: none;
        font-size: var(--sso-font-size, 14px);
      }

      .footer-link:hover {
        text-decoration: underline;
      }

      .alert {
        padding: var(--sso-spacing-small, 8px) var(--sso-spacing, 16px);
        margin-bottom: var(--sso-spacing, 16px);
        border-radius: var(--sso-border-radius, 8px);
        font-size: var(--sso-font-size, 14px);
      }

      .alert-error {
        background-color: #fef2f2;
        color: var(--sso-error-color, #ef4444);
        border: 1px solid #fecaca;
      }

      .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `
  ];

  @consume({ context: ssoClientContext, subscribe: true })
  private client?: SsoClient;

  @consume({ context: ssoThemeContext })
  private theme?: SsoTheme;

  /** 登录成功后的重定向地址 */
  @property({ attribute: 'redirect-uri' })
  redirectUri?: string;

  /** 是否显示 OAuth 登录按钮 */
  @property({ attribute: 'show-oauth', type: Boolean })
  showOAuth = false;

  /** OAuth 提供商列表 */
  @property({ attribute: 'oauth-providers', type: Array })
  oauthProviders: ('github' | 'google')[] = ['github', 'google'];

  /** 显示模式：card（卡片）或 plain（无样式） */
  @property()
  mode: 'card' | 'plain' = 'card';

  /** 标题 */
  @property()
  title = '登录';

  /** 副标题 */
  @property({ attribute: 'subtitle' })
  subtitle = '登录您的账户';

  /** 注册链接 */
  @property({ attribute: 'register-link' })
  registerLink?: string;

  @state()
  private username = '';

  @state()
  private password = '';

  @state()
  private loading = false;

  @state()
  private error = '';

  @state()
  private fieldErrors: Record<string, string> = {};

  override render() {
    const content = html`
      ${this.renderHeader()}
      ${this.error ? html`<div class="alert alert-error">${this.error}</div>` : ''}
      <form @submit=${this.handleSubmit}>
        <div class="form-group">
          <label class="form-label" for="username">用户名或邮箱</label>
          <input
            id="username"
            type="text"
            class="form-input ${classMap({ error: !!this.fieldErrors.username })}"
            .value=${this.username}
            @input=${(e: Event) => this.username = (e.target as HTMLInputElement).value}
            ?disabled=${this.loading}
            autocomplete="username"
            required
          />
          ${this.fieldErrors.username ? html`<div class="form-error">${this.fieldErrors.username}</div>` : ''}
        </div>

        <div class="form-group">
          <label class="form-label" for="password">密码</label>
          <input
            id="password"
            type="password"
            class="form-input ${classMap({ error: !!this.fieldErrors.password })}"
            .value=${this.password}
            @input=${(e: Event) => this.password = (e.target as HTMLInputElement).value}
            ?disabled=${this.loading}
            autocomplete="current-password"
            required
          />
          ${this.fieldErrors.password ? html`<div class="form-error">${this.fieldErrors.password}</div>` : ''}
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-block btn-lg"
          ?disabled=${this.loading}
        >
          ${this.loading ? html`<span class="loading-spinner"></span>` : ''}
          登录
        </button>
      </form>

      ${this.showOAuth ? this.renderOAuthButtons() : ''}

      ${this.registerLink ? html`
        <a href=${this.registerLink} class="footer-link">没有账户？立即注册</a>
      ` : ''}
    `;

    return this.mode === 'card'
      ? html`<div class="card">${content}</div>`
      : content;
  }

  private renderHeader() {
    return html`
      <div class="login-header">
        <h2 class="login-title">${this.title}</h2>
        ${this.subtitle ? html`<p class="login-subtitle">${this.subtitle}</p>` : ''}
      </div>
    `;
  }

  private renderOAuthButtons() {
    const providers = this.oauthProviders.map(p => this.renderOAuthButton(p));
    return html`
      <div class="divider"><span>或</span></div>
      <div class="oauth-buttons">
        ${providers}
      </div>
    `;
  }

  private renderOAuthButton(provider: 'github' | 'google') {
    const icons = {
      github: html`
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      `,
      google: html`
        <svg viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      `
    };

    const labels = {
      github: '使用 GitHub 登录',
      google: '使用 Google 登录'
    };

    return html`
      <button
        type="button"
        class="oauth-btn"
        @click=${() => this.handleOAuthLogin(provider)}
        ?disabled=${this.loading}
      >
        ${icons[provider]}
        ${labels[provider]}
      </button>
    `;
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    this.error = '';
    this.fieldErrors = {};

    if (!this.username.trim()) {
      this.fieldErrors = { ...this.fieldErrors, username: '请输入用户名或邮箱' };
      return;
    }

    if (!this.password) {
      this.fieldErrors = { ...this.fieldErrors, password: '请输入密码' };
      return;
    }

    if (!this.client) {
      this.error = 'SSO 客户端未初始化，请确保组件在 sso-provider 内';
      return;
    }

    this.loading = true;

    try {
      const isEmail = this.username.includes('@');
      const loginData = isEmail
        ? { email: this.username, password: this.password }
        : { username: this.username, password: this.password };

      const result = await this.client.login(loginData);

      this.dispatchEvent(new CustomEvent('sso-login-success', {
        detail: result,
        bubbles: true,
        composed: true
      }));

      if (this.redirectUri) {
        window.location.href = this.redirectUri;
      }
    } catch (err) {
      let message = '登录失败，请重试';
      if (err instanceof ApiError) {
        message = err.message || err.toString();
      }
      this.error = message;

      this.dispatchEvent(new CustomEvent('sso-login-error', {
        detail: { error: message },
        bubbles: true,
        composed: true
      }));
    } finally {
      this.loading = false;
    }
  }

  private handleOAuthLogin(provider: 'github' | 'google') {
    if (!this.client) {
      this.error = 'SSO 客户端未初始化';
      return;
    }

    this.client.oauthLogin(provider, this.redirectUri);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sso-login': SsoLogin;
  }
}
