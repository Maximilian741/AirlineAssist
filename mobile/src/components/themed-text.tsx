/**
 * The type scale. Serif for display and section titles, the system sans for reading, small caps for
 * labels, tabular figures for money — see constants/theme.ts for the rules this belongs to.
 */
import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code'
    | 'display' | 'section' | 'eyebrow' | 'money' | 'lede';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        type === 'display' && styles.display,
        type === 'section' && styles.section,
        type === 'eyebrow' && styles.eyebrow,
        type === 'money' && styles.money,
        type === 'lede' && styles.lede,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  // ---- editorial scale ----
  display: { fontFamily: Fonts.serif, fontSize: 27, lineHeight: 33, fontWeight: '700', letterSpacing: -0.2 },
  section: { fontFamily: Fonts.serif, fontSize: 20, lineHeight: 26, fontWeight: '700' },
  eyebrow: { fontSize: 11, lineHeight: 15, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' },
  lede: { fontSize: 15.5, lineHeight: 24, fontWeight: '400' },
  money: { fontSize: 17, lineHeight: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },

  // ---- body ----
  small: { fontSize: 14, lineHeight: 21, fontWeight: '400' },
  smallBold: { fontSize: 14, lineHeight: 21, fontWeight: '700' },
  default: { fontSize: 15.5, lineHeight: 23, fontWeight: '400' },

  // ---- kept for the few screens that still use them ----
  title: { fontFamily: Fonts.serif, fontSize: 34, lineHeight: 40, fontWeight: '700' },
  subtitle: { fontFamily: Fonts.serif, fontSize: 22, lineHeight: 28, fontWeight: '700' },
  link: { lineHeight: 22, fontSize: 14, fontWeight: '600' },
  linkPrimary: { lineHeight: 22, fontSize: 14, fontWeight: '600', color: '#0f4c81' },
  code: { fontFamily: Fonts.mono, fontWeight: Platform.select({ android: '700' }) ?? '500', fontSize: 12.5 },
});
