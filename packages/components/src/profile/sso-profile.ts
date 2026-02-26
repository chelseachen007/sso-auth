/**
 * SsoProfile - 用户资料组件
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { ssoClientContext } from '../sso-provider.js';
import { SsoClient, ApiError } from '@sso-auth/core';
import { baseStyles, formStyles, buttonStyles, cardStyles } from '../common/styles.js';

@customElement('sso-profile')
export class SsoProfile extends LitElement {
  static override styles = [
    baseStyles,
    formStyles,
    buttonStyles,
    cardStyles,
    css`
      :host {
        max-width: 500px;
        margin: 0 auto;
      }

      .profile-header {
        display: flex;
        align-items: center;
        gap: var(--sso-spacing, 16px);
        margin-bottom: var(--sso-spacing-large, 24px);
      }

      .avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background-color: var(--sso-background-color, #f9fafb);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        color: var(--sso-text-secondary-color, #6b7280);
        overflow: hidden;
      }

      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .profile-info h2 {
        font-size: var(--sso-font-size-large, 16px);
        font-weight: 600;
        margin-bottom: 4px;
      }

      .profile-info p {
        font-size: var(--sso-font-size, 14px);
        color: var(--sso-text-secondary-color, #6b7280);
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--sso-spacing, 16px);
      }

      @media (max-width: 480px) {
        .form-row {
          grid-template-columns: 1fr;
        }
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

      .button-group {
        display: flex;
        gap: var(--sso-spacing-small, 8px);
        margin-top: var(--sso-spacing, 16px);
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

  @property({ attribute: 'editable', type: Boolean })
  editable = true;

  @state()
  private displayName = '';

  @state()
  private email = '';

  @state()
  private avatar = '';

  @state()
  private loading = false;

  @state()
  private success = '';

  @state()
  private error = '';

  override connectedCallback(): void {
    super.connectedCallback();
    this.loadUserData();
  }

  private async loadUserData(): Promise<void> {
    if (!this.client) return;

    try {
      const user = await this.client.fetchUser();
      this.displayName = user.displayName || '';
      this.email = user.email || '';
      this.avatar = user.avatar || '';
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  }

  override render() {
    const user = this.client?.user;
    if (!user) {
      return html`<div>请先登录</div>`;
    }

    const content = html`
      <div class="profile-header">
        <div class="avatar">
          ${this.avatar
            ? html`<img src=${this.avatar} alt="Avatar" />`
            : html`${(this.displayName || user.username || 'U')[0].toUpperCase()}`
          }
        </div>
        <div class="profile-info">
          <h2>${this.displayName || user.username || '用户'}</h2>
          <p>@${user.username || user.email}</p>
        </div>
      </div>

      ${this.success ? html`<div class="alert alert-success">${this.success}</div>` : ''}
      ${this.error ? html`<div class="alert alert-error">${this.error}</div>` : ''}

      ${this.editable ? this.renderEditForm() : this.renderViewOnly()}
    `;

    return this.mode === 'card'
      ? html`<div class="card">${content}</div>`
      : content;
  }

  private renderEditForm() {
    return html`
      <form @submit=${this.handleSubmit}>
        <div class="form-group">
          <label class="form-label" for="displayName">显示名称</label>
          <input
            id="displayName"
            type="text"
            class="form-input"
            .value=${this.displayName}
            @input=${(e: Event) => this.displayName = (e.target as HTMLInputElement).value}
            ?disabled=${this.loading}
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="email">邮箱</label>
          <input
            id="email"
            type="email"
            class="form-input"
            .value=${this.email}
            @input=${(e: Event) => this.email = (e.target as HTMLInputElement).value}
            ?disabled=${this.loading}
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="avatar">头像 URL</label>
          <input
            id="avatar"
            type="url"
            class="form-input"
            .value=${this.avatar}
            @input=${(e: Event) => this.avatar = (e.target as HTMLInputElement).value}
            ?disabled=${this.loading}
            placeholder="https://example.com/avatar.png"
          />
        </div>

        <div class="button-group">
          <button
            type="submit"
            class="btn btn-primary"
            ?disabled=${this.loading}
          >
            ${this.loading ? html`<span class="loading-spinner"></span>` : ''}
            保存
          </button>
        </div>
      </form>
    `;
  }

  private renderViewOnly() {
    return html`
      <div class="form-group">
        <label class="form-label">显示名称</label>
        <p>${this.displayName || '-'}</p>
      </div>
      <div class="form-group">
        <label class="form-label">邮箱</label>
        <p>${this.email || '-'}</p>
      </div>
    `;
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    this.success = '';
    this.error = '';

    if (!this.client) {
      this.error = 'SSO 客户端未初始化';
      return;
    }

    this.loading = true;

    try {
      const user = await this.client.updateProfile({
        displayName: this.displayName || undefined,
        email: this.email || undefined,
        avatar: this.avatar || undefined
      });

      this.success = '资料已更新';

      this.dispatchEvent(new CustomEvent('sso-profile-update', {
        detail: user,
        bubbles: true,
        composed: true
      }));
    } catch (err) {
      let message = '更新失败';
      if (err instanceof ApiError) {
        message = err.message;
      }
      this.error = message;
    } finally {
      this.loading = false;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sso-profile': SsoProfile;
  }
}
