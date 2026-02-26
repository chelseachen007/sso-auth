/**
 * SsoAppList - 应用列表组件
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { ssoClientContext } from '../sso-provider.js';
import { SsoClient, type SsoApplication } from '@sso-auth/core';
import { baseStyles, buttonStyles, cardStyles } from '../common/styles.js';
import './sso-app-form.js';

@customElement('sso-app-list')
export class SsoAppList extends LitElement {
  static override styles = [
    baseStyles,
    buttonStyles,
    cardStyles,
    css`
      :host {
        max-width: 800px;
        margin: 0 auto;
      }

      .app-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--sso-spacing-large, 24px);
      }

      .app-title {
        font-size: var(--sso-font-size-large, 16px);
        font-weight: 600;
      }

      .app-list {
        display: flex;
        flex-direction: column;
        gap: var(--sso-spacing, 16px);
      }

      .app-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: var(--sso-spacing, 16px);
        background-color: var(--sso-surface-color, #ffffff);
        border: 1px solid var(--sso-border-color, #e5e7eb);
        border-radius: var(--sso-border-radius, 8px);
      }

      .app-item.disabled {
        opacity: 0.6;
      }

      .app-info {
        flex: 1;
      }

      .app-name {
        font-weight: 600;
        margin-bottom: 4px;
      }

      .app-client-id {
        font-family: monospace;
        font-size: var(--sso-font-size-small, 12px);
        color: var(--sso-text-secondary-color, #6b7280);
        margin-bottom: 8px;
      }

      .app-redirect-uris {
        font-size: var(--sso-font-size-small, 12px);
        color: var(--sso-text-secondary-color, #6b7280);
      }

      .app-status {
        display: inline-block;
        padding: 2px 8px;
        font-size: var(--sso-font-size-small, 12px);
        border-radius: var(--sso-border-radius-small, 4px);
        margin-top: 8px;
      }

      .app-status.active {
        background-color: #dcfce7;
        color: var(--sso-success-color, #22c55e);
      }

      .app-status.inactive {
        background-color: #fef3c7;
        color: #d97706;
      }

      .app-actions {
        display: flex;
        gap: var(--sso-spacing-small, 8px);
      }

      .empty-state {
        text-align: center;
        padding: var(--sso-spacing-large, 24px);
        color: var(--sso-text-secondary-color, #6b7280);
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-content {
        background-color: var(--sso-surface-color, #ffffff);
        border-radius: var(--sso-border-radius-large, 12px);
        padding: var(--sso-spacing-large, 24px);
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
      }
    `
  ];

  @consume({ context: ssoClientContext, subscribe: true })
  private client?: SsoClient;

  @property()
  mode: 'card' | 'plain' = 'card';

  @property({ attribute: 'manageable', type: Boolean })
  manageable = true;

  @state()
  private applications: SsoApplication[] = [];

  @state()
  private loading = false;

  @state()
  private showForm = false;

  @state()
  private editingApp: SsoApplication | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.loadApplications();
  }

  private async loadApplications(): Promise<void> {
    if (!this.client) return;

    this.loading = true;
    try {
      this.applications = await this.client.getApplications();
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      this.loading = false;
    }
  }

  override render() {
    const content = html`
      <div class="app-header">
        <h2 class="app-title">应用管理</h2>
        ${this.manageable ? html`
          <button class="btn btn-primary btn-sm" @click=${this.openCreateForm}>
            创建应用
          </button>
        ` : ''}
      </div>

      ${this.loading
        ? html`<div class="empty-state">加载中...</div>`
        : this.applications.length === 0
          ? html`<div class="empty-state">暂无应用</div>`
          : html`
            <div class="app-list">
              ${this.applications.map(app => this.renderAppItem(app))}
            </div>
          `
      }

      ${this.showForm ? this.renderFormModal() : ''}
    `;

    return this.mode === 'card'
      ? html`<div class="card">${content}</div>`
      : content;
  }

  private renderAppItem(app: SsoApplication) {
    return html`
      <div class="app-item ${app.isActive ? '' : 'disabled'}">
        <div class="app-info">
          <div class="app-name">${app.name}</div>
          <div class="app-client-id">Client ID: ${app.clientId}</div>
          <div class="app-redirect-uris">
            回调地址: ${app.redirectUris.join(', ')}
          </div>
          <span class="app-status ${app.isActive ? 'active' : 'inactive'}">
            ${app.isActive ? '已启用' : '已禁用'}
          </span>
        </div>
        ${this.manageable ? html`
          <div class="app-actions">
            <button class="btn btn-sm btn-secondary" @click=${() => this.openEditForm(app)}>
              编辑
            </button>
            <button class="btn btn-sm btn-danger" @click=${() => this.deleteApp(app)}>
              删除
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderFormModal() {
    return html`
      <div class="modal-overlay" @click=${this.closeForm}>
        <div class="modal-content" @click=${(e: Event) => e.stopPropagation()}>
          <sso-app-form
            .application=${this.editingApp}
            @sso-app-saved=${this.handleAppSaved}
            @sso-app-cancel=${this.closeForm}
          ></sso-app-form>
        </div>
      </div>
    `;
  }

  private openCreateForm(): void {
    this.editingApp = null;
    this.showForm = true;
  }

  private openEditForm(app: SsoApplication): void {
    this.editingApp = app;
    this.showForm = true;
  }

  private closeForm(): void {
    this.showForm = false;
    this.editingApp = null;
  }

  private handleAppSaved(): void {
    this.closeForm();
    this.loadApplications();
  }

  private async deleteApp(app: SsoApplication): Promise<void> {
    if (!this.client) return;
    if (!confirm(`确定要删除应用 "${app.name}" 吗？`)) return;

    try {
      await this.client.deleteApplication(app.id);
      await this.loadApplications();

      this.dispatchEvent(new CustomEvent('sso-app-deleted', {
        detail: { appId: app.id },
        bubbles: true,
        composed: true
      }));
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sso-app-list': SsoAppList;
  }
}
