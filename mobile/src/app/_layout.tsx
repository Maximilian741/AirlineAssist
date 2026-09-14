import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, ThemeProvider, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { checkAndNotify, installHandler, scheduleDeadlineReminders } from '@/lib/alerts';

installHandler();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const lastRun = useRef(0);

  // Run the money check whenever the app comes to the foreground (throttled to once a minute),
  // and re-arm the pre-scheduled deadline reminders. Local notifications only — no server push.
  useEffect(() => {
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

  // Tapping a notification lands the user on the trip it's about.
  const last = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!last || last.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const data = (last.notification.request.content.data || {}) as Record<string, string>;
    if (data.screen === 'trips') router.push('/trips');
  }, [last, router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
