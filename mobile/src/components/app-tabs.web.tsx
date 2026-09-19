/**
 * The web tab bar: a full-width sheet of paper across the top, closed by a hairline rule, with the
 * serif wordmark on the left and the section names running along it. The chosen one is marked by an
 * oxblood underline sitting on that rule — the same tab row as the web app. Screens reserve the
 * space with TopTabInset. See constants/theme.ts.
 */
import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';

import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="search" href="/search" asChild>
            <TabButton>Find Flights</TabButton>
          </TabTrigger>
          <TabTrigger name="rights" href="/rights" asChild>
            <TabButton>Your Rights</TabButton>
          </TabTrigger>
          <TabTrigger name="owed" href="/owed" asChild>
            <TabButton>Get Paid</TabButton>
          </TabTrigger>
          <TabTrigger name="moves" href="/moves" asChild>
            <TabButton>Moves</TabButton>
          </TabTrigger>
          <TabTrigger name="trips" href="/trips" asChild>
            <TabButton>My Trips</TabButton>
          </TabTrigger>
          <TabTrigger name="crisis" href="/crisis" asChild>
            <TabButton>Right Now</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const theme = useTheme();

  return (
    // The anchor expo-router renders on web does not inherit the Pressable's layout, so the
    // padding and the underline live on the inner view and only the pressed state stays here.
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View style={[styles.tabButtonView, { borderBottomColor: isFocused ? theme.bad : 'transparent' }]}>
        <ThemedText
          type="small"
          style={[isFocused ? styles.tabLabelActive : styles.tabLabel, { color: isFocused ? theme.text : theme.textSecondary }]}>
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const theme = useTheme();

  return (
    <View {...props} style={[styles.tabListContainer, { backgroundColor: theme.card, borderBottomColor: theme.line }]}>
      <View style={styles.innerContainer}>
        <ThemedText style={styles.brandText}>Fairfare</ThemedText>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  innerContainer: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexDirection: 'row',
    // Stretch, so each tab's underline lands on the bar's own bottom rule.
    alignItems: 'stretch',
    gap: Spacing.three,
  },
  brandText: {
    fontFamily: Fonts.serif,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    alignSelf: 'center',
    marginRight: 'auto',
  },
  pressed: { opacity: 0.75 },
  tabButtonView: {
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.half,
    borderBottomWidth: 2,
    marginBottom: -StyleSheet.hairlineWidth,
  },
  tabLabel: { fontWeight: '600' },
  tabLabelActive: { fontWeight: '700' },
});
