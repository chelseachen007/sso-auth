/**
 * @sso-auth/embedded
 * SSO Authentication Embedded SDK - iframe, popup, redirect modes
 */

import { SsoClient, type SsoClientConfig, type SsoTokenResponse, type SsoUser } from '@sso-auth/core';

export interface SsoEmbeddedConfig extends SsoClientConfig {
  /** SSO 服务器完整 URL（用于 iframe/popup） */
  ssoUrl?: string;
  /** iframe/popup 模式下的嵌入式登录页面路径 */
  embeddedPath?: string;
}

export interface SsoPopupOptions {
  /** 弹窗宽度 */
  width?: number;
  /** 弹窗高度 */
  height?: number;
  /** 登录成功回调 */
  onSuccess?: (data: SsoTokenResponse) => void;
  /** 登录失败回调 */
  onError?: (error: string) => void;
  /** 弹窗关闭回调 */
  onClose?: () => void;
}

export interface SsoIframeOptions {
  /** iframe 容器选择器 */
  container?: string | HTMLElement;
  /** 登录成功回调 */
  onSuccess?: (data: SsoTokenResponse) => void;
  /** 登录失败回调 */
  onError?: (error: string) => void;
}

export interface PostMessageData {
  type: 'sso-login-success' | 'sso-login-error' | 'sso-ready';
  payload?: SsoTokenResponse | { error: string };
}

/**
 * SSO Embedded SDK
 *
 * @example
 * ```javascript
 * const auth = new SsoEmbedded({
 *   baseUrl: 'http://localhost:3002',
 *   ssoUrl: 'http://localhost:3002'
 * });
 *
 * // 弹窗登录
 * auth.openPopupLogin({
 *   onSuccess: (data) => console.log('登录成功', data)
 * });
 *
 * // iframe 嵌入
 * auth.embedLogin('#login-container', {
 *   onSuccess: (data) => console.log('登录成功', data)
 * });
 * ```
 */
export class SsoEmbedded extends SsoClient {
  private ssoUrl: string;
  private embeddedPath: string;
  private popup: Window | null = null;
  private messageHandler: ((event: MessageEvent) => void) | null = null;

  constructor(config: SsoEmbeddedConfig) {
    super(config);
    this.ssoUrl = config.ssoUrl || config.baseUrl;
    this.embeddedPath = config.embeddedPath || '/embedded/login';
  }

  /**
   * 打开弹窗登录
   */
  openPopupLogin(options: SsoPopupOptions = {}): void {
    const {
      width = 400,
      height = 600,
      onSuccess,
      onError,
      onClose
    } = options;

    // 关闭已有弹窗
    this.closePopup();

    // 计算弹窗位置
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // 打开弹窗
    const url = `${this.ssoUrl}${this.embeddedPath}?mode=popup`;
    this.popup = window.open(
      url,
      'sso-login',
      `width=${width},height=${height},left=${left},top=${top},resizable,scrollbars`
    );

    if (!this.popup) {
      onError?.('无法打开弹窗，请检查浏览器弹窗设置');
      return;
    }

    // 监听消息
    this.messageHandler = (event: MessageEvent) => {
      // 验证来源
      if (!event.origin.startsWith(this.ssoUrl)) return;

      const data = event.data as PostMessageData;

      if (data.type === 'sso-login-success' && data.payload) {
        const result = data.payload as SsoTokenResponse;
        this.handleLoginSuccess(result);
        onSuccess?.(result);
        this.closePopup();
      } else if (data.type === 'sso-login-error' && data.payload) {
        const error = (data.payload as { error: string }).error;
        onError?.(error);
      }
    };

    window.addEventListener('message', this.messageHandler);

    // 监听弹窗关闭
    const checkClosed = setInterval(() => {
      if (this.popup?.closed) {
        clearInterval(checkClosed);
        onClose?.();
        this.cleanup();
      }
    }, 500);
  }

  /**
   * 关闭弹窗
   */
  closePopup(): void {
    if (this.popup && !this.popup.closed) {
      this.popup.close();
    }
    this.cleanup();
  }

  /**
   * 嵌入登录 iframe
   */
  embedLogin(container: string | HTMLElement, options: SsoIframeOptions = {}): HTMLIFrameElement {
    const { onSuccess, onError } = options;

    // 获取容器
    const containerEl = typeof container === 'string'
      ? document.querySelector<HTMLElement>(container)
      : container;

    if (!containerEl) {
      throw new Error('Container element not found');
    }

    // 创建 iframe
    const iframe = document.createElement('iframe');
    iframe.src = `${this.ssoUrl}${this.embeddedPath}?mode=iframe`;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.allow = 'same-origin';

    containerEl.appendChild(iframe);

    // 监听消息
    this.messageHandler = (event: MessageEvent) => {
      if (!event.origin.startsWith(this.ssoUrl)) return;

      const data = event.data as PostMessageData;

      if (data.type === 'sso-login-success' && data.payload) {
        const result = data.payload as SsoTokenResponse;
        this.handleLoginSuccess(result);
        onSuccess?.(result);
      } else if (data.type === 'sso-login-error' && data.payload) {
        const error = (data.payload as { error: string }).error;
        onError?.(error);
      }
    };

    window.addEventListener('message', this.messageHandler);

    return iframe;
  }

  /**
   * 处理登录成功
   */
  private handleLoginSuccess(result: SsoTokenResponse): void {
    // 更新本地状态
    // Token 已经通过 SsoClient 的方法管理
  }

  /**
   * 清理事件监听
   */
  private cleanup(): void {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
      this.messageHandler = null;
    }
    this.popup = null;
  }

  /**
   * 销毁实例
   */
  override destroy(): void {
    this.closePopup();
    this.cleanup();
    super.destroy();
  }
}

/**
 * 创建嵌入式登录 SDK 实例
 */
export function createSsoEmbedded(config: SsoEmbeddedConfig): SsoEmbedded {
  return new SsoEmbedded(config);
}

// 导出类型
export type { SsoClientConfig, SsoTokenResponse, SsoUser };
