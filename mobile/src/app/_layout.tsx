import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, ThemeProvider, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, Platform, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { checkAndNotify, installHandler, scheduleDeadlineReminders } from '@/lib/alerts';

// Notifications are native-only: on web the module's native methods are unavailable and throw,
// which blanks the whole app if touched during render.
const NATIVE = Platform.OS !== 'web';
if (NATIVE) installHandler();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const lastRun = useRef(0);

  // Run the money check whenever the app comes to the foreground (throttled to once a minute),
  // and re-arm the pre-scheduled deadline reminders. Local notifications only — no server push.
  useEffect(() => {
    if (!NATIVE) return;
    const run = () => {
      const now = Date.now();
      if (now - lastRun.current < 60_000) return;
      lastRun.current = now;
      checkAndNotify().catch(() => {});
      scheduleDeadlineReminders().catch(() => {});
    };
    run();
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') run(); });
    return () => sub.remove();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {NATIVE ? <NotificationTapHandler /> : null}
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}

// Tapping a notification lands the user on the trip it's about.
function NotificationTapHandler() {
  const router = useRouter();
  const last = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!last || last.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const data = (last.notification.request.content.data || {}) as Record<string, string>;
    if (data.screen === 'trips') router.push('/trips');
  }, [last, router]);
  return null;
}
