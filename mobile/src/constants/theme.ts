/**
 * App color palette (light + dark). Extends the Expo template's minimal palette with the
 * warm, friendly brand colors and the status colors used by the "Your Rights" guide.
 * The template components (ThemedText/ThemedView/native tabs) rely on the base keys:
 * text, background, backgroundElement, backgroundSelected, textSecondary — keep those.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#213040',
    background: '#f5f1ea', // warm cream
    backgroundElement: '#eef2f8', // chips / subtle surfaces
    backgroundSelected: '#dde7f6',
    textSecondary: '#4f6070', // darkened to clear WCAG 4.5:1 on cream/white (carries most body copy)
    card: '#ffffff',
    line: '#e3e8f0',
    brand: '#1565c0',
    brandDeep: '#0d3a6b',
    good: '#1a9d68',
    goodBg: '#e6f6ee',
    warn: '#b9760e',
    warnBg: '#fbf0d8',
    bad: '#d2564f',
    badBg: '#fbe9e8',
  },
  dark: {
    text: '#eef2f9',
    background: '#0d1320',
    backgroundElement: '#1a2336',
    backgroundSelected: '#27324c',
    textSecondary: '#93a2bd',
    card: '#161f31',
    line: '#2c3a55',
    brand: '#7cb6ff',
    brandDeep: '#aacdfd',
    good: '#2bcf86',
    goodBg: 'rgba(43,207,134,0.14)',
    warn: '#f0a830',
    warnBg: 'rgba(240,168,48,0.14)',
    bad: '#ef5b6a',
    badBg: 'rgba(239,91,106,0.14)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
// On web the brand/tab bar floats at the TOP (see app-tabs.web.tsx), so screens reserve top space there.
export const TopTabInset = Platform.select({ web: 72 }) ?? 0;
export const MaxContentWidth = 800;
