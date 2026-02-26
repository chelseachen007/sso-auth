/**
 * SsoRegister - 注册组件
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { classMap } from 'lit/directives/class-map.js';
import { ssoClientContext } from '../sso-provider.js';
import { SsoClient, ApiError } from '@sso-auth/core';
import { baseStyles, formStyles, buttonStyles, cardStyles } from '../common/styles.js';

@customElement('sso-register')
export class SsoRegister extends LitElement {
  static override styles = [
    baseStyles,
    formStyles,
    buttonStyles,
    cardStyles,
    css`
      :host {
        max-width: 400px;
        margin: 0 auto;
      }

      .register-header {
        text-align: center;
        margin-bottom: var(--sso-spacing-large, 24px);
      }

      .register-title {
        font-size: var(--sso-font-size-large, 16px);
        font-weight: 600;
        margin-bottom: var(--sso-spacing-small, 8px);
      }

      .register-subtitle {
        font-size: var(--sso-font-size, 14px);
        color: var(--sso-text-secondary-color, #6b7280);
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
        to { transform: rotate(360deg); }
      }
    `
  ];

  @consume({ context: ssoClientContext, subscribe: true })
  private client?: SsoClient;

  @property({ attribute: 'redirect-uri' })
  redirectUri?: string;

  @property()
  mode: 'card' | 'plain' = 'card';

  @property()
  title = '注册';

  @property({ attribute: 'subtitle' })
  subtitle = '创建您的账户';

  @property({ attribute: 'login-link' })
  loginLink?: string;

  @state()
  private username = '';

  @state()
  private email = '';

  @state()
  private password = '';

  @state()
  private confirmPassword = '';

  @state()
  private loading = false;

  @state()
  private error = '';

  @state()
  private fieldErrors: Record<string, string> = {};

  override render() {
    const content = html`
      <div class="register-header">
        <h2 class="register-title">${this.title}</h2>
        ${this.subtitle ? html`<p class="register-subtitle">${this.subtitle}</p>` : ''}
      </div>

      ${this.error ? html`<div class="alert alert-error">${this.error}</div>` : ''}

      <form @submit=${this.handleSubmit}>
        <div class="form-group">
          <label class="form-label" for="username">用户名</label>
          <input
            id="username"
            type="text"
            class="form-input ${classMap({ error: !!this.fieldErrors.username })}"
            .value=${this.username}
            @input=${(e: Event) => this.username = (e.target as HTMLInputElement).value}
            ?disabled=${this.loading}
            autocomplete="username"
          />
          ${this.fieldErrors.username ? html`<div class="form-error">${this.fieldErrors.username}</div>` : ''}
          <div class="form-hint">可选，如果不填写将使用邮箱前缀</div>
        </div>

        <div class="form-group">
          <label class="form-label" for="email">邮箱</label>
          <input
            id="email"
            type="email"
            class="form-input ${classMap({ error: !!this.fieldErrors.email })}"
            .value=${this.email}
            @input=${(e: Event) => this.email = (e.target as HTMLInputElement).value}
            ?disabled=${this.loading}
            autocomplete="email"
            required
          />
          ${this.fieldErrors.email ? html`<div class="form-error">${this.fieldErrors.email}</div>` : ''}
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
            autocomplete="new-password"
            required
          />
          ${this.fieldErrors.password ? html`<div class="form-error">${this.fieldErrors.password}</div>` : ''}
          <div class="form-hint">至少 6 个字符</div>
        </div>

        <div class="form-group">
          <label class="form-label" for="confirmPassword">确认密码</label>
          <input
            id="confirmPassword"
            type="password"
            class="form-input ${classMap({ error: !!this.fieldErrors.confirmPassword })}"
            .value=${this.confirmPassword}
            @input=${(e: Event) => this.confirmPassword = (e.target as HTMLInputElement).value}
            ?disabled=${this.loading}
            autocomplete="new-password"
            required
          />
          ${this.fieldErrors.confirmPassword ? html`<div class="form-error">${this.fieldErrors.confirmPassword}</div>` : ''}
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-block btn-lg"
          ?disabled=${this.loading}
        >
          ${this.loading ? html`<span class="loading-spinner"></span>` : ''}
          注册
        </button>
      </form>

      ${this.loginLink ? html`
        <a href=${this.loginLink} class="footer-link">已有账户？立即登录</a>
      ` : ''}
    `;

    return this.mode === 'card'
      ? html`<div class="card">${content}</div>`
      : content;
  }

  private validate(): boolean {
    const errors: Record<string, string> = {};

    if (this.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.email = '请输入有效的邮箱地址';
    }

    if (!this.email && !this.username) {
      errors.email = '邮箱和用户名至少填写一项';
    }

    if (this.password.length < 6) {
      errors.password = '密码至少 6 个字符';
    }

    if (this.password !== this.confirmPassword) {
      errors.confirmPassword = '两次密码输入不一致';
    }

    this.fieldErrors = errors;
    return Object.keys(errors).length === 0;
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    this.error = '';

    if (!this.validate()) return;

    if (!this.client) {
      this.error = 'SSO 客户端未初始化';
      return;
    }

    this.loading = true;

    try {
      const result = await this.client.register({
        username: this.username || undefined,
        email: this.email || undefined,
        password: this.password
      });

      this.dispatchEvent(new CustomEvent('sso-register-success', {
        detail: result,
        bubbles: true,
        composed: true
      }));

      if (this.redirectUri) {
        window.location.href = this.redirectUri;
      }
    } catch (err) {
      let message = '注册失败，请重试';
      if (err instanceof ApiError) {
        message = err.message || err.toString();
      }
      this.error = message;

      this.dispatchEvent(new CustomEvent('sso-register-error', {
        detail: { error: message },
        bubbles: true,
        composed: true
      }));
    } finally {
      this.loading = false;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sso-register': SsoRegister;
  }
}
