/**
 * SSO Components - 主题定义
 */

export interface SsoTheme {
  // 颜色
  primaryColor: string;
  primaryHoverColor: string;
  errorColor: string;
  successColor: string;
  textColor: string;
  textSecondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  borderColor: string;

  // 字体
  fontFamily: string;
  fontSize: string;
  fontSizeSmall: string;
  fontSizeLarge: string;
  lineHeight: string;

  // 间距
  spacing: string;
  spacingSmall: string;
  spacingLarge: string;

  // 圆角
  borderRadius: string;
  borderRadiusSmall: string;
  borderRadiusLarge: string;

  // 阴影
  shadow: string;
  shadowLarge: string;

  // 过渡
  transition: string;
}

export const defaultTheme: SsoTheme = {
  // 颜色
  primaryColor: '#3b82f6',
  primaryHoverColor: '#2563eb',
  errorColor: '#ef4444',
  successColor: '#22c55e',
  textColor: '#1f2937',
  textSecondaryColor: '#6b7280',
  backgroundColor: '#f9fafb',
  surfaceColor: '#ffffff',
  borderColor: '#e5e7eb',

  // 字体
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '14px',
  fontSizeSmall: '12px',
  fontSizeLarge: '16px',
  lineHeight: '1.5',

  // 间距
  spacing: '16px',
  spacingSmall: '8px',
  spacingLarge: '24px',

  // 圆角
  borderRadius: '8px',
  borderRadiusSmall: '4px',
  borderRadiusLarge: '12px',

  // 阴影
  shadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  shadowLarge: '0 4px 12px rgba(0, 0, 0, 0.15)',

  // 过渡
  transition: 'all 0.2s ease'
};

export const darkTheme: SsoTheme = {
  ...defaultTheme,
  textColor: '#f9fafb',
  textSecondaryColor: '#9ca3af',
  backgroundColor: '#111827',
  surfaceColor: '#1f2937',
  borderColor: '#374151',
  shadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
  shadowLarge: '0 4px 12px rgba(0, 0, 0, 0.4)'
};

/**
 * 生成 CSS 自定义属性
 */
export function generateCssVariables(theme: SsoTheme): string {
  return `
    --sso-primary-color: ${theme.primaryColor};
    --sso-primary-hover-color: ${theme.primaryHoverColor};
    --sso-error-color: ${theme.errorColor};
    --sso-success-color: ${theme.successColor};
    --sso-text-color: ${theme.textColor};
    --sso-text-secondary-color: ${theme.textSecondaryColor};
    --sso-background-color: ${theme.backgroundColor};
    --sso-surface-color: ${theme.surfaceColor};
    --sso-border-color: ${theme.borderColor};
    --sso-font-family: ${theme.fontFamily};
    --sso-font-size: ${theme.fontSize};
    --sso-font-size-small: ${theme.fontSizeSmall};
    --sso-font-size-large: ${theme.fontSizeLarge};
    --sso-line-height: ${theme.lineHeight};
    --sso-spacing: ${theme.spacing};
    --sso-spacing-small: ${theme.spacingSmall};
    --sso-spacing-large: ${theme.spacingLarge};
    --sso-border-radius: ${theme.borderRadius};
    --sso-border-radius-small: ${theme.borderRadiusSmall};
    --sso-border-radius-large: ${theme.borderRadiusLarge};
    --sso-shadow: ${theme.shadow};
    --sso-shadow-large: ${theme.shadowLarge};
    --sso-transition: ${theme.transition};
  `;
}
