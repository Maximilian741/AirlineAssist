import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundSelected}
      tintColor={colors.brand}
      labelStyle={{ selected: { color: colors.brand } }}>
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
