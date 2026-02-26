/**
 * SsoSessions - 会话管理组件
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state, consume } from 'lit/decorators.js';
import { ssoClientContext } from '../sso-provider.js';
import { SsoClient, type SsoSession } from '@sso-auth/core';
import { baseStyles, buttonStyles, cardStyles } from '../common/styles.js';

@customElement('sso-sessions')
export class SsoSessions extends LitElement {
  static override styles = [
    baseStyles,
    buttonStyles,
    cardStyles,
    css`
      :host {
        max-width: 600px;
        margin: 0 auto;
      }

      .sessions-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--sso-spacing-large, 24px);
      }

      .sessions-title {
        font-size: var(--sso-font-size-large, 16px);
        font-weight: 600;
      }

      .session-list {
        display: flex;
        flex-direction: column;
        gap: var(--sso-spacing-small, 8px);
      }

      .session-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--sso-spacing, 16px);
        background-color: var(--sso-surface-color, #ffffff);
        border: 1px solid var(--sso-border-color, #e5e7eb);
        border-radius: var(--sso-border-radius, 8px);
      }

      .session-item.current {
        border-color: var(--sso-primary-color, #3b82f6);
        background-color: rgba(59, 130, 246, 0.05);
      }

      .session-info {
        flex: 1;
      }

      .session-device {
        font-weight: 500;
        margin-bottom: 4px;
      }

      .session-meta {
        font-size: var(--sso-font-size-small, 12px);
        color: var(--sso-text-secondary-color, #6b7280);
      }

      .session-badge {
        display: inline-block;
        padding: 2px 8px;
        font-size: var(--sso-font-size-small, 12px);
        color: var(--sso-primary-color, #3b82f6);
        background-color: rgba(59, 130, 246, 0.1);
        border-radius: var(--sso-border-radius-small, 4px);
        margin-left: var(--sso-spacing-small, 8px);
      }

      .empty-state {
        text-align: center;
        padding: var(--sso-spacing-large, 24px);
        color: var(--sso-text-secondary-color, #6b7280);
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
    `
  ];

  @consume({ context: ssoClientContext, subscribe: true })
  private client?: SsoClient;

  @property()
  mode: 'card' | 'plain' = 'card';

  @state()
  private sessions: SsoSession[] = [];

  @state()
  private loading = false;

  @state()
  private success = '';

  override connectedCallback(): void {
    super.connectedCallback();
    this.loadSessions();
  }

  private async loadSessions(): Promise<void> {
    if (!this.client) return;

    this.loading = true;
    try {
      this.sessions = await this.client.getSessions();
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      this.loading = false;
    }
  }

  override render() {
    const content = html`
      <div class="sessions-header">
        <h2 class="sessions-title">登录会话</h2>
        ${this.sessions.length > 1 ? html`
          <button
            class="btn btn-sm btn-secondary"
            @click=${this.revokeOthers}
          >
            撤销其他会话
          </button>
        ` : ''}
      </div>

      ${this.success ? html`<div class="alert alert-success">${this.success}</div>` : ''}

      ${this.loading
        ? html`<div class="empty-state">加载中...</div>`
        : this.sessions.length === 0
          ? html`<div class="empty-state">暂无登录会话</div>`
          : html`
            <div class="session-list">
              ${this.sessions.map(session => this.renderSessionItem(session))}
            </div>
          `
      }
    `;

    return this.mode === 'card'
      ? html`<div class="card">${content}</div>`
      : content;
  }

  private renderSessionItem(session: SsoSession) {
    const created = new Date(session.createdAt).toLocaleString();
    const expires = new Date(session.expiresAt).toLocaleString();

    return html`
      <div class="session-item ${session.isCurrent ? 'current' : ''}">
        <div class="session-info">
          <div class="session-device">
            ${session.userAgent || '未知设备'}
            ${session.isCurrent ? html`<span class="session-badge">当前</span>` : ''}
          </div>
          <div class="session-meta">
            IP: ${session.ipAddress || '未知'} · 登录时间: ${created} · 过期时间: ${expires}
          </div>
        </div>
        ${!session.isCurrent ? html`
          <button
            class="btn btn-sm btn-danger"
            @click=${() => this.revokeSession(session.id)}
          >
            撤销
          </button>
        ` : ''}
      </div>
    `;
  }

  private async revokeSession(sessionId: number): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.revokeSession(sessionId);
      this.success = '会话已撤销';
      await this.loadSessions();

      this.dispatchEvent(new CustomEvent('sso-session-revoked', {
        detail: { sessionId },
        bubbles: true,
        composed: true
      }));
    } catch (err) {
      console.error('Failed to revoke session:', err);
    }
  }

  private async revokeOthers(): Promise<void> {
    if (!this.client) return;

    try {
      const result = await this.client.revokeOtherSessions();
      this.success = `已撤销 ${result.revokedCount} 个其他会话`;
      await this.loadSessions();

      this.dispatchEvent(new CustomEvent('sso-sessions-revoked', {
        detail: { count: result.revokedCount },
        bubbles: true,
        composed: true
      }));
    } catch (err) {
      console.error('Failed to revoke other sessions:', err);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sso-sessions': SsoSessions;
  }
}
