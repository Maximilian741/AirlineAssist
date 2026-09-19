/**
 * The app's visual language — the same editorial system as the web app (public/styles.css, the
 * REDESIGN LAYER at the end of that file). Keep the two in step; they are one product.
 *
 * The rules, in short:
 *   · Warm paper, not white. Ink, not black. One accent (deep navy), one alarm (oxblood).
 *   · Serif for display and section titles; the system sans for everything you read in bulk.
 *   · Flat surfaces: hairline rules and 1px borders, radius 3–8, NO shadows, NO gradients, no pills.
 *   · Money is set in tabular figures so columns line up.
 *   · No decorative emoji anywhere in the chrome. Functional glyphs only (✓ ✕ → ← ↗ ↺).
 * Things to never reintroduce: emoji-prefixed headings and buttons, gradient buttons, pill-shaped
 * everything, a centred hero with a giant rounded app-icon tile, shadow-blob cards, rainbow status
 * colours. Those are the marks of a template, and they read as one.
 *
 * The template components (ThemedText/ThemedView/native tabs) rely on the base keys:
 * text, background, backgroundElement, backgroundSelected, textSecondary — keep those.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1c2733', // ink
    background: '#f7f4ee', // warm paper
    backgroundElement: '#f1ede4', // recessed panel
    backgroundSelected: '#e7e0d2', // chosen chip / active row
    textSecondary: '#5c6670',
    card: '#fffdf9',
    line: '#ddd6c8', // hairline
    brand: '#0f4c81', // links, quiet emphasis
    brandDeep: '#16324a', // solid buttons, the monogram
    good: '#1c7a4b',
    goodBg: '#e9f1e9',
    warn: '#9a6b14',
    warnBg: '#f5eeda',
    bad: '#b03a2e', // oxblood: the one alarm colour
    badBg: '#f6e8e5',
  },
  dark: {
    text: '#e8e2d6',
    background: '#14191f',
    backgroundElement: '#232b34',
    backgroundSelected: '#2b343d',
    textSecondary: '#98a1a9',
    card: '#1b222a',
    line: '#333d47',
    brand: '#7fb0d8',
    brandDeep: '#b8d3e8',
    good: '#5db98a',
    goodBg: 'rgba(93,185,138,0.12)',
    warn: '#d4a94e',
    warnBg: 'rgba(212,169,78,0.12)',
    bad: '#d97b6c',
    badBg: 'rgba(217,123,108,0.12)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'Georgia',
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

/** Radii stay small: a document, not a bubble. */
export const Radius = { sm: 3, md: 6, lg: 8 } as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
// On web the brand/tab bar floats at the TOP (see app-tabs.web.tsx), so screens reserve top space there.
export const TopTabInset = Platform.select({ web: 72 }) ?? 0;
export const MaxContentWidth = 800;
