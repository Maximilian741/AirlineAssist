import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  // The chosen tab wears the solid accent — deep navy on paper, its light counterpart at night —
  // and every other tab is quiet secondary ink. Same two tones as the web app's tab row.
  const active = dark ? colors.brand : colors.brandDeep;

  return (
    <NativeTabs
      backgroundColor={colors.card}
      indicatorColor={colors.backgroundSelected}
      tintColor={active}
      // The bar's separator (a hairline rule on iOS), not a drop shadow: the system has none.
      shadowColor={colors.line}
      iconColor={{ default: colors.textSecondary, selected: active }}
      labelStyle={{
        default: { color: colors.textSecondary, fontWeight: '600' },
        selected: { color: active, fontWeight: '700' },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="airplane" md="flight" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Label>Find Flights</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="rights">
        <NativeTabs.Trigger.Label>Your Rights</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="checkmark.shield.fill" md="verified_user" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="owed">
        <NativeTabs.Trigger.Label>Get Paid</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="dollarsign.circle.fill" md="payments" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="moves">
        <NativeTabs.Trigger.Label>Moves</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="lightbulb.fill" md="lightbulb" />
      </NativeTabs.Trigger>

      {/* Registered but not in the bar — Android caps the bottom nav at 5. Reached from Home. */}
      <NativeTabs.Trigger name="trips" hidden>
        <NativeTabs.Trigger.Label>My Trips</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="crisis" hidden>
        <NativeTabs.Trigger.Label>Right Now</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
