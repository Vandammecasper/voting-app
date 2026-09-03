import * as SystemUI from 'expo-system-ui';

import { Colors } from '@/constants/theme';

/** Window / root / Android system-bar color. Must match the app background. */
export const rootBackgroundColor = Colors.background;

/**
 * iOS StatusBar props. Do not mount expo-status-bar on Android — it forces a
 * transparent bar that falls back to the splash theme (a white strip).
 */
export const statusBarProps = {
  style: 'light',
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
