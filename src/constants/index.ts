/**
 * Global Application Constants
 * UI-related constants that can be used across the application
 */

// UI Colors
export const UI_COLORS = {
  background: '#1e222d',
  headerBackground: '#131722',
  border: '#2a2e39',
  primary: '#4bffb5',
  primaryHover: '#3de8a0',
  primaryText: '#1e222d',
  error: '#ff4976',
  errorHover: '#ff3358',
  secondary: '#ff9800',
  text: 'rgba(255, 255, 255, 0.9)',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  overlay: 'rgba(19, 23, 34, 0.9)',
  overlayBorder: 'rgba(255, 255, 255, 0.2)',
} as const;

// UI Configuration
export const UI_CONFIG = {
  headerHeight: 60,
  buttonPadding: '8px 16px',
  buttonPaddingSmall: '4px 12px',
  borderRadius: '4px',
  fontSize: {
    small: '12px',
    medium: '13px',
    default: '14px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
  },
} as const;

