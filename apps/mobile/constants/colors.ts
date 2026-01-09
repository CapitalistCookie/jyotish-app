export const Colors = {
  // Core colors
  background: '#0a0a12',    // Deep space black
  surface: '#1a1a2e',       // Dark purple
  surfaceLight: '#252542',  // Lighter purple
  primary: '#d4af37',       // Mystic gold
  primaryDark: '#b8962e',   // Darker gold
  primaryLight: '#e5c65c',  // Lighter gold

  // Text colors
  textPrimary: '#f5f5f7',   // Off-white
  textSecondary: '#a1a1aa', // Muted gray
  textMuted: '#6b6b7b',     // Dimmed text

  // Semantic colors
  success: '#4ade80',
  error: '#f87171',
  warning: '#fbbf24',
  info: '#60a5fa',

  // Utility
  border: '#2a2a4a',
  overlay: 'rgba(0, 0, 0, 0.7)',
  transparent: 'transparent',

  // Gradient colors
  gradientStart: '#0a0a12',
  gradientMiddle: '#12121f',
  gradientEnd: '#1a1a2e',
} as const;

export type ColorName = keyof typeof Colors;
