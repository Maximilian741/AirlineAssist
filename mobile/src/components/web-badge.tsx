/**
 * The "built with Expo" footer mark: a hairline rule, the version in mono, the badge. Sits on
 * whatever paper it is placed on — no tinted block of its own. See constants/theme.ts.
 */
import { version } from 'expo/package.json';
import { Image } from 'expo-image';
import { useColorScheme, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function WebBadge() {
  const scheme = useColorScheme();
  const theme = useTheme();

  return (
    <View style={[styles.container, { borderTopColor: theme.line }]}>
      <ThemedText type="code" themeColor="textSecondary" style={styles.versionText}>
        v{version}
      </ThemedText>
      <Image
        source={
          scheme === 'dark'
            ? require('@/assets/images/expo-badge-white.png')
            : require('@/assets/images/expo-badge.png')
        }
        style={styles.badgeImage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
  },
  versionText: {
    textAlign: 'center',
  },
  badgeImage: {
    width: 123,
    aspectRatio: 123 / 24,
  },
});
