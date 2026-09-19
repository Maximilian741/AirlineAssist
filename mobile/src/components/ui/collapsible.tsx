/**
 * A disclosure: a chevron and a serif title on a hairline row; the body opens into a recessed,
 * hairline-bordered panel indented under it. No tinted circle, no bubble. See constants/theme.ts.
 */
import { SymbolView } from 'expo-symbols';
import { PropsWithChildren, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();

  return (
    <View>
      <Pressable
        style={({ pressed }) => [styles.heading, pressed && styles.pressedHeading]}
        onPress={() => setIsOpen((value) => !value)}>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={13}
          weight="semibold"
          tintColor={theme.textSecondary}
          style={{ transform: [{ rotate: isOpen ? '-90deg' : '90deg' }] }}
        />

        <ThemedText style={styles.title}>{title}</ThemedText>
      </Pressable>
      {isOpen && (
        <Animated.View entering={FadeIn.duration(200)}>
          <View style={[styles.content, { backgroundColor: theme.backgroundElement, borderColor: theme.line }]}>
            {children}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 44,
    paddingVertical: Spacing.two,
  },
  pressedHeading: {
    opacity: 0.75,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
  },
  content: {
    marginTop: Spacing.two,
    marginLeft: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.sm,
    padding: Spacing.three,
  },
});
