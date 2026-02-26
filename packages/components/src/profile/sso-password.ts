/**
 * SsoPassword - 修改密码组件
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state, consume } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ssoClientContext } from '../sso-provider.js';
import { SsoClient, ApiError } from '@sso-auth/core';
import { baseStyles, formStyles, buttonStyles, cardStyles } from '../common/styles.js';

@customElement('sso-password')
export class SsoPassword extends LitElement {
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

      .password-header {
        margin-bottom: var(--sso-spacing-large, 24px);
      }

      .password-title {
        font-size: var(--sso-font-size-large, 16px);
        font-weight: 600;
      }

      .alert {
        padding: var(--sso-spacing-small, 8px) var(--sso-spacing, 16px);
        margin-bottom: var(--sso-spacing, 16px);
        border-radius: var(--sso-border-radius, 8px);
        font-size: var(--sso-font-size, 14px);
      }

      .alert-success {
        background-color: #f0fdf4;
        color: var(--sso-success-color, #22c55e);
        border: 1px solid #bbf7d0;
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
        to { transform: rotate(360deg); }
      }
    `
  ];

  @consume({ context: ssoClientContext, subscribe: true })
  private client?: SsoClient;

  @property()
  mode: 'card' | 'plain' = 'card';

  @state()
  private currentPassword = '';

  @state()
  private newPassword = '';

  @state()
  private confirmPassword = '';

  @state()
  private loading = false;

  @state()
  private success = '';

  @state()
  private error = '';

  @state()
  private fieldErrors: Record<string, string> = {};

  override render() {
    const content = html`
      <div class="password-header">
        <h2 class="password-title">修改密码</h2>
      </div>

      ${this.success ? html`<div class="alert alert-success">${this.success}</div>` : ''}
      ${this.error ? html`<div class="alert alert-error">${this.error}</div>` : ''}

      <form @submit=${this.handleSubmit}>
        <div class="form-group">
          <label class="form-label" for="currentPassword">当前密码</label>
          <input
            id="currentPassword"
            type="password"
            class="form-input ${classMap({ error: !!this.fieldErrors.currentPassword })}"
            .value=${this.currentPassword}
            @input=${(e: Event) => this.currentPassword = (e.target as HTMLInputElement).value}
            ?disabled=${this.loading}
            autocomplete="current-password"
            required
          />
          ${this.fieldErrors.currentPassword
            ? html`<div class="form-error">${this.fieldErrors.currentPassword}</div>`
            : ''}
        </div>

        <div class="form-group">
          <label class="form-label" for="newPassword">新密码</label>
          <input
            id="newPassword"
            type="password"
            class="form-input ${classMap({ error: !!this.fieldErrors.newPassword })}"
            .value=${this.newPassword}
            @input=${(e: Event) => this.newPassword = (e.target as HTMLInputElement).value}
            ?disabled=${this.loading}
            autocomplete="new-password"
            required
          />
          ${this.fieldErrors.newPassword
            ? html`<div class="form-error">${this.fieldErrors.newPassword}</div>`
            : ''}
          <div class="form-hint">至少 6 个字符</div>
        </div>

        <div class="form-group">
          <label class="form-label" for="confirmPassword">确认新密码</label>
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
          ${this.fieldErrors.confirmPassword
            ? html`<div class="form-error">${this.fieldErrors.confirmPassword}</div>`
            : ''}
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-block"
          ?disabled=${this.loading}
        >
          ${this.loading ? html`<span class="loading-spinner"></span>` : ''}
          修改密码
        </button>
      </form>
    `;

    return this.mode === 'card'
      ? html`<div class="card">${content}</div>`
      : content;
  }

  private validate(): boolean {
    const errors: Record<string, string> = {};

    if (!this.currentPassword) {
      errors.currentPassword = '请输入当前密码';
    }

    if (this.newPassword.length < 6) {
      errors.newPassword = '密码至少 6 个字符';
    }

    if (this.newPassword !== this.confirmPassword) {
      errors.confirmPassword = '两次密码输入不一致';
    }

    this.fieldErrors = errors;
    return Object.keys(errors).length === 0;
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    this.success = '';
    this.error = '';

    if (!this.validate()) return;

    if (!this.client) {
      this.error = 'SSO 客户端未初始化';
      return;
    }

    this.loading = true;

    try {
      await this.client.changePassword({
        currentPassword: this.currentPassword,
        newPassword: this.newPassword
      });

      this.success = '密码修改成功';
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';

      this.dispatchEvent(new CustomEvent('sso-password-changed', {
        bubbles: true,
        composed: true
      }));
    } catch (err) {
      let message = '修改密码失败';
      if (err instanceof ApiError) {
        message = err.message;
      }
      this.error = message;

      this.dispatchEvent(new CustomEvent('sso-password-error', {
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
    'sso-password': SsoPassword;
  }
}
