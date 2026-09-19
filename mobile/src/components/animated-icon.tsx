/**
 * The hand-off from the native launch screen to the app: the same paper the app is printed on,
 * fading out. (It used to be Expo blue with the Expo logo — the launch is the first thing anyone
 * sees, so it has to be ours.) See constants/theme.ts for the palette.
 */
import { useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Colors } from '@/constants/theme';

const DURATION = 420;

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const scheme = useColorScheme();

  if (!visible) return null;

  const fade = new Keyframe({
    0: { opacity: 1 },
    40: { opacity: 1 },
    100: { opacity: 0, easing: Easing.out(Easing.quad) },
  });

  return (
    <Animated.View
      pointerEvents="none"
      entering={fade.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={[styles.cover, { backgroundColor: (scheme === 'dark' ? Colors.dark : Colors.light).background }]}
    />
  );
}

const styles = StyleSheet.create({
  cover: { ...StyleSheet.absoluteFill, zIndex: 1000 },
});
