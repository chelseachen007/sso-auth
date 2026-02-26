/**
 * 基础样式 - 所有组件共享
 */

import { css } from 'lit';

export const baseStyles = css`
  :host {
    display: block;
    font-family: var(--sso-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
    font-size: var(--sso-font-size, 14px);
    line-height: var(--sso-line-height, 1.5);
    color: var(--sso-text-color, #1f2937);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;

export const formStyles = css`
  .form-group {
    margin-bottom: var(--sso-spacing, 16px);
  }

  .form-label {
    display: block;
    margin-bottom: var(--sso-spacing-small, 8px);
    font-weight: 500;
    color: var(--sso-text-color, #1f2937);
  }

  .form-input {
    width: 100%;
    padding: 10px 12px;
    font-size: var(--sso-font-size, 14px);
    line-height: var(--sso-line-height, 1.5);
    color: var(--sso-text-color, #1f2937);
    background-color: var(--sso-surface-color, #ffffff);
    border: 1px solid var(--sso-border-color, #e5e7eb);
    border-radius: var(--sso-border-radius, 8px);
    transition: var(--sso-transition, all 0.2s ease);
    outline: none;
  }

  .form-input:focus {
    border-color: var(--sso-primary-color, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-input:disabled {
    background-color: var(--sso-background-color, #f9fafb);
    cursor: not-allowed;
  }

  .form-input.error {
    border-color: var(--sso-error-color, #ef4444);
  }

  .form-input.error:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  .form-error {
    margin-top: var(--sso-spacing-small, 8px);
    font-size: var(--sso-font-size-small, 12px);
    color: var(--sso-error-color, #ef4444);
  }

  .form-hint {
    margin-top: 4px;
    font-size: var(--sso-font-size-small, 12px);
    color: var(--sso-text-secondary-color, #6b7280);
  }
`;

export const buttonStyles = css`
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    font-size: var(--sso-font-size, 14px);
    font-weight: 500;
    line-height: var(--sso-line-height, 1.5);
    text-decoration: none;
    border: none;
    border-radius: var(--sso-border-radius, 8px);
    cursor: pointer;
    transition: var(--sso-transition, all 0.2s ease);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    color: #ffffff;
    background-color: var(--sso-primary-color, #3b82f6);
  }

  .btn-primary:hover:not(:disabled) {
    background-color: var(--sso-primary-hover-color, #2563eb);
  }

  .btn-secondary {
    color: var(--sso-text-color, #1f2937);
    background-color: var(--sso-surface-color, #ffffff);
    border: 1px solid var(--sso-border-color, #e5e7eb);
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: var(--sso-background-color, #f9fafb);
  }

  .btn-danger {
    color: #ffffff;
    background-color: var(--sso-error-color, #ef4444);
  }

  .btn-danger:hover:not(:disabled) {
    background-color: #dc2626;
  }

  .btn-block {
    width: 100%;
  }

  .btn-lg {
    padding: 12px 24px;
    font-size: var(--sso-font-size-large, 16px);
  }

  .btn-sm {
    padding: 6px 12px;
    font-size: var(--sso-font-size-small, 12px);
  }
`;

export const cardStyles = css`
  .card {
    background-color: var(--sso-surface-color, #ffffff);
    border: 1px solid var(--sso-border-color, #e5e7eb);
    border-radius: var(--sso-border-radius-large, 12px);
    box-shadow: var(--sso-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
    padding: var(--sso-spacing-large, 24px);
  }
`;

export const oauthButtonStyles = css`
  .oauth-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--sso-spacing-small, 8px);
    margin-top: var(--sso-spacing, 16px);
  }

  .oauth-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 10px 16px;
    font-size: var(--sso-font-size, 14px);
    font-weight: 500;
    color: var(--sso-text-color, #1f2937);
    background-color: var(--sso-surface-color, #ffffff);
    border: 1px solid var(--sso-border-color, #e5e7eb);
    border-radius: var(--sso-border-radius, 8px);
    cursor: pointer;
    transition: var(--sso-transition, all 0.2s ease);
  }

  .oauth-btn:hover:not(:disabled) {
    background-color: var(--sso-background-color, #f9fafb);
    border-color: var(--sso-text-secondary-color, #6b7280);
  }

  .oauth-btn svg {
    width: 20px;
    height: 20px;
  }
`;
