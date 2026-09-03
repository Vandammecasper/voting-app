import * as SystemUI from 'expo-system-ui';

import { Colors } from '@/constants/theme';

/** Window / root color drawn behind the transparent Android system bars. */
export const rootBackgroundColor = Colors.background;

/**
 * JS StatusBar props for edge-to-edge Android.
 * Do not set `backgroundColor` — it is ignored on Android 15+ and shows up as a black bar.
 */
export const statusBarProps = {
  style: 'light',
  translucent: true,
} as const;

export const rootStackScreenOptions = {
  contentStyle: { backgroundColor: rootBackgroundColor },
  statusBarStyle: 'light',
  statusBarTranslucent: true,
  navigationBarTranslucent: true,
} as const;

export function applyRootBackground() {
  return SystemUI.setBackgroundColorAsync(rootBackgroundColor);
}
