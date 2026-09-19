/**
 * A label and the literal string it refers to, set as a row: sans on the left, a mono snippet in a
 * recessed hairline box on the right. See constants/theme.ts for the rules.
 */
import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type HintRowProps = {
  title?: string;
  hint?: ReactNode;
};

export function HintRow({ title = 'Try editing', hint = 'app/index.tsx' }: HintRowProps) {
  const theme = useTheme();

  return (
    <View style={styles.stepRow}>
      <ThemedText type="small">{title}</ThemedText>
      <View style={[styles.codeSnippet, { backgroundColor: theme.backgroundElement, borderColor: theme.line }]}>
        <ThemedText type="code" themeColor="textSecondary">{hint}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  codeSnippet: {
    flexShrink: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
});
