/**
 * SsoAppForm - 应用表单组件
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { ssoClientContext } from '../sso-provider.js';
import { SsoClient, type SsoApplication, ApiError } from '@sso-auth/core';
import { baseStyles, formStyles, buttonStyles } from '../common/styles.js';

@customElement('sso-app-form')
export class SsoAppForm extends LitElement {
  static override styles = [
    baseStyles,
    formStyles,
    buttonStyles,
    css`
      .form-header {
        margin-bottom: var(--sso-spacing-large, 24px);
      }

      .form-title {
        font-size: var(--sso-font-size-large, 16px);
        font-weight: 600;
      }

      .redirect-uri-list {
        display: flex;
        flex-direction: column;
        gap: var(--sso-spacing-small, 8px);
      }

      .redirect-uri-item {
        display: flex;
        gap: var(--sso-spacing-small, 8px);
      }

      .redirect-uri-item input {
        flex: 1;
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

      .secret-display {
        padding: var(--sso-spacing, 16px);
        background-color: var(--sso-background-color, #f9fafb);
        border-radius: var(--sso-border-radius, 8px);
        font-family: monospace;
        word-break: break-all;
        margin-bottom: var(--sso-spacing, 16px);
      }

      .secret-warning {
        font-size: var(--sso-font-size-small, 12px);
        color: var(--sso-error-color, #ef4444);
        margin-top: var(--sso-spacing-small, 8px);
      }

      .button-group {
        display: flex;
        gap: var(--sso-spacing-small, 8px);
        margin-top: var(--sso-spacing-large, 24px);
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

  @property({ attribute: false })
  application?: SsoApplication | null;

  @state()
  private name = '';

  @state()
  private redirectUris: string[] = [''];

  @state()
  private isActive = true;

  @state()
  private loading = false;

  @state()
  private success = '';

  @state()
  private error = '';

  @state()
  private newSecret = '';

  override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('application') && this.application) {
      this.name = this.application.name;
      this.redirectUris = [...this.application.redirectUris];
      this.isActive = this.application.isActive;
    }
  }

  override render() {
    const isEdit = !!this.application;

    return html`
      <div class="form-header">
        <h2 class="form-title">${isEdit ? '编辑应用' : '创建应用'}</h2>
      </div>

      ${this.newSecret ? html`
        <div>
          <label class="form-label">Client Secret（请立即保存）</label>
          <div class="secret-display">${this.newSecret}</div>
          <div class="secret-warning">此密钥只会显示一次，请立即保存！</div>
        </div>
      ` : ''}

      ${this.success ? html`<div class="alert alert-success">${this.success}</div>` : ''}
      ${this.error ? html`<div class="alert alert-error">${this.error}</div>` : ''}

      <form @submit=${this.handleSubmit}>
        <div class="form-group">
          <label class="form-label" for="name">应用名称</label>
          <input
            id="name"
            type="text"
            class="form-input"
            .value=${this.name}
            @input=${(e: Event) => this.name = (e.target as HTMLInputElement).value}
            ?disabled=${this.loading}
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">回调地址</label>
          <div class="redirect-uri-list">
            ${this.redirectUris.map((uri, index) => html`
              <div class="redirect-uri-item">
                <input
                  type="url"
                  class="form-input"
                  .value=${uri}
                  @input=${(e: Event) => this.updateRedirectUri(index, (e.target as HTMLInputElement).value)}
                  ?disabled=${this.loading}
                  placeholder="https://example.com/callback"
                />
                ${this.redirectUris.length > 1 ? html`
                  <button
                    type="button"
                    class="btn btn-sm btn-danger"
                    @click=${() => this.removeRedirectUri(index)}
                  >删除</button>
                ` : ''}
              </div>
            `)}
          </div>
          <button
            type="button"
            class="btn btn-sm btn-secondary"
            style="margin-top: 8px"
            @click=${this.addRedirectUri}
          >添加回调地址</button>
        </div>

        ${isEdit ? html`
          <div class="form-group">
            <label class="form-label">
              <input
                type="checkbox"
                .checked=${this.isActive}
                @change=${(e: Event) => this.isActive = (e.target as HTMLInputElement).checked}
                ?disabled=${this.loading}
              />
              启用应用
            </label>
          </div>
        ` : ''}

        <div class="button-group">
          <button type="submit" class="btn btn-primary" ?disabled=${this.loading}>
            ${this.loading ? html`<span class="loading-spinner"></span>` : ''}
            ${isEdit ? '保存' : '创建'}
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            @click=${this.handleCancel}
            ?disabled=${this.loading}
          >
            取消
          </button>
        </div>
      </form>
    `;
  }

  private updateRedirectUri(index: number, value: string): void {
    const uris = [...this.redirectUris];
    uris[index] = value;
    this.redirectUris = uris;
  }

  private addRedirectUri(): void {
    this.redirectUris = [...this.redirectUris, ''];
  }

  private removeRedirectUri(index: number): void {
    this.redirectUris = this.redirectUris.filter((_, i) => i !== index);
  }

  private validate(): boolean {
    if (!this.name.trim()) {
      this.error = '请输入应用名称';
      return false;
    }

    const validUris = this.redirectUris.filter(u => u.trim());
    if (validUris.length === 0) {
      this.error = '请至少添加一个回调地址';
      return false;
    }

    return true;
  }

  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    this.error = '';
    this.success = '';
    this.newSecret = '';

    if (!this.validate()) return;
    if (!this.client) {
      this.error = 'SSO 客户端未初始化';
      return;
    }

    this.loading = true;

    try {
      const validUris = this.redirectUris.filter(u => u.trim());

      if (this.application) {
        // 更新
        await this.client.updateApplication(this.application.id, {
          name: this.name,
          redirectUris: validUris,
          isActive: this.isActive
        });
        this.success = '应用已更新';
      } else {
        // 创建
        const result = await this.client.createApplication({
          name: this.name,
          redirectUris: validUris
        });
        this.success = '应用已创建';
        this.newSecret = result.clientSecret;
      }

      this.dispatchEvent(new CustomEvent('sso-app-saved', {
        bubbles: true,
        composed: true
      }));
    } catch (err) {
      let message = '操作失败';
      if (err instanceof ApiError) {
        message = err.message;
      }
      this.error = message;
    } finally {
      this.loading = false;
    }
  }

  private handleCancel(): void {
    this.dispatchEvent(new CustomEvent('sso-app-cancel', {
      bubbles: true,
      composed: true
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sso-app-form': SsoAppForm;
  }
}
