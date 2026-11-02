/**
 * Design System inspirado diretamente em https://antigravity.google/
 * Paleta oficial extraída do site:
 * - Obsidian Ink (#121317)
 * - Pure Canvas (#FFFFFF) e Bento Surface (#F8F9FC)
 * - Translucent Pill Surface (rgba(183, 191, 217, 0.14) / #EEF1F8)
 * - Spectrum Accents: Electric Blue (#3186FF / #346BF1), Emerald (#00B95C),
 *   Coral Red (#FC413D), Solar Amber (#FBBC04 / #FFE432)
 */

import { Platform } from 'react-native';

export const AntigravityPalette = {
  obsidian: '#121317',
  obsidianElevated: '#1A1C22',
  charcoal: '#202124',
  slate: '#45474D',
  muted: '#676A72',
  canvas: '#FFFFFF',
  surface: '#F8F9FC',
  surfaceAlt: '#EEF1F8',
  border: '#E5E8F0',
  borderSubtle: 'rgba(33, 34, 38, 0.08)',
  electricBlue: '#3186FF',
  cobaltBlue: '#346BF1',
  skyBlue: '#749BFF',
  blueTint: '#EBF2FF',
  emerald: '#00B95C',
  emeraldTint: '#E6F8EF',
  coralRed: '#FC413D',
  coralTint: '#FFF0EF',
  solarAmber: '#FBBC04',
  amberTint: '#FEF8E6',
};

const tintColorLight = AntigravityPalette.obsidian;
const tintColorDark = '#FFFFFF';

export const Colors = {
  light: {
    text: AntigravityPalette.obsidian,
    textSecondary: AntigravityPalette.slate,
    textMuted: AntigravityPalette.muted,
    background: AntigravityPalette.canvas,
    surface: AntigravityPalette.surface,
    surfacePill: AntigravityPalette.surfaceAlt,
    border: AntigravityPalette.border,
    tint: tintColorLight,
    accent: AntigravityPalette.electricBlue,
    icon: AntigravityPalette.slate,
    tabIconDefault: AntigravityPalette.muted,
    tabIconSelected: AntigravityPalette.obsidian,
  },
  dark: {
    text: '#F8F9FC',
    textSecondary: '#B7BFD9',
    textMuted: '#676A72',
    background: AntigravityPalette.obsidian,
    surface: AntigravityPalette.obsidianElevated,
    surfacePill: '#252830',
    border: '#2A2D37',
    tint: tintColorDark,
    accent: AntigravityPalette.electricBlue,
    icon: '#9BA1A6',
    tabIconDefault: '#676A72',
    tabIconSelected: tintColorDark,
  },
};

export const Radii = {
  pill: 9999,
  bento: 20,
  card: 16,
  input: 12,
  badge: 9999,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "'Google Sans Flex', 'Google Sans', 'Ubuntu', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'Google Sans', 'SF Pro Rounded', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
});
